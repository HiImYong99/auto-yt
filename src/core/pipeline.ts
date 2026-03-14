import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { randomBytes } from 'crypto';
import { getChannelById } from './configManager';

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, 'pipeline.state.json');
const MAX_LOGS = 150;
const MAX_CONCURRENT = 3;

// ── 렌더링 진행률 추적 (10% 단위 필터링) ──────────────────
const lastRenderCheckpoint = new Map<string, number>();

function sanitizePath(s: string): string {
  return s.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, '_').slice(0, 50);
}

function parseTitleFromMetadata(metaPath: string): string {
  try {
    const text = fs.readFileSync(metaPath, 'utf-8');
    const m = text.match(/■\s*제목\s*\n([^\n]+)/);
    return m ? m[1].trim() : '';
  } catch { return ''; }
}

export interface PipelineState {
  jobId: string;
  channelId: string;
  channelName: string;
  youtubeUrl: string;
  status: 'scripting' | 'tts' | 'rendering' | 'uploading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  logs: string[];
  updatedAt: string;
  errorDetail?: string;
}

// ── 인메모리 상태 (SSE 소스) ───────────────────────────────
export const jobsMap = new Map<string, PipelineState>();

// ── 취소용 자식 프로세스 추적 ──────────────────────────────
const activeProcs = new Map<string, Set<child_process.ChildProcess>>();

// 서버 시작 시 이전 상태 복원
(function restoreFromFile() {
  if (!fs.existsSync(STATE_FILE)) return;
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    if (data.jobs && typeof data.jobs === 'object') {
      for (const [id, s] of Object.entries(data.jobs)) {
        const state = s as PipelineState;
        // 실행 중이던 잡은 서버 재시작으로 인해 중단됨 처리
        if (['scripting', 'tts', 'rendering', 'uploading'].includes(state.status)) {
          state.status = 'error';
          state.errorDetail = '서버 재시작으로 중단됨';
          state.updatedAt = new Date().toISOString();
        }
        jobsMap.set(id, state);
      }
    }
  } catch { /* 파일 형식이 다를 경우 무시 */ }
})();

function persistAll(): void {
  const jobs: Record<string, PipelineState> = {};
  for (const [id, s] of jobsMap) jobs[id] = s;
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ jobs }, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

function updateJob(jobId: string, patch: Partial<PipelineState>, appendLogs?: string[]): void {
  const cur = jobsMap.get(jobId);
  if (!cur) return;
  const logs = appendLogs ? [...cur.logs, ...appendLogs].slice(-MAX_LOGS) : cur.logs;
  jobsMap.set(jobId, { ...cur, ...patch, logs, updatedAt: new Date().toISOString() });
  persistAll();
}

function ts(): string {
  return new Date().toISOString().slice(11, 19);
}

function jobLog(jobId: string, msg: string): void {
  const line = `[${ts()}] ${msg}`;
  console.log(`[${jobId}] ${line}`);
  updateJob(jobId, {}, [line]);
}

// ── Public API ─────────────────────────────────────────────

export function getActiveCount(): number {
  const busy = new Set(['scripting', 'tts', 'rendering', 'uploading']);
  let n = 0;
  for (const s of jobsMap.values()) if (busy.has(s.status)) n++;
  return n;
}

export function cancelJob(jobId: string): void {
  const procs = activeProcs.get(jobId);
  if (procs) {
    for (const p of procs) { try { p.kill('SIGTERM'); } catch { /* ignore */ } }
    activeProcs.delete(jobId);
  }
  updateJob(jobId, { status: 'cancelled', errorDetail: '사용자가 취소함' });
}

export function clearJob(jobId: string): void {
  jobsMap.delete(jobId);
  persistAll();
}

// ── 내부 헬퍼 ──────────────────────────────────────────────

function copyFile(src: string, dest: string): void {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
}

function registerProc(jobId: string, proc: child_process.ChildProcess): void {
  if (!activeProcs.has(jobId)) activeProcs.set(jobId, new Set());
  activeProcs.get(jobId)!.add(proc);
}

function unregisterProc(jobId: string, proc: child_process.ChildProcess): void {
  activeProcs.get(jobId)?.delete(proc);
}

function isCancelled(jobId: string): boolean {
  const s = jobsMap.get(jobId);
  return s?.status === 'cancelled';
}

async function spawnPython(jobId: string, args: string[], stdinData?: string): Promise<string> {
  if (isCancelled(jobId)) throw new Error('취소됨');
  return new Promise((resolve, reject) => {
    const proc = child_process.spawn('python3', args, { cwd: ROOT, env: { ...process.env } });
    registerProc(jobId, proc);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      text.split('\n').filter((l) => l.trim()).forEach((l) => jobLog(jobId, l));
    });
    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      text.split('\n').filter((l) => l.trim()).forEach((l) => jobLog(jobId, `[err] ${l}`));
    });

    if (stdinData !== undefined) {
      proc.stdin.write(stdinData);
      proc.stdin.end();
    }

    proc.on('close', (code) => {
      unregisterProc(jobId, proc);
      if (isCancelled(jobId)) return reject(new Error('취소됨'));
      if (code !== 0) return reject(new Error(`Python 실패 (exit ${code}): ${stderr.slice(-300)}`));
      resolve(stdout);
    });
    proc.on('error', (e) => { unregisterProc(jobId, proc); reject(e); });
  });
}

const REMOTION_BIN = path.join(ROOT, 'node_modules', '.bin', 'remotion');

async function spawnRemotion(jobId: string, args: string[]): Promise<void> {
  if (isCancelled(jobId)) throw new Error('취소됨');
  return new Promise((resolve, reject) => {
    const proc = child_process.spawn(REMOTION_BIN, args, { cwd: ROOT, env: { ...process.env } });
    registerProc(jobId, proc);

    proc.stdout.on('data', (data: Buffer) => {
      data.toString().split('\n').filter((l) => l.trim()).forEach((l) => {
        // "Encoded X/Y" 라인을 10% 단위로 필터링
        const enc = l.match(/^Encoded (\d+)\/(\d+)/);
        if (enc) {
          const pct = Math.round(parseInt(enc[1]) / parseInt(enc[2]) * 100);
          const checkpoint = Math.floor(pct / 10) * 10;
          const prev = lastRenderCheckpoint.get(jobId) ?? -1;
          if (checkpoint > prev || pct >= 100) {
            lastRenderCheckpoint.set(jobId, checkpoint);
            const renderPct = Math.min(pct, 100);
            jobLog(jobId, `렌더링 ${renderPct}%`);
            updateJob(jobId, { progress: 60 + Math.round(renderPct / 100 * 17) });
          }
          return;
        }
        jobLog(jobId, l);
      });
    });
    proc.stderr.on('data', (data: Buffer) =>
      data.toString().split('\n').filter((l) => l.trim()).forEach((l) => jobLog(jobId, `[err] ${l}`)));

    proc.on('close', (code) => {
      unregisterProc(jobId, proc);
      if (isCancelled(jobId)) return reject(new Error('취소됨'));
      if (code !== 0) return reject(new Error(`remotion ${args[0]} 실패 (exit ${code})`));
      resolve();
    });
    proc.on('error', (e) => { unregisterProc(jobId, proc); reject(e); });
  });
}

function writeThumbnailData(metaPath: string): void {
  try {
    const text = fs.readFileSync(metaPath, 'utf-8');
    const titleMatch = text.match(/■\s*제목\s*\n\[?([^\]\n]+)\]?/);
    const fullTitle = titleMatch ? titleMatch[1].trim() : '';
    const parts = fullTitle.split('|').map((s) => s.trim());
    const line1 = parts[0] ?? fullTitle;
    const line2 = parts[1] ?? '';
    const emojiMap: [RegExp, string][] = [
      [/AI|인공지능|GPT|클로드|제미나이/i, '🤖'],
      [/돈|수익|창업|비즈니스|사업/i, '💰'],
      [/코딩|개발|프로그래밍/i, '💻'],
      [/건강|다이어트|운동/i, '💪'],
      [/공부|학습|성장/i, '📚'],
    ];
    const emoji = emojiMap.find(([re]) => re.test(fullTitle))?.[1] ?? '🚀';
    const thumbnailDataPath = path.join(ROOT, 'src', 'data', 'thumbnail_data.json');
    fs.writeFileSync(thumbnailDataPath, JSON.stringify({ line1, line2, emoji }, null, 2), 'utf-8');
  } catch { /* 실패해도 기존 thumbnail_data.json 유지 */ }
}

// ── 파이프라인 진입점 ──────────────────────────────────────

export async function runPipeline(
  channelId: string,
  youtubeUrl: string,
  jobId?: string
): Promise<void> {
  if (getActiveCount() >= MAX_CONCURRENT) throw new Error(`최대 ${MAX_CONCURRENT}개 동시 실행 가능합니다.`);

  const channel = getChannelById(channelId);
  const id = jobId ?? randomBytes(4).toString('hex');
  let outputDir = path.join(ROOT, 'output', `.tmp_${id}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // 잡 초기화
  jobsMap.set(id, {
    jobId: id,
    channelId,
    channelName: channel.channelName,
    youtubeUrl,
    status: 'scripting',
    progress: 5,
    logs: [`[${ts()}] 파이프라인 시작 — ${channel.channelName}`],
    updatedAt: new Date().toISOString(),
  });
  persistAll();

  try {
    // 1. 트랜스크립트
    jobLog(id, '1/6  트랜스크립트 추출 중...');
    updateJob(id, { progress: 10 });
    const transcript = await spawnPython(id, ['scripts/extract_transcript.py', youtubeUrl]);

    // 2. 대본 생성
    jobLog(id, '2/6  대본 생성 중 (Gemini)...');
    updateJob(id, { progress: 20 });
    const scriptArgs = ['scripts/generate_script.py', '--output-dir', outputDir];
    if (channel.systemPrompt) scriptArgs.push('--system-prompt', channel.systemPrompt);
    await spawnPython(id, scriptArgs, transcript);

    // 출력 디렉토리 이름 확정: output/{channelName}/{YYYYMMDD}_{title}/
    const metaForTitle = path.join(outputDir, 'youtube_metadata.txt');
    const rawTitle = parseTitleFromMetadata(metaForTitle);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const titleSlug = sanitizePath(rawTitle) || id;
    const finalDir = path.join(ROOT, 'output', sanitizePath(channel.channelName), `${dateStr}_${titleSlug}`);
    fs.mkdirSync(path.dirname(finalDir), { recursive: true });
    fs.renameSync(outputDir, finalDir);
    outputDir = finalDir;

    copyFile(path.join(outputDir, 'vibe.txt'), path.join(ROOT, 'vibe.txt'));

    // thumbnail_data.json 생성 (Thumbnail 컴포지션용)
    writeThumbnailData(path.join(outputDir, 'youtube_metadata.txt'));

    // 3. 씬 플랜
    jobLog(id, '3/6  씬 플랜 생성 중 (Gemini)...');
    updateJob(id, { progress: 35 });
    await spawnPython(id, [
      'scripts/generate_scene_plan.py',
      '--vibe-file', path.join(outputDir, 'vibe.txt'),
      '--output', path.join(outputDir, 'scene_plan.json'),
    ]);
    copyFile(path.join(outputDir, 'scene_plan.json'), path.join(ROOT, 'src', 'data', 'scene_plan.json'));

    // 4. TTS
    jobLog(id, '4/6  TTS 생성 중 (ElevenLabs)...');
    updateJob(id, { status: 'tts', progress: 45 });
    await spawnPython(id, [
      'scripts/generate_audio.py', '--force',
      '--voice-id', channel.voiceId,
      '--script-file', path.join(outputDir, 'vibe.txt'),
      '--audio-out', path.join(outputDir, 'audio.mp3'),
      '--sync-out', path.join(outputDir, 'sync_data.json'),
    ]);
    copyFile(path.join(outputDir, 'audio.mp3'), path.join(ROOT, 'public', 'audio.mp3'));
    copyFile(path.join(outputDir, 'sync_data.json'), path.join(ROOT, 'src', 'data', 'sync_data.json'));

    // 5. 렌더링
    jobLog(id, '5/6  영상 렌더 중 (Remotion)...');
    updateJob(id, { status: 'rendering', progress: 60 });
    const videoOut = path.join(outputDir, 'video.mp4');
    const thumbOut = path.join(outputDir, 'thumbnail.png');
    await spawnRemotion(id, ['render', 'src/index.ts', 'MainVideo', videoOut]);
    lastRenderCheckpoint.delete(id);
    await spawnRemotion(id, ['still', 'src/index.ts', 'Thumbnail', thumbOut, '--frame=0']);

    // 6. 업로드
    jobLog(id, '6/6  YouTube 업로드 중...');
    updateJob(id, { status: 'uploading', progress: 85 });
    const metaPath = path.join(outputDir, 'youtube_metadata.txt');
    if (!fs.existsSync(metaPath)) {
      const fallback = path.join(ROOT, 'youtube_metadata.txt');
      if (fs.existsSync(fallback)) copyFile(fallback, metaPath);
    }
    const uploadArgs = [
      'scripts/upload_youtube.py',
      '--token-path', channel.youtubeAuthTokenPath,
      '--video-path', path.join(outputDir, 'video.mp4'),
    ];
    if (fs.existsSync(path.join(outputDir, 'thumbnail.png')))
      uploadArgs.push('--thumb-path', path.join(outputDir, 'thumbnail.png'));
    if (fs.existsSync(metaPath))
      uploadArgs.push('--metadata-path', metaPath);
    await spawnPython(id, uploadArgs);

    jobLog(id, '✓ 파이프라인 완료!');
    updateJob(id, { status: 'completed', progress: 100 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!isCancelled(id)) {
      jobLog(id, `[ERROR] ${msg}`);
      updateJob(id, { status: 'error', errorDetail: msg });
    }
    throw err;
  } finally {
    lastRenderCheckpoint.delete(id);
  }
}

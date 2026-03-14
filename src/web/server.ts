import express from 'express';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { getAllChannels } from '../core/configManager';
import { jobsMap, runPipeline, cancelJob, clearJob, getActiveCount } from '../core/pipeline';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/channels
app.get('/api/channels', (_req, res) => {
  try {
    res.json(getAllChannels().map((c) => ({ channelId: c.channelId, channelName: c.channelName })));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /api/state — 현재 모든 잡 상태 (one-shot)
app.get('/api/state', (_req, res) => {
  const jobs: Record<string, unknown> = {};
  for (const [id, s] of jobsMap) jobs[id] = s;
  res.json({ jobs });
});

// POST /api/start
app.post('/api/start', (req, res) => {
  const { channelId, youtubeUrl } = req.body as { channelId?: string; youtubeUrl?: string };
  if (!channelId || !youtubeUrl) {
    res.status(400).json({ error: 'channelId와 youtubeUrl이 필요합니다.' });
    return;
  }
  if (getActiveCount() >= 3) {
    res.status(409).json({ error: '최대 3개 동시 실행 중입니다. 완료 후 다시 시도하세요.' });
    return;
  }

  const jobId = randomBytes(4).toString('hex');
  res.json({ jobId });

  runPipeline(channelId, youtubeUrl, jobId).catch((err: unknown) => {
    console.error(`[${jobId}] 파이프라인 오류:`, err instanceof Error ? err.message : err);
  });
});

// POST /api/cancel  { jobId }
app.post('/api/cancel', (req, res) => {
  const { jobId } = req.body as { jobId?: string };
  if (!jobId) { res.status(400).json({ error: 'jobId 필요' }); return; }
  cancelJob(jobId);
  res.json({ ok: true });
});

// POST /api/clear  { jobId }
app.post('/api/clear', (req, res) => {
  const { jobId } = req.body as { jobId?: string };
  if (!jobId) { res.status(400).json({ error: 'jobId 필요' }); return; }
  clearJob(jobId);
  res.json({ ok: true });
});

// GET /api/events — SSE (인메모리 직접 읽기, 파일 I/O 없음)
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = () => {
    const jobs: Record<string, unknown> = {};
    for (const [id, s] of jobsMap) jobs[id] = s;
    res.write(`data: ${JSON.stringify({ jobs })}\n\n`);
  };

  send();
  const timer = setInterval(send, 800);
  req.on('close', () => clearInterval(timer));
});

app.listen(PORT, () => {
  console.log(`웹 대시보드: http://localhost:${PORT}`);
});

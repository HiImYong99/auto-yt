#!/usr/bin/env ts-node
import * as readline from 'readline';
import { randomBytes } from 'crypto';
import { getAllChannels } from '../core/configManager';
import { runPipeline, initState } from '../core/pipeline';

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main(): Promise<void> {
  console.log('='.repeat(52));
  console.log('  auto-yt  다중 채널 파이프라인  (CLI)');
  console.log('='.repeat(52));

  try {
    const channels = getAllChannels();
    if (channels.length === 0) {
      throw new Error('channels.config.json에 채널이 없습니다. 먼저 채널을 추가하세요.');
    }

    // ── 채널 선택 ─────────────────────────────────────
    console.log('\n채널을 선택하세요:');
    channels.forEach((ch, i) => {
      console.log(`  [${i + 1}] ${ch.channelName}  (${ch.channelId})`);
    });

    const numAns = await ask(`\n번호 입력 (1-${channels.length}): `);
    const idx = parseInt(numAns, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= channels.length) {
      throw new Error(`유효하지 않은 선택: ${numAns}`);
    }
    const channel = channels[idx];

    // ── URL 입력 ──────────────────────────────────────
    const youtubeUrl = await ask('\nYouTube URL을 입력하세요: ');
    if (!youtubeUrl) throw new Error('URL이 입력되지 않았습니다.');

    // ── 확인 ──────────────────────────────────────────
    console.log(`\n  채널  : ${channel.channelName}`);
    console.log(`  URL   : ${youtubeUrl}`);
    const confirm = await ask('\n시작하시겠습니까? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('취소되었습니다.');
      process.exit(0);
    }

    const jobId = randomBytes(4).toString('hex');
    console.log(`\n작업 ID: ${jobId}`);

    initState();
    await runPipeline(channel.channelId, youtubeUrl, jobId);

    console.log('\n' + '='.repeat(52));
    console.log(`  완료!  output/${channel.channelId}_${jobId}/`);
    console.log('='.repeat(52));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n오류: ${msg}`);
    process.exit(1);
  }
}

main();

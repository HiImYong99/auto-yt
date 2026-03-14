import * as fs from 'fs';
import * as path from 'path';

export interface ChannelConfig {
  channelId: string;
  channelName: string;
  voiceId: string;
  youtubeAuthTokenPath: string;
  systemPrompt?: string;
}

export interface ChannelsConfig {
  channels: ChannelConfig[];
}

const CONFIG_FILE = path.join(process.cwd(), 'channels.config.json');

const DEFAULT_CONFIG: ChannelsConfig = {
  channels: [
    {
      channelId: 'my_channel_01',
      channelName: '내 채널 (예시 - 수정 필요)',
      voiceId: 'YOUR_ELEVENLABS_VOICE_ID',
      youtubeAuthTokenPath: './token.json',
      systemPrompt: '',
    },
  ],
};

function validateConfig(config: ChannelsConfig): void {
  if (!config.channels || !Array.isArray(config.channels)) {
    throw new Error('channels.config.json: "channels" 배열이 없습니다.');
  }
  for (const ch of config.channels) {
    if (!ch.channelId) throw new Error(`채널에 channelId가 없습니다: ${JSON.stringify(ch)}`);
    if (!ch.channelName) throw new Error(`채널 ${ch.channelId}에 channelName이 없습니다.`);
    if (!ch.voiceId) throw new Error(`채널 ${ch.channelId}에 voiceId가 없습니다.`);
    if (!ch.youtubeAuthTokenPath) throw new Error(`채널 ${ch.channelId}에 youtubeAuthTokenPath가 없습니다.`);
  }
}

export function loadConfig(): ChannelsConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`channels.config.json이 없습니다. 기본 템플릿을 생성합니다: ${CONFIG_FILE}`);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    return DEFAULT_CONFIG;
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const config = JSON.parse(raw) as ChannelsConfig;
  validateConfig(config);
  return config;
}

export function getAllChannels(): ChannelConfig[] {
  return loadConfig().channels;
}

export function getChannelById(channelId: string): ChannelConfig {
  const config = loadConfig();
  const channel = config.channels.find((c) => c.channelId === channelId);
  if (!channel) {
    throw new Error(`채널을 찾을 수 없습니다: ${channelId}`);
  }
  return channel;
}

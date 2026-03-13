export interface WordData {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface SentenceData {
  id: number;
  text: string;
  start_ms: number;
  end_ms: number;
  words: WordData[];
}

export interface SyncData {
  duration_ms: number;
  sentences: SentenceData[];
}

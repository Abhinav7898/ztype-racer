export type CategoryKey = "webdev" | "cyber" | "scifi" | "common";
export type DifficultyKey = "easy" | "normal" | "hard";
export type GameModeKey = "standard" | "boss_rush";

export interface WordCategories {
  short: string[];
  medium: string[];
  long: string[];
  bossPhrases: string[];
}

export interface WaveConfig {
  enemyCount: number;
  spawnDelay: number;
  baseSpeed: number;
  category: CategoryKey;
  isBossWave: boolean;
}

export interface WaveClearStats {
  clearedWave: number;
  waveScore: number;
  totalScore: number;
  accuracy: number;
  wpm: number;
  isBoss: boolean;
}
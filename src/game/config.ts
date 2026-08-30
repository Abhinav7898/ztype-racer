import webdevDict from "../data/webdev.json";
import cyberDict from "../data/cyber.json";
import scifiDict from "../data/scifi.json";
import commonDict from "../data/common.json";

export type CategoryKey = "webdev" | "cyber" | "scifi" | "common";
export type DifficultyKey = "easy" | "normal" | "hard";
export type GameModeKey = "standard" | "boss_rush";

export interface WordCategories {
  short: string[];
  medium: string[];
  long: string[];
  bossPhrases: string[];
}

export const DICTIONARIES: Record<CategoryKey, WordCategories> = {
  webdev: webdevDict,
  cyber: cyberDict,
  scifi: scifiDict,
  common: commonDict
};

export interface WaveConfig {
  enemyCount: number;
  spawnDelay: number;
  baseSpeed: number;
  category: CategoryKey;
  isBossWave: boolean;
}

export const getWaveConfig = (
  waveNumber: number,
  category: CategoryKey = "webdev",
  difficulty: DifficultyKey = "normal",
  mode: GameModeKey = "standard"
): WaveConfig => {
  // In Boss Rush mode, EVERY wave is a Mothership boss encounter
  const isBossWave = mode === "boss_rush" ? true : waveNumber % 3 === 0;

  const diffMultiplier = {
    easy: { speed: 0.75, spawnDelay: 1.25, enemyCount: 0.8 },
    normal: { speed: 1.0, spawnDelay: 1.0, enemyCount: 1.0 },
    hard: { speed: 1.35, spawnDelay: 0.75, enemyCount: 1.3 }
  }[difficulty];

  const rawCount = isBossWave ? 1 : Math.round((3 + waveNumber * 2) * diffMultiplier.enemyCount);
  const rawSpeed = (0.28 + Math.min(waveNumber * 0.045, 1.1)) * diffMultiplier.speed;
  const rawDelay = Math.max((2200 - waveNumber * 100) * diffMultiplier.spawnDelay, 600);

  return {
    enemyCount: Math.max(1, rawCount),
    spawnDelay: rawDelay,
    baseSpeed: rawSpeed,
    category,
    isBossWave
  };
};
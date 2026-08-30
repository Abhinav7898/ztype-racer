import React from "react";
import type { GameModeKey } from "../types/game";

interface GameOverModalProps {
  playerName: string;
  mode: GameModeKey;
  wave: number;
  score: number;
  highScore: number;
  accuracy: number;
  wpm: number;
  problemKeys: string[];
  onPlayAgain: () => void;
  onChangeSetup: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  playerName,
  mode,
  wave,
  score,
  highScore,
  accuracy,
  wpm,
  problemKeys,
  onPlayAgain,
  onChangeSetup,
}) => {
  return (
    <div className="game-modal-overlay">
      <div className="game-modal">
        <h1 className="game-over-title">GAME OVER</h1>
        <p className="final-score">
          {mode === "boss_rush" ? "MOTHERSHIPS DEFEATED" : "SURVIVED UNTIL WAVE"}: {wave}
        </p>
        <p className="final-score">
          FINAL SCORE: {score} (BEST: {highScore})
        </p>

        <div className="analytics-box">
          <div className="analytic-item">
            PILOT: <span>{playerName}</span>
          </div>
          <div className="analytic-item">
            MODE: <span>{mode === "boss_rush" ? "MOTHERSHIP RUSH" : "STANDARD CAMPAIGN"}</span>
          </div>
          <div className="analytic-item">
            ACCURACY: <span>{accuracy}%</span>
          </div>
          <div className="analytic-item">
            AVERAGE SPEED: <span>{wpm} WPM</span>
          </div>
          {problemKeys.length > 0 && (
            <div className="analytic-item">
              PROBLEM KEYS: <span className="problem-keys">{problemKeys.join(", ")}</span>
            </div>
          )}
        </div>

        <div className="game-over-actions">
          <button className="game-btn" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
          <button className="game-btn-secondary" onClick={onChangeSetup}>
            CHANGE SETUP
          </button>
        </div>
      </div>
    </div>
  );
};
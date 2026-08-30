import React from "react";
import type { CategoryKey, DifficultyKey, GameModeKey } from "../types/game";

interface StartModalProps {
  playerName: string;
  setPlayerName: (val: string) => void;
  category: CategoryKey;
  setCategory: (val: CategoryKey) => void;
  difficulty: DifficultyKey;
  setDifficulty: (val: DifficultyKey) => void;
  mode: GameModeKey;
  setMode: (val: GameModeKey) => void;
  onStart: () => void;
}

export const StartModal: React.FC<StartModalProps> = ({
  playerName,
  setPlayerName,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  mode,
  setMode,
  onStart,
}) => {
  return (
    <div className="game-modal-overlay">
      <div className="game-modal start-modal">
        <h1 className="game-title">ZTYPE RACER</h1>
        <p className="game-subtitle">TYPE FAST. DEFEND THE GALAXY.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStart();
          }}
          autoComplete="off"
        >
          <div className="setup-group">
            <label className="setup-label">PILOT CALLSIGN</label>
            <input
              type="text"
              className="setup-input"
              maxLength={12}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              placeholder="ENTER CALLSIGN..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              id="pilot_callsign_field"
            />
          </div>

          <div className="setup-group">
            <label className="setup-label">MISSION MODE</label>
            <div className="button-group mode-group">
              <button
                type="button"
                className={`choice-btn ${mode === "standard" ? "choice-active" : ""}`}
                onClick={() => setMode("standard")}
              >
                STANDARD CAMPAIGN
              </button>
              <button
                type="button"
                className={`choice-btn boss-mode-btn ${mode === "boss_rush" ? "choice-active-boss" : ""}`}
                onClick={() => setMode("boss_rush")}
              >
                🔥 MOTHERSHIP RUSH
              </button>
            </div>
          </div>

          <div className="setup-group">
            <label className="setup-label">WORD PACKAGE</label>
            <div className="button-group">
              {(["webdev", "cyber", "scifi", "common"] as CategoryKey[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`choice-btn ${category === cat ? "choice-active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-group">
            <label className="setup-label">DIFFICULTY LEVEL</label>
            <div className="button-group">
              {(["easy", "normal", "hard"] as DifficultyKey[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`choice-btn ${difficulty === diff ? "choice-active" : ""}`}
                  onClick={() => setDifficulty(diff)}
                >
                  {diff.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="game-btn start-btn">
            LAUNCH MISSION
          </button>
        </form>
      </div>
    </div>
  );
};
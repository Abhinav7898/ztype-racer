import React, { useState } from "react";
import type { GameModeKey } from "../types/game";

interface HUDProps {
  playerName: string;
  score: number;
  highScore: number;
  accuracy: number;
  wpm: number;
  streak: number;
  wave: number;
  multiplier: number;
  bombs: number;
  lives: number;
  isMuted: boolean;
  mode: GameModeKey;
  toggleSound: () => void;
  onEmpClick: () => void;
  onPauseClick: () => void;
  onRestartClick?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerName,
  score,
  highScore,
  accuracy,
  wpm,
  streak,
  wave,
  multiplier,
  bombs,
  lives,
  isMuted,
  mode,
  toggleSound,
  onEmpClick,
  onPauseClick,
  onRestartClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  return (
    <header className="game-hud">
      {/* 1. Left: Score */}
      <div className="hud-col hud-left-col">
        <div className="hud-score-sub desktop-only">
          {playerName.toUpperCase()} {mode === "boss_rush" ? "[BOSS]" : ""} | HI: {highScore}
        </div>
        <div className="hud-score-val">{score}</div>
      </div>

      {/* 2. Middle Stats (Desktop Only) */}
      <div className="hud-col hud-center-stats desktop-only">
        <span className="hud-label">ACC:</span>
        <span className="hud-acc-val">{accuracy}%</span>
        <span className="hud-divider">|</span>
        <span className="hud-label">WPM:</span>
        <span className="hud-acc-val">{wpm}</span>
        <span className="hud-divider">|</span>
        <span className="hud-label">STREAK:</span>
        <span className="hud-streak-val">{streak}</span>
      </div>

      {/* 3. Center: Wave Indicator */}
      <div className="hud-col hud-center-col">
        <div className="hud-wave-wrapper">
          <span className="hud-wave-text">WAVE {wave}</span>
          {multiplier > 1 && (
            <span className="hud-multiplier-pill animate-pulse">
              {multiplier}X
            </span>
          )}
        </div>
        <button className="hud-pause-btn desktop-only" onClick={onPauseClick}>
          [ESC] PAUSE
        </button>
      </div>

      {/* 4. Desktop EMP Box */}
      <div className="hud-col hud-emp-box desktop-only" onClick={onEmpClick}>
        <span className="hud-emp-title">PLASMA BLAST [SPACE]</span>
        <div className="hud-emp-icons">
          {Array.from({ length: 3 }).map((_, index) => (
            <span
              key={index}
              className={`bomb-icon ${index < bombs ? "bomb-active" : "bomb-empty"}`}
            >
              ⚡
            </span>
          ))}
        </div>
      </div>

      {/* 5. Right: Lives on Top, Settings Button Directly Below */}
      <div className="hud-col hud-right-col">
        <div className="hud-lives-row">
          {Array.from({ length: 3 }).map((_, index) => (
            <span
              key={index}
              className={`heart ${index < lives ? "heart-active" : "heart-empty"}`}
            >
              ❤️
            </span>
          ))}
        </div>

        {/* Desktop Sound Button */}
        <button className="sound-toggle-btn desktop-only" onClick={toggleSound}>
          {isMuted ? "🔇 SOUND OFF" : "🔊 SOUND ON"}
        </button>

        {/* Mobile Settings Button (Positioned cleanly under lives) */}
        <button
          className="mobile-opt-btn mobile-only"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          ⚙️ OPTIONS
        </button>

        {/* Mobile Dropdown Popover */}
        {isMobileMenuOpen && (
          <div className="mobile-dropdown-menu">
            <button
              className="dropdown-item"
              onClick={() => {
                toggleSound();
                setIsMobileMenuOpen(false);
              }}
            >
              {isMuted ? "🔊 UNMUTE AUDIO" : "🔇 MUTE AUDIO"}
            </button>
            <button
              className="dropdown-item"
              onClick={() => {
                onPauseClick();
                setIsMobileMenuOpen(false);
              }}
            >
              ⏸️ PAUSE GAME
            </button>
            {onRestartClick && (
              <button
                className="dropdown-item danger-item"
                onClick={() => {
                  onRestartClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                🔄 RESTART MISSION
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
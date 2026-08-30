import React, { useState, useEffect, useRef } from "react";
import { GameCanvas } from "./components/GameCanvas";
import type { GameCanvasHandles } from "./components/GameCanvas";
import { HUD } from "./components/HUD";
import { StartModal } from "./components/StartModal";
import { PauseModal } from "./components/PauseModal";
import { GameOverModal } from "./components/GameOverModal";
import { OnScreenKeyboard } from "./components/OnScreenKeyboard";
import { sounds } from "./game/SoundManager";
import type { CategoryKey, DifficultyKey, GameModeKey } from "./types/game";
import "./App.css";

export const App: React.FC = () => {
  const canvasHandlesRef = useRef<GameCanvasHandles | null>(null);

  // Auto-detect touch / mobile view
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  });

  useEffect(() => {
    const checkView = () => {
      setIsMobileView(
        window.innerWidth <= 768 ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0,
      );
    };
    window.addEventListener("resize", checkView);
    return () => window.removeEventListener("resize", checkView);
  }, []);

  // Configuration Setup
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem("ztype_pilot_name") || "PILOT";
  });
  const [category, setCategory] = useState<CategoryKey>("webdev");
  const [difficulty, setDifficulty] = useState<DifficultyKey>("normal");
  const [mode, setMode] = useState<GameModeKey>("standard");
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  // Runtime Stats
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem("ztype_high_score") || "0", 10);
  });
  const [lives, setLives] = useState<number>(3);
  const [wave, setWave] = useState<number>(1);
  const [bombs, setBombs] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [wpm, setWpm] = useState<number>(0);
  const [mistakeKeys, setMistakeKeys] = useState<Record<string, number>>({});

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);

  // Desktop physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameStarted || isGameOver || isPaused) return;

      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        canvasHandlesRef.current?.triggerEmp();
        return;
      }

      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        canvasHandlesRef.current?.fireInput(char);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameStarted, isGameOver, isPaused]);

  const handleMistakeKey = (key: string) => {
    setMistakeKeys((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("ztype_high_score", score.toString());
    }
  }, [score, highScore]);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const startGame = () => {
    const validName = playerName.trim() || "PILOT";
    setPlayerName(validName);
    localStorage.setItem("ztype_pilot_name", validName);

    setScore(0);
    setLives(3);
    setWave(1);
    setBombs(1);
    setMultiplier(1);
    setStreak(0);
    setAccuracy(100);
    setWpm(0);
    setMistakeKeys({});
    setIsGameOver(false);
    setIsPaused(false);
    setIsGameStarted(true);
    setGameKey((prev) => prev + 1);
  };

  const returnToSetup = () => {
    setIsGameStarted(false);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const problemKeys = Object.entries(mistakeKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k);

  return (
    <div
      className={`game-container ${isMobileView ? "layout-mobile" : "layout-desktop"}`}
    >
      {/* 1. HUD Header */}
      {isGameStarted && (
        <HUD
          playerName={playerName}
          score={score}
          highScore={highScore}
          accuracy={accuracy}
          wpm={wpm}
          streak={streak}
          wave={wave}
          multiplier={multiplier}
          bombs={bombs}
          lives={lives}
          isMuted={isMuted}
          mode={mode}
          toggleSound={toggleSound}
          onEmpClick={() => canvasHandlesRef.current?.triggerEmp()}
          onPauseClick={() => setIsPaused(true)}
          onRestartClick={startGame}
        />
      )}

      {/* Main Playfield Arena */}
      <div className="game-playfield">
        <GameCanvas
          ref={canvasHandlesRef}
          key={gameKey}
          score={score}
          setScore={setScore}
          lives={lives}
          setLives={setLives}
          wave={wave}
          setWave={setWave}
          bombs={bombs}
          setBombs={setBombs}
          multiplier={multiplier}
          setMultiplier={setMultiplier}
          streak={streak}
          setStreak={setStreak}
          accuracy={accuracy}
          setAccuracy={setAccuracy}
          wpm={wpm}
          setWpm={setWpm}
          category={category}
          difficulty={difficulty}
          mode={mode}
          onMistakeKey={handleMistakeKey}
          isGameOver={isGameOver}
          setIsGameOver={setIsGameOver}
          isPaused={isPaused}
          isGameStarted={isGameStarted}
          isMobileView={isMobileView}
        />
      </div>

      {/* ZType Custom On-Screen Touch Keyboard (Mobile/Touch view) */}
      {isMobileView && isGameStarted && !isGameOver && !isPaused && (
        <OnScreenKeyboard
          onKeyPress={(char) => canvasHandlesRef.current?.fireInput(char)}
          onEmpClick={() => canvasHandlesRef.current?.triggerEmp()}
          bombs={bombs}
        />
      )}

      {/* Start Setup Modal */}
      {!isGameStarted && (
        <StartModal
          playerName={playerName}
          setPlayerName={setPlayerName}
          category={category}
          setCategory={setCategory}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          mode={mode}
          setMode={setMode}
          onStart={startGame}
        />
      )}

      {/* Pause Modal */}
      {isPaused && isGameStarted && !isGameOver && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onExitToSetup={returnToSetup}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          playerName={playerName}
          mode={mode}
          wave={wave}
          score={score}
          highScore={highScore}
          accuracy={accuracy}
          wpm={wpm}
          problemKeys={problemKeys}
          onPlayAgain={startGame}
          onChangeSetup={returnToSetup}
        />
      )}
    </div>
  );
};

export default App;

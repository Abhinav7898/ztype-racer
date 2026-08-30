import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { getWaveConfig, DICTIONARIES } from "../game/config";
import type { CategoryKey, DifficultyKey, GameModeKey } from "../types/game";
import { Enemy } from "../game/Enemy";
import { Bullet } from "../game/Bullet";
import { Explosion } from "../game/Explosion";
import { FloatingText } from "../game/FloatingText";
import { sounds } from "../game/SoundManager";

export interface GameCanvasHandles {
  fireInput: (key: string) => void;
  triggerEmp: () => void;
}

interface GameCanvasProps {
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  lives: number;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  wave: number;
  setWave: React.Dispatch<React.SetStateAction<number>>;
  isGameOver: boolean;
  setIsGameOver: (val: boolean) => void;
  isPaused: boolean;
  isGameStarted: boolean;
  isMobileView: boolean;
  bombs: number;
  setBombs: React.Dispatch<React.SetStateAction<number>>;
  multiplier: number;
  setMultiplier: React.Dispatch<React.SetStateAction<number>>;
  streak: number;
  setStreak: React.Dispatch<React.SetStateAction<number>>;
  accuracy: number;
  setAccuracy: React.Dispatch<React.SetStateAction<number>>;
  wpm: number;
  setWpm: React.Dispatch<React.SetStateAction<number>>;
  category: CategoryKey;
  difficulty: DifficultyKey;
  mode: GameModeKey;
  onMistakeKey: (char: string) => void;
}

export const GameCanvas = forwardRef<GameCanvasHandles, GameCanvasProps>(
  (
    {
      score,
      setScore,
      lives,
      setLives,
      wave,
      setWave,
      isGameOver,
      setIsGameOver,
      isPaused,
      isGameStarted,
      isMobileView,
      bombs,
      setBombs,
      multiplier,
      setMultiplier,
      setStreak,
      setAccuracy,
      setWpm,
      category,
      difficulty,
      mode,
      onMistakeKey,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const enemiesRef = useRef<Enemy[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const explosionsRef = useRef<Explosion[]>([]);
    const floatingTextsRef = useRef<FloatingText[]>([]);
    const targetEnemyRef = useRef<Enemy | null>(null);

    const spawnedCountRef = useRef<number>(0);
    const destroyedCountRef = useRef<number>(0);
    const lastSpawnTimeRef = useRef<number>(0);
    const waveTransitioningRef = useRef<boolean>(false);
    const waveStartScoreRef = useRef<number>(score);

    // 1. WAVE INTRO BANNER (3 seconds / 180 frames)
    const waveIntroBannerRef = useRef<{
      active: boolean;
      timer: number;
      alpha: number;
    }>({
      active: true,
      timer: 180,
      alpha: 1.0,
    });

    // 2. MOTHERSHIP INVASION ALERT BANNER (Occurs after Wave Intro)
    const bossAlertBannerRef = useRef<{
      active: boolean;
      timer: number;
      alpha: number;
      triggeredAudio: boolean;
    }>({
      active: false,
      timer: 180,
      alpha: 0,
      triggeredAudio: false,
    });

    // 3. WAVE CLEAR BANNER (3 seconds / 180 frames)
    const clearBannerRef = useRef<{
      active: boolean;
      alpha: number;
      timer: number;
      waveNum: number;
      gainedScore: number;
      acc: number;
      wpm: number;
      isBoss: boolean;
    }>({
      active: false,
      alpha: 0,
      timer: 0,
      waveNum: 1,
      gainedScore: 0,
      acc: 100,
      wpm: 0,
      isBoss: false,
    });

    const bossEnemyRef = useRef<Enemy | null>(null);
    const bossSwarmLaunchedRef = useRef<boolean>(false);
    const lastBossSentenceIndexRef = useRef<number>(-1);

    const freezeTimerRef = useRef<number>(0);
    const playerShieldRef = useRef<boolean>(false);

    const totalKeystrokesRef = useRef<number>(0);
    const correctKeystrokesRef = useRef<number>(0);
    const startTimeRef = useRef<number>(Date.now());
    const currentAccuracyRef = useRef<number>(100);
    const currentWpmRef = useRef<number>(0);

    const shakeIntensityRef = useRef<number>(0);
    const triggerShake = (intensity: number) => {
      shakeIntensityRef.current = Math.max(
        shakeIntensityRef.current,
        intensity,
      );
    };

    const empWaveRef = useRef<{
      active: boolean;
      radius: number;
      maxRadius: number;
      alpha: number;
    }>({
      active: false,
      radius: 0,
      maxRadius: 0,
      alpha: 0,
    });

    const starsRef = useRef<
      { x: number; y: number; size: number; speed: number }[]
    >([]);

    useEffect(() => {
      spawnedCountRef.current = 0;
      destroyedCountRef.current = 0;
      lastSpawnTimeRef.current = performance.now() + 1000;
      waveTransitioningRef.current = false;
      bossEnemyRef.current = null;
      bossSwarmLaunchedRef.current = false;
      waveStartScoreRef.current = score;

      // Start 3-second Wave Intro
      waveIntroBannerRef.current = {
        active: true,
        timer: 180,
        alpha: 1.0,
      };

      bossAlertBannerRef.current = {
        active: false,
        timer: 180,
        alpha: 0,
        triggeredAudio: false,
      };
    }, [wave]);

    const initStars = (width: number, height: number) => {
      const stars = [];
      for (let i = 0; i < 70; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.4,
          speed: Math.random() * 0.3 + 0.1,
        });
      }
      starsRef.current = stars;
    };

    const processKeyInput = (key: string) => {
      if (!isGameStarted || isGameOver || isPaused) return;

      totalKeystrokesRef.current++;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const playerX = canvas.width / 2;
      const playerY = canvas.height - 35;

      let matched = false;

      if (targetEnemyRef.current) {
        const target = targetEnemyRef.current;
        if (target.getNextChar() === key) {
          matched = true;
          target.matchChar(key);
          const isFinal = target.typedIndex >= target.word.length;

          sounds.playLaser(isFinal);
          triggerShake(1.8);
          bulletsRef.current.push(
            new Bullet(playerX, playerY, target, isFinal),
          );

          if (isFinal) {
            targetEnemyRef.current = null;
          }
        }
      } else {
        const candidates = enemiesRef.current
          .filter(
            (enemy) =>
              !enemy.isPendingDestruction && enemy.getNextChar() === key,
          )
          .sort((a, b) => b.y - a.y);

        if (candidates.length > 0) {
          matched = true;
          const selected = candidates[0];
          selected.isTargeted = true;
          targetEnemyRef.current = selected;

          sounds.playLock();
          selected.matchChar(key);
          const isFinal = selected.typedIndex >= selected.word.length;

          sounds.playLaser(isFinal);
          triggerShake(1.8);
          bulletsRef.current.push(
            new Bullet(playerX, playerY, selected, isFinal),
          );

          if (isFinal) {
            targetEnemyRef.current = null;
          }
        }
      }

      if (matched) {
        correctKeystrokesRef.current++;
        setStreak((prev) => {
          const nextStreak = prev + 1;
          const newMultiplier = Math.min(5, 1 + Math.floor(nextStreak / 10));
          setMultiplier(newMultiplier);
          return nextStreak;
        });
      } else {
        sounds.playMiss();
        onMistakeKey(key);
        setStreak(0);
        setMultiplier(1);
      }

      const calcAccuracy = Math.round(
        (correctKeystrokesRef.current / totalKeystrokesRef.current) * 100,
      );
      currentAccuracyRef.current = calcAccuracy;
      setAccuracy(calcAccuracy);

      const minutes = Math.max(
        0.1,
        (Date.now() - startTimeRef.current) / 60000,
      );
      const calculatedWpm = Math.round(
        correctKeystrokesRef.current / 5 / minutes,
      );
      currentWpmRef.current = calculatedWpm;
      setWpm(calculatedWpm);
    };

    const processEmpTrigger = () => {
      if (!isGameStarted || isGameOver || isPaused) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      if (bombs > 0 && enemiesRef.current.length > 0) {
        setBombs((prev) => Math.max(0, prev - 1));
        sounds.playEmp();
        triggerShake(24);

        empWaveRef.current = {
          active: true,
          radius: 10,
          maxRadius: Math.hypot(canvas.width, canvas.height),
          alpha: 1.0,
        };

        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          if (enemy.type !== "boss") {
            explosionsRef.current.push(new Explosion(enemy.x, enemy.y));
            floatingTextsRef.current.push(
              new FloatingText(
                enemy.x,
                enemy.y,
                `+${100 * multiplier}`,
                "#00ffff",
              ),
            );
            setScore((prev) => prev + 100 * multiplier);
            destroyedCountRef.current++;
            enemiesRef.current.splice(i, 1);
          }
        }

        bulletsRef.current = [];
        targetEnemyRef.current = null;
      }
    };

    useImperativeHandle(ref, () => ({
      fireInput: (key: string) => processKeyInput(key),
      triggerEmp: () => processEmpTrigger(),
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let animationFrameId: number;

      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (!parent) return;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        if (starsRef.current.length === 0) {
          initStars(canvas.width, canvas.height);
        }
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      const config = getWaveConfig(wave, category, difficulty, mode);
      const dict = DICTIONARIES[category] || DICTIONARIES.webdev;

      const getUniqueWord = (pool: string[]): string => {
        const activeWords = new Set(enemiesRef.current.map((e) => e.word));
        const available = pool.filter((w) => !activeWords.has(w.toUpperCase()));
        const source = available.length > 0 ? available : pool;
        return source[Math.floor(Math.random() * source.length)];
      };

      const spawnEnemy = () => {
        const isMobile = canvas.width < 500;
        const margin = isMobile ? 35 : 75;
        const usableWidth = canvas.width - margin * 2;
        const randomX = margin + Math.random() * usableWidth;

        const pool = wave >= 4 ? [...dict.short, ...dict.medium] : dict.short;

        // Multi-Phase Elite Enemy Spawn Probability based on wave & difficulty
        const diffChance =
          difficulty === "hard" ? 0.45 : difficulty === "normal" ? 0.3 : 0.15;
        const isElite = wave >= 2 && Math.random() < diffChance;

        if (isElite) {
          const word1 = getUniqueWord(dict.short);
          const word2 = getUniqueWord(dict.short);
          // Creates a 2-phase enemy that changes color when word1 is typed
          const enemy = new Enemy(
            [word1, word2],
            randomX,
            55,
            config.baseSpeed * 0.9,
            wave,
            "elite",
          );
          enemiesRef.current.push(enemy);
        } else {
          const word = getUniqueWord(pool);
          const enemy = new Enemy(word, randomX, 55, config.baseSpeed, wave);
          enemiesRef.current.push(enemy);
        }

        spawnedCountRef.current++;
      };

      const spawnMothership = () => {
        const phrases = dict.bossPhrases;
        let nextIndex = Math.floor(Math.random() * phrases.length);

        if (
          phrases.length > 1 &&
          nextIndex === lastBossSentenceIndexRef.current
        ) {
          nextIndex = (nextIndex + 1) % phrases.length;
        }
        lastBossSentenceIndexRef.current = nextIndex;

        const sentence = phrases[nextIndex];
        const boss = new Enemy(
          sentence,
          canvas.width / 2,
          50,
          config.baseSpeed,
          wave,
          "boss",
        );
        enemiesRef.current.push(boss);
        bossEnemyRef.current = boss;
        spawnedCountRef.current++;
      };

      const launchBossDroneSwarm = (boss: Enemy) => {
        const isMobile = canvas.width < 500;
        const baseCount =
          mode === "boss_rush"
            ? 4 + Math.floor(wave * 1.2)
            : 3 + Math.floor(wave / 3) * 2;
        const droneCount = Math.min(baseCount, isMobile ? 5 : 10);

        const diffMul = {
          easy: 0.75,
          normal: 1.0,
          hard: 1.35,
        }[difficulty];

        const speedFactor =
          mode === "boss_rush"
            ? 0.22 + Math.min(wave * 0.03, 0.45)
            : 0.22 + Math.min((wave / 3) * 0.045, 0.4);
        const droneSpeed = speedFactor * diffMul;
        const playerX = canvas.width / 2;
        const playerY = canvas.height - 35;

        const availableWidth = Math.min(canvas.width - 60, 680);
        const spacing = availableWidth / (droneCount - 1 || 1);
        const startX = canvas.width / 2 - availableWidth / 2;

        const usedSwarmWords = new Set<string>();
        const shuffledShort = [...dict.short].sort(() => Math.random() - 0.5);

        for (let i = 0; i < droneCount; i++) {
          const spawnX = startX + i * spacing;
          const arcY =
            boss.y + 35 + Math.sin((i / (droneCount - 1 || 1)) * Math.PI) * 18;
          const targetFanX = playerX + (i - (droneCount - 1) / 2) * 45;

          let chosenWord = shuffledShort.find(
            (w) => !usedSwarmWords.has(w.toUpperCase()),
          );

          if (!chosenWord) {
            chosenWord =
              dict.short[Math.floor(Math.random() * dict.short.length)];
          }
          usedSwarmWords.add(chosenWord.toUpperCase());

          const drone = new Enemy(
            chosenWord,
            spawnX,
            arcY,
            droneSpeed,
            wave,
            "drone_bullet",
            "none",
            targetFanX,
            playerY,
          );

          enemiesRef.current.push(drone);
        }

        boss.droneSwarmCount = droneCount;
      };

      const drawPlayer = (
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
      ) => {
        const isMobile = context.canvas.width < 500;
        const scale = isMobile ? 0.8 : 1.0;

        context.save();
        context.translate(x, y);

        let aimAngle = 0;
        if (targetEnemyRef.current) {
          const dx = targetEnemyRef.current.x - x;
          const dy = targetEnemyRef.current.y - y;
          aimAngle = Math.atan2(dy, dx) + Math.PI / 2;
        }
        context.rotate(aimAngle * 0.4);

        if (!isPaused && isGameStarted) {
          context.beginPath();
          context.moveTo(-4 * scale, 15 * scale);
          context.lineTo(0, (22 + Math.random() * 5) * scale);
          context.lineTo(4 * scale, 15 * scale);
          context.fillStyle = "#00f0ff";
          context.shadowBlur = 8 * scale;
          context.shadowColor = "#00f0ff";
          context.fill();
        }

        context.beginPath();
        context.moveTo(0, -20 * scale);
        context.lineTo(14 * scale, 14 * scale);
        context.lineTo(0, 9 * scale);
        context.lineTo(-14 * scale, 14 * scale);
        context.closePath();
        context.fillStyle = "#081020";
        context.strokeStyle = "#00e1ff";
        context.lineWidth = 2 * scale;
        context.shadowBlur = 10 * scale;
        context.shadowColor = "#00e1ff";
        context.fill();
        context.stroke();

        if (playerShieldRef.current) {
          context.beginPath();
          context.arc(0, 0, 26 * scale, 0, Math.PI * 2);
          context.strokeStyle = "#a855f7";
          context.lineWidth = 2.5 * scale;
          context.shadowBlur = 12 * scale;
          context.shadowColor = "#a855f7";
          context.stroke();
        }

        context.restore();
      };

      const render = (time: number) => {
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;

        if (!isPaused && shakeIntensityRef.current > 0.1) {
          shakeOffsetX = (Math.random() * 2 - 1) * shakeIntensityRef.current;
          shakeOffsetY = (Math.random() * 2 - 1) * shakeIntensityRef.current;
          shakeIntensityRef.current *= 0.85;
        } else {
          shakeIntensityRef.current = 0;
        }

        ctx.save();
        ctx.translate(shakeOffsetX, shakeOffsetY);

        ctx.fillStyle = "#04060f";
        ctx.fillRect(-40, -40, canvas.width + 80, canvas.height + 80);

        // Subtle Matrix Grid
        ctx.save();
        ctx.strokeStyle = "rgba(0, 240, 255, 0.035)";
        ctx.lineWidth = 1;
        const gridSize = canvas.width < 500 ? 30 : 40;
        for (let gx = 0; gx < canvas.width; gx += gridSize) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, canvas.height);
          ctx.stroke();
        }
        for (let gy = 0; gy < canvas.height; gy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(canvas.width, gy);
          ctx.stroke();
        }
        ctx.restore();

        // Stars
        ctx.fillStyle = "#ffffff";
        for (const s of starsRef.current) {
          if (!isPaused) {
            s.y += s.speed;
            if (s.y > canvas.height) {
              s.y = 0;
              s.x = Math.random() * canvas.width;
            }
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }

        const playerY = canvas.height - 35;
        const playerX = canvas.width / 2;

        if (freezeTimerRef.current > 0 && !isPaused) {
          freezeTimerRef.current--;
          ctx.fillStyle = "rgba(0, 240, 255, 0.04)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (empWaveRef.current.active) {
          empWaveRef.current.radius += 36;
          empWaveRef.current.alpha -= 0.025;

          ctx.save();
          ctx.beginPath();
          ctx.arc(playerX, playerY, empWaveRef.current.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0, empWaveRef.current.alpha)})`;
          ctx.lineWidth = 10;
          ctx.shadowBlur = 25;
          ctx.shadowColor = "#00f0ff";
          ctx.stroke();
          ctx.restore();

          if (
            empWaveRef.current.alpha <= 0 ||
            empWaveRef.current.radius >= empWaveRef.current.maxRadius
          ) {
            empWaveRef.current.active = false;
          }
        }

        // STEP 1: WAVE INTRO BANNER (Solid for 3.0s / 180 frames)
        if (waveIntroBannerRef.current.active) {
          const intro = waveIntroBannerRef.current;
          if (!isPaused) {
            if (intro.timer > 0) {
              intro.timer--;
              intro.alpha = 1.0;
            } else {
              intro.alpha -= 0.025;
            }
          }

          if (intro.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, intro.alpha));
            ctx.font =
              canvas.width < 500
                ? "900 24px 'Courier New', monospace"
                : "900 32px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#00e1ff";
            ctx.shadowBlur = 16;
            ctx.shadowColor = "#00e1ff";
            ctx.fillText(
              `WAVE ${wave}`,
              canvas.width / 2,
              canvas.height / 2 - 20,
            );
            ctx.restore();
          } else {
            intro.active = false;
            // When Wave Intro finishes, trigger Boss Alert if it's a boss wave
            if (config.isBossWave) {
              bossAlertBannerRef.current = {
                active: true,
                timer: 180, // 3 seconds
                alpha: 1.0,
                triggeredAudio: false,
              };
            }
          }
        }

        // STEP 2: MOTHERSHIP INVASION ALERT (Appears after Wave Intro vanishes)
        if (bossAlertBannerRef.current.active) {
          const bossAlert = bossAlertBannerRef.current;
          if (!bossAlert.triggeredAudio) {
            sounds.playWarning();
            triggerShake(14);
            bossAlert.triggeredAudio = true;
          }

          if (!isPaused) {
            if (bossAlert.timer > 0) {
              bossAlert.timer--;
              bossAlert.alpha = 1.0;
            } else {
              bossAlert.alpha -= 0.025;
            }
          }

          if (bossAlert.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, bossAlert.alpha));
            ctx.font =
              canvas.width < 500
                ? "900 20px 'Courier New', monospace"
                : "900 28px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ec4899";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#ec4899";
            ctx.fillText(
              mode === "boss_rush"
                ? `🔥 MOTHERSHIP RUSH ${wave} 🔥`
                : `⚠️ MOTHERSHIP DETECTED ⚠️`,
              canvas.width / 2,
              canvas.height / 2 - 20,
            );
            ctx.restore();
          } else {
            bossAlert.active = false;
          }
        }

        // STEP 3: WAVE CLEAR FLOATING BANNER (3 seconds / 180 frames)
        if (clearBannerRef.current.active) {
          const b = clearBannerRef.current;
          if (!isPaused) {
            if (b.timer > 0) {
              b.timer--;
              b.alpha = 1.0;
            } else {
              b.alpha -= 0.025;
            }
          }

          if (b.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha));

            const midX = canvas.width / 2;
            const midY = canvas.height / 2 - 20;

            ctx.font =
              canvas.width < 500
                ? "900 20px 'Courier New', monospace"
                : "900 30px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = b.isBoss ? "#ff0055" : "#00f0ff";
            ctx.shadowBlur = 20;
            ctx.shadowColor = b.isBoss ? "#ff0055" : "#00f0ff";
            ctx.fillText(
              b.isBoss
                ? `MOTHERSHIP ${b.waveNum} DESTROYED!`
                : `WAVE ${b.waveNum} CLEARED!`,
              midX,
              midY - 20,
            );

            ctx.font = "bold 14px 'Courier New', monospace";
            ctx.fillStyle = "#ffe600";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ffe600";
            ctx.fillText(
              `+${b.gainedScore} PTS  |  TOTAL: ${score}`,
              midX,
              midY + 10,
            );

            ctx.font = "bold 11px 'Courier New', monospace";
            ctx.fillStyle = "#94a3b8";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#94a3b8";
            ctx.fillText(
              `ACC: ${b.acc}%  •  SPEED: ${b.wpm} WPM`,
              midX,
              midY + 32,
            );

            ctx.restore();
          } else {
            b.active = false;
          }
        }

        // SPAWNING: Only starts after announcements finish
        const canSpawnStandard = !waveIntroBannerRef.current.active;
        const canSpawnBoss =
          !waveIntroBannerRef.current.active &&
          !bossAlertBannerRef.current.active;

        if (isGameStarted && !isGameOver && !isPaused) {
          if (config.isBossWave && canSpawnBoss) {
            if (spawnedCountRef.current === 0) {
              spawnMothership();
            } else if (
              bossEnemyRef.current &&
              !bossSwarmLaunchedRef.current &&
              bossEnemyRef.current.y >= 75
            ) {
              launchBossDroneSwarm(bossEnemyRef.current);
              bossSwarmLaunchedRef.current = true;
              triggerShake(15);
              sounds.playExplosion();
            }
          } else if (!config.isBossWave && canSpawnStandard) {
            if (
              spawnedCountRef.current < config.enemyCount &&
              time - lastSpawnTimeRef.current > config.spawnDelay
            ) {
              spawnEnemy();
              lastSpawnTimeRef.current = time;
            }
          }
        }

        if (
          bossEnemyRef.current &&
          bossEnemyRef.current.isShielded &&
          bossSwarmLaunchedRef.current
        ) {
          const activeDrones = enemiesRef.current.filter(
            (e) => e.type === "drone_bullet",
          );
          if (activeDrones.length === 0) {
            bossEnemyRef.current.isShielded = false;
            sounds.playPowerUp();
            triggerShake(14);
            floatingTextsRef.current.push(
              new FloatingText(
                bossEnemyRef.current.x,
                bossEnemyRef.current.y - 20,
                "MOTHERSHIP SHIELD DOWN!",
                "#ff0055",
              ),
            );
          }
        }

        // Update & Render Enemies
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          if (!isGameOver && !isPaused && isGameStarted) {
            enemy.update(
              canvas.width,
              enemiesRef.current,
              freezeTimerRef.current > 0,
            );
          }
          enemy.draw(ctx);

          if (!isPaused && isGameStarted && enemy.y >= playerY) {
            if (targetEnemyRef.current === enemy) {
              targetEnemyRef.current = null;
            }
            enemiesRef.current.splice(i, 1);
            explosionsRef.current.push(new Explosion(enemy.x, enemy.y));

            if (playerShieldRef.current) {
              playerShieldRef.current = false;
              sounds.playDamage();
              triggerShake(12);
              floatingTextsRef.current.push(
                new FloatingText(
                  playerX,
                  playerY - 30,
                  "SHIELD BROKEN",
                  "#a855f7",
                ),
              );
            } else {
              triggerShake(20);
              sounds.playDamage();
              setStreak(0);
              setMultiplier(1);

              setLives((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                  setIsGameOver(true);
                }
                return Math.max(0, next);
              });
            }

            destroyedCountRef.current++;
          }
        }

        // Update Bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const bullet = bulletsRef.current[i];
          if (!isPaused && isGameStarted) bullet.update();
          bullet.draw(ctx);

          if (!isPaused && isGameStarted && bullet.finished) {
            if (bullet.isFinalBullet) {
              explosionsRef.current.push(
                new Explosion(bullet.target.x, bullet.target.y),
              );
              sounds.playExplosion();
              triggerShake(bullet.target.type === "boss" ? 22 : 10);

              const enemyIdx = enemiesRef.current.indexOf(bullet.target);
              if (enemyIdx !== -1) {
                enemiesRef.current.splice(enemyIdx, 1);
              }

              const earnedScore =
                bullet.target.type === "boss"
                  ? 1000 * multiplier
                  : 100 * multiplier;
              setScore((prev) => prev + earnedScore);
              floatingTextsRef.current.push(
                new FloatingText(
                  bullet.target.x,
                  bullet.target.y,
                  `+${earnedScore}`,
                ),
              );
              destroyedCountRef.current++;
            }
            bulletsRef.current.splice(i, 1);
          }
        }

        for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
          const ft = floatingTextsRef.current[i];
          if (!isPaused && isGameStarted) ft.update();
          ft.draw(ctx);
          if (ft.finished) {
            floatingTextsRef.current.splice(i, 1);
          }
        }

        // Strictly verify that all enemies configured for this wave have spawned and were destroyed
        const allEnemiesSpawned = spawnedCountRef.current >= config.enemyCount;
        const noEnemiesRemaining =
          enemiesRef.current.length === 0 && bulletsRef.current.length === 0;

        if (
          isGameStarted &&
          !waveTransitioningRef.current &&
          !isGameOver &&
          !isPaused &&
          allEnemiesSpawned &&
          noEnemiesRemaining
        ) {
          waveTransitioningRef.current = true;
          sounds.playWaveComplete();

          if (wave % 2 === 0) {
            setBombs((prev) => Math.min(3, prev + 1));
          }

          const waveScoreGained = Math.max(
            0,
            score - waveStartScoreRef.current,
          );

          // Display wave clear stats for exactly 3 seconds (180 frames)
          clearBannerRef.current = {
            active: true,
            alpha: 1.0,
            timer: 180,
            waveNum: wave,
            gainedScore: waveScoreGained,
            acc: currentAccuracyRef.current,
            wpm: currentWpmRef.current,
            isBoss: config.isBossWave,
          };

          // Advance after 3.2 seconds
          setTimeout(() => {
            setWave((prevWave) => prevWave + 1);
          }, 3200);
        }

        for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
          const exp = explosionsRef.current[i];
          if (!isPaused && isGameStarted) exp.update();
          exp.draw(ctx);
          if (exp.finished) {
            explosionsRef.current.splice(i, 1);
          }
        }

        drawPlayer(ctx, playerX, playerY);

        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", resizeCanvas);
      };
    }, [
      score,
      wave,
      category,
      difficulty,
      mode,
      isGameStarted,
      isGameOver,
      isPaused,
      multiplier,
      setScore,
      setLives,
      setIsGameOver,
      setWave,
      setBombs,
      setStreak,
      setMultiplier,
    ]);

    return <canvas ref={canvasRef} className="game-canvas" />;
  },
);

GameCanvas.displayName = "GameCanvas";

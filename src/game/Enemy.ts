export class Enemy {
  word: string;
  x: number;
  y: number;
  speed: number;
  baseSpeed: number;
  wave: number;
  type: "standard" | "fast" | "elite" | "boss" | "drone_bullet";
  powerUpType: "emp" | "freeze" | "shield" | "none";
  typedIndex: number;
  isTargeted: boolean;
  isPendingDestruction: boolean;
  isShielded: boolean;
  droneSwarmCount: number;
  slowdownFactor: number;

  phasesLeft: number;
  totalPhases: number;
  queuedWords: string[];

  targetX?: number;
  targetY?: number;
  vx?: number;
  vy?: number;

  constructor(
    wordOrWords: string | string[],
    x: number,
    y: number,
    speed: number,
    wave: number,
    type: "standard" | "fast" | "elite" | "boss" | "drone_bullet" = "standard",
    powerUpType: "emp" | "freeze" | "shield" | "none" = "none",
    targetX?: number,
    targetY?: number
  ) {
    if (Array.isArray(wordOrWords)) {
      this.word = wordOrWords[0].toUpperCase();
      this.queuedWords = wordOrWords.slice(1).map((w) => w.toUpperCase());
      this.totalPhases = wordOrWords.length;
      this.phasesLeft = wordOrWords.length;
    } else {
      this.word = wordOrWords.toUpperCase();
      this.queuedWords = [];
      this.totalPhases = 1;
      this.phasesLeft = 1;
    }

    this.x = x;
    this.y = y;
    this.speed = speed;
    this.baseSpeed = speed;
    this.wave = wave;
    this.type = type;
    this.powerUpType = powerUpType;
    this.typedIndex = 0;
    this.isTargeted = false;
    this.isPendingDestruction = false;
    this.isShielded = type === "boss";
    this.droneSwarmCount = 0;
    this.slowdownFactor = 1.0;

    if (type === "drone_bullet" && targetX !== undefined && targetY !== undefined) {
      this.targetX = targetX;
      this.targetY = targetY;
      const angle = Math.atan2(targetY - y, targetX - x);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
  }

  getNextChar(): string {
    while (this.typedIndex < this.word.length && this.word[this.typedIndex] === " ") {
      this.typedIndex++;
    }
    return this.word[this.typedIndex] || "";
  }

  matchChar(char: string): boolean {
    if (this.getNextChar() === char) {
      this.typedIndex++;
      this.slowdownFactor = this.type === "boss" ? 0.25 : 0.35;

      while (this.typedIndex < this.word.length && this.word[this.typedIndex] === " ") {
        this.typedIndex++;
      }

      if (this.typedIndex >= this.word.length) {
        if (this.queuedWords.length > 0) {
          this.word = this.queuedWords.shift()!;
          this.typedIndex = 0;
          this.phasesLeft--;
          this.slowdownFactor = 0.4;
          return true;
        } else {
          this.isPendingDestruction = true;
        }
      }
      return true;
    }
    return false;
  }

  update(canvasWidth: number, isFrozen: boolean) {
    if (isFrozen) return;

    if (this.slowdownFactor < 1.0) {
      this.slowdownFactor += 0.015;
      if (this.slowdownFactor > 1.0) this.slowdownFactor = 1.0;
    }

    let progressMultiplier = 1.0;
    if (this.type === "boss" && this.word.length > 0) {
      const completionRatio = this.typedIndex / this.word.length;
      progressMultiplier = Math.max(0.35, 1.0 - completionRatio * 0.65);
    }

    const currentSpeed = this.baseSpeed * this.slowdownFactor * progressMultiplier;

    if (this.type === "drone_bullet" && this.vx !== undefined && this.vy !== undefined) {
      this.x += this.vx * this.slowdownFactor;
      this.y += this.vy * this.slowdownFactor;
    } else if (this.type === "boss") {
      this.y += currentSpeed * 0.45;
    } else {
      this.y += currentSpeed;
      this.x += Math.sin(this.y * 0.04 + this.wave) * 0.35;
    }

    const margin = canvasWidth < 500 ? 30 : 60;
    this.x = Math.max(margin, Math.min(canvasWidth - margin, this.x));
  }

  draw(ctx: CanvasRenderingContext2D) {
    const isMobile = ctx.canvas.width < 500;
    const scale = isMobile ? 0.8 : 1.0;

    ctx.save();
    ctx.translate(this.x, this.y);

    let shipColor = "#00f0ff";
    if (this.type === "boss") {
      shipColor = "#ec4899";
    } else if (this.type === "drone_bullet") {
      shipColor = "#fb923c";
    } else if (this.phasesLeft > 1) {
      shipColor = "#a855f7";
    }

    // 1. Ship Chevron
    ctx.save();
    ctx.beginPath();
    if (this.type === "boss") {
      ctx.moveTo(0, 26 * scale);
      ctx.lineTo(46 * scale, -20 * scale);
      ctx.lineTo(22 * scale, -12 * scale);
      ctx.lineTo(0, -6 * scale);
      ctx.lineTo(-22 * scale, -12 * scale);
      ctx.lineTo(-46 * scale, -20 * scale);
    } else if (this.phasesLeft > 1) {
      ctx.moveTo(0, 20 * scale);
      ctx.lineTo(16 * scale, -12 * scale);
      ctx.lineTo(0, -6 * scale);
      ctx.lineTo(-16 * scale, -12 * scale);
    } else {
      ctx.moveTo(0, 16 * scale);
      ctx.lineTo(12 * scale, -10 * scale);
      ctx.lineTo(0, -4 * scale);
      ctx.lineTo(-12 * scale, -10 * scale);
    }
    ctx.closePath();
    ctx.fillStyle = "#030712";
    ctx.strokeStyle = shipColor;
    ctx.lineWidth = 2.5 * scale;
    ctx.shadowBlur = (this.isTargeted ? 18 : 12) * scale;
    ctx.shadowColor = shipColor;
    ctx.fill();
    ctx.stroke();

    if (this.phasesLeft > 1) {
      ctx.beginPath();
      ctx.arc(0, 2 * scale, 22 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
      ctx.lineWidth = 1.5 * scale;
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.isShielded) {
      ctx.beginPath();
      ctx.arc(0, 0, 52 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2.5 * scale;
      ctx.shadowBlur = 14 * scale;
      ctx.shadowColor = "#a855f7";
      ctx.stroke();
    }
    ctx.restore();

    // 2. Responsive Typography Badge
    const fontSize = this.type === "boss" ? (isMobile ? 12 : 15) : isMobile ? 11.5 : 14;
    ctx.font = `900 ${fontSize}px 'Courier New', monospace`;

    const fullWidth = ctx.measureText(this.word).width;
    const badgePadX = 8 * scale;
    const badgeW = fullWidth + badgePadX * 2;
    const badgeH = (fontSize + 8) * scale;
    const badgeY = this.type === "boss" ? -50 * scale : -34 * scale;

    // 3. Red Laser Lock-On Targeting Reticle
    if (this.isTargeted) {
      ctx.save();
      const reticlePad = 6 * scale;
      const rx = -badgeW / 2 - reticlePad;
      const ry = badgeY - badgeH / 2 - reticlePad;
      const rw = badgeW + reticlePad * 2;
      const rh = badgeH + reticlePad * 2;
      const cornerLen = 7 * scale;

      ctx.strokeStyle = "#ff0055";
      ctx.lineWidth = 2 * scale;
      ctx.shadowBlur = 12 * scale;
      ctx.shadowColor = "#ff0055";

      ctx.beginPath();
      ctx.moveTo(rx, ry + cornerLen);
      ctx.lineTo(rx, ry);
      ctx.lineTo(rx + cornerLen, ry);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rx + rw - cornerLen, ry);
      ctx.lineTo(rx + rw, ry);
      ctx.lineTo(rx + rw, ry + cornerLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rx, ry + rh - cornerLen);
      ctx.lineTo(rx, ry + rh);
      ctx.lineTo(rx + cornerLen, ry + rh);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rx + rw - cornerLen, ry + rh);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.lineTo(rx + rw, ry + rh - cornerLen);
      ctx.stroke();

      ctx.fillStyle = "#ff0055";
      ctx.beginPath();
      ctx.arc(0, ry + rh + 4 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.fillStyle = "rgba(2, 6, 23, 0.95)";
    ctx.strokeStyle = this.isTargeted
      ? "#ff0055"
      : this.phasesLeft > 1
      ? "rgba(168, 85, 247, 0.75)"
      : "rgba(0, 240, 255, 0.45)";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4 * scale);
    ctx.fill();
    ctx.stroke();

    // 4. Highlight Characters
    const startX = -fullWidth / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    let currentX = startX;
    for (let i = 0; i < this.word.length; i++) {
      const char = this.word[i];
      const charWidth = ctx.measureText(char).width;

      if (i < this.typedIndex) {
        ctx.fillStyle = "#ffe600";
        ctx.shadowBlur = 8 * scale;
        ctx.shadowColor = "#ffe600";
      } else if (this.isTargeted && i === this.typedIndex) {
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor = "#ffffff";
      } else {
        ctx.fillStyle = this.phasesLeft > 1 ? "#c084fc" : "#00f0ff";
        ctx.shadowBlur = 4 * scale;
        ctx.shadowColor = this.phasesLeft > 1 ? "#c084fc" : "#00f0ff";
      }

      ctx.fillText(char, currentX, badgeY);
      currentX += charWidth;
    }

    ctx.restore();
  }
}
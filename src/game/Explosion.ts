interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export class Explosion {
  public x: number;
  public y: number;
  public finished: boolean = false;
  private particles: Particle[] = [];
  private shockwaveRadius: number = 2;
  private shockwaveAlpha: number = 1;

  constructor(x: number, y: number, colorTint?: string) {
    this.x = x;
    this.y = y;

    const count = 28;
    const defaultColors = ["#00ffff", "#ff0077", "#ffffff", "#ffe600"];
    const colors = colorTint ? [colorTint, "#ffffff", "#ffe600"] : defaultColors;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }
  }

  public update(): void {
    let allDead = true;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= 0.025;
      if (p.alpha > 0) allDead = false;
    }

    this.shockwaveRadius += 3;
    this.shockwaveAlpha -= 0.04;

    if (allDead && this.shockwaveAlpha <= 0) {
      this.finished = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.shockwaveAlpha > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 255, ${Math.max(0, this.shockwaveAlpha)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const p of this.particles) {
      if (p.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
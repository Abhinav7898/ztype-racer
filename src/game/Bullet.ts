import { Enemy } from "./Enemy";

export class Bullet {
  public x: number;
  public y: number;
  public target: Enemy;
  public isFinalBullet: boolean;
  public finished: boolean = false;
  private speed: number = 28;

  private trail: { x: number; y: number }[] = [];
  private maxTrailLength: number = 5;

  constructor(startX: number, startY: number, target: Enemy, isFinalBullet: boolean = false) {
    this.x = startX;
    this.y = startY;
    this.target = target;
    this.isFinalBullet = isFinalBullet;
  }

  public update(): void {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance < this.speed) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.finished = true;
    } else {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const mainColor = this.isFinalBullet ? "#ff0055" : "#00f0ff";
    const coreColor = "#ffffff";

    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      for (let i = 0; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = this.isFinalBullet ? 3.5 : 2.5;
      ctx.lineCap = "round";
      ctx.shadowBlur = 10;
      ctx.shadowColor = mainColor;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.isFinalBullet ? 4.5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = mainColor;
    ctx.shadowBlur = 12;
    ctx.shadowColor = mainColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.fill();

    ctx.restore();
  }
}
export class FloatingText {
  public x: number;
  public y: number;
  public text: string;
  public color: string;
  public alpha: number = 1;
  public finished: boolean = false;
  private vy: number = -1.2;

  constructor(x: number, y: number, text: string, color: string = "#ffe600") {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
  }

  public update(): void {
    this.y += this.vy;
    this.alpha -= 0.022;
    if (this.alpha <= 0) {
      this.finished = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.finished) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
import bulletShootUrl from "../assets/bullet-shoot.mp3";
import enemyLockUrl from "../assets/enemy-lock.mp3";
import explodeUrl from "../assets/explode.mp3";
import warningUrl from "../assets/warning.mp3";

class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  public isMuted: boolean = false;

  constructor() {
    this.preloadSound("bullet-shoot", bulletShootUrl);
    this.preloadSound("enemy-lock", enemyLockUrl);
    this.preloadSound("explode", explodeUrl);
    this.preloadSound("warning", warningUrl);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.ctx && muted) {
      this.ctx.suspend();
    } else if (this.ctx && !muted && !this.isMuted && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended" && !this.isMuted) {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private async preloadSound(key: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(key, audioBuffer);
    } catch (err) {
      console.warn(`Failed to load audio asset (${key}): ${url}`, err);
    }
  }

  private playSample(
    key: string,
    volume: number = 1.0,
    pitchJitter: number = 0
  ): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    const buffer = this.buffers.get(key);
    if (!ctx || !buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    if (pitchJitter > 0) {
      const variation = 1 + (Math.random() * 2 - 1) * pitchJitter;
      source.playbackRate.value = variation;
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  }

  public playLaser(isFinal: boolean = false): void {
    this.playSample("bullet-shoot", isFinal ? 0.8 : 0.55, 0.05);
  }

  public playLock(): void {
    this.playSample("enemy-lock", 0.6, 0);
  }

  public playExplosion(): void {
    this.playSample("explode", 0.75, 0.06);
  }

  public playDamage(): void {
    this.playSample("explode", 0.9, 0);
  }

  public playEmp(): void {
    this.playSample("explode", 1.0, 0);
  }

  // Mothership Siren / Alert Sound
  public playWarning(): void {
    this.playSample("warning", 0.85, 0);
  }

  public playMiss(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  public playPowerUp(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  public playWaveComplete(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + index * 0.08;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }
}

export const sounds = new SoundManager();
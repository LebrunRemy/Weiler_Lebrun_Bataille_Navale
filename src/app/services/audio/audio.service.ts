import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServiceAudio {
  private audioCtx: AudioContext | null = null;

  playTone(freq: number, duration: number, delay = 0) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      const ctx = this.audioCtx;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      const startAt = ctx.currentTime + delay;
      oscillator.start(startAt);
      oscillator.stop(startAt + duration);
    } catch {
      // autoplay restrictions or audio context failures can be ignored safely
    }
  }
}

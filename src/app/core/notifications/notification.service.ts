import { Injectable, effect, inject } from '@angular/core';
import { SettingsRepository } from '../persistence/settings.repository';
import { TimerService } from '../timer/timer.service';
import { SwRegistrationService } from './sw-registration.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly timer = inject(TimerService);
  private readonly settingsRepo = inject(SettingsRepository);
  private readonly swRegistration = inject(SwRegistrationService);

  private audioCtx: AudioContext | null = null;
  private primed = false;

  constructor() {
    effect(() => {
      if (this.timer.phase() === 'notifying') {
        this.onNotify();
      }
    });
  }

  /** Call this from a real user gesture (the Start button click) — browsers block
   *  both AudioContext and Notification prompts without one. */
  primeOnUserGesture(): void {
    if (this.primed) return;
    this.primed = true;

    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }

    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }

  private onNotify(): void {
    const settings = this.settingsRepo.settings();
    if (settings.soundEnabled) {
      this.playChime(settings.soundVolume);
    }
    if (settings.browserNotificationsEnabled) {
      void this.showSystemNotification();
    }
  }

  private playChime(volume: number): void {
    const ctx = this.audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const start = now + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume * 0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  private async showSystemNotification(): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const registration = await this.swRegistration.whenReady();
    if (!registration) return;
    await registration.showNotification('Time to stretch', {
      body: 'Your focus session is done — take a guided break.',
      icon: 'icons/icon-192x192.png',
      tag: 'unbend-break',
    });
  }
}

import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/notifications/notification.service';
import { SettingsRepository } from '../../core/persistence/settings.repository';
import { SessionHistoryRepository } from '../../core/persistence/session-history.repository';
import { TimerService } from '../../core/timer/timer.service';
import { SessionEntry } from '../../shared/models/session-entry.model';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { ProgressBarComponent } from '../../shared/ui/progress-bar/progress-bar.component';
import { SegmentedControlComponent, SegmentedOption } from '../../shared/ui/segmented-control/segmented-control.component';
import { breaksOnDay, computeStreak, formatMinutes, totalBreakSecondsOnDay } from '../../shared/util/stats.util';
import { formatClock } from '../../shared/util/time.util';

const EYE_BREAK_INTERVAL_MS = 20 * 60_000;

@Component({
  selector: 'app-timer-screen',
  standalone: true,
  imports: [ButtonComponent, ProgressBarComponent, SegmentedControlComponent],
  templateUrl: './timer-screen.component.html',
  styleUrl: './timer-screen.component.scss',
})
export class TimerScreenComponent implements OnInit, OnDestroy {
  protected readonly timer = inject(TimerService);
  private readonly notifications = inject(NotificationService);
  protected readonly settingsRepo = inject(SettingsRepository);
  private readonly history = inject(SessionHistoryRepository);

  protected readonly presetOptions: SegmentedOption<number>[] = [
    { label: '5', value: 5 },
    { label: '25', value: 25 },
    { label: '45', value: 45 },
    { label: '60', value: 60 },
  ];
  protected readonly selectedPreset = signal(45);

  protected readonly minutesLabel = computed(() => {
    const total = this.timer.durationMs();
    return total ? Math.round(total / 60_000) : this.selectedPreset();
  });

  protected readonly timeLabel = computed(() => formatClock(this.timer.remainingMs()));

  protected readonly eyeBreakRemainingMs = signal(EYE_BREAK_INTERVAL_MS);
  private eyeBreakTimer?: ReturnType<typeof setInterval>;

  private sessions: SessionEntry[] = [];
  protected readonly breaksToday = signal(0);
  protected readonly stretchTodayLabel = signal('0m');
  protected readonly streak = signal(0);

  /** Bumped on start()/reset() to retrigger the dial's pop animation — alternating
   *  keyframe names forces the CSS animation to replay even though the element itself
   *  never leaves the DOM. */
  private readonly pulseTick = signal(0);
  protected readonly pulseAnimName = computed(() => {
    const tick = this.pulseTick();
    return tick === 0 ? 'none' : tick % 2 === 1 ? 'timer-pulse-a' : 'timer-pulse-b';
  });

  constructor() {
    effect(() => {
      if (this.timer.phase() === 'idle') {
        void this.loadStats();
      }
    });
  }

  ngOnInit(): void {
    void this.settingsRepo.load().then((s) => {
      if (this.timer.phase() === 'idle') {
        this.selectedPreset.set(s.defaultWorkMinutes);
      }
    });
    this.eyeBreakTimer = setInterval(() => this.tickEyeBreak(), 1000);
  }

  ngOnDestroy(): void {
    if (this.eyeBreakTimer) clearInterval(this.eyeBreakTimer);
  }

  protected selectPreset(minutes: number): void {
    if (this.timer.phase() !== 'idle') return;
    this.selectedPreset.set(minutes);
  }

  protected start(): void {
    this.notifications.primeOnUserGesture();
    this.timer.start(this.selectedPreset());
    this.pulseTick.update((t) => t + 1);
  }

  protected pauseOrResume(): void {
    if (this.timer.isPaused()) {
      this.timer.resume();
    } else {
      this.timer.pause();
    }
  }

  protected reset(): void {
    this.timer.reset();
    this.pulseTick.update((t) => t + 1);
  }

  protected startBreak(): void {
    void this.timer.openBreak();
  }

  protected eyeBreakLabel(): string {
    return formatClock(this.eyeBreakRemainingMs());
  }

  private tickEyeBreak(): void {
    if (this.timer.phase() !== 'working') return;
    const next = this.eyeBreakRemainingMs() - 1000;
    this.eyeBreakRemainingMs.set(next <= 0 ? EYE_BREAK_INTERVAL_MS : next);
  }

  private async loadStats(): Promise<void> {
    this.sessions = await this.history.getAll();
    const today = new Date();
    this.breaksToday.set(breaksOnDay(this.sessions, today).length);
    this.stretchTodayLabel.set(formatMinutes(totalBreakSecondsOnDay(this.sessions, today)));
    this.streak.set(computeStreak(this.sessions));
  }
}

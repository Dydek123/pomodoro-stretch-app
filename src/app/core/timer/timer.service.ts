import { Injectable, computed, inject, signal } from '@angular/core';
import { ExerciseSet } from '../../shared/models/exercise-set.model';
import { ExerciseSetRepository } from '../persistence/exercise-set.repository';
import { SessionHistoryRepository } from '../persistence/session-history.repository';
import { SettingsRepository } from '../persistence/settings.repository';
import { PersistedTimerState, TimerPhase, WorkerCommand, WorkerMessage } from './timer.types';

const STORAGE_KEY = 'unbend:timer-state';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly exerciseSets = inject(ExerciseSetRepository);
  private readonly settingsRepo = inject(SettingsRepository);
  private readonly history = inject(SessionHistoryRepository);

  private readonly worker = new Worker(new URL('./timer-worker', import.meta.url));

  readonly phase = signal<TimerPhase>('idle');
  private readonly previousPhase = signal<TimerPhase | null>(null);
  private readonly endTimestamp = signal<number | null>(null);
  readonly durationMs = signal<number | null>(null);
  readonly remainingMs = signal<number>(0);
  readonly currentSet = signal<ExerciseSet | null>(null);
  readonly currentStepIndex = signal<number>(0);

  readonly isWorking = computed(() => this.phase() === 'working');
  readonly isPaused = computed(() => this.phase() === 'paused');
  readonly isNotifying = computed(() => this.phase() === 'notifying');
  readonly isOnBreak = computed(() => this.phase() === 'break');
  readonly currentStep = computed(() => this.currentSet()?.steps[this.currentStepIndex()] ?? null);
  readonly progress = computed(() => {
    const total = this.durationMs();
    if (!total) return 0;
    return Math.min(1, Math.max(0, 1 - this.remainingMs() / total));
  });

  constructor() {
    this.worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      if (data.type === 'tick') {
        this.remainingMs.set(data.remainingMs);
      } else if (data.type === 'done') {
        this.onWorkerDone();
      }
    };
    void this.reconcile();
  }

  start(minutes?: number): void {
    if (this.phase() !== 'idle') return;
    const mins = minutes ?? this.settingsRepo.settings().defaultWorkMinutes;
    this.beginTimedPhase('working', mins * 60_000);
  }

  pause(): void {
    const current = this.phase();
    if (current !== 'working' && current !== 'break') return;
    this.previousPhase.set(current);
    this.phase.set('paused');
    this.postCommand({ cmd: 'pause' });
    this.persist();
  }

  resume(): void {
    if (this.phase() !== 'paused') return;
    const prev = this.previousPhase();
    if (!prev) return;
    const end = Date.now() + this.remainingMs();
    this.endTimestamp.set(end);
    this.phase.set(prev);
    this.previousPhase.set(null);
    this.postCommand({ cmd: 'resume', endTimestamp: end });
    this.persist();
  }

  reset(): void {
    if (this.phase() === 'working') {
      void this.logWorkSession(true);
    }
    this.postCommand({ cmd: 'reset' });
    this.clearTimedState();
    this.phase.set('idle');
    this.previousPhase.set(null);
    this.persist();
  }

  /** Called when the user acts on the end-of-work notification. */
  async openBreak(): Promise<void> {
    if (this.phase() !== 'notifying') return;
    const settings = this.settingsRepo.settings();
    const set = await this.exerciseSets.pickForBreak(settings.excludedCategories, settings.excludedExerciseIds);
    this.currentSet.set(set ?? null);
    this.currentStepIndex.set(0);
    this.beginTimedPhase('break', settings.defaultBreakMinutes * 60_000);
  }

  advanceStep(): void {
    if (this.phase() !== 'break') return;
    const set = this.currentSet();
    if (!set) {
      this.finishBreak(false);
      return;
    }
    const next = this.currentStepIndex() + 1;
    if (next >= set.steps.length) {
      this.finishBreak(false);
    } else {
      this.currentStepIndex.set(next);
      this.persist();
    }
  }

  endBreakEarly(): void {
    if (this.phase() !== 'break') return;
    this.finishBreak(true);
  }

  private beginTimedPhase(phase: 'working' | 'break', duration: number): void {
    const end = Date.now() + duration;
    this.durationMs.set(duration);
    this.endTimestamp.set(end);
    this.remainingMs.set(duration);
    this.phase.set(phase);
    this.postCommand({ cmd: 'start', endTimestamp: end });
    this.persist();
  }

  private onWorkerDone(): void {
    if (this.phase() === 'working') {
      void this.logWorkSession(false);
      this.endTimestamp.set(null);
      this.phase.set('notifying');
      this.persist();
    } else if (this.phase() === 'break') {
      this.finishBreak(false);
    }
  }

  private finishBreak(skipped: boolean): void {
    this.postCommand({ cmd: 'reset' });
    void this.logBreakSession(skipped);
    const autoStart = this.settingsRepo.settings().autoStartNextSession;
    this.clearTimedState();
    if (autoStart) {
      this.phase.set('idle');
      this.persist();
      this.start();
    } else {
      this.phase.set('idle');
      this.persist();
    }
  }

  private clearTimedState(): void {
    this.endTimestamp.set(null);
    this.durationMs.set(null);
    this.remainingMs.set(0);
    this.currentSet.set(null);
    this.currentStepIndex.set(0);
  }

  private async logWorkSession(skipped: boolean): Promise<void> {
    const planned = this.durationMs() ?? 0;
    const actual = planned - this.remainingMs();
    await this.history.add({
      timestamp: Date.now(),
      type: 'work',
      plannedDurationSeconds: Math.round(planned / 1000),
      actualDurationSeconds: Math.round(Math.max(0, actual) / 1000),
      skipped,
    });
  }

  private async logBreakSession(skipped: boolean): Promise<void> {
    const planned = this.durationMs() ?? 0;
    const actual = planned - this.remainingMs();
    await this.history.add({
      timestamp: Date.now(),
      type: 'break',
      plannedDurationSeconds: Math.round(planned / 1000),
      actualDurationSeconds: Math.round(Math.max(0, actual) / 1000),
      exerciseSetId: this.currentSet()?.id,
      skipped,
    });
  }

  private postCommand(command: WorkerCommand): void {
    this.worker.postMessage(command);
  }

  private persist(): void {
    const state: PersistedTimerState = {
      phase: this.phase(),
      previousPhase: this.previousPhase(),
      endTimestamp: this.endTimestamp(),
      durationMs: this.durationMs(),
      remainingMsAtPause: this.phase() === 'paused' ? this.remainingMs() : null,
      currentSetId: this.currentSet()?.id ?? null,
      currentStepIndex: this.currentStepIndex(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private async reconcile(): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let state: PersistedTimerState;
    try {
      state = JSON.parse(raw);
    } catch {
      return;
    }

    if (state.currentSetId) {
      const set = await this.exerciseSets.getById(state.currentSetId);
      this.currentSet.set(set ?? null);
      this.currentStepIndex.set(state.currentStepIndex);
    }

    const elapsed = state.endTimestamp !== null && Date.now() >= state.endTimestamp;

    switch (state.phase) {
      case 'working':
        if (elapsed) {
          void this.logWorkSession(false);
          this.phase.set('notifying');
          this.persist();
        } else if (state.endTimestamp && state.durationMs) {
          this.durationMs.set(state.durationMs);
          this.endTimestamp.set(state.endTimestamp);
          this.remainingMs.set(state.endTimestamp - Date.now());
          this.phase.set('working');
          this.postCommand({ cmd: 'start', endTimestamp: state.endTimestamp });
        }
        break;
      case 'break':
        if (elapsed) {
          this.finishBreak(false);
        } else if (state.endTimestamp && state.durationMs) {
          this.durationMs.set(state.durationMs);
          this.endTimestamp.set(state.endTimestamp);
          this.remainingMs.set(state.endTimestamp - Date.now());
          this.phase.set('break');
          this.postCommand({ cmd: 'start', endTimestamp: state.endTimestamp });
        }
        break;
      case 'paused':
        this.previousPhase.set(state.previousPhase);
        this.durationMs.set(state.durationMs);
        this.remainingMs.set(state.remainingMsAtPause ?? 0);
        this.phase.set('paused');
        break;
      case 'notifying':
        this.phase.set('notifying');
        break;
      default:
        this.phase.set('idle');
    }
  }
}

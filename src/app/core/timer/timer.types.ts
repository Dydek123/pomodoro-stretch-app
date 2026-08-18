export type TimerPhase = 'idle' | 'working' | 'notifying' | 'break' | 'break_finished' | 'paused';

export interface PersistedTimerState {
  phase: TimerPhase;
  previousPhase: TimerPhase | null;
  endTimestamp: number | null;
  durationMs: number | null;
  remainingMsAtPause: number | null;
  currentSetId: string | null;
  currentStepIndex: number;
}

export type WorkerCommand =
  | { cmd: 'start' | 'resume'; endTimestamp: number }
  | { cmd: 'pause' }
  | { cmd: 'reset' };

export type WorkerMessage = { type: 'tick'; remainingMs: number } | { type: 'done' };

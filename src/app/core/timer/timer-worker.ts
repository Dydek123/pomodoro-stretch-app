/// <reference lib="webworker" />
import { WorkerCommand, WorkerMessage } from './timer.types';

let endTimestamp: number | null = null;
let intervalId: ReturnType<typeof setInterval> | undefined;

function post(message: WorkerMessage): void {
  postMessage(message);
}

function stopTicking(): void {
  if (intervalId !== undefined) {
    clearInterval(intervalId);
    intervalId = undefined;
  }
}

// Diffs against the absolute endTimestamp on every tick rather than counting down —
// stays correct even if the worker itself gets throttled and skips ticks.
function tick(): void {
  if (endTimestamp === null) return;
  const remainingMs = endTimestamp - Date.now();
  if (remainingMs <= 0) {
    post({ type: 'tick', remainingMs: 0 });
    post({ type: 'done' });
    stopTicking();
    endTimestamp = null;
    return;
  }
  post({ type: 'tick', remainingMs });
}

function startTicking(target: number): void {
  endTimestamp = target;
  stopTicking();
  tick();
  intervalId = setInterval(tick, 250);
}

addEventListener('message', ({ data }: MessageEvent<WorkerCommand>) => {
  switch (data.cmd) {
    case 'start':
    case 'resume':
      startTicking(data.endTimestamp);
      break;
    case 'pause':
      stopTicking();
      break;
    case 'reset':
      stopTicking();
      endTimestamp = null;
      break;
  }
});

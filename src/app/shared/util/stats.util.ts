import { SessionEntry } from '../models/session-entry.model';

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function breaksOnDay(sessions: SessionEntry[], date: Date): SessionEntry[] {
  const key = dayKey(date.getTime());
  return sessions.filter((s) => s.type === 'break' && !s.skipped && dayKey(s.timestamp) === key);
}

export function totalBreakSecondsOnDay(sessions: SessionEntry[], date: Date): number {
  return breaksOnDay(sessions, date).reduce((sum, s) => sum + s.actualDurationSeconds, 0);
}

/** Consecutive days (walking back from today) with at least one completed break. */
export function computeStreak(sessions: SessionEntry[]): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset <= 365; dayOffset++) {
    const hasBreak = breaksOnDay(sessions, cursor).length > 0;
    if (hasBreak) {
      streak++;
    } else if (dayOffset > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function formatMinutes(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

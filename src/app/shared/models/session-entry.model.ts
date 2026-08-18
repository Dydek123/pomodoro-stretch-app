export type SessionType = 'work' | 'break';

export interface SessionEntry {
  id?: number;
  timestamp: number;
  type: SessionType;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  exerciseSetId?: string;
  skipped: boolean;
}

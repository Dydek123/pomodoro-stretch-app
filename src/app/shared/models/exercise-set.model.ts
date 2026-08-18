export type ExerciseCategory = 'full-body' | 'eyes' | 'wrists' | 'neck' | 'breathing';
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';
export type ExerciseEquipment = 'none' | 'chair' | 'wall';
export type ExerciseStepType = 'instruction' | 'exercise' | 'hold';

export interface ExerciseStep {
  id: string;
  type: ExerciseStepType;
  text: string;
  reps?: number;
  perSide?: boolean;
  durationSeconds?: number;
  mediaUrl?: string;
}

export interface ExerciseSet {
  id: string;
  name: string;
  category: ExerciseCategory;
  durationMinutes: number;
  difficulty: ExerciseDifficulty;
  equipment: ExerciseEquipment;
  steps: ExerciseStep[];
  isCustom: boolean;
}

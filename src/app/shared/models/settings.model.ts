import { ExerciseCategory } from './exercise-set.model';

export interface UserSettings {
  id: 'singleton';
  defaultWorkMinutes: number;
  defaultBreakMinutes: number;
  autoStartNextSession: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  browserNotificationsEnabled: boolean;
  eyeBreakEnabled: boolean;
  excludedExerciseIds: string[];
  excludedCategories: ExerciseCategory[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'singleton',
  defaultWorkMinutes: 45,
  defaultBreakMinutes: 5,
  autoStartNextSession: false,
  soundEnabled: true,
  soundVolume: 0.55,
  browserNotificationsEnabled: true,
  eyeBreakEnabled: true,
  excludedExerciseIds: [],
  excludedCategories: [],
};

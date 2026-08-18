import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { ExerciseSet } from '../../shared/models/exercise-set.model';
import { SessionEntry } from '../../shared/models/session-entry.model';
import { DEFAULT_SETTINGS, UserSettings } from '../../shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class DbService extends Dexie {
  exerciseSets!: Table<ExerciseSet, string>;
  sessionHistory!: Table<SessionEntry, number>;
  settings!: Table<UserSettings, string>;

  private seedPromise?: Promise<void>;

  constructor() {
    super('unbend');
    this.version(1).stores({
      exerciseSets: 'id, category, isCustom',
      sessionHistory: '++id, timestamp, type',
      settings: 'id',
    });
  }

  ensureSeeded(): Promise<void> {
    if (!this.seedPromise) {
      this.seedPromise = this.seed();
    }
    return this.seedPromise;
  }

  private async seed(): Promise<void> {
    const [setCount, settingsCount] = await Promise.all([
      this.exerciseSets.count(),
      this.settings.count(),
    ]);

    if (setCount === 0) {
      const response = await fetch('exercise-sets.json');
      const sets: ExerciseSet[] = await response.json();
      await this.exerciseSets.bulkPut(sets);
    }

    if (settingsCount === 0) {
      await this.settings.put(DEFAULT_SETTINGS);
    }
  }
}

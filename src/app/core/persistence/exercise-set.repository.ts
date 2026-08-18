import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { ExerciseCategory, ExerciseSet } from '../../shared/models/exercise-set.model';

@Injectable({ providedIn: 'root' })
export class ExerciseSetRepository {
  private db = inject(DbService);

  async getAll(): Promise<ExerciseSet[]> {
    await this.db.ensureSeeded();
    return this.db.exerciseSets.toArray();
  }

  async getByCategory(category: ExerciseCategory): Promise<ExerciseSet[]> {
    await this.db.ensureSeeded();
    return this.db.exerciseSets.where('category').equals(category).toArray();
  }

  async getById(id: string): Promise<ExerciseSet | undefined> {
    await this.db.ensureSeeded();
    return this.db.exerciseSets.get(id);
  }

  /** Picks a set for a break, respecting excluded categories/exercises. Falls back to any remaining set. */
  async pickForBreak(excludedCategories: ExerciseCategory[], excludedExerciseIds: string[]): Promise<ExerciseSet | undefined> {
    const all = await this.getAll();
    const eligible = all.filter(
      (set) => !excludedCategories.includes(set.category) && !excludedExerciseIds.includes(set.id)
    );
    const pool = eligible.length > 0 ? eligible : all;
    if (pool.length === 0) return undefined;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

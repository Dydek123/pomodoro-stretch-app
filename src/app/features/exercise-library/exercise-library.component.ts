import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ExerciseSetRepository } from '../../core/persistence/exercise-set.repository';
import { ExerciseCategory, ExerciseDifficulty, ExerciseSet } from '../../shared/models/exercise-set.model';

interface FilterOption {
  value: ExerciseCategory | 'all';
  label: string;
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'full-body', label: 'Full body' },
  { value: 'eyes', label: 'Eyes' },
  { value: 'wrists', label: 'Wrists' },
  { value: 'neck', label: 'Neck' },
  { value: 'breathing', label: 'Breathing' },
];

@Component({
  selector: 'app-exercise-library',
  standalone: true,
  templateUrl: './exercise-library.component.html',
  styleUrl: './exercise-library.component.scss',
})
export class ExerciseLibraryComponent implements OnInit {
  private readonly exerciseSets = inject(ExerciseSetRepository);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<ExerciseCategory | 'all'>('all');
  protected readonly sets = signal<ExerciseSet[]>([]);
  protected readonly expandedId = signal<string | null>(null);

  protected readonly filteredSets = computed(() => {
    const filter = this.activeFilter();
    const all = this.sets();
    return filter === 'all' ? all : all.filter((s) => s.category === filter);
  });

  ngOnInit(): void {
    void this.exerciseSets.getAll().then((sets) => this.sets.set(sets));
  }

  protected setFilter(value: ExerciseCategory | 'all'): void {
    this.activeFilter.set(value);
  }

  protected categoryLabel(category: ExerciseCategory): string {
    return this.filters.find((f) => f.value === category)?.label ?? category;
  }

  protected effortLevel(difficulty: ExerciseDifficulty): number {
    return difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  }

  protected togglePreview(setId: string): void {
    this.expandedId.set(this.expandedId() === setId ? null : setId);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { ExerciseSetRepository } from '../../core/persistence/exercise-set.repository';
import { SettingsRepository } from '../../core/persistence/settings.repository';
import { ExerciseCategory, ExerciseSet } from '../../shared/models/exercise-set.model';
import { ToggleSwitchComponent } from '../../shared/ui/toggle-switch/toggle-switch.component';

interface CategoryOption {
  value: ExerciseCategory;
  label: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'full-body', label: 'Full body' },
  { value: 'eyes', label: 'Eyes (20-20-20)' },
  { value: 'wrists', label: 'Wrists' },
  { value: 'neck', label: 'Neck' },
  { value: 'breathing', label: 'Breathing' },
];

const WORK_OPTIONS = [15, 25, 30, 45, 60];
const BREAK_OPTIONS = [3, 5, 7, 10];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ToggleSwitchComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  protected readonly settingsRepo = inject(SettingsRepository);
  private readonly exerciseSets = inject(ExerciseSetRepository);

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly workOptions = WORK_OPTIONS;
  protected readonly breakOptions = BREAK_OPTIONS;
  protected readonly sets = signal<ExerciseSet[]>([]);

  ngOnInit(): void {
    void this.exerciseSets.getAll().then((sets) => this.sets.set(sets));
  }

  protected isCategoryEnabled(category: ExerciseCategory): boolean {
    return !this.settingsRepo.settings().excludedCategories.includes(category);
  }

  protected toggleCategory(category: ExerciseCategory, enabled: boolean): void {
    const current = this.settingsRepo.settings().excludedCategories;
    const next = enabled ? current.filter((c) => c !== category) : [...current, category];
    void this.settingsRepo.update({ excludedCategories: next });
  }

  protected isSetExcluded(setId: string): boolean {
    return this.settingsRepo.settings().excludedExerciseIds.includes(setId);
  }

  protected toggleSetExclusion(setId: string): void {
    const current = this.settingsRepo.settings().excludedExerciseIds;
    const next = current.includes(setId) ? current.filter((id) => id !== setId) : [...current, setId];
    void this.settingsRepo.update({ excludedExerciseIds: next });
  }

  protected setWorkMinutes(value: string): void {
    void this.settingsRepo.update({ defaultWorkMinutes: Number(value) });
  }

  protected setBreakMinutes(value: string): void {
    void this.settingsRepo.update({ defaultBreakMinutes: Number(value) });
  }

  protected setVolume(value: string): void {
    void this.settingsRepo.update({ soundVolume: Number(value) });
  }

  protected toggleAutoStart(checked: boolean): void {
    void this.settingsRepo.update({ autoStartNextSession: checked });
  }

  protected toggleSound(checked: boolean): void {
    void this.settingsRepo.update({ soundEnabled: checked });
  }

  protected toggleNotifications(checked: boolean): void {
    void this.settingsRepo.update({ browserNotificationsEnabled: checked });
  }
}

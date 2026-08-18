import { Component, computed, inject } from '@angular/core';
import { SettingsRepository } from '../../core/persistence/settings.repository';
import { TimerService } from '../../core/timer/timer.service';
import { ExerciseStep } from '../../shared/models/exercise-set.model';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { ExerciseMediaComponent } from '../../shared/ui/exercise-media/exercise-media.component';
import { ToggleSwitchComponent } from '../../shared/ui/toggle-switch/toggle-switch.component';
import { formatClock } from '../../shared/util/time.util';

@Component({
  selector: 'app-break-screen',
  standalone: true,
  imports: [ButtonComponent, ExerciseMediaComponent, ToggleSwitchComponent],
  templateUrl: './break-screen.component.html',
  styleUrl: './break-screen.component.scss',
})
export class BreakScreenComponent {
  protected readonly timer = inject(TimerService);
  protected readonly settingsRepo = inject(SettingsRepository);

  protected readonly timeLabel = computed(() => formatClock(this.timer.remainingMs()));

  protected stepMeta(step: ExerciseStep): string {
    if (step.durationSeconds) {
      const base = `${step.durationSeconds} sec`;
      return step.perSide ? `${base} / side` : base;
    }
    if (step.reps) {
      return step.perSide ? `${step.reps}× each side` : `${step.reps}×`;
    }
    return '';
  }

  protected stepBadge(step: ExerciseStep | null): string | null {
    if (!step) return null;
    if (step.reps) return `${step.reps}×`;
    if (step.durationSeconds) return `${step.durationSeconds}s`;
    return null;
  }

  protected done(): void {
    this.timer.advanceStep();
  }

  protected skip(): void {
    this.timer.advanceStep();
  }

  protected endEarly(): void {
    this.timer.endBreakEarly();
  }

  protected toggleAutoStart(checked: boolean): void {
    void this.settingsRepo.update({ autoStartNextSession: checked });
  }
}

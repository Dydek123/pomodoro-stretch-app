import { Component, input } from '@angular/core';
import { ExerciseStep } from '../../models/exercise-set.model';

@Component({
  selector: 'app-exercise-media',
  standalone: true,
  template: `
    <div class="exercise-media" [class.exercise-media--compact]="compact()">
      @if (step()?.mediaUrl; as url) {
        <img [src]="url" [alt]="step()?.text ?? ''" />
      } @else {
        <span class="exercise-media__caption">exercise animation — {{ step()?.text ?? '—' }}</span>
      }
      @if (badge()) {
        <div class="exercise-media__badge">{{ badge() }}</div>
      }
    </div>
  `,
  styleUrl: './exercise-media.component.scss',
})
export class ExerciseMediaComponent {
  step = input<ExerciseStep | null>(null);
  compact = input(false);
  badge = input<string | null>(null);
}

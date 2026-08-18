import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div class="progress-track">
      <div class="progress-fill" [style.width.%]="progress() * 100"></div>
    </div>
  `,
  styleUrl: './progress-bar.component.scss',
})
export class ProgressBarComponent {
  /** 0..1 */
  progress = input(0);
}

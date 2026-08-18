import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="stat-card" [class.stat-card--accent]="accent()">
      <span class="stat-card__label">{{ label() }}</span>
      <span class="stat-card__value">{{ value() }}<span class="stat-card__unit">{{ unit() }}</span></span>
    </div>
  `,
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  unit = input<string>('');
  accent = input(false);
}

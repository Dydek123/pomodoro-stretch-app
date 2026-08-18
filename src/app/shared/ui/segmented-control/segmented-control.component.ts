import { Component, input, output } from '@angular/core';

export interface SegmentedOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  template: `
    <div class="segmented">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          class="segmented__item"
          [class.segmented__item--active]="opt.value === value()"
          (click)="valueChange.emit(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './segmented-control.component.scss',
})
export class SegmentedControlComponent<T> {
  options = input.required<SegmentedOption<T>[]>();
  value = input<T | null>(null);
  valueChange = output<T>();
}

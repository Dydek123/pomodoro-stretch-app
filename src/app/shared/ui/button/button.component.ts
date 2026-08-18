import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="btn"
      [class.btn--ghost]="variant() === 'ghost'"
      [class.btn--dark]="variant() === 'dark'"
      [class.btn--lg]="size() === 'lg'"
      [disabled]="disabled()"
      (click)="pressed.emit()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  variant = input<'primary' | 'ghost' | 'dark'>('primary');
  size = input<'md' | 'lg'>('md');
  disabled = input(false);
  pressed = output<void>();
}

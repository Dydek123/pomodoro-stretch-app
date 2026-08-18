import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  template: `
    <button
      type="button"
      class="toggle"
      role="switch"
      [attr.aria-checked]="checked()"
      [class.toggle--on]="checked()"
      [disabled]="disabled()"
      (click)="checkedChange.emit(!checked())"
    >
      <span class="toggle__knob"></span>
    </button>
  `,
  styleUrl: './toggle-switch.component.scss',
})
export class ToggleSwitchComponent {
  checked = input(false);
  disabled = input(false);
  checkedChange = output<boolean>();
}

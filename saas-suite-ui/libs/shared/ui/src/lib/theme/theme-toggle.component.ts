import { Component, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { ThemeService } from './theme.service';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  imports: [MatIconButton, MatIcon, MatTooltip],
  template: `
    <button
      mat-icon-button
      [matTooltip]="tooltip()"
      (click)="themeService.toggle()"
      aria-label="Toggle theme"
    >
      <mat-icon>{{ icon() }}</mat-icon>
    </button>
  `,
  styles: `
    button {
      color: inherit;
    }
  `,
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  readonly icon = computed(() =>
    this.themeService.theme() === 'dark' ? 'light_mode' : 'dark_mode'
  );

  readonly tooltip = computed(() =>
    this.themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

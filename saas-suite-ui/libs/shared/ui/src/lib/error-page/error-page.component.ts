import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'saas-error-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <mat-icon class="error-icon">{{ icon }}</mat-icon>
      <h1>{{ code }}</h1>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      @if (correlationId) { <code>Correlation ID: {{ correlationId }}</code> }
      <button mat-raised-button color="primary" routerLink="/">Voltar ao início</button>
    </div>
  `,
  styles: [`
    .error-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
    .error-icon { font-size: 80px; width: 80px; height: 80px; color: #f44336; }
    h1 { font-size: 72px; margin: 0; }
    code { display: block; margin: 16px 0; font-size: 12px; color: #666; }
  `],
})
export class ErrorPageComponent {
  @Input() code = '500';
  @Input() title = 'Algo deu errado';
  @Input() message = 'Por favor, tente novamente.';
  @Input() icon = 'error_outline';
  @Input() correlationId?: string;
}

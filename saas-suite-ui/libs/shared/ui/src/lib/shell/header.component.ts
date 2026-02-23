import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthStore } from '@saas-suite/shared/auth';
import { AuthService } from '@saas-suite/shared/auth';
import { TenantSwitcherComponent } from '../tenant-switcher/tenant-switcher.component';

@Component({
  selector: 'saas-header',
  standalone: true,
  imports: [
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatDividerModule, TenantSwitcherComponent,
  ],
  template: `
    <mat-toolbar color="primary" class="header">
      <button mat-icon-button (click)="menuToggle.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="app-title">{{ appTitle }}</span>
      <span class="spacer"></span>
      <saas-tenant-switcher />
      <button mat-icon-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item disabled>{{ auth.session()?.email }}</button>
        <mat-divider />
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon> Sair
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .header { position: sticky; top: 0; z-index: 100; }
    .app-title { font-weight: 600; margin-left: 8px; }
    .spacer { flex: 1; }
  `],
})
export class HeaderComponent {
  @Input() appTitle = 'SaaS Suite';
  @Output() menuToggle = new EventEmitter<void>();
  protected auth = inject(AuthStore);
  private authService = inject(AuthService);

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}

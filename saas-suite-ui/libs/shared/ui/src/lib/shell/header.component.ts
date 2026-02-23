import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore } from '@saas-suite/shared/auth';
import { AuthService } from '@saas-suite/shared/auth';
import { TenantSwitcherComponent } from '../tenant-switcher/tenant-switcher.component';

@Component({
  selector: 'saas-header',
  standalone: true,
  imports: [
    UpperCasePipe, MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatDividerModule, MatTooltipModule, TenantSwitcherComponent,
  ],
  template: `
    <header class="app-header">
      <div class="header-left">
        <button class="menu-btn" (click)="menuToggle.emit()" matTooltip="Menu">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="app-title">{{ appTitle }}</span>
      </div>
      <div class="header-right">
        <saas-tenant-switcher />
        <button class="avatar-btn" [matMenuTriggerFor]="userMenu">
          <div class="avatar">
            {{ (auth.session()?.email ?? 'U')[0] | uppercase }}
          </div>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="user-menu-header">
            <strong>{{ auth.session()?.email }}</strong>
            <span class="user-role">{{ auth.session()?.roles?.[0] ?? 'user' }}</span>
          </div>
          <mat-divider />
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon> Sair
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 16px 0 8px;
      background: var(--app-header-bg, #fff);
      box-shadow: var(--app-header-shadow, 0 1px 4px rgba(0,0,0,0.08));
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      color: var(--app-text-secondary, #546e7a);
      transition: background 0.15s;
    }
    .menu-btn:hover { background: rgba(0,0,0,0.06); }

    .app-title {
      font-weight: 600;
      font-size: 15px;
      color: var(--app-text, #263238);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--app-primary, #1565c0);
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-menu-header {
      padding: 12px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .user-menu-header strong { font-size: 13px; }
    .user-role {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
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

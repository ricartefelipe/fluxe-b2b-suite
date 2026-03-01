import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '@saas-suite/shared/auth';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { NavItem } from './nav-item.model';

@Component({
  selector: 'saas-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="sidebar">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true">
          <mat-icon>dashboard</mat-icon>
        </div>
        <div class="brand-text">
          <span class="brand-name">Union Solutions</span>
          <span class="brand-sub">{{ appTitle }}</span>
        </div>
      </div>
      <nav class="nav-list" role="navigation" aria-label="Main navigation">
        @for (item of visibleItems(); track item.route) {
          <a
            class="nav-item"
            [routerLink]="item.route"
            routerLinkActive="active"
            #rla="routerLinkActive"
            [attr.aria-current]="rla.isActive ? 'page' : null"
            [attr.aria-label]="item.label">
            <mat-icon class="nav-icon" aria-hidden="true">{{ item.icon }}</mat-icon>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </nav>
      <div class="sidebar-footer" aria-hidden="true">
        <span class="version">v1.0.0</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--app-sidebar-bg, #0d1b2a);
      color: var(--app-sidebar-text, #b0bec5);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--app-primary, #1565c0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .brand-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
    }
    .brand-sub {
      font-size: 10px;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .nav-list {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--app-sidebar-text, #b0bec5);
      font-size: 13px;
      font-weight: 500;
      transition: all 0.15s;
      cursor: pointer;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .nav-item:focus-visible {
      outline: 2px solid var(--app-primary, #1565c0);
      outline-offset: -2px;
    }
    .nav-item.active {
      background: var(--app-primary, #1565c0);
      color: #fff;
      font-weight: 600;
    }
    .nav-item.active .nav-icon { color: #fff; }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(255,255,255,0.5);
      transition: color 0.15s;
    }

    .nav-label { line-height: 1; }

    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .version {
      font-size: 10px;
      color: rgba(255,255,255,0.25);
      letter-spacing: 0.5px;
    }
  `],
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];
  @Input() appTitle = '';
  private auth = inject(AuthStore);
  private config = inject(RuntimeConfigService);

  visibleItems(): NavItem[] {
    if (this.config.get('authMode') === 'dev') {
      return this.navItems;
    }
    return this.navItems.filter(
      item => !item.permission || this.auth.hasPermission(item.permission),
    );
  }
}

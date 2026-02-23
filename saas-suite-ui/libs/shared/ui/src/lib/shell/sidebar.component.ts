import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '@saas-suite/shared/auth';
import { NavItem } from './nav-item.model';

@Component({
  selector: 'saas-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <div class="sidebar">
      <div class="sidebar-brand">{{ appTitle }}</div>
      <mat-nav-list>
        @for (item of visibleItems(); track item.route) {
          <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        }
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidebar { height: 100%; }
    .sidebar-brand {
      padding: 16px; font-weight: 700; font-size: 13px;
      color: #888; text-transform: uppercase; letter-spacing: 1px;
    }
    ::ng-deep .active-link { background: rgba(25, 118, 210, 0.1) !important; }
  `],
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];
  @Input() appTitle = '';
  private auth = inject(AuthStore);

  visibleItems() {
    return this.navItems.filter(
      item => !item.permission || this.auth.hasPermission(item.permission),
    );
  }
}

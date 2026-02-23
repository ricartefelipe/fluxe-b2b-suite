import { Component, Input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { NavItem } from './nav-item.model';

@Component({
  selector: 'saas-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="!sidebarOpen()">
      <aside class="shell-sidebar" [class.open]="sidebarOpen()">
        <saas-sidebar [navItems]="navItems" [appTitle]="appTitle" />
      </aside>
      <div class="shell-content">
        <saas-header [appTitle]="appTitle" (menuToggle)="toggleSidebar()" />
        <main class="shell-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .shell {
      display: flex;
      height: 100%;
    }

    .shell-sidebar {
      width: 250px;
      min-width: 250px;
      height: 100vh;
      transition: margin-left 0.2s ease;
      overflow: hidden;
    }
    .shell-sidebar:not(.open) {
      margin-left: -250px;
    }

    .shell-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100vh;
    }

    .shell-main {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: var(--app-bg, #f4f6f9);
    }
  `],
})
export class ShellComponent {
  @Input() navItems: NavItem[] = [];
  @Input() appTitle = 'SaaS Suite';
  sidebarOpen = signal(true);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
}

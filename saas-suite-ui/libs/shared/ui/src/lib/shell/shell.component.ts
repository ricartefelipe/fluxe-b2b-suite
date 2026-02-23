import { Component, Input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { NavItem } from './nav-item.model';

@Component({
  selector: 'saas-shell',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, HeaderComponent, SidebarComponent],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #sidenav mode="side" [opened]="sidebarOpen()" class="shell-sidenav">
        <saas-sidebar [navItems]="navItems" [appTitle]="appTitle" />
      </mat-sidenav>
      <mat-sidenav-content>
        <saas-header [appTitle]="appTitle" (menuToggle)="toggleSidebar()" />
        <main class="shell-main">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }
    .shell-sidenav { width: 240px; }
    .shell-main { padding: 24px; overflow-y: auto; height: calc(100vh - 64px); }
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

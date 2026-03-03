import { Component, HostListener, Input, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { NavItem } from './nav-item.model';
import { SkipLinkComponent } from '../a11y/skip-link.component';
import { FocusOnNavDirective } from '../a11y/focus-on-nav.directive';

const MOBILE_BREAKPOINT = 768;

@Component({
  selector: 'saas-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, SkipLinkComponent, FocusOnNavDirective],
  template: `
    <saas-skip-link />
    @if (isMobile() && sidebarOpen()) {
      <div class="sidebar-overlay" (click)="closeSidebar()" aria-hidden="true"></div>
    }
    <div class="shell" [class.sidebar-collapsed]="!sidebarOpen()" [class.mobile]="isMobile()">
      <aside
        class="shell-sidebar"
        [class.open]="sidebarOpen()"
        [class.mobile-drawer]="isMobile()"
        role="complementary"
        aria-label="Sidebar">
        <saas-sidebar [navItems]="navItems" [appTitle]="appTitle" />
      </aside>
      <div class="shell-content">
        <saas-header [appTitle]="appTitle" (menuToggle)="toggleSidebar()" />
        <main id="main-content" class="shell-main" saasFocusOnNav>
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

    .shell-sidebar.mobile-drawer {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 200;
      transition: transform 0.25s ease;
      margin-left: 0;
    }
    .shell-sidebar.mobile-drawer:not(.open) {
      transform: translateX(-100%);
      margin-left: 0;
    }
    .shell-sidebar.mobile-drawer.open {
      transform: translateX(0);
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 199;
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

    .shell-main:focus {
      outline: none;
    }

    @media (max-width: 768px) {
      .shell-main {
        padding: 16px;
      }
    }
  `],
})
export class ShellComponent implements OnInit {
  @Input() navItems: NavItem[] = [];
  @Input() appTitle = 'SaaS Suite';
  sidebarOpen = signal(true);
  isMobile = signal(false);

  ngOnInit(): void {
    this.checkViewport();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private checkViewport(): void {
    if (!this.isBrowser) return;
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    this.isMobile.set(mobile);
    if (mobile && this.sidebarOpen()) {
      this.sidebarOpen.set(false);
    }
  }
}

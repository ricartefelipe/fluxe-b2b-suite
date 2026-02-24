import { Component } from '@angular/core';

@Component({
  selector: 'saas-skip-link',
  standalone: true,
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
  `,
  styles: [`
    .skip-link {
      position: absolute;
      top: -100%;
      left: 16px;
      z-index: 10000;
      padding: 8px 16px;
      background: var(--app-primary, #1976d2);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 0 0 8px 8px;
      transition: top 0.2s ease;
    }

    .skip-link:focus {
      top: 0;
      outline: 2px solid var(--app-primary, #1976d2);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .skip-link {
        transition: none;
      }
    }
  `],
})
export class SkipLinkComponent {}

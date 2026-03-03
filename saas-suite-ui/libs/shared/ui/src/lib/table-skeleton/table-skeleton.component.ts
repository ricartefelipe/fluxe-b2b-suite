import { Component, Input } from '@angular/core';

@Component({
  selector: 'saas-table-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-table" role="progressbar" aria-label="Carregando dados...">
      <div class="skeleton-header">
        @for (col of colWidths; track $index) {
          <div class="skeleton-line header-cell" [style.width]="col"></div>
        }
      </div>
      @for (row of rows; track $index) {
        <div class="skeleton-row" [style.animation-delay]="($index * 50) + 'ms'">
          @for (col of colWidths; track $index) {
            <div class="skeleton-line" [style.width]="col"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-table {
      width: 100%;
      background: var(--app-surface, #fff);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
      box-shadow: var(--app-shadow, 0 1px 3px rgba(0,0,0,0.06));
    }
    .skeleton-header {
      display: flex;
      gap: var(--space-4, 16px);
      padding: var(--space-4, 16px) var(--space-6, 24px);
      background: var(--app-surface-variant, #f8fafc);
    }
    .skeleton-header .header-cell {
      height: 10px;
      opacity: 0.6;
    }
    .skeleton-row {
      display: flex;
      gap: var(--space-4, 16px);
      padding: var(--space-5, 20px) var(--space-6, 24px);
      border-bottom: 1px solid var(--app-border, #e0e0e0);
      animation: staggerIn var(--transition-base, 200ms ease) both;
    }
    .skeleton-row:last-child {
      border-bottom: none;
    }
    .skeleton-line {
      height: 14px;
      border-radius: var(--radius-sm, 4px);
      background: linear-gradient(
        90deg,
        var(--app-surface-variant, #f8fafc) 25%,
        var(--app-border, #e0e0e0) 50%,
        var(--app-surface-variant, #f8fafc) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes staggerIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class TableSkeletonComponent {
  @Input() rowCount = 5;
  @Input() columns = 4;
  @Input() columnWidths: string[] = [];

  get rows(): number[] {
    return Array.from({ length: this.rowCount });
  }

  get colWidths(): string[] {
    if (this.columnWidths.length > 0) return this.columnWidths;
    const widths = ['15%', '25%', '20%', '15%', '15%', '10%'];
    return widths.slice(0, this.columns);
  }
}

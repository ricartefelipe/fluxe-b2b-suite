import { Component, HostListener, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { GlobalSearchComponent } from './global-search.component';
import { SearchService } from './search.service';

@Component({
  selector: 'saas-search-trigger',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button class="search-trigger" (click)="openSearch()" aria-label="Open search">
      <mat-icon class="trigger-icon">search</mat-icon>
      <span class="trigger-label">Search...</span>
      <kbd class="trigger-kbd">
        <span class="trigger-kbd-mod">Ctrl</span>
        <span class="trigger-kbd-key">K</span>
      </kbd>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }

    .search-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 34px;
      padding: 0 10px 0 8px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.03);
      cursor: pointer;
      transition: all 0.15s;
      color: #6b7280;
      font-family: inherit;
    }
    .search-trigger:hover {
      background: rgba(0, 0, 0, 0.06);
      border-color: rgba(0, 0, 0, 0.18);
    }

    .trigger-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #9ca3af;
    }

    .trigger-label {
      font-size: 13px;
      color: #9ca3af;
      white-space: nowrap;
    }

    .trigger-kbd {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-left: 4px;
    }

    .trigger-kbd-mod,
    .trigger-kbd-key {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      padding: 1px 4px;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      background: #f9fafb;
      color: #9ca3af;
      line-height: 1.4;
    }
  `],
})
export class SearchTriggerComponent {
  private readonly dialog = inject(MatDialog);
  private readonly searchService = inject(SearchService);
  private dialogOpen = false;

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  openSearch(): void {
    if (this.dialogOpen) return;

    this.dialogOpen = true;
    const ref = this.dialog.open(GlobalSearchComponent, {
      width: '640px',
      maxWidth: '90vw',
      position: { top: '80px' },
      panelClass: 'global-search-panel',
      backdropClass: 'global-search-backdrop',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    ref.afterClosed().subscribe(() => {
      this.dialogOpen = false;
      this.searchService.clear();
    });
  }
}

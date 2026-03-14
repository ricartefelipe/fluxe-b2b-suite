import {
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  viewChildren,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SearchResult, SearchEntityType, ENTITY_LABELS } from './search.model';
import { SearchService } from './search.service';

interface ResultGroup {
  entityType: SearchEntityType;
  label: string;
  results: (SearchResult & { flatIndex: number })[];
}

@Component({
  selector: 'saas-global-search',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="gs-container">
      <div class="gs-input-row">
        <mat-icon class="gs-search-icon">search</mat-icon>
        <input
          class="gs-input"
          placeholder="Search orders, products, tenants, payments..."
          [value]="searchService.query()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          #searchInput
          autocomplete="off"
          spellcheck="false" />
        @if (searchService.query()) {
          <button class="gs-clear-btn" (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        }
        <kbd class="gs-kbd">Esc</kbd>
      </div>

      <div class="gs-body">
        @if (searchService.loading()) {
          <div class="gs-loading">
            <mat-spinner diameter="28"></mat-spinner>
            <span>Searching...</span>
          </div>
        }

        @if (!searchService.loading() && searchService.query() && totalResults() === 0) {
          <div class="gs-empty">
            <mat-icon>search_off</mat-icon>
            <span>No results found for "{{ searchService.query() }}"</span>
          </div>
        }

        @if (!searchService.loading() && searchService.error()) {
          <div class="gs-error">
            <mat-icon>error_outline</mat-icon>
            <span>{{ searchService.error() }}</span>
          </div>
        }

        @if (!searchService.query()) {
          <div class="gs-hint">
            <mat-icon>tips_and_updates</mat-icon>
            <span>Type to search across all entities</span>
          </div>
        }

        @for (group of groups(); track group.entityType) {
          <div class="gs-group-header">
            <span class="gs-group-label">{{ group.label }}</span>
            <span class="gs-group-count">{{ group.results.length }}</span>
          </div>
          @for (result of group.results; track result.id) {
            <div
              class="gs-result-item"
              [class.gs-result-selected]="selectedIndex() === result.flatIndex"
              (click)="selectResult(result)"
              (mouseenter)="selectedIndex.set(result.flatIndex)"
              #resultItem>
              <mat-icon class="gs-result-icon">{{ result.icon }}</mat-icon>
              <div class="gs-result-text">
                <span class="gs-result-title" [innerHTML]="highlightMatch(result.title)"></span>
                <span class="gs-result-subtitle" [innerHTML]="highlightMatch(result.subtitle)"></span>
              </div>
              <mat-icon class="gs-result-arrow">subdirectory_arrow_left</mat-icon>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .global-search-panel {
      max-width: 680px !important;
      width: 90vw !important;
    }

    .global-search-panel .mat-mdc-dialog-container .mat-mdc-dialog-surface {
      border-radius: 16px;
      overflow: hidden;
      box-shadow:
        0 24px 48px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(0, 0, 0, 0.05);
    }

    .global-search-backdrop {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
    }

    .gs-container {
      display: flex;
      flex-direction: column;
      max-height: 70vh;
    }

    .gs-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .gs-search-icon {
      color: #6b7280;
      font-size: 22px;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    .gs-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      font-family: inherit;
      background: transparent;
      color: #1f2937;
      line-height: 1.5;
    }
    .gs-input::placeholder {
      color: #9ca3af;
    }

    .gs-clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      transition: all 0.15s;
    }
    .gs-clear-btn:hover {
      background: rgba(0, 0, 0, 0.06);
      color: #6b7280;
    }
    .gs-clear-btn .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .gs-kbd {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      padding: 2px 6px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      color: #9ca3af;
      background: #f9fafb;
      flex-shrink: 0;
    }

    .gs-body {
      overflow-y: auto;
      padding: 8px 0;
      min-height: 60px;
      max-height: calc(70vh - 56px);
    }

    .gs-loading,
    .gs-empty,
    .gs-error,
    .gs-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 32px 16px;
      color: #9ca3af;
      font-size: 14px;
    }
    .gs-error {
      color: #ef4444;
    }
    .gs-hint .mat-icon,
    .gs-empty .mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .gs-group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px 4px;
    }

    .gs-group-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #9ca3af;
    }

    .gs-group-count {
      font-size: 10px;
      font-weight: 600;
      color: #9ca3af;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 10px;
      padding: 1px 6px;
    }

    .gs-result-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 20px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .gs-result-item:hover,
    .gs-result-selected {
      background: rgba(59, 130, 246, 0.06);
    }
    .gs-result-selected {
      background: rgba(59, 130, 246, 0.1);
    }

    .gs-result-icon {
      color: #6b7280;
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .gs-result-selected .gs-result-icon {
      color: #3b82f6;
    }

    .gs-result-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .gs-result-title {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .gs-result-subtitle {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .gs-result-title mark,
    .gs-result-subtitle mark {
      background: rgba(250, 204, 21, 0.4);
      color: inherit;
      border-radius: 2px;
      padding: 0 1px;
    }

    .gs-result-arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #d1d5db;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.1s;
    }
    .gs-result-selected .gs-result-arrow {
      opacity: 1;
      color: #3b82f6;
    }
  `],
})
export class GlobalSearchComponent {
  protected readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<GlobalSearchComponent>);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resultItemRefs = viewChildren<ElementRef>('resultItem');

  readonly selectedIndex = signal(0);

  readonly totalResults = computed(() => this.searchService.results().length);

  readonly groups = computed<ResultGroup[]>(() => {
    const results = this.searchService.results();
    const grouped: ResultGroup[] = [];
    const entityOrder: SearchEntityType[] = [
      'tenant', 'order', 'payment', 'product', 'inventory', 'audit',
    ];
    let flatIndex = 0;

    for (const type of entityOrder) {
      const items = results.filter(r => r.entityType === type);
      if (items.length > 0) {
        grouped.push({
          entityType: type,
          label: ENTITY_LABELS[type],
          results: items.map(item => ({ ...item, flatIndex: flatIndex++ })),
        });
      }
    }

    return grouped;
  });

  constructor() {
    effect(() => {
      const idx = this.selectedIndex();
      const refs = this.resultItemRefs();
      refs[idx]?.nativeElement.scrollIntoView({ block: 'nearest' });
    });

    this.destroyRef.onDestroy(() => this.searchService.clear());
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedIndex.set(0);
    this.searchService.search(value);
  }

  clearSearch(): void {
    this.searchService.clear();
    this.selectedIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const total = this.totalResults();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(i => (i < total - 1 ? i + 1 : 0));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(i => (i > 0 ? i - 1 : total - 1));
        break;

      case 'Enter':
        event.preventDefault();
        this.selectByIndex(this.selectedIndex());
        break;
    }
  }

  selectResult(result: SearchResult): void {
    this.dialogRef.close();
    this.router.navigateByUrl(result.url);
  }

  highlightMatch(text: string): string {
    const query = this.searchService.query();
    if (!query) return text;

    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return safe.replace(regex, '<mark>$1</mark>');
  }

  private selectByIndex(index: number): void {
    const allResults = this.searchService.results();
    if (allResults[index]) {
      this.selectResult(allResults[index]);
    }
  }
}

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ProductsService, CartService } from '@union.solutions/shop/data';
import { Product, ProductFilter, ProductSortField, SortOrder } from '@union.solutions/models';
import { MESSAGES } from '@saas-suite/shared/i18n';
import {
  ProductGridComponent,
  ErrorMessageComponent,
  ViewMode,
} from '@union.solutions/shop/shared-ui';

interface SortOption {
  label: string;
  field: ProductSortField;
  order: SortOrder;
}

@Component({
  selector: 'shop-product-list',
  imports: [
    CommonModule,
    FormsModule,
    ProductGridComponent,
    ErrorMessageComponent,
  ],
  template: `
    <div class="catalog-layout" [class.sidebar-open]="sidebarOpen()">
      <!-- ── Mobile filter toggle ── -->
      <button
        class="btn-filter-toggle"
        (click)="sidebarOpen.set(!sidebarOpen())"
        [attr.aria-expanded]="sidebarOpen()"
        aria-controls="sidebar-filters"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
          <line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
        {{ msg.shop.filtersTitle }}
      </button>

      <!-- ── Sidebar Filters ── -->
      <aside
        id="sidebar-filters"
        class="sidebar"
        [class.open]="sidebarOpen()"
      >
        <div class="sidebar-header">
          <h2>{{ msg.shop.filtersTitle }}</h2>
          <button class="btn-close-sidebar" (click)="sidebarOpen.set(false)" [attr.aria-label]="msg.common.close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="filter-group">
          <div class="search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              class="search-input"
              [class.has-value]="searchTerm"
              [placeholder]="msg.shop.searchProducts"
              [(ngModel)]="searchTerm"
              (ngModelChange)="searchSubject.next($event)"
            />
            @if (searchTerm) {
              <button
                class="search-clear-btn"
                (click)="clearSearch()"
                [attr.aria-label]="msg.common.close"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Categories -->
        <div class="filter-group">
          <h3 class="filter-title">{{ msg.shop.categories }}</h3>
          <label class="filter-checkbox">
            <input
              type="radio"
              name="category"
              [value]="''"
              [(ngModel)]="selectedCategory"
              (ngModelChange)="onFilterChange()"
            />
            <span>{{ msg.shop.allCategories }}</span>
          </label>
          @for (cat of categories(); track cat) {
            <label class="filter-checkbox">
              <input
                type="radio"
                name="category"
                [value]="cat"
                [(ngModel)]="selectedCategory"
                (ngModelChange)="onFilterChange()"
              />
              <span>{{ cat }}</span>
            </label>
          }
        </div>

        <!-- Price range -->
        <div class="filter-group">
          <h3 class="filter-title">{{ msg.shop.price }}</h3>
          <div class="price-inputs">
            <div class="price-field">
              <label>{{ msg.shop.minPrice }}</label>
              <input
                type="number"
                class="price-input"
                [(ngModel)]="minPrice"
                (ngModelChange)="onFilterChange()"
                [placeholder]="'0'"
                min="0"
              />
            </div>
            <span class="price-separator">–</span>
            <div class="price-field">
              <label>{{ msg.shop.maxPrice }}</label>
              <input
                type="number"
                class="price-input"
                [(ngModel)]="maxPrice"
                (ngModelChange)="onFilterChange()"
                [placeholder]="'∞'"
                min="0"
              />
            </div>
          </div>
        </div>

        <!-- Availability -->
        <div class="filter-group">
          <h3 class="filter-title">{{ msg.shop.availability }}</h3>
          <label class="filter-toggle">
            <input
              type="checkbox"
              [(ngModel)]="inStockOnly"
              (ngModelChange)="onFilterChange()"
            />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
            <span>{{ msg.shop.inStockOnly }}</span>
          </label>
        </div>
      </aside>

      <!-- ── Main content ── -->
      <main class="main-content">
        <!-- Active filter chips -->
        @if (hasActiveFilters()) {
          <div class="active-filters">
            <span class="active-filters-label">{{ msg.shop.activeFilters }}:</span>
            @if (selectedCategory) {
              <button class="chip" (click)="clearCategory()">
                {{ selectedCategory }} ×
              </button>
            }
            @if (inStockOnly) {
              <button class="chip" (click)="clearInStock()">
                {{ msg.shop.inStockOnly }} ×
              </button>
            }
            @if (minPrice !== null || maxPrice !== null) {
              <button class="chip" (click)="clearPriceRange()">
                {{ msg.shop.price }}: {{ minPrice ?? 0 }}–{{ maxPrice ?? '∞' }} ×
              </button>
            }
            @if (searchTerm) {
              <button class="chip" (click)="clearSearch()">
                "{{ searchTerm }}" ×
              </button>
            }
            <button class="chip chip--clear" (click)="clearAllFilters()">
              {{ msg.shop.clearFilters }}
            </button>
          </div>
        }

        <!-- Toolbar -->
        <div class="toolbar">
          <span class="results-count">
            {{ showingRangeText() }}
          </span>

          <div class="toolbar-actions">
            <!-- Sort -->
            <div class="sort-control">
              <label class="sort-label" for="sort-select">{{ msg.shop.sortBy }}:</label>
              <select
                id="sort-select"
                class="sort-select"
                [(ngModel)]="selectedSortIndex"
                (ngModelChange)="onSortChange()"
              >
                @for (opt of sortOptions; track opt.label; let i = $index) {
                  <option [ngValue]="i">{{ opt.label }}</option>
                }
              </select>
            </div>

            <!-- View toggle -->
            <div class="view-toggle" role="radiogroup" [attr.aria-label]="msg.shop.gridView">
              <button
                class="view-btn"
                [class.active]="viewMode() === 'grid'"
                (click)="viewMode.set('grid')"
                [attr.aria-label]="msg.shop.gridView"
                [attr.aria-pressed]="viewMode() === 'grid'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button
                class="view-btn"
                [class.active]="viewMode() === 'list'"
                (click)="viewMode.set('list')"
                [attr.aria-label]="msg.shop.listView"
                [attr.aria-pressed]="viewMode() === 'list'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Grid / error -->
        @if (error()) {
          <shop-error-message
            [message]="error() || undefined"
            (retry)="loadProducts()"
          />
        } @else {
          <shop-product-grid
            [products]="products()"
            [loading]="loading()"
            [viewMode]="viewMode()"
            (productSelect)="onProductSelect($event)"
            (addToCart)="onAddToCart($event)"
          />
        }

        <!-- Pagination -->
        @if (!loading() && !error() && totalPages() > 1) {
          <nav class="pagination" aria-label="Pagination">
            <button
              class="page-btn"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
              [attr.aria-label]="msg.common.previous"
            >
              ←
            </button>

            @for (p of paginationRange(); track p) {
              @if (p === -1) {
                <span class="page-ellipsis">…</span>
              } @else {
                <button
                  class="page-btn"
                  [class.active]="p === currentPage()"
                  (click)="goToPage(p)"
                  [attr.aria-label]="'Page ' + p"
                  [attr.aria-current]="p === currentPage() ? 'page' : null"
                >
                  {{ p }}
                </button>
              }
            }

            <button
              class="page-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)"
              [attr.aria-label]="msg.common.next"
            >
              →
            </button>
          </nav>

          <p class="pagination-info">
            {{ showingRangeText() }}
          </p>
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --sidebar-width: 260px;
      --transition-speed: 0.2s;
    }

    /* ── Layout ── */
    .catalog-layout {
      display: grid;
      grid-template-columns: var(--sidebar-width) 1fr;
      gap: 28px;
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    /* ── Mobile filter toggle ── */
    .btn-filter-toggle {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: 1px solid var(--shop-border);
      border-radius: 8px;
      background: var(--shop-surface);
      color: var(--shop-text);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: border-color var(--transition-speed) ease;
      margin-bottom: 12px;
    }

    .btn-filter-toggle:hover {
      border-color: var(--shop-primary);
    }

    /* ── Sidebar ── */
    .sidebar {
      position: sticky;
      top: 24px;
      align-self: start;
      background: var(--shop-surface);
      border: 1px solid var(--shop-border);
      border-radius: 12px;
      padding: 20px;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .sidebar-header h2 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--shop-text);
    }

    .btn-close-sidebar {
      display: none;
      background: none;
      border: none;
      color: var(--shop-text-secondary);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .btn-close-sidebar:hover {
      color: var(--shop-text);
    }

    /* Search */
    .search-box {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--shop-text-secondary);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 36px;
      font-size: 0.875rem;
      border: 1px solid var(--shop-border);
      border-radius: 8px;
      background: var(--shop-bg);
      color: var(--shop-text);
      transition: border-color var(--transition-speed) ease;
    }

    .search-input.has-value {
      padding-right: 36px;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--shop-primary);
    }

    .search-input::placeholder {
      color: var(--shop-text-secondary);
    }

    .search-clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: var(--shop-border);
      color: var(--shop-text-secondary);
      cursor: pointer;
      transition:
        background var(--transition-speed) ease,
        color var(--transition-speed) ease;
    }

    .search-clear-btn:hover {
      background: var(--shop-error);
      color: #fff;
    }

    /* Filter groups */
    .filter-group {
      padding: 16px 0;
      border-bottom: 1px solid var(--shop-border);
    }

    .filter-group:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .filter-group:first-child {
      padding-top: 0;
    }

    .filter-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--shop-text-secondary);
      margin: 0 0 12px;
    }

    .filter-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 0;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--shop-text);
      transition: color var(--transition-speed) ease;
    }

    .filter-checkbox:hover {
      color: var(--shop-primary);
    }

    .filter-checkbox input {
      accent-color: var(--shop-primary);
    }

    /* Price inputs */
    .price-inputs {
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    .price-field {
      flex: 1;
    }

    .price-field label {
      display: block;
      font-size: 0.75rem;
      color: var(--shop-text-secondary);
      margin-bottom: 4px;
    }

    .price-input {
      width: 100%;
      padding: 8px 10px;
      font-size: 0.85rem;
      border: 1px solid var(--shop-border);
      border-radius: 6px;
      background: var(--shop-bg);
      color: var(--shop-text);
      transition: border-color var(--transition-speed) ease;
    }

    .price-input:focus {
      outline: none;
      border-color: var(--shop-primary);
    }

    .price-separator {
      padding-bottom: 8px;
      color: var(--shop-text-secondary);
    }

    /* Toggle */
    .filter-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--shop-text);
    }

    .filter-toggle input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .toggle-track {
      position: relative;
      width: 36px;
      height: 20px;
      background: var(--shop-border);
      border-radius: 10px;
      transition: background var(--transition-speed) ease;
      flex-shrink: 0;
    }

    .toggle-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: var(--shop-surface);
      border-radius: 50%;
      transition: transform var(--transition-speed) ease;
    }

    .filter-toggle input:checked + .toggle-track {
      background: var(--shop-primary);
    }

    .filter-toggle input:checked + .toggle-track .toggle-thumb {
      transform: translateX(16px);
    }

    /* ── Active filters / chips ── */
    .active-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .active-filters-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--shop-text-secondary);
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      font-size: 0.8rem;
      border: 1px solid var(--shop-border);
      border-radius: 20px;
      background: var(--shop-bg);
      color: var(--shop-text);
      cursor: pointer;
      transition:
        background var(--transition-speed) ease,
        border-color var(--transition-speed) ease;
    }

    .chip:hover {
      background: var(--shop-error-bg);
      border-color: var(--shop-error);
      color: var(--shop-error);
    }

    .chip--clear {
      background: transparent;
      border-color: var(--shop-error);
      color: var(--shop-error);
    }

    .chip--clear:hover {
      background: var(--shop-error-bg);
    }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .results-count {
      font-size: 0.875rem;
      color: var(--shop-text-secondary);
      white-space: nowrap;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sort-control {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sort-label {
      font-size: 0.8rem;
      color: var(--shop-text-secondary);
      white-space: nowrap;
    }

    .sort-select {
      padding: 6px 10px;
      font-size: 0.85rem;
      border: 1px solid var(--shop-border);
      border-radius: 6px;
      background: var(--shop-surface);
      color: var(--shop-text);
      cursor: pointer;
      transition: border-color var(--transition-speed) ease;
    }

    .sort-select:focus {
      outline: none;
      border-color: var(--shop-primary);
    }

    .view-toggle {
      display: flex;
      border: 1px solid var(--shop-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px 10px;
      border: none;
      background: var(--shop-surface);
      color: var(--shop-text-secondary);
      cursor: pointer;
      transition:
        background var(--transition-speed) ease,
        color var(--transition-speed) ease;
    }

    .view-btn + .view-btn {
      border-left: 1px solid var(--shop-border);
    }

    .view-btn.active {
      background: var(--shop-primary);
      color: #fff;
    }

    .view-btn:hover:not(.active) {
      background: var(--shop-hover);
    }

    /* ── Pagination ── */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      margin-top: 40px;
    }

    .page-btn {
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--shop-border);
      border-radius: 8px;
      background: var(--shop-surface);
      color: var(--shop-text);
      font-size: 0.875rem;
      cursor: pointer;
      transition:
        background var(--transition-speed) ease,
        border-color var(--transition-speed) ease,
        color var(--transition-speed) ease;
    }

    .page-btn:hover:not(:disabled):not(.active) {
      background: var(--shop-hover);
      border-color: var(--shop-primary);
    }

    .page-btn.active {
      background: var(--shop-primary);
      color: #fff;
      border-color: var(--shop-primary);
      font-weight: 600;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-ellipsis {
      min-width: 36px;
      text-align: center;
      color: var(--shop-text-secondary);
      user-select: none;
    }

    .pagination-info {
      text-align: center;
      margin-top: 10px;
      font-size: 0.8rem;
      color: var(--shop-text-secondary);
    }

    /* ── Responsive ── */
    @media (max-width: 960px) {
      .catalog-layout {
        grid-template-columns: 1fr;
        padding: 16px;
      }

      .btn-filter-toggle {
        display: inline-flex;
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 300px;
        max-width: 85vw;
        max-height: 100vh;
        border-radius: 0;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        box-shadow: none;
      }

      .sidebar.open {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
      }

      .btn-close-sidebar {
        display: flex;
      }

      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .toolbar-actions {
        justify-content: space-between;
      }
    }

    @media (max-width: 480px) {
      .sort-label {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly msg = inject(MESSAGES);

  private readonly destroy$ = new Subject<void>();
  readonly searchSubject = new Subject<string>();

  readonly products = signal<Product[]>([]);
  readonly totalProducts = signal(0);
  readonly currentPage = signal(1);
  readonly totalPages = signal(0);
  readonly categories = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly viewMode = signal<ViewMode>('grid');
  readonly sidebarOpen = signal(false);

  private readonly pageSize = 20;

  searchTerm = '';
  selectedCategory = '';
  inStockOnly = false;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedSortIndex = 0;

  readonly sortOptions: SortOption[] = [];

  readonly hasActiveFilters = computed(
    () =>
      !!this.selectedCategory ||
      this.inStockOnly ||
      this.minPrice !== null ||
      this.maxPrice !== null ||
      !!this.searchTerm
  );

  readonly showingRangeText = computed(() => {
    const total = this.totalProducts();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize + 1;
    const end = Math.min(page * this.pageSize, total);
    if (total === 0) return this.msg.shop.showingXofY.replace('{shown}', '0').replace('{total}', '0');
    return this.msg.shop.showingRange
      .replace('{start}', String(start))
      .replace('{end}', String(end))
      .replace('{total}', String(total));
  });

  readonly paginationRange = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    const rangeStart = Math.max(2, current - 1);
    const rangeEnd = Math.min(total - 1, current + 1);

    if (rangeStart > 2) pages.push(-1);
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (rangeEnd < total - 1) pages.push(-1);
    pages.push(total);

    return pages;
  });

  constructor() {
    this.sortOptions = [
      { label: this.msg.shop.sortRelevance, field: 'relevance', order: 'desc' },
      { label: this.msg.shop.sortPriceAsc, field: 'price', order: 'asc' },
      { label: this.msg.shop.sortPriceDesc, field: 'price', order: 'desc' },
      { label: this.msg.shop.sortNameAz, field: 'name', order: 'asc' },
      { label: this.msg.shop.sortRating, field: 'rating', order: 'desc' },
    ];
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadProducts();
      });

    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.productsService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const sort = this.sortOptions[this.selectedSortIndex];
    const filter: ProductFilter = {};

    if (this.searchTerm) filter.searchTerm = this.searchTerm;
    if (this.selectedCategory) filter.category = this.selectedCategory;
    if (this.inStockOnly) filter.inStock = true;
    if (this.minPrice !== null) filter.minPrice = this.minPrice;
    if (this.maxPrice !== null) filter.maxPrice = this.maxPrice;
    if (sort.field !== 'relevance') {
      filter.sortBy = sort.field;
      filter.sortOrder = sort.order;
    }

    this.productsService
      .getProducts(filter, this.currentPage(), this.pageSize)
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.totalProducts.set(response.total);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.msg.errors.serverError);
          this.loading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSortChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onProductSelect(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  onAddToCart(product: Product): void {
    this.cartService.addItem(product);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearCategory(): void {
    this.selectedCategory = '';
    this.onFilterChange();
  }

  clearInStock(): void {
    this.inStockOnly = false;
    this.onFilterChange();
  }

  clearPriceRange(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.onFilterChange();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onFilterChange();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.inStockOnly = false;
    this.minPrice = null;
    this.maxPrice = null;
    this.onFilterChange();
  }
}

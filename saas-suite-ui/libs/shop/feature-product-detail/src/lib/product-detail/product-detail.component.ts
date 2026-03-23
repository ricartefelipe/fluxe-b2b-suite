import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProductsService, CartService } from '@union.solutions/shop/data';
import { Product } from '@union.solutions/models';
import { LoadingSpinnerComponent, ErrorMessageComponent, OptimizedImageComponent } from '@union.solutions/shop/shared-ui';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'shop-product-detail',
  imports: [
    CurrencyPipe,
    RouterLink,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    OptimizedImageComponent,
  ],
  template: `
    <div class="product-detail-container">
      @if (loading()) {
        <shop-loading-spinner />
      } @else if (error()) {
        <shop-error-message
          [title]="i18n.messages().shop.productNotFound"
          [message]="error() || undefined"
          (retry)="loadProduct()"
        />
      } @else if (product(); as p) {
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/products">{{ i18n.messages().shop.products }}</a>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-category">{{ p.category }}</span>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">{{ p.name }}</span>
        </nav>

        <div class="product-detail">
          <div class="product-image-section">
            <div
              class="image-zoom-wrapper"
              (mouseenter)="imageHover.set(true)"
              (mouseleave)="imageHover.set(false)"
              (mousemove)="onImageMouseMove($event)"
              [style.--zoom-x]="zoomX() + '%'"
              [style.--zoom-y]="zoomY() + '%'"
              [class.zoomed]="imageHover()"
            >
              <shop-optimized-image
                [src]="p.imageUrl"
                [alt]="p.name"
                [width]="600"
                [height]="600"
                [priority]="true"
              />
              @if (!p.inStock) {
                <div class="out-of-stock-overlay">
                  <span>{{ i18n.messages().shop.outOfStock }}</span>
                </div>
              }
            </div>
            <p class="more-images-hint">{{ i18n.messages().shop.moreImagesSoon }}</p>
          </div>

          <div class="product-info-section">
            <span class="category-badge">{{ p.category }}</span>
            <h1 class="product-name">{{ p.name }}</h1>

            <div class="product-rating">
              <span class="stars" aria-hidden="true">
                @for (star of getStars(); track $index) {
                  <span [class.filled]="star">★</span>
                }
              </span>
              <span class="rating-value">{{ p.rating }}</span>
              <span class="review-count">({{ p.reviewCount }} {{ i18n.messages().shop.reviews }})</span>
            </div>

            <div class="product-sku">
              <span class="sku-label">{{ i18n.messages().shop.sku }}:</span>
              <code class="sku-value">{{ p.sku || p.id }}</code>
            </div>

            <div class="product-price">
              {{ p.price | currency:(p.currency || 'BRL'):'symbol':'1.2-2' }}
            </div>

            <div class="availability" [class.in-stock]="p.inStock" [class.out-of-stock]="!p.inStock">
              <mat-icon>{{ p.inStock ? 'check_circle' : 'cancel' }}</mat-icon>
              <span>{{ p.inStock ? i18n.messages().shop.inStock : i18n.messages().shop.unavailable }}</span>
            </div>

            <div class="quantity-selector">
              <label class="qty-label">{{ i18n.messages().shop.quantity }}:</label>
              <div class="qty-controls">
                <button
                  mat-icon-button
                  (click)="decrementQty()"
                  [disabled]="!p.inStock || selectedQty() <= 1"
                  aria-label="Decrease quantity"
                >
                  <mat-icon>remove</mat-icon>
                </button>
                <input
                  type="number"
                  class="qty-input"
                  [value]="selectedQty()"
                  (change)="onQtyChange($event)"
                  [disabled]="!p.inStock"
                  min="1"
                  max="999"
                />
                <button
                  mat-icon-button
                  (click)="incrementQty()"
                  [disabled]="!p.inStock"
                  aria-label="Increase quantity"
                >
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </div>

            <button
              class="add-to-cart-btn"
              [attr.data-testid]="'add-to-cart'"
              (click)="addToCart()"
              [disabled]="!p.inStock"
              [class.disabled]="!p.inStock"
            >
              <mat-icon>shopping_cart</mat-icon>
              {{ p.inStock ? i18n.messages().shop.addToCart : i18n.messages().shop.unavailable }}
            </button>

            <div class="product-description">
              <div class="description-divider"></div>
              <h2>{{ i18n.messages().shop.description }}</h2>
              <p>{{ p.description }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-size: 0.875rem;
      flex-wrap: wrap;
    }

    .breadcrumb a {
      color: var(--shop-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb a:hover { text-decoration: underline; }

    .breadcrumb-sep { color: var(--shop-text-secondary); }

    .breadcrumb-category { color: var(--shop-text-secondary); }

    .breadcrumb-current {
      color: var(--shop-text);
      font-weight: 500;
    }

    .product-detail {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
    }

    .product-image-section {
      position: relative;
    }

    .image-zoom-wrapper {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      background: var(--shop-surface);
      box-shadow: var(--shop-shadow);
      cursor: zoom-in;
    }

    .image-zoom-wrapper.zoomed shop-optimized-image {
      transform: scale(1.8);
      transform-origin: var(--zoom-x, 50%) var(--zoom-y, 50%);
    }

    .image-zoom-wrapper shop-optimized-image {
      transition: transform 0.15s ease-out;
    }

    .out-of-stock-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 12px;
    }

    .out-of-stock-overlay span {
      background: var(--shop-error);
      color: white;
      padding: 8px 24px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .more-images-hint {
      text-align: center;
      color: var(--shop-text-secondary);
      font-size: 0.8rem;
      margin-top: 12px;
      font-style: italic;
    }

    .product-info-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-badge {
      display: inline-block;
      align-self: flex-start;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--shop-code-bg);
      color: var(--shop-primary);
    }

    .product-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--shop-text);
      line-height: 1.3;
      margin: 0;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stars { color: #ddd; font-size: 1.15rem; letter-spacing: 2px; }
    .stars .filled { color: #f59e0b; }
    .rating-value { font-weight: 600; color: var(--shop-text); font-size: 0.9rem; }
    .review-count { color: var(--shop-text-secondary); font-size: 0.85rem; }

    .product-sku {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sku-label { color: var(--shop-text-secondary); font-size: 0.85rem; }

    .sku-value {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.85rem;
      background: var(--shop-code-bg);
      padding: 2px 8px;
      border-radius: 4px;
      color: var(--shop-text);
    }

    .product-price {
      font-size: 2rem;
      font-weight: 700;
      color: var(--shop-primary);
    }

    .availability {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .availability mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .availability.in-stock { color: var(--shop-success); }
    .availability.out-of-stock { color: var(--shop-error); }

    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .qty-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--shop-text);
    }

    .qty-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      border: 1px solid var(--shop-border);
      border-radius: 8px;
      padding: 2px;
    }

    .qty-input {
      width: 52px;
      text-align: center;
      border: none;
      outline: none;
      font-size: 1rem;
      font-weight: 500;
      background: transparent;
      color: var(--shop-text);
      -moz-appearance: textfield;
    }

    .qty-input::-webkit-inner-spin-button,
    .qty-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .add-to-cart-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      background: var(--shop-primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }

    .add-to-cart-btn:hover:not(.disabled) {
      background: var(--shop-primary-light);
    }

    .add-to-cart-btn.disabled {
      background: #9e9e9e;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .add-to-cart-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .product-description { margin-top: 8px; }

    .description-divider {
      height: 1px;
      background: var(--shop-border);
      margin-bottom: 20px;
    }

    .product-description h2 {
      font-size: 1.1rem;
      margin: 0 0 12px;
      color: var(--shop-text);
    }

    .product-description p {
      color: var(--shop-text-secondary);
      line-height: 1.7;
      margin: 0;
    }

    @media (max-width: 768px) {
      .product-detail {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .product-name { font-size: 1.35rem; }
      .product-price { font-size: 1.5rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly i18n = inject(I18nService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedQty = signal(1);
  readonly imageHover = signal(false);
  readonly zoomX = signal(50);
  readonly zoomY = signal(50);

  ngOnInit() {
    this.loadProduct();
  }

  loadProduct() {
    const productId = this.route.snapshot.paramMap.get('id');
    const msgs = this.i18n.messages().shop;

    if (!productId) {
      this.error.set(msgs.productIdMissing);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.productsService.getProductById(productId).subscribe({
      next: (product) => {
        if (product) {
          this.product.set(product);
        } else {
          this.error.set(msgs.productNotFound);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(msgs.failedLoadProduct);
        this.loading.set(false);
      },
    });
  }

  getStars(): boolean[] {
    const p = this.product();
    if (!p) return [];
    const full = Math.floor(p.rating);
    const half = p.rating % 1 >= 0.5;
    return Array(5).fill(false).map((_, i) => i < full || (i === full && half));
  }

  onImageMouseMove(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.zoomX.set(((event.clientX - rect.left) / rect.width) * 100);
    this.zoomY.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  incrementQty(): void {
    this.selectedQty.update(q => q + 1);
  }

  decrementQty(): void {
    this.selectedQty.update(q => Math.max(1, q - 1));
  }

  onQtyChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.selectedQty.set(isNaN(val) || val < 1 ? 1 : val);
  }

  addToCart() {
    const p = this.product();
    if (!p) return;

    const msgs = this.i18n.messages().shop;
    this.cartService.addItem(p, this.selectedQty());

    this.snackBar.open(msgs.addedToCart, msgs.viewCart, {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['cart-snackbar'],
    }).onAction().subscribe(() => {
      this.router.navigate(['/checkout']);
    });
  }
}

import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '@union.solutions/models';
import { MESSAGES } from '@saas-suite/shared/i18n';
import { OptimizedImageComponent } from '../optimized-image/optimized-image.component';

@Component({
  selector: 'shop-product-card',
  imports: [CurrencyPipe, OptimizedImageComponent],
  template: `
    <article
      class="product-card"
      [class.out-of-stock]="!product().inStock"
      (click)="productClick.emit(product())"
      (keyup.enter)="productClick.emit(product())"
      (keyup.space)="productClick.emit(product())"
      tabindex="0"
      role="button"
      [attr.aria-label]="product().name"
    >
      <div class="card-image">
        <shop-optimized-image
          [src]="product().imageUrl"
          [alt]="product().name"
          [width]="400"
          [height]="300"
          [priority]="priority()"
        />

        <span class="category-badge">{{ product().category }}</span>

        @if (!product().inStock) {
          <span class="stock-badge stock-badge--unavailable">
            {{ msg.shop.outOfStock }}
          </span>
        }

        @if (product().inStock) {
          <div class="quick-add-overlay">
            <button
              class="btn-add-to-cart"
              (click)="onAddToCart($event)"
              [attr.aria-label]="msg.shop.addToCart + ' ' + product().name"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {{ msg.shop.addToCart }}
            </button>
          </div>
        }
      </div>

      <div class="card-body">
        <h3 class="product-name">{{ product().name }}</h3>

        <div class="product-rating">
          <span class="stars" [attr.aria-label]="product().rating + '/5'">
            @for (star of getStars(); track $index) {
              <span [class.filled]="star">★</span>
            }
          </span>
          <span class="review-count">
            ({{ product().reviewCount }})
          </span>
        </div>

        <div class="card-footer">
          <span class="product-price">
            {{ product().price | currency: (product().currency || 'BRL') }}
          </span>
          @if (product().sku) {
            <span class="product-sku">{{ product().sku }}</span>
          }
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host {
      display: block;
      --card-radius: 12px;
      --transition-speed: 0.2s;
    }

    .product-card {
      position: relative;
      border-radius: var(--card-radius);
      overflow: hidden;
      cursor: pointer;
      background: var(--shop-surface);
      border: 1px solid var(--shop-border);
      height: 100%;
      display: flex;
      flex-direction: column;
      transition:
        transform var(--transition-speed) ease,
        box-shadow var(--transition-speed) ease;
    }

    .product-card:hover,
    .product-card:focus-visible {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
    }

    .product-card:focus-visible {
      outline: 2px solid var(--shop-primary);
      outline-offset: 2px;
    }

    /* --- Out-of-stock treatment --- */
    .product-card.out-of-stock .card-image shop-optimized-image {
      filter: saturate(0.4);
      transition: filter var(--transition-speed) ease;
    }

    /* --- Image area --- */
    .card-image {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background: var(--shop-bg);
    }

    .category-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 2px 10px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-radius: 20px;
      background: var(--shop-surface);
      color: var(--shop-text-secondary);
      border: 1px solid var(--shop-border);
      z-index: 2;
      pointer-events: none;
    }

    .stock-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 2px 10px;
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 20px;
      z-index: 2;
      pointer-events: none;
    }

    .stock-badge--unavailable {
      background: var(--shop-error-bg);
      color: var(--shop-error);
    }

    /* --- Quick add overlay --- */
    .quick-add-overlay {
      position: absolute;
      inset: auto 0 0 0;
      padding: 12px;
      display: flex;
      justify-content: center;
      opacity: 0;
      transform: translateY(8px);
      transition:
        opacity var(--transition-speed) ease,
        transform var(--transition-speed) ease;
      z-index: 3;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.35));
    }

    .product-card:hover .quick-add-overlay,
    .product-card:focus-within .quick-add-overlay {
      opacity: 1;
      transform: translateY(0);
    }

    .btn-add-to-cart {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
      background: var(--shop-primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background var(--transition-speed) ease;
      white-space: nowrap;
    }

    .btn-add-to-cart:hover {
      background: var(--shop-primary-light);
    }

    /* --- Body --- */
    .card-body {
      padding: 14px 16px 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .product-name {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--shop-text);
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stars {
      font-size: 0.8rem;
      color: var(--shop-border);
      letter-spacing: 1px;
    }

    .stars .filled {
      color: #f59e0b;
    }

    .review-count {
      font-size: 0.75rem;
      color: var(--shop-text-secondary);
    }

    .card-footer {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 4px;
    }

    .product-price {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--shop-text);
    }

    .product-sku {
      font-size: 0.7rem;
      color: var(--shop-text-secondary);
      font-family: monospace;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly msg = inject(MESSAGES);
  readonly product = input.required<Product>();
  readonly priority = input<boolean>(false);
  readonly productClick = output<Product>();
  readonly addToCart = output<Product>();

  getStars(): boolean[] {
    const rating = this.product().rating;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return Array(5).fill(false).map((_, index) => {
      if (index < fullStars) return true;
      if (index === fullStars && hasHalfStar) return true;
      return false;
    });
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product());
  }
}

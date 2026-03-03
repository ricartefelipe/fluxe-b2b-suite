import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '@union.solutions/models';
import { MESSAGES } from '@saas-suite/shared/i18n';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../product-card-skeleton/product-card-skeleton.component';

export type ViewMode = 'grid' | 'list';

@Component({
  selector: 'shop-product-grid',
  imports: [ProductCardComponent, ProductCardSkeletonComponent],
  template: `
    @if (loading()) {
      <div class="product-grid" [class.view-list]="viewMode() === 'list'">
        @for (i of skeletonSlots; track i) {
          <shop-product-card-skeleton
            class="stagger-item"
            [style.animation-delay]="(i * 60) + 'ms'"
          />
        }
      </div>
    } @else if (products().length === 0) {
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--shop-text-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>{{ msg.shop.noProductsFound }}</h3>
        <p>{{ msg.shop.noProductsMessage }}</p>
      </div>
    } @else {
      <div
        class="product-grid"
        [class.view-list]="viewMode() === 'list'"
      >
        @for (product of products(); track product.id; let idx = $index) {
          <shop-product-card
            class="stagger-item"
            [style.animation-delay]="(idx * 50) + 'ms'"
            [product]="product"
            [priority]="idx < 4"
            (productClick)="productSelect.emit($event)"
            (addToCart)="addToCart.emit($event)"
          />
        }
      </div>
    }
  `,
  styles: [`
    .product-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .product-grid.view-list {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .product-grid.view-list shop-product-card {
      --card-direction: row;
    }

    .stagger-item {
      animation: fadeSlideUp 0.35s ease both;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      color: var(--shop-text-secondary);
    }

    .empty-state svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 1.25rem;
      color: var(--shop-text);
    }

    .empty-state p {
      margin: 0;
      font-size: 0.95rem;
      max-width: 360px;
    }

    @keyframes fadeSlideUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1200px) {
      .product-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .product-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
    }

    @media (max-width: 480px) {
      .product-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  readonly msg = inject(MESSAGES);
  readonly products = input.required<Product[]>();
  readonly loading = input<boolean>(false);
  readonly viewMode = input<ViewMode>('grid');
  readonly productSelect = output<Product>();
  readonly addToCart = output<Product>();

  readonly skeletonSlots = Array.from({ length: 8 }, (_, i) => i);
}

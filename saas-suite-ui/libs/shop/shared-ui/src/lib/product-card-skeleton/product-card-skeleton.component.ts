import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'shop-product-card-skeleton',
  template: `
    <div class="skeleton-card">
      <div class="skeleton-image shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-badge shimmer"></div>
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-title-short shimmer"></div>
        <div class="skeleton-rating shimmer"></div>
        <div class="skeleton-price shimmer"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      border-radius: 12px;
      overflow: hidden;
      background: var(--shop-surface);
      border: 1px solid var(--shop-border);
    }

    .shimmer {
      background: linear-gradient(
        90deg,
        var(--shop-border) 25%,
        var(--shop-bg) 50%,
        var(--shop-border) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    .skeleton-image {
      width: 100%;
      aspect-ratio: 4 / 3;
    }

    .skeleton-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .skeleton-badge {
      width: 60px;
      height: 14px;
      border-radius: 8px;
    }

    .skeleton-title {
      width: 85%;
      height: 16px;
    }

    .skeleton-title-short {
      width: 55%;
      height: 16px;
    }

    .skeleton-rating {
      width: 120px;
      height: 14px;
    }

    .skeleton-price {
      width: 80px;
      height: 22px;
      margin-top: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardSkeletonComponent {}

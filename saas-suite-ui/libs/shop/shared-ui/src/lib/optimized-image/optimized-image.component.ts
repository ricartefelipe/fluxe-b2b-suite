import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'shop-optimized-image',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <div class="image-container" [class.loaded]="!loading()" [class.error]="error()">
      <img
        [ngSrc]="src()"
        [width]="width()"
        [height]="height()"
        [alt]="alt()"
        [priority]="priority()"
        [placeholder]="placeholder()"
        (load)="onLoad()"
        (error)="onError()"
      />
      @if (loading()) {
        <div
          class="image-placeholder"
          [style.aspect-ratio]="width() + '/' + height()"
        ></div>
      }
      @if (error()) {
        <div
          class="image-fallback"
          [style.aspect-ratio]="width() + '/' + height()"
        >
          <span>Image unavailable</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .image-container {
      position: relative;
      overflow: hidden;
      background: #f0f0f0;
    }

    .image-container img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .image-container.loaded img {
      opacity: 1;
    }

    .image-placeholder {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .image-fallback {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      color: #999;
      font-size: 0.875rem;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptimizedImageComponent {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly width = input<number>(400);
  readonly height = input<number>(300);
  readonly priority = input<boolean>(false);
  readonly placeholder = input<string | boolean>(true);

  readonly loading = signal(true);
  readonly error = signal(false);

  onLoad(): void {
    this.loading.set(false);
    this.error.set(false);
  }

  onError(): void {
    this.loading.set(false);
    this.error.set(true);
  }
}

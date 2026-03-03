import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IMAGE_LOADER } from '@angular/common';
import { ProductCardComponent } from './product-card.component';
import { Product } from '@union.solutions/models';
import { MESSAGES, PT_BR_MESSAGES } from '@saas-suite/shared/i18n';
import { describe, it, beforeEach, expect, vi } from 'vitest';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    imageUrl: 'https://example.com/image.jpg',
    category: 'Electronics',
    inStock: true,
    rating: 4.5,
    reviewCount: 100,
    sku: 'ELEC-001',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        { provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src },
        { provide: MESSAGES, useValue: PT_BR_MESSAGES },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', mockProduct);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display product information', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.product-name').textContent).toContain('Test Product');
    expect(compiled.querySelector('.category-badge').textContent).toContain('Electronics');
    expect(compiled.querySelector('.product-price').textContent).toContain('99.99');
    expect(compiled.querySelector('.product-sku').textContent).toContain('ELEC-001');
  });

  it('should emit productClick event when card is clicked', () => {
    const clickSpy = vi.fn();
    component.productClick.subscribe(clickSpy);

    fixture.detectChanges();
    fixture.nativeElement.querySelector('.product-card').click();

    expect(clickSpy).toHaveBeenCalledWith(mockProduct);
  });

  it('should show unavailable badge when product is out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    fixture.componentRef.setInput('product', outOfStockProduct);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.stock-badge--unavailable')).toBeTruthy();
    expect(compiled.querySelector('.product-card').classList).toContain('out-of-stock');
    expect(compiled.querySelector('.quick-add-overlay')).toBeFalsy();
  });

  it('should show add-to-cart overlay when product is in stock', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.quick-add-overlay')).toBeTruthy();
    expect(compiled.querySelector('.stock-badge--unavailable')).toBeFalsy();
  });

  it('should emit addToCart when add button is clicked', () => {
    const cartSpy = vi.fn();
    component.addToCart.subscribe(cartSpy);

    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-add-to-cart').click();

    expect(cartSpy).toHaveBeenCalledWith(mockProduct);
  });

  it('should calculate star ratings correctly', () => {
    const stars = component.getStars();
    expect(stars).toEqual([true, true, true, true, true]);
  });

  it('should handle product with low rating', () => {
    const lowRatedProduct = { ...mockProduct, rating: 2.3 };
    fixture.componentRef.setInput('product', lowRatedProduct);
    const stars = component.getStars();
    expect(stars).toEqual([true, true, false, false, false]);
  });
});

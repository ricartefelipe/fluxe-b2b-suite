import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductDetailComponent } from './product-detail.component';
import { ProductsService, CartService } from '@union.solutions/shop/data';
import { Product } from '@union.solutions/models';
import { I18nService } from '@saas-suite/shared/i18n';
import { describe, it, beforeEach, expect, vi } from 'vitest';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let mockProductsService: Partial<ProductsService>;
  let mockCartService: { addItem: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockActivatedRoute: Partial<ActivatedRoute>;

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
  };

  const outOfStockProduct: Product = {
    ...mockProduct,
    id: '2',
    name: 'Out of Stock Product',
    inStock: false,
  };

  beforeEach(async () => {
    mockProductsService = {
      getProductById: vi.fn(),
    };

    mockCartService = { addItem: vi.fn() };
    const onActionSubject = { subscribe: vi.fn() };
    mockSnackBar = {
      open: vi.fn().mockReturnValue({ onAction: () => onActionSubject }),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      } as any,
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
        { provide: CartService, useValue: mockCartService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        I18nService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render product details after loading', () => {
    (mockProductsService.getProductById as ReturnType<typeof vi.fn>).mockReturnValue(of(mockProduct));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.product()).toEqual(mockProduct);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(null);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.product-name')?.textContent).toContain('Test Product');
    expect(compiled.querySelector('.category-badge')?.textContent).toContain('Electronics');
    expect(compiled.querySelector('.product-price')?.textContent).toContain('99.99');
    expect(compiled.querySelector('.product-description p')?.textContent).toContain('Test Description');
  });

  it('should load product on init', () => {
    (mockProductsService.getProductById as ReturnType<typeof vi.fn>).mockReturnValue(of(mockProduct));

    component.ngOnInit();

    expect(mockProductsService.getProductById).toHaveBeenCalledWith('1');
    expect(component.product()).toEqual(mockProduct);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(null);
  });

  it('should handle error when product not found', () => {
    (mockProductsService.getProductById as ReturnType<typeof vi.fn>).mockReturnValue(of(null));

    component.ngOnInit();

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('should handle error when loading fails', () => {
    (mockProductsService.getProductById as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.ngOnInit();

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('should calculate star ratings correctly', () => {
    component.product.set(mockProduct);

    const stars = component.getStars();

    expect(stars).toEqual([true, true, true, true, true]);
  });

  it('should add to cart with selected quantity and show snackbar', () => {
    component.product.set(mockProduct);
    component.selectedQty.set(3);

    component.addToCart();

    expect(mockCartService.addItem).toHaveBeenCalledWith(mockProduct, 3);
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should not call cart service when product is null', () => {
    component.product.set(null);

    component.addToCart();

    expect(mockCartService.addItem).not.toHaveBeenCalled();
  });

  it('should show out of stock state when product is unavailable', () => {
    (mockProductsService.getProductById as ReturnType<typeof vi.fn>).mockReturnValue(of(outOfStockProduct));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.product()!.inStock).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.out-of-stock-overlay')).toBeTruthy();
    expect(compiled.querySelector('.add-to-cart-btn.disabled')).toBeTruthy();
  });

  it('should show add to cart button when product is in stock', () => {
    (mockProductsService.getProductById as ReturnType<typeof vi.fn>).mockReturnValue(of(mockProduct));

    component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.add-to-cart-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
    expect(compiled.querySelector('.out-of-stock-overlay')).toBeFalsy();
  });

  it('should show loading spinner while fetching product', () => {
    const subject = new Subject<Product | null>();
    (mockProductsService.getProductById as ReturnType<typeof vi.fn>).mockReturnValue(subject.asObservable());

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('shop-loading-spinner')).toBeTruthy();

    subject.next(mockProduct);
    subject.complete();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(compiled.querySelector('shop-loading-spinner')).toBeFalsy();
  });

  it('should return empty stars array when product is null', () => {
    component.product.set(null);

    const stars = component.getStars();

    expect(stars).toEqual([]);
  });

  it('should handle low rating with partial stars', () => {
    component.product.set({ ...mockProduct, rating: 2.3 });

    const stars = component.getStars();

    expect(stars).toEqual([true, true, false, false, false]);
  });

  it('should increment and decrement quantity', () => {
    expect(component.selectedQty()).toBe(1);

    component.incrementQty();
    expect(component.selectedQty()).toBe(2);

    component.incrementQty();
    expect(component.selectedQty()).toBe(3);

    component.decrementQty();
    expect(component.selectedQty()).toBe(2);

    component.decrementQty();
    expect(component.selectedQty()).toBe(1);

    component.decrementQty();
    expect(component.selectedQty()).toBe(1);
  });
});

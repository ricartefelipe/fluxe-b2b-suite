import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductsService, CartService } from '@union.solutions/shop/data';
import { Product, PaginatedResponse } from '@union.solutions/models';
import { MESSAGES, PT_BR_MESSAGES } from '@saas-suite/shared/i18n';
import { describe, it, beforeEach, expect, vi } from 'vitest';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockProductsService: Partial<ProductsService>;
  let mockCartService: Partial<CartService>;
  let mockRouter: Partial<Router>;

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Product 1',
      description: 'Description 1',
      price: 99.99,
      imageUrl: 'https://example.com/1.jpg',
      category: 'Electronics',
      inStock: true,
      rating: 4.5,
      reviewCount: 100,
    },
    {
      id: '2',
      name: 'Product 2',
      description: 'Description 2',
      price: 149.99,
      imageUrl: 'https://example.com/2.jpg',
      category: 'Clothing',
      inStock: false,
      rating: 4.0,
      reviewCount: 50,
    },
  ];

  const emptyResponse: PaginatedResponse<Product> = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  };

  const loadedResponse: PaginatedResponse<Product> = {
    items: mockProducts,
    total: 2,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  };

  beforeEach(async () => {
    mockProductsService = {
      getProducts: vi.fn().mockReturnValue(of(emptyResponse)),
      getCategories: vi.fn().mockReturnValue(of([])),
      loading: vi.fn().mockReturnValue(false) as any,
      error: vi.fn().mockReturnValue(null) as any,
    };

    mockCartService = {
      addItem: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
        { provide: CartService, useValue: mockCartService },
        { provide: Router, useValue: mockRouter },
        { provide: MESSAGES, useValue: PT_BR_MESSAGES },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products and categories on init', () => {
    mockProductsService.getProducts!.mockReturnValue(of(loadedResponse));
    mockProductsService.getCategories!.mockReturnValue(of(['Electronics', 'Clothing']));

    component.ngOnInit();

    expect(mockProductsService.getProducts).toHaveBeenCalled();
    expect(mockProductsService.getCategories).toHaveBeenCalled();
    expect(component.products()).toEqual(mockProducts);
  });

  it('should render product grid when products are loaded', () => {
    mockProductsService.getProducts!.mockReturnValue(of(loadedResponse));
    mockProductsService.getCategories!.mockReturnValue(of(['Electronics', 'Clothing']));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.products().length).toBe(2);
    expect(component.totalProducts()).toBe(2);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('shop-product-grid')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    const subject = new Subject<PaginatedResponse<Product>>();
    mockProductsService.getProducts!.mockReturnValue(subject.asObservable());
    mockProductsService.getCategories!.mockReturnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.loading()).toBe(true);

    subject.next(emptyResponse);
    subject.complete();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });

  it('should navigate to product detail when product is selected', () => {
    const product = mockProducts[0];
    component.onProductSelect(product);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/product', product.id]);
  });

  it('should debounce search input by 300ms', fakeAsync(() => {
    mockProductsService.getProducts!.mockReturnValue(of(loadedResponse));
    mockProductsService.getCategories!.mockReturnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();
    vi.mocked(mockProductsService.getProducts!).mockClear();

    component.searchTerm = 'laptop';
    component.searchSubject.next('laptop');

    tick(200);
    expect(mockProductsService.getProducts).not.toHaveBeenCalled();

    tick(100);
    expect(mockProductsService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ searchTerm: 'laptop' }),
      1,
      20
    );
  }));

  it('should apply filters when category changes', () => {
    mockProductsService.getProducts!.mockReturnValue(of(loadedResponse));
    mockProductsService.getCategories!.mockReturnValue(of([]));

    component.ngOnInit();
    vi.mocked(mockProductsService.getProducts!).mockClear();
    mockProductsService.getProducts!.mockReturnValue(of(loadedResponse));

    component.selectedCategory = 'Electronics';
    component.onFilterChange();

    expect(mockProductsService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Electronics' }),
      1,
      20
    );
  });

  it('should reset to page 1 when filters change', () => {
    mockProductsService.getProducts!.mockReturnValue(of(loadedResponse));
    mockProductsService.getCategories!.mockReturnValue(of([]));

    component.ngOnInit();
    component.currentPage.set(3);

    component.onFilterChange();

    expect(component.currentPage()).toBe(1);
  });

  it('should add product to cart when addToCart is called', () => {
    const product = mockProducts[0];
    component.onAddToCart(product);
    expect(mockCartService.addItem).toHaveBeenCalledWith(product);
  });

  it('should clear all filters', () => {
    component.searchTerm = 'test';
    component.selectedCategory = 'Electronics';
    component.inStockOnly = true;
    component.minPrice = 10;
    component.maxPrice = 100;

    mockProductsService.getProducts!.mockReturnValue(of(emptyResponse));
    component.clearAllFilters();

    expect(component.searchTerm).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.inStockOnly).toBe(false);
    expect(component.minPrice).toBeNull();
    expect(component.maxPrice).toBeNull();
  });
});

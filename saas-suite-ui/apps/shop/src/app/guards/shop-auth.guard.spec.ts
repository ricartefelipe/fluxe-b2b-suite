import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthStore } from '@saas-suite/shared/auth';
import { shopAuthGuard } from './shop-auth.guard';
import { describe, it, beforeEach, expect, vi } from 'vitest';

describe('shopAuthGuard', () => {
  let mockAuthStore: { isAuthenticated: ReturnType<typeof vi.fn> };
  let mockRouter: {
    createUrlTree: ReturnType<typeof vi.fn>;
    getCurrentNavigation: ReturnType<typeof vi.fn>;
  };
  let mockUrlTree: UrlTree;

  beforeEach(() => {
    mockUrlTree = { toString: () => '/products' } as unknown as UrlTree;

    mockAuthStore = {
      isAuthenticated: vi.fn(),
    };

    mockRouter = {
      createUrlTree: vi.fn().mockReturnValue(mockUrlTree),
      getCurrentNavigation: vi.fn().mockReturnValue({
        extractedUrl: { toString: () => '/checkout' },
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when user is authenticated', () => {
    mockAuthStore.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => shopAuthGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /products when user is not authenticated', () => {
    mockAuthStore.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => shopAuthGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
      ['/products'],
      expect.objectContaining({
        queryParams: expect.objectContaining({ returnUrl: '/checkout' }),
      })
    );
  });

  it('should include returnUrl query param when redirecting', () => {
    mockAuthStore.isAuthenticated.mockReturnValue(false);
    mockRouter.getCurrentNavigation.mockReturnValue({
      extractedUrl: { toString: () => '/orders' },
    });

    TestBed.runInInjectionContext(() => shopAuthGuard({} as any, {} as any));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
      ['/products'],
      expect.objectContaining({
        queryParams: { returnUrl: '/orders' },
      })
    );
  });

  it('should handle missing navigation gracefully', () => {
    mockAuthStore.isAuthenticated.mockReturnValue(false);
    mockRouter.getCurrentNavigation.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() => shopAuthGuard({} as any, {} as any));

    expect(result).toBe(mockUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
      ['/products'],
      expect.objectContaining({
        queryParams: { returnUrl: undefined },
      })
    );
  });
});

export interface Product {
  id: string;
  tenantId?: string;
  sku?: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  imageUrl: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ProductSortField = 'relevance' | 'price' | 'name' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchTerm?: string;
  sortBy?: ProductSortField;
  sortOrder?: SortOrder;
}
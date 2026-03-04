export type OrderStatus = 'DRAFT' | 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'PAID';

export interface OrderItem {
  sku: string;
  description?: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customerId: string;
  items: OrderItem[];
}

export interface OrderListParams {
  status?: OrderStatus;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

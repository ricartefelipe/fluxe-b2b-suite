export type OrderStatus = 'DRAFT' | 'CREATED' | 'RESERVED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAID';

export const ORDER_LIST_MAX_LIMIT = 100;

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
  currency?: string;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
}

/** O preço do pedido vem do catálogo; `price`, se enviado, é o que o cliente viu e a API recusa divergência. */
export interface CreateOrderItem {
  sku: string;
  qty: number;
  price?: number;
}

export interface CreateOrderRequest {
  customerId: string;
  items: CreateOrderItem[];
}

export interface OrderListParams {
  status?: OrderStatus;
  q?: string;
  cursor?: string;
  limit?: number;
}

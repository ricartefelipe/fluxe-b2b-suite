export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface PaymentIntent {
  id: string;
  tenantId: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentRequest {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
}

export interface PaymentListParams {
  status?: PaymentStatus;
  orderId?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

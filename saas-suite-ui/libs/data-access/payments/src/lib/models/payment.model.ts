export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CONFIRMED'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED'
  | 'VOIDED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface PaymentIntent {
  id: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  customer_ref: string;
  gateway_ref?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customer_ref: string;
}

export interface PaymentListParams {
  status?: PaymentStatus;
  customer_ref?: string;
  page?: number;
  pageSize?: number;
}

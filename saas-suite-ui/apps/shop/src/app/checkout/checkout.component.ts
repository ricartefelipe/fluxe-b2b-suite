import { Component, inject, signal, computed, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService, CartItem } from '@union.solutions/shop/data';
import { OrdersFacade, Order } from '@saas-suite/data-access/orders';
import { PaymentsFacade, CreatePaymentIntentRequest } from '@saas-suite/data-access/payments';
import { TenantContextService } from '@saas-suite/shared/http';

const DEMO_CUSTOMER_ID = 'shop-guest';
const DEFAULT_CURRENCY = 'BRL';
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="checkout-container">
      @if (cart.items().length === 0 && !confirmedOrder()) {
        <div class="empty-cart">
          <mat-icon class="empty-icon">shopping_cart</mat-icon>
          <h2>Your cart is empty</h2>
          <p>Browse our products and add items to your cart.</p>
          <a mat-flat-button routerLink="/products" color="primary">
            <mat-icon>storefront</mat-icon>
            Browse Products
          </a>
        </div>
      } @else {
        <mat-stepper #stepper linear class="checkout-stepper">

          <!-- Step 1: Cart Review -->
          <mat-step [completed]="cart.items().length > 0" label="Cart Review">
            <div class="step-content">
              <h2 class="step-title">Review Your Cart</h2>

              <div class="cart-items">
                @for (item of cart.items(); track item.product.id) {
                  <mat-card class="cart-item-card" appearance="outlined">
                    <mat-card-content>
                      <div class="cart-item-row">
                        <div class="item-info">
                          <span class="item-name">{{ item.product.name }}</span>
                          <span class="item-sku">SKU: {{ item.product.id }}</span>
                        </div>
                        <div class="item-controls">
                          <button mat-icon-button (click)="decrementQty(item)" [disabled]="item.quantity <= 1">
                            <mat-icon>remove_circle_outline</mat-icon>
                          </button>
                          <span class="item-qty">{{ item.quantity }}</span>
                          <button mat-icon-button (click)="incrementQty(item)">
                            <mat-icon>add_circle_outline</mat-icon>
                          </button>
                        </div>
                        <div class="item-price">
                          <span class="unit-price">{{ item.product.price | currency }} each</span>
                          <span class="line-total">{{ item.product.price * item.quantity | currency }}</span>
                        </div>
                        <button mat-icon-button color="warn" (click)="cart.removeItem(item.product.id)">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>

              <mat-divider />

              <div class="cart-summary">
                <div class="summary-row">
                  <span>Subtotal ({{ cart.totalItems() }} items)</span>
                  <strong>{{ cart.totalAmount() | currency }}</strong>
                </div>
              </div>

              <div class="step-actions">
                <a mat-stroked-button routerLink="/products">
                  <mat-icon>arrow_back</mat-icon>
                  Continue Shopping
                </a>
                <button mat-flat-button matStepperNext [disabled]="cart.items().length === 0">
                  Shipping Info
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <!-- Step 2: Shipping Information -->
          <mat-step [stepControl]="shippingForm" label="Shipping">
            <div class="step-content">
              <h2 class="step-title">Shipping Information</h2>

              <form [formGroup]="shippingForm" class="shipping-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Full Name</mat-label>
                  <input matInput formControlName="fullName" placeholder="John Doe" />
                  <mat-icon matPrefix>person</mat-icon>
                  @if (shippingForm.controls.fullName.hasError('required')) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="john@example.com" />
                  <mat-icon matPrefix>email</mat-icon>
                  @if (shippingForm.controls.email.hasError('required')) {
                    <mat-error>Email is required</mat-error>
                  } @else if (shippingForm.controls.email.hasError('email')) {
                    <mat-error>Enter a valid email</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Address</mat-label>
                  <input matInput formControlName="address" placeholder="123 Main St, City" />
                  <mat-icon matPrefix>location_on</mat-icon>
                  @if (shippingForm.controls.address.hasError('required')) {
                    <mat-error>Address is required</mat-error>
                  }
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>City</mat-label>
                    <input matInput formControlName="city" />
                    @if (shippingForm.controls.city.hasError('required')) {
                      <mat-error>City is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>ZIP Code</mat-label>
                    <input matInput formControlName="zip" />
                    @if (shippingForm.controls.zip.hasError('required')) {
                      <mat-error>ZIP is required</mat-error>
                    }
                  </mat-form-field>
                </div>
              </form>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button mat-flat-button matStepperNext [disabled]="shippingForm.invalid">
                  Review Order
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <!-- Step 3: Review & Pay -->
          <mat-step label="Payment" [completed]="!!confirmedOrder()">
            <div class="step-content">
              <h2 class="step-title">Review & Place Order</h2>

              <mat-card appearance="outlined" class="review-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>local_shipping</mat-icon>
                  <mat-card-title>Shipping To</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p><strong>{{ shippingForm.value.fullName }}</strong></p>
                  <p>{{ shippingForm.value.email }}</p>
                  <p>{{ shippingForm.value.address }}</p>
                  <p>{{ shippingForm.value.city }}, {{ shippingForm.value.zip }}</p>
                </mat-card-content>
              </mat-card>

              <mat-card appearance="outlined" class="review-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>receipt_long</mat-icon>
                  <mat-card-title>Order Summary</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @for (item of cart.items(); track item.product.id) {
                    <div class="review-item">
                      <span>{{ item.product.name }} x{{ item.quantity }}</span>
                      <span>{{ item.product.price * item.quantity | currency }}</span>
                    </div>
                  }
                  <mat-divider />
                  <div class="review-total">
                    <strong>Total</strong>
                    <strong>{{ cart.totalAmount() | currency }}</strong>
                  </div>
                </mat-card-content>
              </mat-card>

              @if (checkoutError()) {
                <div class="error-banner">
                  <mat-icon>error</mat-icon>
                  <span>{{ checkoutError() }}</span>
                </div>
              }

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious [disabled]="processing()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                @if (processing()) {
                  <button
                    mat-flat-button
                    disabled
                    class="place-order-btn"
                  >
                    <mat-spinner diameter="20" />
                    Processing...
                  </button>
                } @else {
                  <button
                    mat-flat-button
                    (click)="placeOrder()"
                    [disabled]="cart.items().length === 0"
                    class="place-order-btn"
                  >
                    <mat-icon>payment</mat-icon>
                    Place Order
                  </button>
                }
              </div>
            </div>
          </mat-step>

          <!-- Step 4: Confirmation -->
          <mat-step label="Confirmation">
            <div class="step-content confirmation-step">
              @if (confirmedOrder(); as order) {
                <div class="confirmation-icon">
                  <mat-icon>check_circle</mat-icon>
                </div>
                <h2 class="confirmation-title">Order Placed Successfully!</h2>
                <p class="confirmation-subtitle">Thank you for your purchase.</p>

                <mat-card appearance="outlined" class="confirmation-card">
                  <mat-card-content>
                    <div class="confirmation-detail">
                      <span>Order ID</span>
                      <code>{{ order.id }}</code>
                    </div>
                    <div class="confirmation-detail">
                      <span>Status</span>
                      <span class="status-chip confirmed">{{ order.status }}</span>
                    </div>
                    <div class="confirmation-detail">
                      <span>Total</span>
                      <strong>{{ order.totalAmount | currency }}</strong>
                    </div>
                    <div class="confirmation-detail">
                      <span>Items</span>
                      <span>{{ order.items.length }} item(s)</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <div class="confirmation-actions">
                  <a mat-flat-button routerLink="/orders">
                    <mat-icon>list_alt</mat-icon>
                    View My Orders
                  </a>
                  <a mat-stroked-button routerLink="/products">
                    <mat-icon>storefront</mat-icon>
                    Continue Shopping
                  </a>
                </div>
              }
            </div>
          </mat-step>
        </mat-stepper>
      }
    </div>
  `,
  styles: [`
    .checkout-container {
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
      gap: 12px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #b0bec5;
    }

    .empty-cart h2 {
      color: var(--shop-text);
      margin-top: 8px;
    }

    .empty-cart p {
      color: var(--shop-text-secondary);
      margin-bottom: 16px;
    }

    .checkout-stepper {
      background: transparent;
    }

    .step-content {
      padding: 24px 0;
    }

    .step-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--shop-text);
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .cart-item-card {
      border-radius: 8px !important;
    }

    .cart-item-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 0;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .item-name {
      font-weight: 500;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-sku {
      font-size: 12px;
      color: var(--shop-text-secondary);
    }

    .item-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .item-qty {
      min-width: 32px;
      text-align: center;
      font-weight: 500;
      font-size: 16px;
    }

    .item-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 100px;
    }

    .unit-price {
      font-size: 12px;
      color: var(--shop-text-secondary);
    }

    .line-total {
      font-weight: 600;
      font-size: 15px;
    }

    .cart-summary {
      padding: 16px 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
    }

    .summary-row strong {
      font-size: 22px;
      color: var(--shop-primary);
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      gap: 12px;
    }

    .shipping-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .review-card {
      margin-bottom: 16px;
    }

    .review-card mat-card-content {
      padding-top: 8px;
    }

    .review-card mat-card-content p {
      margin: 2px 0;
      color: var(--shop-text-secondary);
    }

    .review-card mat-card-content p strong {
      color: var(--shop-text);
    }

    .review-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .review-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 0 4px;
      font-size: 17px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--shop-error-bg);
      color: var(--shop-error);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .place-order-btn {
      min-width: 180px;
    }

    .place-order-btn mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    .confirmation-step {
      text-align: center;
      padding: 40px 0;
    }

    .confirmation-icon mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--shop-success);
    }

    .confirmation-title {
      font-size: 24px;
      margin: 16px 0 8px;
    }

    .confirmation-subtitle {
      color: var(--shop-text-secondary);
      margin-bottom: 24px;
    }

    .confirmation-card {
      max-width: 400px;
      margin: 0 auto 24px;
      text-align: left;
    }

    .confirmation-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .confirmation-detail + .confirmation-detail {
      border-top: 1px solid var(--shop-border);
    }

    .confirmation-detail code {
      background: #eef2f7;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: var(--shop-primary);
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }

    .status-chip {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-chip.confirmed {
      background: var(--shop-success-bg);
      color: var(--shop-success);
    }

    .confirmation-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .cart-item-row {
        flex-wrap: wrap;
      }
      .item-info {
        flex-basis: 100%;
      }
      .form-row {
        grid-template-columns: 1fr;
      }
      .step-actions {
        flex-direction: column;
      }
      .confirmation-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `],
})
export class CheckoutComponent {
  protected readonly cart = inject(CartService);
  private readonly ordersFacade = inject(OrdersFacade);
  private readonly paymentsFacade = inject(PaymentsFacade);
  private readonly tenantCtx = inject(TenantContextService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly stepper = viewChild<MatStepper>('stepper');

  readonly shippingForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    zip: ['', Validators.required],
  });

  readonly processing = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly confirmedOrder = signal<Order | null>(null);

  incrementQty(item: CartItem): void {
    this.cart.updateQuantity(item.product.id, item.quantity + 1);
  }

  decrementQty(item: CartItem): void {
    this.cart.updateQuantity(item.product.id, item.quantity - 1);
  }

  async placeOrder(): Promise<void> {
    this.checkoutError.set(null);
    this.processing.set(true);
    this.tenantCtx.setActiveTenantId(DEMO_TENANT_ID);

    try {
      const order = await this.ordersFacade.createOrder({
        customerId: DEMO_CUSTOMER_ID,
        items: this.cart.toOrderItems(),
        currency: DEFAULT_CURRENCY,
      });

      if (!order) {
        this.checkoutError.set('Failed to create order. Please try again.');
        return;
      }

      const paymentReq: CreatePaymentIntentRequest = {
        orderId: order.id,
        customerId: DEMO_CUSTOMER_ID,
        amount: order.totalAmount,
        currency: order.currency,
      };
      const payment = await this.paymentsFacade.createPayment(paymentReq);

      if (!payment) {
        this.checkoutError.set('Failed to create payment. Please try again.');
        return;
      }

      const confirmedPayment = await this.paymentsFacade.confirmPayment(payment.id);
      if (!confirmedPayment) {
        this.checkoutError.set('Payment confirmation failed. Please try again.');
        return;
      }

      const confirmedOrd = await this.ordersFacade.confirmOrder(order.id);
      if (!confirmedOrd) {
        this.checkoutError.set('Order confirmation failed. Please contact support.');
        return;
      }

      this.confirmedOrder.set(confirmedOrd);
      this.cart.clear();
      this.stepper()?.next();
    } catch (e) {
      this.checkoutError.set(
        e instanceof Error ? e.message : 'An unexpected error occurred.'
      );
    } finally {
      this.processing.set(false);
    }
  }
}

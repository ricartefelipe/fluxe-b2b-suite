import { Component, inject, signal, viewChild } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CartService, CartItem } from '@union.solutions/shop/data';
import { OrdersFacade, Order } from '@saas-suite/data-access/orders';
import { PaymentsFacade, CreatePaymentIntentRequest } from '@saas-suite/data-access/payments';
import { TenantContextService } from '@saas-suite/shared/http';
import { AuthStore } from '@saas-suite/shared/auth';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { I18nService } from '@saas-suite/shared/i18n';

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
    MatCheckboxModule,
  ],
  template: `
    <div class="checkout-container">
      @if (cart.items().length === 0 && !confirmedOrder()) {
        <div class="empty-cart">
          <mat-icon class="empty-icon">shopping_cart</mat-icon>
          <h2>{{ i18n.messages().shop.emptyCartTitle }}</h2>
          <p>{{ i18n.messages().shop.emptyCartMessage }}</p>
          <a mat-flat-button routerLink="/products" color="primary">
            <mat-icon>storefront</mat-icon>
            {{ i18n.messages().shop.browseProducts }}
          </a>
        </div>
      } @else {
        <div class="checkout-layout">
          <!-- Left: Stepper -->
          <div class="checkout-main">
            <mat-stepper #stepper linear class="checkout-stepper">

              <!-- Step 1: Cart -->
              <mat-step [completed]="cart.items().length > 0" [label]="i18n.messages().shop.cart">
                <div class="step-content">
                  <h2 class="step-title">{{ i18n.messages().shop.reviewYourCart }}</h2>

                  <div class="cart-items">
                    @for (item of cart.items(); track item.product.id) {
                      <div class="cart-item-row">
                        <img
                          [src]="item.product.imageUrl"
                          [alt]="item.product.name"
                          class="cart-item-thumb"
                        />
                        <div class="item-info">
                          <span class="item-name">{{ item.product.name }}</span>
                          <span class="item-sku">SKU: {{ item.product.sku || item.product.id }}</span>
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
                          <span class="unit-price">{{ item.product.price | currency }} {{ i18n.messages().shop.each }}</span>
                          <span class="line-total">{{ item.product.price * item.quantity | currency }}</span>
                        </div>
                        <button mat-icon-button color="warn" (click)="cart.removeItem(item.product.id)"
                                [attr.aria-label]="i18n.messages().shop.removeItem">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </div>
                    }
                  </div>

                  <div class="step-actions">
                    <a mat-stroked-button routerLink="/products">
                      <mat-icon>arrow_back</mat-icon>
                      {{ i18n.messages().shop.continueShopping }}
                    </a>
                    <button mat-flat-button matStepperNext [disabled]="cart.items().length === 0">
                      {{ i18n.messages().shop.deliveryData }}
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-step>

              <!-- Step 2: Shipping -->
              <mat-step [stepControl]="shippingForm" [label]="i18n.messages().shop.deliveryData">
                <div class="step-content">
                  <h2 class="step-title">{{ i18n.messages().shop.deliveryData }}</h2>

                  <form [formGroup]="shippingForm" class="shipping-form">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>{{ i18n.messages().shop.fullName }}</mat-label>
                      <input matInput formControlName="fullName" />
                      <mat-icon matPrefix>person</mat-icon>
                      @if (shippingForm.controls.fullName.hasError('required')) {
                        <mat-error>{{ i18n.messages().shop.nameRequired }}</mat-error>
                      }
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>{{ i18n.messages().common.email }}</mat-label>
                        <input matInput formControlName="email" type="email" />
                        <mat-icon matPrefix>email</mat-icon>
                        @if (shippingForm.controls.email.hasError('required')) {
                          <mat-error>{{ i18n.messages().shop.emailRequired }}</mat-error>
                        } @else if (shippingForm.controls.email.hasError('email')) {
                          <mat-error>{{ i18n.messages().shop.validEmail }}</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>{{ i18n.messages().shop.phone }}</mat-label>
                        <input matInput formControlName="phone" />
                        <mat-icon matPrefix>phone</mat-icon>
                        @if (shippingForm.controls.phone.hasError('required')) {
                          <mat-error>{{ i18n.messages().shop.phoneRequired }}</mat-error>
                        }
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>{{ i18n.messages().common.address }}</mat-label>
                      <input matInput formControlName="address" />
                      <mat-icon matPrefix>location_on</mat-icon>
                      @if (shippingForm.controls.address.hasError('required')) {
                        <mat-error>{{ i18n.messages().shop.addressRequired }}</mat-error>
                      }
                    </mat-form-field>

                    <div class="form-row form-row-3">
                      <mat-form-field appearance="outline">
                        <mat-label>{{ i18n.messages().shop.city }}</mat-label>
                        <input matInput formControlName="city" />
                        @if (shippingForm.controls.city.hasError('required')) {
                          <mat-error>{{ i18n.messages().shop.cityRequired }}</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>{{ i18n.messages().shop.state }}</mat-label>
                        <input matInput formControlName="state" />
                        @if (shippingForm.controls.state.hasError('required')) {
                          <mat-error>{{ i18n.messages().shop.stateRequired }}</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>{{ i18n.messages().shop.zipCode }}</mat-label>
                        <input matInput formControlName="zip" />
                        @if (shippingForm.controls.zip.hasError('required')) {
                          <mat-error>{{ i18n.messages().shop.zipRequired }}</mat-error>
                        }
                      </mat-form-field>
                    </div>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>{{ i18n.messages().shop.country }}</mat-label>
                        <input matInput formControlName="country" />
                        @if (shippingForm.controls.country.hasError('required')) {
                          <mat-error>{{ i18n.messages().shop.countryRequired }}</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>{{ i18n.messages().shop.cpfCnpj }}</mat-label>
                        <input matInput formControlName="cpfCnpj" />
                        <mat-icon matPrefix>badge</mat-icon>
                        @if (shippingForm.controls.cpfCnpj.hasError('required')) {
                          <mat-error>{{ i18n.messages().shop.cpfCnpjRequired }}</mat-error>
                        }
                      </mat-form-field>
                    </div>
                  </form>

                  <div class="step-actions">
                    <button mat-stroked-button matStepperPrevious>
                      <mat-icon>arrow_back</mat-icon>
                      {{ i18n.messages().shop.back }}
                    </button>
                    <button mat-flat-button matStepperNext [disabled]="shippingForm.invalid">
                      {{ i18n.messages().shop.reviewOrder }}
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-step>

              <!-- Step 3: Review -->
              <mat-step [label]="i18n.messages().shop.review" [completed]="!!confirmedOrder()">
                <div class="step-content">
                  <h2 class="step-title">{{ i18n.messages().shop.reviewAndPlaceOrder }}</h2>

                  <mat-card appearance="outlined" class="review-card">
                    <mat-card-header>
                      <mat-icon mat-card-avatar>local_shipping</mat-icon>
                      <mat-card-title>{{ i18n.messages().shop.shippingTo }}</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <p><strong>{{ shippingForm.value.fullName }}</strong></p>
                      <p>{{ shippingForm.value.email }} · {{ shippingForm.value.phone }}</p>
                      <p>{{ shippingForm.value.address }}</p>
                      <p>{{ shippingForm.value.city }}, {{ shippingForm.value.state }} — {{ shippingForm.value.zip }}</p>
                      <p>{{ shippingForm.value.country }}</p>
                      <p class="cpf-cnpj">{{ i18n.messages().shop.cpfCnpj }}: {{ shippingForm.value.cpfCnpj }}</p>
                    </mat-card-content>
                  </mat-card>

                  <mat-card appearance="outlined" class="review-card">
                    <mat-card-header>
                      <mat-icon mat-card-avatar>receipt_long</mat-icon>
                      <mat-card-title>{{ i18n.messages().shop.orderSummary }}</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      @for (item of cart.items(); track item.product.id) {
                        <div class="review-item">
                          <span>{{ item.product.name }} × {{ item.quantity }}</span>
                          <span>{{ item.product.price * item.quantity | currency }}</span>
                        </div>
                      }
                      <mat-divider />
                      <div class="review-total">
                        <strong>{{ i18n.messages().shop.total }}</strong>
                        <strong>{{ cart.totalAmount() | currency }}</strong>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <div class="terms-section">
                    <mat-checkbox
                      [formControl]="termsAccepted"
                      color="primary"
                    >
                      {{ i18n.messages().shop.termsAccept }}
                    </mat-checkbox>
                    @if (termsAccepted.touched && termsAccepted.hasError('requiredTrue')) {
                      <p class="terms-error">{{ i18n.messages().shop.termsRequired }}</p>
                    }
                  </div>

                  @if (checkoutError()) {
                    <div class="error-banner">
                      <mat-icon>error</mat-icon>
                      <span>{{ checkoutError() }}</span>
                    </div>
                  }

                  <div class="step-actions">
                    <button mat-stroked-button matStepperPrevious [disabled]="processing()">
                      <mat-icon>arrow_back</mat-icon>
                      {{ i18n.messages().shop.back }}
                    </button>
                    @if (processing()) {
                      <button mat-flat-button disabled class="place-order-btn">
                        <mat-spinner diameter="20" />
                        {{ i18n.messages().shop.processing }}
                      </button>
                    } @else {
                      <button
                        mat-flat-button
                        (click)="placeOrder()"
                        [disabled]="cart.items().length === 0 || termsAccepted.invalid"
                        class="place-order-btn"
                      >
                        <mat-icon>payment</mat-icon>
                        {{ i18n.messages().shop.placeOrder }}
                      </button>
                    }
                  </div>
                </div>
              </mat-step>

              <!-- Step 4: Confirmation -->
              <mat-step [label]="i18n.messages().shop.confirmation">
                <div class="step-content confirmation-step">
                  @if (confirmedOrder(); as order) {
                    <div class="confirmation-icon">
                      <mat-icon>check_circle</mat-icon>
                    </div>
                    <h2 class="confirmation-title">{{ i18n.messages().shop.orderPlacedSuccess }}</h2>
                    <p class="confirmation-subtitle">{{ i18n.messages().shop.thankYouPurchase }}</p>

                    <mat-card appearance="outlined" class="confirmation-card">
                      <mat-card-content>
                        <div class="confirmation-detail">
                          <span>{{ i18n.messages().shop.orderId }}</span>
                          <code>{{ order.id }}</code>
                        </div>
                        <div class="confirmation-detail">
                          <span>{{ i18n.messages().shop.status }}</span>
                          <span class="status-chip confirmed">{{ order.status }}</span>
                        </div>
                        <div class="confirmation-detail">
                          <span>{{ i18n.messages().shop.total }}</span>
                          <strong>{{ order.totalAmount | currency }}</strong>
                        </div>
                        <div class="confirmation-detail">
                          <span>{{ i18n.messages().shop.items }}</span>
                          <span>{{ order.items.length }}</span>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <div class="confirmation-actions">
                      <a mat-flat-button [routerLink]="['/orders', order.id]">
                        <mat-icon>visibility</mat-icon>
                        {{ i18n.messages().shop.viewOrder }}
                      </a>
                      <a mat-stroked-button routerLink="/products">
                        <mat-icon>storefront</mat-icon>
                        {{ i18n.messages().shop.continueShopping }}
                      </a>
                    </div>
                  }
                </div>
              </mat-step>
            </mat-stepper>
          </div>

          <!-- Right: Order Summary (sticky) -->
          @if (!confirmedOrder()) {
            <aside class="order-summary-sidebar">
              <div class="summary-sticky">
                <h3 class="summary-title">{{ i18n.messages().shop.orderSummary }}</h3>

                <div class="summary-items">
                  @for (item of cart.items(); track item.product.id) {
                    <div class="summary-item">
                      <img [src]="item.product.imageUrl" [alt]="item.product.name" class="summary-thumb" />
                      <div class="summary-item-info">
                        <span class="summary-item-name">{{ item.product.name }}</span>
                        <span class="summary-item-qty">{{ item.quantity }} × {{ item.product.price | currency }}</span>
                      </div>
                      <span class="summary-item-total">{{ item.product.price * item.quantity | currency }}</span>
                    </div>
                  }
                </div>

                <mat-divider />

                <div class="summary-line">
                  <span>{{ i18n.messages().shop.subtotal }}</span>
                  <span>{{ cart.totalAmount() | currency }}</span>
                </div>
                <div class="summary-line">
                  <span>{{ i18n.messages().shop.shipping }}</span>
                  <span class="shipping-tbd">{{ i18n.messages().shop.shippingToCalculate }}</span>
                </div>
                <mat-divider />
                <div class="summary-line summary-total">
                  <strong>{{ i18n.messages().shop.total }}</strong>
                  <strong>{{ cart.totalAmount() | currency }}</strong>
                </div>
                <p class="items-count">{{ cart.totalItems() }} {{ i18n.messages().shop.items }}</p>
              </div>
            </aside>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .checkout-container {
      max-width: 1200px;
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

    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #b0bec5; }
    .empty-cart h2 { color: var(--shop-text); margin-top: 8px; }
    .empty-cart p { color: var(--shop-text-secondary); margin-bottom: 16px; }

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 32px;
      align-items: start;
    }

    .checkout-main { min-width: 0; }

    .checkout-stepper { background: transparent; }
    .step-content { padding: 24px 0; }

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

    .cart-item-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--shop-border);
      border-radius: 8px;
      background: var(--shop-surface);
    }

    .cart-item-thumb {
      width: 56px;
      height: 56px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .item-name {
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-sku { font-size: 12px; color: var(--shop-text-secondary); }

    .item-controls { display: flex; align-items: center; gap: 4px; }

    .item-qty {
      min-width: 28px;
      text-align: center;
      font-weight: 500;
      font-size: 15px;
    }

    .item-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 90px;
    }

    .unit-price { font-size: 11px; color: var(--shop-text-secondary); }
    .line-total { font-weight: 600; font-size: 14px; }

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

    .full-width { width: 100%; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-row-3 { grid-template-columns: 1fr 1fr 1fr; }

    .review-card { margin-bottom: 16px; }

    .review-card mat-card-content { padding-top: 8px; }

    .review-card mat-card-content p {
      margin: 2px 0;
      color: var(--shop-text-secondary);
      font-size: 14px;
    }

    .review-card mat-card-content p strong { color: var(--shop-text); }

    .cpf-cnpj {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 13px !important;
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

    .terms-section {
      margin: 16px 0;
      padding: 16px;
      background: var(--shop-code-bg);
      border-radius: 8px;
    }

    .terms-error {
      color: var(--shop-error);
      font-size: 12px;
      margin: 4px 0 0 32px;
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

    .place-order-btn { min-width: 180px; }

    .place-order-btn mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    .confirmation-step { text-align: center; padding: 40px 0; }

    .confirmation-icon mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--shop-success);
    }

    .confirmation-title { font-size: 24px; margin: 16px 0 8px; }
    .confirmation-subtitle { color: var(--shop-text-secondary); margin-bottom: 24px; }

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
      background: var(--shop-code-bg);
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

    /* Order Summary Sidebar */
    .order-summary-sidebar { min-width: 0; }

    .summary-sticky {
      position: sticky;
      top: 24px;
      background: var(--shop-surface);
      border: 1px solid var(--shop-border);
      border-radius: 12px;
      padding: 20px;
      box-shadow: var(--shop-shadow);
    }

    .summary-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px;
      color: var(--shop-text);
    }

    .summary-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
      max-height: 300px;
      overflow-y: auto;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .summary-thumb {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .summary-item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .summary-item-name {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .summary-item-qty {
      font-size: 11px;
      color: var(--shop-text-secondary);
    }

    .summary-item-total {
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: var(--shop-text);
    }

    .summary-total {
      font-size: 18px;
      padding: 12px 0 4px;
    }

    .summary-total strong { color: var(--shop-primary); }

    .shipping-tbd {
      font-style: italic;
      color: var(--shop-text-secondary);
    }

    .items-count {
      text-align: center;
      font-size: 12px;
      color: var(--shop-text-secondary);
      margin: 8px 0 0;
    }

    @media (max-width: 900px) {
      .checkout-layout {
        grid-template-columns: 1fr;
      }

      .order-summary-sidebar { order: -1; }

      .summary-sticky {
        position: static;
      }
    }

    @media (max-width: 600px) {
      .cart-item-row { flex-wrap: wrap; }
      .item-info { flex-basis: calc(100% - 68px); }
      .form-row { grid-template-columns: 1fr; }
      .form-row-3 { grid-template-columns: 1fr; }
      .step-actions { flex-direction: column; }
      .confirmation-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `],
})
export class CheckoutComponent {
  protected readonly cart = inject(CartService);
  protected readonly i18n = inject(I18nService);
  private readonly ordersFacade = inject(OrdersFacade);
  private readonly paymentsFacade = inject(PaymentsFacade);
  private readonly tenantCtx = inject(TenantContextService);
  private readonly authStore = inject(AuthStore);
  private readonly configService = inject(RuntimeConfigService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly stepper = viewChild<MatStepper>('stepper');

  private get customerId(): string {
    return this.authStore.session()?.email ?? 'anonymous';
  }

  private get tenantId(): string {
    return this.tenantCtx.getActiveTenantId() ?? '';
  }

  private get currency(): string {
    return 'BRL';
  }

  readonly shippingForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zip: ['', Validators.required],
    country: ['Brasil', Validators.required],
    cpfCnpj: ['', Validators.required],
  });

  readonly termsAccepted = this.fb.nonNullable.control(false, Validators.requiredTrue);

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
    this.termsAccepted.markAsTouched();
    if (this.termsAccepted.invalid) return;

    this.checkoutError.set(null);
    this.processing.set(true);
    const msgs = this.i18n.messages().shop;

    if (this.tenantId) {
      this.tenantCtx.setActiveTenantId(this.tenantId);
    }

    try {
      const order = await this.ordersFacade.createOrder({
        customerId: this.customerId,
        items: this.cart.toOrderItems(),
      });

      if (!order) {
        this.checkoutError.set(msgs.failedCreateOrder);
        return;
      }

      const paymentReq: CreatePaymentIntentRequest = {
        amount: order.totalAmount,
        currency: order.currency,
        customer_ref: this.customerId,
      };
      const payment = await this.paymentsFacade.createPayment(paymentReq);

      if (!payment) {
        this.checkoutError.set(msgs.failedCreatePayment);
        return;
      }

      const confirmedPayment = await this.paymentsFacade.confirmPayment(payment.id);
      if (!confirmedPayment) {
        this.checkoutError.set(msgs.failedConfirmPayment);
        return;
      }

      const confirmedOrd = await this.ordersFacade.confirmOrder(order.id);
      if (!confirmedOrd) {
        this.checkoutError.set(msgs.failedConfirmOrder);
        return;
      }

      this.confirmedOrder.set(confirmedOrd);
      this.cart.clear();
      this.stepper()?.next();
    } catch (e) {
      this.checkoutError.set(
        e instanceof Error ? e.message : msgs.unexpectedError
      );
    } finally {
      this.processing.set(false);
    }
  }
}

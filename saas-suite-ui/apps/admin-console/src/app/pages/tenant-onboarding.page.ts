import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { TenantOnboardingStore, OrgInfo, OnboardingConfig } from '@saas-suite/domains/admin';
import { TenantPlan } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';

interface PlanOption {
  key: TenantPlan;
  name: string;
  price: string;
  recommended: boolean;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$49/mo',
    recommended: false,
    features: ['5 users', '100 orders/mo', 'Basic support', 'Standard dashboard'],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: '$149/mo',
    recommended: true,
    features: ['25 users', '1,000 orders/mo', 'Priority support', 'Analytics & insights', 'API access'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    recommended: false,
    features: ['Unlimited users', 'Unlimited orders', '24/7 dedicated support', 'Custom integrations', 'SLA guarantee', 'SSO & SCIM'],
  },
];

const REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'eu-west-1', label: 'EU West (Ireland)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

function slugValidator(ctrl: AbstractControl): ValidationErrors | null {
  if (!ctrl.value) return null;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ctrl.value) ? null : { slug: true };
}

@Component({
  selector: 'app-tenant-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <div class="onboarding-container">
      <header class="onboarding-header">
        <mat-icon class="header-icon">rocket_launch</mat-icon>
        <h1>Create New Tenant</h1>
        <p>Set up a new organization in just a few steps</p>
      </header>

      <mat-stepper linear #stepper class="onboarding-stepper" (selectionChange)="onStepChange($event)">

        <!-- Step 1: Organization Info -->
        <mat-step [stepControl]="orgForm" label="Organization">
          <div class="step-content">
            <h2 class="step-title">Organization Information</h2>
            <p class="step-subtitle">Tell us about the new tenant</p>

            <form [formGroup]="orgForm" class="org-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Organization Name</mat-label>
                <input matInput formControlName="name" [placeholder]="i18n.messages().adminPlaceholders.orgName" (input)="onNameChange()">
                @if (orgForm.controls['name'].hasError('required') && orgForm.controls['name'].touched) {
                  <mat-error>Name is required</mat-error>
                }
                @if (orgForm.controls['name'].hasError('minlength')) {
                  <mat-error>Name must be at least 3 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Slug</mat-label>
                <input matInput formControlName="slug" [placeholder]="i18n.messages().adminPlaceholders.orgSlug">
                <mat-hint>URL-safe identifier (lowercase, hyphens only)</mat-hint>
                @if (orgForm.controls['slug'].hasError('required') && orgForm.controls['slug'].touched) {
                  <mat-error>Slug is required</mat-error>
                }
                @if (orgForm.controls['slug'].hasError('slug')) {
                  <mat-error>Must be lowercase letters, numbers, and hyphens only</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Region</mat-label>
                <mat-select formControlName="region">
                  @for (r of regions; track r.value) {
                    <mat-option [value]="r.value">{{ r.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </form>

            <div class="step-actions">
              <button mat-flat-button color="primary" matStepperNext [disabled]="orgForm.invalid">
                Continue
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 2: Plan Selection -->
        <mat-step [completed]="selectedPlan() !== null" label="Plan">
          <div class="step-content">
            <h2 class="step-title">Choose a Plan</h2>
            <p class="step-subtitle">Select the plan that best fits your needs</p>

            <div class="plans-grid">
              @for (plan of plans; track plan.key) {
                <mat-card
                  class="plan-card"
                  [class.plan-selected]="selectedPlan() === plan.key"
                  [class.plan-recommended]="plan.recommended"
                  (click)="selectPlan(plan.key)"
                  tabindex="0"
                  (keydown.enter)="selectPlan(plan.key)"
                  (keydown.space)="selectPlan(plan.key)">

                  @if (plan.recommended) {
                    <div class="recommended-badge">Recommended</div>
                  }

                  <mat-card-header>
                    <mat-card-title>{{ plan.name }}</mat-card-title>
                    <mat-card-subtitle>{{ plan.price }}</mat-card-subtitle>
                  </mat-card-header>

                  <mat-card-content>
                    <mat-list dense>
                      @for (feature of plan.features; track feature) {
                        <mat-list-item>
                          <mat-icon matListItemIcon class="feature-check">check_circle</mat-icon>
                          <span>{{ feature }}</span>
                        </mat-list-item>
                      }
                    </mat-list>
                  </mat-card-content>

                  <mat-card-actions align="end">
                    <button mat-stroked-button
                      [color]="selectedPlan() === plan.key ? 'primary' : undefined">
                      {{ selectedPlan() === plan.key ? 'Selected' : 'Select' }}
                    </button>
                  </mat-card-actions>
                </mat-card>
              }
            </div>

            <div class="step-actions">
              <button mat-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-flat-button color="primary" matStepperNext [disabled]="!selectedPlan()">
                Continue
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 3: Configuration -->
        <mat-step [stepControl]="configForm" label="Configuration">
          <div class="step-content">
            <h2 class="step-title">Initial Configuration</h2>
            <p class="step-subtitle">Set up feature flags and admin access</p>

            <form [formGroup]="configForm">
              <mat-card class="config-section">
                <mat-card-header>
                  <mat-icon mat-card-avatar>toggle_on</mat-icon>
                  <mat-card-title>Feature Flags</mat-card-title>
                  <mat-card-subtitle>Enable features for this tenant</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="flags-list">
                    @for (flag of store.config().flags; track flag.name) {
                      <div class="flag-row">
                        <div class="flag-info">
                          <span class="flag-label">{{ flag.label }}</span>
                          <span class="flag-desc">{{ flag.description }}</span>
                        </div>
                        <mat-slide-toggle
                          [checked]="flag.enabled"
                          (change)="store.updateFlag(flag.name, $event.checked)"
                          color="primary">
                        </mat-slide-toggle>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="config-section">
                <mat-card-header>
                  <mat-icon mat-card-avatar>admin_panel_settings</mat-icon>
                  <mat-card-title>Admin User</mat-card-title>
                  <mat-card-subtitle>Invite the first administrator</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Admin Email</mat-label>
                    <input matInput formControlName="adminEmail" [placeholder]="i18n.messages().adminPlaceholders.adminEmail" type="email">
                    @if (configForm.controls['adminEmail'].hasError('required') && configForm.controls['adminEmail'].touched) {
                      <mat-error>Admin email is required</mat-error>
                    }
                    @if (configForm.controls['adminEmail'].hasError('email')) {
                      <mat-error>Enter a valid email address</mat-error>
                    }
                  </mat-form-field>
                </mat-card-content>
              </mat-card>
            </form>

            <div class="step-actions">
              <button mat-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-flat-button color="primary" matStepperNext [disabled]="configForm.invalid">
                Review
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 4: Review & Create -->
        <mat-step label="Review" [editable]="!store.submitting()">
          <div class="step-content">
            <h2 class="step-title">Review & Create</h2>
            <p class="step-subtitle">Confirm your setup before creating the tenant</p>

            <div class="review-cards">
              <mat-card class="review-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>business</mat-icon>
                  <mat-card-title>Organization</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="review-row">
                    <span class="review-label">Name</span>
                    <span class="review-value">{{ store.orgInfo().name }}</span>
                  </div>
                  <mat-divider />
                  <div class="review-row">
                    <span class="review-label">Slug</span>
                    <span class="review-value mono">{{ store.orgInfo().slug }}</span>
                  </div>
                  <mat-divider />
                  <div class="review-row">
                    <span class="review-label">Region</span>
                    <span class="review-value">{{ regionLabel(store.orgInfo().region) }}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="review-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>payments</mat-icon>
                  <mat-card-title>Plan</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="review-row">
                    <span class="review-label">Selected Plan</span>
                    <mat-chip-set>
                      <mat-chip highlighted>{{ planLabel(store.plan()) }}</mat-chip>
                    </mat-chip-set>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="review-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>settings</mat-icon>
                  <mat-card-title>Configuration</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="review-row">
                    <span class="review-label">Admin Email</span>
                    <span class="review-value">{{ store.config().adminEmail }}</span>
                  </div>
                  <mat-divider />
                  <div class="review-row">
                    <span class="review-label">Feature Flags</span>
                    <div class="review-flags">
                      @for (flag of enabledFlags(); track flag.name) {
                        <mat-chip-set>
                          <mat-chip>{{ flag.label }}</mat-chip>
                        </mat-chip-set>
                      }
                      @if (enabledFlags().length === 0) {
                        <span class="review-value muted">None enabled</span>
                      }
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            @if (store.submitting()) {
              <mat-progress-bar mode="determinate" [value]="store.progress()" class="creation-progress" />
              <p class="progress-text">Creating tenant... {{ store.progress() }}%</p>
            }

            @if (store.error()) {
              <mat-card class="error-card">
                <mat-icon>error_outline</mat-icon>
                <span>{{ store.error() }}</span>
              </mat-card>
            }

            <div class="step-actions">
              <button mat-button matStepperPrevious [disabled]="store.submitting()">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-flat-button color="primary"
                [disabled]="store.submitting()"
                (click)="onSubmit(stepper)">
                @if (store.submitting()) {
                  Creating...
                } @else {
                  <ng-container>
                    <mat-icon>check</mat-icon>
                    Create Tenant
                  </ng-container>
                }
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 5: Success -->
        <mat-step label="Done" [editable]="false">
          <div class="step-content success-content">
            <div class="success-icon-wrapper">
              <mat-icon class="success-icon">check_circle</mat-icon>
            </div>
            <h2 class="success-title">Tenant Created Successfully!</h2>
            <p class="success-subtitle">Your new tenant is ready to go</p>

            @if (store.createdTenant(); as tenant) {
              <mat-card class="success-details">
                <mat-card-content>
                  <div class="review-row">
                    <span class="review-label">Tenant ID</span>
                    <span class="review-value mono">{{ tenant.id }}</span>
                  </div>
                  <mat-divider />
                  <div class="review-row">
                    <span class="review-label">Name</span>
                    <span class="review-value">{{ tenant.name }}</span>
                  </div>
                  <mat-divider />
                  <div class="review-row">
                    <span class="review-label">Status</span>
                    <mat-chip-set>
                      <mat-chip highlighted>{{ tenant.status }}</mat-chip>
                    </mat-chip-set>
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <div class="success-actions">
              <button mat-flat-button color="primary" (click)="goToTenant()">
                <mat-icon>open_in_new</mat-icon>
                Go to Tenant
              </button>
              <button mat-stroked-button (click)="createAnother(stepper)">
                <mat-icon>add</mat-icon>
                Create Another
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    .onboarding-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--app-primary, #1565c0);
      margin-bottom: 8px;
    }
    .onboarding-header h1 {
      margin: 0 0 4px;
      font-size: 28px;
      font-weight: 500;
      color: var(--app-text, #212121);
    }
    .onboarding-header p {
      margin: 0;
      color: var(--app-text-secondary, #666);
      font-size: 15px;
    }

    .onboarding-stepper {
      background: transparent;
    }

    .step-content {
      padding: 24px 0;
    }
    .step-title {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 500;
      color: var(--app-text, #212121);
    }
    .step-subtitle {
      margin: 0 0 24px;
      color: var(--app-text-secondary, #666);
      font-size: 14px;
    }
    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
    }

    /* Org form */
    .org-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 520px;
    }
    .full-width {
      width: 100%;
    }

    /* Plan cards */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .plan-card {
      cursor: pointer;
      position: relative;
      transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
      border: 2px solid transparent;
      border-radius: 12px;
      overflow: visible;
    }
    .plan-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
    .plan-selected {
      border-color: var(--app-primary, #1565c0);
      box-shadow: 0 4px 16px rgba(21, 101, 192, 0.15);
    }
    .plan-recommended {
      border-color: var(--app-primary, #1565c0);
    }
    .recommended-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--app-primary, #1565c0);
      color: white;
      padding: 2px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .feature-check {
      color: var(--app-primary, #1565c0);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Config section */
    .config-section {
      margin-bottom: 20px;
      border-radius: 12px;
    }
    .config-section mat-icon[mat-card-avatar] {
      color: var(--app-primary, #1565c0);
      background: rgba(21, 101, 192, 0.08);
      border-radius: 50%;
      padding: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .flags-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 8px;
    }
    .flag-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .flag-info {
      display: flex;
      flex-direction: column;
    }
    .flag-label {
      font-weight: 500;
      font-size: 14px;
      color: var(--app-text, #212121);
    }
    .flag-desc {
      font-size: 12px;
      color: var(--app-text-secondary, #666);
      margin-top: 2px;
    }

    /* Review */
    .review-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .review-card {
      border-radius: 12px;
    }
    .review-card mat-icon[mat-card-avatar] {
      color: var(--app-primary, #1565c0);
      background: rgba(21, 101, 192, 0.08);
      border-radius: 50%;
      padding: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .review-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }
    .review-label {
      font-size: 13px;
      color: var(--app-text-secondary, #666);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .review-value {
      font-size: 15px;
      color: var(--app-text, #212121);
    }
    .review-value.mono {
      font-family: 'Roboto Mono', monospace;
      background: rgba(0, 0, 0, 0.04);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .review-value.muted {
      color: var(--app-text-secondary, #999);
      font-style: italic;
    }
    .review-flags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .creation-progress {
      margin-top: 24px;
      border-radius: 4px;
    }
    .progress-text {
      text-align: center;
      margin-top: 8px;
      color: var(--app-text-secondary, #666);
      font-size: 14px;
    }
    .error-card {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 16px;
      background: var(--app-chip-deny-bg);
      color: var(--app-chip-deny-text);
      border-radius: 8px;
    }

    /* Success */
    .success-content {
      text-align: center;
      padding-top: 48px;
    }
    .success-icon-wrapper {
      margin-bottom: 16px;
    }
    .success-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: var(--app-chip-allow-text);
      animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .success-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 4px;
      color: var(--app-text, #212121);
    }
    .success-subtitle {
      margin: 0 0 32px;
      color: var(--app-text-secondary, #666);
    }
    .success-details {
      max-width: 480px;
      margin: 0 auto 32px;
      text-align: left;
      border-radius: 12px;
    }
    .success-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }

    @keyframes scaleIn {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @media (max-width: 768px) {
      .plans-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class TenantOnboardingPage implements OnInit, OnDestroy {
  readonly store = inject(TenantOnboardingStore);
  protected readonly i18n = inject(I18nService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly plans = PLANS;
  readonly regions = REGIONS;
  readonly selectedPlan = signal<TenantPlan | null>('professional');

  readonly enabledFlags = computed(() =>
    this.store.config().flags.filter(f => f.enabled)
  );

  readonly orgForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, slugValidator]],
    region: ['us-east-1', Validators.required],
  });

  readonly configForm: FormGroup = this.fb.group({
    adminEmail: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.store.reset();
    this.store.setPlan('professional');
  }

  ngOnDestroy(): void {
    this.store.reset();
  }

  onNameChange(): void {
    const name = this.orgForm.get('name')?.value ?? '';
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.orgForm.get('slug')?.setValue(slug, { emitEvent: false });
  }

  selectPlan(plan: TenantPlan): void {
    this.selectedPlan.set(plan);
    this.store.setPlan(plan);
  }

  onStepChange(event: { selectedIndex: number }): void {
    if (event.selectedIndex >= 1) {
      const org: OrgInfo = {
        name: this.orgForm.get('name')?.value,
        slug: this.orgForm.get('slug')?.value,
        region: this.orgForm.get('region')?.value,
      };
      this.store.setOrgInfo(org);
    }
    if (event.selectedIndex >= 3) {
      const cfg: OnboardingConfig = {
        flags: this.store.config().flags,
        adminEmail: this.configForm.get('adminEmail')?.value,
      };
      this.store.setConfig(cfg);
    }
  }

  async onSubmit(stepper: { next: () => void }): Promise<void> {
    const org: OrgInfo = {
      name: this.orgForm.get('name')?.value,
      slug: this.orgForm.get('slug')?.value,
      region: this.orgForm.get('region')?.value,
    };
    this.store.setOrgInfo(org);

    const cfg: OnboardingConfig = {
      flags: this.store.config().flags,
      adminEmail: this.configForm.get('adminEmail')?.value,
    };
    this.store.setConfig(cfg);

    await this.store.submitOnboarding();

    if (this.store.createdTenant()) {
      stepper.next();
    }
  }

  goToTenant(): void {
    const tenant = this.store.createdTenant();
    if (tenant) {
      this.router.navigate(['/tenants', tenant.id]);
    }
  }

  createAnother(stepper: { reset: () => void }): void {
    this.store.reset();
    this.orgForm.reset({ name: '', slug: '', region: 'us-east-1' });
    this.configForm.reset({ adminEmail: '' });
    this.selectedPlan.set('professional');
    stepper.reset();
  }

  regionLabel(value: string): string {
    return REGIONS.find(r => r.value === value)?.label ?? value;
  }

  planLabel(key: TenantPlan): string {
    return PLANS.find(p => p.key === key)?.name ?? key;
  }
}

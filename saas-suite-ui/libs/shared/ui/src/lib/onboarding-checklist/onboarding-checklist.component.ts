import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { OnboardingChecklistStore } from '@saas-suite/domains/admin';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'saas-onboarding-checklist[mainTop]',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    @if (store.showChecklist()) {
      <div class="checklist-wrapper" role="region" [attr.aria-label]="title()">
        <mat-card class="checklist-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="checklist-icon">check_circle</mat-icon>
            <mat-card-title>{{ title() }}</mat-card-title>
            <mat-card-subtitle>{{ subtitle() }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <ul class="steps-list">
              <li class="step" [class.done]="store.completedSteps().createTenant">
                <mat-icon class="step-icon">{{ store.completedSteps().createTenant ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>{{ step1Label() }}</span>
                @if (!store.completedSteps().createTenant) {
                  <a mat-button routerLink="/onboarding">{{ actionNewTenant() }}</a>
                }
              </li>
              <li class="step" [class.done]="store.completedSteps().inviteUser">
                <mat-icon class="step-icon">{{ store.completedSteps().inviteUser ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>{{ step2Label() }}</span>
                @if (!store.completedSteps().inviteUser) {
                  <a mat-button routerLink="/users">{{ actionInvite() }}</a>
                }
              </li>
              <li class="step" [class.done]="store.completedSteps().configureBilling">
                <mat-icon class="step-icon">{{ store.completedSteps().configureBilling ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>{{ step3Label() }}</span>
                @if (!store.completedSteps().configureBilling) {
                  <a mat-button routerLink="/billing">{{ actionBilling() }}</a>
                }
              </li>
            </ul>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button data-testid="dismiss-btn" (click)="store.dismiss()">
              {{ dismissLabel() }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .checklist-wrapper {
      margin-bottom: 24px;
    }
    .checklist-card {
      max-width: 560px;
    }
    .checklist-icon {
      color: var(--app-primary, #1565c0);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .steps-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      flex-wrap: wrap;
    }
    .step.done {
      color: var(--app-text-secondary, #546e7a);
    }
    .step-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .step.done .step-icon {
      color: var(--success, #2e7d32);
    }
  `],
})
export class OnboardingChecklistComponent {
  readonly store = inject(OnboardingChecklistStore);
  private readonly i18n = inject(I18nService);

  title = () => this.i18n.messages()?.onboardingChecklist?.checklistTitle ?? 'Conclua sua configuração';
  subtitle = () => this.i18n.messages()?.onboardingChecklist?.checklistSubtitle ?? 'Siga os passos para começar.';
  step1Label = () => this.i18n.messages()?.onboardingChecklist?.stepCreateTenant ?? 'Criar organização (tenant)';
  step2Label = () => this.i18n.messages()?.onboardingChecklist?.stepInviteUser ?? 'Convidar usuário';
  step3Label = () => this.i18n.messages()?.onboardingChecklist?.stepConfigureBilling ?? 'Configurar billing';
  actionNewTenant = () => this.i18n.messages()?.onboardingChecklist?.actionNewTenant ?? 'Criar';
  actionInvite = () => this.i18n.messages()?.onboardingChecklist?.actionInvite ?? 'Convidar';
  actionBilling = () => this.i18n.messages()?.onboardingChecklist?.actionBilling ?? 'Configurar';
  dismissLabel = () => this.i18n.messages()?.onboardingChecklist?.dismiss ?? 'Dispensar';
}

import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '@saas-suite/shared/ui';
import { LedgerFacade } from '@saas-suite/data-access/payments';
import { I18nService } from '@saas-suite/shared/i18n';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-ledger-balances',
  standalone: true,
  imports: [DecimalPipe, MatCardModule, MatProgressBarModule, MatButtonModule, MatIconModule, EmptyStateComponent],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().ops.ledgerBalancesTitle }}</h1>
      <button mat-stroked-button (click)="refresh()"><mat-icon>refresh</mat-icon> {{ i18n.messages().admin.refresh }}</button>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.balances().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="balance"
        [title]="i18n.messages().ops.noBalancesFound"
        [subtitle]="i18n.messages().ops.noBalancesFoundSubtitle"
      />
    } @else {
      <div class="balances-grid">
        @for (b of facade.balances(); track b.currency) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ b.currency }}</mat-card-title>
              <mat-card-subtitle>{{ i18n.messages().ops.updatedAtLabel }}: {{ fmtDate(b.asOf) }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="balance-row">
                <span class="label">{{ i18n.messages().ops.credits }}:</span>
                <span class="credit">+{{ b.totalCredits | number:'1.2-2' }}</span>
              </div>
              <div class="balance-row">
                <span class="label">{{ i18n.messages().ops.debits }}:</span>
                <span class="debit">-{{ b.totalDebits | number:'1.2-2' }}</span>
              </div>
              <div class="balance-row total">
                <span class="label">{{ i18n.messages().ledger.balance }}:</span>
                <span [class]="b.balance >= 0 ? 'credit' : 'debit'">{{ b.balance | number:'1.2-2' }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .balances-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--app-space-16, 16px); }
    .balance-row { display: flex; justify-content: space-between; padding: var(--app-space-8, 8px) 0; border-bottom: 1px solid var(--app-border); }
    .balance-row.total { border-bottom: none; font-weight: 700; font-size: var(--app-font-size-title, 18px); }
    .label { color: var(--app-text-secondary); }
    .credit { color: var(--app-chip-allow-text); }
    .debit { color: var(--app-chip-deny-text); }
  `],
})
export class LedgerBalancesPage implements OnInit {
  protected facade = inject(LedgerFacade);
  protected i18n = inject(I18nService);
  columns = ['currency', 'totalCredits', 'totalDebits', 'balance', 'asOf'];

  async ngOnInit(): Promise<void> { await this.facade.loadBalances(); }
  async refresh(): Promise<void> { await this.facade.loadBalances(); }
  fmtDate(d: string): string { return formatDateTime(d); }
}

import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '@saas-suite/shared/ui';
import { LedgerFacade } from '@saas-suite/data-access/payments';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-ledger-balances',
  standalone: true,
  imports: [DecimalPipe, MatCardModule, MatProgressBarModule, MatButtonModule, MatIconModule, EmptyStateComponent],
  template: `
    <div class="page-header">
      <h1>Ledger — Balanços</h1>
      <button mat-stroked-button (click)="refresh()"><mat-icon>refresh</mat-icon> Atualizar</button>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.balances().length === 0 && !facade.loading()) {
      <saas-empty-state icon="balance" title="Nenhum balanço disponível" />
    } @else {
      <div class="balances-grid">
        @for (b of facade.balances(); track b.currency) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ b.currency }}</mat-card-title>
              <mat-card-subtitle>Atualizado: {{ fmtDate(b.asOf) }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="balance-row">
                <span class="label">Créditos:</span>
                <span class="credit">+{{ b.totalCredits | number:'1.2-2' }}</span>
              </div>
              <div class="balance-row">
                <span class="label">Débitos:</span>
                <span class="debit">-{{ b.totalDebits | number:'1.2-2' }}</span>
              </div>
              <div class="balance-row total">
                <span class="label">Saldo:</span>
                <span [class]="b.balance >= 0 ? 'credit' : 'debit'">{{ b.balance | number:'1.2-2' }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .balances-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .balance-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--app-border); }
    .balance-row.total { border-bottom: none; font-weight: 700; font-size: 18px; }
    .label { color: var(--app-text-secondary); }
    .credit { color: var(--app-chip-allow-text); }
    .debit { color: var(--app-chip-deny-text); }
  `],
})
export class LedgerBalancesPage implements OnInit {
  protected facade = inject(LedgerFacade);
  columns = ['currency', 'totalCredits', 'totalDebits', 'balance', 'asOf'];

  async ngOnInit(): Promise<void> { await this.facade.loadBalances(); }
  async refresh(): Promise<void> { await this.facade.loadBalances(); }
  fmtDate(d: string): string { return formatDateTime(d); }
}

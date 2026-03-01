import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { StatusChipComponent, ConfirmDialogComponent } from '@saas-suite/shared/ui';
import { PaymentsApiClient, PaymentsFacade, PaymentIntent } from '@saas-suite/data-access/payments';
import { formatDateTime } from '@saas-suite/shared/util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    StatusChipComponent,
  ],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (payment(); as p) {
      <div class="page-header">
        <div>
          <h1>Pagamento <code>{{ p.id.substring(0, 8) }}...</code></h1>
          <saas-status-chip [status]="p.status" />
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> Voltar</button>
          @if (p.status === 'PENDING') {
            <button mat-raised-button color="primary" (click)="confirm()"><mat-icon>check</mat-icon> Confirmar</button>
          }
        </div>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>Detalhes</mat-card-title></mat-card-header>
        <mat-card-content>
          <p><strong>ID:</strong> <code>{{ p.id }}</code></p>
          <p><strong>Pedido:</strong> <a [routerLink]="['/orders', p.orderId]">{{ p.orderId }}</a></p>
          <p><strong>Cliente:</strong> {{ p.customerId }}</p>
          <p><strong>Valor:</strong> {{ p.currency }} {{ p.amount | number:'1.2-2' }}</p>
          <p><strong>Status:</strong> <saas-status-chip [status]="p.status" /></p>
          <p><strong>Criado em:</strong> {{ fmtDate(p.createdAt) }}</p>
          <p><strong>Atualizado em:</strong> {{ fmtDate(p.updatedAt) }}</p>
          @if (p.correlationId) {
            <p><strong>Correlation ID:</strong> <code>{{ p.correlationId }}</code></p>
          }
        </mat-card-content>
      </mat-card>
    } @else if (!loading()) {
      <p>Pagamento não encontrado.</p>
      <button mat-stroked-button (click)="goBack()">Voltar à lista</button>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 12px 0 0; display: inline; }
    .actions { display: flex; gap: 8px; }
    mat-card { border-radius: 12px; }
    mat-card-content { padding: 20px !important; }
    mat-card-content p { margin: 8px 0; }
    mat-card-content a { color: var(--app-primary); }
  `],
})
export class PaymentDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(PaymentsApiClient);
  private facade = inject(PaymentsFacade);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  payment = signal<PaymentIntent | null>(null);
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    try {
      const p = await firstValueFrom(this.api.getPayment(id));
      this.payment.set(p);
    } catch {
      this.snackBar.open('Pagamento não encontrado', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async confirm(): Promise<void> {
    const p = this.payment();
    if (!p || p.status !== 'PENDING') return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirmar pagamento?', message: `Confirmar pagamento de ${p.currency} ${p.amount}?` },
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    const updated = await this.facade.confirmPayment(p.id);
    if (updated) {
      this.payment.set(updated);
      this.snackBar.open('Pagamento confirmado', 'OK', { duration: 2000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/payments']);
  }

  fmtDate(d: string): string {
    return formatDateTime(d);
  }
}

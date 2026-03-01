import { Component, Input, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'saas-status-chip',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <span
      [class]="'chip chip-' + status.toLowerCase()"
      role="status"
      [attr.aria-label]="'Status: ' + displayLabel()">
      <mat-icon class="chip-icon" aria-hidden="true">{{ statusIcon() }}</mat-icon>
      {{ displayLabel() }}
    </span>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.4;
    }
    .chip-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .chip-active, .chip-paid, .chip-confirmed, .chip-success, .chip-allow, .chip-in {
      background: var(--app-chip-allow-bg);
      color: var(--app-chip-allow-text);
    }
    .chip-suspended, .chip-cancelled, .chip-failed, .chip-denied, .chip-error, .chip-deny {
      background: var(--app-chip-deny-bg);
      color: var(--app-chip-deny-text);
    }
    .chip-pending, .chip-reserved, .chip-out {
      background: var(--app-chip-warn-bg, #fff3e0);
      color: var(--app-chip-warn-text, #e65100);
    }
    .chip-draft, .chip-adjustment {
      background: var(--app-surface-variant);
      color: var(--app-text-secondary);
    }
    .chip-credit { background: var(--app-chip-allow-bg); color: var(--app-chip-allow-text); }
    .chip-debit { background: var(--app-chip-deny-bg); color: var(--app-chip-deny-text); }
  `],
})
export class StatusChipComponent {
  @Input() status = '';
  @Input() label?: string;

  private static readonly ICON_MAP: Record<string, string> = {
    active: 'check_circle', paid: 'check_circle', confirmed: 'check_circle',
    success: 'check_circle', allow: 'check_circle', in: 'check_circle', credit: 'check_circle',
    suspended: 'cancel', cancelled: 'cancel', failed: 'cancel',
    denied: 'cancel', error: 'cancel', deny: 'cancel', debit: 'remove_circle',
    pending: 'schedule', reserved: 'schedule', out: 'schedule',
    draft: 'edit_note', adjustment: 'tune',
  };

  displayLabel = computed(() => this.label ?? this.formatStatus(this.status));

  statusIcon = computed(() => {
    const key = this.status.toLowerCase();
    return StatusChipComponent.ICON_MAP[key] ?? 'info';
  });

  private formatStatus(s: string): string {
    return s.replace(/_/g, ' ');
  }
}

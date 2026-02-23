import { Component, Input } from '@angular/core';

@Component({
  selector: 'saas-status-chip',
  standalone: true,
  template: `<span [class]="'chip chip-' + status.toLowerCase()">{{ label ?? formatStatus(status) }}</span>`,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.4;
    }
    .chip-active, .chip-paid, .chip-confirmed, .chip-success, .chip-allow, .chip-in {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .chip-suspended, .chip-cancelled, .chip-failed, .chip-denied, .chip-error, .chip-deny {
      background: #ffebee;
      color: #c62828;
    }
    .chip-pending, .chip-reserved, .chip-out {
      background: #fff3e0;
      color: #e65100;
    }
    .chip-draft, .chip-adjustment {
      background: #eceff1;
      color: #546e7a;
    }
    .chip-credit { background: #e8f5e9; color: #2e7d32; }
    .chip-debit { background: #fce4ec; color: #c62828; }
  `],
})
export class StatusChipComponent {
  @Input() status = '';
  @Input() label?: string;

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ');
  }
}

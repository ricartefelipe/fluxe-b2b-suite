import { Component, Input } from '@angular/core';

@Component({
  selector: 'saas-status-chip',
  standalone: true,
  template: `<span [class]="'chip chip-' + status.toLowerCase()">{{ label ?? status }}</span>`,
  styles: [`
    .chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .chip-active, .chip-paid, .chip-confirmed { background: #e8f5e9; color: #2e7d32; }
    .chip-suspended, .chip-cancelled, .chip-failed { background: #ffebee; color: #c62828; }
    .chip-pending, .chip-reserved { background: #fff3e0; color: #e65100; }
    .chip-draft { background: #f5f5f5; color: #616161; }
  `],
})
export class StatusChipComponent {
  @Input() status = '';
  @Input() label?: string;
}

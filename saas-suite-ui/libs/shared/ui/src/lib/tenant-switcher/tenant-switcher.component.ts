import { Component, inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TenantContextService } from '@saas-suite/shared/http';

interface TenantOption { id: string; name: string; }

@Component({
  selector: 'saas-tenant-switcher',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, FormsModule],
  template: `
    <mat-form-field appearance="outline" class="tenant-select" subscriptSizing="dynamic">
      <mat-label>Tenant</mat-label>
      <mat-select [(ngModel)]="selectedId" (ngModelChange)="onChange($event)">
        @for (t of tenants; track t.id) {
          <mat-option [value]="t.id">{{ t.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [`.tenant-select { min-width: 180px; margin-right: 8px; }`],
})
export class TenantSwitcherComponent {
  private tenantCtx = inject(TenantContextService);
  tenants: TenantOption[] = [];
  selectedId: string | null = this.tenantCtx.getActiveTenantId();

  setTenants(list: TenantOption[]): void {
    this.tenants = list;
  }

  onChange(id: string): void {
    this.tenantCtx.setActiveTenantId(id);
  }
}

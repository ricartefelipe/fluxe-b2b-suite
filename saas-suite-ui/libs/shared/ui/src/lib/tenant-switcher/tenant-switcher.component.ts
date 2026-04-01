import { Component, inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TenantContextService } from '@saas-suite/shared/http';

@Component({
  selector: 'saas-tenant-switcher',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, FormsModule],
  template: `
    @if (tenantCtx.tenantOptions().length > 0) {
      <div class="switcher">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="compact-field">
          <mat-label>Tenant</mat-label>
          <mat-select
            [ngModel]="tenantCtx.activeTenantId()"
            (ngModelChange)="tenantCtx.setActiveTenantId($event)"
          >
            @for (t of tenantCtx.tenantOptions(); track t.id) {
              <mat-option [value]="t.id">{{ t.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    }
  `,
  styles: [`
    .switcher { margin-right: 4px; }
    .compact-field {
      font-size: 12px;
    }
    :host ::ng-deep .compact-field .mat-mdc-form-field-infix { min-height: 36px; padding: 6px 0 !important; }
    :host ::ng-deep .compact-field .mdc-notched-outline__leading,
    :host ::ng-deep .compact-field .mdc-notched-outline__notch,
    :host ::ng-deep .compact-field .mdc-notched-outline__trailing {
      border-color: #e0e0e0 !important;
    }
  `],
})
export class TenantSwitcherComponent {
  protected readonly tenantCtx = inject(TenantContextService);
}

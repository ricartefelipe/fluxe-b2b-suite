import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'saas-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title id="confirm-dialog-title">{{ data.title }}</h2>
    <mat-dialog-content id="confirm-dialog-description">{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelLabel ?? i18n.messages().common.cancel }}</button>
      <button
        mat-raised-button
        [color]="data.danger ? 'warn' : 'primary'"
        [mat-dialog-close]="true"
        cdkFocusInitial>
        {{ data.confirmLabel ?? i18n.messages().common.confirm }}
      </button>
    </mat-dialog-actions>
  `,
  host: {
    'role': 'alertdialog',
    'aria-labelledby': 'confirm-dialog-title',
    'aria-describedby': 'confirm-dialog-description',
  },
})
export class ConfirmDialogComponent {
  protected i18n = inject(I18nService);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

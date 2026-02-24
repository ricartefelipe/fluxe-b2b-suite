import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

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
      <button mat-button mat-dialog-close>{{ data.cancelLabel ?? 'Cancelar' }}</button>
      <button
        mat-raised-button
        [color]="data.danger ? 'warn' : 'primary'"
        [mat-dialog-close]="true"
        cdkFocusInitial>
        {{ data.confirmLabel ?? 'Confirmar' }}
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
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}
}

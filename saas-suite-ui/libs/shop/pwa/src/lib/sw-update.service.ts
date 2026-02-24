import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, interval } from 'rxjs';

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.listenForUpdates();
    this.scheduleUpdateChecks();
  }

  private listenForUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const ref = this.snackBar.open(
          'New version available. Reload?',
          'Reload',
          { duration: 0 },
        );

        ref.onAction()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => document.location.reload());
      });
  }

  private scheduleUpdateChecks(): void {
    interval(UPDATE_CHECK_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.swUpdate.checkForUpdate());
  }
}

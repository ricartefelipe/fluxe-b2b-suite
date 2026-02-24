import { Injectable, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService {
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  async announcePageChange(title: string): Promise<void> {
    await this.liveAnnouncer.announce(`Navigated to ${title}`, 'polite');
  }

  async announceAction(message: string): Promise<void> {
    await this.liveAnnouncer.announce(message, 'polite');
  }

  async announceError(message: string): Promise<void> {
    await this.liveAnnouncer.announce(message, 'assertive');
  }
}

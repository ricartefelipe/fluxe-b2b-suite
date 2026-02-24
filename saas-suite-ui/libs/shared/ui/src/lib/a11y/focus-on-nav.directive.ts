import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Directive({
  selector: '[saasFocusOnNav]',
  standalone: true,
})
export class FocusOnNavDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const target = this.el.nativeElement;
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: false });
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

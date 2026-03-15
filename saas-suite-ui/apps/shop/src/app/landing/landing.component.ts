import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="landing">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">Fluxe B2B Suite</h1>
          <p class="hero-subtitle">{{ i18n.messages().landing.subtitle }}</p>
          <p class="hero-desc">{{ i18n.messages().landing.description }}</p>
          <div class="hero-ctas">
            <a mat-raised-button color="primary" routerLink="/signup" class="cta-primary">
              {{ i18n.messages().landing.ctaStart }}
            </a>
            <a mat-stroked-button (click)="scrollTo('features')" (keydown.enter)="scrollTo('features')" (keydown.space)="scrollTo('features'); $event.preventDefault()" tabindex="0" role="button" class="cta-secondary">
              {{ i18n.messages().landing.ctaDemo }}
            </a>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="features">
        <h2 class="section-title">{{ i18n.messages().landing.featuresTitle }}</h2>
        <div class="features-grid">
          @for (f of features; track f.icon) {
            <mat-card class="feature-card">
              <mat-card-content>
                <mat-icon class="feature-icon">{{ f.icon }}</mat-icon>
                <h3>{{ f.title }}</h3>
                <p>{{ f.desc }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </section>

      <!-- Pricing -->
      <section class="pricing">
        <h2 class="section-title">{{ i18n.messages().landing.pricingTitle }}</h2>
        <div class="pricing-grid">
          @for (p of plans; track p.name) {
            <mat-card class="plan-card" [class.plan-featured]="p.featured">
              @if (p.featured) {
                <div class="plan-badge">{{ i18n.messages().landing.popular }}</div>
              }
              <mat-card-header>
                <mat-card-title>{{ p.name }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="plan-price">{{ p.price }}</div>
                <ul class="plan-features">
                  @for (item of p.items; track item) {
                    <li><mat-icon class="check-icon">check_circle</mat-icon> {{ item }}</li>
                  }
                </ul>
              </mat-card-content>
              <mat-card-actions>
                <a mat-raised-button [color]="p.featured ? 'primary' : 'basic'" routerLink="/signup" class="plan-cta">
                  {{ p.cta }}
                </a>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      </section>

      <!-- Tech -->
      <section class="tech">
        <h2 class="section-title">{{ i18n.messages().landing.techTitle }}</h2>
        <div class="tech-badges">
          @for (t of techStack; track t) {
            <span class="tech-badge">{{ t }}</span>
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <p>© 2026 Fluxe B2B Suite — {{ i18n.messages().landing.rights }}</p>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      font-family: 'Inter', 'Roboto', sans-serif;
      color: var(--app-text, #1a1a2e);
    }

    .hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #fff;
      padding: 100px 24px 80px;
      text-align: center;
    }

    .hero-content { max-width: 720px; margin: 0 auto; }
    .hero-title { font-size: 48px; font-weight: 800; margin: 0 0 12px; letter-spacing: -1px; }
    .hero-subtitle { font-size: 22px; font-weight: 400; opacity: 0.9; margin: 0 0 16px; }
    .hero-desc { font-size: 16px; opacity: 0.75; margin: 0 0 32px; line-height: 1.6; }
    .hero-ctas { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .cta-primary { font-size: 16px; padding: 0 32px; height: 48px; }
    .cta-secondary { font-size: 16px; padding: 0 32px; height: 48px; color: #fff; border-color: rgba(255,255,255,0.5); }

    .section-title {
      text-align: center;
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 40px;
      color: var(--app-text, #1a1a2e);
    }

    .features {
      padding: 80px 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
    }

    .feature-card {
      text-align: center;
      border-radius: 16px;
      padding: 16px;
    }

    .feature-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--app-primary, #0f3460);
      margin-bottom: 12px;
    }

    .feature-card h3 { font-size: 18px; font-weight: 600; margin: 8px 0; }
    .feature-card p { font-size: 14px; color: var(--app-text-secondary, #666); line-height: 1.5; }

    .pricing {
      padding: 80px 24px;
      background: var(--app-surface-dim, #f5f5f5);
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    .plan-card {
      border-radius: 16px;
      text-align: center;
      position: relative;
      overflow: visible;
    }

    .plan-featured { border: 2px solid var(--app-primary, #0f3460); }

    .plan-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--app-primary, #0f3460);
      color: #fff;
      padding: 4px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .plan-price {
      font-size: 36px;
      font-weight: 800;
      margin: 16px 0;
      color: var(--app-text, #1a1a2e);
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 16px;
      text-align: left;
    }

    .plan-features li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 14px;
      color: var(--app-text-secondary, #555);
    }

    .check-icon { color: #4caf50; font-size: 18px; width: 18px; height: 18px; }
    .plan-cta { width: 100%; }

    .tech {
      padding: 60px 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .tech-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }

    .tech-badge {
      background: var(--app-surface-dim, #eee);
      color: var(--app-text-secondary, #555);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .landing-footer {
      text-align: center;
      padding: 32px 24px;
      color: var(--app-text-secondary, #888);
      font-size: 13px;
      border-top: 1px solid var(--app-border, #ddd);
    }

    @media (max-width: 600px) {
      .hero-title { font-size: 32px; }
      .hero-subtitle { font-size: 18px; }
      .hero { padding: 60px 16px 50px; }
    }
  `],
})
export class LandingComponent {
  protected readonly i18n = inject(I18nService);

  readonly techStack = ['Angular', 'NestJS', 'Spring Boot', 'FastAPI', 'PostgreSQL', 'RabbitMQ', 'Stripe', 'Docker'];

  get features() {
    const m = this.i18n.messages().landing;
    return [
      { icon: 'receipt_long', title: m.feat1Title, desc: m.feat1Desc },
      { icon: 'account_balance', title: m.feat2Title, desc: m.feat2Desc },
      { icon: 'policy', title: m.feat3Title, desc: m.feat3Desc },
      { icon: 'business', title: m.feat4Title, desc: m.feat4Desc },
    ];
  }

  get plans() {
    const m = this.i18n.messages().landing;
    return [
      { name: 'Starter', price: m.free, featured: false, cta: m.ctaStart, items: [m.plan1a, m.plan1b, m.plan1c] },
      { name: 'Pro', price: 'R$ 249/mês', featured: true, cta: m.ctaStart, items: [m.plan2a, m.plan2b, m.plan2c] },
      { name: 'Enterprise', price: m.custom, featured: false, cta: m.ctaContact, items: [m.plan3a, m.plan3b, m.plan3c] },
    ];
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

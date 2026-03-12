import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpContext } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { SKIP_AUTH, SKIP_TENANT_HEADER } from '@saas-suite/shared/util';
import { AuthStore } from '../auth.store';
import { sessionFromJwt } from '../models/auth-session.model';

interface SignupResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  tenant: { id: string; name: string; plan: string; region: string };
  user: { id: string; email: string; name: string; roles: string[] };
}

interface PlanOption {
  value: string;
  label: string;
  price: string;
  highlight: boolean;
}

const PLANS: PlanOption[] = [
  { value: 'starter', label: 'Starter', price: '$49/mo', highlight: false },
  { value: 'professional', label: 'Professional', price: '$149/mo', highlight: true },
  { value: 'enterprise', label: 'Enterprise', price: 'Custom', highlight: false },
];

@Component({
  selector: 'lib-signup-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="signup-page">
      <div class="signup-left">
        <div class="brand">
          <div class="brand-logo">
            <mat-icon>dashboard</mat-icon>
          </div>
          <h1>Fluxe B2B Suite</h1>
          <p>Crie sua conta e comece agora</p>
        </div>
      </div>

      <div class="signup-right">
        <div class="signup-form-container">
          <h2>Criar Conta</h2>
          <p class="subtitle">Preencha os dados para criar sua organização</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="signup-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome da Empresa</mat-label>
              <input matInput formControlName="companyName" placeholder="Minha Empresa Ltda">
              @if (form.controls['companyName'].hasError('required') && form.controls['companyName'].touched) {
                <mat-error>Nome da empresa é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Plano</mat-label>
              <mat-select formControlName="plan">
                @for (p of plans; track p.value) {
                  <mat-option [value]="p.value">
                    {{ p.label }} — {{ p.price }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Seu Nome</mat-label>
              <input matInput formControlName="name" placeholder="João Silva">
              @if (form.controls['name'].hasError('required') && form.controls['name'].touched) {
                <mat-error>Nome é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-mail</mat-label>
              <input matInput formControlName="email" type="email" placeholder="joao@empresa.com">
              @if (form.controls['email'].hasError('required') && form.controls['email'].touched) {
                <mat-error>E-mail é obrigatório</mat-error>
              }
              @if (form.controls['email'].hasError('email')) {
                <mat-error>E-mail inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput formControlName="password" [type]="hidePassword() ? 'password' : 'text'">
              <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls['password'].hasError('required') && form.controls['password'].touched) {
                <mat-error>Senha é obrigatória</mat-error>
              }
              @if (form.controls['password'].hasError('minlength')) {
                <mat-error>Mínimo de 8 caracteres</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <div class="error-msg">
                <mat-icon>error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button class="signup-btn" type="submit"
              [disabled]="form.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Criar Conta
              }
            </button>
          </form>

          <p class="login-link">
            Já possui conta? <a routerLink="/login">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .signup-page {
      display: flex;
      height: 100%;
      min-height: 100vh;
    }

    .signup-left {
      flex: 0 0 400px;
      background: linear-gradient(160deg, #0a1628 0%, #132f4c 40%, #1a3a5c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }
    .signup-left::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 50% at 50% 120%, rgba(21, 101, 192, 0.15) 0%, transparent 60%);
      pointer-events: none;
    }

    .brand {
      text-align: center;
      color: #fff;
      position: relative;
      z-index: 1;
    }
    .brand-logo {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    }
    .brand-logo mat-icon { font-size: 36px; width: 36px; height: 36px; color: #fff; }
    .brand h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
    .brand p { font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; font-weight: 400; }

    .signup-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #f0f4f8 0%, #e8eef4 100%);
      padding: 48px;
      overflow-y: auto;
    }

    .signup-form-container {
      width: 100%;
      max-width: 440px;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .signup-form-container h2 { font-size: 24px; font-weight: 700; color: #1a2332; margin: 0 0 6px; letter-spacing: -0.02em; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0 0 28px; }

    .signup-form {
      display: flex;
      flex-direction: column;
    }
    .full-width { width: 100%; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #b91c1c;
      font-size: 13px;
      background: #fef2f2;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 20px;
      border: 1px solid #fecaca;
    }
    .error-msg mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }

    .signup-btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(180deg, #1565c0 0%, #0d47a1 100%);
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: inherit;
      box-shadow: 0 2px 8px rgba(21, 101, 192, 0.35);
      margin-top: 8px;
    }
    .signup-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(21, 101, 192, 0.4);
    }
    .signup-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .login-link {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: #64748b;
    }
    .login-link a {
      color: #1565c0;
      text-decoration: none;
      font-weight: 600;
    }
    .login-link a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .signup-page { flex-direction: column; }
      .signup-left { flex: 0 0 auto; padding: 32px; }
      .signup-right { padding: 24px; }
    }
  `],
})
export class SignupPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(RuntimeConfigService);
  private readonly store = inject(AuthStore);

  readonly plans = PLANS;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hidePassword = signal(true);

  readonly form = this.fb.group({
    companyName: ['', Validators.required],
    plan: ['professional', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const baseUrl = this.config.get('coreApiBaseUrl');
    const ctx = new HttpContext()
      .set(SKIP_AUTH, true)
      .set(SKIP_TENANT_HEADER, true);

    try {
      const resp = await firstValueFrom(
        this.http.post<SignupResponse>(`${baseUrl}/v1/onboarding/signup`, this.form.value, {
          context: ctx,
        }),
      );

      const session = sessionFromJwt(resp.access_token);
      this.store.setSession(session);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('dev_token', resp.access_token);
      }
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'status' in e) {
        const httpErr = e as { status: number; error?: { detail?: string } };
        if (httpErr.status === 409) {
          this.error.set(httpErr.error?.detail ?? 'Este e-mail já está cadastrado.');
        } else {
          this.error.set('Erro ao criar conta. Tente novamente.');
        }
      } else {
        this.error.set('Erro de conexão. Verifique o backend.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}

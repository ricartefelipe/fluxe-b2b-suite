import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-legal-privacy',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <a mat-stroked-button routerLink="/welcome" class="back-link">{{ i18n.messages().legal.backToHome }}</a>
      <h1 class="legal-title">{{ i18n.messages().legal.privacyTitle }}</h1>
      <div class="legal-content">
        <p><strong>Última atualização:</strong> Março de 2026.</p>
        <p>Esta Política de Privacidade descreve como a Fluxe B2B Suite coleta, usa e protege dados pessoais, em conformidade com a LGPD e o GDPR.</p>
        <h2>1. Dados que coletamos</h2>
        <p>Coletamos dados que você nos fornece (nome, e-mail, dados da organização), dados de uso da Plataforma (logs de acesso, ações realizadas) e dados técnicos (endereço IP, tipo de navegador) quando necessário para operação e segurança.</p>
        <h2>2. Finalidade</h2>
        <p>Os dados são utilizados para prestar o serviço, cumprir obrigações contratuais, melhorar a Plataforma, garantir segurança e cumprir obrigações legais. Não vendemos seus dados pessoais a terceiros.</p>
        <h2>3. Base legal</h2>
        <p>O tratamento baseia-se em execução de contrato, legítimo interesse (segurança, melhoria do serviço) e, quando aplicável, consentimento.</p>
        <h2>4. Retenção e auditoria</h2>
        <p>Mantemos registros de auditoria por período configurável (padrão 90 dias) para fins de segurança e conformidade. Dados de conta são mantidos enquanto a conta estiver ativa e após o encerramento conforme exigido por lei.</p>
        <h2>5. Seus direitos</h2>
        <p>Você pode solicitar acesso, correção, exclusão, portabilidade ou restrição do tratamento dos seus dados, nos termos da LGPD/GDPR. Entre em contato pelo canal <a routerLink="/contact">{{ i18n.messages().landing.contact }}</a>.</p>
        <h2>6. Cookies</h2>
        <p>Utilizamos cookies estritamente necessários para autenticação e sessão. Você pode configurar seu navegador para bloquear cookies não essenciais; parte das funcionalidades pode ficar limitada.</p>
        <h2>7. Alterações</h2>
        <p>Alterações nesta política serão publicadas nesta página. Uso continuado após alterações constitui aceitação.</p>
      </div>
    </div>
  `,
  styles: [`
    .legal-page {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px 24px 64px;
      font-family: 'Inter', 'Roboto', sans-serif;
      color: var(--app-text, #1a1a2e);
    }
    .back-link { margin-bottom: 24px; }
    .legal-title { font-size: 28px; font-weight: 700; margin: 0 0 24px; }
    .legal-content {
      line-height: 1.7;
      font-size: 15px;
    }
    .legal-content h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; }
    .legal-content p { margin: 0 0 12px; }
    .legal-content a { color: var(--app-primary, #0f3460); text-decoration: none; }
    .legal-content a:hover { text-decoration: underline; }
  `],
})
export class PrivacyComponent {
  protected readonly i18n = inject(I18nService);
}

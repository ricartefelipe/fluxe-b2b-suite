import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-legal-terms',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <a mat-stroked-button routerLink="/welcome" class="back-link">{{ i18n.messages().legal.backToHome }}</a>
      <h1 class="legal-title">{{ i18n.messages().legal.termsTitle }}</h1>
      <div class="legal-content">
        <p><strong>Última atualização:</strong> Março de 2026.</p>
        <p>Ao acessar e utilizar a plataforma Fluxe B2B Suite (“Plataforma”), você concorda com estes Termos de Uso.</p>
        <h2>1. Aceitação</h2>
        <p>O uso da Plataforma implica aceitação integral destes termos. Se você não concordar, não utilize o serviço.</p>
        <h2>2. Uso permitido</h2>
        <p>Você concorda em utilizar a Plataforma apenas para fins lícitos e de acordo com a documentação e políticas disponíveis. É vedado o uso para atividades ilegais, abusivas ou que prejudiquem terceiros.</p>
        <h2>3. Conta e responsabilidade</h2>
        <p>Você é responsável pela confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente em caso de uso não autorizado.</p>
        <h2>4. Propriedade intelectual</h2>
        <p>A Plataforma, incluindo software, marcas e conteúdo, é de propriedade da Fluxe ou de seus licenciadores. Nenhum direito é transferido além do uso previsto nestes termos.</p>
        <h2>5. Limitação de responsabilidade</h2>
        <p>A Plataforma é oferecida “como está”. Na medida permitida pela lei, excluímos garantias implícitas e não nos responsabilizamos por danos indiretos ou consequenciais decorrentes do uso ou da indisponibilidade do serviço.</p>
        <h2>6. Alterações</h2>
        <p>Podemos alterar estes termos a qualquer momento. Alterações relevantes serão comunicadas por e-mail ou aviso na Plataforma. O uso continuado após as alterações constitui aceitação.</p>
        <h2>7. Contato</h2>
        <p>Dúvidas sobre estes termos: utilize o canal <a routerLink="/contact">{{ i18n.messages().landing.contact }}</a> ou o e-mail indicado na Política de Privacidade.</p>
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
export class TermsComponent {
  protected readonly i18n = inject(I18nService);
}

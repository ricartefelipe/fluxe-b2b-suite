import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localePt, 'pt-BR');

bootstrapApplication(App, appConfig).catch((err) => {
  console.error('Bootstrap failed:', err);
  const msg = err instanceof Error ? err.message : String(err);
  const escaped = msg
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  document.body.textContent = '';
  const div = document.createElement('div');
  div.setAttribute('style', 'font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto;');
  div.innerHTML = `<h1 style="color: #c62828;">Erro ao carregar a aplicação</h1><p>Abra o console do navegador (F12) para mais detalhes.</p><pre style="background: #f5f5f5; padding: 1rem; overflow: auto; font-size: 12px;">${escaped}</pre>`;
  document.body.appendChild(div);
});

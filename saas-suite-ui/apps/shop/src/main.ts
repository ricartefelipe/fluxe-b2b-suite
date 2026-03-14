import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => {
  console.error('Bootstrap failed:', err);
  document.body.innerHTML = `
    <div style="font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #c62828;">Erro ao carregar a aplicação</h1>
      <p>Abra o console do navegador (F12) para mais detalhes.</p>
      <pre style="background: #f5f5f5; padding: 1rem; overflow: auto; font-size: 12px;">${err instanceof Error ? err.message : String(err)}</pre>
    </div>
  `;
});

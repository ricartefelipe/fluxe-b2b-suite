# Configuração de build — saas-suite-ui

## Fontes (inline desativado)

O build de produção desativa o **inline de fontes** (`optimization.fonts: false`) nos apps **ops-portal**, **admin-console** e **shop**. Assim o build não depende de rede para baixar Google Fonts durante a compilação.

- As fontes continuam sendo carregadas em runtime via `<link>` no `index.html` (Roboto, Material Icons).
- Para reativar o inline (melhor performance em produção com rede no build), remova ou altere `optimization.fonts` em cada `apps/<app>/project.json`.

## shared-auth e tsconfig.app.json

A lib **shared-auth** possui `tsconfig.app.json` que estende `tsconfig.lib.json`, para que o plugin Vite/Angular resolva o tsconfig ao compilar apps que dependem da lib. Não remova esse arquivo.

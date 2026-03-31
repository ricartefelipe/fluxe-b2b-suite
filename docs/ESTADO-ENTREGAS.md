# Estado das Entregas (operacional)

Quadro vivo para execução no modo "concluir e marcar".

Legenda de status:
- `concluida`: entregue e mergeada
- `em_execucao`: em desenvolvimento/revisao
- `proxima`: pronta para iniciar
- `bloqueada`: depende de decisao/infra

---

## Entregas concluidas recentes

### 2026-03-31

- [x] **Railway: staging/produção e documentação de manutenção** (`concluida`)
  - Escopo: projetos separados (Staging vs Production), stack verde, smoke HTTP nos backends (200), secção *Manutenção contínua* em `DEPLOY-RAILWAY.md`, referência em `AMBIENTES-CONFIGURACAO.md`, remoção de variáveis vazias de teste no Postgres (staging).
  - Evidência: commits desta entrega; preencher [CHECKLIST-AMBIENTES-EVIDENCIAS.md](CHECKLIST-AMBIENTES-EVIDENCIAS.md) com URLs finais se necessário.

- [x] **Front premium de autenticacao** (`concluida`)
  - Escopo: shell auth premium, recuperação/reset de senha e melhoria de login.
  - Evidencia: fluxe PRs `#113`, `#112`.

- [x] **Admin Console: Home + banner billing + Ajuda/API** (`concluida`)
  - Escopo: página Início, alerta de trial/past-due, links de documentação/API.
  - Evidencia: fluxe PRs `#114`, `#115`, `#116`.

- [x] **Release suite para master** (`concluida`)
  - Evidencia: fluxe PR `#117`.

- [x] **Alinhamento docs AGENTS (link canónico pipeline)** (`concluida`)
  - Escopo: referência padronizada para `PIPELINE-ESTEIRAS.md` no repo fluxe.
  - Evidencia: node PR `#58`, payments PR `#55`, core PR `#92`.

- [x] **Releases backend para master** (`concluida`)
  - Evidencia: node PR `#59`, payments PR `#54`, core PR `#91`.

- [x] **Equalização de branches** (`concluida`)
  - Escopo: `develop == master` nos 4 repositórios.
  - Evidencia: verificação local de SHA alinhado.

---

## Fila de execução imediata (concluir e marcar)

- [ ] **Tag de release padronizada multi-repo** (`proxima`)
  - Aceite:
    - [ ] Definir versão (ex.: `v1.0.x`)
    - [ ] Criar tags nos repos tocados
    - [ ] Publicar release notes com links dos PRs

- [ ] **Plano comercial de 30 dias (conversão e retenção)** (`proxima`)
  - Aceite:
    - [ ] Priorizar 3 entregas de maior impacto
    - [ ] Definir owner/ETA por item
    - [ ] Incluir métrica de sucesso por item

---

## Modelo de uso diário

1. Mover item para `em_execucao`.
2. Abrir/ligar PR(s) do item.
3. Marcar aceite linha a linha.
4. Mover para `concluida` com evidência (PR/CI/deploy).

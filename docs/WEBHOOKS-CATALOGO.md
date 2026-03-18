# Catálogo de Webhooks — spring-saas-core

Os webhooks do Core permitem que um tenant receba notificações HTTP quando certos eventos ocorrem. O tenant registra um endpoint (POST `/v1/webhooks`) com `url`, `secret` e a lista de `events` desejada. O Core envia um POST para a URL com o payload do evento e assinatura no header.

---

## Eventos disponíveis

| Tipo de evento | Quando é disparado | Payload (exemplo) |
|----------------|-------------------|--------------------|
| `onboarding.completed` | Após criar tenant e primeiro usuário via `/v1/onboarding` | `tenantId`, `tenantName`, `plan`, `region`, `adminEmail` |
| `user.registered` | Após registro de novo usuário (signup) | `userId`, `tenantId`, `email`, etc. |
| `user.invited` | Após convite de usuário (invite) | `tenantId`, `userId`, `email`, `inviteLink`, etc. |
| `user.updated` | Após atualização de usuário (nome, roles, status) | `tenantId`, `userId`, campos alterados |
| `user.deleted` | Após remoção (soft delete) de usuário | `tenantId`, `email` |
| `user.password_reset_requested` | Quando alguém solicita redefinição de senha | `userId`, `tenantId`, `resetLink`, etc. |

---

## Formato do POST

- **URL:** a que foi registrada no endpoint.
- **Método:** POST.
- **Headers:** 
  - `Content-Type: application/json`
  - `X-Webhook-Signature` (ou similar): assinatura HMAC do body com o `secret` do endpoint, para validação.
- **Body:** JSON com `eventType`, `tenantId`, `payload`, `timestamp`, etc. (estrutura exata definida no Core).

---

## Segurança

- Sempre validar `X-Webhook-Signature` usando o secret compartilhado.
- Usar HTTPS na URL do endpoint.
- O Core repete entregas em falha (retry); o receptor deve ser idempotente.

---

## Referência de API

- **Registrar:** `POST /v1/webhooks` — body: `{ "url": "https://...", "secret": "...", "events": ["user.invited", "user.updated"] }`.
- **Listar:** `GET /v1/webhooks`.
- **Remover:** `DELETE /v1/webhooks/{id}`.

Para eventos assíncronos via filas (RabbitMQ), ver [CATALOGO-EVENTOS.md](./CATALOGO-EVENTOS.md).

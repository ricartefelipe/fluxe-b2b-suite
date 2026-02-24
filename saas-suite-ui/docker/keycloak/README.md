# Keycloak — Local OIDC Provider

Local Keycloak instance pre-configured for the Fluxe B2B Suite monorepo.

## Quick Start

```bash
cd docker/keycloak
docker compose up -d
```

Keycloak will be available at **http://localhost:8180**.

Admin console: http://localhost:8180/admin  
Credentials: `admin` / `admin`

## Realm: fluxe-b2b

The realm is automatically imported on first start via `realm-export.json`.

### Clients

| Client ID      | Description          | Redirect URIs                      |
|----------------|----------------------|------------------------------------|
| `fluxe-shop`   | Shop application     | `http://localhost:4200/*` + others |
| `fluxe-ops`    | Ops Portal           | `http://localhost:4300/*` + others |
| `fluxe-admin`  | Admin Console        | `http://localhost:4400/*` + others |

All clients use **PKCE (S256)** with authorization code flow.

### Test Users

| Email                 | Password      | Role       | Plan         |
|-----------------------|---------------|------------|--------------|
| `admin@fluxe.io`     | `admin123`    | admin      | enterprise   |
| `operator@fluxe.io`  | `operator123` | operator   | professional |
| `viewer@fluxe.io`    | `viewer123`   | viewer     | starter      |

All users belong to `tenant-1`.

### Custom JWT Claims

The `fluxe-claims` client scope adds these claims to access tokens:

| Claim    | Description                        |
|----------|------------------------------------|
| `tid`    | Tenant ID                          |
| `roles`  | Realm roles (admin, operator, ...) |
| `perms`  | Permission strings array           |
| `plan`   | Subscription plan                  |
| `region` | Deployment region                  |

## Switching Apps to Keycloak

Each app has a `config.keycloak.json` in `src/assets/`. To use Keycloak:

```bash
# From the monorepo root (saas-suite-ui/)
cp apps/shop/src/assets/config.keycloak.json apps/shop/public/assets/config.json
cp apps/ops-portal/src/assets/config.keycloak.json apps/ops-portal/public/assets/config.json
cp apps/admin-console/src/assets/config.keycloak.json apps/admin-console/public/assets/config.json
```

To revert to dev mode, restore the original `config.json` (with `"authMode": "dev"`).

## Docker Environment Variables

When running apps in Docker, set these environment variables to configure OIDC:

| Variable          | Example                                        |
|-------------------|-------------------------------------------------|
| `AUTH_MODE`       | `oidc`                                          |
| `OIDC_ISSUER`    | `http://localhost:8180/realms/fluxe-b2b`        |
| `OIDC_CLIENT_ID` | `fluxe-shop`                                    |
| `OIDC_SCOPE`     | `openid profile email roles`                    |

## Troubleshooting

- **Keycloak won't start**: Make sure port 8180 is free.
- **Realm not imported**: Remove the Keycloak container and volume, then re-run `docker compose up -d`.
- **Token errors**: Ensure the issuer URL matches exactly (including `/realms/fluxe-b2b`).
- **CORS issues**: The clients are configured with web origins for `localhost:4200/4300/4400`.

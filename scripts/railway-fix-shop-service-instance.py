#!/usr/bin/env python3
"""
Alinha o serviço shop-frontend ao admin-console no Railway via API GraphQL.

O token da sessão do CLI (`rw_Fe26...` em ~/.railway/config.json) NÃO serve
para a Public API — devolve 403. É necessário um token de API criado em:
https://railway.com/account/tokens

Uso:
  export RAILWAY_API_TOKEN="...token da conta..."
  python3 scripts/railway-fix-shop-service-instance.py

Ou:
  RAILWAY_API_TOKEN=... python3 scripts/railway-fix-shop-service-instance.py --dry-run

Variáveis opcionais (defaults = projeto Staging Fluxe B2B Suite):
  RAILWAY_ENVIRONMENT_ID
  RAILWAY_ADMIN_SERVICE_ID
  RAILWAY_SHOP_SERVICE_ID
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

GQL_URL = os.environ.get("RAILWAY_GRAPHQL_URL", "https://backboard.railway.app/graphql/v2")

DEFAULT_ENV = os.environ.get("RAILWAY_ENVIRONMENT_ID", "")
DEFAULT_ADMIN = os.environ.get("RAILWAY_ADMIN_SERVICE_ID", "")
DEFAULT_SHOP = os.environ.get("RAILWAY_SHOP_SERVICE_ID", "")

SHOP_CONFIG_FILE = "/saas-suite-ui/apps/shop/railway.toml"

QUERY_INSTANCE = """
query ServiceInstance($environmentId: String!, $serviceId: String!) {
  serviceInstance(environmentId: $environmentId, serviceId: $serviceId) {
    rootDirectory
    railwayConfigFile
    serviceName
  }
}
"""

MUTATION_UPDATE = """
mutation ServiceInstanceUpdate(
  $environmentId: String
  $input: ServiceInstanceUpdateInput!
  $serviceId: String!
) {
  serviceInstanceUpdate(environmentId: $environmentId, input: $input, serviceId: $serviceId)
}
"""


def gql(token: str, query: str, variables: dict) -> dict:
    body = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(
        GQL_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "fluxe-railway-fix/1.0 (urllib)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    parser = argparse.ArgumentParser(description="Railway: alinhar shop-frontend ao admin-console")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Só mostra o input que seria enviado (sem chamar a API)",
    )
    parser.add_argument(
        "--redeploy",
        action="store_true",
        help="Após sucesso, executa `railway redeploy` no serviço shop-frontend (CLI)",
    )
    args = parser.parse_args()

    token = os.environ.get("RAILWAY_API_TOKEN", "").strip()
    env_id = os.environ.get("RAILWAY_ENVIRONMENT_ID", DEFAULT_ENV).strip()
    admin_id = os.environ.get("RAILWAY_ADMIN_SERVICE_ID", DEFAULT_ADMIN).strip()
    shop_id = os.environ.get("RAILWAY_SHOP_SERVICE_ID", DEFAULT_SHOP).strip()

    if not args.dry_run and not token:
        print(
            "Defina RAILWAY_API_TOKEN (token de conta em https://railway.com/account/tokens).\n"
            "O token do CLI (rw_Fe26...) não é aceite na Public API.",
            file=sys.stderr,
        )
        return 1

    if args.dry_run:
        print("--- dry-run (sem token) ---")
        print(f"environmentId: {env_id}")
        print(f"admin serviceId: {admin_id}")
        print(f"shop serviceId: {shop_id}")
        print(f"shop railwayConfigFile: {SHOP_CONFIG_FILE}")
        print("input: rootDirectory <- lido do admin; railwayConfigFile <- fixo shop")
        return 0

    try:
        admin = gql(
            token,
            QUERY_INSTANCE,
            {"environmentId": env_id, "serviceId": admin_id},
        )
        if admin.get("errors"):
            print(json.dumps(admin, indent=2), file=sys.stderr)
            return 1
        si = admin["data"]["serviceInstance"]
        root = (si.get("rootDirectory") or "").strip() or "saas-suite-ui"
        print(f"admin-console: rootDirectory={root!r} railwayConfigFile={si.get('railwayConfigFile')!r}")

        update_input: dict = {
            "rootDirectory": root,
            "railwayConfigFile": SHOP_CONFIG_FILE,
        }
        print(f"Aplicar ao shop: {update_input}")

        out = gql(
            token,
            MUTATION_UPDATE,
            {
                "environmentId": env_id,
                "serviceId": shop_id,
                "input": update_input,
            },
        )
        if out.get("errors"):
            print(json.dumps(out, indent=2), file=sys.stderr)
            return 1
        print("serviceInstanceUpdate:", json.dumps(out, indent=2))

        if args.redeploy:
            try:
                subprocess.run(
                    ["railway", "service", "shop-frontend"],
                    check=True,
                    cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                )
                subprocess.run(
                    ["railway", "redeploy"],
                    check=True,
                    cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                )
                print("railway redeploy enviado.")
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                print(f"Falha no redeploy CLI (opcional): {e}", file=sys.stderr)

    except urllib.error.HTTPError as e:
        err = e.read().decode() if e.fp else ""
        print(f"HTTP {e.code}: {err}", file=sys.stderr)
        return 1
    except Exception as e:
        print(str(e), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

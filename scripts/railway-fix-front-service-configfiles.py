#!/usr/bin/env python3
"""
Define railwayConfigFile + rootDirectory correctos para admin-console, ops-portal e shop-frontend
no Railway (evita deploy do Shop nos três serviços).

Causa típica: com Root Directory = saas-suite-ui e **Config file** vazio, o Railway usa o primeiro
railway.toml na raiz — se existir um ficheiro só do Shop, admin e ops fazem build do Shop.

O token de sessão do CLI não serve na API pública. Crie um token em:
https://railway.com/account/tokens

Uso:
  export RAILWAY_API_TOKEN="..."
  python3 scripts/railway-fix-front-service-configfiles.py --staging
  python3 scripts/railway-fix-front-service-configfiles.py --production

Opções:
  --dry-run     Mostra o que seria enviado
  --redeploy    Após mutação, railway redeploy nos três serviços (requer projeto linkado via CLI)
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

# environmentId + serviceId por ambiente (Fluxe B2B Suite; actualizar se recriar serviços)
STAGING = {
    "environment_id": "3bef7757-dc46-4709-940a-775a14910a85",
    "admin": "969783a4-f56f-46e1-9529-b8e9614fae79",
    "ops": "f8d811b2-1fbb-48c3-9521-ee0824f3e933",
    "shop": "b115c175-e10c-4cb0-bb82-ff1723ab5108",
}
PRODUCTION = {
    "environment_id": "8652b9da-75f3-42d1-8a57-e73319edb900",
    "admin": "77d6fffe-f1e6-485a-8f43-b438550fe6f8",
    "ops": "cec609d4-1278-4774-88bf-38090b34a0a7",
    "shop": "b07cf91b-a187-426b-9b87-34f64eca566b",
}

CONFIG_PATHS = {
    "admin": "/saas-suite-ui/apps/admin-console/railway.toml",
    "ops": "/saas-suite-ui/apps/ops-portal/railway.toml",
    "shop": "/saas-suite-ui/apps/shop/railway.toml",
}

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
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    parser = argparse.ArgumentParser()
    g = parser.add_mutually_exclusive_group(required=True)
    g.add_argument("--staging", action="store_true")
    g.add_argument("--production", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--redeploy",
        action="store_true",
        help="Executa railway redeploy para admin-console, ops-portal, shop-frontend",
    )
    args = parser.parse_args()

    cfg = STAGING if args.staging else PRODUCTION
    env_id = cfg["environment_id"]
    token = os.environ.get("RAILWAY_API_TOKEN", "").strip()

    if not args.dry_run and not token:
        print(
            "Defina RAILWAY_API_TOKEN (https://railway.com/account/tokens).",
            file=sys.stderr,
        )
        return 1

    targets = [
        ("admin-console", cfg["admin"], CONFIG_PATHS["admin"]),
        ("ops-portal", cfg["ops"], CONFIG_PATHS["ops"]),
        ("shop-frontend", cfg["shop"], CONFIG_PATHS["shop"]),
    ]

    if args.dry_run:
        print("dry-run environmentId:", env_id)
        for name, sid, path in targets:
            print(f"  {name} ({sid}) -> {path}")
        return 0

    try:
        admin = gql(
            token,
            QUERY_INSTANCE,
            {"environmentId": env_id, "serviceId": cfg["admin"]},
        )
        if admin.get("errors"):
            print(json.dumps(admin, indent=2), file=sys.stderr)
            return 1
        si = admin["data"]["serviceInstance"]
        root = (si.get("rootDirectory") or "").strip() or "saas-suite-ui"
        print(f"rootDirectory (from admin-console): {root!r}")

        for name, service_id, config_path in targets:
            update_input = {"rootDirectory": root, "railwayConfigFile": config_path}
            print(f"Atualizar {name}: {update_input}")
            out = gql(
                token,
                MUTATION_UPDATE,
                {
                    "environmentId": env_id,
                    "serviceId": service_id,
                    "input": update_input,
                },
            )
            if out.get("errors"):
                print(json.dumps(out, indent=2), file=sys.stderr)
                return 1
            print(f"  OK: {name}")

        if args.redeploy:
            for svc in ("admin-console", "ops-portal", "shop-frontend"):
                subprocess.run(
                    ["railway", "redeploy", "-s", svc, "-y"],
                    check=False,
                )
            print("redeploy enviado (verifique railway status).")

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

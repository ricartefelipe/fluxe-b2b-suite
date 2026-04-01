#!/usr/bin/env python3
"""
Garante que ops-portal e admin-console no Railway usam o railway.toml correto
(apps/ops-portal e apps/admin-console), não o da raiz saas-suite-ui (shop).

Sem isto, o deploy constrói apps/shop/Dockerfile para todos os frontends.

Uso (token: mesma sessão do CLI em ~/.railway/config.json funciona na API v2):
  python3 scripts/railway-fix-ops-admin-service-instance.py

Ou com token de conta:
  export RAILWAY_API_TOKEN="..."
  python3 scripts/railway-fix-ops-admin-service-instance.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.request

GQL_URL = os.environ.get("RAILWAY_GRAPHQL_URL", "https://backboard.railway.app/graphql/v2")

DEFAULT_ENV = "3bef7757-dc46-4709-940a-775a14910a85"
DEFAULT_OPS = "f8d811b2-1fbb-48c3-9521-ee0824f3e933"
DEFAULT_ADMIN = "969783a4-f56f-46e1-9529-b8e9614fae79"

OPS_CONFIG = "/saas-suite-ui/apps/ops-portal/railway.toml"
ADMIN_CONFIG = "/saas-suite-ui/apps/admin-console/railway.toml"

MUTATION = """
mutation ServiceInstanceUpdate(
  $environmentId: String
  $input: ServiceInstanceUpdateInput!
  $serviceId: String!
) {
  serviceInstanceUpdate(environmentId: $environmentId, input: $input, serviceId: $serviceId)
}
"""


def token() -> str:
    t = os.environ.get("RAILWAY_API_TOKEN", "").strip()
    if t:
        return t
    cfg = os.path.expanduser("~/.railway/config.json")
    try:
        with open(cfg, encoding="utf-8") as f:
            return (json.load(f).get("user") or {}).get("token") or ""
    except OSError:
        return ""


def gql(tok: str, query: str, variables: dict) -> dict:
    body = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(
        GQL_URL,
        data=body,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--redeploy",
        action="store_true",
        help="Após sucesso, railway redeploy nos dois serviços (opcional; push em develop costuma bastar)",
    )
    args = parser.parse_args()

    tok = token()
    env_id = os.environ.get("RAILWAY_ENVIRONMENT_ID", DEFAULT_ENV).strip()
    ops_id = os.environ.get("RAILWAY_OPS_SERVICE_ID", DEFAULT_OPS).strip()
    admin_id = os.environ.get("RAILWAY_ADMIN_SERVICE_ID", DEFAULT_ADMIN).strip()

    if not args.dry_run and not tok:
        print("Sem token: defina RAILWAY_API_TOKEN ou use Railway CLI logado (~/.railway/config.json).", file=sys.stderr)
        return 1

    root = "saas-suite-ui"
    updates = [
        (ops_id, "ops-portal", OPS_CONFIG),
        (admin_id, "admin-console", ADMIN_CONFIG),
    ]

    for sid, name, cfg in updates:
        payload = {
            "environmentId": env_id,
            "serviceId": sid,
            "input": {"rootDirectory": root, "railwayConfigFile": cfg},
        }
        if args.dry_run:
            print(f"{name}: {payload['input']}")
            continue
        out = gql(tok, MUTATION, payload)
        if out.get("errors"):
            print(json.dumps(out, indent=2), file=sys.stderr)
            return 1
        print(f"{name}: serviceInstanceUpdate ok")

    if args.redeploy and not args.dry_run:
        repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        for _svc in ("ops-portal", "admin-console"):
            subprocess.run(["railway", "redeploy", "-s", _svc, "-y"], cwd=repo_root, check=False)

    print("Feito. Faça push em develop (ou redeploy) para novo build com o Dockerfile certo.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Renomeia os domínios públicos gerados pelo Railway (*.up.railway.app) dos serviços
ops-portal e admin-console para os FQDN documentados em URLS-STAGING.md.

Útil quando os hosts `ops-portal-staging` / `admin-console-staging-b1ab` respondem com
a UI do Shop ou outro serviço: o tráfego não estava associado ao serviceInstance certo.

Não dispara novo build — só atualiza o mapeamento na edge (propagação em segundos).

Requisitos:
  export RAILWAY_API_TOKEN="..."   # https://railway.com/account/tokens

Uso:
  python3 scripts/railway-alias-staging-public-domains.py --dry-run
  python3 scripts/railway-alias-staging-public-domains.py

Variáveis opcionais (defaults = projeto Fluxe B2B Suite — Staging, env interno \"production\"):
  RAILWAY_PROJECT_ID
  RAILWAY_ENVIRONMENT_ID
  RAILWAY_OPS_PUBLIC_DOMAIN
  RAILWAY_ADMIN_PUBLIC_DOMAIN
  RAILWAY_OPS_TARGET_PORT   (default 80)
  RAILWAY_ADMIN_TARGET_PORT (default 80)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

GQL_URL = os.environ.get("RAILWAY_GRAPHQL_URL", "https://backboard.railway.app/graphql/v2")

DEFAULT_PROJECT = "f83184d7-69fc-4a12-8920-08c433700df0"
DEFAULT_ENV = "3bef7757-dc46-4709-940a-775a14910a85"
DEFAULT_OPS_DOMAIN = "ops-portal-staging.up.railway.app"
DEFAULT_ADMIN_DOMAIN = "admin-console-staging-b1ab.up.railway.app"

QUERY_ENV = """
query EnvDomains($id: String!, $projectId: String!) {
  environment(id: $id, projectId: $projectId) {
    id
    name
    serviceInstances {
      edges {
        node {
          serviceId
          serviceName
          domains {
            serviceDomains { id domain }
          }
        }
      }
    }
  }
}
"""

MUTATION = """
mutation ServiceDomainUpdate($input: ServiceDomainUpdateInput!) {
  serviceDomainUpdate(input: $input)
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
            "User-Agent": "fluxe-railway-alias-domains/1.0 (urllib)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    token = os.environ.get("RAILWAY_API_TOKEN", "").strip()
    if not args.dry_run and not token:
        print("Defina RAILWAY_API_TOKEN.", file=sys.stderr)
        return 1

    project_id = os.environ.get("RAILWAY_PROJECT_ID", DEFAULT_PROJECT).strip()
    env_id = os.environ.get("RAILWAY_ENVIRONMENT_ID", DEFAULT_ENV).strip()
    ops_domain = os.environ.get("RAILWAY_OPS_PUBLIC_DOMAIN", DEFAULT_OPS_DOMAIN).strip()
    admin_domain = os.environ.get("RAILWAY_ADMIN_PUBLIC_DOMAIN", DEFAULT_ADMIN_DOMAIN).strip()
    ops_port = int(os.environ.get("RAILWAY_OPS_TARGET_PORT", "80"))
    admin_port = int(os.environ.get("RAILWAY_ADMIN_TARGET_PORT", "80"))

    if args.dry_run:
        print("dry-run: project", project_id, "environment", env_id)
        print("  ops ->", ops_domain, "port", ops_port)
        print("  admin ->", admin_domain, "port", admin_port)
        return 0

    try:
        out = gql(token, QUERY_ENV, {"id": env_id, "projectId": project_id})
    except urllib.error.HTTPError as e:
        print(e.read().decode() if e.fp else str(e), file=sys.stderr)
        return 1

    if out.get("errors"):
        print(json.dumps(out, indent=2), file=sys.stderr)
        return 1

    env = out.get("data", {}).get("environment")
    if not env:
        print("environment not found", file=sys.stderr)
        return 1

    by_name: dict[str, dict] = {}
    for edge in env["serviceInstances"]["edges"]:
        node = edge["node"]
        by_name[node["serviceName"]] = node

    updates = [
        ("ops-portal", ops_domain, ops_port),
        ("admin-console", admin_domain, admin_port),
    ]
    for svc_name, domain, port in updates:
        node = by_name.get(svc_name)
        if not node:
            print(f"service {svc_name!r} not found in environment", file=sys.stderr)
            return 1
        sds = (node.get("domains") or {}).get("serviceDomains") or []
        if not sds:
            print(f"service {svc_name} has no serviceDomains", file=sys.stderr)
            return 1
        sd_id = sds[0]["id"]
        current = sds[0]["domain"]
        payload = {
            "input": {
                "serviceDomainId": sd_id,
                "environmentId": env_id,
                "serviceId": node["serviceId"],
                "domain": domain,
                "targetPort": port,
            }
        }
        print(f"{svc_name}: {current!r} -> {domain!r}")
        mout = gql(token, MUTATION, payload)
        if mout.get("errors") or not mout.get("data", {}).get("serviceDomainUpdate"):
            print(json.dumps(mout, indent=2), file=sys.stderr)
            return 1
        print(f"  OK")

    print("Feito. Aguarde alguns segundos e valide com curl (title do HTML).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

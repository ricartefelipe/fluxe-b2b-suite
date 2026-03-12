#!/usr/bin/env python3
"""
Gerador de catálogo de APIs — Fluxe B2B Suite

Faz parsing estático dos arquivos-fonte dos 3 serviços backend
para gerar um catálogo consolidado de endpoints em Markdown.

Uso:
    python3 docs/scripts/api-catalog.py [--output docs/CATALOGO-API.md]

Não requer dependências externas (apenas stdlib).
"""

import os
import re
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone

WORKSPACE = Path(__file__).resolve().parent.parent.parent
SPRING_DIR = WORKSPACE.parent / "spring-saas-core"
NESTJS_DIR = WORKSPACE.parent / "node-b2b-orders"
FASTAPI_DIR = WORKSPACE.parent / "py-payments-ledger"

# ---------------------------------------------------------------------------
# Parsing: Spring Boot (Java)
# ---------------------------------------------------------------------------

_SPRING_CLASS_MAPPING = re.compile(
    r'@RequestMapping\(\s*["\']([^"\']+)["\']\s*\)', re.MULTILINE
)
_SPRING_METHOD = re.compile(
    r'@(Get|Post|Put|Patch|Delete)Mapping'
    r'(?:\(\s*(?:value\s*=\s*)?["\']([^"\']*)["\'])?'
    r'[^)]*\)',
    re.MULTILINE,
)
_SPRING_PREAUTH = re.compile(
    r"@PreAuthorize\(\s*\"([^\"]+)\"\s*\)", re.MULTILINE
)
_SPRING_CLASS_NAME = re.compile(r'public\s+class\s+(\w+)')


def parse_spring_controllers(base_dir: Path) -> list[dict]:
    endpoints = []
    rest_dir = base_dir / "src" / "main" / "java"
    if not rest_dir.exists():
        return endpoints

    for java_file in rest_dir.rglob("*Controller.java"):
        source = java_file.read_text(encoding="utf-8", errors="replace")

        class_match = _SPRING_CLASS_NAME.search(source)
        controller_name = class_match.group(1) if class_match else java_file.stem

        base_path = ""
        base_match = _SPRING_CLASS_MAPPING.search(source)
        if base_match:
            base_path = base_match.group(1).rstrip("/")

        preauth_positions = [
            (m.start(), m.group(1)) for m in _SPRING_PREAUTH.finditer(source)
        ]

        for m in _SPRING_METHOD.finditer(source):
            http_method = m.group(1).upper()
            if http_method == "PATCH":
                http_method = "PATCH"
            sub_path = m.group(2) if m.group(2) else ""
            full_path = base_path + ("/" + sub_path.lstrip("/") if sub_path else "")
            if not full_path:
                full_path = base_path or "/"

            permission = ""
            method_pos = m.start()
            for pos, auth_expr in reversed(preauth_positions):
                if pos < method_pos:
                    permission = auth_expr
                    break

            endpoints.append({
                "method": http_method,
                "path": full_path,
                "controller": controller_name,
                "permission": permission,
                "service": "spring-saas-core",
            })

    return endpoints


# ---------------------------------------------------------------------------
# Parsing: NestJS (TypeScript)
# ---------------------------------------------------------------------------

_NEST_CONTROLLER = re.compile(
    r"@Controller\(\s*['\"]([^'\"]+)['\"]\s*\)", re.MULTILINE
)
_NEST_METHOD = re.compile(
    r"@(Get|Post|Put|Patch|Delete)\(\s*(?:['\"]([^'\"]*)['\"])?\s*\)",
    re.MULTILINE,
)


def parse_nestjs_controllers(base_dir: Path) -> list[dict]:
    endpoints = []
    src_dir = base_dir / "src"
    if not src_dir.exists():
        return endpoints

    for ts_file in src_dir.rglob("*.controller.ts"):
        source = ts_file.read_text(encoding="utf-8", errors="replace")

        controller_name = ts_file.stem.replace(".controller", "")

        base_path = ""
        base_match = _NEST_CONTROLLER.search(source)
        if base_match:
            base_path = "/" + base_match.group(1).strip("/")

        has_global_prefix = True
        prefix = "/v1"

        for m in _NEST_METHOD.finditer(source):
            http_method = m.group(1).upper()
            sub_path = m.group(2) if m.group(2) else ""
            route = base_path + ("/" + sub_path.lstrip("/") if sub_path else "")

            if has_global_prefix and not route.startswith(prefix):
                route = prefix + route

            route = re.sub(r":(\w+)", r"{\1}", route)

            endpoints.append({
                "method": http_method,
                "path": route,
                "controller": controller_name,
                "permission": "",
                "service": "node-b2b-orders",
            })

    return endpoints


# ---------------------------------------------------------------------------
# Parsing: FastAPI (Python)
# ---------------------------------------------------------------------------

_FASTAPI_ROUTER_PREFIX = re.compile(
    r'APIRouter\([^)]*prefix\s*=\s*["\']([^"\']+)["\']', re.MULTILINE
)
_FASTAPI_ROUTE = re.compile(
    r'@router\.(get|post|put|patch|delete)\(\s*["\']([^"\']+)["\']',
    re.MULTILINE,
)
_FASTAPI_APP_ROUTE = re.compile(
    r'@app\.(get|post|put|patch|delete)\(\s*["\']([^"\']+)["\']',
    re.MULTILINE,
)


def parse_fastapi_routers(base_dir: Path) -> list[dict]:
    endpoints = []
    src_dir = base_dir / "src"
    if not src_dir.exists():
        return endpoints

    for py_file in src_dir.rglob("*.py"):
        source = py_file.read_text(encoding="utf-8", errors="replace")

        if "@router." not in source and "@app." not in source:
            continue

        module_name = py_file.stem

        prefix = ""
        prefix_match = _FASTAPI_ROUTER_PREFIX.search(source)
        if prefix_match:
            prefix = prefix_match.group(1).rstrip("/")

        for pattern in (_FASTAPI_ROUTE, _FASTAPI_APP_ROUTE):
            for m in pattern.finditer(source):
                http_method = m.group(1).upper()
                route_path = m.group(2)

                if prefix and not route_path.startswith(prefix):
                    full_path = prefix + ("/" + route_path.lstrip("/") if route_path != "/" else "")
                else:
                    full_path = route_path

                full_path = re.sub(r"\{(\w+)\}", r"{\1}", full_path)

                endpoints.append({
                    "method": http_method,
                    "path": full_path,
                    "controller": module_name,
                    "permission": "",
                    "service": "py-payments-ledger",
                })

    return endpoints


# ---------------------------------------------------------------------------
# Geração do Markdown
# ---------------------------------------------------------------------------

def generate_markdown(endpoints: list[dict]) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines = [
        "# Catálogo de APIs — Fluxe B2B Suite",
        "",
        f"> Gerado automaticamente em {now} via `docs/scripts/api-catalog.py`",
        "",
        "---",
        "",
    ]

    by_service: dict[str, list[dict]] = {}
    for ep in sorted(endpoints, key=lambda e: (e["service"], e["path"], e["method"])):
        by_service.setdefault(ep["service"], []).append(ep)

    lines.append(f"**Total de endpoints:** {len(endpoints)}")
    lines.append("")
    lines.append("| Serviço | Endpoints |")
    lines.append("|---------|-----------|")
    for svc, eps in by_service.items():
        lines.append(f"| {svc} | {len(eps)} |")
    lines.append("")

    for svc, eps in by_service.items():
        lines.append(f"## {svc}")
        lines.append("")
        lines.append("| Método | Path | Controller | Permissão |")
        lines.append("|--------|------|------------|-----------|")
        for ep in eps:
            perm = ep["permission"] if ep["permission"] else "—"
            lines.append(
                f"| `{ep['method']}` | `{ep['path']}` | {ep['controller']} | {perm} |"
            )
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## Endpoints comuns a todos os serviços")
    lines.append("")
    lines.append("| Path | Descrição |")
    lines.append("|------|-----------|")
    lines.append("| `GET /healthz` | Health check de liveness |")
    lines.append("| `GET /readyz` | Health check de readiness |")
    lines.append("| `GET /metrics` ou `GET /actuator/prometheus` | Métricas Prometheus |")
    lines.append("| `GET /v1/ai/docs` | Documentação gerada por IA |")
    lines.append("| `GET /v1/audit` | Consulta de logs de auditoria |")
    lines.append("| `GET /v1/audit/export` | Exportação de logs de auditoria |")
    lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Gera catálogo de APIs da Fluxe B2B Suite"
    )
    parser.add_argument(
        "--output", "-o",
        default=str(WORKSPACE / "docs" / "CATALOGO-API.md"),
        help="Caminho do arquivo de saída (default: docs/CATALOGO-API.md)",
    )
    parser.add_argument(
        "--stdout", action="store_true",
        help="Imprimir no stdout em vez de salvar em arquivo",
    )
    args = parser.parse_args()

    all_endpoints: list[dict] = []

    if SPRING_DIR.exists():
        eps = parse_spring_controllers(SPRING_DIR)
        print(f"[spring-saas-core] {len(eps)} endpoints encontrados", file=sys.stderr)
        all_endpoints.extend(eps)
    else:
        print(f"[spring-saas-core] diretório não encontrado: {SPRING_DIR}", file=sys.stderr)

    if NESTJS_DIR.exists():
        eps = parse_nestjs_controllers(NESTJS_DIR)
        print(f"[node-b2b-orders] {len(eps)} endpoints encontrados", file=sys.stderr)
        all_endpoints.extend(eps)
    else:
        print(f"[node-b2b-orders] diretório não encontrado: {NESTJS_DIR}", file=sys.stderr)

    if FASTAPI_DIR.exists():
        eps = parse_fastapi_routers(FASTAPI_DIR)
        print(f"[py-payments-ledger] {len(eps)} endpoints encontrados", file=sys.stderr)
        all_endpoints.extend(eps)
    else:
        print(f"[py-payments-ledger] diretório não encontrado: {FASTAPI_DIR}", file=sys.stderr)

    md = generate_markdown(all_endpoints)

    if args.stdout:
        print(md)
    else:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(md, encoding="utf-8")
        print(f"\nCatálogo gerado: {out_path}", file=sys.stderr)
        print(f"Total: {len(all_endpoints)} endpoints", file=sys.stderr)


if __name__ == "__main__":
    main()

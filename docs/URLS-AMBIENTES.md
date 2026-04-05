# URLs por ambiente

Referência rápida dos hosts públicos no Railway.

**Branches:** `develop` alimenta **staging** (teste/validação); `master` alimenta **produção** (uso real). Ver [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md).

| Ambiente | Branch Git | Documento |
|----------|------------|-----------|
| **Staging** (teste) | `develop` | [URLS-STAGING.md](URLS-STAGING.md) |
| **Produção** (para valer) | `master` | [URLS-PRODUCAO.md](URLS-PRODUCAO.md) |

O Railway atribui subdomínios `*.up.railway.app` **por serviço**; os nomes incluem sufixos como `-staging`, `-production` e, nos fronts, um identificador curto. Copie sempre o host do **painel Railway → serviço → Networking** se duvidar.

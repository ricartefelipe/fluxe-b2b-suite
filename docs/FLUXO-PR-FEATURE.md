# Fluxo: feature branch → PR → merge → apagar branch

Resumo do fluxo Git Flow com Pull Request e limpeza da branch de feature.

---

## 1. Criar a branch a partir de `develop`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-descritivo
```

---

## 2. Desenvolver e commitar

```bash
# ... alterações ...
git add .
git commit -m "feat(escopo): descrição"
# mais commits se necessário
```

---

## 3. Enviar a branch e abrir Pull Request

```bash
git push origin feature/nome-descritivo
```

No GitHub (ou GitLab):

- Abrir **Pull Request** de `feature/nome-descritivo` **para** `develop`
- Preencher título e descrição
- Aguardar CI (verde) e revisão

---

## 4. Fazer merge do PR

- Usar **Merge commit** (não Squash, para manter histórico `--no-ff`)
- Clicar em **Merge pull request**

---

## 5. Apagar a branch de feature

- No GitHub: após o merge, clicar em **Delete branch**
- Localmente (opcional):

  ```bash
  git checkout develop
  git pull origin develop
  git branch -d feature/nome-descritivo
  ```

---

## 6. Promover para produção (quando pronto)

- Abrir PR `develop` → `master`
- Após merge em `master`, criar **tag** (ver [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md)#release-e-tags):

  ```bash
  git checkout master
  git pull origin master
  git tag -a v1.5.0 -m "Release v1.5.0: descrição"
  git push origin v1.5.0
  ```

---

## Referência

- [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) — Fluxo prático, release e tags, CI/CD
- [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) — Checklist de go-live para venda

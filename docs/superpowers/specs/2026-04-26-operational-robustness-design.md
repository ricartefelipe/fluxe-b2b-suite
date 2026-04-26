# Operational Robustness, Tests and Deploy - Item C

## Objective

Increase confidence in staging and release checks without changing product behavior. This package focuses on reducing false positives in smoke scripts, making staging health checks easier to run from GitHub, and keeping pipeline documentation aligned with the actual workflows.

## Scope

- Harden staging endpoint smoke checks with isolated temporary response files.
- Replace the fixed order-reservation sleep with polling to reduce worker timing flakes.
- Make the UI smoke script fail when unit tests fail, instead of reporting success with warnings.
- Add a manual GitHub workflow for staging health/ready checks.
- Align pipeline documentation with the active Semgrep workflow and note inactive nested workflows.

## Out of Scope

- Full cross-service E2E automation in CI.
- Branch protection changes in GitHub settings.
- Railway or third-party panel configuration.
- Reworking deploy topology or introducing new infrastructure.

## Validation

- Shell scripts must pass `bash -n`.
- The new workflow must be YAML-valid by inspection and use only existing public URLs or optional repository secrets.
- Existing CI/build workflows should remain untouched except for the new manual smoke workflow.

# Billing Contract UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Admin Console billing page so SaaS subscription behavior is clearer, better tested, locale-aware, and less likely to call the wrong lifecycle operation.

**Architecture:** Keep billing lifecycle writes behind the existing Core API client. The UI should use `/v1/subscriptions/current` as the canonical current subscription read, keep `/v1/billing/plans` for catalog, and only call trial creation when no current subscription exists. This package does not add invoices or new backend writes.

**Tech Stack:** Angular standalone components, Angular Material, RxJS `firstValueFrom`, Vitest/Angular TestBed, Spring Core REST contracts documented from the frontend side.

---

### Task 1: Billing Page Tests

**Files:**

- Modify: `saas-suite-ui/apps/admin-console/src/app/pages/billing.page.spec.ts`

- [ ] **Step 1: Add failing tests**

Add tests that verify the page loads plans/subscription/users, formats plan prices through the active locale, shows a clear error on failed plan loading, and does not call `startTrial` when there is already a subscription.

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec nx test admin-console -- --run apps/admin-console/src/app/pages/billing.page.spec.ts`

Expected: failures around missing error state / locale-aware formatting / unsafe plan change behavior.

### Task 2: Billing Page Implementation

**Files:**

- Modify: `saas-suite-ui/apps/admin-console/src/app/pages/billing.page.ts`
- Modify: `saas-suite-ui/libs/shared/i18n/src/lib/i18n.tokens.ts`
- Modify: `saas-suite-ui/libs/shared/i18n/src/lib/pt-br.messages.ts`
- Modify: `saas-suite-ui/libs/shared/i18n/src/lib/en-us.messages.ts`

- [ ] **Step 1: Implement minimal UI state**

Add a `loadError` signal and render a small error card/action when the billing catalog or initial subscription load fails.

- [ ] **Step 2: Make prices locale-aware**

Use `I18nService.locale()` with `Intl.NumberFormat`, defaulting to `BRL` while keeping the existing backend model unchanged.

- [ ] **Step 3: Prevent unsafe plan write**

When a subscription already exists, route plan management through the billing portal instead of calling `startTrial(plan.slug)`.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `pnpm exec nx test admin-console -- --run apps/admin-console/src/app/pages/billing.page.spec.ts`

Expected: billing page tests pass.

### Task 3: Contract Documentation

**Files:**

- Create: `docs/superpowers/specs/2026-04-26-billing-subscription-contract-design.md`
- Modify: `docs/PIPELINE-ESTEIRAS.md` only if needed for release notes. Do not touch backend contracts in this package.

- [ ] **Step 1: Document canonical subscription reads**

Document that the Admin Console reads current subscription from `/v1/subscriptions/current`, reads catalog from `/v1/billing/plans`, and uses the billing portal for existing subscription changes.

- [ ] **Step 2: Self-review the doc**

Confirm there are no placeholders, no claim that invoices are implemented, and no backend write behavior beyond existing endpoints.

### Task 4: Verification and PR

**Files:**

- All files touched in Tasks 1-3

- [ ] **Step 1: Run targeted tests**

Run: `pnpm exec nx test admin-console -- --run apps/admin-console/src/app/pages/billing.page.spec.ts`

- [ ] **Step 2: Run production build**

Run: `pnpm exec nx build admin-console --configuration=production`

- [ ] **Step 3: Run lints on touched files**

Use IDE lint diagnostics and fix introduced issues.

- [ ] **Step 4: Open PR to develop**

Push branch, open PR to `develop`, wait for CI, and merge when green.

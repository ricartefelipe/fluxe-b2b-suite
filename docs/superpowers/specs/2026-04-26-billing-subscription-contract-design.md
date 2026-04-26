# Billing and Subscription Contract Design

## Objective

Clarify the first production-safe billing package before adding invoices or new charge flows. The Admin Console should improve confidence around the existing SaaS subscription surface without changing backend write semantics.

## Canonical Reads

- Current subscription: `GET /v1/subscriptions/current`
- Plan catalog: `GET /v1/billing/plans`
- Tenant usage displayed in the billing page remains a UI aggregate of current users and the current plan limits.

## Existing Writes

- New tenants without a subscription may start a trial through `POST /v1/subscriptions/trial`.
- Existing subscribers should manage plan changes through the billing portal (`POST /v1/billing/portal-session`) until the backend exposes an explicit, reviewed upgrade/downgrade endpoint for the Admin Console.
- Cancellation scheduling continues to use `POST /v1/subscriptions/schedule-cancel` and undo uses `POST /v1/subscriptions/undo-schedule-cancel`.

## Out of Scope

- SaaS invoices, invoice PDFs, or invoice history in the Admin Console.
- New billing backend endpoints.
- Enforcement of plan limits.
- Synchronization changes across Core, Orders, and Payments services.

## UX Guarantees

- Billing catalog failures surface as an actionable error instead of an empty page.
- Prices are formatted with the active UI locale while keeping the backend plan currency assumptions unchanged.
- Existing subscriptions are not re-trialed from the plan cards.

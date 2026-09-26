---
name: stripe-connect-lms
description: 'Use when working on Stripe Connect onboarding, checkout, webhooks, course/educational-path pricing, promo codes, or purchase records in the Ecurs LMS (app/api/stripe, app/api/webhook, lib/stripe.ts, CoursePrice/EducationalPathPrice/UserCoursePurchase/EducationalPathPurchase/PromoCode models).'
---

# Stripe Connect Integration (Ecurs LMS)

Ecurs uses **Stripe Connect**, one connected account **per School** (not per teacher). Read existing code before changing onboarding/webhook logic — the state machine is easy to break.

## Key Facts

- `School.stripeAccountId` / `School.stripeAccountStatus` / `School.stripeOnboardingComplete` — these three fields can be **out of sync**; always check both `stripeAccountStatus` and `stripeOnboardingComplete` before treating a school as "ready to sell". See [prisma/schema.prisma](../../../prisma/schema.prisma) around the `School` model.
- Relevant routes: `app/api/stripe/connect/`, `app/api/stripe/create-account-link/`, `app/api/stripe/recreate-company-account/`, `app/api/stripe/update-account-type/`, and the webhook handler in `app/api/webhook/`.
- Pricing: `CoursePrice` (1:1 `Course`) and `EducationalPathPrice` (1:1 `EducationalPath`).
- Purchases: `UserCoursePurchase` (1:1 `UserCourse`) and `EducationalPathPurchase` — **append-only**, never delete or mutate historical rows; add new fields/status rather than overwriting.
- `PromoCode.discount` is an **integer percentage** (e.g. `20` = 20% off), never a fixed amount — watch for code that treats it as cents.
- All Stripe SDK calls (`lib/stripe.ts`) must stay server-side only — never import into client components.

## Workflow for Changes

1. Read the current webhook handler in `app/api/webhook/` fully before adding a new event type — event handling is centralized there and order-sensitive (e.g. must upsert purchase before marking `UserCourse` active).
2. When adding a new Stripe-driven field, add it to the relevant Prisma model with an explicit `onDelete` (this repo uses `relationMode = "prisma"`, no DB-level cascades), then run `npx prisma migrate dev` and `npx prisma generate`.
3. Follow the standard API route pattern (auth via `providerId`, Zod validation, try/catch + `console.error("[ROUTE_NAME]", ...)`) — see [copilot-instructions.md](../../copilot-instructions.md).
4. For anything touching money (price changes, promo codes, refund logic), double-check `schoolId` scoping so one school can never read/mutate another school's Stripe/purchase data.
5. Test webhook flows locally with the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhook`) before relying on manual UI testing alone.

## Common Pitfalls

- Forgetting `stripeOnboardingComplete` check → school appears connected but can't actually receive payouts.
- Treating `PromoCode.discount` as an amount instead of a percentage.
- Deleting/overwriting purchase records instead of appending a new status row.
- Missing `schoolId` filter on a school-scoped Stripe query (data leak).

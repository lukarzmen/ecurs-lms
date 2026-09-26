---
name: legal-terms-tracker
description: 'Use when the user asks to check, review, or update the Terms of Service / Regulamin (app/(legal)/terms) or Privacy Policy (app/(legal)/privacy) against current Polish/EU e-commerce, consumer, and data-protection law (RODO/GDPR, ustawa o prawach konsumenta, ustawa o świadczeniu usług drogą elektroniczną, Digital Services Act). Also use to periodically audit whether the regulamin is still compliant with current legislation.'
---

# Legal Terms & Regulation Tracking (Regulamin)

Ecurs' legal pages live at `app/(legal)/terms/page.tsx` (Regulamin) and `app/(legal)/privacy/page.tsx` (Polityka Prywatności). Poland is the primary jurisdiction (`pl` is the default locale), so **Polish consumer/e-commerce/data-protection law is the primary compliance target**, with EU-level regulations (GDPR, Digital Services Act, Digital Content Directive) as the umbrella framework.

## When Invoked

1. **Read the current text** of `app/(legal)/terms/page.tsx` (and `privacy/page.tsx` if data-processing clauses are affected) fully before proposing changes.
2. **Identify what areas of law apply**, based on what Ecurs actually does (paid online courses, subscriptions, promo codes, school/teacher marketplace, Stripe Connect payouts, user-generated content, AI-generated content):
   - Prawo konsumenckie: ustawa z 30 maja 2014 r. o prawach konsumenta (right of withdrawal for digital content/services — note the exception when the consumer consents to immediate performance and loses the withdrawal right for digital content already accessed).
   - RODO/GDPR — data processing, retention, user rights (access, erasure, portability), international transfers (Azure Blob, Redis, OpenAI, ElevenLabs, Stripe as sub-processors).
   - Ustawa o świadczeniu usług drogą elektroniczną (e-service provider obligations, regulamin disclosure requirements under Art. 8).
   - EU Digital Services Act (DSA) — if user-generated/course content moderation or marketplace-style teacher listings are in scope.
   - Ustawa o prawie autorskim — teacher-authored course content, AI-generated content ownership/licensing.
   - Payment/marketplace rules relevant to Stripe Connect payouts to schools/teachers (see [stripe-connect-lms skill](../stripe-connect-lms/SKILL.md)).
3. **Check for recent changes**: use the web-fetch tool against official/reliable sources before asserting "the law changed" — do not guess dates or article numbers from memory. Good sources: `isap.sejm.gov.pl` (Dziennik Ustaw), `uodo.gov.pl` (UODO/RODO guidance), `uokik.gov.pl` (consumer protection), `eur-lex.europa.eu` (EU regulations/directives). Always cite the specific source/date fetched when reporting findings to the user.
4. **Diff against the current regulamin text**: point out concretely which clause is outdated/missing/non-compliant and why, quoting the current wording next to the proposed replacement.
5. **Propose Polish-first edits** (Polish is the default locale) directly in `app/(legal)/terms/page.tsx` — keep existing structure/numbering, add new clauses at the correct section rather than appending everything at the end.
6. **Never silently assume compliance** — if a source can't be verified via fetch, say so explicitly instead of stating a legal conclusion as fact.

## Output Expectations

When reporting findings (not just when editing), summarize as a short table: `Obszar prawa | Aktualny stan w regulaminie | Wymagana zmiana | Źródło`.

## Constraints

- This is not formal legal advice — flag to the user that material legal changes should be reviewed by a lawyer before publishing, especially anything affecting withdrawal rights, liability limitation, or payment terms.
- Do not invent statute numbers, article numbers, or dates — verify via fetch or say "do potwierdzenia".

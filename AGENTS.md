# Ecurs LMS – Agent Instructions

Ecurs is a **Next.js 15 (App Router)** full-stack Learning Management System with interactive course creation, AI content tools, school management, and Stripe-based monetization.

---

## Setup

```bash
npm install          # also runs `prisma generate` via postinstall hook
cp .env.dev .env.local   # fill in all required keys before running anything
npm run dev          # dev server at http://localhost:3000
```

Required environment variables (see `.env.dev` for the full list):
- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk auth
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `AZURE_STORAGE_CONNECTION_STRING` / `AZURE_STORAGE_CONTAINER_NAME`
- `REDIS_URL`

> **All scripts run with `TZ=Europe/Warsaw`** — this is intentional and must be preserved.

---

## Build & Validation Commands

```bash
npm run build        # prisma generate + next build — use to validate no TS/build errors
npm run lint         # ESLint — must pass with zero errors
npm run pretty       # Prettier — run after writing code
npx prisma migrate dev   # after editing schema.prisma
npx prisma generate      # after any schema change, before building
```

After making code changes, always run `npm run lint` and `npm run build` to verify correctness. There is no test suite — lint + build is the primary verification gate.

---

## Repository Structure

```
app/
  (auth)/            Sign-in / sign-up (Clerk-managed)
  (course)/          Public course browsing, registration, certificates
  (dashboard)/       Protected teacher dashboard (route group, layout-wrapped)
  (legal)/           Privacy, terms pages
  api/               All API routes (REST, no tRPC)
    admin/           Platform admin
    analytics/       Course & school analytics
    audio/           ElevenLabs TTS
    categories/      Course categories
    content/         Module content (Lexical JSON)
    conversations/   AI conversations per module
    courses/         Course CRUD, search
    educational-paths/  Learning path CRUD
    module/          Module CRUD, auto-publish
    notifications/   Notification schedules & delivery
    permissions/     Role checks
    platform-subscription/  Teacher platform plans
    schools/         School management, teacher invites
    stripe/          Stripe Connect onboarding, checkout
    student/         Student-facing endpoints
    teacher/         Teacher-facing endpoints
    transcribe/      Audio transcription
    upload/          Azure Blob file uploads
    user/            User profile
    webhook/         Stripe webhook handler
    wishlist/        Wishlist management
  browse/            Public course catalog
  teacher/onboarding/ Teacher onboarding flow
components/
  ui/                shadcn/ui primitives (Radix UI + Tailwind)
  editor/            Lexical-based rich-text editor with plugins
  _components/       Route-scoped components (co-located with routes)
  modals/            Shared modal components
  providers/         React context providers (confetti, i18n, toast)
hooks/               Zustand stores + React custom hooks
lib/
  db.ts              Prisma client singleton (import from here, never instantiate new)
  i18n/              Custom i18n: server.ts, client helpers, types
  stripe.ts          Stripe client singleton
  utils.ts           cn(), formatting helpers
services/
  AzureBlobService.tsx
  ElevenLabsService.tsx
  OpenAIService.tsx
  RedisService.tsx
  HashedService.tsx
prisma/
  schema.prisma      Source of truth for DB schema
  migrations/        Never edit manually
public/
  locales/pl/common.json   Polish translations (default)
  locales/en/common.json   English translations
```

---

## Authentication (Clerk)

Clerk manages auth. The Clerk `userId` is stored in the DB as `User.providerId`, **not** `User.id`.

```ts
import { auth } from "@clerk/nextjs/server";

const { userId } = await auth();
if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// ALWAYS look up by providerId, never by id
const user = await db.user.findFirst({ where: { providerId: userId } });
if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
```

**Critical rules:**
- **Never** use `where: { id: userId }` — Clerk IDs are strings, DB IDs are integers.
- Always check that the resolved `user` exists before proceeding.
- Middleware in `middleware.ts` protects routes — check it before adding new protected pages.

---

## API Route Pattern

```ts
// app/api/[resource]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ title: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findFirst({ where: { providerId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const result = await db.someModel.create({ data: { ...parsed.data } });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[ROUTE_NAME]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

Rules:
- Always wrap in `try/catch`, log with `console.error("[ROUTE_NAME]", error)`.
- Validate all incoming data with **Zod** before touching the DB.
- Return consistent `{ error: string }` on failure.
- Use `NextResponse.json()` — never `Response.json()` in App Router routes.

---

## Database Conventions (Prisma + PostgreSQL)

- `relationMode = "prisma"` — DB-level foreign key constraints are **off**. Prisma enforces them. Always include `onDelete` options on relations.
- Integer PKs: `id Int @id @default(autoincrement())`.
- GUIDs on file-related models: `guid String @unique @default(uuid())`.
- Multi-tenant: most content models have `schoolId Int?` — **always filter by `schoolId`** in school-scoped queries.
- After editing `schema.prisma`: run `npx prisma migrate dev` then `npx prisma generate`.
- Import the Prisma client as: `import { db } from "@/lib/db"` — never instantiate `new PrismaClient()`.

### Key Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User` | `providerId` (Clerk ID), `email`, `roleId` | Look up via `providerId` |
| `School` | `ownerId`, `schoolType` (`"individual"` / `"business"`), `stripeAccountId` | Multi-tenant root |
| `Course` | `authorId`, `schoolId`, `state` (int), `mode` (int) | Always index-filter by `schoolId` |
| `Module` | `courseId`, `position`, `publishedAt`, `state` | `publishedAt` indexed for auto-publish cron |
| `ModuleContent` | `moduleId` (unique), `data` (JSON) | 1:1 with Module; validate JSON shape before writing |
| `UserCourse` | `[userId, courseId]` unique, `roleId` | Distinguishes teacher vs. student enrollment |
| `EducationalPath` | `authorId`, `schoolId`, `state` | Ordered via `EducationalPathCourse.position` |
| `SchoolTeacher` | `schoolId`, `teacherId`, `role` (`"owner"` / `"member"`) | Team membership |
| `TeacherJoinRequest` | `teacherId`, `schoolId`, `status` (`pending`/`accepted`/`rejected`) | Join workflow |
| `UserCoursePurchase` | `userCourseId` (unique), billing fields | Linked 1:1 to `UserCourse` |
| `PromoCode` | `code`, `discount` (int %) | Referenced from purchase models |

---

## Components

- **CVA** (`class-variance-authority`) for variant-based component styling.
- UI primitives: `components/ui/` — shadcn/ui pattern (Radix UI + Tailwind). Add new primitives here.
- Route-specific components: `_components/` folder co-located with the route segment.
- Icons: `lucide-react` only (no other icon libraries).
- Forms: **React Hook Form** + **Zod** resolver (`@hookform/resolvers/zod`).
- Styling: Tailwind CSS utility classes. Use `cn()` from `lib/utils.ts` to merge class names.

---

## State Management

| Concern | Tool |
|---------|------|
| Client global state | **Zustand** — stores in `hooks/` |
| Local component state | `useState` / `useReducer` |
| Server/async state | **React Query** (`@tanstack/react-query`) |

---

## i18n

- Supported locales: `pl` (default), `en`.
- Locale is stored in `locale` cookie; falls back to `Accept-Language` header.
- Translation files: `public/locales/{pl,en}/common.json`.
- Server usage:
  ```ts
  import { getMessages, createTranslator } from "@/lib/i18n/server";
  const messages = await getMessages(locale, "namespace");
  const t = createTranslator(messages);
  ```
- Client usage: `useI18n()` hook from `hooks/use-i18n.ts`.
- **Polish is the default** — always add Polish strings first when adding translations.
- Never hard-code user-visible strings in Polish or English directly in components; use the translator.

---

## Stripe & Payments

- Stripe Connect is used: each School has its own `stripeAccountId`.
- `stripeAccountStatus` + `stripeOnboardingComplete` control the onboarding flow — read existing webhook logic in `app/api/webhook/` before modifying.
- Pricing exists on both `Course` (`CoursePrice`) and `EducationalPath` (`EducationalPathPrice`).
- Purchases are recorded in `UserCoursePurchase` / `EducationalPathPurchase` — these are append-only records; never delete them.
- Promo codes: `PromoCode` model, referenced by both purchase models.
- All Stripe operations must happen server-side only.

---

## AI & External Services

- **OpenAI**: `services/OpenAIService.tsx` — keep all AI calls server-side only. `dangerouslyAllowBrowser: true` is set but must not be used client-side.
- **ElevenLabs**: `services/ElevenLabsService.tsx` — text-to-speech for module audio.
- **Azure Blob**: `services/AzureBlobService.tsx` — file/image storage. Use upload endpoints in `app/api/upload/`.
- **Redis**: `services/RedisService.tsx` — caching and session data.
- **Collaborative editing**: Yjs + y-websocket. Requires a separate `y-websocket` server process; not part of Next.js.

---

## Lexical Editor

- Rich text editor in `components/editor/`.
- Module content is stored as Lexical JSON blob in `ModuleContent.data`.
- Use `ReadonlyEditor` for read-only rendering, `Editor` for editing.
- Always validate the JSON shape against the Lexical format before persisting.

---

## Common Pitfalls

1. **`prisma generate` must run before `next build`** — it's in the `build` script, but re-run after any schema change.
2. **Never query `User` by `id` using a Clerk userId** — always use `providerId`.
3. **`schoolId` scoping** — forgetting to filter by `schoolId` in school-scoped queries is a data-leak bug.
4. **`ModuleContent.data` is raw JSON** — always validate the shape; invalid JSON will break the editor.
5. **Stripe Connect onboarding state** — `stripeAccountStatus` and `stripeOnboardingComplete` must both be checked; they can be out of sync.
6. **`TZ=Europe/Warsaw`** — never remove this from scripts; all date logic depends on it.
7. **`relationMode = "prisma"`** — no DB-level cascades; if you add a new relation without `onDelete`, deletes will fail or leave orphans.
8. **AI calls are server-side only** — never import `OpenAIService` in client components.
9. **`position` ordering** — `Module.position` and `EducationalPathCourse.position` are managed manually; always re-index after reorder operations.
10. **Promo code discounts** — `PromoCode.discount` is an integer percentage (e.g., `20` = 20% off); not a fixed amount.

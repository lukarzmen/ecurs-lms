# Ecurs LMS – Copilot Instructions

Ecurs is a Next.js 15 (App Router) full-stack LMS with interactive course creation, AI content tools, school management, and Stripe-based monetization.

## Build & Dev

```bash
npm install          # also runs prisma generate (postinstall)
npm run dev          # Next.js dev server at http://localhost:3000
npm run build        # prisma generate + next build
npm run lint         # ESLint
npm run pretty       # Prettier format all TS/JS/JSON
```

All scripts run with `TZ=Europe/Warsaw` — this is intentional and must be preserved.  
Copy `.env.dev` to `.env.local` and fill in keys (Clerk, PostgreSQL, OpenAI, ElevenLabs, Stripe, Azure Blob, Redis).

## Architecture

```
app/
  (auth)/        Sign-in / sign-up pages
  (course)/      Public course browsing and registration
  (dashboard)/   Protected teacher dashboard (route group)
  (legal)/       Privacy, terms
  api/           API routes: admin, analytics, courses, module,
                 schools, student, teacher, stripe, webhook, …
components/
  ui/            shadcn/ui primitives (Radix UI + Tailwind)
  editor/        Lexical-based rich-text editor with plugins
  _components/   Route-scoped components (co-located)
hooks/           Zustand stores and React hooks
lib/
  db.ts          Prisma client singleton
  i18n/          Custom i18n (server + client helpers, messages)
services/        External-service wrappers (Azure Blob, OpenAI, ElevenLabs, Stripe, Redis)
prisma/
  schema.prisma  Source of truth for DB schema
```

## Auth (Clerk)

```ts
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();           // Clerk user ID string
if (!userId) return new Response("Unauthorized", { status: 401 });

// Lookup in DB — Clerk ID is stored as `providerId`, NOT `id`
const user = await db.user.findUnique({ where: { providerId: userId } });
```

**Never** query `where: { id: userId }`. Always use `providerId`.

## API Route Pattern

```ts
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findFirst({ where: { providerId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    // validate with Zod, then business logic
    const result = await db.someModel.create({ data: { … } });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[ROUTE_NAME]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

## Database Conventions (Prisma + PostgreSQL)

- Schema uses integer `id` with `@default(autoincrement())`.
- `relationMode = "prisma"` — cascades are **not** enforced at DB level; Prisma handles them.
- Most relations use `onDelete: Cascade`.
- Key multi-tenant scope: many models have `schoolId` — **always filter by schoolId** when the context is school-scoped.
- `Module.publishedAt` is indexed — used by scheduled auto-publish logic.
- After editing `schema.prisma`, run `npx prisma migrate dev` then `npx prisma generate`.

### Key Models (summary)

| Model | Notes |
|-------|-------|
| `User` | `providerId` = Clerk ID; `roleId` |
| `School` | `schoolType`: `"individual"` (1 teacher) or `"business"` |
| `Course` | `authorId` → User, optional `schoolId` |
| `Module` | `position`, `publishedAt`, `ModuleContent` (JSON blob, 1:1) |
| `UserCourse` | Unique on `[userId, courseId]`; `roleId` distinguishes teacher/student |
| `EducationalPath` | Ordered via `EducationalPathCourse.position` |

## School & Multi-Tenancy

- `School.schoolType`: `"individual"` (single teacher, auto-created) or `"business"` (multi-teacher).
- `SchoolTeacher.role`: `"owner"` or `"member"`.
- `TeacherJoinRequest.status`: `"pending"` / `"accepted"` / `"rejected"`.
- Courses and EducationalPaths are owned by a School via `schoolId` — **always filter by `schoolId`** in school-scoped queries. Missing this filter is a data-leak bug.
- `School.stripeAccountId` — one Stripe Connect account per school (not per teacher).

## Stripe & Payments

- Stripe Connect: each School has `stripeAccountId`, `stripeAccountStatus`, `stripeOnboardingComplete`.
- Pricing: `CoursePrice` (1:1 with Course) and `EducationalPathPrice` (1:1 with EducationalPath).
- Purchases: `UserCoursePurchase` (linked 1:1 to `UserCourse`) and `EducationalPathPurchase` — append-only, never delete.
- `PromoCode.discount` is an integer percentage (e.g. `20` = 20% off), not a fixed amount.
- All Stripe operations must be server-side only. Webhook handler: `app/api/webhook/`.

## External Services

- `services/OpenAIService.tsx` — AI content generation. **Server-side only.**
- `services/ElevenLabsService.tsx` — Text-to-speech audio for modules.
- `services/AzureBlobService.tsx` — File/image storage. Use `app/api/upload/` endpoints.
- `services/RedisService.tsx` — Caching. Import the singleton, never instantiate directly.
- Collaborative editing: Yjs + y-websocket — requires a **separate** `y-websocket` process outside Next.js.

## Lexical Editor

- Rich-text editor in `components/editor/`. Content stored as Lexical JSON in `ModuleContent.data`.
- `ReadonlyEditor` for display, `Editor` / `LexicalEditor` for editing.
- Always validate JSON shape before persisting to `ModuleContent.data`.

## Components

- Use **CVA** (`class-variance-authority`) for variant-based styling — see [components/banner.tsx](../components/banner.tsx).
- UI primitives live in `components/ui/` (shadcn/ui pattern).
- Route-specific components go in `_components/` adjacent to the route.
- Icons: Lucide (`lucide-react`).
- Forms: React Hook Form + Zod.
- Styling: Tailwind CSS + `cn()` from `lib/utils.ts`.

## State Management

- **Zustand** for client-side global state — stores live in `hooks/`.
- Standard `useState`/`useEffect` for local component state.
- Server state: React Query (`@tanstack/react-query`).

## i18n

- Supported locales: `pl` (default), `en`.
- Locale stored in `locale` cookie; fallback to `Accept-Language` header.
- Translation files: `public/locales/{pl,en}/common.json`.
- Server helper: `getMessages(locale, namespace)` + `createTranslator(messages)` from `lib/i18n/server.ts`.
- **Polish is the default** — always provide Polish strings when adding translations.

## Pitfalls

- `prisma generate` must run before `next build` — already in the `build` script, but regenerate after any schema change.
- `OpenAIService` uses `dangerouslyAllowBrowser: true` — keep AI calls server-side only; never import in client components.
- `ModuleContent` is a raw JSON blob — validate shape before writing.
- Stripe Connect has complex onboarding state (`stripeAccountStatus`, `stripeOnboardingComplete`) — read existing logic before modifying.
- Collaborative editing (Yjs + y-websocket) requires a running `y-websocket` server separate from Next.js.
- `Course.state` and `Course.mode` are integers — check existing values before adding new states.
- `Module.position` and `EducationalPathCourse.position` are managed manually — re-index after reorder.
- `PromoCode.discount` is an integer percentage, not a fixed amount.
- `relationMode = "prisma"` — add `onDelete` to every new relation; there are no DB-level cascades.

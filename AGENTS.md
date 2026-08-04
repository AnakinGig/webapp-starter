# AGENTS.md

T3 stack app (Next.js 15 App Router + tRPC + Drizzle + Tailwind v4 + shadcn/ui) with **better-auth** replacing NextAuth. No test framework is installed. README.md is stale (still references NextAuth/Prisma) — ignore it.

## Commands (pnpm only)

- `pnpm dev` — dev server (`next dev --turbo`)
- `pnpm check` — `next lint` + `tsc --noEmit`; run this before finishing changes
- `pnpm typecheck`, `pnpm lint`, `pnpm format:write` / `pnpm format:check`
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` / `pnpm db:studio` — drizzle-kit
- No test script exists; do not invent one.

## Environment (src/env.js)

- `DATABASE_URL` is validated as `z.string().url()` — must be a real URL like `file:./db.sqlite`, NOT the literal `"file"` shown in `.env.example`. The local gitignored `db.sqlite` lives at the repo root.
- `BETTER_AUTH_GITHUB_CLIENT_ID` / `BETTER_AUTH_GITHUB_CLIENT_SECRET` are required even in dev (dummy values pass); `BETTER_AUTH_SECRET` is only required in production.
- New env vars must be added to both `src/env.js` (server or client schema + `runtimeEnv`) and `.env.example`.
- `SKIP_ENV_VALIDATION=1` bypasses validation (useful for Docker builds).

## Drizzle

- `drizzle.config.ts` sets `tablesFilter: ["webapp-starter_*"]`: drizzle-kit only manages tables whose names start with `webapp-starter_`. New app tables must follow this prefix or `db:generate`/`db:push` will silently ignore them.
- Better-auth core tables (`user`, `account`, `session`, `verification` in `src/server/db/schema.ts`) deliberately have no prefix and are excluded from drizzle-kit management — do not "fix" their names.

## Auth

- better-auth is mounted at `/api/auth/*` (`src/app/api/auth/[...all]/route.ts`); GitHub OAuth redirect URI is hardcoded to `http://localhost:3000`.
- Get the session server-side with `getSession()` from `~/server/better-auth/server` (RSC), or via `ctx.session` in tRPC; `protectedProcedure` in `src/server/api/trpc.ts` throws `UNAUTHORIZED` for logged-out users.

## tRPC

- New routers must be manually registered on `appRouter` in `src/server/api/root.ts`.
- superjson transformer; zod validation errors are flattened into `shape.data.zodError`.

## Style conventions

- Path aliases `~/*` and `@/*` both map to `./src/*`.
- ESLint enforces `consistent-type-imports` (inline `type` imports), and drizzle rules error on `db.delete()` / `db.update()` without a `.where()`.
- UI components live in `src/components/ui` (shadcn "base-nova" style); use `pnpm dlx shadcn add ...` to add more.

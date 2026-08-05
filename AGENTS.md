# AGENTS.md

T3 stack app (Next.js 15 App Router + tRPC + Drizzle + Tailwind v4 + shadcn/ui) with **better-auth** replacing NextAuth, backed by **SingleStore** (see `docs/singlestore.md`). No test framework is installed. README.md is the source of truth for setup, features, and the roadmap - keep it in sync whenever a feature changes it.

## Working rules (apply to every feature)

- **Commit after every feature**: once a feature is complete and `pnpm check` passes, commit it with a concise message and push to `origin` (see *Git workflow* below). Never leave finished work uncommitted.
- **Form errors go under the input, not in toasts**: every validation/API error must render inline as a `FieldError` under the field where it occurred, with `aria-invalid` on the input. Toasts are for success, not for errors. When a server error points at a specific field (e.g. duplicate email), map it under that field; otherwise show it as a form-level `Alert`.
- **Validate on the frontend when possible**: mirror server rules client-side (format, length, match, policy) so users get instant feedback - but only where it isn't a security risk. Never trust client checks: the server must always re-validate (passwords, permissions, ownership, etc.).
- **Surface results as fast as possible**: run cheap checks when the user leaves a field (on blur), not only on submit - e.g. verify the current password against the backend on blur, check email format on blur. Guard in-flight calls (refs + pending flags) so stale responses never overwrite newer input.
- **Use shadcn/ui first**: build UI from the shadcn components in `src/components/ui` (extend with `pnpm dlx shadcn add ...`); do not hand-roll new primitives.
- **Security review per feature**: before finishing anything, ask what an attacker could do with it - auth bypass, privilege escalation, data leaks, mass assignment, password oracles, missing rate limits, cascading deletes. Enforce authorization server-side, never only in the UI. Explicitly flag any remaining risk to the user.
- **Update the README when needed**: if a feature changes setup, env vars, routes, or the roadmap, update README.md (and `.env.example` for new env vars) in the same commit.
- **Never use the em dash "-"**: write "-" instead, in code, comments, and docs. Em dashes sneak in from copy-paste and AI output; keep everything plain-ASCII.

## Commands (pnpm only)

- `pnpm dev` - dev server (`next dev --turbo`)
- `pnpm check` - `next lint` + `tsc --noEmit`; run this before finishing changes
- `pnpm typecheck`, `pnpm lint`, `pnpm format:write` / `pnpm format:check`
- `pnpm db:generate` / `pnpm db:migrate` - drizzle-kit. Do NOT use `db:push` or `db:studio` against SingleStore: their introspection queries MySQL `information_schema.check_constraints`, which SingleStore lacks, and they abort. `db:generate` needs no DB connection; `db:migrate` applies `drizzle/*.sql` in order.
- No test script exists; do not invent one.

## Environment (src/env.js)

- SingleStore connection is configured via `SINGLESTORE_HOST` / `SINGLESTORE_PORT` (coerced number, defaults to 3306) / `SINGLESTORE_USER` / `SINGLESTORE_PASSWORD` (optional) / `SINGLESTORE_DATABASE` / `SINGLESTORE_SSL` (`"true"` | `"false"`, defaults to `"true"`). TLS is required by SingleStore Helios; set `"false"` only for local deployments.
- `emptyStringAsUndefined: true` means empty strings fail validation - `.env.example` uses non-empty placeholders. `SINGLESTORE_PASSWORD` is optional to allow passwordless local instances.
- `BETTER_AUTH_GITHUB_CLIENT_ID` / `BETTER_AUTH_GITHUB_CLIENT_SECRET` are required even in dev (dummy values pass); `BETTER_AUTH_SECRET` is only required in production.
- New env vars must be added to both `src/env.js` (server or client schema + `runtimeEnv`) and `.env.example`.
- `SKIP_ENV_VALIDATION=1` bypasses validation (useful for Docker builds).

## Drizzle

- SingleStore is MySQL wire-compatible, so everything stays in **mysql** mode: `dialect: "mysql"` in `drizzle.config.ts`, the `mysql2` pool in `src/server/db/index.ts`, and `provider: "mysql"` for better-auth's `drizzleAdapter`. Do not switch to the `singlestore` dialect/driver - better-auth's adapter does not support it.
- `drizzle.config.ts` uses `tablesFilter: ["webapp-starter_*", "post", "user", "account", "session", "verification"]`, covering the app prefix plus the unprefixed template and better-auth tables. New app tables must use the `webapp-starter_` prefix or be added to the filter explicitly, or `db:generate`/`db:push` will silently ignore them.
- The pool and `drizzle.config.ts` both derive credentials from `SINGLESTORE_*` env vars; keep them in sync. The pool is cached on `globalThis` outside production to survive HMR.
- Schema uses `mysql-core` builders (`mysqlTable`, `varchar`, `timestamp`, `boolean`); the old sqlite forms (`integer({ mode: "timestamp" })`, `sql\`(unixepoch())\``) no longer apply. See `docs/singlestore.md`.
- SingleStore DDL gotchas (see `docs/singlestore.md`): Helios runs in columnstore mode - `CREATE ROWSTORE TABLE` is rejected on the free shared tier, a columnstore table can have only one key (PK or UNIQUE, not both), and FK DDL is unsupported. So the schema must not use `.references()` or `.unique()` (use plain `index()` instead - `user.email`/`session.token` are non-unique indexes), and timestamp defaults must be `sql\`CURRENT_TIMESTAMP\`` without parentheses. `db:generate` output needs no manual edits as long as these rules hold.

## Auth

- better-auth is mounted at `/api/auth/*` (`src/app/api/auth/[...all]/route.ts`); GitHub OAuth redirect URI is hardcoded to `http://localhost:3000`.
- The first user ever created is auto-assigned `role: "admin"` via `databaseHooks.user.create.before` in `src/server/better-auth/config.ts`; everyone else defaults to `"user"` (column default on `user.role` in the schema). Registration happens through the same path for email and OAuth signups.
- The custom `role` column MUST stay declared as `user.additionalFields.role` (`type: "string"`, `defaultValue: "user"`, `input: false`) in the same config. Better-auth only persists and returns model fields it knows about - without the declaration, the first-user hook's `role: "admin"` is silently dropped at insert time and `role` is missing from session/user output (breaking the admin navbar + `/dashboard` guard).
- Email verification is enabled via the `emailVerification` option: `sendVerificationEmail` prints the link to the console in dev and logs an error in prod (no provider is bundled - swap that one hook for Resend/SES/Postmark). `user.sendVerificationEmail` is a self-service tRPC procedure with a 60s in-memory cooldown. Email/password signups start with `emailVerified: false`; OAuth signups are pre-verified.
- Get the session server-side with `getSession()` from `~/server/better-auth/server` (RSC), or via `ctx.session` in tRPC; `protectedProcedure` in `src/server/api/trpc.ts` throws `UNAUTHORIZED` for logged-out users.

## tRPC

- New routers must be manually registered on `appRouter` in `src/server/api/root.ts`.
- superjson transformer; zod validation errors are flattened into `shape.data.zodError`.
- `adminProcedure` in `src/server/api/trpc.ts` requires `session.user.role === "admin"` (throws `FORBIDDEN`). The `user` router is admin-only and carries guard rails: no self-delete / self role change, no last-admin delete/demote, duplicate emails rejected, and delete cascades the target's `session`/`account` rows (no FK support on SingleStore). The self-service exceptions are all `protectedProcedure`s (any logged-in user, never admin-gated): `user.verifyPassword` (delegates to better-auth's server-scoped verify-password endpoint for blur-time checks), `user.exportData` (GDPR export - credentials like tokens/passwords are redacted), and `user.deleteAccount` (last-admin guard; cascades posts/sessions/accounts). All take the id from `ctx.session` - never from client input.

## Git workflow

- The user wants every feature committed and pushed to GitHub (`origin` at github.com/AnakinGig/webapp-starter) as soon as it's complete. Check `git branch --show-current` before pushing - never hardcode the branch name.
- After a feature is done and `pnpm check` is green: `git add` the relevant files, commit with a concise descriptive message (e.g. `feat(settings): add session management`), then `git push origin <branch>`.
- Do not commit secrets: `.env` is gitignored; only `.env.example` (placeholders) is committed.

## Style conventions

- Path aliases `~/*` and `@/*` both map to `./src/*`.
- ESLint enforces `consistent-type-imports` (inline `type` imports), and drizzle rules error on `db.delete()` / `db.update()` without a `.where()`.
- UI components live in `src/components/ui` (shadcn "base-nova" style); always prefer them and extend with `pnpm dlx shadcn add ...` rather than hand-rolling new primitives.

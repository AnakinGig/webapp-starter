# AGENTS.md

> **Read this first**: global UI/UX conventions live in `~/.agents/ui-ux-notes.md` (loadable as the `ui-ux` skill). Read and apply them before this file's rules, and append any new UI/UX lessons there so they carry to other projects.

Next.js 15 App Router + **Convex** (backend + database) + **better-auth** (running on Convex) + Tailwind v4 + shadcn/ui. README.md is the source of truth for setup, features, and the roadmap - keep it in sync whenever a feature changes it.

## Working rules (apply to every feature)

- **Commit after every feature**: once a feature is complete and `pnpm check` passes, commit it with a concise message and push to `origin` (see *Git workflow* below). Never leave finished work uncommitted.
- **Form errors go under the input, not in toasts**: every validation/API error must render inline as a `FieldError` under the field where it occurred, with `aria-invalid` on the input. Toasts are for success, not for errors. When a server error points at a specific field (e.g. duplicate email), map it under that field; otherwise show it as a form-level `Alert`.
- **Validate on the frontend when possible**: mirror server rules client-side (format, length, match, policy) so users get instant feedback - but only where it isn't a security risk. Never trust client checks: the server must always re-validate (passwords, permissions, ownership, etc.).
- **Surface results as fast as possible**: run cheap checks when the user leaves a field (on blur), not only on submit - e.g. verify the current password against the backend on blur, check email format on blur. Guard in-flight calls (refs + pending flags) so stale responses never overwrite newer input.
- **Use shadcn/ui first**: build UI from the shadcn components in `src/components/ui` (extend with `pnpm dlx shadcn add ...`); do not hand-roll new primitives.
- **Security review per feature**: before finishing anything, ask what an attacker could do with it - auth bypass, privilege escalation, data leaks, mass assignment, password oracles, missing rate limits, cascading deletes. Enforce authorization server-side (in Convex functions), never only in the UI. Explicitly flag any remaining risk to the user.
- **Update the README when needed**: if a feature changes setup, env vars, routes, or the roadmap, update README.md (and `.env.example` for new env vars) in the same commit.
- **Never use the em dash "—"**: write "-" instead, in code, comments, and docs. Em dashes sneak in from copy-paste and AI output; keep everything plain-ASCII.

## Commands (pnpm only)

- `pnpm dev` - Next.js dev server (`next dev --turbo`). Keep `npx convex dev` running in another terminal (it deploys functions locally, generates `convex/_generated`, and syncs `.env.local`).
- `pnpm check` - `next lint` + `tsc --noEmit`; run this before finishing changes
- `pnpm typecheck`, `pnpm lint`, `pnpm format:write` / `pnpm format:check`
- `pnpm codegen` - regenerate `convex/_generated` types (also runs via `npx convex dev` and `postinstall`)
- No test script exists; do not invent one.

## Convex (backend + data)

- All backend logic lives in `convex/`: Convex queries/mutations are the only way data changes hands. Client components call them with `useQuery`/`useMutation` from `convex/react` (reactive - mutations auto-invalidate subscribed queries; do not hand-roll refetching).
- App tables go in `convex/schema.ts` (`defineSchema`/`defineTable`). Convex IDs are `_id` / `_creationTime`; timestamps you store are epoch-ms numbers.
- Auth tables (`user`, `session`, `account`, `verification`, ...) live INSIDE the better-auth component at `convex/betterAuth/`. App code reads/writes them ONLY through the component's public adapter: `ctx.runQuery(components.betterAuth.adapter.findOne/findMany, ...)` and `ctx.runMutation(...adapter.create/updateOne/deleteMany, ...)`. The adapter uses `where`/`update`/`paginationOpts` (cursor-based) - `offset` is NOT supported.
- `convex/users.ts` is the admin/self-service layer: every function re-checks the session user's role (`role: "admin"`) before touching the adapter. Never trust client input for identity - use `authComponent.safeGetAuthUser(ctx)` (see below).
- Convex functions can call the better-auth API in-process via `authComponent.getAuth(createAuth, ctx)`; the component also exposes `safeGetAuthUser`, `getAuthUser`, `getHeaders`. Public adapter functions are NOT callable from the browser - only from app functions via `ctx.runQuery/runMutation`.
- Do not edit `convex/_generated/` or `convex/betterAuth/_generated/` - they are generated (commit them; regenerate with `pnpm codegen`). `.convex/` is local state, gitignored.
- Convex function files use relative imports for project files (e.g. `../src/lib/app`) - path aliases (`@/`, `~/`) are NOT resolved by the Convex bundler.

## Environment

- Next.js env vars are validated in `src/env.js` (client keys are `NEXT_PUBLIC_*`; add new ones to both `src/env.js` and `.env.example`). `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` are written to `.env.local` by `npx convex dev`.
- Auth/email secrets (`BETTER_AUTH_SECRET`, `SITE_URL`, `BETTER_AUTH_GITHUB_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `RESEND_EMAIL_FROM`) live ON THE CONVEX DEPLOYMENT - set with `npx convex env set <KEY> <value>` (or the dashboard). They are NOT in `.env.example` values.
- `SKIP_ENV_VALIDATION=1` bypasses Next env validation (useful for Docker builds).

## Auth (better-auth on Convex)

- better-auth runs INSIDE Convex: `convex/betterAuth/auth.ts` holds all options (password policy, email hooks, rate limiting, GitHub OAuth, the custom `role` field). Next.js just proxies `/api/auth/*` to the deployment (`src/app/api/auth/[...all]/route.ts` → `convex/http.ts`).
- The first user ever created is auto-assigned `role: "admin"` via the component trigger in `convex/betterAuth/triggers.ts` (fires on user create, patches the first row). The custom `role` field must stay declared in BOTH `user.additionalFields.role` in `auth.ts` and the `user` table in `convex/betterAuth/schema.ts` (keep them in sync - a missing declaration silently drops the field).
- Client: `authClient` from `@/lib/auth-client` (better-auth/react + convexClient plugin). Server: `getToken`/`isAuthenticated`/`fetchAuthQuery`/`preloadAuthQuery` from `@/lib/auth-server` (use `fetchAuthQuery(api.users.getCurrentUser)` for server-side guards, e.g. the admin-only `/dashboard` layout).
- Email flows: `sendVerificationEmail` + `sendResetPassword` hooks call `sendActionEmail` in `convex/email.ts` (Resend; without `RESEND_API_KEY` the link is logged to the function logs in dev - never log the token-bearing URL in prod). The resend button and forgot-password form call the proxied routes directly (`/api/auth/send-verification-email`, `authClient.forgetPassword`) - both are rate-limited server-side by better-auth (see `rateLimit` in `auth.ts`).
- Change-password blur check calls `POST /api/auth/verify-password` directly (not exposed as a client method).

## Git workflow

- The user wants every feature committed and pushed to GitHub (`origin` at github.com/AnakinGig/webapp-starter) as soon as it's complete. Check `git branch --show-current` before pushing - never hardcode the branch name.
- After a feature is done and `pnpm check` is green: `git add` the relevant files, commit with a concise descriptive message (e.g. `feat(settings): add session management`), then `git push origin <branch>`.
- Do not commit secrets: `.env`/`.env.local` are gitignored; only `.env.example` (placeholders) is committed.

## Style conventions

- Path aliases `~/*` and `@/*` both map to `./src/*` (Next/TS only - not inside `convex/`).
- ESLint enforces `consistent-type-imports` (inline `type` imports).
- UI components live in `src/components/ui` (shadcn "base-nova" style); always prefer them and extend with `pnpm dlx shadcn add ...` rather than hand-rolling new primitives.

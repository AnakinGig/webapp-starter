# Webapp Starter

A production-ready **SaaS boilerplate** with accounts, roles, and an admin dashboard out of the box — so you can skip the plumbing and build your actual product.

Built with the [T3 Stack](https://create.t3.gg/): **Next.js 15** (App Router) · **tRPC** · **Drizzle ORM** · **Tailwind CSS v4** + **shadcn/ui**, with **better-auth** for authentication and **SingleStore** (MySQL-compatible) as the database.

---

## ✨ What's included

**Accounts (basics)**
- Email + password sign-up / sign-in, plus **GitHub OAuth**
- **First user is automatically an admin** — every later signup gets the `user` role
- Password policy: **12+ chars, at least one uppercase, one number, one symbol**, enforced server-side by better-auth
- **ANSSI-style password strength meter** (pattern detection for `1234`/`qwerty`/`abcde`, repeated chars)
- **Session management**: list active devices, sign out individual sessions or all other sessions
- Blur-time current-password verification (server-side check) + change password
- Inline form errors under fields (no toast spam), `aria-invalid` for accessibility

**Admin dashboard (`/dashboard`, admin-only)**
- User management CRUD: create, edit, delete, search, paginated table
- Guard rails: **cannot delete or demote the last admin**, cannot self-delete/self-demote, deleting a user cascades their sessions & accounts
- Duplicate emails rejected with inline field errors

**Settings (`/settings`, all signed-in users)**
- GitHub-style sidebar: **Profile** (name, role, member-since) · **Appearance** (light / dark / system) · **Security** (password + sessions)

**Foundations**
- Type-safe end-to-end with **tRPC + Zod + superjson**; server env validation with `@t3-oss/env-nextjs`
- shadcn/ui components (base-ui), light/dark/system theming, responsive layout
- CI workflow (`.github/workflows/ci.yaml`) running lint + typecheck on every push

---

## 🚀 Quick start

Prerequisites: **Node.js 20+**, **pnpm**, and a **SingleStore** instance (cloud [Helios](https://www.singlestore.com/cloud/) or local).

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
#   → fill in your SINGLESTORE_* values (see .env.example comments)

# 3. Apply the database schema
pnpm db:migrate

# 4. Run the dev server
pnpm dev        # http://localhost:3000
```

> First registered user becomes **admin** automatically — use the dashboard to manage everyone after that.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `SINGLESTORE_HOST` | ✅ | e.g. `svc-xxxx.svc.singlestore.com` (Helios) or `localhost` |
| `SINGLESTORE_PORT` | — | default `3306` |
| `SINGLESTORE_USER` | ✅ | |
| `SINGLESTORE_PASSWORD` | — | optional for passwordless local instances |
| `SINGLESTORE_DATABASE` | ✅ | |
| `SINGLESTORE_SSL` | — | `"true"` (default, Helios) or `"false"` for local |
| `BETTER_AUTH_SECRET` | prod | random secret (see `.env.example`) |
| `BETTER_AUTH_URL` | ✅ | e.g. `http://localhost:3000` |
| `BETTER_AUTH_GITHUB_CLIENT_ID` / `..._SECRET` | ✅ | dummy values pass in dev; GitHub OAuth redirect is hardcoded to `http://localhost:3000` |

New env vars must be added to both `src/env.js` and `.env.example`.

---

## 📜 Available scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server (`next dev --turbo`) |
| `pnpm check` | Lint + typecheck (run before finishing changes) |
| `pnpm typecheck` / `pnpm lint` | Individually |
| `pnpm format:write` / `pnpm format:check` | Prettier |
| `pnpm db:generate` | Generate Drizzle migration SQL (no DB needed) |
| `pnpm db:migrate` | Apply `drizzle/*.sql` migrations in order |
| `pnpm build` / `pnpm start` | Production build / serve |

> ⚠️ **Do not use `db:push` or `db:studio`** — they run introspection queries SingleStore doesn't support and abort.

---

## 🧱 Project structure

```
src/
├── app/                 # App Router: /, /login, /register, /dashboard, /settings
│   └── api/             # /api/auth/* (better-auth), /api/trpc/*
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── settings/        # settings page sections (profile, appearance, security)
│   └── dashboard/       # admin user-management UI
├── lib/                 # shared helpers (validation, formatting)
├── server/
│   ├── api/             # tRPC context, procedures, routers (user, post)
│   ├── better-auth/     # auth config, server/client helpers
│   └── db/              # Drizzle schema + mysql2 pool
├── trpc/                # client-side tRPC wiring
└── env.js               # validated environment schema
```

---

## 👤 Accounts & roles

- Roles: **`admin`** and **`user`** (column on the `user` table).
- **First registered user → admin** (via a better-auth `databaseHooks` create hook); everyone else → `user`.
- `/dashboard` is admin-only (server-side guard — logged-out or non-admin users are redirected).
- `/settings` is available to any signed-in user.
- All admin user-management endpoints run behind an `adminProcedure` in tRPC; guard rails are enforced server-side, not just in the UI.

---

## 🗺️ TODO / Roadmap

### Before going to production (legal & compliance)

> This boilerplate contains **no legal pages yet** — a public app needs these. Each item is a small feature on its own:

- [ ] **Privacy Policy** page (`/privacy`) — what data is collected (email, name, IP, session metadata, OAuth profile), why, retention period, and user rights
- [ ] **Terms of Service** page (`/terms`) — acceptable use, account termination, disclaimers, liability limits
- [ ] **Cookie consent banner** — required for EU/UK visitors (ePrivacy + GDPR) if you set cookies beyond strictly-necessary ones (e.g. analytics)
- [ ] **GDPR/CCPA compliance** — "delete my account & data" flow (user self-service), data export, and a documented Data Processing Agreement story for any sub-processors (SingleStore region, GitHub OAuth)
- [ ] **Age gate / minimum age notice** — 13+ (COPPA) or 16+ (GDPR) depending on your audience
- [ ] **Contact for privacy/legal** — email address or form for privacy requests
- [ ] **`security.txt`** + responsible-disclosure note for security researchers
- [ ] **Copyright / license notice** on your content and a LICENSE file for the code you ship

### Product hardening (recommended next)

- [ ] **Email verification** (better-auth has the endpoints ready)
- [ ] **Forgot / reset password** flow
- [ ] **Rate limiting** on auth endpoints (`/api/auth/*`, login, verifyPassword)
- [ ] **Two-factor authentication (TOTP)**
- [ ] **Profile pictures** (upload + storage)
- [ ] **Audit log** of admin actions (who changed what)
- [ ] **Delete-account self-service** in Settings (feeds the GDPR todo above)
- [ ] **Tests** (no test framework installed yet — vitest + React Testing Library is a good fit)

### Nice-to-haves

- [ ] Stripe / billing integration (see `docs/`)
- [ ] Email service (transactional + password reset emails)
- [ ] Dockerfile + deployment guides
- [ ] i18n

---

## 🚢 Deployment

- Build with `pnpm build`, run with `pnpm start`.
- Set all `SINGLESTORE_*` and `BETTER_AUTH_*` vars in your hosting environment (`SKIP_ENV_VALIDATION=1` bypasses validation during Docker builds).
- Point `BETTER_AUTH_URL` at your production URL and update the GitHub OAuth redirect URI.
- SingleStore-specific notes live in [`docs/singlestore.md`](docs/singlestore.md).

---

## 📚 Tech stack

[Next.js 15](https://nextjs.org) · [tRPC](https://trpc.io) · [Drizzle ORM](https://orm.drizzle.team) · [better-auth](https://www.better-auth.com) · [SingleStore](https://www.singlestore.com) · [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Zod](https://zod.dev) · [next-themes](https://github.com/pacocoursey/next-themes)

# Webapp Starter

A production-ready **SaaS boilerplate** with accounts, roles, and an admin dashboard out of the box - so you can skip the plumbing and build your actual product.

Built with the [T3 Stack](https://create.t3.gg/): **Next.js 15** (App Router) · **tRPC** · **Drizzle ORM** · **Tailwind CSS v4** + **shadcn/ui**, with **better-auth** for authentication and **SingleStore** (MySQL-compatible) as the database.

---

## ✨ What's included

**Accounts (basics)**
- Email + password sign-up / sign-in, plus **GitHub OAuth**
- **First user is automatically an admin** - every later signup gets the `user` role
- Password policy: **12+ chars, at least one uppercase, one number, one symbol**, enforced server-side by better-auth
- **ANSSI-style password strength meter** (pattern detection for `1234`/`qwerty`/`abcde`, repeated chars)
- **Session management**: list active devices, sign out individual sessions or all other sessions
- Blur-time current-password verification (server-side check) + change password
- **Forgot / reset password** - one-time reset links (1h expiry), all sessions revoked on reset, 60s resend cooldown; in dev the link prints to the server console
- Inline form errors under fields (no toast spam), `aria-invalid` for accessibility

**Admin dashboard (`/dashboard`, admin-only)**
- User management CRUD: create, edit, delete, search, paginated table
- Guard rails: **cannot delete or demote the last admin**, cannot self-delete/self-demote, deleting a user cascades their sessions & accounts
- Duplicate emails rejected with inline field errors

**Settings (`/settings`, all signed-in users)**
- GitHub-style sidebar: **Profile** (name, role, member-since) · **Appearance** (light / dark / system) · **Security** (password + sessions)
- **Danger zone** - self-service account deletion with a type-your-email confirmation dialog; last-admin guard, cascades sessions/accounts/posts

**Foundations**
- Type-safe end-to-end with **tRPC + Zod + superjson**; server env validation with `@t3-oss/env-nextjs`
- shadcn/ui components (base-ui), light/dark/system theming, responsive layout
- **Cookie consent banner** with a preferences dialog (GDPR/ePrivacy-ready, choice stored in a `cookie-consent` cookie)
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

> First registered user becomes **admin** automatically - use the dashboard to manage everyone after that.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `SINGLESTORE_HOST` | ✅ | e.g. `svc-xxxx.svc.singlestore.com` (Helios) or `localhost` |
| `SINGLESTORE_PORT` | - | default `3306` |
| `SINGLESTORE_USER` | ✅ | |
| `SINGLESTORE_PASSWORD` | - | optional for passwordless local instances |
| `SINGLESTORE_DATABASE` | ✅ | |
| `SINGLESTORE_SSL` | - | `"true"` (default, Helios) or `"false"` for local |
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

> ⚠️ **Do not use `db:push` or `db:studio`** - they run introspection queries SingleStore doesn't support and abort.

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

## ⚙️ App settings

Everything brand-related lives in **one file: `src/lib/app.ts`**. Edit it and the whole app updates - header, footer, auth screens, landing page, favicons, metadata/SEO titles, contact links, and the legal pages. No need to touch individual pages.

| Setting | What it controls |
|---|---|
| `name` / `shortName` / `tagline` / `description` | Header, footer, auth screens, landing page, and the browser-tab title (`<Page> - <name>` via the metadata template) |
| `url` | Canonical URL used for SEO metadata (`metadataBase`) |
| `logo.image` | Path to a logo in `/public` (`/logo.png`) that replaces the built-in mark everywhere; `null` keeps the default |
| `logo.iconLight` / `iconDark` / `iconSvg` / `appleIcon` | Favicons |
| `contactEmail` / `supportEmail` | Contact links, including on the legal pages |
| `company.legalEntity` / `address` / `jurisdiction` + `legalLastUpdated` | Rendered on `/legal/*` |
| `stack` / `footerNav` | Landing + auth-screen badges and the footer link columns |

## 👤 Accounts & roles

- Roles: **`admin`** and **`user`** (column on the `user` table).
- **First registered user → admin** (via a better-auth `databaseHooks` create hook); everyone else → `user`.
- `/dashboard` is admin-only (server-side guard - logged-out or non-admin users are redirected).
- `/settings` is available to any signed-in user.
- All admin user-management endpoints run behind an `adminProcedure` in tRPC; guard rails are enforced server-side, not just in the UI.

---

## 🗺️ TODO / Roadmap

### Before going to production (legal & compliance)

> This boilerplate contains **no legal pages yet** - a public app needs these. Each item is a small feature on its own:

- [x] **Privacy Policy** page (`/legal/privacy`) - what data is collected (email, name, IP, session metadata, OAuth profile), why, retention period, and user rights; generic template - fill in `src/lib/legal.ts`
- [x] **Terms of Service** page (`/legal/terms`) - acceptable use, account termination, disclaimers, liability limits; generic template - fill in `src/lib/legal.ts`
- [x] **Cookie consent banner** - bottom banner with Accept all / Essential only / Preferences (per-category dialog); choice stored in a `cookie-consent` cookie; the better-auth session cookie plus framework/technical cookies are strictly necessary (exempt from consent) and the banner re-opens from the footer
- [ ] **GDPR/CCPA compliance** - see the dedicated section below
- [ ] **Age gate / minimum age notice** - 13+ (COPPA) or 16+ (GDPR) depending on your audience

#### GDPR / CCPA / CPRA compliance

> EU/UK GDPR and California CCPA/CPRA share the same core: **tell users what you collect, why, and who you share it with; let them access, fix, export, and delete their data; keep it secure.** This section is grounded in what the boilerplate actually stores and does today - tick the ⬜ items as you ship them.

**What the app stores (data inventory)**

- **Profile** - name, email, avatar image (`user` table)
- **Auth** - hashed password + OAuth tokens/IDs (`account` table; GitHub OAuth passes name, email, avatar)
- **Sessions** - IP address, user-agent, expiry (`session` table); powers the devices list and revoke
- **Content** - user-generated rows such as `post` (`createdById`)
- **Where it lives** - SingleStore (cloud; check your Helios region) + GitHub for OAuth

**Already handled in the code** ✅

- **Erasure (right to be forgotten)** - self-service account deletion in Settings → Profile → Danger zone, cascading posts, sessions, and accounts
- **Security (GDPR Art. 32)** - passwords hashed by better-auth, TLS required by SingleStore Helios, admin-only user management with guard rails, per-device and bulk session revocation
- **Rectification** - name is editable in Settings → Profile (email change is a listed TODO)
- **Portability** - JSON export of profile, sessions, connected accounts, and content in Settings → Profile → Account data (credentials redacted)

**Still to do** ⬜

- [x] **Data export (portability)** - Settings → Profile → Account data → “Export JSON” (a `user.exportData` tRPC query; credentials such as tokens/passwords are redacted)
- [ ] **Records of processing** - document every data category, its purpose, legal basis, and retention period (e.g. in `docs/privacy.md`)
- [x] **Privacy Policy page** (`/legal/privacy`) - the public-facing version of the above (see the legal list)
- [x] **Cookie consent** - banner + preferences dialog shipped (footer “Cookie settings” re-opens it); future analytics/marketing code must gate on the consent cookie (`readConsent()` from `src/lib/consent.ts`)
- [ ] **Retention & purge** - a scheduled job to delete expired sessions and (optionally) dormant accounts per your retention policy
- [ ] **DPA / sub-processors** - confirm SingleStore's DPA and data region, disclose GitHub OAuth's data handling, and sign DPAs with anyone processing data on your behalf
- [ ] **Breach response** - document the 72-hour notification process (EU authorities) and the person to contact
- [ ] **Rights handling** - define how you answer access / rectification / erasure requests within the legal deadline (30 days)
- [ ] **CCPA/CPRA extras** - the app does not sell personal information, so you mainly need right-to-know/delete flows plus a “Do Not Sell or Share My Personal Information” link *if* you ever add ads/analytics; never discriminate against users who exercise their rights
- [ ] **Age gate** - 13+ (COPPA) / 16+ (GDPR) before signup (see the legal list)
- [ ] **Data minimization review** - keep IP/user-agent only as long as sessions need them; never log emails or user IDs in app logs
- [ ] **Contact for privacy/legal** - email address or form for privacy requests
- [ ] **`security.txt`** + responsible-disclosure note for security researchers
- [ ] **Copyright / license notice** on your content and a LICENSE file for the code you ship

### Product hardening (recommended next)

- [x] **Email verification** - sent automatically on email signup, resend from Settings → Security (60s cooldown); in dev the link prints to the server console (no provider bundled) - swap `sendVerificationEmail` in `src/server/better-auth/config.ts` for Resend/SES/Postmark to deliver real emails
- [x] **Forgot / reset password** - `/forgot-password` requests a one-time link (1h expiry) via `sendResetPassword` (logged to console in dev, swap for Resend/SES/Postmark); `/reset-password` consumes it and sets a new password with `revokeSessionsOnPasswordReset` (all sessions signed out) and a 60s per-email cooldown on the request endpoint
- [ ] **Rate limiting** on auth endpoints (`/api/auth/*`, login, verifyPassword)
- [ ] **Two-factor authentication (TOTP)**
- [ ] **Profile pictures** (upload + storage)
- [ ] **Audit log** of admin actions (who changed what)
- [x] **Delete-account self-service** in Settings → Profile → Danger zone
- [ ] **Password re-confirmation** for account deletion (stronger than typing your email, e.g. for stolen-session protection)
- [ ] **Tests** (no test framework installed yet - vitest + React Testing Library is a good fit)

### Nice-to-haves

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

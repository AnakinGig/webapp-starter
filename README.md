# Webapp Starter

A production-ready **SaaS boilerplate** with accounts, roles, and an admin dashboard out of the box - so you can skip the plumbing and build your actual product.

Built with **Next.js 15** (App Router) · **Convex** (reactive backend + database) · **Tailwind CSS v4** + **shadcn/ui**, with **better-auth** for authentication (running on Convex) and **Resend** for transactional email.

---

## ✨ What's included

**Accounts (basics)**
- Email + password sign-up / sign-in, plus **OAuth (env-driven)** - any of the 16 built-in providers (GitHub, Google, Discord, GitLab, Microsoft, Apple, Facebook, X/Twitter, LinkedIn, Twitch, Spotify, Slack, Figma, Notion, Linear, Kakao) is enabled by setting `BETTER_AUTH_<PROVIDER>_CLIENT_ID` / `..._CLIENT_SECRET` on the Convex deployment; no code changes needed
- **Account linking** - Settings → Account lets signed-in users connect / disconnect OAuth providers (provider email must match the account email; the last sign-in method can't be unlinked; implicit linking on sign-in only for configured providers and verified emails)
- **First user is automatically an admin** - every later signup gets the `user` role
- Password policy: **12+ chars, at least one uppercase, one number, one symbol**, enforced server-side by better-auth
- **ANSSI-style password strength meter** (pattern detection for `1234`/`qwerty`/`abcde`, repeated chars)
- **Session management**: list active devices, sign out individual sessions or all other sessions
- Blur-time current-password verification (server-side check) + change password
- **Forgot / reset password** - one-time reset links (1h expiry), all sessions revoked on reset, 60s rate limit; in dev the link prints to the server console
- **Email change with verification** - the current email must be verified first (blocked otherwise, with an inline "send verification email" action); then a single verification link goes to the new address and the email only changes once it is verified (60s rate limit)
- **Server-side rate limiting** on auth endpoints (sign-in, sign-up, reset, verification emails)
- Inline form errors under fields (no toast spam), `aria-invalid` for accessibility

**Admin dashboard (`/dashboard`, admin-only)**
- User management CRUD: create, edit, delete, search, paginated table
- Guard rails: **cannot delete or demote the last admin**, cannot self-delete/self-demote, deleting a user cascades their sessions & accounts
- Duplicate emails rejected with inline field errors

**Settings (`/settings`, all signed-in users)**
- GitHub-style sidebar: **Profile** (photo upload with crop/zoom editor + drag & drop, name, role, member-since) · **Account** (connected OAuth providers - link/disconnect with confirm dialog) · **Appearance** (light / dark / system) · **Security** (password + sessions)
- **Danger zone** - self-service account deletion with a type-your-email confirmation dialog; last-admin guard, cascades sessions/accounts

**Foundations**
- **Convex** functions for all data access - reactive `useQuery`/`useMutation` hooks (no REST/tRPC boilerplate, optimistic updates and realtime for free)
- Server env validation with `@t3-oss/env-nextjs`; auth secrets live on the Convex deployment
- shadcn/ui components (base-ui), light/dark/system theming, responsive layout
- **Command palette** - press `Ctrl+K` (or `Cmd+K` on macOS) anywhere, or click the "Search" button in the header, to jump to any page or run an action (theme, sign out); type the first letters to select (type-ahead picks the best match: label prefix > label contains > keyword - "s" highlights Settings, "u" Use system theme, "si" Sign in), arrow keys + Enter to confirm, `esc` to close
- **Cookie consent banner** with a preferences dialog (GDPR/ePrivacy-ready, choice stored in a `cookie-consent` cookie)
- CI workflow (`.github/workflows/ci.yaml`) running lint + typecheck on every push

---

## 🚀 Quick start

Prerequisites: **Node.js 20+**, **pnpm**, and a **Convex** account (free tier - no credit card).

```bash
# 1. Install dependencies
pnpm install

# 2. Link your Convex deployment (interactive - logs you in and creates
#    a dev deployment; also writes .env.local and generates convex/_generated)
npx convex dev

# 3. Set auth/email secrets on the deployment (see .env.example)
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set SITE_URL "http://localhost:3000"
# OAuth: any supported provider can be enabled with its client id + secret
# (GitHub here; see the env table for the full list)
npx convex env set BETTER_AUTH_GITHUB_CLIENT_ID "dummy-or-real-id"
npx convex env set BETTER_AUTH_GITHUB_CLIENT_SECRET "dummy-or-real-secret"

# 4. Run the dev server (keep `npx convex dev` running in another terminal)
pnpm dev        # http://localhost:3000
```

> First registered user becomes **admin** automatically - use the dashboard to manage everyone after that.

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` (auto) | Written by `npx convex dev` |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `.env.local` (auto) | Written by `npx convex dev` |
| `NEXT_PUBLIC_APP_URL` | `.env.local` | Canonical app URL for SEO/metadata (defaults to `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | **Convex** | `npx convex env set` |
| `SITE_URL` | **Convex** | Auth base URL, e.g. `http://localhost:3000` |
| `BETTER_AUTH_<PROVIDER>_CLIENT_ID` / `..._SECRET` | **Convex** | OAuth for `<PROVIDER>` (uppercase): `GOOGLE`, `GITHUB`, `DISCORD`, `GITLAB`, `MICROSOFT`, `APPLE`, `FACEBOOK`, `TWITTER`, `LINKEDIN`, `TWITCH`, `SPOTIFY`, `SLACK`, `FIGMA`, `NOTION`, `LINEAR`, `KAKAO`. Set a pair to enable that provider everywhere (login buttons, Settings → Account); unset it to remove. Dummy values pass in dev. Provider OAuth apps must allow `SITE_URL`-based callback URLs |
| `RESEND_API_KEY` | **Convex** | Optional; unset/empty = verification & reset links are logged to the function logs (see 📧 Email) |
| `RESEND_EMAIL_FROM` | **Convex** | Optional; defaults to Resend's shared test domain `onboarding@resend.dev` |
| `ENVIRONMENT` | **Convex** | `"production"` on the production deployment only; anything else (or unset) = dev. Controls whether a missing `RESEND_API_KEY` logs the link (dev) or a safe error (prod). NOT `NODE_ENV` - Convex sets that to `"production"` everywhere |

Next.js env vars go in `src/env.js` + `.env.example`; Convex env vars are set with `npx convex env set` (dashboard for production).

---

## 📧 Email (verification & password reset)

Verification and password-reset emails are sent via **Resend** (`convex/email.ts`). Without an API key, both hooks fall back to **printing the link to the function logs** - local flows work with zero setup, but no email is actually sent.

**Dev vs prod is decided by the `ENVIRONMENT` variable, not `NODE_ENV`** - Convex runs every deployment (even dev ones) with `NODE_ENV=production`, so that check would always take the "production" path. With `ENVIRONMENT` unset (the default) a missing `RESEND_API_KEY` prints the action link to the logs; set `ENVIRONMENT=production` on the production deployment so a missing key logs a clear error instead of leaking the token-bearing link.

**To enable real emails:**

1. Create a free account at [resend.com](https://resend.com) (3,000 emails/month free).
2. Generate an API key and set it on the Convex deployment:
   ```bash
   npx convex env set RESEND_API_KEY "re_xxxxxxxx"
   ```
3. For **local testing** you're done - emails are sent from Resend's shared test domain `onboarding@resend.dev` and only deliver to the address you verified on your Resend account.
4. For **production**, add your own domain in Resend (DNS verification: SPF/DKIM) and set:
   ```bash
   npx convex env set RESEND_EMAIL_FROM "Basis <no-reply@yourdomain.com>"
   npx convex env set ENVIRONMENT "production"
   ```

Both better-auth hooks (`sendVerificationEmail`, `sendResetPassword`) already call the helper - no code changes needed, just the env vars. The email-change flow adds a third hook (`sendChangeEmailConfirmation`) for the confirmation link sent to the current address. Swap Resend for another provider by editing `convex/email.ts` only.

---

## 📜 Available scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Next.js dev server (`next dev --turbo`) - keep `npx convex dev` running alongside |
| `pnpm check` | Lint + typecheck (run before finishing changes) |
| `pnpm typecheck` / `pnpm lint` | Individually |
| `pnpm codegen` | Regenerate `convex/_generated` types (run automatically by `npx convex dev` and `postinstall`) |
| `pnpm format:write` / `pnpm format:check` | Prettier |
| `pnpm build` / `pnpm start` | Production build / serve |

---

## 🧱 Project structure

```
convex/                 # Backend: Convex functions + better-auth component
├── auth.ts             # authComponent + auth options: role field, first-user-admin trigger, rate limiting, account linking, OAuth (env-driven)
├── avatars.ts          # Profile photo upload (storage URL, server-side validation, old-file cleanup)
├── oauth.ts            # OAuth provider catalogue + env-driven socialProviders builder
├── providers.ts        # public query: which providers are configured (drives login buttons + Settings → Account)
├── schema.ts           # App tables (empty - add your domain tables here)
├── users.ts            # Admin user CRUD, guard rails, stats, GDPR export, delete-account
├── email.ts            # Resend helper (verification + reset emails)
├── http.ts             # Mounts /api/auth/* on the deployment
├── auth.config.ts      # Registers better-auth as the auth provider
└── betterAuth/         # The better-auth component (auth tables + instance)
    ├── auth.ts         # Codegen shim for `npx auth generate`
    ├── schema.ts       # Auth tables (user/session/account/verification/...)
    └── adapter.ts      # Exposes the component's adapter (create/find/update/delete)
src/
├── app/                # App Router: /, /login, /register, /dashboard, /settings
│   └── api/auth/       # /api/auth/* proxy → Convex
├── components/
│   ├── ui/             # shadcn/ui primitives
│   ├── settings/       # settings page sections (profile, account, appearance, security)
│   ├── dashboard/      # admin user-management UI
│   ├── command-palette.tsx # global Ctrl+K command palette (Dialog + plain input, self-managed type-ahead)
│   ├── site-header.tsx # header with nav, theme toggle, command-palette trigger
│   └── nav-user.tsx    # signed-in user menu
├── lib/
│   ├── app.ts          # App settings (brand, contact, legal) - edit this one file
│   ├── auth-client.ts  # better-auth client (Convex plugin)
│   ├── auth-server.ts  # Next.js server helpers (session, auth proxy)
│   └── validation.ts   # email/password rules + ANSSI strength meter
└── env.js              # validated Next.js env schema
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

- Roles: **`admin`** and **`user`** (`user.role` field in the auth component).
- **First registered user → admin** (via a component trigger on user creation); everyone else → `user`.
- `/dashboard` is admin-only (server-side guard - logged-out or non-admin users are redirected).
- `/settings` is available to any signed-in user.
- All admin user-management functions run behind an **admin check in Convex** (`convex/users.ts`); guard rails are enforced server-side, not just in the UI.

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
- **Content** - any user-generated rows you add in `convex/schema.ts`
- **Where it lives** - Convex (cloud; check your project's region) + GitHub for OAuth

**Already handled in the code** ✅

- **Erasure (right to be forgotten)** - self-service account deletion in Settings → Profile → Danger zone, cascading sessions and accounts
- **Security (GDPR Art. 32)** - passwords hashed by better-auth, TLS in transit, admin-only user management with guard rails, per-device and bulk session revocation, rate-limited auth endpoints
- **Rectification** - name is editable in Settings → Profile; email changes require the current email to be verified first, then a single verification link goes to the new address - the email only updates once the new address is verified
- **Portability** - JSON export of profile, sessions, and connected accounts in Settings → Profile → Account data (credentials redacted)

**Still to do** ⬜

- [x] **Data export (portability)** - Settings → Profile → Account data → “Export JSON” (a `users.exportData` Convex query; credentials such as tokens/passwords are redacted)
- [ ] **Records of processing** - document every data category, its purpose, legal basis, and retention period (e.g. in `docs/privacy.md`)
- [x] **Privacy Policy page** (`/legal/privacy`) - the public-facing version of the above (see the legal list)
- [x] **Cookie consent** - banner + preferences dialog shipped (footer “Cookie settings” re-opens it); future analytics/marketing code must gate on the consent cookie (`readConsent()` from `src/lib/consent.ts`)
- [ ] **Retention & purge** - a scheduled job (Convex cron) to delete expired sessions and (optionally) dormant accounts per your retention policy
- [ ] **DPA / sub-processors** - confirm Convex's DPA and data region, disclose GitHub OAuth's data handling, and sign DPAs with anyone processing data on your behalf
- [ ] **Breach response** - document the 72-hour notification process (EU authorities) and the person to contact
- [ ] **Rights handling** - define how you answer access / rectification / erasure requests within the legal deadline (30 days)
- [ ] **CCPA/CPRA extras** - the app does not sell personal information, so you mainly need right-to-know/delete flows plus a “Do Not Sell or Share My Personal Information” link *if* you ever add ads/analytics; never discriminate against users who exercise their rights
- [ ] **Age gate** - 13+ (COPPA) / 16+ (GDPR) before signup (see the legal list)
- [ ] **Data minimization review** - keep IP/user-agent only as long as sessions need them; never log emails or user IDs in app logs
- [ ] **Contact for privacy/legal** - email address or form for privacy requests
- [ ] **`security.txt`** + responsible-disclosure note for security researchers
- [ ] **Copyright / license notice** on your content and a LICENSE file for the code you ship

### Product hardening (recommended next)

- [x] **Email verification** - sent automatically on email signup, resend from Settings → Security (60s rate limit); sent via Resend (`convex/email.ts`), with a console-log fallback in dev when `RESEND_API_KEY` is unset - see the 📧 Email section above
- [x] **Email change with verification** - Settings → Profile: the current email must be verified before it can be changed (blocked with an inline resend-verification action otherwise); then a single verification link goes to the new address and the email only changes after it is verified (60s rate limit)
- [x] **Forgot / reset password** - `/forgot-password` requests a one-time link (1h expiry) via `sendResetPassword` (Resend; console-log fallback in dev); `/reset-password` consumes it and sets a new password with `revokeSessionsOnPasswordReset` (all sessions signed out)
- [x] **Rate limiting** on auth endpoints (sign-in, sign-up, password reset, verification email) - better-auth's built-in limiter backed by the Convex rateLimit table
- [ ] **Two-factor authentication (TOTP)**
- [x] **Profile pictures** - Settings → Profile photo upload via Convex file storage: PNG/JPG/WEBP/GIF only (no SVG - XSS), 5 MB max, server-side content-type + size validation against the `_storage` system table, replaced/removed files deleted from storage (OAuth avatars left untouched). Pick or drag & drop a photo, then crop it in an editor (drag to pan, scroll/slider to zoom, live preview) - the visible frame is exported as a 512×512 PNG
- [ ] **Audit log** of admin actions (who changed what)
- [x] **Delete-account self-service** in Settings → Profile → Danger zone
- [ ] **Password re-confirmation** for account deletion (stronger than typing your email, e.g. for stolen-session protection)
- [ ] **Tests** (no test framework installed yet - vitest + React Testing Library is a good fit)

### Nice-to-haves

- [x] Email service (transactional) - Resend wired into verification + reset hooks; still TODO: a React/JSX email template set (e.g. `react-email`) and lifecycle emails
- [ ] Avatar storage hygiene - the upload URL is open to any signed-in user; a cron that purges orphaned `_storage` files older than N days would cap storage abuse
- [ ] Dockerfile + deployment guides
- [ ] i18n

---

## 🚢 Deployment

1. **Deploy the backend**: `npx convex deploy` (deploys functions + schema to your production deployment).
2. **Build & serve the frontend**: `pnpm build` then `pnpm start` (or deploy to Vercel/any Node host).
3. Set `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` (production deployment URLs) in the hosting environment, and all auth/email secrets on the **production Convex deployment** via the dashboard or `npx convex env set` (including `ENVIRONMENT=production` - see 📧 Email).
4. Point `SITE_URL` at your production URL and update the GitHub OAuth redirect URI.

---

## 📚 Tech stack

[Next.js 15](https://nextjs.org) · [Convex](https://www.convex.dev) · [better-auth](https://www.better-auth.com) · [Resend](https://resend.com) · [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Zod](https://zod.dev) · [next-themes](https://github.com/pacocoursey/next-themes)

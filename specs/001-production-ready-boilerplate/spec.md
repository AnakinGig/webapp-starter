# Feature Specification: Production-Ready Boilerplate

**Feature Branch**: `001-production-ready-boilerplate`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "I want to simple boilerplate with lots of features like command palette, multi languages, gdpr compliance etc.. all to be production ready."

## Clarifications

### Session 2026-08-19

- Q: Which languages should the boilerplate ship with in v1, and how should the default be chosen for visitors with no saved preference? A: English + French ship in v1; visitors without a saved preference get browser-locale detection with an English fallback.
- Q: How complete should the GDPR compliance suite be in v1 - mechanisms only, or also operational compliance documents? A: Mechanisms + generic compliance document templates (records of processing, breach response, DPA checklist).
- Q: Should the production-ready boilerplate include container/deployment artifacts or documentation only? A: Dockerfile + deployment guides (Docker, Netlify, Vercel).
- Q: How granular should the cookie consent preferences be? A: Two choices only - accept all or essential only, no per-category dialog.
- Q: How should the minimum-age requirement be handled at signup? A: A simple "I am at least 13 years old" checkbox at signup (no date-of-birth collection).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accounts, Roles, and Admin Dashboard Out of the Box (Priority: P1)

A developer clones the boilerplate, follows the quick-start steps, and has a working app with email/password sign-up, sign-in, a role system (admin vs. user), and an admin dashboard for managing users - without writing any product code first. The first registered user becomes an admin automatically.

**Why this priority**: This is the core promise of the boilerplate. Without it, nothing else matters - every other feature builds on having accounts and roles working.

**Independent Test**: A fresh clone following the documented setup produces a runnable app; registering the first account grants admin access and the dashboard is reachable and functional.

**Acceptance Scenarios**:

1. **Given** a fresh clone with setup complete, **When** a visitor registers the first account, **Then** that account is assigned the admin role and can open the admin dashboard.
2. **Given** an existing admin, **When** a second visitor registers, **Then** the new account has the regular user role and cannot open the admin dashboard.
3. **Given** an admin is signed in, **When** they create, edit, or delete a user, **Then** the change is persisted and reflected in the user list.
4. **Given** only one admin exists, **When** an attempt is made to delete or demote that admin, **Then** the action is rejected with a clear explanation.

---

### User Story 2 - Keyboard Command Palette (Priority: P1)

A user can press a global keyboard shortcut (Ctrl+K / Cmd+K) from anywhere in the app and jump to any page or run common actions (toggle theme, sign out) by typing a few letters, with arrow-key navigation and Enter to confirm.

**Why this priority**: Fast navigation is a hallmark of a polished production app; it was explicitly named in the request.

**Independent Test**: On any page, pressing the shortcut opens the palette; typing letters narrows the list; pressing Enter navigates to the selected destination.

**Acceptance Scenarios**:

1. **Given** the user is on any page, **When** they press Ctrl+K (or Cmd+K on macOS), **Then** the command palette opens and the search field is focused.
2. **Given** the palette is open, **When** the user types a partial label ("s" for Settings), **Then** the best matching item is highlighted and Enter navigates to it.
3. **Given** the palette is open with results, **When** the user presses Escape or clicks outside, **Then** the palette closes without navigating.
4. **Given** the user is not signed in, **When** they open the palette, **Then** signed-in-only actions (e.g. sign out) are not shown.

---

### User Story 3 - Multi-Language Support (Priority: P2)

A visitor can read the entire app in their language. A language switcher is available to signed-in users, the choice persists across visits, and new languages can be added without code changes.

**Why this priority**: Internationalization is a named feature and a production expectation, but the app is fully usable in a single language before it ships, so it is below the core stories.

**Independent Test**: Switching the app language updates the visible interface text; the choice survives a reload; the default language remains English for everyone else.

**Acceptance Scenarios**:

1. **Given** the app supports at least two languages, **When** a signed-in user selects a language, **Then** all user-facing text switches immediately and the choice persists on their next visit.
2. **Given** the user has no saved language preference, **When** they visit the app, **Then** they see the default language (English).
3. **Given** a language is selected, **When** the user opens any page, form, or dialog, **Then** no untranslated placeholder text is shown - missing translations fall back to the default language.
4. **Given** a developer wants a new language, **When** they add it through the documented mechanism, **Then** no application code changes are required.

---

### User Story 4 - GDPR / CCPA Compliance Suite (Priority: P2)

The app provides everything a small SaaS needs to be privacy-compliant: a cookie consent banner with preferences, privacy policy and terms pages, self-service data export, self-service account deletion, documented data-handling practices, and generic compliance document templates (records of processing, breach-response plan, DPA/sub-processor checklist) the consumer fills in with their own details.

**Why this priority**: Compliance is a hard requirement for shipping to production in the EU/California; the mechanisms are already partially present and need to be completed and documented.

**Independent Test**: A visitor sees the consent banner once; a signed-in user can export their data as a file and delete their account; the legal pages are reachable from the footer.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** they load the site, **Then** a cookie consent banner appears with exactly two choices (accept all / essential only), and their choice is stored and honored (non-essential cookies only load after consent).
2. **Given** a signed-in user, **When** they request a data export, **Then** they receive a readable file containing their profile, sessions, and connected accounts with credentials redacted.
3. **Given** a signed-in user, **When** they delete their account, **Then** the account, sessions, and accounts are removed and they are signed out.
4. **Given** any visitor, **When** they open the footer, **Then** privacy policy, terms of service, and cookie settings are reachable.
5. **Given** a user has not consented to non-essential cookies, **When** they browse the site, **Then** only essential functionality works and no tracking runs.

---

### User Story 5 - Production Hardening (Priority: P3)

The boilerplate ships with the operational details a real product needs: security notifications (password change, 2FA changes, account deletion), an audit trail of admin actions, a retention/purge policy for stale sessions, automated tests for critical flows, and deployment documentation.

**Why this priority**: These are important for a long-lived production app but do not block the core experience.

**Independent Test**: Each hardening item is individually verifiable (e.g. changing a password triggers a notification email; stale sessions are purged on schedule).

**Acceptance Scenarios**:

1. **Given** a user changes their password, enables 2FA, or deletes their account, **When** the action completes, **Then** a security notification email is sent to the account email.
2. **Given** an admin performs an action in the dashboard, **When** the action completes, **Then** it is recorded in an audit log with who, what, and when.
3. **Given** expired sessions exist, **When** the retention job runs, **Then** they are removed without logging out active sessions.
4. **Given** a developer runs the automated checks, **When** a critical flow (sign-up, sign-in, admin guard) regresses, **Then** the failure is caught by a test.
5. **Given** a developer wants to deploy the app, **When** they follow the Docker, Netlify, or Vercel guide, **Then** the app runs with the documented env vars and secrets.

---

### Edge Cases

- What happens when the user opens the command palette while a dialog is already open?
- How does the language switcher behave for signed-out visitors (no persistent preference)?
- What happens when a translation key is missing in the active language?
- How does account deletion behave for an OAuth-only account (no password to confirm with)?
- What happens when the last admin tries to self-demote or self-delete?
- How does the consent banner behave when a user reopens cookie settings later?
- What happens if the data export contains large or unexpected data?
- How does the app behave when the retention purge runs while a session is mid-flight?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The boilerplate MUST provide email/password sign-up and sign-in out of the box.
- **FR-002**: The first registered account MUST automatically receive the admin role; all subsequent accounts MUST receive the regular user role.
- **FR-003**: The admin dashboard MUST be accessible only to users with the admin role.
- **FR-004**: Administrators MUST be able to create, view, edit, search, and delete users.
- **FR-005**: The system MUST prevent deleting or demoting the last admin, and prevent self-delete/self-demotion.
- **FR-006**: The system MUST prevent duplicate account emails and reject them with a clear, field-level message.
- **FR-007**: A global keyboard shortcut MUST open a command palette from any page.
- **FR-008**: The command palette MUST support type-ahead search that matches label prefixes first, then contains, and MUST support multi-character refinement.
- **FR-009**: The command palette MUST be fully operable with the keyboard (arrow keys, Enter, Escape) and MUST hide signed-in-only actions for guests.
- **FR-010**: The app MUST support multiple languages with a runtime language switcher for signed-in users.
- **FR-011**: The chosen language MUST persist across visits; visitors without a saved preference MUST be served their browser locale when supported, falling back to English otherwise.
- **FR-012**: Missing translations MUST fall back to the default language instead of showing raw keys.
- **FR-013**: Adding a new language MUST NOT require application code changes.
- **FR-025**: The v1 release MUST ship English and French translations covering all user-facing strings.
- **FR-014**: A cookie consent banner MUST appear for first-time visitors and MUST store the user's choice.
- **FR-015**: Consent MUST offer exactly two choices - accept all or essential only - with no per-category dialog; non-essential cookies/storage MUST be gated on the choice.
- **FR-016**: Privacy policy and terms of service pages MUST be present and reachable from the footer, and MUST state the minimum age for the service.
- **FR-017**: Signed-in users MUST be able to export their personal data as a downloadable file with credentials redacted.
- **FR-018**: Signed-in users MUST be able to delete their account, which cascades to sessions and connected accounts.
- **FR-019**: Deleting an account MUST require confirmation (password for password accounts, an explicit confirm step otherwise).
- **FR-028**: Signup MUST include a minimum-age confirmation checkbox ("I am at least 13 years old") and MUST block registration until it is checked; no date-of-birth data is collected.
- **FR-020**: Security-relevant events (password change, 2FA enable/disable, account deletion) MUST trigger a notification email to the account owner.
- **FR-021**: Admin actions in the dashboard MUST be recorded in an audit log.
- **FR-022**: Expired sessions MUST be purged by a scheduled retention job without affecting active sessions.
- **FR-026**: The boilerplate MUST ship generic compliance document templates (records of processing, breach-response plan, DPA/sub-processor checklist) that the consumer fills in with their own details.
- **FR-023**: Critical user flows MUST be covered by automated tests that run in CI.
- **FR-024**: The README MUST document setup, deployment, env vars, the feature roadmap, and how to toggle features on/off.
- **FR-027**: The boilerplate MUST ship a Dockerfile and deployment guides covering Docker, Netlify, and Vercel.

### Key Entities

- **User**: Account with name, email, role (admin/user), email-verification state, avatar, notification preferences, and language preference.
- **Session**: A signed-in device with token, user agent, IP, creation and expiry times; subject to freshness and retention rules.
- **Connected Account**: An external OAuth identity linked to a User (provider, provider account id, tokens).
- **Consent Choice**: The visitor's cookie-consent preference (essential vs. optional categories) stored per browser.
- **Audit Log Entry**: A record of an admin action with actor, action, target, and timestamp.
- **Data Export**: A generated file containing a user's personal data with credentials redacted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from fresh clone to a running app with an admin dashboard in under 30 minutes, following only the README.
- **SC-002**: 100% of user-facing interface strings are translatable; the default language covers all pages with zero missing-translation placeholders.
- **SC-003**: Language switching reflects on all pages immediately (no full reload required) and persists across visits.
- **SC-004**: 100% of GDPR self-service flows (consent, export, delete) complete successfully in automated verification.
- **SC-005**: The command palette reaches any page in at most 3 keystrokes after opening, for signed-in and signed-out users.
- **SC-006**: Security notification emails fire for 100% of the listed security events.
- **SC-007**: Critical-flow tests run in CI and block merges on failure.
- **SC-008**: Retention purging removes stale sessions on schedule with zero active-session logouts.

## Assumptions

- The boilerplate stays generic and brand-agnostic (per the project constitution): all branding lives in one config file, and legal pages remain templates the consumer fills in.
- English and French ship in v1 (English is the fallback default); more languages can be added without code changes.
- "Multi-language" covers the app's own interface strings, not user-generated content.
- Cookie consent covers analytics/tracking cookies; the better-auth session cookie and technical cookies are exempt as strictly necessary.
- Email delivery requires a provider key; without one, dev environments log links instead of sending (production must have a provider configured).
- OAuth providers are enabled/disabled via environment variables (no code changes) - this mechanism already exists and must be preserved.
- Automated tests cover critical flows only (sign-up, sign-in, admin guards, GDPR self-service); full coverage is out of scope for the boilerplate.
- The audit log records admin actions only, not every read.
- Retention policy defaults: sessions are purged after expiry plus a grace period; dormant-account purge is documented but disabled by default (opt-in).

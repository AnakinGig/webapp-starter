import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import { convex } from "@convex-dev/better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import { APIError, betterAuth } from "better-auth";
import { getSessionFromCtx } from "better-auth/api";

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";
import { sendActionEmail } from "./email";
import { buildSocialProviders, enabledProviderIds } from "./oauth";

/**
 * Better Auth component. Lives at the app root (as in the official example)
 * so `authFunctions` can reference `internal.auth` without creating a
 * circular import with the component's own generated api.
 *
 * `local.schema` extends the component's auth tables with the app's custom
 * `user.role` field; `triggers` + `authFunctions` run the
 * first-user-becomes-admin bootstrap after a user is created.
 */
const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: { schema: authSchema },
    verbose: false,
    authFunctions,
    triggers: {
      user: {
        // First user in the workspace becomes the owner/admin. Runs in the
        // same transaction as the user create. `ctx` here is the app context,
        // so the component's user table is reached through its adapter.
        onCreate: async (ctx, doc) => {
          const raw: unknown = await ctx.runQuery(
            components.betterAuth.adapter.findMany,
            {
              model: "user",
              paginationOpts: { numItems: 1000, cursor: null },
            },
          );
          const count = ((raw as { page: unknown[] }).page ?? []).length;
          if (count <= 1) {
            await ctx.runMutation(components.betterAuth.adapter.updateOne, {
              input: {
                model: "user",
                where: [{ field: "_id", value: doc._id }],
                update: { role: "admin" },
              },
            });
          }
        },
      },
    },
  },
);

/**
 * Better Auth options. The instance runs on the Convex deployment, so
 * secrets come from Convex env vars (set with `npx convex env set ...`),
 * not from the Next.js .env.
 */
/**
 * Better-auth builds the reset link as /reset-password/:token?callbackURL=...
 * When the request omits `redirectTo`, the callbackURL is left EMPTY and
 * clicking the link bounces to an INVALID_TOKEN error page (the callback
 * route requires a non-empty callbackURL). Make the link always carry a valid
 * callbackURL so it works no matter how the reset was requested - the app
 * form passes redirectTo, but e.g. a direct API call or a dev-console test
 * does not.
 */
function ensureResetCallbackUrl(url: string, siteUrl: string): string {
  const parsed = new URL(url);
  if (!parsed.searchParams.get("callbackURL")) {
    parsed.searchParams.set("callbackURL", `${siteUrl}/reset-password`);
  }
  return parsed.toString();
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  return {
    appName: "Basis",
    baseURL: siteUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),

    user: {
      additionalFields: {
        // The custom `role` column - declared so better-auth persists it and
        // includes it in session/user output. `input: false` prevents clients
        // from setting it: the role is assigned server-side only
        // (first-user bootstrap trigger + admin user management).
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
      // Change email with verification. Only the NEW address gets a
      // verification link (sent via the existing `sendVerificationEmail`
      // hook); the email updates only when that link is clicked. The
      // `hooks.before` guard below blocks the endpoint unless the CURRENT
      // email is already verified, so an unverified address can't be swapped
      // for another one.
      changeEmail: {
        enabled: true,
      },
    },

    account: {
      // Account linking: a signed-in user can connect external OAuth
      // providers (Settings > Account) and sign in with them later. The
      // provider's email must match the account email (`allowDifferentEmails`
      // stays false) and the last sign-in method can never be unlinked
      // (`allowUnlinkingAll` stays false). Implicit linking on sign-in is only
      // allowed for the trusted providers below, and only when the local
      // account email is already verified (`requireLocalEmailVerified`).
      accountLinking: {
        enabled: true,
        // Only the providers configured via env vars may be implicitly linked
        // when a returning user signs in with a matching email.
        trustedProviders: enabledProviderIds(),
      },
    },

    // Global request hooks. Only used to guard /change-email: the current
    // email must be verified before it can be changed. Enforced server-side
    // here (the endpoint itself doesn't require it) and mirrored in the UI.
    // The before hook runs before the endpoint's session middleware, so the
    // session is resolved explicitly with getSessionFromCtx (reads the request
    // cookies and the session store). The typed middleware context is narrow;
    // the runtime context carries the endpoint `path` (dispatch.mjs sets it
    // before running hooks), so the path is read via a minimal cast.
    hooks: {
      before: async (ctx) => {
        const runtime = ctx as unknown as { path?: string };
        if (runtime.path === "/change-email") {
          const session = await getSessionFromCtx(
            ctx as unknown as Parameters<typeof getSessionFromCtx>[0],
          );
          if (!session) {
            throw APIError.fromStatus("UNAUTHORIZED", {
              message: "Sign in to change your email.",
            });
          }
          if (session.user.emailVerified !== true) {
            throw APIError.fromStatus("BAD_REQUEST", {
              message:
                "Verify your current email address before changing it. Check Settings -> Security to resend the verification email.",
            });
          }
        }
      },
    },

    emailAndPassword: {
      enabled: true,
      // Server-side floor for all password creation/changes. The full policy
      // (uppercase + number + symbol) is validated client-side, and this
      // version of better-auth only supports minPasswordLength here.
      minPasswordLength: 12,
      // Reset links are one-time and expire after 1 hour.
      resetPasswordTokenExpiresIn: 3600,
      // Security: resetting the password signs out every existing session,
      // including any a hijacker may hold.
      revokeSessionsOnPasswordReset: true,
      // Emails go through the same helper as verification (Resend; dev
      // console-log fallback).
      sendResetPassword: async ({ user, url }) => {
        await sendActionEmail({
          to: user.email,
          subject: "Reset your password",
          heading: "Reset your password",
          body: "We received a request to reset your password. Click the button below to choose a new one.",
          ctaLabel: "Reset password",
          ctaUrl: ensureResetCallbackUrl(url, siteUrl),
        });
      },
    },

    emailVerification: {
      // Send a verification email on every email signup. In dev (no
      // RESEND_API_KEY) the link is printed to the function logs instead.
      sendOnSignUp: true,
      // Sign-ins stay open for unverified accounts by default. To require
      // verification before signing in, uncomment the next line:
      // requireEmailVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendActionEmail({
          to: user.email,
          subject: "Confirm your email",
          heading: "Confirm your email",
          body: "You recently created an account. Confirm your email address to finish setting it up.",
          ctaLabel: "Verify email",
          ctaUrl: url,
        });
      },
    },

    socialProviders: buildSocialProviders(
      siteUrl,
    ) as BetterAuthOptions["socialProviders"],

    // Server-side rate limiting (stored in the component's rateLimit table).
    // Replaces the old in-memory cooldown maps with real enforcement.
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 1 },
        "/send-verification-email": { window: 60, max: 1 },
        "/change-email": { window: 60, max: 1 },
        "/link-social": { window: 60, max: 10 },
        "/unlink-account": { window: 60, max: 10 },
      },
    },

    plugins: [convex({ authConfig })],
  } satisfies BetterAuthOptions;
};

// For the `auth` CLI / codegen tooling.
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Creates the better-auth instance bound to a request's Convex context.
export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx));

// Registered trigger mutations. `authFunctions` above points at these via
// `internal.auth`, so the component can call them after auth writes.
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import { convex } from "@convex-dev/better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";
import { sendActionEmail } from "./email";

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

    socialProviders: {
      github: {
        clientId: process.env.BETTER_AUTH_GITHUB_CLIENT_ID!,
        clientSecret: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET!,
        redirectURI: `${siteUrl}/api/auth/callback/github`,
      },
    },

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

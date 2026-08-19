import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Type-only client plugin mirroring the server-side `user.additionalFields.role`
 * (see convex/betterAuth/auth.ts). It carries no runtime behavior - the role
 * value comes from the server session - but lets the client types know
 * `session.user.role` exists.
 */
const roleClientPlugin = () =>
  ({
    id: "custom-role",
    $InferServerPlugin: {
      schema: {
        user: {
          fields: {
            role: {
              type: "string",
              required: false,
              defaultValue: "user",
              input: false,
            },
            notifyVerificationEmails: {
              type: "boolean",
              required: false,
              defaultValue: true,
              input: true,
            },
            notifyResetEmails: {
              type: "boolean",
              required: false,
              defaultValue: true,
              input: true,
            },
            language: {
              type: "string",
              required: false,
              defaultValue: "en",
              input: true,
            },
          },
        },
      },
    },
  }) as const;

export const authClient = createAuthClient({
  // twoFactorClient mirrors the server-side `twoFactor` plugin: it exposes
  // `authClient.twoFactor.*` (enable / verifyTotp / disable /
  // generateBackupCodes / verifyBackupCode) and types `session.user.twoFactorEnabled`.
  plugins: [convexClient(), roleClientPlugin(), twoFactorClient()],
});

export type Session = typeof authClient.$Infer.Session;

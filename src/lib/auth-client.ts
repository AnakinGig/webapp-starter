import { convexClient } from "@convex-dev/better-auth/client/plugins";
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
          },
        },
      },
    },
  }) as const;

export const authClient = createAuthClient({
  plugins: [convexClient(), roleClientPlugin()],
});

export type Session = typeof authClient.$Infer.Session;

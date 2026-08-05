import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "~/env";
import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "mysql", // SingleStore speaks the MySQL wire protocol
  }),
  user: {
    additionalFields: {
      // Declare the custom `role` column so better-auth persists it (the core
      // adapter only writes fields it knows about) and includes it in session
      // and user output. `input: false` prevents clients from setting it — the
      // role is assigned server-side only (first-user bootstrap below).
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
    // (uppercase + number + symbol) is validated client-side, and this version
    // of better-auth only supports minPasswordLength here.
    minPasswordLength: 12,
  },
  socialProviders: {
    github: {
      clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
      redirectURI: "http://localhost:3000/api/auth/callback/github",
    },
  },
  databaseHooks: {
    user: {
      create: {
        // The first user ever registered becomes the admin (bootstrap owner).
        before: async (user) => {
          const count = await db.$count(userTable);
          if (count === 0) {
            return { data: { ...user, role: "admin" } };
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

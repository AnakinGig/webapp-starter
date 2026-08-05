import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production" ? z.string() : z.string().optional(),
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_GITHUB_CLIENT_ID: z.string(),
    BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string(),
    SINGLESTORE_HOST: z.string(),
    SINGLESTORE_PORT: z.coerce.number().int().positive().default(3306),
    SINGLESTORE_USER: z.string(),
    SINGLESTORE_PASSWORD: z.string().optional(),
    SINGLESTORE_DATABASE: z.string(),
    SINGLESTORE_SSL: z.enum(["true", "false"]).default("true"),
    // Optional: without RESEND_API_KEY, auth emails are logged to the dev
    // console instead of sent (see src/lib/email.ts).
    RESEND_API_KEY: z.string().optional(),
    // Sender address. Defaults to Resend's shared test domain
    // (onboarding@resend.dev) when unset.
    RESEND_EMAIL_FROM: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"]) 
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // Canonical app URL for SEO/metadata (fallback in src/lib/app.ts).
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_GITHUB_CLIENT_ID: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
    BETTER_AUTH_GITHUB_CLIENT_SECRET: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
    SINGLESTORE_HOST: process.env.SINGLESTORE_HOST,
    SINGLESTORE_PORT: process.env.SINGLESTORE_PORT,
    SINGLESTORE_USER: process.env.SINGLESTORE_USER,
    SINGLESTORE_PASSWORD: process.env.SINGLESTORE_PASSWORD,
    SINGLESTORE_DATABASE: process.env.SINGLESTORE_DATABASE,
    SINGLESTORE_SSL: process.env.SINGLESTORE_SSL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_EMAIL_FROM: process.env.RESEND_EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

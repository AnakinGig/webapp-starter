import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side env vars. Auth secrets (BETTER_AUTH_SECRET, GitHub OAuth,
   * SITE_URL, RESEND_API_KEY) now live on the Convex deployment - set them
   * with `npx convex env set ...`, not here.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Client-side env vars (NEXT_PUBLIC_). Written to .env.local by the
   * Convex CLI when you run `npx convex dev`.
   */
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_CONVEX_SITE_URL: z.string().url(),
    // Canonical app URL for SEO/metadata (fallback in src/lib/app.ts).
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   */
  emptyStringAsUndefined: true,
});

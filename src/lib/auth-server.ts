import "server-only";

import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

/**
 * Next.js helpers for the Convex-hosted better-auth instance:
 * - `handler` proxies /api/auth/* requests to the Convex deployment.
 * - `getToken` / `isAuthenticated` read the session JWT cookie.
 * - `fetchAuthQuery` / `preloadAuthQuery` run authenticated Convex queries
 *   from server components.
 */
export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});

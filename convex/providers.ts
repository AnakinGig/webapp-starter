import { query } from "./_generated/server";

import { enabledProviderIds } from "./oauth";

/**
 * Public query: which OAuth providers are configured right now (driven by
 * Convex env vars). The client uses this to render exactly the login buttons
 * and Settings > Account rows the server will accept. No auth required - this
 * is the same information the login page already exposes visually.
 */
export const getConfiguredProviders = query({
  handler: async () => enabledProviderIds(),
});

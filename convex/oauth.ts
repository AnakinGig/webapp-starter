// OAuth provider registry.
//
// The set of social sign-in providers is driven entirely by Convex env vars:
// set `BETTER_AUTH_<PROVIDER>_CLIENT_ID` and `BETTER_AUTH_<PROVIDER>_CLIENT_SECRET`
// on the deployment (`npx convex env set ...`) and the provider appears
// everywhere - the login/register buttons, the Settings > Account section, and
// the better-auth server config. Unset a pair and it disappears. No code
// changes needed to add or remove providers.
//
// `OAUTH_PROVIDERS` below is the catalogue of every provider this starter
// knows about. Only providers in this catalogue can be enabled from env vars;
// anything else (e.g. a custom OIDC provider) still needs a manual entry in
// `convex/auth.ts`.

/** Provider id -> { label, scopes } used by both server config and UI. */
export const OAUTH_PROVIDERS: Record<string, { label: string; icon: string }> =
  {
    apple: { label: "Apple", icon: "apple" },
    discord: { label: "Discord", icon: "discord" },
    facebook: { label: "Facebook", icon: "facebook" },
    figma: { label: "Figma", icon: "figma" },
    github: { label: "GitHub", icon: "github" },
    gitlab: { label: "GitLab", icon: "gitlab" },
    google: { label: "Google", icon: "google" },
    kakao: { label: "Kakao", icon: "kakao" },
    linear: { label: "Linear", icon: "linear" },
    linkedin: { label: "LinkedIn", icon: "linkedin" },
    microsoft: { label: "Microsoft", icon: "microsoft" },
    notion: { label: "Notion", icon: "notion" },
    spotify: { label: "Spotify", icon: "spotify" },
    tiktok: { label: "TikTok", icon: "tiktok" },
    twitch: { label: "Twitch", icon: "twitch" },
    twitter: { label: "X (Twitter)", icon: "twitter" },
  };

/**
 * Providers that are safe to enable from env vars alone. Everything here is a
 * standard OAuth2 clientId/clientSecret provider with a built-in better-auth
 * implementation. Apple is included only for client-secret flows; if you need
 * Sign in with Apple with a private key, add it manually in `convex/auth.ts`.
 */
export const ENV_DRIVEN_PROVIDERS = Object.keys(OAUTH_PROVIDERS);

const envBase = (id: string) => `BETTER_AUTH_${id.toUpperCase()}_`;

/**
 * Read `BETTER_AUTH_<PROVIDER>_CLIENT_ID` / `..._CLIENT_SECRET` from Convex
 * env vars and return the ids of every provider that is fully configured.
 */
export function enabledProviderIds(): string[] {
  return ENV_DRIVEN_PROVIDERS.filter((id) => {
    const base = envBase(id);
    return (
      Boolean(process.env[`${base}CLIENT_ID`]) &&
      Boolean(process.env[`${base}CLIENT_SECRET`])
    );
  });
}

/**
 * Build the `socialProviders` map for better-auth from configured env vars.
 * Each provider is a plain `{ clientId, clientSecret, redirectURI }` object -
 * the standard shape better-auth accepts for built-in providers.
 */
export function buildSocialProviders(
  siteUrl: string,
): Record<
  string,
  { clientId: string; clientSecret: string; redirectURI: string }
> {
  const providers: Record<
    string,
    { clientId: string; clientSecret: string; redirectURI: string }
  > = {};
  for (const id of enabledProviderIds()) {
    const base = envBase(id);
    providers[id] = {
      clientId: process.env[`${base}CLIENT_ID`]!,
      clientSecret: process.env[`${base}CLIENT_SECRET`]!,
      redirectURI: `${siteUrl}/api/auth/callback/${id}`,
    };
  }
  return providers;
}

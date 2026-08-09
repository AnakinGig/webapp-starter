"use client";

import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { FingerprintIcon } from "lucide-react";

import { api } from "@/convex/_generated/api";

export type OAuthProviderId =
  | "apple"
  | "discord"
  | "facebook"
  | "figma"
  | "github"
  | "gitlab"
  | "google"
  | "kakao"
  | "linear"
  | "linkedin"
  | "microsoft"
  | "notion"
  | "spotify"
  | "tiktok"
  | "twitch"
  | "twitter";

export type OAuthProviderMeta = {
  id: string;
  label: string;
  icon: ReactNode;
};

type IconProps = { className?: string };

/** Simple monochrome brand glyphs (currentColor so they follow the theme). */
const ICONS: Record<string, (p: IconProps) => ReactNode> = {
  apple: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M17.05 12.54c-.03-2.9 2.37-4.29 2.48-4.36-1.35-1.98-3.46-2.25-4.21-2.28-1.79-.18-3.5 1.06-4.41 1.06-.9 0-2.31-1.03-3.8-1-1.95.03-3.76 1.14-4.76 2.89-2.03 3.53-.52 8.75 1.46 11.61.97 1.4 2.12 2.97 3.63 2.91 1.46-.06 2.01-.94 3.77-.94s2.26.94 3.8.91c1.57-.03 2.57-1.42 3.53-2.83 1.11-1.63 1.57-3.21 1.6-3.29-.04-.02-3.07-1.18-3.1-4.68zM14.2 4.08c.8-.97 1.35-2.32 1.2-3.66-1.16.05-2.57.77-3.4 1.75-.75.86-1.4 2.25-1.23 3.58 1.3.1 2.63-.66 3.43-1.67z"
      />
    </svg>
  ),
  discord: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.24.5a15 15 0 0 1 4.3 1.4A16 16 0 0 0 4.5 4.9 15 15 0 0 1 8.8 3.5L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.9 8.5.1 12.6.5 16.6a20 20 0 0 0 6 3l.7-1.1a13 13 0 0 1-2.1-1l.5-.4a14 14 0 0 0 12.6 0l.5.4c-.7.4-1.4.7-2.1 1l.7 1.1a20 20 0 0 0 6-3c.5-4.7-.8-8.8-3-12.2zM8.5 14.3c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3zm7 0c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3z"
      />
    </svg>
  ),
  facebook: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  ),
  figma: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 12a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm0 12a4 4 0 1 1 4-4 4 4 0 0 1-4 4zM4 24a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm0-12a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm0-12a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm16 0a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"
      />
    </svg>
  ),
  github: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z"
      />
    </svg>
  ),
  gitlab: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="m23.6 9.59-.03-.09L20.3.98a.85.85 0 0 0-.34-.41.87.87 0 0 0-1 .05.87.87 0 0 0-.29.55l-2.2 6.75H7.53L5.32 1.17a.86.86 0 0 0-.29-.55.87.87 0 0 0-1-.05.85.85 0 0 0-.34.41L.43 9.5l-.03.09a6.07 6.07 0 0 0 2.01 7.01l.01.01.03.02 4.98 3.73 2.46 1.86 1.5 1.13a1.01 1.01 0 0 0 1.22 0l1.5-1.13 2.46-1.86 5.01-3.75.01-.01a6.07 6.07 0 0 0 2.01-7.01z"
      />
    </svg>
  ),
  google: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 10.8v3.6h5.1c-.2 1.3-1.5 3.9-5.1 3.9-3.1 0-5.6-2.5-5.6-5.7S8.9 6.9 12 6.9c1.8 0 2.9.7 3.6 1.4l2.5-2.4C16.5 4.3 14.5 3.4 12 3.4 6.9 3.4 2.8 7.5 2.8 12.6S6.9 21.8 12 21.8c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.1-1.5z"
      />
    </svg>
  ),
  kakao: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.49 2 10.8c0 2.44 1.4 4.59 3.58 6.01l-.91 3.32c-.1.37.32.66.63.44l3.97-2.62c.88.17 1.8.26 2.73.26 5.52 0 10-3.49 10-7.8S17.52 3 12 3z"
      />
    </svg>
  ),
  linear: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M21.33 8.85 15.15 2.67A10.1 10.1 0 0 0 12 1.5c-5.8 0-10.5 4.7-10.5 10.5S6.2 22.5 12 22.5c.66 0 1.3-.06 1.93-.18l7.4-7.4A10.5 10.5 0 0 0 21.33 8.85zM12.55 20.9l8.35-8.35c.04.48.06.96.06 1.45 0 .68-.07 1.35-.2 1.99l-5.42 5.42a10 10 0 0 1-2.79-.51zm4.57-8.36-7.9 7.9a10.5 10.5 0 0 1-2.27-.42l10.12-10.12c.07.83.1 1.68.05 2.64z"
      />
    </svg>
  ),
  linkedin: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  ),
  microsoft: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M0 0h11.5v11.5H0zM12.5 0H24v11.5H12.5zM0 12.5h11.5V24H0zM12.5 12.5H24V24H12.5z"
      />
    </svg>
  ),
  notion: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M4.46 3.5c.56.45.75.52 1.6.58l11.4.73c.28.02.3-.14.3-.35l-.06-1.55c-.02-.42-.22-.64-.9-.7L5.5 1.94c-.5-.03-.82.12-1.04.36l-.23.64c-.08.17 0 .4.23.56zm2.1 4.5c.62.07.91.26 1.66.31l11.25.71c.42.04.52-.15.52-.43V7c0-.6-.36-.78-.75-.83l-11.2-.9c-.47-.05-.94.06-1.02.4l-.55 1.24c-.07.23.1.5.54.6zm.12 4.63V21.2c0 .55.28.78.84.82l12.5.78c.63.04.93-.25.93-.78V7.9c0-.45-.27-.68-.77-.72l-12.75-.85c-.5-.04-.75.2-.75.72v5.6l-.24-.06c-.14-.05-.24.05-.32.22l-.78 1.63c-.1.24.05.5.34.58zm2.18-.85c.24-.05.44-.04.62.05l9.77.62c.14.02.2-.06.2-.22v-.57c0-.12-.13-.2-.3-.22l-9.9-.62c-.3-.02-.5 0-.62.08l-.29.58c-.07.16 0 .3.26.35l.46-.05z"
      />
    </svg>
  ),
  spotify: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.5 17.31c-.24.36-.7.46-1.05.22-2.88-1.76-6.5-2.16-10.77-1.18-.4.1-.82-.15-.92-.55-.1-.4.15-.82.55-.92 4.62-1.07 8.6-.62 11.78 1.33.36.22.46.68.41 1.1zm1.47-3.27c-.3.45-.9.57-1.35.27-3.3-2.03-8.33-2.62-12.23-1.43-.47.15-.98-.12-1.12-.58-.15-.47.11-.98.58-1.13 4.52-1.37 10.12-.71 13.9 1.65.44.28.56.88.22 1.22zm.13-3.4C15.24 8.4 8.87 8.16 5.06 9.34c-.55.18-1.16-.13-1.33-.68-.18-.55.13-1.16.68-1.34 4.42-1.36 11.5-1.08 15.8 1.52.5.3.66.94.36 1.43-.3.5-.94.66-1.42.37z"
      />
    </svg>
  ),
  tiktok: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.05.85.13V9.4a6.33 6.33 0 0 0-5.94 6.25 6.34 6.34 0 0 0 10.86 4.52 6.33 6.33 0 0 0 1.86-4.49V8.56a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.51.01z"
      />
    </svg>
  ),
  twitch: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M11.57 4.71h1.72v5.14h-1.72zM17.43 4.71H18v5.14h-1.71zM6 0 1.71 4.29v15.43h5.14V24l4.29-4.29h3.43L22.29 12V0zm14.57 11.14-3.43 3.43h-3.43l-3 3v-3H6.86V1.71h13.71z"
      />
    </svg>
  ),
  twitter: ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.49h2.04L6.49 3.24H4.3z"
      />
    </svg>
  ),
};

export function OAuthProviderIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const render =
    ICONS[id] ??
    (({ className: cls }: IconProps) => (
      <FingerprintIcon className={cls} aria-hidden="true" />
    ));
  return <>{render({ className: className ?? "size-4" })}</>;
}

export const OAUTH_PROVIDER_LABELS: Record<string, string> = {
  apple: "Apple",
  discord: "Discord",
  facebook: "Facebook",
  figma: "Figma",
  github: "GitHub",
  gitlab: "GitLab",
  google: "Google",
  kakao: "Kakao",
  linear: "Linear",
  linkedin: "LinkedIn",
  microsoft: "Microsoft",
  notion: "Notion",
  spotify: "Spotify",
  tiktok: "TikTok",
  twitch: "Twitch",
  twitter: "X (Twitter)",
};

export function providerLabel(id: string): string {
  return OAUTH_PROVIDER_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Read the configured OAuth providers from Convex (driven by env vars on the
 * deployment). Returns `undefined` while loading.
 */
export function useConfiguredProviders(): OAuthProviderMeta[] | undefined {
  const data = useQuery(api.providers.getConfiguredProviders);
  if (!data) return undefined;
  return data.map((id) => ({
    id,
    label: providerLabel(id),
    icon: <OAuthProviderIcon id={id} />,
  }));
}

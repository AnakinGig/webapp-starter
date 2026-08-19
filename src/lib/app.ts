/**
 * APP SETTINGS - the single place to configure your app.
 *
 * Everything on the site (header, footer, auth screens, metadata, legal
 * pages) reads from this file. Edit the values below and the whole app
 * updates; you shouldn't need to touch individual pages.
 */
export const appSettings = {
  /* ── Brand ─────────────────────────────────────────────────────────── */
  name: "Basis",
  /** Short name for tight spaces (e.g. browser shortcuts). */
  shortName: "Basis",
  tagline: "UI Starter Kit",
  description:
    "A polished UI starter with a landing page, auth screens, and a dashboard shell.",

  /**
   * Canonical URL of the deployed app (used for metadata/SEO). Set
   * NEXT_PUBLIC_APP_URL in your environment to override this default.
   */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  /* ── Logo ──────────────────────────────────────────────────────────── */
  logo: {
    /**
     * Path to a logo image inside /public (e.g. "/logo.png") to replace the
     * built-in geometric mark. Set to `null` to keep the default mark.
     */
    image: null as string | null,
    /** Favicon used in light mode. */
    iconLight: "/icon-light-32x32.png",
    /** Favicon used in dark mode. */
    iconDark: "/icon-dark-32x32.png",
    /** SVG favicon. */
    iconSvg: "/icon.svg",
    /** Apple touch icon. */
    appleIcon: "/apple-icon.png",
  },

  /* ── Contact ───────────────────────────────────────────────────────── */
  /** Public contact email (footer/legal contact links). */
  contactEmail: "hello@example.com",
  /** Support email (used where support is mentioned). */
  supportEmail: "support@example.com",

  /* ── Company & legal (rendered on /legal/*) ────────────────────────── */
  company: {
    legalEntity: "[Your Legal Entity, e.g. Your Company Ltd.]",
    address: "[Registered address]",
    jurisdiction: "[Your country/state]",
  },
  /** Bump whenever you change the legal pages. */
  legalLastUpdated: "August 5, 2026",

  /* ── Tech stack badges (landing + auth pages) ──────────────────────── */
  stack: ["Next.js", "React", "Tailwind", "shadcn"],

  /* ── Footer navigation ─────────────────────────────────────────────── */
  footerNav: {
    product: [
      { label: "Overview", href: "/" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    account: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
    legal: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Cookie Policy", href: "/legal/cookies" },
    ],
  },
}

export type AppSettings = typeof appSettings

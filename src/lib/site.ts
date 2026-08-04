export const siteConfig = {
  name: "Basis",
  tagline: "UI Starter Kit",
  description:
    "A polished UI starter with a landing page, auth screens, and a dashboard shell.",
  stack: ["Next.js", "React", "Tailwind", "shadcn", "Lucide"],
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

export type SiteConfig = typeof siteConfig

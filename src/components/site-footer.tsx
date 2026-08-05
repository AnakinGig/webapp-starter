import Link from "next/link"

import { siteConfig } from "@/lib/site"
import { Logo } from "@/components/logo"
import { CookieSettingsLink } from "@/components/cookie-settings-link"

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>
          <FooterColumn title="Product" links={siteConfig.footerNav.product} />
          <FooterColumn title="Account" links={siteConfig.footerNav.account} />
          <FooterColumn title="Legal" links={siteConfig.footerNav.legal} />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
              reserved.
            </span>
            <CookieSettingsLink />
          </p>
          <p className="font-mono uppercase tracking-widest">
            {siteConfig.stack.join(" / ")}
          </p>
        </div>
      </div>
    </footer>
  )
}

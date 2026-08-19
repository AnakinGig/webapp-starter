import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/lib/site";
import { Logo } from "@/components/logo";
import { CookieSettingsLink } from "@/components/cookie-settings-link";

const supportHref = `mailto:${siteConfig.supportEmail}`;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-foreground/70 hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {siteConfig.description}
            </p>
          </div>
          <FooterColumn
            title={t("product")}
            links={siteConfig.footerNav.product}
          />
          <FooterColumn
            title={t("account")}
            links={siteConfig.footerNav.account}
          />
          <FooterColumn title={t("legal")} links={siteConfig.footerNav.legal} />
        </div>

        <div className="border-border text-muted-foreground mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              {t("rightsReserved", {
                year: new Date().getFullYear(),
                name: siteConfig.name,
              })}
            </span>
            <a
              href={supportHref}
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-3 transition-colors hover:underline"
            >
              {t("support")}
            </a>
            <CookieSettingsLink />
          </p>
          <p className="font-mono tracking-widest uppercase">
            {siteConfig.stack.join(" / ")}
          </p>
        </div>
      </div>
    </footer>
  );
}

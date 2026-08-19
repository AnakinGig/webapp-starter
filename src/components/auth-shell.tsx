import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";
import { siteConfig } from "@/lib/site";

export async function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col gap-8 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label={`${siteConfig.name} ${t("home")}`}>
            <Logo />
          </Link>
          <span className="text-muted-foreground font-mono text-xs">
            {eyebrow}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {title}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                {description}
              </p>
            </div>
            <div className="mt-8">{children}</div>
            <div className="text-muted-foreground mt-6 text-center text-sm">
              {footer}
            </div>
          </div>
        </div>
      </div>

      {/* Brand column */}
      <div className="border-border bg-muted/40 relative hidden overflow-hidden border-l lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.4]"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            {siteConfig.name}
          </div>
          <blockquote className="max-w-md">
            <p className="text-xl leading-relaxed text-balance">
              {siteConfig.tagline}
            </p>
            <footer className="text-muted-foreground mt-4 font-mono text-xs">
              {siteConfig.description}
            </footer>
          </blockquote>
          <div className="text-muted-foreground flex flex-wrap gap-2 font-mono text-xs">
            {siteConfig.stack.map((t) => (
              <span
                key={t}
                className="border-border bg-background rounded-md border px-2 py-1"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

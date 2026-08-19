import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRightIcon,
  DatabaseIcon,
  FingerprintIcon,
  LayoutDashboardIcon,
  NetworkIcon,
} from "lucide-react";

import { siteConfig } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURE_KEYS = [
  {
    icon: FingerprintIcon,
    titleKey: "authTitle",
    descriptionKey: "authDescription",
  },
  {
    icon: LayoutDashboardIcon,
    titleKey: "dashboardTitle",
    descriptionKey: "dashboardDescription",
  },
  {
    icon: NetworkIcon,
    titleKey: "componentsTitle",
    descriptionKey: "componentsDescription",
  },
  {
    icon: DatabaseIcon,
    titleKey: "themeTitle",
    descriptionKey: "themeDescription",
  },
] as const;

export default async function Page() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-border relative overflow-hidden border-b">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)] [background-size:56px_56px] opacity-[0.4]"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="border-border bg-card text-muted-foreground mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-widest uppercase">
              <span className="bg-brand size-1.5 rounded-full" />
              {t("badge")}
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              {t("heroDescription", { name: siteConfig.name })}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                {tc("getStarted")}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                {tc("signIn")}
              </Button>
            </div>

            <dl className="border-border bg-border mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-4">
              {siteConfig.stack.slice(0, 4).map((item, i) => (
                <div key={item} className="bg-card p-4">
                  <dt className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
                    {String(i + 1).padStart(2, "0")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{item}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
              {t("whatsIncluded")}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {t("featuresTitle")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_KEYS.map((feature) => (
              <Card key={feature.titleKey} className="bg-card">
                <CardHeader>
                  <span className="border-border bg-background text-brand mb-3 inline-flex size-9 items-center justify-center rounded-md border">
                    <feature.icon className="size-4.5" />
                  </span>
                  <CardTitle className="text-base">
                    {t(`features.${feature.titleKey}`)}
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(`features.${feature.descriptionKey}`)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-border bg-card border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-semibold tracking-tight text-balance">
                {t("ctaTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("ctaDescription")}
              </p>
            </div>
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              {tc("createAccount")}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

import Link from "next/link"
import {
  ArrowRightIcon,
  DatabaseIcon,
  FingerprintIcon,
  LayoutDashboardIcon,
  NetworkIcon,
} from "lucide-react"

import { siteConfig } from "@/lib/site"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    icon: FingerprintIcon,
    title: "Auth screens",
    description:
      "Login and register views with a consistent shell, responsive layout, and polished form styling.",
  },
  {
    icon: LayoutDashboardIcon,
    title: "Dashboard UI",
    description:
      "A complete table-driven workspace for user management that can be wired to your own data layer.",
  },
  {
    icon: NetworkIcon,
    title: "Reusable components",
    description:
      "Header, footer, cards, dialogs, and form primitives arranged as a cohesive product UI.",
  },
  {
    icon: DatabaseIcon,
    title: "Theme-ready shell",
    description:
      "Theme switching, responsive spacing, and a neutral visual system ready for a T3 app.",
  },
]

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" />
              v1.0 — Full-stack starter kit
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              The boilerplate to ship your next app faster.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {siteConfig.name} gives you the UI layer for a modern product:
              landing page, auth screens, and a dashboard shell that you can
              drop into another T3 app and wire to your own backend.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/register" />}>
                Get started
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/login" />}
              >
                Sign in
              </Button>
            </div>

            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
              {siteConfig.stack.slice(0, 4).map((item, i) => (
                <div key={item} className="bg-card p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
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
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              What&apos;s included
            </span>
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need, nothing you don&apos;t.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card">
                <CardHeader>
                  <span className="mb-3 inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-brand">
                    <feature.icon className="size-4.5" />
                  </span>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-balance text-2xl font-semibold tracking-tight">
                Ready to build?
              </h2>
              <p className="text-sm text-muted-foreground">
                Create an account and explore the dashboard in under a minute.
              </p>
            </div>
            <Button size="lg" render={<Link href="/register" />}>
              Create your account
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

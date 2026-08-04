import Link from "next/link"
import type { ReactNode } from "react"
import { Logo } from "@/components/logo"
import { siteConfig } from "@/lib/site"

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col gap-8 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label={`${siteConfig.name} home`}>
            <Logo />
          </Link>
          <span className="font-mono text-xs text-muted-foreground">{eyebrow}</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
            </div>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>

      {/* Brand column */}
      <div className="relative hidden overflow-hidden border-l border-border bg-muted/40 lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:40px_40px]"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {siteConfig.name} / ui
          </div>
          <blockquote className="max-w-md">
            <p className="text-xl leading-relaxed text-balance">{siteConfig.tagline}</p>
            <footer className="mt-4 font-mono text-xs text-muted-foreground">
              A UI-only starter — wire this shell into your own product logic.
            </footer>
          </blockquote>
          <div className="flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
            {["Next.js", "React", "Tailwind", "shadcn", "Lucide"].map((t) => (
              <span key={t} className="rounded-md border border-border bg-background px-2 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"

import { siteConfig } from "@/lib/site"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function SiteHeader() {
  const { data: session, isPending } = authClient.useSession()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 py-2">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
                {siteConfig.tagline}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {isPending ? (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" disabled>
                <span className="sr-only">Loading</span>
              </Button>
              <Button size="sm" disabled>
                <span className="sr-only">Loading</span>
              </Button>
            </div>
          ) : session ? (
            <NavUser />
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
                Get started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

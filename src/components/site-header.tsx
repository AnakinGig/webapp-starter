"use client";

import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { CommandPaletteTrigger } from "@/components/command-palette";
import { authClient } from "@/lib/auth-client";

export function SiteHeader() {
  // Default to the signed-out buttons while the session is loading so the
  // header never shows empty placeholders. The profile menu appears only once
  // the backend confirms there is a session.
  const { data: session } = authClient.useSession();

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </span>
              <span className="text-muted-foreground hidden font-mono text-[10px] tracking-widest uppercase sm:inline">
                {siteConfig.tagline}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <CommandPaletteTrigger />
          <ThemeToggle />
          {session ? (
            <NavUser />
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                Get started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

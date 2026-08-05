import Link from "next/link"

import { legalInfo } from "@/lib/legal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function LegalNotice() {
  return (
    <Alert className="mb-8">
      <AlertTitle className="text-sm font-medium">
        Boilerplate template notice
      </AlertTitle>
      <AlertDescription className="leading-relaxed">
        This page is generic template text. Replace every{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          [placeholder]
        </code>{" "}
        in <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">src/lib/legal.ts</code>{" "}
        and have the final text reviewed by a lawyer before launching.
      </AlertDescription>
    </Alert>
  )
}

export function LegalPage({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8 border-b border-border pb-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Legal
        </p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {legalInfo.lastUpdated}
        </p>
      </header>
      <LegalNotice />
      <div className="flex flex-col gap-8">{children}</div>
    </article>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground [&>a]:font-medium [&>a]:text-foreground [&>a]:underline [&>a]:underline-offset-3">
      {children}
    </p>
  )
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-3">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export function LegalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="font-medium underline underline-offset-3">
      {children}
    </Link>
  )
}

export function LegalEmailLink() {
  return <LegalLink href={`mailto:${legalInfo.email}`}>{legalInfo.email}</LegalLink>
}

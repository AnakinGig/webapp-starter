import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { legalInfo } from "@/lib/legal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export async function LegalNotice() {
  const t = await getTranslations("legal");
  return (
    <Alert className="mb-8">
      <AlertTitle className="text-sm font-medium">
        {t("templateNoticeTitle")}
      </AlertTitle>
      <AlertDescription className="leading-relaxed">
        {t("templateNoticeText", {
          legalTs: "src/lib/legal.ts",
          placeholder: "[placeholder]",
        })}
      </AlertDescription>
    </Alert>
  );
}

export async function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("legal");
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="border-border mb-8 border-b pb-6">
        <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-widest uppercase">
          {t("legal")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("lastUpdated", { date: legalInfo.lastUpdated })}
        </p>
      </header>
      <LegalNotice />
      <div className="flex flex-col gap-8">{children}</div>
    </article>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground [&>a]:text-foreground text-sm leading-relaxed [&>a]:font-medium [&>a]:underline [&>a]:underline-offset-3">
      {children}
    </p>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="text-muted-foreground [&_a]:text-foreground flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-3">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-medium underline underline-offset-3">
      {children}
    </Link>
  );
}

export function LegalEmailLink() {
  return (
    <LegalLink href={`mailto:${legalInfo.email}`}>{legalInfo.email}</LegalLink>
  );
}

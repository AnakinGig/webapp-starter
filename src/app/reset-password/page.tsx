import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const t = await getTranslations("auth.reset");
  const tc = await getTranslations("common");

  return (
    <AuthShell
      eyebrow="/reset-password"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {t("remembered")}
          <Link
            href="/login"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {tc("signIn")}
          </Link>
        </>
      }
    >
      <ResetPasswordForm
        token={token ?? null}
        invalid={error === "INVALID_TOKEN"}
      />
    </AuthShell>
  );
}

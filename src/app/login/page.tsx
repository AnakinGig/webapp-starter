import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <AuthShell
      eyebrow="/login"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {t("noAccount")}
          <Link
            href="/register"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {t("createOne")}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

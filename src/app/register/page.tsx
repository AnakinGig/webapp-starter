import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");
  const tc = await getTranslations("common");

  return (
    <AuthShell
      eyebrow="/register"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {t("haveAccount")}
          <Link
            href="/login"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {tc("signIn")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}

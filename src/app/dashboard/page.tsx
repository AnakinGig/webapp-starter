import { getTranslations } from "next-intl/server";

import { UserManagement } from "@/components/dashboard/user-management";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-col gap-1">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t("title")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {t("welcomeBack")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
          {t("description")}
        </p>
      </div>
      <UserManagement />
    </div>
  );
}

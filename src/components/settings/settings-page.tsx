"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AtSignIcon,
  BellIcon,
  LanguagesIcon,
  PaletteIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AccountSection } from "./account-section";
import { ProfileSection } from "./profile-section";
import { AppearanceSection } from "./appearance-section";
import { SecuritySection } from "./security-section";
import { NotificationsSection } from "./notifications-section";

export type SettingsSectionId =
  | "profile"
  | "account"
  | "appearance"
  | "language"
  | "security"
  | "notifications";

export function SettingsPage() {
  const t = useTranslations("settings");
  const [active, setActive] = useState<SettingsSectionId>("profile");
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const name = user?.name ?? user?.email ?? "User";
  const initial = name.charAt(0).toUpperCase();

  const sections: {
    id: SettingsSectionId;
    label: string;
    icon: typeof UserRoundIcon;
  }[] = [
    { id: "profile", label: t("profile"), icon: UserRoundIcon },
    { id: "account", label: t("account"), icon: AtSignIcon },
    { id: "appearance", label: t("appearance"), icon: PaletteIcon },
    { id: "language", label: t("language"), icon: LanguagesIcon },
    { id: "security", label: t("security"), icon: ShieldIcon },
    { id: "notifications", label: t("notifications"), icon: BellIcon },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-64">
          <div className="border-border mb-4 hidden items-center gap-3 rounded-lg border p-3 lg:flex">
            <Avatar className="size-10 rounded-lg">
              {user?.image ? (
                <AvatarImage src={user.image} alt={name} />
              ) : (
                <AvatarFallback className="rounded-lg">
                  {initial}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {user?.email}
              </p>
            </div>
          </div>
          <nav
            aria-label={t("navLabel")}
            className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                aria-current={active === id ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring/50 flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-3",
                  active === id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {active === "profile" && <ProfileSection />}
          {active === "account" && <AccountSection />}
          {active === "appearance" && <AppearanceSection />}
          {active === "language" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("language")}</CardTitle>
                <CardDescription>{t("languageDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSwitcher />
              </CardContent>
            </Card>
          )}
          {active === "security" && <SecuritySection />}
          {active === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

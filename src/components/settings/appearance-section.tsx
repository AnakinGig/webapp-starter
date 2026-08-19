"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AppearanceSection() {
  const t = useTranslations("appearance");
  const { theme, resolvedTheme, setTheme } = useTheme();

  const themes = [
    {
      id: "light",
      label: t("light"),
      description: t("lightDescription"),
      icon: SunIcon,
    },
    {
      id: "dark",
      label: t("dark"),
      description: t("darkDescription"),
      icon: MoonIcon,
    },
    {
      id: "system",
      label: t("system"),
      description: t("systemDescription"),
      icon: MonitorIcon,
    },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map(({ id, label, description, icon: Icon }) => {
            const selected = theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                aria-pressed={selected}
                className={cn(
                  "focus-visible:ring-ring/50 relative flex flex-col items-start gap-1.5 rounded-lg border p-4 text-left text-sm transition-colors outline-none focus-visible:ring-3",
                  selected
                    ? "border-ring bg-accent"
                    : "border-border hover:border-muted-foreground/40 hover:bg-muted",
                )}
              >
                {selected && (
                  <span className="bg-primary text-primary-foreground absolute top-3 right-3 flex size-5 items-center justify-center rounded-full">
                    <CheckIcon className="size-3" />
                  </span>
                )}
                <Icon className="size-5" />
                <span className="mt-1 font-medium">{label}</span>
                <span className="text-muted-foreground text-xs">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          {t("currentlyUsing", {
            theme: resolvedTheme === "dark" ? t("dark") : t("light"),
          })}
        </p>
      </CardContent>
    </Card>
  );
}

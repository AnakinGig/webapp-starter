"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LanguagesIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { setLocaleCookie } from "@/lib/locale";
import { locales, type Locale } from "@/i18n/config";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

/**
 * Runtime language switcher. Writes the `locale` cookie (read by the i18n
 * request config on the next request) and, for signed-in users, persists the
 * choice on the account so it follows them across devices. The current page
 * re-renders with the new locale via router.refresh() (no full reload).
 */
export function LanguageSwitcher({
  size = "default",
}: {
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("settings");
  const { data: session } = authClient.useSession();
  const [saving, setSaving] = useState(false);

  async function onChange(value: string) {
    if (value === locale || saving) return;
    setSaving(true);
    setLocaleCookie(value);
    // Persist on the account when signed in (falls back to cookie-only for
    // signed-out visitors).
    const userId = session?.user?.id;
    if (userId) {
      const { error } = await authClient.updateUser({ language: value });
      if (error) {
        // The cookie is already set, so the choice still applies this
        // session - only the cross-device persistence failed.
        console.error("Failed to persist language preference:", error);
      }
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <Select value={locale} onValueChange={(v) => v && void onChange(v)}>
      <SelectTrigger
        size={size}
        aria-label={t("language")}
        disabled={saving}
        className="w-fit"
      >
        <LanguagesIcon className="text-muted-foreground size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {locales.map((l) => (
            <SelectItem key={l} value={l}>
              {LOCALE_LABELS[l]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

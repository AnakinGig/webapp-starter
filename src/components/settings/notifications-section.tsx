"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function NotificationsSection() {
  const t = useTranslations("notifications");
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const user = session?.user;

  const [savingVerification, setSavingVerification] = useState(false);
  const [savingReset, setSavingReset] = useState(false);

  async function toggleVerification(checked: boolean) {
    setSavingVerification(true);
    const { error } = await authClient.updateUser({
      notifyVerificationEmails: checked,
    });
    setSavingVerification(false);
    if (error) {
      toast.error(error.message ?? t("updateFailed"));
      return;
    }
    void refetchSession();
  }

  async function toggleReset(checked: boolean) {
    setSavingReset(true);
    const { error } = await authClient.updateUser({
      notifyResetEmails: checked,
    });
    setSavingReset(false);
    if (error) {
      toast.error(error.message ?? t("updateFailed"));
      return;
    }
    void refetchSession();
  }

  const isVerified = user?.emailVerified === true;
  const isVerificationOn = user?.notifyVerificationEmails !== false;
  const isResetOn = user?.notifyResetEmails !== false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="pb-(--card-spacing)">
        <div className="divide-border divide-y">
          <div className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0" id="notif-verify-label">
              <p className="text-sm font-medium">{t("emailVerification")}</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {t("emailVerificationDescription", {
                  status: isVerified
                    ? t("emailVerified")
                    : t("emailNotVerified"),
                })}
              </p>
            </div>
            <Switch
              checked={isVerificationOn}
              onCheckedChange={(checked) => void toggleVerification(checked)}
              disabled={savingVerification}
              aria-labelledby="notif-verify-label"
              className="mt-0.5 shrink-0"
            />
          </div>

          <div className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0" id="notif-reset-label">
              <p className="text-sm font-medium">{t("passwordReset")}</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {t("passwordResetDescription", {
                  status: isResetOn ? t("resetEnabled") : t("resetDisabled"),
                })}
              </p>
            </div>
            <Switch
              checked={isResetOn}
              onCheckedChange={(checked) => void toggleReset(checked)}
              disabled={savingReset}
              aria-labelledby="notif-reset-label"
              className="mt-0.5 shrink-0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

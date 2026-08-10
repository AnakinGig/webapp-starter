"use client";

import { useState } from "react";
import { toast } from "sonner";

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
      toast.error(error.message ?? "Couldn't update notification preference.");
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
      toast.error(error.message ?? "Couldn't update notification preference.");
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
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose which emails you receive from your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-(--card-spacing)">
        <div className="divide-border divide-y">
          <div className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0" id="notif-verify-label">
              <p className="text-sm font-medium">Email verification</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Receive an email to verify your address when you sign up or
                change your email.{" "}
                {isVerified
                  ? "Your email is already verified."
                  : "Your email is not yet verified."}
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
              <p className="text-sm font-medium">Password reset</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Receive an email to reset your password if you forget it.{" "}
                {isResetOn
                  ? "You can request a password reset from the sign-in page."
                  : "Without this, you won't be able to reset your password."}
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

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { TriangleAlertIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { api } from "@/convex/_generated/api";
import { useConvex, useMutation } from "convex/react";
import { AvatarUploader } from "./avatar-uploader";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import { sendVerificationEmail } from "@/lib/send-verification";
import { isValidEmail } from "@/lib/validation";

export function ProfileSection() {
  const router = useRouter();
  const t = useTranslations("profileSection");
  const tc = useTranslations("common");
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const user = session?.user;

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Change email state
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Resend-verification state (email change requires a verified email)
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const timer = setInterval(() => setVerifyCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [verifyCooldown]);

  useEffect(() => {
    void authClient.listAccounts().then(({ data, error }) => {
      if (!error) {
        setHasPassword((data ?? []).some((a) => a.providerId === "credential"));
      }
    });
  }, []);

  // Danger zone state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  // Whether this account has an email/password sign-in. Only those users are
  // asked for their password when deleting the account; OAuth-only accounts
  // confirm with a checkbox instead. null = still loading.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const convex = useConvex();

  // Data export state
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user]);

  const isAdmin = user?.role === "admin";
  const isVerified = user?.emailVerified === true;
  const isUnchanged = !name.trim() || name.trim() === (user?.name ?? "");

  // Front validation for the new email (fast feedback; the server re-validates).
  function validateNewEmail(): string | null {
    const trimmed = newEmail.trim();
    if (!trimmed) return null;
    if (!isValidEmail(trimmed)) return t("invalidEmail");
    if (trimmed.toLowerCase() === (user?.email ?? "").toLowerCase()) {
      return t("emailAlreadyCurrent");
    }
    return null;
  }

  // Send the verification email for the CURRENT address (blocked before
  // email change). Mirrors Settings -> Security; proxied to the better-auth
  // instance, rate-limited server-side (1 per 60s).
  async function handleSendVerification() {
    if (sendingVerify || verifyCooldown > 0 || !user?.email) return;
    setVerifyError(null);
    setVerifySent(false);
    setSendingVerify(true);
    try {
      await sendVerificationEmail(user.email);
      setVerifySent(true);
      setVerifyCooldown(60);
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : t("verificationSendFailed"),
      );
    } finally {
      setSendingVerify(false);
    }
  }

  async function handleEmailChange() {
    const trimmed = newEmail.trim();
    if (!trimmed) {
      setEmailError(t("enterNewEmail"));
      return;
    }
    const frontError = validateNewEmail();
    if (frontError) {
      setEmailError(frontError);
      return;
    }

    setEmailError(null);
    setEmailSent(false);
    setSendingEmail(true);
    const { error } = await authClient.changeEmail({
      newEmail: trimmed,
      callbackURL: "/settings",
    });
    setSendingEmail(false);

    if (error) {
      setEmailError(error.message ?? t("confirmationSendFailed"));
      return;
    }
    setNewEmail("");
    setEmailSent(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === (user?.name ?? "")) return;

    setSaving(true);
    const { error } = await authClient.updateUser({ name: trimmed });
    setSaving(false);

    if (error) {
      setNameError(error.message ?? t("profileUpdateFailed"));
      return;
    }
    setNameError(null);
    await refetchSession();
    toast.success(t("profileUpdated"));
  }

  async function handleExport() {
    if (exporting) return;
    setExportError(null);
    setExporting(true);
    try {
      const data = await convex.query(api.users.exportData);
      if (!data) throw new Error(t("noDataReturned"));

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `account-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Defer the revoke - revoking in the same tick can abort the download
      // in Firefox.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : t("exportFailed"));
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    // Client-side check first (fast feedback); the server re-verifies the
    // password before deleting.
    if (hasPassword !== false) {
      if (!confirmPassword) {
        setDeleteError(t("enterPasswordToConfirm"));
        return;
      }
    } else if (!confirmChecked) {
      setDeleteError(t("confirmPermanent"));
      return;
    }

    setDeleteError(null);
    setDeletingAccount(true);
    try {
      await deleteAccount({
        password: hasPassword === false ? undefined : confirmPassword,
      });
      await authClient.signOut();
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("deleteFailed"));
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pb-(--card-spacing)">
            <FieldGroup>
              <div className="flex flex-wrap items-start gap-4">
                <AvatarUploader
                  image={user?.image}
                  name={user?.name ?? user?.email ?? tc("user")}
                  onAvatarChanged={() => refetchSession()}
                />
                <div className="flex min-w-0 flex-col gap-1 pt-1">
                  <span className="text-sm font-medium">
                    {user?.name ?? "-"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {user?.email}
                  </span>
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="settings-name">
                  {tc("fullName")}
                </FieldLabel>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder={t("namePlaceholder")}
                  autoComplete="name"
                  aria-invalid={Boolean(nameError)}
                />
                {nameError && <FieldError>{nameError}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-new-email">
                  {tc("email")}
                </FieldLabel>
                {isVerified ? (
                  <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <Input
                        id="settings-new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => {
                          setNewEmail(e.target.value);
                          setEmailError(null);
                          setEmailSent(false);
                        }}
                        onBlur={() => {
                          const err = validateNewEmail();
                          if (err) setEmailError(err);
                        }}
                        placeholder={user?.email ?? "new@example.com"}
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-invalid={Boolean(emailError)}
                        className="sm:max-w-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={sendingEmail}
                        onClick={() => void handleEmailChange()}
                      >
                        {sendingEmail ? t("sending") : t("changeEmail")}
                      </Button>
                    </div>
                    <FieldDescription>{t("emailChangeHint")}</FieldDescription>
                    {emailError && <FieldError>{emailError}</FieldError>}
                    {emailSent && (
                      <p
                        role="status"
                        className="text-sm font-normal text-emerald-600 dark:text-emerald-500"
                      >
                        {t("emailSentStatus")}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {user?.email ?? "-"}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {t("verifyBeforeChange")}
                        </p>
                        {verifyError && (
                          <p
                            role="alert"
                            className="text-destructive mt-2 text-sm"
                          >
                            {verifyError}
                          </p>
                        )}
                        {verifySent && (
                          <p
                            role="status"
                            className="mt-2 text-sm text-emerald-600 dark:text-emerald-500"
                          >
                            {t("verificationSent")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        disabled={sendingVerify || verifyCooldown > 0}
                        onClick={() => void handleSendVerification()}
                      >
                        {sendingVerify
                          ? t("sending")
                          : verifyCooldown > 0
                            ? t("resendIn", { count: verifyCooldown })
                            : t("sendVerificationEmail")}
                      </Button>
                    </div>
                  </>
                )}
              </Field>

              <Separator />

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("role")}</span>
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {user?.role ?? "user"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t("memberSince")}
                  </span>
                  <span className="tabular-nums">
                    {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </FieldGroup>
          </CardContent>
          <CardFooter className="border-border justify-end border-t">
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>
                <Button type="submit" disabled={saving || isUnchanged}>
                  {saving ? t("saving") : t("updateProfile")}
                </Button>
              </TooltipTrigger>
              {!saving && isUnchanged && (
                <TooltipContent>{t("noChanges")}</TooltipContent>
              )}
            </Tooltip>
          </CardFooter>
        </form>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("accountDataTitle")}</CardTitle>
          <CardDescription>{t("accountDataDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="pb-(--card-spacing)">
          <div className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("exportYourData")}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("exportDescription")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              {exporting ? t("preparing") : t("exportJson")}
            </Button>
          </div>
          {exportError && (
            <p role="alert" className="text-destructive mt-3 text-sm">
              {exportError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50 mt-6">
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZone")}</CardTitle>
          <CardDescription>{t("dangerZoneDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="pb-(--card-spacing)">
          <div className="border-destructive/50 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("deleteAccount")}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("deleteAccountDescription")}
              </p>
            </div>
            <Button
              variant="destructive"
              className="shrink-0"
              onClick={() => {
                setDeleteOpen(true);
                setConfirmPassword("");
                setConfirmChecked(false);
                setDeleteError(null);
              }}
            >
              {t("deleteAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlertIcon className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleDelete} noValidate>
            {hasPassword === false ? (
              <div className="flex flex-col gap-2 pb-4">
                <label className="flex items-start gap-2.5 text-sm">
                  <Checkbox
                    checked={confirmChecked}
                    onCheckedChange={(checked) => {
                      setConfirmChecked(checked === true);
                      setDeleteError(null);
                    }}
                    aria-label={t("understandPermanent")}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground">
                    {t("understandPermanentLong")}
                  </span>
                </label>
                {deleteError && <FieldError>{deleteError}</FieldError>}
              </div>
            ) : (
              <Field className="pb-4">
                <FieldLabel htmlFor="confirm-delete-password">
                  {t("enterPasswordToConfirm")}
                </FieldLabel>
                <Input
                  id="confirm-delete-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setDeleteError(null);
                  }}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="current-password"
                  aria-invalid={Boolean(deleteError)}
                />
                {deleteError && <FieldError>{deleteError}</FieldError>}
              </Field>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  deletingAccount ||
                  (hasPassword !== false ? !confirmPassword : !confirmChecked)
                }
              >
                {deletingAccount ? t("deleting") : t("deleteMyAccount")}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

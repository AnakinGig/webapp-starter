"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
    if (!isValidEmail(trimmed)) return "Enter a valid email address.";
    if (trimmed.toLowerCase() === (user?.email ?? "").toLowerCase()) {
      return "This is already your current email address.";
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
        err instanceof Error
          ? err.message
          : "Failed to send the verification email.",
      );
    } finally {
      setSendingVerify(false);
    }
  }

  async function handleEmailChange() {
    const trimmed = newEmail.trim();
    if (!trimmed) {
      setEmailError("Enter your new email address.");
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
      setEmailError(error.message ?? "Couldn't send the confirmation email.");
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
      setNameError(error.message ?? "Failed to update profile.");
      return;
    }
    setNameError(null);
    await refetchSession();
    toast.success("Profile updated.");
  }

  async function handleExport() {
    if (exporting) return;
    setExportError(null);
    setExporting(true);
    try {
      const data = await convex.query(api.users.exportData);
      if (!data) throw new Error("No data returned.");

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
      setExportError(e instanceof Error ? e.message : "Export failed.");
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
        setDeleteError("Enter your password to confirm.");
        return;
      }
    } else if (!confirmChecked) {
      setDeleteError("Confirm that you understand this is permanent.");
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
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete your account.",
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>
            This information is displayed across your workspace.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pb-(--card-spacing)">
            <FieldGroup>
              <div className="flex flex-wrap items-start gap-4">
                <AvatarUploader
                  image={user?.image}
                  name={user?.name ?? user?.email ?? "User"}
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
                <FieldLabel htmlFor="settings-name">Full name</FieldLabel>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder="Your name"
                  autoComplete="name"
                  aria-invalid={Boolean(nameError)}
                />
                {nameError && <FieldError>{nameError}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-new-email">Email</FieldLabel>
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
                        {sendingEmail ? "Sending…" : "Change email"}
                      </Button>
                    </div>
                    <FieldDescription>
                      We&apos;ll email a verification link to the new address.
                      Your email only changes after you verify it.
                    </FieldDescription>
                    {emailError && <FieldError>{emailError}</FieldError>}
                    {emailSent && (
                      <p
                        role="status"
                        className="text-sm font-normal text-emerald-600 dark:text-emerald-500"
                      >
                        If this email isn&apos;t already in use, a verification
                        link is on its way - follow it to finish the change.
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
                          Verify your current email before changing it. A
                          verification link will be sent to this address.
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
                            Verification link sent - check your inbox.
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
                          ? "Sending…"
                          : verifyCooldown > 0
                            ? `Resend in ${verifyCooldown}s`
                            : "Send verification email"}
                      </Button>
                    </div>
                  </>
                )}
              </Field>

              <Separator />

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Role</span>
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {user?.role ?? "user"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Member since</span>
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
                  {saving ? "Saving…" : "Update profile"}
                </Button>
              </TooltipTrigger>
              {!saving && isUnchanged && (
                <TooltipContent>No changes to save.</TooltipContent>
              )}
            </Tooltip>
          </CardFooter>
        </form>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account data</CardTitle>
          <CardDescription>
            Download everything this app stores about your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-(--card-spacing)">
          <div className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Export your data</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Your profile, sessions, connected accounts, and content as a
                JSON file. Credentials (tokens, passwords) are never included.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              {exporting ? "Preparing…" : "Export JSON"}
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
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-(--card-spacing)">
          <div className="border-destructive/50 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Permanently delete your account, your sessions, and your
                content. This action cannot be undone.
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
              Delete account
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
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, all active sessions,
              and any content you&apos;ve created. This action cannot be undone.
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
                    aria-label="I understand this action is permanent"
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground">
                    I understand this permanently deletes my account, all active
                    sessions, and any content I&apos;ve created. This cannot be
                    undone.
                  </span>
                </label>
                {deleteError && <FieldError>{deleteError}</FieldError>}
              </div>
            ) : (
              <Field className="pb-4">
                <FieldLabel htmlFor="confirm-delete-password">
                  Enter your password to confirm
                </FieldLabel>
                <Input
                  id="confirm-delete-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setDeleteError(null);
                  }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(deleteError)}
                />
                {deleteError && <FieldError>{deleteError}</FieldError>}
              </Field>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  deletingAccount ||
                  (hasPassword !== false ? !confirmPassword : !confirmChecked)
                }
              >
                {deletingAccount ? "Deleting…" : "Delete my account"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

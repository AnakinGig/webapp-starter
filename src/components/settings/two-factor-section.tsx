"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CREDENTIAL_PROVIDER = "credential";

/** Extract the base32 secret from an otpauth:// TOTP URI for manual entry. */
function secretFromUri(uri: string): string {
  try {
    return new URL(uri).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

/** Copy text to the clipboard with a transient "Copied" confirmation. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  } catch {
    toast.error("Couldn't copy to clipboard.");
  }
}

type EnableState =
  | { step: "password" }
  | {
      step: "setup";
      totpUri: string;
      backupCodes: string[];
    };

export function TwoFactorSection() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const isEnabled = session?.user?.twoFactorEnabled === true;

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [enableOpen, setEnableOpen] = useState(false);
  const [enableState, setEnableState] = useState<EnableState | null>(null);
  const [enablePassword, setEnablePassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);

  const [codesOpen, setCodesOpen] = useState(false);
  const [codesPassword, setCodesPassword] = useState("");
  const [codesError, setCodesError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authClient.listAccounts().then(({ data }) => {
      if (cancelled) return;
      setHasPassword(
        (data ?? []).some((a) => a.providerId === CREDENTIAL_PROVIDER),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetEnable = useCallback(() => {
    setEnableState(null);
    setEnablePassword("");
    setPasswordError(null);
    setCode("");
    setCodeError(null);
  }, []);

  /** Step 1 of enabling: confirm the password (if any), get the TOTP URI + codes. */
  async function startSetup(e: React.FormEvent) {
    e.preventDefault();
    if (hasPassword && !enablePassword) {
      setPasswordError("Enter your password to continue.");
      return;
    }
    setPasswordError(null);
    setEnabling(true);
    const { data, error } = await authClient.twoFactor.enable({
      password: hasPassword ? enablePassword : undefined,
    });
    setEnabling(false);
    if (error) {
      setPasswordError(error.message ?? "Couldn't start two-factor setup.");
      return;
    }
    if (!data?.totpURI) {
      setPasswordError("The server didn't return a setup link. Try again.");
      return;
    }
    setEnableState({
      step: "setup",
      totpUri: data.totpURI,
      backupCodes: data.backupCodes ?? [],
    });
  }

  /** Step 2 of enabling: verify a code from the authenticator app. */
  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setCodeError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setCodeError(null);
    setVerifying(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: trimmed });
    setVerifying(false);
    if (error) {
      setCodeError(error.message ?? "That code wasn't accepted. Try again.");
      return;
    }
    toast.success("Two-factor authentication enabled.");
    setEnableOpen(false);
    resetEnable();
    void refetchSession();
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    if (hasPassword && !disablePassword) {
      setDisableError("Enter your password to disable two-factor.");
      return;
    }
    setDisableError(null);
    setDisabling(true);
    const { error } = await authClient.twoFactor.disable({
      password: hasPassword ? disablePassword : undefined,
    });
    setDisabling(false);
    if (error) {
      setDisableError(error.message ?? "Couldn't disable two-factor.");
      return;
    }
    toast.success("Two-factor authentication disabled.");
    setDisableOpen(false);
    setDisablePassword("");
    setDisableError(null);
    void refetchSession();
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    if (hasPassword && !codesPassword) {
      setCodesError("Enter your password to generate new backup codes.");
      return;
    }
    setCodesError(null);
    setGenerating(true);
    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password: hasPassword ? codesPassword : undefined,
    });
    setGenerating(false);
    if (error) {
      setCodesError(error.message ?? "Couldn't generate new backup codes.");
      return;
    }
    setNewCodes(data?.backupCodes ?? []);
    setCodesPassword("");
  }

  const manualSecret = useMemo(
    () =>
      enableState?.step === "setup" ? secretFromUri(enableState.totpUri) : "",
    [enableState],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security. Signing in will require a code from
            your authenticator app in addition to your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-(--card-spacing)">
          <div className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">
                  Authenticator app (TOTP)
                </p>
                {isEnabled ? (
                  <Badge>
                    <ShieldCheckIcon data-icon="inline-start" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Off</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {isEnabled
                  ? "Your account is protected by a one-time code."
                  : "You'll scan a QR code with an authenticator app to get started."}
              </p>
            </div>
            {hasPassword === null ? (
              <Skeleton className="h-9 w-32 shrink-0" />
            ) : isEnabled ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={codesOpen}
                  onClick={() => {
                    setNewCodes(null);
                    setCodesError(null);
                    setCodesOpen(true);
                  }}
                >
                  Regenerate backup codes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disableOpen}
                  onClick={() => {
                    setDisablePassword("");
                    setDisableError(null);
                    setDisableOpen(true);
                  }}
                >
                  Disable
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={enableOpen}
                onClick={() => {
                  resetEnable();
                  setEnableOpen(true);
                }}
              >
                Enable
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Enable dialog (password → QR + backup codes → verify) ─────── */}
      <Dialog
        open={enableOpen}
        onOpenChange={(open) => {
          setEnableOpen(open);
          if (!open) resetEnable();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {enableState?.step === "setup"
                ? "Scan the QR code"
                : "Enable two-factor authentication"}
            </DialogTitle>
            <DialogDescription>
              {enableState?.step === "setup"
                ? "Scan the code with your authenticator app, then enter the code it shows to confirm."
                : hasPassword
                  ? "Confirm your password to start the setup."
                  : "Set up a one-time code to protect your account."}
            </DialogDescription>
          </DialogHeader>

          {enableState?.step === "setup" ? (
            <form onSubmit={confirmSetup} noValidate>
              <FieldGroup>
                <div className="bg-muted/40 flex flex-col items-center gap-3 rounded-lg p-4">
                  <QRCodeSVG
                    value={enableState.totpUri}
                    size={176}
                    level="M"
                    className="rounded-md bg-white p-2"
                  />
                  {manualSecret && (
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs">
                          Can&apos;t scan? Enter this key manually:
                        </p>
                        <p className="font-mono text-xs break-all">
                          {manualSecret}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        onClick={() => void copyText(manualSecret)}
                        aria-label="Copy secret key"
                      >
                        <CopyIcon className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-border rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <TriangleAlertIcon className="size-3.5 shrink-0 text-amber-500" />
                    Save your backup codes
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    You can use these to sign in if you lose your phone. They
                    are only shown once - store them somewhere safe.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-5">
                    {enableState.backupCodes.map((bc) => (
                      <span
                        key={bc}
                        className="bg-muted/50 rounded px-1.5 py-0.5 text-center"
                      >
                        {bc}
                      </span>
                    ))}
                  </div>
                  {enableState.backupCodes.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        void copyText(enableState.backupCodes.join("\n"))
                      }
                    >
                      <CopyIcon data-icon="inline-start" />
                      Copy all
                    </Button>
                  )}
                </div>

                <Field>
                  <FieldLabel htmlFor="2fa-setup-code">
                    Authentication code
                  </FieldLabel>
                  <Input
                    id="2fa-setup-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    autoFocus
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setCodeError(null);
                    }}
                    aria-invalid={Boolean(codeError)}
                    required
                  />
                  {codeError ? (
                    <FieldError>{codeError}</FieldError>
                  ) : (
                    <FieldDescription>
                      The 6-digit code shown in your authenticator app.
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>
              <DialogFooter className="mt-4">
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={verifying}>
                  {verifying ? "Verifying…" : "Enable"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={startSetup} noValidate>
              <FieldGroup>
                {hasPassword && (
                  <Field>
                    <FieldLabel htmlFor="2fa-enable-password">
                      Current password
                    </FieldLabel>
                    <Input
                      id="2fa-enable-password"
                      type="password"
                      autoComplete="current-password"
                      value={enablePassword}
                      onChange={(e) => {
                        setEnablePassword(e.target.value);
                        setPasswordError(null);
                      }}
                      aria-invalid={Boolean(passwordError)}
                      required
                    />
                    {passwordError && <FieldError>{passwordError}</FieldError>}
                  </Field>
                )}
                {!hasPassword && passwordError && (
                  <p role="alert" className="text-destructive text-sm">
                    {passwordError}
                  </p>
                )}
              </FieldGroup>
              <DialogFooter className="mt-4">
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={enabling}>
                  <SmartphoneIcon data-icon="inline-start" />
                  {enabling ? "Starting setup…" : "Continue"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Disable dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) setDisableError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication?</DialogTitle>
            <DialogDescription>
              Your account will only require your password to sign in. This
              lowers your account&apos;s security.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisable} noValidate>
            <FieldGroup>
              {hasPassword && (
                <Field>
                  <FieldLabel htmlFor="2fa-disable-password">
                    Current password
                  </FieldLabel>
                  <Input
                    id="2fa-disable-password"
                    type="password"
                    autoComplete="current-password"
                    value={disablePassword}
                    onChange={(e) => {
                      setDisablePassword(e.target.value);
                      setDisableError(null);
                    }}
                    aria-invalid={Boolean(disableError)}
                    required
                  />
                  {disableError && <FieldError>{disableError}</FieldError>}
                </Field>
              )}
              {!hasPassword && disableError && (
                <p role="alert" className="text-destructive text-sm">
                  {disableError}
                </p>
              )}
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={disabling}>
                {disabling ? "Disabling…" : "Disable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Regenerate backup codes dialog ─────────────────────────────── */}
      <Dialog
        open={codesOpen}
        onOpenChange={(open) => {
          setCodesOpen(open);
          if (!open) {
            setNewCodes(null);
            setCodesError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newCodes ? "New backup codes" : "Regenerate backup codes"}
            </DialogTitle>
            <DialogDescription>
              {newCodes
                ? "Your old backup codes no longer work. Store these somewhere safe."
                : hasPassword
                  ? "Confirm your password to generate a new set of backup codes. Your old codes will stop working."
                  : "Generate a new set of backup codes. Your old codes will stop working."}
            </DialogDescription>
          </DialogHeader>
          {newCodes ? (
            <div className="flex flex-col gap-3">
              <div className="border-border rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <TriangleAlertIcon className="size-3.5 shrink-0 text-amber-500" />
                  These are shown only once
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-5">
                  {newCodes.map((bc) => (
                    <span
                      key={bc}
                      className="bg-muted/50 rounded px-1.5 py-0.5 text-center"
                    >
                      {bc}
                    </span>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => void copyText(newCodes.join("\n"))}
                >
                  <CopyIcon data-icon="inline-start" />
                  Copy all
                </Button>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setCodesOpen(false);
                    setNewCodes(null);
                    setCodesError(null);
                  }}
                >
                  <CheckIcon data-icon="inline-start" />I saved my codes
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleGenerateCodes} noValidate>
              <FieldGroup>
                {hasPassword && (
                  <Field>
                    <FieldLabel htmlFor="2fa-codes-password">
                      Current password
                    </FieldLabel>
                    <Input
                      id="2fa-codes-password"
                      type="password"
                      autoComplete="current-password"
                      value={codesPassword}
                      onChange={(e) => {
                        setCodesPassword(e.target.value);
                        setCodesError(null);
                      }}
                      aria-invalid={Boolean(codesError)}
                      required
                    />
                    {codesError && <FieldError>{codesError}</FieldError>}
                  </Field>
                )}
                {!hasPassword && codesError && (
                  <p role="alert" className="text-destructive text-sm">
                    {codesError}
                  </p>
                )}
              </FieldGroup>
              <DialogFooter className="mt-4">
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={generating}>
                  <KeyRoundIcon data-icon="inline-start" />
                  {generating ? "Generating…" : "Generate codes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

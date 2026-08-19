"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
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
import { Switch } from "@/components/ui/switch";

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
async function copyText(text: string, t: (key: string) => string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  } catch {
    toast.error(t("copyFailed"));
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
  const t = useTranslations("twoFactor");
  const tc = useTranslations("common");
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
      setPasswordError(t("enterPasswordToContinue"));
      return;
    }
    setPasswordError(null);
    setEnabling(true);
    const { data, error } = await authClient.twoFactor.enable({
      password: hasPassword ? enablePassword : undefined,
    });
    setEnabling(false);
    if (error) {
      setPasswordError(error.message ?? t("setupStartFailed"));
      return;
    }
    if (!data?.totpURI) {
      setPasswordError(t("noSetupLink"));
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
      setCodeError(t("enterSixDigitCode"));
      return;
    }
    setCodeError(null);
    setVerifying(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: trimmed });
    setVerifying(false);
    if (error) {
      setCodeError(error.message ?? t("codeRejected"));
      return;
    }
    toast.success(t("turnedOn"));
    setEnableOpen(false);
    resetEnable();
    void refetchSession();
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    if (hasPassword && !disablePassword) {
      setDisableError(t("enterPasswordToDisable"));
      return;
    }
    setDisableError(null);
    setDisabling(true);
    const { error } = await authClient.twoFactor.disable({
      password: hasPassword ? disablePassword : undefined,
    });
    setDisabling(false);
    if (error) {
      setDisableError(error.message ?? t("disableFailed"));
      return;
    }
    toast.success(t("turnedOff"));
    setDisableOpen(false);
    setDisablePassword("");
    setDisableError(null);
    void refetchSession();
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    if (hasPassword && !codesPassword) {
      setCodesError(t("enterPasswordForCodes"));
      return;
    }
    setCodesError(null);
    setGenerating(true);
    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password: hasPassword ? codesPassword : undefined,
    });
    setGenerating(false);
    if (error) {
      setCodesError(error.message ?? t("generateCodesFailed"));
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
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="pb-(--card-spacing)">
          <div className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p
                  id="two-factor-label"
                  className="truncate text-sm font-medium"
                >
                  {t("authenticatorApp")}
                </p>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {isEnabled ? t("protectedByCode") : t("scanToGetStarted")}
              </p>
            </div>
            {hasPassword === null ? (
              <Skeleton className="h-9 w-32 shrink-0" />
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                {isEnabled && (
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
                    {t("regenerateCodes")}
                  </Button>
                )}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      resetEnable();
                      setEnableOpen(true);
                    } else {
                      setDisablePassword("");
                      setDisableError(null);
                      setDisableOpen(true);
                    }
                  }}
                  aria-labelledby="two-factor-label"
                />
              </div>
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
              {enableState?.step === "setup" ? t("scanCode") : t("turnOn")}
            </DialogTitle>
            <DialogDescription>
              {enableState?.step === "setup"
                ? t("scanCodeDescription")
                : hasPassword
                  ? t("confirmPasswordToStart")
                  : t("setupDescription")}
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
                          {t("manualEntryHint")}
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
                        onClick={() => void copyText(manualSecret, t)}
                        aria-label={t("copySetupCode")}
                      >
                        <CopyIcon className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-border rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <TriangleAlertIcon className="size-3.5 shrink-0 text-amber-500" />
                    {t("saveBackupCodes")}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t("saveBackupCodesDescription")}
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
                        void copyText(enableState.backupCodes.join("\n"), t)
                      }
                    >
                      <CopyIcon data-icon="inline-start" />
                      {t("copyAll")}
                    </Button>
                  )}
                </div>

                <Field>
                  <FieldLabel htmlFor="2fa-setup-code">
                    {t("authCode")}
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
                    <FieldDescription>{t("codeDescription")}</FieldDescription>
                  )}
                </Field>
              </FieldGroup>
              <DialogFooter className="mt-4">
                <DialogClose render={<Button variant="outline" />}>
                  {tc("cancel")}
                </DialogClose>
                <Button type="submit" disabled={verifying}>
                  {verifying ? t("verifying") : t("enable")}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={startSetup} noValidate>
              <FieldGroup>
                {hasPassword && (
                  <Field>
                    <FieldLabel htmlFor="2fa-enable-password">
                      {t("currentPassword")}
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
                  {tc("cancel")}
                </DialogClose>
                <Button type="submit" disabled={enabling}>
                  <SmartphoneIcon data-icon="inline-start" />
                  {enabling ? t("startingSetup") : t("continue")}
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
            <DialogTitle>{t("turnOffTitle")}</DialogTitle>
            <DialogDescription>{t("turnOffDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisable} noValidate>
            <FieldGroup>
              {hasPassword && (
                <Field>
                  <FieldLabel htmlFor="2fa-disable-password">
                    {t("currentPassword")}
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
                {tc("cancel")}
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={disabling}>
                {disabling ? t("disabling") : t("disable")}
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
              {newCodes ? t("newCodes") : t("regenerateCodes")}
            </DialogTitle>
            <DialogDescription>
              {newCodes
                ? t("newCodesDescription")
                : hasPassword
                  ? t("regenerateConfirmPassword")
                  : t("regenerateDescription")}
            </DialogDescription>
          </DialogHeader>
          {newCodes ? (
            <div className="flex flex-col gap-3">
              <div className="border-border rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <TriangleAlertIcon className="size-3.5 shrink-0 text-amber-500" />
                  {t("shownOnce")}
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
                  onClick={() => void copyText(newCodes.join("\n"), t)}
                >
                  <CopyIcon data-icon="inline-start" />
                  {t("copyAll")}
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
                  <CheckIcon data-icon="inline-start" />
                  {t("savedCodes")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleGenerateCodes} noValidate>
              <FieldGroup>
                {hasPassword && (
                  <Field>
                    <FieldLabel htmlFor="2fa-codes-password">
                      {t("currentPassword")}
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
                  {tc("cancel")}
                </DialogClose>
                <Button type="submit" disabled={generating}>
                  <KeyRoundIcon data-icon="inline-start" />
                  {generating ? t("generating") : t("generateCodes")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

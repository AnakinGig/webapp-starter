"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MailWarningIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/oauth-buttons";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidEmail } from "@/lib/validation";
import { authClient } from "@/lib/auth-client";
import { useConfiguredProviders } from "@/lib/oauth-providers";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const t2 = useTranslations("auth.twoFactor");
  const tc = useTranslations("common");
  const providers = useConfiguredProviders();
  const hasOAuth = (providers?.length ?? 0) > 0;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Two-factor challenge state. After a successful email/password sign-in the
  // plugin replies with `twoFactorRedirect: true` instead of a session; the
  // user then proves the TOTP code (or a backup code) before the session is
  // created.
  const [twoFactor, setTwoFactor] = useState<{
    email: string;
    methods: string[];
  } | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (email && !isValidEmail(email)) {
      setEmailError(t("invalidEmail"));
      return;
    }
    setEmailError(null);
    setFormError(null);

    setLoading(true);
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setFormError(error.message ?? t("invalidCredentials"));
      return;
    }
    // 2FA enabled: the plugin returns `twoFactorRedirect` and no session. The
    // client's inferred type doesn't include the plugin's response fields
    // (twoFactorClient's $InferServerPlugin only augments the user schema), so
    // read them via a minimal cast.
    const signInData = data as typeof data & {
      twoFactorRedirect?: boolean;
      twoFactorMethods?: string[];
    };
    if (signInData.twoFactorRedirect) {
      setTwoFactor({
        email: signInData.user?.email ?? email,
        methods: signInData.twoFactorMethods ?? ["totp"],
      });
      return;
    }
    // You're signed in, but an unverified address is worth flagging before
    // we bounce you to the dashboard.
    if (data?.user?.emailVerified === false) {
      setUnverifiedEmail(data.user.email ?? email);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function submitTwoFactor(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.replace(/\s/g, "");
    if (!trimmed) {
      setCodeError(t2("enterCode"));
      return;
    }
    if (!useBackupCode && !/^\d{6}$/.test(trimmed)) {
      setCodeError(t2("sixDigitCode"));
      return;
    }
    setCodeError(null);
    setVerifying(true);
    // TOTP and backup codes complete the same challenge; the plugin sets the
    // session cookie on success.
    const result = useBackupCode
      ? await authClient.twoFactor.verifyBackupCode({ code: trimmed })
      : await authClient.twoFactor.verifyTotp({
          code: trimmed,
          trustDevice,
        });
    setVerifying(false);
    if (result.error) {
      setCodeError(result.error.message ?? "That code wasn't accepted.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (twoFactor) {
    return (
      <form onSubmit={submitTwoFactor} noValidate>
        <FieldGroup>
          <Alert>
            <ShieldCheckIcon />
            <AlertDescription className="leading-relaxed">
              {t2("enabledOn", { email: twoFactor.email })}
            </AlertDescription>
          </Alert>
          <Field>
            <FieldLabel htmlFor="2fa-code">
              {useBackupCode ? t2("backupCode") : t2("authCode")}
            </FieldLabel>
            <Input
              id="2fa-code"
              inputMode={useBackupCode ? "text" : "numeric"}
              autoComplete={useBackupCode ? "one-time-code" : "one-time-code"}
              placeholder={useBackupCode ? "xxxxx-xxxxx" : "123456"}
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
            ) : useBackupCode ? (
              <FieldDescription>{t2("backupCodeDescription")}</FieldDescription>
            ) : (
              <FieldDescription>{t2("codeRefreshes")}</FieldDescription>
            )}
          </Field>
          {!useBackupCode && (
            <Field>
              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox
                  checked={trustDevice}
                  onCheckedChange={(checked) =>
                    setTrustDevice(checked === true)
                  }
                />
                <span className="text-muted-foreground">
                  {t2("trustDevice")}
                </span>
              </label>
            </Field>
          )}
          <Button type="submit" className="w-full" disabled={verifying}>
            {verifying ? t2("verifying") : t2("verify")}
          </Button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground mx-auto text-xs underline-offset-4 hover:underline"
            onClick={() => {
              setUseBackupCode((v) => !v);
              setCode("");
              setCodeError(null);
            }}
          >
            {useBackupCode ? t2("useAuthCode") : t2("useBackupCode")}
          </button>
        </FieldGroup>
      </form>
    );
  }

  if (unverifiedEmail) {
    return (
      <div className="flex flex-col gap-6">
        <Alert className="border-amber-500/40 *:[svg]:text-amber-500">
          <MailWarningIcon />
          <AlertDescription className="leading-relaxed">
            {t2("unverifiedWarning", { email: unverifiedEmail })}
          </AlertDescription>
        </Alert>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        >
          {t("continueToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        {hasOAuth && (
          <>
            <OAuthButtons />
            <FieldSeparator>{tc("orContinueWithEmail")}</FieldSeparator>
          </>
        )}
        {formError && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="email">{tc("email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
              setFormError(null);
            }}
            onBlur={() => {
              if (email && !isValidEmail(email)) {
                setEmailError(t("invalidEmail"));
              }
            }}
            aria-invalid={Boolean(emailError)}
            required
          />
          {emailError && <FieldError>{emailError}</FieldError>}
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">{tc("password")}</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground font-mono text-xs underline-offset-4 hover:underline"
            >
              {t("forgot")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFormError(null);
            }}
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("signingIn") : tc("signIn")}
        </Button>
      </FieldGroup>
    </form>
  );
}

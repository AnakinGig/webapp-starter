"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MailCheckIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useConfiguredProviders } from "@/lib/oauth-providers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/password-strength";
import {
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  passwordMeetsPolicy,
} from "@/lib/validation";
import { authClient } from "@/lib/auth-client";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const tc = useTranslations("common");
  const providers = useConfiguredProviders();
  const hasOAuth = (providers?.length ?? 0) > 0;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = t("nameRequired");
    }
    if (!isValidEmail(email)) {
      errors.email = t("invalidEmail");
    }
    if (!passwordMeetsPolicy(password)) {
      errors.password = t("passwordPolicyError");
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    setLoading(true);
    const { data, error } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    setLoading(false);
    if (error) {
      const message = error.message ?? t("couldNotCreate");
      if (/email|already exists|taken/i.test(message)) {
        setFieldErrors({ email: message });
      } else {
        setFormError(message);
      }
      return;
    }
    // Email/password signups start unverified - show the confirmation step.
    // Prefer the server-normalized email (better-auth lowercases it).
    setCreatedEmail(data?.user?.email ?? email);
  }

  if (createdEmail) {
    return (
      <div className="flex flex-col gap-6">
        <div className="border-border bg-card flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
          <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
            <MailCheckIcon className="size-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("checkYourEmail")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("verificationSent", { email: createdEmail })}
          </p>
        </div>
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
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        {hasOAuth && (
          <>
            <OAuthButtons />
            <FieldSeparator>{tc("orSignUpWithEmail")}</FieldSeparator>
          </>
        )}
        {formError && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="name">{tc("fullName")}</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            required
          />
          {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
        </Field>
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
              clearFieldError("email");
              setFormError(null);
            }}
            onBlur={() => {
              if (email && !isValidEmail(email)) {
                setFieldErrors((prev) => ({
                  ...prev,
                  email: t("invalidEmail"),
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
          {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{tc("password")}</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            onBlur={() => {
              if (password && !passwordMeetsPolicy(password)) {
                setFieldErrors((prev) => ({
                  ...prev,
                  password: t("passwordPolicyError"),
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          {password && <PasswordStrengthMeter password={password} />}
          {fieldErrors.password && (
            <FieldError>{fieldErrors.password}</FieldError>
          )}
          {!password && !fieldErrors.password && (
            <FieldDescription>
              {t("passwordDescription", { length: PASSWORD_MIN_LENGTH })}
            </FieldDescription>
          )}
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("creating") : tc("createAccount")}
        </Button>
      </FieldGroup>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircleIcon, LinkIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordStrengthMeter } from "@/components/password-strength";
import { PASSWORD_MIN_LENGTH, passwordMeetsPolicy } from "@/lib/validation";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({
  token,
  invalid,
}: {
  token: string | null;
  invalid: boolean;
}) {
  const t = useTranslations("auth.reset");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // An INVALID_TOKEN from better-auth, or a direct visit without a token,
  // means the link is broken - don't show the form at all.
  const [linkInvalid, setLinkInvalid] = useState(invalid || !token);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!newPassword) {
      errors.newPassword = t("enterNewPassword");
    } else if (!passwordMeetsPolicy(newPassword)) {
      errors.newPassword = t("passwordPolicyError");
    }
    if (!confirmPassword) {
      errors.confirm = t("confirmPassword");
    } else if (newPassword !== confirmPassword) {
      errors.confirm = t("passwordsDontMatch");
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword,
      token: token ?? undefined,
    });
    setLoading(false);

    if (error) {
      if (error.code === "INVALID_TOKEN") {
        // The token was consumed or expired between the redirect and submit.
        setLinkInvalid(true);
        return;
      }
      if (
        error.code === "PASSWORD_TOO_SHORT" ||
        /password/i.test(error.message ?? "")
      ) {
        setFieldErrors({
          newPassword: error.message ?? t("passwordPolicyError"),
        });
        return;
      }
      setFormError(
        error.message ?? "Could not reset your password. Try again.",
      );
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <div className="border-border bg-card flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
          <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
            <CheckCircleIcon className="size-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("passwordUpdated")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("passwordUpdatedDescription")}
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          {t("signIn")}
        </Button>
      </div>
    );
  }

  if (linkInvalid) {
    return (
      <div className="flex flex-col gap-6">
        <div className="border-border bg-card flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
          <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
            <LinkIcon className="size-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("invalidLink")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("invalidLinkDescription")}
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          nativeButton={false}
          render={<Link href="/forgot-password" />}
        >
          {t("requestNewLink")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        {formError && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="reset-new-password">
            {t("newPassword")}
          </FieldLabel>
          <Input
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFieldErrors((p) => ({ ...p, newPassword: undefined }));
            }}
            onBlur={() => {
              if (newPassword && !passwordMeetsPolicy(newPassword)) {
                setFieldErrors((p) => ({
                  ...p,
                  newPassword: t("passwordPolicyError"),
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.newPassword)}
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          {newPassword && <PasswordStrengthMeter password={newPassword} />}
          {fieldErrors.newPassword && (
            <FieldError>{fieldErrors.newPassword}</FieldError>
          )}
          {!newPassword && !fieldErrors.newPassword && (
            <FieldDescription>
              {t("passwordDescription", { length: PASSWORD_MIN_LENGTH })}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="reset-confirm-password">
            {t("confirmNewPassword")}
          </FieldLabel>
          <Input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((p) => ({ ...p, confirm: undefined }));
            }}
            onBlur={() => {
              if (confirmPassword && confirmPassword !== newPassword) {
                setFieldErrors((p) => ({
                  ...p,
                  confirm: t("passwordsDontMatch"),
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.confirm)}
            required
          />
          {fieldErrors.confirm && (
            <FieldError>{fieldErrors.confirm}</FieldError>
          )}
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("resetting") : t("resetPassword")}
        </Button>
      </FieldGroup>
    </form>
  );
}

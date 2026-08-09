"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailWarningIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/oauth-buttons";
import {
  Field,
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
  const providers = useConfiguredProviders();
  const hasOAuth = (providers?.length ?? 0) > 0;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (email && !isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
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
      setFormError(error.message ?? "Invalid email or password.");
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

  if (unverifiedEmail) {
    return (
      <div className="flex flex-col gap-6">
        <Alert className="border-amber-500/40 *:[svg]:text-amber-500">
          <MailWarningIcon />
          <AlertDescription className="leading-relaxed">
            You&apos;re signed in, but <strong>{unverifiedEmail}</strong>{" "}
            isn&apos;t verified yet. Check your inbox for the link we sent when
            you signed up, or resend it from Settings → Security.
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
          Continue to dashboard
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
            <FieldSeparator>or continue with email</FieldSeparator>
          </>
        )}
        {formError && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
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
                setEmailError("Enter a valid email address.");
              }
            }}
            aria-invalid={Boolean(emailError)}
            required
          />
          {emailError && <FieldError>{emailError}</FieldError>}
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground font-mono text-xs underline-offset-4 hover:underline"
            >
              Forgot?
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
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}

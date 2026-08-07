"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { MailCheckIcon, TriangleAlertIcon } from "lucide-react"

import { appSettings } from "@/lib/app"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { isValidEmail } from "@/lib/validation"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (email && !isValidEmail(email)) {
      setEmailError("Enter a valid email address.")
      return
    }
    setEmailError(null)
    setFormError(null)
    setSending(true)

    // Proxied to the better-auth instance on Convex. The response is
    // identical whether or not the email has an account (anti-enumeration),
    // and the route is rate-limited server side (1 email per 60s per IP).
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${appSettings.url}/reset-password`,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string
        } | null
        throw new Error(
          body?.message ?? "Could not send a reset link. Try again.",
        )
      }
      setSubmitted(true)
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not send a reset link. Try again.",
      )
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheckIcon className="size-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">Check your email</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If an account exists for <strong>{email}</strong>, we sent a password
            reset link. The link expires after one hour. Don&apos;t see it?
            Check your spam folder.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Back to sign in
        </Button>
      </div>
    )
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
          <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
          <Input
            id="forgot-password-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(null)
              setFormError(null)
            }}
            onBlur={() => {
              if (email && !isValidEmail(email)) {
                setEmailError("Enter a valid email address.")
              }
            }}
            aria-invalid={Boolean(emailError)}
            required
          />
          {emailError && <FieldError>{emailError}</FieldError>}
        </Field>
        <Button type="submit" className="w-full" disabled={sending}>
          {sending ? "Sending..." : "Send reset link"}
        </Button>
      </FieldGroup>
    </form>
  )
}

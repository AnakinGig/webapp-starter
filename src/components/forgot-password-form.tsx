"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { MailCheckIcon, TriangleAlertIcon } from "lucide-react"

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
import { api } from "~/trpc/react"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const requestReset = api.user.requestPasswordReset.useMutation()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (email && !isValidEmail(email)) {
      setEmailError("Enter a valid email address.")
      return
    }
    setEmailError(null)
    setFormError(null)

    requestReset.mutate(
      { email },
      {
        // Anti-enumeration: the success panel is identical whether or not the
        // email has an account, so the form never reveals that.
        onSuccess: () => setSubmitted(true),
        onError: (err) => setFormError(err.message),
      },
    )
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
        <Button type="submit" className="w-full" disabled={requestReset.isPending}>
          {requestReset.isPending ? "Sending..." : "Send reset link"}
        </Button>
      </FieldGroup>
    </form>
  )
}

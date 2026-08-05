"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import {
  CheckCircleIcon,
  LinkIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordStrengthMeter } from "@/components/password-strength"
import {
  PASSWORD_MIN_LENGTH,
  passwordMeetsPolicy,
} from "@/lib/validation"
import { authClient } from "@/server/better-auth/client"

export function ResetPasswordForm({
  token,
  invalid,
}: {
  token: string | null
  invalid: boolean
}) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string
    confirm?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  // An INVALID_TOKEN from better-auth, or a direct visit without a token,
  // means the link is broken - don't show the form at all.
  const [linkInvalid, setLinkInvalid] = useState(invalid || !token)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errors: typeof fieldErrors = {}
    if (!newPassword) {
      errors.newPassword = "Enter a new password."
    } else if (!passwordMeetsPolicy(newPassword)) {
      errors.newPassword = "Password doesn't meet the requirements."
    }
    if (!confirmPassword) {
      errors.confirm = "Confirm your new password."
    } else if (newPassword !== confirmPassword) {
      errors.confirm = "Passwords don't match."
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setFormError(null)

    setLoading(true)
    const { error } = await authClient.resetPassword({
      newPassword,
      token: token ?? undefined,
    })
    setLoading(false)

    if (error) {
      if (error.code === "INVALID_TOKEN") {
        // The token was consumed or expired between the redirect and submit.
        setLinkInvalid(true)
        return
      }
      if (error.code === "PASSWORD_TOO_SHORT" || /password/i.test(error.message ?? "")) {
        setFieldErrors({
          newPassword: error.message ?? "Password doesn't meet the requirements.",
        })
        return
      }
      setFormError(error.message ?? "Could not reset your password. Try again.")
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircleIcon className="size-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">Password updated</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your password has been reset and all sessions were signed out -
            sign in with your new password.
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Sign in
        </Button>
      </div>
    )
  }

  if (linkInvalid) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LinkIcon className="size-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">Invalid or expired link</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This password reset link is invalid or has expired. Request a new
            one to continue.
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          nativeButton={false}
          render={<Link href="/forgot-password" />}
        >
          Request a new link
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
          <FieldLabel htmlFor="reset-new-password">New password</FieldLabel>
          <Input
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setFieldErrors((p) => ({ ...p, newPassword: undefined }))
            }}
            onBlur={() => {
              if (newPassword && !passwordMeetsPolicy(newPassword)) {
                setFieldErrors((p) => ({
                  ...p,
                  newPassword: "Password doesn't meet the requirements.",
                }))
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
              At least {PASSWORD_MIN_LENGTH} characters, with an uppercase
              letter, a number and a symbol.
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="reset-confirm-password">
            Confirm new password
          </FieldLabel>
          <Input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setFieldErrors((p) => ({ ...p, confirm: undefined }))
            }}
            onBlur={() => {
              if (confirmPassword && confirmPassword !== newPassword) {
                setFieldErrors((p) => ({
                  ...p,
                  confirm: "Passwords don't match.",
                }))
              }
            }}
            aria-invalid={Boolean(fieldErrors.confirm)}
            required
          />
          {fieldErrors.confirm && <FieldError>{fieldErrors.confirm}</FieldError>}
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </FieldGroup>
    </form>
  )
}

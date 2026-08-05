"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { MailCheckIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OAuthButtons } from "@/components/oauth-buttons"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordStrengthMeter } from "@/components/password-strength"
import {
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  passwordMeetsPolicy,
} from "@/lib/validation"
import { authClient } from "@/server/better-auth/client"

type FieldErrors = {
  name?: string
  email?: string
  password?: string
}

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const errors: FieldErrors = {}
    if (!name.trim()) {
      errors.name = "Enter your full name."
    }
    if (!isValidEmail(email)) {
      errors.email = "Enter a valid email address."
    }
    if (!passwordMeetsPolicy(password)) {
      errors.password = "Password doesn't meet the requirements."
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError(null)
      return
    }
    setFieldErrors({})
    setFormError(null)

    setLoading(true)
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    })
    setLoading(false)
    if (error) {
      const message = error.message ?? "Could not create your account."
      if (/email|already exists|taken/i.test(message)) {
        setFieldErrors({ email: message })
      } else {
        setFormError(message)
      }
      return
    }
    // Email/password signups start unverified — show the confirmation step.
    setCreatedEmail(email)
  }

  if (createdEmail) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheckIcon className="size-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">
            Check your email
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We sent a verification link to <strong>{createdEmail}</strong>.
            Click it to confirm your address — you can keep using the app
            before you verify. Don&apos;t see it? Check your spam folder, or
            resend from Settings → Security.
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            router.push("/dashboard")
            router.refresh()
          }}
        >
          Continue to dashboard
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <OAuthButtons />
        <FieldSeparator>or sign up with email</FieldSeparator>
        {formError && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clearFieldError("name")
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            required
          />
          {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError("email")
              setFormError(null)
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
          {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError("password")
            }}
            onBlur={() => {
              if (password && !passwordMeetsPolicy(password)) {
                setFieldErrors((prev) => ({
                  ...prev,
                  password: "Password doesn't meet the requirements.",
                }))
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
              At least {PASSWORD_MIN_LENGTH} characters, with an uppercase
              letter, a number and a symbol.
            </FieldDescription>
          )}
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  )
}

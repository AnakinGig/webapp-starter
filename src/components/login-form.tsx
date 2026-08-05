"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OAuthButtons } from "@/components/oauth-buttons"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isValidEmail } from "@/lib/validation"
import { authClient } from "@/server/better-auth/client"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (email && !isValidEmail(email)) {
      setEmailError("Enter a valid email address.")
      return
    }
    setEmailError(null)
    setFormError(null)

    setLoading(true)
    const { error } = await authClient.signIn.email({
      email,
      password,
    })
    setLoading(false)
    if (error) {
      setFormError(error.message ?? "Invalid email or password.")
      return
    }
    toast.success("Signed in.")
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <OAuthButtons />
        <FieldSeparator>or continue with email</FieldSeparator>
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
              setEmail(e.target.value)
              setEmailError(null)
              setFormError(null)
            }}
            aria-invalid={Boolean(emailError)}
            required
          />
          {emailError && <FieldError>{emailError}</FieldError>}
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <button
              type="button"
              className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => toast.info("Password reset is not wired up in this MVP.")}
            >
              Forgot?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setFormError(null)
            }}
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  )
}

"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OAuthButtons } from "@/components/oauth-buttons"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { toast } from "sonner"

export function LoginForm() {
  const [email, setEmail] = useState("demo@acme.dev")
  const [password, setPassword] = useState("password123")

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    toast.success("This is the UI-only sign-in form. Wire it to your auth flow in the host app.")
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <OAuthButtons />
        <FieldSeparator>or continue with email</FieldSeparator>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </FieldGroup>
    </form>
  )
}

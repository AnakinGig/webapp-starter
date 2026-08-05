import Link from "next/link"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth-shell"
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="/forgot-password"
      title="Reset your password"
      description="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <>
          {"Remembered it? "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}

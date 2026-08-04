import Link from "next/link"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth-shell"
import { RegisterForm } from "@/components/register-form"

export const metadata: Metadata = {
  title: "Create account",
}

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="/register"
      title="Create your account"
      description="Set up an account in seconds. No credit card required for the starter."
      footer={
        <>
          {"Already have an account? "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}

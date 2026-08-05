import Link from "next/link"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth-shell"
import { ResetPasswordForm } from "@/components/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams

  return (
    <AuthShell
      eyebrow="/reset-password"
      title="Set a new password"
      description="Choose a strong password you don't use anywhere else."
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
      <ResetPasswordForm token={token ?? null} invalid={error === "INVALID_TOKEN"} />
    </AuthShell>
  )
}

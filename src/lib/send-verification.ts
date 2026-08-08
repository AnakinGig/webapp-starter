/**
 * Sends the verification email for the current user's email address.
 *
 * Proxied to the better-auth instance on Convex (rate-limited server side:
 * 1 email per 60s per IP). The route requires a JSON body with the email -
 * the session is the source of truth for it, and better-auth rejects a body
 * email that doesn't match the session user.
 *
 * Used by both Settings -> Security (email verification card) and
 * Settings -> Profile (change-email gate, which requires a verified email).
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  const res = await fetch("/api/auth/send-verification-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(
      body?.message ?? "Failed to send the verification email.",
    )
  }
}

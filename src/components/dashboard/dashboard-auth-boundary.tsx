"use client"

import { useRouter } from "next/navigation"

import { AuthBoundary, type AuthClient } from "@convex-dev/better-auth/react"

import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Spinner } from "@/components/ui/spinner"

/**
 * True for auth-related Convex errors (missing/invalid session, or the caller
 * no longer has admin access).
 */
function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message
  return (
    message.includes("Unauthenticated") ||
    message.includes("Admin access required") ||
    message.includes("Authentication required")
  )
}

/**
 * Client-side guard for admin pages. When the session disappears while the
 * page is already mounted (e.g. right after sign-out), Convex re-runs the
 * admin queries without a token and `useQuery` throws during render - which
 * would crash the page. AuthBoundary catches those auth errors and redirects
 * to the home page instead.
 */
export function DashboardAuthBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <AuthBoundary
      onUnauth={() => {
        router.replace("/")
      }}
      authClient={authClient as unknown as AuthClient}
      getAuthUserFn={api.users.getCurrentUser}
      isAuthError={isAuthError}
      renderFallback={() => (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      )}
    >
      {children}
    </AuthBoundary>
  )
}

"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { toast } from "sonner"
import {
  CheckIcon,
  KeyRoundIcon,
  LaptopIcon,
  SmartphoneIcon,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PasswordStrengthMeter } from "@/components/password-strength"
import { formatDate } from "@/lib/format"
import {
  PASSWORD_MIN_LENGTH,
  passwordMeetsPolicy,
} from "@/lib/validation"

type ClientSession = {
  id: string
  token: string
  userId: string
  userAgent?: string | null
  ipAddress?: string | null
  createdAt: string | Date
  expiresAt: string | Date
}

function describeDevice(ua?: string | null) {
  if (!ua) return "Unknown device"
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : "Browser"
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS X")
      ? "macOS"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : ua.includes("Linux")
            ? "Linux"
            : "an unknown OS"
  return `${browser} on ${os}`
}

function isMobile(ua?: string | null) {
  return ua
    ? ua.includes("Android") || ua.includes("iPhone") || ua.includes("iPad")
    : false
}

/** Hide placeholder/unspecified IPs (e.g. "::" from local dev) and show the rest. */
function showIp(ip?: string | null) {
  if (!ip || ip === "::" || ip === "0.0.0.0" || ip === "::1" || ip === "127.0.0.1") {
    return ""
  }
  return `${ip} · `
}

export function SecuritySection() {
  const { data: session, refetch: refetchSession } = authClient.useSession()
  const currentToken = session?.session?.token

  // Email verification state
  const [verifySent, setVerifySent] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [sendingVerify, setSendingVerify] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleSendVerification() {
    if (sendingVerify || cooldown > 0) return
    const email = session?.user?.email
    if (!email) return // session still loading - nothing to send to
    setVerifyError(null)
    setVerifySent(false)
    setSendingVerify(true)
    try {
      // Proxied to the better-auth instance on Convex (rate-limited server
      // side: 1 email per 60s per IP). The route requires a JSON body with
      // the email - the session is the source of truth for it.
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
      setVerifySent(true)
      setCooldown(60)
      // The session may not carry the new flag yet - refresh for accuracy.
      void refetchSession()
    } catch (err) {
      setVerifyError(
        err instanceof Error
          ? err.message
          : "Failed to send the verification email.",
      )
    } finally {
      setSendingVerify(false)
    }
  }

  const [sessions, setSessions] = useState<ClientSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingOthers, setRevokingOthers] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [checkingCurrent, setCheckingCurrent] = useState(false)
  const [currentVerified, setCurrentVerified] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    current?: string
    newPassword?: string
    confirm?: string
  }>({})
  // Tracks the latest value so a stale verifyPassword response is ignored.
  const currentPasswordRef = useRef(currentPassword)

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    const { data, error } = await authClient.listSessions()
    setLoadingSessions(false)
    if (error) {
      toast.error(error.message ?? "Failed to load sessions.")
      return
    }
    setSessions(data ?? [])
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  /** Verify the current password against the backend as soon as the user
   *  leaves the field, so the error is shown before submit. */
  async function handleCurrentBlur() {
    const value = currentPasswordRef.current
    if (!value || checkingCurrent) return
    setCheckingCurrent(true)
    try {
      // Proxied to the better-auth instance on Convex (verify-password is
      // intentionally not exposed as a client method).
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        valid?: boolean
        data?: { valid?: boolean }
      }
      const valid =
        res.ok && (body.valid === true || body.data?.valid === true)
      if (currentPasswordRef.current !== value) return // field changed mid-check
      setCheckingCurrent(false)
      setCurrentVerified(valid)
      setFieldErrors((p) => ({
        ...p,
        current: valid ? undefined : "Current password is incorrect.",
      }))
    } catch (e) {
      // Genuine failures (session expired, network) surface as a plain
      // incorrect-password message to the user, but stay visible in the console.
      console.error("Password verification failed:", e)
      if (currentPasswordRef.current !== value) return
      setCheckingCurrent(false)
      setCurrentVerified(false)
      setFieldErrors((p) => ({
        ...p,
        current: "Current password is incorrect.",
      }))
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    const errors: typeof fieldErrors = {}
    if (!currentPassword) {
      errors.current = "Enter your current password."
    }
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

    setChangingPassword(true)
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
    })
    setChangingPassword(false)

    if (error) {
      // Server rejections here are about the current password - show inline.
      setFieldErrors({
        current: error.message ?? "Current password is incorrect.",
      })
      return
    }

    setFieldErrors({})
    setCurrentVerified(false)
    setCurrentPassword("")
    currentPasswordRef.current = ""
    setNewPassword("")
    setConfirmPassword("")
    toast.success("Password updated.")
  }

  async function handleRevoke(token: string) {
    setRevoking(token)
    const { error } = await authClient.revokeSession({ token })
    setRevoking(null)

    if (error) {
      toast.error(error.message ?? "Failed to sign out this session.")
      return
    }
    await loadSessions()
    toast.success("Session signed out.")
  }

  async function handleRevokeOthers() {
    setRevokingOthers(true)
    const { error } = await authClient.revokeOtherSessions()
    setRevokingOthers(false)

    if (error) {
      toast.error(error.message ?? "Failed to sign out other sessions.")
      return
    }
    await loadSessions()
    toast.success("Signed out of all other sessions.")
  }

  const isVerified = session?.user?.emailVerified === true

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>
            Confirm that you own this email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-(--card-spacing)">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">
                  {session?.user?.email}
                </p>
                {isVerified ? (
                  <Badge>Verified</Badge>
                ) : (
                  <Badge variant="secondary">Not verified</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isVerified
                  ? "Your email address is confirmed."
                  : "We'll send a verification link to this address. Links expire after one hour."}
              </p>
              {verifySent && !isVerified && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckIcon className="size-3.5" />
                  Verification email sent - check your inbox.
                </p>
              )}
              {verifyError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {verifyError}
                </p>
              )}
            </div>
            {!isVerified && (
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                disabled={sendingVerify || cooldown > 0}
                onClick={() => void handleSendVerification()}
              >
                {sendingVerify
                  ? "Sending…"
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Send verification email"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Use a strong password you don&apos;t use anywhere else.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordChange} noValidate>
          <CardContent className="pb-(--card-spacing)">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="settings-current-password">
                  Current password
                </FieldLabel>
                <Input
                  id="settings-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    currentPasswordRef.current = e.target.value
                    setCurrentVerified(false)
                    setCheckingCurrent(false)
                    if (fieldErrors.current) {
                      setFieldErrors((p) => ({ ...p, current: undefined }))
                    }
                  }}
                  onBlur={() => void handleCurrentBlur()}
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.current)}
                  required
                />
                {checkingCurrent && !fieldErrors.current ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Spinner className="size-3" aria-hidden="true" />
                    Checking password…
                  </p>
                ) : currentVerified && !fieldErrors.current ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckIcon className="size-3" />
                    Password verified
                  </p>
                ) : fieldErrors.current ? (
                  <FieldError>{fieldErrors.current}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="settings-new-password">
                  New password
                </FieldLabel>
                <Input
                  id="settings-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (fieldErrors.newPassword) {
                      setFieldErrors((p) => ({ ...p, newPassword: undefined }))
                    }
                  }}
                  onBlur={() => {
                    if (newPassword && !passwordMeetsPolicy(newPassword)) {
                      setFieldErrors((p) => ({
                        ...p,
                        newPassword: "Password doesn't meet the requirements.",
                      }))
                    }
                  }}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.newPassword)}
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                />
                {newPassword && (
                  <PasswordStrengthMeter password={newPassword} />
                )}
                {fieldErrors.newPassword && (
                  <FieldError>{fieldErrors.newPassword}</FieldError>
                )}
                {!newPassword && !fieldErrors.newPassword && (
                  <FieldDescription>
                    At least {PASSWORD_MIN_LENGTH} characters, with an
                    uppercase letter, a number and a symbol.
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="settings-confirm-password">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="settings-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirm) {
                      setFieldErrors((p) => ({ ...p, confirm: undefined }))
                    }
                  }}
                  onBlur={() => {
                    if (
                      confirmPassword &&
                      newPassword &&
                      confirmPassword !== newPassword
                    ) {
                      setFieldErrors((p) => ({
                        ...p,
                        confirm: "Passwords don't match.",
                      }))
                    }
                  }}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirm)}
                  required
                />
                {fieldErrors.confirm && (
                  <FieldError>{fieldErrors.confirm}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end border-t border-border">
            <Button
              type="submit"
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              <KeyRoundIcon data-icon="inline-start" />
              {changingPassword ? "Updating…" : "Update password"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Devices that are currently signed in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingSessions ? (
            <div className="flex flex-col gap-3 px-4 py-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No active sessions found.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((s) => {
                const isCurrent = s.token === currentToken
                const DeviceIcon = isMobile(s.userAgent)
                  ? SmartphoneIcon
                  : LaptopIcon
                return (
                  <li
                    key={s.token}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                      <DeviceIcon className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {describeDevice(s.userAgent)}
                        </p>
                        {isCurrent && <Badge>This device</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {showIp(s.ipAddress)}
                        Signed in {formatDate(s.createdAt)}
                      </p>
                    </div>
                    {!isCurrent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={revoking === s.token}
                        onClick={() => void handleRevoke(s.token)}
                      >
                        {revoking === s.token ? "Signing out…" : "Sign out"}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t border-border">
          <p className="text-xs text-muted-foreground">
            You can sign out of any device signed in to your account.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={revokingOthers || sessions.length <= 1}
            onClick={() => void handleRevokeOthers()}
          >
            {revokingOthers
              ? "Signing out…"
              : "Sign out of all other sessions"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

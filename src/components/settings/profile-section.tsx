"use client"

import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { authClient } from "@/server/better-auth/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/format"

export function ProfileSection() {
  const { data: session, refetch: refetchSession } = authClient.useSession()
  const user = session?.user

  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (user) setName(user.name ?? "")
  }, [user])

  const isAdmin = user?.role === "admin"
  const initial = (user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()
  const isUnchanged = !name.trim() || name.trim() === (user?.name ?? "")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === (user?.name ?? "")) return

    setSaving(true)
    const { error } = await authClient.updateUser({ name: trimmed })
    setSaving(false)

    if (error) {
      setNameError(error.message ?? "Failed to update profile.")
      return
    }
    setNameError(null)
    await refetchSession()
    toast.success("Profile updated.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public profile</CardTitle>
        <CardDescription>
          This information is displayed across your workspace.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="pb-(--card-spacing)">
          <FieldGroup>
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-lg">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={user.name ?? "User"} />
                ) : (
                  <AvatarFallback className="rounded-lg text-lg">
                    {initial}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  {user?.name ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="settings-name">Full name</FieldLabel>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(null)
                }}
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <FieldError>{nameError}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="settings-email">Email</FieldLabel>
              <Input
                id="settings-email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                tabIndex={-1}
              />
              <FieldDescription>
                Changing your email isn&apos;t supported yet.
              </FieldDescription>
            </Field>

            <Separator />

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Role</span>
                <Badge variant={isAdmin ? "default" : "secondary"}>
                  {user?.role ?? "user"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Member since</span>
                <span className="tabular-nums">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end border-t border-border">
          <Button type="submit" disabled={saving || isUnchanged}>
            {saving ? "Saving…" : "Update profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

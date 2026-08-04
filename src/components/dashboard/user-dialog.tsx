"use client"

import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DashboardUser, DashboardUserDraft } from "@/components/dashboard/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; undefined when creating. */
  user?: DashboardUser | null
  onSave: (values: DashboardUserDraft, user: DashboardUser | null) => void
}

export function UserDialog({ open, onOpenChange, user, onSave }: Props) {
  const isEdit = Boolean(user)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [banned, setBanned] = useState(false)

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "")
      setEmail(user?.email ?? "")
      setRole(user?.role ?? "member")
      setBanned(user?.banned ?? false)
    }
  }, [open, user])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(
      {
        name,
        email,
        role: role as "admin" | "member",
        banned,
      },
      user ?? null,
    )
    toast.success(isEdit ? "Changes saved." : "User created.")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this user's profile and access."
                : "Create a new user record in your directory."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="user-name">Full name</FieldLabel>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) => {
                  if (value) setRole(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {isEdit && (
              <Field orientation="horizontal">
                <input
                  id="user-banned"
                  type="checkbox"
                  checked={banned}
                  onChange={(e) => setBanned(e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
                <FieldLabel htmlFor="user-banned" className="font-normal">
                  Suspend this user&apos;s access
                </FieldLabel>
              </Field>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

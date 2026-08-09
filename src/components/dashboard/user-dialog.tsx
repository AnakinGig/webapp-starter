"use client";

import { useEffect, useState, type FormEvent } from "react";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidEmail } from "@/lib/validation";
import type {
  DashboardUser,
  DashboardUserDraft,
} from "@/components/dashboard/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; undefined when creating. */
  user?: DashboardUser | null;
  onSave: (values: DashboardUserDraft, user: DashboardUser | null) => void;
  /** Disable the role picker (editing your own account - the API forbids it). */
  disabledRole?: boolean;
  /** Server-side mutation error to display inline. */
  error?: string | null;
  onClearError?: () => void;
  /** True while the create/update mutation is running. */
  pending?: boolean;
};

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSave,
  disabledRole = false,
  error,
  onClearError,
  pending = false,
}: Props) {
  const isEdit = Boolean(user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [localEmailError, setLocalEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setRole(user?.role ?? "user");
      setLocalEmailError(null);
    }
  }, [open, user]);

  // Map server errors to the field they concern; anything else is form-level.
  const emailError =
    error && /email|already exists|taken/i.test(error) ? error : null;
  const roleError =
    error && !emailError && /role|admin/i.test(error) ? error : null;
  const formError = error && !emailError && !roleError ? error : null;
  const emailInvalid = Boolean(emailError ?? localEmailError);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setLocalEmailError("Enter a valid email address.");
      return;
    }
    setLocalEmailError(null);
    onSave(
      {
        name,
        email,
        role: role as "admin" | "user",
      },
      user ?? null,
    );
    // Note: the dialog intentionally stays open - the parent closes it on
    // success, and on failure the server error is shown inline below.
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
                onChange={(e) => {
                  setName(e.target.value);
                  onClearError?.();
                }}
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalEmailError(null);
                  onClearError?.();
                }}
                onBlur={() => {
                  if (email && !isValidEmail(email)) {
                    setLocalEmailError("Enter a valid email address.");
                  }
                }}
                placeholder="you@company.com"
                aria-invalid={emailInvalid}
                required
              />
              {(emailError ?? localEmailError) && (
                <FieldError>{emailError ?? localEmailError}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) => {
                  if (value) {
                    setRole(value);
                    onClearError?.();
                  }
                }}
                disabled={disabledRole}
              >
                <SelectTrigger className="w-full" disabled={disabledRole}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="user" disabled={disabledRole}>
                      User
                    </SelectItem>
                    <SelectItem value="admin" disabled={disabledRole}>
                      Admin
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {roleError && <FieldError>{roleError}</FieldError>}
              {disabledRole && (
                <p className="text-muted-foreground text-xs">
                  You can&apos;t change your own role.
                </p>
              )}
            </Field>
            {formError && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, type ComponentType } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UsersIcon,
  ShieldCheckIcon,
  MailCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { UserDialog } from "@/components/dashboard/user-dialog";
import type {
  DashboardUser,
  DashboardUserDraft,
} from "@/components/dashboard/types";
import { formatDate } from "@/lib/format";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

function initials(name: string | null, email: string) {
  const source = name?.trim() ?? email?.split("@")[0] ?? "U";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
          <Icon className="size-3.5" />
          {label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">
          {loading ? <Skeleton className="h-8 w-12" /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DashboardUser | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<DashboardUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: session, isPending: sessionPending } = authClient.useSession();
  // While the session is missing (initial load, after sign-out, or after being
  // demoted) the admin queries would fail server-side and useQuery throws
  // during render, crashing the page. "skip" disables them until the caller is
  // an admin again.
  const signedIn = session?.user?.role === "admin";

  const usersResult = useQuery(
    api.users.getMany,
    signedIn
      ? { page, pageSize: PAGE_SIZE, query: debouncedQuery || undefined }
      : "skip",
  );

  const stats = useQuery(api.users.getStats, signedIn ? {} : "skip");

  const isSelf = (userId: string) => session?.user.id === userId;

  const createUser = useMutation(api.users.create);
  const updateUser = useMutation(api.users.update);
  const deleteUser = useMutation(api.users.remove);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const users = useMemo(() => usersResult?.data ?? [], [usersResult]);
  const totalPages = usersResult?.totalPages ?? 0;
  const usersLoading = usersResult === undefined;
  const statsLoading = stats === undefined;

  // Session confirmed gone (e.g. after sign-out): the queries are skipped, so
  // render a fallback instead of the admin table. The layout redirects on the
  // next navigation, but this keeps the page usable in the meantime.
  if (!sessionPending && !signedIn) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>Access required</EmptyTitle>
          <EmptyDescription>
            Your session has ended or you no longer have admin access. Sign back
            in to manage users.
          </EmptyDescription>
        </EmptyHeader>
        <Button render={<Link href="/login" />}>Sign in</Button>
      </Empty>
    );
  }

  async function handleSave(
    values: DashboardUserDraft,
    user: DashboardUser | null,
  ) {
    setDialogError(null);
    setSaving(true);
    try {
      if (user) {
        await updateUser({ id: user.id, ...values });
        toast.success("User updated.");
      } else {
        await createUser(values);
        toast.success("User created.");
      }
      setDialogOpen(false);
      setEditing(null);
      setDialogError(null);
    } catch (err) {
      // Keep the dialog open and show the error inline under the relevant
      // field (the dialog maps known messages to fields).
      setDialogError(
        errorMessage(err, "Something went wrong. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser({ id: toDelete.id });
      toast.success("User removed.");
      setToDelete(null);
    } catch (err) {
      // Keep the dialog open and show the failure inline (e.g. the last-admin
      // guard) instead of a toast - errors live with the action, not in a toast.
      setDeleteError(errorMessage(err, "Could not remove this user."));
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setDialogError(null);
    setDialogOpen(true);
  }
  function openEdit(user: DashboardUser) {
    setEditing(user);
    setDialogError(null);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total users"
          value={stats?.total ?? 0}
          icon={UsersIcon}
          loading={statsLoading}
        />
        <StatCard
          label="Admins"
          value={stats?.admins ?? 0}
          icon={ShieldCheckIcon}
          loading={statsLoading}
        />
        <StatCard
          label="Verified"
          value={stats?.verified ?? 0}
          icon={MailCheckIcon}
          loading={statsLoading}
        />
      </div>

      <Card>
        <CardHeader className="border-border gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage the people in your workspace.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users"
                className="w-full pl-8 sm:w-56"
                aria-label="Search users"
              />
            </div>
            <Button onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Add user
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="py-12">
              <div className="flex flex-col gap-3 px-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : users.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No users found</EmptyTitle>
                <EmptyDescription>
                  {debouncedQuery
                    ? "Try a different search term."
                    : "Get started by adding your first user."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-10 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs">
                              {initials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="leading-tight font-medium">
                              {user.name ?? user.email}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${user.name ?? user.email}`}
                              />
                            }
                          >
                            <MoreHorizontalIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => openEdit(user)}>
                                <PencilIcon />
                                Edit
                              </DropdownMenuItem>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <DropdownMenuItem
                                      variant="destructive"
                                      disabled={isSelf(user.id)}
                                      title={
                                        isSelf(user.id)
                                          ? "You cannot delete your own account."
                                          : undefined
                                      }
                                      onClick={() => setToDelete(user)}
                                    >
                                      <Trash2Icon />
                                      Delete
                                    </DropdownMenuItem>
                                  }
                                />
                                {isSelf(user.id) && (
                                  <TooltipContent>
                                    You cannot delete your own account.
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="border-border border-t px-4 py-3">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage((p) => Math.max(1, p - 1));
                          }}
                          aria-disabled={page === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === page}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage((p) => Math.min(totalPages, p + 1));
                          }}
                          aria-disabled={page === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setDialogError(null);
        }}
        user={editing}
        onSave={(values, user) => void handleSave(values, user)}
        disabledRole={Boolean(editing && isSelf(editing.id))}
        error={dialogError}
        onClearError={() => setDialogError(null)}
        pending={saving}
      />

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => {
          if (!o && !deleting) {
            setToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="text-foreground font-medium">
                {toDelete?.name ?? toDelete?.email}
              </span>{" "}
              from your workspace, along with their sessions and linked
              accounts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <TriangleAlertIcon className="size-4 shrink-0" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90 text-white"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

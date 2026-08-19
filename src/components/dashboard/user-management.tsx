"use client";

import Link from "next/link";
import {
  Component,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
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
import { useTranslations } from "next-intl";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

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

/** Shown when the caller isn't an admin (or the session died) - the layout
 *  redirects on the next navigation; this keeps the page usable meanwhile. */
function AccessRequired({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations("admin");
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>{t("accessRequired")}</EmptyTitle>
        <EmptyDescription>{t("accessRequiredDescription")}</EmptyDescription>
      </EmptyHeader>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button render={<Link href="/login" />}>{t("signIn")}</Button>
        {onRetry && (
          <Button type="button" variant="outline" onClick={onRetry}>
            {t("tryAgain")}
          </Button>
        )}
      </div>
    </Empty>
  );
}

/** True for auth-related Convex errors (invalid session, or the caller lost
 *  admin access). Those show the access-required state; anything else is a
 *  genuine failure that gets a generic error state and console logging. */
function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;
  return (
    message.includes("Unauthenticated") ||
    message.includes("Admin access required") ||
    message.includes("Authentication required")
  );
}

/**
 * useQuery THROWS query errors (ConvexError) during render instead of
 * returning them (convex >= 1.43). A rejected admin query (stale session
 * token, session revoked mid-page, admin demoted) would otherwise crash the
 * whole dashboard. This boundary catches those and shows a fallback instead
 * of an error page.
 */
class AdminQueryBoundary extends Component<
  {
    children: ReactNode;
    authenticated: boolean;
    t: (key: string) => string;
  },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Keep genuine failures visible in the console instead of silently
    // converting them into a fallback screen.
    console.error("Dashboard query failed:", error);
  }

  componentDidUpdate(prevProps: { authenticated: boolean }) {
    // Auto-recover: the token was rejected, then a refresh succeeded while
    // the session id stayed the same (so the key didn't remount us) - clear
    // the error and let the queries re-run.
    if (
      this.state.error &&
      !prevProps.authenticated &&
      this.props.authenticated
    ) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      if (isAuthError(this.state.error)) {
        return (
          <AccessRequired onRetry={() => this.setState({ error: null })} />
        );
      }
      const t = this.props.t;
      return (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>{t("somethingWentWrong")}</EmptyTitle>
            <EmptyDescription>{t("loadUsersFailed")}</EmptyDescription>
          </EmptyHeader>
          <Button
            type="button"
            variant="outline"
            onClick={() => this.setState({ error: null })}
          >
            {t("tryAgain")}
          </Button>
        </Empty>
      );
    }
    return this.props.children;
  }
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
  const t = useTranslations("admin");
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const convexAuth = useConvexAuth();

  return (
    // The queries below can throw auth errors during render (useQuery throws
    // query errors instead of returning them) - the boundary turns a rejected
    // admin query into a fallback state. Keying by session id remounts it -
    // clearing any caught error - when the user signs in/out.
    <AdminQueryBoundary
      key={session?.user?.id ?? "anon"}
      authenticated={!convexAuth.isLoading && convexAuth.isAuthenticated}
      t={t}
    >
      <UserManagementInner
        session={session}
        sessionPending={sessionPending}
        convexAuth={convexAuth}
      />
    </AdminQueryBoundary>
  );
}

function UserManagementInner({
  session,
  sessionPending,
  convexAuth,
}: {
  session: ReturnType<typeof authClient.useSession>["data"];
  sessionPending: boolean;
  convexAuth: ReturnType<typeof useConvexAuth>;
}) {
  const t = useTranslations("admin");
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

  // Gate on Convex's BACKEND-VALIDATED auth state (useConvexAuth), not just
  // the cached better-auth session: with a stale token (session revoked,
  // sign-out race) the admin queries would run unauthenticated and useQuery
  // would throw during render. Queries stay skipped until Convex has
  // confirmed the token against the server.
  const signedIn =
    !sessionPending &&
    !convexAuth.isLoading &&
    convexAuth.isAuthenticated &&
    session?.user?.role === "admin";

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

  // Session confirmed gone or the token rejected (e.g. after sign-out): the
  // queries are skipped, so render a fallback instead of the admin table.
  if (!sessionPending && !convexAuth.isLoading && !signedIn) {
    return <AccessRequired />;
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
        toast.success(t("userUpdated"));
      } else {
        await createUser(values);
        toast.success(t("userCreated"));
      }
      setDialogOpen(false);
      setEditing(null);
      setDialogError(null);
    } catch (err) {
      // Keep the dialog open and show the error inline under the relevant
      // field (the dialog maps known messages to fields).
      setDialogError(errorMessage(err, t("somethingWentWrongTryAgain")));
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
      toast.success(t("userRemoved"));
      setToDelete(null);
    } catch (err) {
      // Keep the dialog open and show the failure inline (e.g. the last-admin
      // guard) instead of a toast - errors live with the action, not in a toast.
      setDeleteError(errorMessage(err, t("removeUserFailed")));
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
          label={t("totalUsers")}
          value={stats?.total ?? 0}
          icon={UsersIcon}
          loading={statsLoading}
        />
        <StatCard
          label={t("admins")}
          value={stats?.admins ?? 0}
          icon={ShieldCheckIcon}
          loading={statsLoading}
        />
        <StatCard
          label={t("verified")}
          value={stats?.verified ?? 0}
          icon={MailCheckIcon}
          loading={statsLoading}
        />
      </div>

      <Card>
        <CardHeader className="border-border gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("users")}</CardTitle>
            <CardDescription>{t("managePeople")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchUsers")}
                className="w-full pl-8 sm:w-56"
                aria-label={t("searchUsers")}
              />
            </div>
            <Button onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              {t("addUser")}
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
                <EmptyTitle>{t("noUsers")}</EmptyTitle>
                <EmptyDescription>
                  {debouncedQuery ? t("tryDifferentSearch") : t("addFirstUser")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("user")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("joined")}</TableHead>
                    <TableHead className="w-10 text-right">
                      <span className="sr-only">{t("actions")}</span>
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
                          <Badge variant="secondary">{t("active")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("pending")}</Badge>
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
                                aria-label={t("actionsFor", {
                                  name: user.name ?? user.email,
                                })}
                              />
                            }
                          >
                            <MoreHorizontalIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => openEdit(user)}>
                                <PencilIcon />
                                {t("edit")}
                              </DropdownMenuItem>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <DropdownMenuItem
                                      variant="destructive"
                                      disabled={isSelf(user.id)}
                                      title={
                                        isSelf(user.id)
                                          ? t("cannotDeleteSelf")
                                          : undefined
                                      }
                                      onClick={() => setToDelete(user)}
                                    >
                                      <Trash2Icon />
                                      {t("delete")}
                                    </DropdownMenuItem>
                                  }
                                />
                                {isSelf(user.id) && (
                                  <TooltipContent>
                                    {t("cannotDeleteSelf")}
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
            <AlertDialogTitle>{t("deleteUserTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteUserDescription", {
                name: toDelete?.name ?? toDelete?.email ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <TriangleAlertIcon className="size-4 shrink-0" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90 text-white"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client"

import { useMemo, useState, type ComponentType } from "react"
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
  ShieldCheckIcon,
  MailCheckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { UserDialog } from "@/components/dashboard/user-dialog"
import type { DashboardUser, DashboardUserDraft } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const INITIAL_USERS: DashboardUser[] = [
  {
    id: "user_1",
    name: "Ada Lovelace",
    email: "ada@basis.dev",
    role: "admin",
    banned: false,
    emailVerified: true,
    createdAt: new Date("2025-01-18"),
  },
  {
    id: "user_2",
    name: "Grace Hopper",
    email: "grace@basis.dev",
    role: "member",
    banned: false,
    emailVerified: true,
    createdAt: new Date("2025-02-06"),
  },
  {
    id: "user_3",
    name: "Linus Torvalds",
    email: "linus@basis.dev",
    role: "member",
    banned: false,
    emailVerified: false,
    createdAt: new Date("2025-03-12"),
  },
]

function initials(name: string, email: string) {
  const source = name?.trim() ?? email?.split("@")[0] ?? "U"
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
          <Icon className="size-3.5" />
          {label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">
          {loading ? <Skeleton className="h-8 w-12" /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

export function UserManagement() {
  const [users, setUsers] = useState<DashboardUser[]>(INITIAL_USERS)
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DashboardUser | null>(null)
  const [toDelete, setToDelete] = useState<DashboardUser | null>(null)

  const stats = useMemo(() => {
    const list = users
    return {
      total: list.length,
      admins: list.filter((u) => u.role === "admin").length,
      verified: list.filter((u) => u.emailVerified).length,
    }
  }, [users])

  const filtered = useMemo(() => {
    const list = users
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [users, query])

  function handleSave(values: DashboardUserDraft, user: DashboardUser | null) {
    if (user) {
      setUsers((current) =>
        current.map((entry) =>
          entry.id === user.id
            ? {
                ...entry,
                ...values,
              }
            : entry,
        ),
      )
      return
    }

    setUsers((current) => [
      {
        id: `user_${Date.now()}`,
        createdAt: new Date(),
        emailVerified: false,
        ...values,
      },
      ...current,
    ])
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(user: DashboardUser) {
    setEditing(user)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total users" value={stats.total} icon={UsersIcon} loading={false} />
        <StatCard label="Admins" value={stats.admins} icon={ShieldCheckIcon} loading={false} />
        <StatCard label="Verified" value={stats.verified} icon={MailCheckIcon} loading={false} />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage the people in your workspace.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
          {filtered.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No users found</EmptyTitle>
                <EmptyDescription>
                  {query
                    ? "Try a different search term."
                    : "Get started by adding your first user."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
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
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {initials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : user.emailVerified ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`} />
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
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setToDelete(user)}
                            >
                              <Trash2Icon />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        onSave={handleSave}
      />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{toDelete?.name}</span> from your
              workspace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (!toDelete) return
                setUsers((current) => current.filter((entry) => entry.id !== toDelete.id))
                toast.success("User removed.")
                setToDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

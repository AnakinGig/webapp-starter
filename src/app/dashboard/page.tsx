import { UserManagement } from "@/components/dashboard/user-management"

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Welcome back
        </h1>
      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
           Manage users, roles, and access across your workspace.
         </p>
      </div>
      <UserManagement />
    </div>
  )
}

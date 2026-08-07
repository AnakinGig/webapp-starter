import { redirect } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { fetchAuthQuery } from "@/lib/auth-server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await fetchAuthQuery(api.users.getCurrentUser)

  if (user?.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}

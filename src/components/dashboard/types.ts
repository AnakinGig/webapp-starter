export type DashboardUserRole = "admin" | "user"

export type DashboardUser = {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: boolean | null
  createdAt: Date | string
}

export type DashboardUserDraft = {
  name: string
  email: string
  role: DashboardUserRole
}
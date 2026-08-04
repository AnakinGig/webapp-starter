export type DashboardUserRole = "admin" | "member"

export type DashboardUser = {
  id: string
  name: string
  email: string
  role: DashboardUserRole
  banned: boolean
  emailVerified: boolean
  createdAt: Date | string
}

export type DashboardUserDraft = {
  name: string
  email: string
  role: DashboardUserRole
  banned: boolean
}
"use client"

import { useState } from "react"
import {
  PaletteIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react"

import { authClient } from "@/server/better-auth/client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileSection } from "./profile-section"
import { AppearanceSection } from "./appearance-section"
import { SecuritySection } from "./security-section"

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRoundIcon },
  { id: "appearance", label: "Appearance", icon: PaletteIcon },
  { id: "security", label: "Security", icon: ShieldIcon },
] as const

export type SettingsSectionId = (typeof SECTIONS)[number]["id"]

export function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("profile")
  const { data: session } = authClient.useSession()
  const user = session?.user
  const name = user?.name ?? user?.email ?? "User"
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Manage your profile, appearance and security.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-64">
          <div className="mb-4 hidden items-center gap-3 rounded-lg border border-border p-3 lg:flex">
            <Avatar className="size-10 rounded-lg">
              {user?.image ? (
                <AvatarImage src={user.image} alt={name} />
              ) : (
                <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                aria-current={active === id ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active === id
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {active === "profile" && <ProfileSection />}
          {active === "appearance" && <AppearanceSection />}
          {active === "security" && <SecuritySection />}
        </div>
      </div>
    </div>
  )
}

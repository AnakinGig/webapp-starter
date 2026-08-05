"use client"

import { useTheme } from "next-themes"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const THEMES = [
  {
    id: "light",
    label: "Light",
    description: "Bright and airy",
    icon: SunIcon,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Easy on the eyes",
    icon: MoonIcon,
  },
  {
    id: "system",
    label: "System",
    description: "Follow your device",
    icon: MonitorIcon,
  },
] as const

export function AppearanceSection() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how the app looks for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {THEMES.map(({ id, label, description, icon: Icon }) => {
            const selected = theme === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                aria-pressed={selected}
                className={cn(
                  "relative flex flex-col items-start gap-1.5 rounded-lg border p-4 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-ring bg-accent"
                    : "border-border hover:border-muted-foreground/40 hover:bg-muted",
                )}
              >
                {selected && (
                  <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-3" />
                  </span>
                )}
                <Icon className="size-5" />
                <span className="mt-1 font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Currently using the{" "}
          <span className="font-medium text-foreground">
            {resolvedTheme === "dark" ? "dark" : "light"}
          </span>{" "}
          theme.
        </p>
      </CardContent>
    </Card>
  )
}

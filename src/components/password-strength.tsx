"use client"

import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  PASSWORD_RULES,
  passwordStrength,
} from "@/lib/validation"

const LEVELS = [
  { score: 1, label: "Weak", bar: "bg-red-500", text: "text-red-500" },
  { score: 2, label: "Fair", bar: "bg-amber-500", text: "text-amber-500" },
  { score: 3, label: "Strong", bar: "bg-lime-500", text: "text-lime-500" },
  {
    score: 4,
    label: "Very strong",
    bar: "bg-emerald-500",
    text: "text-emerald-500",
  },
] as const

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password)
  const level = LEVELS.find((l) => l.score === strength.score)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={strength.score}
          className="flex h-1.5 flex-1 gap-1"
        >
          {[1, 2, 3, 4].map((segment) => (
            <span
              key={segment}
              className={cn(
                "h-full flex-1 rounded-full bg-border transition-colors",
                level && strength.score >= segment && level.bar,
              )}
            />
          ))}
        </div>
        {level && (
          <span
            className={cn(
              "min-w-20 text-right text-xs font-medium tabular-nums",
              level.text,
            )}
          >
            {level.label}
          </span>
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password)
          return (
            <li
              key={rule.label}
              aria-label={`${rule.label}: ${
                met ? "requirement met" : "requirement not met"
              }`}
              className={cn(
                "flex items-center gap-1 text-xs",
                met ? "text-muted-foreground" : "text-muted-foreground/60",
              )}
            >
              <CheckIcon
                className={cn(
                  "size-3",
                  met ? "text-emerald-500" : "text-muted-foreground/40",
                )}
              />
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

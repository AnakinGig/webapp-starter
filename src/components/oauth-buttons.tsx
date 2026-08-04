"use client"

import type { ReactNode } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Provider = "google" | "github" | "discord"

const PROVIDERS: { id: Provider; label: string; icon: ReactNode }[] = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
        <path
          fill="currentColor"
          d="M12 10.8v3.6h5.1c-.2 1.3-1.5 3.9-5.1 3.9-3.1 0-5.6-2.5-5.6-5.7S8.9 6.9 12 6.9c1.8 0 2.9.7 3.6 1.4l2.5-2.4C16.5 4.3 14.5 3.4 12 3.4 6.9 3.4 2.8 7.5 2.8 12.6S6.9 21.8 12 21.8c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.1-1.5z"
        />
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z"
        />
      </svg>
    ),
  },
  {
    id: "discord",
    label: "Discord",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
        <path
          fill="currentColor"
          d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.24.5a15 15 0 0 1 4.3 1.4A16 16 0 0 0 4.5 4.9 15 15 0 0 1 8.8 3.5L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.9 8.5.1 12.6.5 16.6a20 20 0 0 0 6 3l.7-1.1a13 13 0 0 1-2.1-1l.5-.4a14 14 0 0 0 12.6 0l.5.4c-.7.4-1.4.7-2.1 1l.7 1.1a20 20 0 0 0 6-3c.5-4.7-.8-8.8-3-12.2zM8.5 14.3c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3zm7 0c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3z"
        />
      </svg>
    ),
  },
]

export function OAuthButtons() {
  function signIn(provider: Provider) {
    toast.info(`${provider} OAuth is UI-only here. Connect it in your app.`)
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {PROVIDERS.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant="outline"
          onClick={() => signIn(p.id)}
          aria-label={`Continue with ${p.label}`}
        >
          <span data-icon="inline-start">{p.icon}</span>
          <span className="sr-only sm:not-sr-only">{p.label}</span>
        </Button>
      ))}
    </div>
  )
}

import Image from "next/image"

import { appSettings } from "@/lib/app"
import { cn } from "@/lib/utils"

/**
 * Brand mark. Renders the image configured in `src/lib/app.ts`
 * (`appSettings.logo.image`) when set, otherwise the built-in geometric mark.
 */
export function Logo({ className }: { className?: string }) {
  const { image } = appSettings.logo

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className={cn("size-7 rounded-md object-contain", className)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      >
        <path d="M5 2H3v12h2M11 2h2v12h-2" />
        <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

import { cn } from "@/lib/utils"

/** Simple geometric brand mark — a bracketed grid node. */
export function Logo({ className }: { className?: string }) {
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

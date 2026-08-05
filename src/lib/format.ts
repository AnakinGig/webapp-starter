/** Format a date like "Aug 5, 2026". */
export function formatDate(d: string | Date | undefined | null) {
  if (!d) return "-"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

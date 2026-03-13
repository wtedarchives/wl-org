import type { StatData } from "@/types/user-stats"

export const SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"] as const

export function formatTimeInterval(interval: string): string {
  const parts = interval.split(":")
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    const seconds = parseInt(parts[2], 10)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
  return interval
}

export function getStatHeaderClassName(type: string): string {
  switch (type) {
    case "topSongs":
      return "bg-muted py-2"
    case "longestPerformances":
      return "bg-muted py-2"
    case "notSeenSongs":
      return "bg-white text-black py-2"
    case "showOpeners":
      return "bg-[#047857] text-white py-2"
    case "setOpeners":
      return "bg-[#10b981] text-white py-2"
    case "setClosers":
      return "bg-[#3b82f6] text-white py-2"
    case "encoreSongs":
      return "bg-[#be123c] text-white py-2"
    default:
      return "bg-muted/60 py-2"
  }
}

/** Returns the header background color for copy button hover (icon color on white bg). */
export function getStatHeaderHoverColor(type: string): string {
  switch (type) {
    case "topSongs":
      return "var(--muted-foreground)"
    case "longestPerformances":
      return "var(--muted-foreground)"
    case "notSeenSongs":
      return "#000000"
    case "showOpeners":
      return "#047857"
    case "setOpeners":
      return "#10b981"
    case "setClosers":
      return "#3b82f6"
    case "encoreSongs":
      return "#be123c"
    default:
      return "var(--muted-foreground)"
  }
}

export function getLoadingMessage(
  isOwnProfile: boolean,
  username?: string | null
): string {
  if (isOwnProfile) {
    return "Loading your stats…"
  }
  return `Loading ${username ? `${username}'s` : "their"} stats…`
}

export function copyStatsToClipboard(
  data: Record<string, unknown>[],
  songNameKey: string,
  countKey: string,
  showLength: boolean,
  title: string,
  type: string
): void {
  const formatTime = (interval: string) => {
    const parts = interval.split(":")
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      const seconds = parseInt(parts[2], 10)
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
    return interval
  }

  const dataText = data
    .map((item) => {
      const value = showLength
        ? formatTime((item.length as string) ?? "")
        : item[countKey]
      if (type === "longestPerformances") {
        return `${value} - ${item[songNameKey]} [${item.show_date} - ${(item.venue_location as string) || "Unknown Venue"}]`
      }
      return `${value} - ${item[songNameKey]}`
    })
    .join("\n")

  const text = title ? `${title}\n\n${dataText}` : dataText
  void navigator.clipboard.writeText(text)
}

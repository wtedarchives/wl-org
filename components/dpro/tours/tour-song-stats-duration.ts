export function parseDuration(interval: string | undefined | null): number | null {
  if (!interval) return null
  const m = interval.match(/^(?:(\d+):)?(\d+):(\d+)$/)
  if (m) {
    const h = parseInt(m[1] || "0", 10)
    const min = parseInt(m[2], 10)
    const sec = parseInt(m[3], 10)
    return h * 3600 + min * 60 + sec
  }
  return null
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function durationToSeconds(d: string | null): number {
  if (!d) return 0
  const parts = d.split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

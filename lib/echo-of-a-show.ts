import {
  formatSetlistDate,
  formatShowDateLongYear,
  formatShowWeekday,
} from "@/lib/setlist-utils"

/** Hardcoded active league — same string as the shipping Setlist Game. */
export const ECHO_ACTIVE_LEAGUE = "2026 Summer [Second Leg]"

export type EchoLockCountdown = {
  days: number
  hours: number
  minutes: number
  isClosed: boolean
  totalMs: number
}

const LOCK_MS_BEFORE_SHOW = 60 * 60 * 1000

export function getEchoLockAt(showTime: string): number {
  return new Date(showTime).getTime() - LOCK_MS_BEFORE_SHOW
}

export function getEchoLockCountdown(
  showTime: string,
  now = Date.now(),
): EchoLockCountdown {
  const lockAt = getEchoLockAt(showTime)
  if (!Number.isFinite(lockAt)) {
    return { days: 0, hours: 0, minutes: 0, isClosed: true, totalMs: 0 }
  }
  const diff = lockAt - now
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isClosed: true, totalMs: 0 }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, minutes, isClosed: false, totalMs: diff }
}

export function formatEchoLockClock(countdown: EchoLockCountdown): string {
  if (countdown.isClosed) return "Locked"
  const hours = String(countdown.hours).padStart(2, "0")
  const minutes = String(countdown.minutes).padStart(2, "0")
  if (countdown.days > 0) return `${countdown.days}d ${hours}h ${minutes}m`
  if (countdown.hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatEchoCompactRemaining(countdown: EchoLockCountdown): string {
  if (countdown.isClosed) return "locked"
  if (countdown.days > 0) {
    return countdown.hours > 0
      ? `${countdown.days}d ${countdown.hours}h`
      : `${countdown.days}d`
  }
  if (countdown.hours > 0) return `${countdown.hours}h ${countdown.minutes}m`
  return `${countdown.minutes}m`
}

export function echoLegShortLabel(league: string): string {
  const bracket = league.match(/\[(.*?)\]/)
  const inner = bracket?.[1]?.trim() ?? ""
  if (/second/i.test(inner)) return "Leg 2"
  if (/first/i.test(inner)) return "Leg 1"
  if (/third/i.test(inner)) return "Leg 3"
  return inner || league
}

export function formatEchoWeekdayShort(showDate: string): string {
  const full = formatShowWeekday(showDate)
  if (!full) return ""
  return `${full.slice(0, 1)}${full.slice(1, 3).toLowerCase()}`
}

export function formatEchoHomeDate(showDate: string): string {
  const weekday = formatEchoWeekdayShort(showDate)
  const long = formatShowDateLongYear(showDate)
  return [weekday, long].filter(Boolean).join(" ")
}

export function formatEchoHeroDate(showDate: string): string {
  const s = String(showDate).trim()
  if (!s) return ""
  const date = new Date(s.includes("T") ? s : `${s}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return formatShowDateLongYear(showDate)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function formatEchoDotDate(showDate: string): string {
  const mmddyy = formatSetlistDate(showDate)
  const parts = mmddyy.split(".")
  if (parts.length === 3 && parts[2].length === 2) {
    return `${parts[0]}.${parts[1]}.20${parts[2]}`
  }
  return mmddyy
}

export function formatEchoShowCrumb(
  showDate: string,
  venueLocation?: string | null,
): string {
  const dateLabel = formatEchoDotDate(showDate)
  const place = venueLocation?.trim()
  return place ? `${dateLabel} (${place})` : dateLabel
}

export function formatEchoMdDate(showDate: string): string {
  const mmddyy = formatSetlistDate(showDate)
  const parts = mmddyy.split(".")
  if (parts.length < 2) return mmddyy
  return `${parts[0]}.${parts[1]}`
}

export function formatEchoShowTimeEt(utcDatetime: string | null | undefined): string {
  if (!utcDatetime) return ""
  const date = new Date(utcDatetime)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatEchoUsername(raw: string | null | undefined): string {
  if (!raw) return ""
  return raw.split("@")[0] ?? raw
}

export function formatEchoOrdinal(n: number): string {
  const abs = Math.abs(n)
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (abs % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

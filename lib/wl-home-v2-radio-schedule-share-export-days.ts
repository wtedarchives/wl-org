/** Today plus the next three local calendar days (share export date picker). */
export const WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_DAY_COUNT = 4

export type RadioScheduleShareExportDayOption = {
  key: string
  day: Date
  label: string
}

export function startOfLocalCalendarDay(d: Date = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addLocalCalendarDays(day: Date, offset: number): Date {
  const x = new Date(day)
  x.setDate(x.getDate() + offset)
  return x
}

export function localCalendarDayKey(day: Date): string {
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, "0")
  const d = String(day.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseLocalCalendarDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return startOfLocalCalendarDay(new Date(y, m - 1, d))
}

export function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return localCalendarDayKey(a) === localCalendarDayKey(b)
}

export function buildRadioScheduleShareExportDayOptions(
  anchor: Date = new Date(),
): RadioScheduleShareExportDayOption[] {
  const today = startOfLocalCalendarDay(anchor)
  const weekdayFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return Array.from(
    { length: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_DAY_COUNT },
    (_, i) => {
      const day = addLocalCalendarDays(today, i)
      return {
        key: localCalendarDayKey(day),
        day,
        label: i === 0 ? "Today" : weekdayFmt.format(day),
      }
    },
  )
}

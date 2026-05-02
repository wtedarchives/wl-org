import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"

export type FlodownEvent = {
  id: string
  month: string
  day: number
  name: string
  venue: string
  location: string
  href: string
}

/** Curated upcoming community / Flodown events (same list as `FlodownEventsCard`). */
export const FLODOWN_EVENTS: readonly FlodownEvent[] = [
  {
    id: "london-flodown-2026-05-22",
    month: "MAY",
    day: 22,
    name: "London Flodown",
    venue: "The English Bar",
    location: "London, GBR",
    href: getSetlistArchiveUrl("20d93ee5-d9ce-490b-97ee-6faaebb18fd1"),
  },
  {
    id: "virginia-beach-flodown-2026-06-15",
    month: "JUN",
    day: 15,
    name: "Virginia Beach Flodown",
    venue: "Hokies Square",
    location: "Virginia Beach, VA",
    href: getSetlistArchiveUrl("334a1bbd-d678-4ca9-823c-8ea8b510cceb"),
  },
]

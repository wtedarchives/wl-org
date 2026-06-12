export interface TourCount {
  tour: string
  count: number
  tour_canonid: number
  tour_id: string
}

export interface AttendanceStatsData {
  showsCount: number
  /** Canonical Goose shows marked attended with show_date after today (local). */
  upcomingShowsCount: number
  venuesCount: number
  songsCount: number
  tourCounts: TourCount[]
  /** Calendar year of the earliest attended canonical Goose show, if any. */
  firstCanonicalShowYear: number | null
}

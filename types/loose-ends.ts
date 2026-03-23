export interface LooseEndRow {
  end: string
  end_description: string
  end_id: string
  end_order: number
  end_category: string | null
  end_visible: boolean
  /** Filename in `/public`, e.g. `badge-autumn.png` */
  end_local_file: string | null
}

export interface LooseEndDisplay extends LooseEndRow {
  isCompleted?: boolean
  progress?: {
    seen: number
    total: number
    percentage: number
  }
}

export type GroupedLooseEnds = Record<string, LooseEndDisplay[]>

export type CategoryProgress = Record<
  string,
  { seen: number; total: number; percentage: number }
>

export interface ShowForLooseEnds {
  show_id: string
  show_canonid: number | null
  show_detail: string | null
  show_year: number | null
  show_date: string | null
  show_tour: string | null
  show_stand: string | null
  show_subvenue: string | null
  show_subvenue_venue: string | null
  show_group: string | null
}

export interface AttendedShowJoined {
  show_id: string
  shows: ShowForLooseEnds | null
}

interface StandInfo {
  completed: boolean
  category: string
}

export type StandsAttended = Record<string, StandInfo>

export interface ShowStatsBundle {
  canonicalShowCount: number
  attendedGlobalShow: boolean
  debutCount: number
  goosemasShowsAttended: Set<string>
  tourCountsMap: Record<string, number>
}

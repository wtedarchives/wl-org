import type { ReactNode } from "react"
import type { SetlistEntry } from "@/types/setlist"

export interface SetlistSongPerformancesPanelProps {
  /** When false, tour-performance fetch stays idle. */
  open: boolean
  /** Called when a navigation link should close the shell (drawer/modal). */
  onDismiss: () => void
  entry: SetlistEntry | null
  /** Human-readable tour name, e.g. "Fall 2024 Tour". */
  tourName: string | null
  /** When provided with tourName, used for tour-page song click (no entry needed). */
  songName?: string | null
  songDisplayName?: string | null
  songId?: string | null
  /** Close control (e.g. DrawerClose-asChild or a plain button). Shown in panel footer when `showFooter`. */
  closeControl?: ReactNode
  /** Optional class on the outer flex column (drawer/modal body). */
  className?: string
  /** When false, omit the song / tour header block (parent supplies chrome). */
  showHeader?: boolean
  /** When false, omit link + close footer (e.g. WL Home v2 modal supplies a shell footer). */
  showFooter?: boolean
  /** WL Home v2: same chrome as main setlist `.set-table` (modal-scoped CSS). */
  wlHomeV2YearsTable?: boolean
}

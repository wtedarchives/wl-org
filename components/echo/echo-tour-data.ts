export type EchoShowStatus = "Scored" | "Live" | "Open" | "Closed"

export type EchoNavId = "tour" | "show" | "tours" | "profile"

export type EchoStandingRow = {
  rank: number
  name: string
  points: number
  isMe: boolean
}

/** Matches `ACTIVE_LEAGUE` in setlist-game-content.tsx (`show_tour`). */
export const ECHO_ACTIVE_LEAGUE = "2026 Summer [Second Leg]"
export const ECHO_TOUR_TITLE = "2026 Summer"
export const ECHO_TOUR_LEG = "[Second Leg]"

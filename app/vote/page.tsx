import type { Metadata } from "next"

import { VotePage } from "@/components/vote/vote-page"

export const metadata: Metadata = {
  title: { absolute: "Vote — Wysteria Lane Community" },
  description: "Vote for the Top 10 Moments from the 2026 Colorado Run.",
}

/** Standalone page: outside `(wl-home-v2)` so it skips SiteShell. */
export default function VoteRoute() {
  return <VotePage />
}

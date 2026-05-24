import type { Metadata } from "next"

import { SongRankingsVisualsPage } from "@/components/dpro/profile/song-rankings-visuals-page"

export const metadata: Metadata = {
  title: "Rankings visuals",
}

export default function RankingsVisualsRoutePage() {
  return <SongRankingsVisualsPage />
}

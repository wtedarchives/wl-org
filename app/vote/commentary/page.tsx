import type { Metadata } from "next"

import { CommentaryPage } from "@/components/vote/commentary-page"

export const metadata: Metadata = {
  title: { absolute: "Record Commentary — Wysteria Lane Community" },
  description: "Record a short commentary from the 2026 Colorado run.",
}

export default function CommentaryRoute() {
  return <CommentaryPage />
}

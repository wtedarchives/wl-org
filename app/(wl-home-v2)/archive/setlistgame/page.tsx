"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Setlist Game is temporarily offline. Netlify `_redirects` also 301s these
 * URLs; this page keeps local/static hits from rendering the game UI.
 * Game components under `components/dpro/setlistgame` are retained.
 */
export default function ArchiveSetlistGamePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/archive")
  }, [router])

  return null
}

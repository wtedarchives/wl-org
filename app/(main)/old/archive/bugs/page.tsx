"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy URL; canonical UI is `/archive/bugs` (see `public/_redirects`). */
export default function LegacyBugsPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/archive/bugs")
  }, [router])

  return null
}

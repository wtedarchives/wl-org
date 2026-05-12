"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy URL; canonical admin UI is `/archive/admin` (see `public/_redirects`). */
export default function LegacyAdminPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    const q =
      typeof window !== "undefined" ? window.location.search ?? "" : ""
    router.replace(q ? `/archive/admin${q}` : "/archive/admin")
  }, [router])

  return null
}

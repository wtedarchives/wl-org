"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy URL; canonical UI is `/archive/admin/radio` (see `public/_redirects`). */
export default function LegacyAdminRadioPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/archive/admin/radio")
  }, [router])

  return null
}

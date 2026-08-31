"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getEchoArchiveIndexUrl } from "@/lib/echo-archive-url"

/** Legacy rebuild slug. Production also 301s via `public/_redirects`. */
export default function ArchiveSetlistGameRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(getEchoArchiveIndexUrl())
  }, [router])

  return null
}

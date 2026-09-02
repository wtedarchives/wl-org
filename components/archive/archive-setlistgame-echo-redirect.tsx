"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { getEchoRedirectFromLegacySetlistGameSearch } from "@/lib/echo-archive-url"

/** Client redirect for legacy `/archive/setlistgame*` (production also 301s via Netlify). */
export function ArchiveSetlistGameEchoRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    router.replace(getEchoRedirectFromLegacySetlistGameSearch(searchParams))
  }, [router, searchParams])

  return null
}

"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

/** Legacy `/old/archive/venue` — canonical detail is `/archive/venue?id=` (preserved query). */
export default function VenueArchivePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const q = searchParams.toString()
    void router.replace(q ? `/archive/venue?${q}` : "/archive/venues")
  }, [router, searchParams])

  return <LoadingPageCard message="Redirecting…" page="venue" />
}

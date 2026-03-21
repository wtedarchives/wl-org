"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { SubmitDialog } from "@/components/dpro/submit-dialog"

/**
 * Renders SubmitDialog as a modal when ?submit=1 is in the URL.
 * Replaces the unsupported intercepting route for static export.
 */
export function SubmitModalHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const showModal = searchParams.get("submit") === "1"

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("submit")
    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname || "/"
    router.replace(url)
  }, [pathname, searchParams, router])

  return (
    <SubmitDialog
      open={showModal}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    />
  )
}

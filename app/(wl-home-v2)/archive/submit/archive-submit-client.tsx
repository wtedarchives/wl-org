"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { SubmitDialog } from "@/components/dpro/submit-dialog"
import { WlHomeV2 } from "@/components/wl-home-v2"

export function ArchiveSubmitClient() {
  const router = useRouter()

  useEffect(() => {
    document.title = "Submit — WTEDRadio.com"
    return () => {
      document.title = "WTEDRadio.com"
    }
  }, [])

  return (
    <>
      <WlHomeV2>
        <span className="sr-only">Submit archive feedback</span>
      </WlHomeV2>
      <SubmitDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) router.push("/archive")
        }}
      />
    </>
  )
}

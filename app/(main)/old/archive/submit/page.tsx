"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { WlHome } from "@/components/wl-home"
import { SubmitDialog } from "@/components/dpro/submit-dialog"

export default function SubmitPage() {
  const router = useRouter()

  useEffect(() => {
    document.title = "Submit — WysteriaLane.org"
    return () => {
      document.title = "WysteriaLane.org"
    }
  }, [])

  return (
    <>
      <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-1 flex-col">
          <WlHome />
        </div>
      </div>
      <SubmitDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) router.push("/")
        }}
      />
    </>
  )
}

"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { usePublicProfileBreadcrumb } from "@/components/public-profile-breadcrumb-context"

function UserProfileRootContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setPublicProfileBreadcrumbLabel } = usePublicProfileBreadcrumb()
  const idRaw = searchParams.get("id")
  const id = idRaw?.trim() ? idRaw.trim() : null

  useEffect(() => {
    if (!id) {
      setPublicProfileBreadcrumbLabel("Profile")
    } else {
      setPublicProfileBreadcrumbLabel("User")
    }
    return () => setPublicProfileBreadcrumbLabel(null)
  }, [id, setPublicProfileBreadcrumbLabel])

  useEffect(() => {
    if (!id) return
    router.replace(
      `/archive/user/overview?id=${encodeURIComponent(id)}`
    )
  }, [id, router])

  if (id) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No user ID provided. Use a share link to view a user&apos;s profile.
        </p>
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      }
    >
      <UserProfileRootContent />
    </Suspense>
  )
}

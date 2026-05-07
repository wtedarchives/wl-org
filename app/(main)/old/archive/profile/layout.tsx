"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { getProfileStatsActiveTab } from "@/components/dpro/profile/profile-stats-tab-config"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { ProfileStatsTabsShell } from "@/components/dpro/profile/profile-stats-tabs-shell"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = getProfileStatsActiveTab(pathname ?? "")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent("/old/archive/profile/overview")}`)
    }
  }, [user, authLoading, router])

  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = async () => {
    if (!user) return
    const url =
      typeof window !== "undefined"
        ? getUserProfileUrl(session?.profileId, window.location.origin)
        : getUserProfileUrl(session?.profileId)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      toast.success("Share link copied to clipboard")
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  if (authLoading) {
    return <LoadingPageCard message="Loading profile…" />
  }

  if (!user) {
    return null
  }

  return (
    <ProfileStatsTabsShell
      activeTab={activeTab}
      title="My Stats"
      tabHref={(slug) => `/old/archive/profile/${slug}`}
      showShareButton
      onShare={handleShare}
      shareCopied={shareCopied}
    >
      {children}
    </ProfileStatsTabsShell>
  )
}

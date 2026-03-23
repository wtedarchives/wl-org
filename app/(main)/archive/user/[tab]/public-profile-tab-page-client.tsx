"use client"

import { useEffect, useState } from "react"
import { notFound, useParams, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { usePublicProfileBreadcrumb } from "@/components/public-profile-breadcrumb-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"
import {
  isProfileStatsTabSlug,
  type ProfileStatsTabSlug,
} from "@/components/dpro/profile/profile-stats-tab-config"
import { ProfileStatsTabsShell } from "@/components/dpro/profile/profile-stats-tabs-shell"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import { supabase } from "@/lib/supabase"

export function PublicProfileTabPageClient() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { setPublicProfileBreadcrumbLabel } = usePublicProfileBreadcrumb()
  const [username, setUsername] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  const rawTab = params.tab
  const idRaw = searchParams.get("id")
  const profileUserId = idRaw?.trim() ? idRaw.trim() : null

  const isOwnProfile = !!(user && profileUserId && user.id === profileUserId)

  useEffect(() => {
    setUsername(null)
  }, [profileUserId])

  useEffect(() => {
    if (!profileUserId) return
    supabase
      ?.from("profiles")
      .select("username")
      .eq("id", profileUserId)
      .single()
      .then(({ data, error }) => {
        if (!error && data?.username) setUsername(data.username)
      })
  }, [profileUserId])

  useEffect(() => {
    if (!profileUserId) {
      setPublicProfileBreadcrumbLabel("Profile")
    } else {
      setPublicProfileBreadcrumbLabel(username ?? "User")
    }
    return () => setPublicProfileBreadcrumbLabel(null)
  }, [
    profileUserId,
    username,
    setPublicProfileBreadcrumbLabel,
  ])

  if (typeof rawTab !== "string" || !isProfileStatsTabSlug(rawTab)) {
    notFound()
  }
  const tab: ProfileStatsTabSlug = rawTab

  const handleShare = async () => {
    if (!user || !profileUserId) return
    const url =
      typeof window !== "undefined"
        ? getUserProfileUrl(profileUserId, window.location.origin)
        : getUserProfileUrl(profileUserId)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      toast.success("Share link copied to clipboard")
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  if (!profileUserId) {
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

  const title = isOwnProfile
    ? "My Stats"
    : `${username ?? "User"}'s Stats`
  const description =
    !isOwnProfile
      ? ""
      : undefined

  const tabHref = (slug: string) =>
    `/archive/user/${slug}?id=${encodeURIComponent(profileUserId)}`

  return (
    <ProfileStatsTabsShell
      activeTab={tab}
      title={title}
      description={description}
      tabHref={tabHref}
      showShareButton={isOwnProfile}
      onShare={isOwnProfile ? handleShare : undefined}
      shareCopied={shareCopied}
    >
      <ProfileStatsTabPanel
        tab={tab}
        userId={profileUserId}
        isOwnProfile={isOwnProfile}
        username={username}
      />
    </ProfileStatsTabsShell>
  )
}

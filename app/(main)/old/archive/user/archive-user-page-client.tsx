"use client"

import { useEffect, useMemo, useState } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { usePublicProfileBreadcrumb } from "@/components/public-profile-breadcrumb-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"
import {
  canonicalProfileStatsTabParam,
  isProfileStatsTabSlug,
  type ProfileStatsTabSlug,
} from "@/components/dpro/profile/profile-stats-tab-config"
import { ProfileStatsTabsShell } from "@/components/dpro/profile/profile-stats-tabs-shell"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import { resolveArchiveUserSearchParams } from "@/lib/resolve-archive-user-search-params"
import { supabase } from "@/lib/supabase"
import { WL_HOME_V2_PROFILE_CONTENT_MAX_CLASS } from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"
import { cn } from "@/lib/utils"
import { useClientMounted } from "@/hooks/use-client-mounted"
import { useHydratedProfileStatsTab } from "@/hooks/use-hydrated-profile-stats-tab"

export default function ArchiveUserPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientMounted = useClientMounted()
  const { session } = useAuth()
  const { setPublicProfileBreadcrumbLabel } = usePublicProfileBreadcrumb()
  const [username, setUsername] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  const { profileUserId, tabRaw, invalidParams } = useMemo(
    () => resolveArchiveUserSearchParams(searchParams),
    [searchParams],
  )

  const structuralTabRaw = clientMounted ? tabRaw : ""

  const tabCanonical = tabRaw ? canonicalProfileStatsTabParam(tabRaw) : ""
  const resolvedProfileTab: ProfileStatsTabSlug =
    !invalidParams && tabCanonical && isProfileStatsTabSlug(tabCanonical) ?
      tabCanonical
    : "overview"
  const displayTab = useHydratedProfileStatsTab(resolvedProfileTab)

  const isOwnProfile = !!(
    session &&
    profileUserId &&
    session.profileId === profileUserId
  )

  useEffect(() => {
    if (invalidParams) return
    if (profileUserId && !tabRaw) {
      router.replace(getUserProfileUrl(profileUserId, undefined, "overview"))
    }
  }, [invalidParams, profileUserId, tabRaw, router])

  useEffect(() => {
    if (invalidParams || !profileUserId || !tabRaw) return
    const canon = canonicalProfileStatsTabParam(tabRaw)
    if (tabRaw !== canon && isProfileStatsTabSlug(canon)) {
      router.replace(getUserProfileUrl(profileUserId, undefined, canon))
    }
  }, [invalidParams, profileUserId, tabRaw, router])

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

  if (invalidParams) notFound()

  if (
    structuralTabRaw &&
    !isProfileStatsTabSlug(canonicalProfileStatsTabParam(structuralTabRaw))
  ) {
    notFound()
  }

  if (profileUserId && !structuralTabRaw) {
    return <LoadingPageCard message="Loading profile…" />
  }

  if (!profileUserId) {
    return (
      <div
        className={cn(
          WL_HOME_V2_PROFILE_CONTENT_MAX_CLASS,
          "flex flex-col gap-6 rounded-b-none p-4 md:rounded-b-xl md:p-6",
        )}
      >
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No user ID provided. Use a share link to view a user&apos;s profile.
          </p>
        </div>
      </div>
    )
  }

  const handleShare = async () => {
    if (!session || !profileUserId) return
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

  const title = isOwnProfile
    ? "My Stats"
    : `${username ?? "User"}'s Stats`
  const description =
    !isOwnProfile
      ? ""
      : undefined

  const tabHref = (slug: string) =>
    getUserProfileUrl(profileUserId, undefined, slug as ProfileStatsTabSlug)

  return (
    <ProfileStatsTabsShell
      activeTab={displayTab}
      title={title}
      description={description}
      tabHref={tabHref}
      showShareButton={isOwnProfile}
      onShare={isOwnProfile ? handleShare : undefined}
      shareCopied={shareCopied}
    >
      <ProfileStatsTabPanel
        tab={displayTab}
        userId={profileUserId}
        isOwnProfile={isOwnProfile}
        username={username}
      />
    </ProfileStatsTabsShell>
  )
}

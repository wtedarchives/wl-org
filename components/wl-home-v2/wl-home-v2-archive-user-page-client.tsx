"use client"

import { useEffect, useMemo, useState } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"
import {
  isProfileStatsTabSlug,
  type ProfileStatsTabSlug,
} from "@/components/dpro/profile/profile-stats-tab-config"
import { ProfileStatsTabsShell } from "@/components/dpro/profile/profile-stats-tabs-shell"
import { useAuth } from "@/components/auth-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  WlHomeV2ProfileArchiveShell,
  WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS,
} from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import { resolveArchiveUserSearchParams } from "@/lib/resolve-archive-user-search-params"
import { supabase } from "@/lib/supabase"
import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import { useHydratedProfileStatsTab } from "@/hooks/use-hydrated-profile-stats-tab"

function profileLoadingInTile(message: string) {
  return (
    <WlHomeV2ProfileArchiveShell>
      <div className="wl-home-v2-profile-archive-suspense-body">
        <WlHomeV2PageLoading message={message} />
      </div>
    </WlHomeV2ProfileArchiveShell>
  )
}

export function WlHomeV2ArchiveUserPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const [username, setUsername] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  const { profileUserId, tabRaw, invalidParams } = useMemo(
    () => resolveArchiveUserSearchParams(searchParams),
    [searchParams],
  )

  const resolvedProfileTab: ProfileStatsTabSlug =
    !invalidParams && tabRaw && isProfileStatsTabSlug(tabRaw) ? tabRaw : "overview"
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

  if (invalidParams) notFound()

  if (tabRaw && !isProfileStatsTabSlug(tabRaw)) {
    notFound()
  }

  if (profileUserId && !tabRaw) {
    return profileLoadingInTile("Loading profile…")
  }

  if (!profileUserId) {
    const crumbs = (
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        bottomSpacing
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={[
              WL_V2_ARCHIVES_BREADCRUMB_ROOT,
              { label: "Profile", href: "/archive" },
            ]}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />
    )
    return (
      <WlHomeV2ProfileArchiveShell crumbs={crumbs}>
        <div className="widget-panel py-10 text-center">
          <p className="text-sm text-white/70">
            No user ID provided. Use a share link to view a user&apos;s profile.
          </p>
        </div>
      </WlHomeV2ProfileArchiveShell>
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

  const title = isOwnProfile ? "My Stats" : `${username ?? "User"}'s Stats`
  const description = !isOwnProfile ? "" : undefined

  const tabHref = (slug: string) =>
    getUserProfileUrl(profileUserId, undefined, slug as ProfileStatsTabSlug)

  const profileCrumbLabel = username ?? "User"
  const profileCrumbs: BreadcrumbItem[] = [
    WL_V2_ARCHIVES_BREADCRUMB_ROOT,
    {
      label: profileCrumbLabel,
      href: getUserProfileUrl(profileUserId),
    },
  ]

  const crumbs = (
    <WlHomeV2ArchiveCrumbsShell
      variant="page-gutter"
      bottomSpacing
      trail={
        <WlHomeV2ArchiveCrumbsTrail
          items={profileCrumbs}
          openArchiveHub={openArchiveHub ?? undefined}
        />
      }
    />
  )

  return (
    <WlHomeV2ProfileArchiveShell crumbs={crumbs}>
      <ProfileStatsTabsShell
        className={WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS}
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
    </WlHomeV2ProfileArchiveShell>
  )
}

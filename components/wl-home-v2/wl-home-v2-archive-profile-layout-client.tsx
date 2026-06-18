"use client"

import { useEffect, useMemo, useState } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { ProfileMyStatsTab } from "@/components/dpro/profile/profile-my-stats-tab"
import { ProfileStatsTabsShell } from "@/components/dpro/profile/profile-stats-tabs-shell"
import {
  canonicalProfileStatsTabParam,
  isProfileStatsTabSlug,
  type ProfileStatsTabSlug,
} from "@/components/dpro/profile/profile-stats-tab-config"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
  WL_HOME_V2_PROFILE_MY_STATS_CRUMB_ITEMS,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useWlHomeV2OpenLogin } from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  WlHomeV2ProfileArchiveShell,
  WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS,
} from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"
import { useClientMounted } from "@/hooks/use-client-mounted"
import { useHydratedProfileStatsTab } from "@/hooks/use-hydrated-profile-stats-tab"

const ARCHIVE_PROFILE_TAB_HREF = (slug: string) =>
  `/archive/profile?tab=${encodeURIComponent(slug)}`

/** Same chrome as the resolved route so Suspense/auth loading hydrates cleanly. */
function ProfileArchiveMyStatsLoadingBody({
  message,
  activeTab,
}: {
  message: string
  activeTab: ProfileStatsTabSlug
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const crumbs = (
    <WlHomeV2ArchiveCrumbsShell
      variant="page-gutter"
      bottomSpacing
      trail={
        <WlHomeV2ArchiveCrumbsTrail
          items={WL_HOME_V2_PROFILE_MY_STATS_CRUMB_ITEMS}
          openArchiveHub={openArchiveHub ?? undefined}
        />
      }
    />
  )
  return (
    <WlHomeV2ProfileArchiveShell crumbs={crumbs}>
      <ProfileStatsTabsShell
        className={WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS}
        activeTab={activeTab}
        title="My Stats"
        tabHref={ARCHIVE_PROFILE_TAB_HREF}
        showShareButton={false}
      >
        <div className="wl-home-v2-profile-archive-suspense-body">
          <WlHomeV2PageLoading message={message} />
        </div>
      </ProfileStatsTabsShell>
    </WlHomeV2ProfileArchiveShell>
  )
}

/**
 * Suspense fallback for `/archive/profile`: same outer chrome as the resolved route.
 * Uses `overview` for tab UI — URL `tab` is applied once `WlHomeV2ArchiveProfileLayoutClient` mounts
 * (avoid `useSearchParams` here: fallbacks are not a valid Suspense boundary for CSR bailout).
 */
export function WlHomeV2ArchiveProfileRouteSuspenseFallback() {
  return (
    <ProfileArchiveMyStatsLoadingBody
      message="Loading profile…"
      activeTab="overview"
    />
  )
}

export function WlHomeV2ArchiveProfileLayoutClient() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const openLogin = useWlHomeV2OpenLogin()
  const clientMounted = useClientMounted()

  const tabRaw = useMemo(
    () => searchParams.get("tab")?.trim() ?? "",
    [searchParams],
  )

  /** Matches static/SSR snapshot (empty query) until mount; avoids shell vs loading-body mismatches. */
  const structuralTabRaw = clientMounted ? tabRaw : ""

  const tabCanonical = useMemo(
    () => (tabRaw ? canonicalProfileStatsTabParam(tabRaw) : ""),
    [tabRaw],
  )

  const resolvedTabForHydration: ProfileStatsTabSlug =
    tabCanonical && isProfileStatsTabSlug(tabCanonical) ? tabCanonical : "overview"
  const displayTab = useHydratedProfileStatsTab(resolvedTabForHydration)

  useEffect(() => {
    if (authLoading || session) return
    openLogin?.()
  }, [session, authLoading, openLogin])

  useEffect(() => {
    if (authLoading || !session) return
    if (!tabRaw) {
      router.replace("/archive/profile?tab=overview", { scroll: false })
    }
  }, [authLoading, session, tabRaw, router])

  useEffect(() => {
    if (authLoading || !session || !tabRaw) return
    const canon = canonicalProfileStatsTabParam(tabRaw)
    if (tabRaw !== canon && isProfileStatsTabSlug(canon)) {
      router.replace(`/archive/profile?tab=${encodeURIComponent(canon)}`, {
        scroll: false,
      })
    }
  }, [authLoading, session, tabRaw, router])

  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = async () => {
    if (!session) return
    const url =
      typeof window !== "undefined"
        ? getUserProfileUrl(session.profileId, window.location.origin)
        : getUserProfileUrl(session.profileId)
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
    return (
      <ProfileArchiveMyStatsLoadingBody
        message="Loading profile…"
        activeTab={displayTab}
      />
    )
  }

  if (!session) {
    return null
  }

  if (
    structuralTabRaw &&
    !isProfileStatsTabSlug(canonicalProfileStatsTabParam(structuralTabRaw))
  ) {
    notFound()
  }

  if (!structuralTabRaw) {
    return (
      <ProfileArchiveMyStatsLoadingBody
        message="Loading profile…"
        activeTab={displayTab}
      />
    )
  }

  const crumbs = (
    <WlHomeV2ArchiveCrumbsShell
      variant="page-gutter"
      bottomSpacing
      trail={
        <WlHomeV2ArchiveCrumbsTrail
          items={WL_HOME_V2_PROFILE_MY_STATS_CRUMB_ITEMS}
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
        title="My Stats"
        tabHref={ARCHIVE_PROFILE_TAB_HREF}
        showShareButton
        onShare={handleShare}
        shareCopied={shareCopied}
      >
        <ProfileMyStatsTab tab={displayTab} />
      </ProfileStatsTabsShell>
    </WlHomeV2ProfileArchiveShell>
  )
}

"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

import "./wl-home-v2-profile-archive-shell.css"

/** Centered profile column cap (profile / user stats only). */
export const WL_HOME_V2_PROFILE_CONTENT_MAX_CLASS =
  "wl-home-v2-profile-archive-content-max w-full min-w-0 max-w-[1440px]"

/** Applied to `ProfileStatsTabsShell` inside {@link WlHomeV2ProfileArchiveShell}. */
export const WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS =
  "wl-home-v2-profile-stats-tabs-shell"

/**
 * Same outer + main-column tile pattern as {@link WlHomeV2SetlistPlaceholderView}.
 * Backdrop uses shared `.wl-home-v2-tile-bg--newbg3` (see `wl-home-v2.css`).
 */
export function WlHomeV2ProfileArchiveShell({
  crumbs,
  children,
  className,
}: {
  crumbs?: ReactNode
  children: ReactNode
  /** Optional class on the root `wl-home-v2-years-page` node. */
  className?: string
}) {
  return (
    <div
      className={cn(
        "wl-home-v2-years-page wl-home-v2-setlist",
        className,
      )}
    >
      <div
        className={cn(
          "wl-home-v2-profile-archive-crumbs-slot",
          !crumbs && "wl-home-v2-profile-archive-crumbs-slot--empty",
        )}
      >
        {crumbs}
      </div>
      <div className="wl-home-v2-years-body">
        <div className="wl-home-v2-years-columns">
          <section
            className="wl-home-v2-years-tile wl-home-v2-years-tile--main wl-home-v2-tile-bg--newbg3"
          >
            <div
              className={cn(
                "wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4",
                "wl-home-v2-profile-archive-tile-inner",
              )}
            >
              <div
                className={cn(
                  WL_HOME_V2_PROFILE_CONTENT_MAX_CLASS,
                  "flex min-h-0 min-w-0 flex-1 flex-col",
                )}
              >
                {children}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export function WlHomeV2ProfileArchiveSuspenseFallback({
  message,
  crumbs,
}: {
  message: string
  /** When set, should match the resolved route’s crumbs to avoid SSR/client breadcrumb drift. */
  crumbs?: ReactNode
}) {
  return (
    <WlHomeV2ProfileArchiveShell crumbs={crumbs}>
      <div className="wl-home-v2-profile-archive-suspense-body">
        <WlHomeV2PageLoading message={message} />
      </div>
    </WlHomeV2ProfileArchiveShell>
  )
}

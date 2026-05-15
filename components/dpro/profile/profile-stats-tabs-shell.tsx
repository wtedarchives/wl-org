"use client"

import Link from "next/link"
import { Check, Share2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { PROFILE_STATS_TABS } from "@/components/dpro/profile/profile-stats-tab-config"
import { WL_HOME_V2_PROFILE_CONTENT_MAX_CLASS } from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"
import { useClientMounted } from "@/hooks/use-client-mounted"
import { cn } from "@/lib/utils"

import "./profile-stats-tabs-shell.css"

export interface ProfileStatsTabsShellProps {
  activeTab: string
  title: string
  description?: string
  tabHref: (slug: string) => string
  showShareButton: boolean
  onShare?: () => void
  shareCopied?: boolean
  children: React.ReactNode
  /** Merged onto the outer shell (e.g. drop padding inside WL Home v2 archive tiles). */
  className?: string
}

export function ProfileStatsTabsShell({
  activeTab,
  title,
  description,
  tabHref,
  showShareButton,
  onShare,
  shareCopied = false,
  children,
  className,
}: ProfileStatsTabsShellProps) {
  const shareChromeMounted = useClientMounted()
  const showShareChrome =
    shareChromeMounted && showShareButton && typeof onShare === "function"

  return (
    <div
      className={cn(
        WL_HOME_V2_PROFILE_CONTENT_MAX_CLASS,
        "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6",
        className,
      )}
    >
      <div className="wl-home-v2-archive-admin-root wl-home-v2-profile-stats-tabs-chrome wl-home-v2-profile-stats-chrome-box">
        <header>
          <div className="wl-home-v2-profile-stats-chrome-title-row">
            <div className="min-w-0 text-center">
              <span
                role="heading"
                aria-level={1}
                className="block text-lg font-semibold"
              >
                {title}
              </span>
            </div>
            {showShareChrome ?
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "wl-home-v2-tours-header-pill shrink-0 gap-1 transition-opacity duration-200 ease-out",
                )}
                onClick={onShare}
                title={shareCopied ? "Copied!" : "Copy share link"}
              >
                {shareCopied ?
                  <>
                    <Check
                      className="size-3.5 shrink-0 text-green-400 opacity-90"
                      aria-hidden
                    />
                    Copied!
                  </>
                : <>
                    <Share2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Share
                  </>
                }
              </button>
            : null}
          </div>
          {description ?
            <p className="max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          : null}
        </header>

        <div className="wl-home-v2-profile-stats-tabs-scroll">
          <nav
            role="tablist"
            aria-label="Profile sections"
            data-slot="tabs-list"
            className="wl-home-v2-archive-admin-tabs-list mx-auto flex h-7 min-h-7 min-w-full w-max flex-nowrap items-center justify-center gap-0.5 p-0.5"
          >
            {PROFILE_STATS_TABS.map((tab) => {
              const isActive = activeTab === tab.slug
              return (
                <Link
                  key={tab.slug}
                  role="tab"
                  aria-selected={isActive}
                  href={tabHref(tab.slug)}
                  prefetch={false}
                  scroll={false}
                  data-slot="tabs-trigger"
                  data-state={isActive ? "active" : "inactive"}
                  className="wl-home-v2-archive-admin-tabs-trigger inline-flex flex-none shrink-0 items-center justify-center text-xs"
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="min-w-0 w-full pb-8">{children}</div>
    </div>
  )
}

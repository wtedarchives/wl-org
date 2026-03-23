"use client"

import Link from "next/link"
import { Check, ChevronDownIcon, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PROFILE_STATS_TABS } from "@/components/dpro/profile/profile-stats-tab-config"

export interface ProfileStatsTabsShellProps {
  activeTab: string
  title: string
  description?: string
  tabHref: (slug: string) => string
  showShareButton: boolean
  onShare?: () => void
  shareCopied?: boolean
  children: React.ReactNode
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
}: ProfileStatsTabsShellProps) {
  const activeLabel =
    PROFILE_STATS_TABS.find((t) => t.slug === activeTab)?.label ?? "Overview"

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{title}</h1>
            {showShareButton && onShare ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1.5"
                onClick={onShare}
                title={shareCopied ? "Copied!" : "Copy share link"}
              >
                {shareCopied ? (
                  <>
                    <Check className="size-3.5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="size-3.5" />
                    Share
                  </>
                )}
              </Button>
            ) : null}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground sm:max-w-none">
              {description}
            </p>
          ) : null}
        </div>
        <Tabs value={activeTab} className="w-full md:w-auto">
          <div className="hidden md:block">
            <TabsList className="h-8 w-full flex-wrap justify-start">
              {PROFILE_STATS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.slug}
                  value={tab.slug}
                  asChild
                  className="text-xs"
                >
                  <Link href={tabHref(tab.slug)}>{tab.label}</Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-auto min-h-11 justify-between gap-1 sm:min-h-8"
              >
                {activeLabel}
                <ChevronDownIcon className="ml-1 size-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {PROFILE_STATS_TABS.map((tab) => (
                <DropdownMenuItem key={tab.slug} asChild>
                  <Link href={tabHref(tab.slug)}>{tab.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </Tabs>
      </div>
      <div className="min-w-0 w-full pb-8">{children}</div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import Link from "next/link"
import { Check, ChevronDownIcon, Share2 } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TABS = [
  { slug: "overview", label: "Overview" },
  { slug: "shows", label: "Shows" },
  { slug: "songs", label: "Songs" },
  { slug: "slots", label: "Slots" },
  { slug: "personnel", label: "Personnel" },
  { slug: "loose-ends", label: "Loose Ends" },
] as const

function getActiveTab(pathname: string): string {
  const segment = pathname.split("/").pop()
  if (segment && TABS.some((t) => t.slug === segment)) {
    return segment
  }
  return "overview"
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = getActiveTab(pathname ?? "")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent("/archive/profile/overview")}`)
    }
  }, [user, authLoading, router])

  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = async () => {
    if (!user) return
    const url =
      typeof window !== "undefined"
        ? getUserProfileUrl(user.id, window.location.origin)
        : getUserProfileUrl(user.id)
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
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const activeLabel = TABS.find((t) => t.slug === activeTab)?.label ?? "Overview"

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex shrink-0 items-center gap-2">
          <h1 className="text-lg font-semibold">My Stats</h1>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5"
            onClick={handleShare}
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
        </div>
        <Tabs value={activeTab} className="w-full md:w-auto">
          <div className="hidden md:block">
            <TabsList className="h-8 w-full flex-wrap justify-start">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.slug}
                  value={tab.slug}
                  asChild
                  className="text-xs"
                >
                  <Link href={`/archive/profile/${tab.slug}`}>{tab.label}</Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-auto justify-between gap-1"
              >
                {activeLabel}
                <ChevronDownIcon className="ml-1 size-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {TABS.map((tab) => (
                <DropdownMenuItem key={tab.slug} asChild>
                  <Link href={`/archive/profile/${tab.slug}`}>{tab.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </Tabs>
      </div>
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}

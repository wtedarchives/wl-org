"use client"

import { Suspense, useEffect, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminSetlist } from "./admin-setlist"
import { AdminArtist } from "./admin-artist"
import { AdminSong } from "./admin-song"
import { AdminGuest } from "./admin-guest"
import { AdminShow } from "./admin-show"
import { AdminChanges } from "./admin-changes"
import { AdminReleases } from "./admin-releases"
import { AdminMedia } from "./admin-media"
import { AdminVenue } from "./admin-venue"
import { AdminSubvenue } from "./admin-subvenue"
import { AdminWted } from "./admin-wted"
import { AdminDiscography } from "./admin-discography"

const TABS = [
  "Setlist",
  "Artist",
  "Song",
  "Personnel",
  "Show",
  "Changes",
  "Releases",
  "Discography",
  "Media",
  "Venue",
  "Subvenue",
  "WTED",
] as const

export function AdminPanel() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [userCount, setUserCount] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{
    type: "success" | "error" | null
    message: string | null
  }>({ type: null, message: null })
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "Setlist"
    const stored = localStorage.getItem("adminActiveTab") || "Setlist"
    const migrated = stored === "Guest" ? "Personnel" : stored
    return migrated as (typeof TABS)[number]
  })

  useEffect(() => {
    if (!token) return
    void (async () => {
      const { data, error } = await invokeDproAdmin<{ count: number }>(token, {
        action: "profiles_count",
      })
      if (!error && data) setUserCount(data.count ?? 0)
    })()
  }, [token])

  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab)
  }, [activeTab])

  const handleUpdateStatistics = async () => {
    if (!token) return
    setIsUpdating(true)
    setUpdateStatus({ type: null, message: null })
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "rpc_update_all_setlist_entries",
      })
      if (error) throw new Error(error)
      setUpdateStatus({ type: "success", message: "Success!" })
      setTimeout(() => setUpdateStatus({ type: null, message: null }), 3000)
    } catch (err) {
      setUpdateStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to update statistics.",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="wl-home-v2-archive-admin-root wl-home-v2-archive-admin-root--panel">
      <div className="wl-home-v2-archive-admin-tools-row">
        <div className="wl-home-v2-archive-admin-tools-lead">
          <h2 className="wl-home-v2-archive-admin-heading">Admin Panel</h2>
          {userCount != null && (
            <Badge variant="secondary" className="wl-home-v2-archive-admin-user-badge">
              {userCount.toLocaleString()} {userCount === 1 ? "user" : "users"}
            </Badge>
          )}
        </div>
        <button
          type="button"
          className={
            "wbtn primary wl-home-v2-archive-admin-update-btn" +
            (updateStatus.type === "success"
              ? " wl-home-v2-archive-admin-update-btn--success"
              : "")
          }
          onClick={() => void handleUpdateStatistics()}
          disabled={isUpdating || updateStatus.type === "success"}
          title="Update all setlist entries statistics"
        >
          {isUpdating ?
            "Waiting…"
          : updateStatus.type === "success" ?
            updateStatus.message
          : "Update"}
        </button>
      </div>

      {updateStatus.type === "error" && (
        <div className="wl-home-v2-archive-admin-banner wl-home-v2-archive-admin-banner--error">
          <p className="wl-home-v2-archive-admin-banner-text">
            Error: {updateStatus.message}
          </p>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])}
      >
        <div className="wl-home-v2-archive-admin-tabs-toolbar">
          <h2 className="wl-home-v2-archive-admin-subheading">Manage Data</h2>
          <div className="wl-home-v2-archive-admin-tabs-toolbar-trail">
            <div className="wl-home-v2-archive-admin-tabs-desktop">
              <TabsList className="h-8 w-full flex-wrap justify-start">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="text-xs">
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="wl-home-v2-archive-admin-tabs-mobile-trigger">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-auto justify-between gap-1"
                >
                  {activeTab}
                  <ChevronDownIcon className="ml-1 size-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="wl-home-v2-archive-admin-portal-content w-40"
              >
                {TABS.map((tab) => (
                  <DropdownMenuItem
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="wl-home-v2-archive-admin-tabs-panel">
          <TabsContent value="Setlist" className="mt-0 w-full p-3 sm:p-4">
            <Suspense
              fallback={
                <div className="wl-home-v2-archive-admin-tab-fallback">
                  Loading setlist admin…
                </div>
              }
            >
              <AdminSetlist />
            </Suspense>
          </TabsContent>
          <TabsContent value="Artist" className="mt-0 w-full p-3 sm:p-4">
            <AdminArtist />
          </TabsContent>
          <TabsContent value="Song" className="mt-0 w-full p-3 sm:p-4">
            <AdminSong />
          </TabsContent>
          <TabsContent value="Personnel" className="mt-0 w-full p-3 sm:p-4">
            <AdminGuest />
          </TabsContent>
          <TabsContent value="Show" className="mt-0 w-full p-3 sm:p-4">
            <AdminShow />
          </TabsContent>
          <TabsContent value="Changes" className="mt-0 w-full p-3 sm:p-4">
            <AdminChanges />
          </TabsContent>
          <TabsContent value="Releases" className="mt-0 w-full p-3 sm:p-4">
            <AdminReleases />
          </TabsContent>
          <TabsContent value="Discography" className="mt-0 w-full p-3 sm:p-4">
            <AdminDiscography />
          </TabsContent>
          <TabsContent value="Media" className="mt-0 w-full p-3 sm:p-4">
            <AdminMedia />
          </TabsContent>
          <TabsContent value="Venue" className="mt-0 w-full p-3 sm:p-4">
            <AdminVenue />
          </TabsContent>
          <TabsContent value="Subvenue" className="mt-0 w-full p-3 sm:p-4">
            <AdminSubvenue />
          </TabsContent>
          <TabsContent value="WTED" className="mt-0 w-full p-3 sm:p-4">
            <AdminWted />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

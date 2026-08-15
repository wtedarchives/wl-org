"use client"

import { Suspense, useEffect, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ADMIN_PANEL_ACTIVE_TAB_STORAGE_KEY,
  ADMIN_PANEL_TABS,
  isAdminPanelTab,
  type AdminPanelTab,
} from "@/components/dpro/admin/admin-panel.constants"
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
import { AdminBandcamp } from "./admin-bandcamp"
import { AdminDiscography } from "./admin-discography"
import { AdminPoster } from "./admin-poster"
import { AdminBrains } from "./admin-brains"

export function AdminPanel() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [profileCountLine, setProfileCountLine] = useState("…")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{
    type: "success" | "error" | null
    message: string | null
  }>({ type: null, message: null })
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "Setlist"
    const stored =
      localStorage.getItem(ADMIN_PANEL_ACTIVE_TAB_STORAGE_KEY) || "Setlist"
    const migrated = stored === "Guest" ? "Personnel" : stored
    return isAdminPanelTab(migrated) ? migrated : "Setlist"
  })

  useEffect(() => {
    if (!supabase) {
      setProfileCountLine("—")
      return
    }
    void supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (error) {
          setProfileCountLine("—")
          return
        }
        const n = count ?? 0
        setProfileCountLine(
          `${n.toLocaleString()} ${n === 1 ? "user" : "users"}`,
        )
      })
  }, [])

  useEffect(() => {
    localStorage.setItem(ADMIN_PANEL_ACTIVE_TAB_STORAGE_KEY, activeTab)
  }, [activeTab])

  const handleUpdateStatistics = async () => {
    if (!token) return
    setIsUpdating(true)
    setUpdateStatus({ type: null, message: null })
    try {
      const { data, error } = await invokeDproAdmin<{
        ran: boolean
        reason?: "cooldown" | "in_progress"
      }>(token, { action: "rpc_update_all_setlist_entries" })
      if (error) throw new Error(error)
      // Serialized by a global advisory lock (one rebuild at a time). Admins
      // skip the 90s Brains cooldown, but a click while one is mid-flight
      // still does nothing — reporting "Success!" for that would be a lie.
      if (data && data.ran === false) {
        setUpdateStatus({
          type: "success",
          message:
            data.reason === "in_progress"
              ? "Already running"
              : "Already current",
        })
      } else {
        setUpdateStatus({ type: "success", message: "Success!" })
      }
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
      <div className="widget-panel wl-home-v2-archive-admin-ops-panel">
        <div className="wp-head wl-home-v2-archive-admin-ops-head">
          <span className="wl-home-v2-archive-admin-ops-title">Admin panel</span>
          <span className="wp-head-right wl-home-v2-archive-admin-ops-head-trail">
            <Badge
              variant="secondary"
              className="wl-home-v2-archive-admin-user-badge wl-home-v2-archive-admin-ops-user-pill"
            >
              {profileCountLine}
            </Badge>
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
          </span>
        </div>
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
        onValueChange={(v) => setActiveTab(v as AdminPanelTab)}
      >
        <div className="wl-home-v2-archive-admin-tabs-toolbar">
          <div className="wl-home-v2-archive-admin-tabs-scroll">
            <TabsList className="wl-home-v2-archive-admin-tabs-list mx-auto h-7 min-h-7 min-w-full w-max flex-nowrap justify-center gap-0.5 p-0.5">
              {ADMIN_PANEL_TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="wl-home-v2-archive-admin-tabs-trigger flex-none shrink-0 text-xs"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
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
          <TabsContent value="Poster" className="mt-0 w-full p-3 sm:p-4">
            <AdminPoster />
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
          <TabsContent value="Bandcamp" className="mt-0 w-full p-3 sm:p-4">
            <AdminBandcamp />
          </TabsContent>
          <TabsContent value="Brains" className="mt-0 w-full p-3 sm:p-4">
            <AdminBrains />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

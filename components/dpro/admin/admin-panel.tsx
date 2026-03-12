"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
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

const TABS = [
  "Setlist",
  "Artist",
  "Song",
  "Personnel",
  "Show",
  "Changes",
  "Releases",
  "Media",
  "Venue",
  "Subvenue",
  "WTED",
] as const

export function AdminPanel() {
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
    if (!supabase) return
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (!error) setUserCount(count ?? 0)
      })
  }, [])

  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab)
  }, [activeTab])

  const handleUpdateStatistics = async () => {
    if (!supabase) return
    setIsUpdating(true)
    setUpdateStatus({ type: null, message: null })
    try {
      const { error } = await supabase.rpc("update_all_setlist_entries")
      if (error) throw error
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
    <div className="w-full space-y-4 xl:mx-auto xl:max-w-[1024px]">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <h2 className="text-md font-semibold">Admin Panel</h2>
          {userCount != null && (
            <Badge variant="secondary">
              {userCount.toLocaleString()} {userCount === 1 ? "user" : "users"}
            </Badge>
          )}
        </div>
        <Button
          onClick={handleUpdateStatistics}
          disabled={isUpdating || updateStatus.type === "success"}
          variant={updateStatus.type === "success" ? "secondary" : "default"}
          size="sm"
          title="Update all setlist entries statistics"
        >
          {isUpdating
            ? "Waiting..."
            : updateStatus.type === "success"
              ? updateStatus.message
              : "Update"}
        </Button>
      </div>

      {updateStatus.type === "error" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Error: {updateStatus.message}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])}
      >
        <div className="flex flex-row items-center justify-between gap-4">
          <h2 className="shrink-0 text-sm font-semibold">Manage Data</h2>
          <div className="ml-auto flex shrink-0 gap-2">
            <div className="hidden xl:block">
              <TabsList className="h-8 w-full flex-wrap justify-start">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="text-xs">
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="xl:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-auto justify-between gap-1"
                >
                  {activeTab}
                  <ChevronDownIcon className="ml-1 size-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
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

        <div className="mt-4 w-full overflow-x-auto rounded-lg border">
          <TabsContent value="Setlist" className="mt-0 w-full p-3 sm:p-4">
            <AdminSetlist />
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

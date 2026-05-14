"use client"

import "./admin-radio-tabs.css"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminRadioEpisodeSetlistsPanel } from "@/components/dpro/admin/admin-radio-episode-setlists-panel"
import { AdminRadioPlaylistsPanel } from "@/components/dpro/admin/admin-radio-playlists-panel"
import { AdminRadioTracksPanel } from "@/components/dpro/admin/admin-radio-tracks-panel"

type AdminRadioSection = "tracks" | "playlists" | "episode-setlists"

export function AdminRadio() {
  const [section, setSection] = useState<AdminRadioSection>("tracks")

  return (
    <div
      className={
        "wl-home-v2-archive-admin-root wl-home-v2-archive-admin-root--radio" +
        (section === "episode-setlists" ?
          " wl-home-v2-archive-admin-root--radio-wide"
        : "")
      }
    >
      <h1 className="wl-home-v2-archive-admin-heading">WTED Radio Admin</h1>
      <Tabs
        value={section}
        onValueChange={(v) => setSection(v as AdminRadioSection)}
      >
        <div className="wl-home-v2-archive-admin-tabs-toolbar">
          <div className="wl-home-v2-archive-admin-tabs-scroll">
            <TabsList className="wl-home-v2-archive-admin-tabs-list mx-auto h-7 min-h-7 min-w-full w-max flex-nowrap justify-center gap-0.5 p-0.5">
              <TabsTrigger
                value="tracks"
                className="wl-home-v2-archive-admin-tabs-trigger flex-none shrink-0 text-xs"
              >
                Tracks
              </TabsTrigger>
              <TabsTrigger
                value="playlists"
                className="wl-home-v2-archive-admin-tabs-trigger flex-none shrink-0 text-xs"
              >
                Playlists
              </TabsTrigger>
              <TabsTrigger
                value="episode-setlists"
                className="wl-home-v2-archive-admin-tabs-trigger flex-none shrink-0 text-xs"
              >
                Episode Setlists
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="wl-home-v2-archive-admin-tabs-panel">
          <TabsContent
            value="tracks"
            className="mt-0 min-h-0 w-full p-3 transition-opacity duration-200 ease-out sm:p-4"
          >
            <AdminRadioTracksPanel />
          </TabsContent>
          <TabsContent
            value="playlists"
            className="mt-0 min-h-0 w-full p-3 transition-opacity duration-200 ease-out sm:p-4"
          >
            <AdminRadioPlaylistsPanel />
          </TabsContent>
          <TabsContent
            value="episode-setlists"
            className="mt-0 min-h-0 w-full p-3 transition-opacity duration-200 ease-out sm:p-4"
          >
            <AdminRadioEpisodeSetlistsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

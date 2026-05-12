"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
      <div className="wl-home-v2-archive-admin-radio-toolbar">
        <div className="wl-home-v2-archive-admin-radio-field">
          <span className="wl-home-v2-archive-admin-field-label">View</span>
          <Select
            value={section}
            onValueChange={(v) => setSection(v as AdminRadioSection)}
          >
            <SelectTrigger className="wl-home-v2-archive-admin-select-trigger h-10 w-full min-w-[12rem] sm:w-[14rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="wl-home-v2-archive-admin-portal-content">
              <SelectItem value="tracks">Tracks</SelectItem>
              <SelectItem value="playlists">Playlists</SelectItem>
              <SelectItem value="episode-setlists">Episode Setlists</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="wl-home-v2-archive-admin-radio-body min-h-0 transition-opacity duration-200 ease-out">
        {section === "tracks" ?
          <AdminRadioTracksPanel />
        : section === "playlists" ?
          <AdminRadioPlaylistsPanel />
        : <AdminRadioEpisodeSetlistsPanel />}
      </div>
    </div>
  )
}

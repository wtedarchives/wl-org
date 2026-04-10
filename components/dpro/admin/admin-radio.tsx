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
import { cn } from "@/lib/utils"

type AdminRadioSection = "tracks" | "playlists" | "episode-setlists"

export function AdminRadio() {
  const [section, setSection] = useState<AdminRadioSection>("tracks")

  return (
    <div
      className={cn(
        "w-full min-w-0 space-y-4",
        section !== "episode-setlists" && "xl:mx-auto xl:max-w-[1024px]",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            View
          </label>
          <Select
            value={section}
            onValueChange={(v) => setSection(v as AdminRadioSection)}
          >
            <SelectTrigger className="h-10 w-full min-w-[12rem] sm:w-[14rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tracks">Tracks</SelectItem>
              <SelectItem value="playlists">Playlists</SelectItem>
              <SelectItem value="episode-setlists">Episode Setlists</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 transition-opacity duration-200 ease-out">
        {section === "tracks" ?
          <AdminRadioTracksPanel />
        : section === "playlists" ?
          <AdminRadioPlaylistsPanel />
        : <AdminRadioEpisodeSetlistsPanel />}
      </div>
    </div>
  )
}

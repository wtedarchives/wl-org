"use client"

import { useState } from "react"
import { useAdminSetlist } from "@/hooks/use-admin-setlist"
import type { AdminSetlistEntryData, ShowData } from "@/types/admin"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { MainHeader } from "./setlist/main-header"
import { ShowHeader } from "./setlist/show-header"
import { SetlistShareCaptureProvider } from "./setlist/setlist-share-capture"
import { SetlistShowEventActions } from "./setlist/setlist-show-event-actions"
import { SetlistTable } from "./setlist/setlist-table"

import { SetlistEntryModal } from "./setlist-entry-modal"
import { AdminTabShell } from "./admin-tab-shell"

export function AdminSetlist() {
  const {
    shows,
    setlistEntries,
    selectedShow,
    loading,
    loadingProgress,
    handleShowSelect,
    fetchSetlistEntries,
  } = useAdminSetlist()
  const [selectedEntry, setSelectedEntry] = useState<AdminSetlistEntryData | null>(
    null,
  )
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isNewEntry, setIsNewEntry] = useState(false)
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "processing" | "done" | "error"
  >("idle")

  const handleEntrySelect = (entry: AdminSetlistEntryData) => {
    setSelectedEntry(entry)
    setIsNewEntry(false)
    setIsEntryModalOpen(true)
  }

  const handleCreateNewEntry = () => {
    if (!selectedShow) return
    const newEntry: AdminSetlistEntryData = {
      entry_id: "",
      entry_set:
        setlistEntries.length > 0
          ? setlistEntries[setlistEntries.length - 1].entry_set
          : "",
      entry_setnum:
        setlistEntries.length > 0
          ? setlistEntries[setlistEntries.length - 1].entry_setnum + 1
          : 1,
      entry_setorder: 0,
      entry_song: "",
      entry_short: null,
      entry_segue: null,
      entry_length: null,
      entry_placement: null,
      entry_coachnotes: null,
      entry_new: "FALSE",
      entry_show: selectedShow.show_id,
    }
    setSelectedEntry(newEntry)
    setIsNewEntry(true)
    setIsEntryModalOpen(true)
  }

  const handleSaveEntry = () => {
    if (selectedShow) fetchSetlistEntries(selectedShow.show_id)
    setIsEntryModalOpen(false)
  }

  const handleSaveStatusUpdate = (
    status: "idle" | "processing" | "done" | "error",
  ) => {
    setSaveStatus(status)
    if (status === "done") setTimeout(() => setSaveStatus("idle"), 2000)
  }

  return (
    <AdminTabShell>
      {/* Offscreen setlist share card — End Show posts it to Instagram.
          Bluesky song-image capture from this card is commented out. */}
      <SetlistShareCaptureProvider showId={selectedShow?.show_id}>
      <MainHeader
        saveStatus={saveStatus}
        shows={shows}
        loading={loading}
        loadingProgress={loadingProgress}
        onShowSelect={handleShowSelect}
        selectedShow={selectedShow}
      />

      {loading && !selectedShow ?
        <WlWidgetPanelLoading
          message={
            loadingProgress < 100 ?
              `Loading shows (${Math.round(loadingProgress)}%)`
            : "Loading shows…"
          }
        />
      : selectedShow ?
        loading ?
          <WlWidgetPanelLoading
            message={
              loadingProgress < 100 ?
                `Loading setlist… (${Math.round(loadingProgress)}%)`
              : "Loading setlist…"
            }
          />
        : setlistEntries.length > 0 ?
          <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col">
            <ShowHeader
              selectedShow={selectedShow as ShowData}
              onCreateNewEntry={handleCreateNewEntry}
            />
            <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
              <SetlistTable
                setlistEntries={setlistEntries}
                showId={selectedShow.show_id}
                onEntrySelect={handleEntrySelect}
              />
            </div>
            <SetlistShowEventActions selectedShow={selectedShow as ShowData} />
          </div>
        : <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col">
            <ShowHeader
              selectedShow={selectedShow as ShowData}
              onCreateNewEntry={handleCreateNewEntry}
            />
            <div className="px-1 py-6 text-center text-xs text-white/65">
              <p className="m-0">No setlist entries found for this show.</p>
            </div>
            <SetlistShowEventActions selectedShow={selectedShow as ShowData} />
          </div>

      : <div className="widget-panel wl-home-v2-admin-setlist-empty flex flex-col gap-3">
          <div className="wp-head">
            <span>Setlist</span>
          </div>
          <p className="m-0 text-[13px] leading-relaxed text-white/65">
            Use the show picker above to load a setlist for editing.
          </p>
        </div>
      }

      <SetlistEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        entry={selectedEntry}
        onSave={handleSaveEntry}
        onSaveStatusUpdate={handleSaveStatusUpdate}
        isNewEntry={isNewEntry}
        allShows={shows}
      />
      </SetlistShareCaptureProvider>
    </AdminTabShell>
  )
}

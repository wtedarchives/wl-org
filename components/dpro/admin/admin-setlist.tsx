"use client"

import { useState } from "react"
import { useAdminSetlist } from "@/hooks/use-admin-setlist"
import type { AdminSetlistEntryData, ShowData } from "@/types/admin"
import { MainHeader } from "./setlist/main-header"
import { ShowHeader } from "./setlist/show-header"
import { SetlistTable } from "./setlist/setlist-table"
import { SetlistEntryModal } from "./setlist-entry-modal"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

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
    null
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
    status: "idle" | "processing" | "done" | "error"
  ) => {
    setSaveStatus(status)
    if (status === "done") setTimeout(() => setSaveStatus("idle"), 2000)
  }

  return (
    <div>
      <MainHeader
        saveStatus={saveStatus}
        shows={shows}
        loading={loading}
        loadingProgress={loadingProgress}
        onShowSelect={handleShowSelect}
        selectedShow={selectedShow}
      />
      {selectedShow && (
        <div>
          <ShowHeader
            selectedShow={selectedShow as ShowData}
            onCreateNewEntry={handleCreateNewEntry}
          />
          {loading ? (
            <LoadingPageCard
              message="Loading setlist..."
              progress={loadingProgress}
            />
          ) : setlistEntries.length > 0 ? (
            <SetlistTable
              setlistEntries={setlistEntries}
              onEntrySelect={handleEntrySelect}
            />
          ) : (
            <div className="rounded-lg border bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground">
                No setlist entries found for this show.
              </p>
            </div>
          )}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded-lg border bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Select a show to view its setlist.
          </p>
        </div>
      )}
      {loading && loadingProgress < 100 && !selectedShow && (
        <LoadingPageCard
          message={`Loading shows (${Math.round(loadingProgress)}%)`}
          progress={loadingProgress}
        />
      )}
      <SetlistEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        entry={selectedEntry}
        onSave={handleSaveEntry}
        onSaveStatusUpdate={handleSaveStatusUpdate}
        isNewEntry={isNewEntry}
      />
    </div>
  )
}

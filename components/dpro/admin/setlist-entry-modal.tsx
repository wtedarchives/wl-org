"use client"

import { useState } from "react"
import { Save, Edit, X, Trash2, Check } from "lucide-react"
import type { AdminSetlistEntryData } from "@/types/admin"
import { useSetlistOptions } from "@/hooks/use-setlist-options"
import { useSetlistEntryForm } from "@/hooks/use-setlist-entry-form"
import { useSetlistEntryActions } from "@/hooks/use-setlist-entry-actions"
import { BasicInfoSection } from "./setlist/basic-info-section"
import { SongSection } from "./setlist/song-section"
import { SongDetailsSection } from "./setlist/song-details-section"
import { GuestsSection } from "./setlist/guests-section"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SetlistEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: AdminSetlistEntryData | null
  onSave: () => void
  onSaveStatusUpdate: (
    status: "idle" | "processing" | "done" | "error"
  ) => void
  isNewEntry?: boolean
}

export function SetlistEntryModal({
  isOpen,
  onClose,
  entry,
  onSave,
  onSaveStatusUpdate,
  isNewEntry = false,
}: SetlistEntryModalProps) {
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [isGuestSectionExpanded, setIsGuestSectionExpanded] = useState(false)
  const [guestSearchTerm, setGuestSearchTerm] = useState("")

  const { sets, setnums, segues, placements, songs, shorts, allGuests } =
    useSetlistOptions()
  const {
    isEditing,
    setIsEditing,
    editedEntry,
    selectedGuestIds,
    songSearchTerm,
    setSongSearchTerm,
    isSongDropdownOpen,
    setIsSongDropdownOpen,
    selectedSongName,
    selectedNewSongOption,
    setSelectedNewSongOption,
    handleInputChange,
    handleSongSelection,
    handleGuestSelection,
    handleSelectAllGooseMembers,
  } = useSetlistEntryForm(entry, isNewEntry)
  const { isSubmitting, saveStatus, saveEntry, deleteEntry } =
    useSetlistEntryActions()

  const toggleEdit = () => {
    if (isEditing && !isNewEntry) handleSaveChanges()
    else setIsEditing(true)
  }

  const handleSaveChanges = async () => {
    if (!editedEntry) return
    onClose()
    await saveEntry(
      editedEntry,
      selectedGuestIds,
      selectedNewSongOption,
      isNewEntry,
      onSave,
      onSaveStatusUpdate
    )
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!entry?.entry_id) return
    if (isDeleteConfirming) {
      await deleteEntry(entry.entry_id, onSave, onClose, onSaveStatusUpdate)
      setIsDeleteConfirming(false)
    } else {
      setIsDeleteConfirming(true)
      setTimeout(() => setIsDeleteConfirming(false), 3000)
    }
  }

  if (!isOpen || !entry) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-black/60">
            <div
              className={`rounded border px-2 py-0.5 text-xs font-medium ${
                saveStatus === "processing"
                  ? "bg-muted-foreground text-muted"
                  : saveStatus === "done"
                    ? "bg-green-600 text-white"
                    : saveStatus === "error"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
              }`}
            >
              {saveStatus === "processing"
                ? "Processing..."
                : saveStatus === "done"
                  ? "Done!"
                  : saveStatus === "error"
                    ? "Error."
                    : "Saving..."}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <DialogHeader>
            <DialogTitle>
              {isNewEntry ? "Add Setlist Entry" : "Edit Setlist Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
          {!isNewEntry && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleEdit}
                disabled={isSubmitting}
              >
                {isEditing ? <Save className="size-4" /> : <Edit className="size-4" />}
              </Button>
              {entry.entry_id && (
                <Button
                  variant={isDeleteConfirming ? "default" : "destructive"}
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  title={isDeleteConfirming ? "Confirm Delete" : "Delete"}
                >
                  {isDeleteConfirming ? (
                    <Check className="size-4" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              )}
            </>
          )}
          {isNewEntry && (
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={
                isSubmitting ||
                !editedEntry?.entry_set ||
                !editedEntry?.entry_song
              }
            >
              <Save className="size-4" />
              {isSubmitting && "..."}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <BasicInfoSection
            sets={sets}
            setnums={setnums}
            placements={placements}
            editedEntry={editedEntry}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleInputChange={handleInputChange}
          />
          <SongSection
            songs={songs}
            songSearchTerm={songSearchTerm}
            setSongSearchTerm={setSongSearchTerm}
            isSongDropdownOpen={isSongDropdownOpen}
            setIsSongDropdownOpen={setIsSongDropdownOpen}
            selectedSongName={selectedSongName}
            editedEntry={editedEntry}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleSongSelection={handleSongSelection}
          />
          <SongDetailsSection
            segues={segues}
            shorts={shorts}
            editedEntry={editedEntry}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleInputChange={handleInputChange}
          />
          <GuestsSection
            allGuests={allGuests}
            selectedGuestIds={selectedGuestIds}
            guestSearchTerm={guestSearchTerm}
            setGuestSearchTerm={setGuestSearchTerm}
            isGuestSectionExpanded={isGuestSectionExpanded}
            setIsGuestSectionExpanded={setIsGuestSectionExpanded}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleGuestSelection={handleGuestSelection}
            handleSelectAllGooseMembers={() =>
              handleSelectAllGooseMembers(allGuests)
            }
          />
          <div className="md:col-span-6">
            <label className="mb-0.5 block text-xs font-medium">
              Coach&apos;s Notes
            </label>
            <textarea
              name="entry_coachnotes"
              value={editedEntry?.entry_coachnotes ?? ""}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewEntry}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-0.5 block text-xs font-medium">
              New Song?
            </label>
            <select
              name="new_song_option"
              value={selectedNewSongOption}
              onChange={(e) => setSelectedNewSongOption(e.target.value)}
              disabled={!isEditing && !isNewEntry}
              className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="N/A">N/A</option>
              <option value="New Original Song">New Original Song</option>
              <option value="New Cover Song">New Cover Song</option>
            </select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

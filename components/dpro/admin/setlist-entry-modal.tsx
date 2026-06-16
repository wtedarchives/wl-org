"use client"

import { useRef, useState, useEffect } from "react"
import { Save, Edit, X, Trash2, Check, Loader2 } from "lucide-react"
import type { AdminSetlistEntryData, ShowData } from "@/types/admin"
import { useSetlistOptions } from "@/hooks/use-setlist-options"
import { useSetlistEntryForm } from "@/hooks/use-setlist-entry-form"
import { useSetlistEntryActions } from "@/hooks/use-setlist-entry-actions"
import {
  AdminHtmlLinkInserters,
  insertTextAtTextareaCursor,
} from "./admin-html-link-inserters"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from "@/components/ui/input"

interface SetlistEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: AdminSetlistEntryData | null
  onSave: () => void
  onSaveStatusUpdate: (
    status: "idle" | "processing" | "done" | "error"
  ) => void
  isNewEntry?: boolean
  allShows: ShowData[]
}

export function SetlistEntryModal({
  isOpen,
  onClose,
  entry,
  onSave,
  onSaveStatusUpdate,
  isNewEntry = false,
  allShows,
}: SetlistEntryModalProps) {
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const coachNotesTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [isGuestSectionExpanded, setIsGuestSectionExpanded] = useState(false)
  const [guestSearchTerm, setGuestSearchTerm] = useState("")

  const { sets, setnums, placements, songs, shorts, allGuests } =
    useSetlistOptions()
  const {
    isEditing,
    setIsEditing,
    editedEntry,
    selectedGuestIds,
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

  useEffect(() => {
    if (
      isNewEntry &&
      editedEntry &&
      (!editedEntry.entry_set || editedEntry.entry_set === "--") &&
      sets[0]
    ) {
      handleInputChange({
        target: { name: "entry_set", value: sets[0].set },
      } as React.ChangeEvent<HTMLSelectElement>)
    }
  }, [isNewEntry, editedEntry?.entry_set, sets, handleInputChange])

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

  const insertCoachNotesAtCursor = (
    text: string,
    cursorOffset?: number,
  ) => {
    if (!editedEntry) return
    insertTextAtTextareaCursor(
      coachNotesTextareaRef.current,
      text,
      editedEntry.entry_coachnotes ?? "",
      (newValue) => {
        handleInputChange({
          target: { name: "entry_coachnotes", value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>)
      },
      cursorOffset,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div ref={dialogContentRef} className="contents">
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-black/60">
            <div
              className={`flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${
                saveStatus === "processing"
                  ? "bg-muted-foreground text-muted"
                  : saveStatus === "done"
                    ? "bg-green-600 text-white"
                    : saveStatus === "error"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
              }`}
            >
              {saveStatus === "processing" || saveStatus === "idle" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin shrink-0" />
                  {saveStatus === "processing" ? "Processing..." : "Saving..."}
                </>
              ) : saveStatus === "done" ? (
                <>
                  <Check className="size-3.5 shrink-0" />
                  Done!
                </>
              ) : (
                "Error."
              )}
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
            selectedSongName={selectedSongName}
            editedEntry={editedEntry}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleSongSelection={handleSongSelection}
            comboboxContainer={dialogContentRef}
          />
          <SongDetailsSection
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
            <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-medium">
                Coach&apos;s Notes
              </label>
              {(isEditing || isNewEntry) ?
                <AdminHtmlLinkInserters
                  allShows={allShows}
                  songs={songs}
                  onInsert={insertCoachNotesAtCursor}
                />
              : null}
            </div>
            <textarea
              ref={coachNotesTextareaRef}
              name="entry_coachnotes"
              value={editedEntry?.entry_coachnotes ?? ""}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewEntry}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-0.5 block text-xs font-medium">
              New Song?
            </label>
            {(isEditing || isNewEntry) ? (
              <>
                <div className="flex flex-wrap gap-0.5 md:hidden">
                  {(["N/A", "New Original Song", "New Cover Song"] as const).map(
                    (opt) => (
                      <Button
                        key={opt}
                        type="button"
                        variant={
                          selectedNewSongOption === opt ? "default" : "outline"
                        }
                        size="sm"
                        className="h-6 text-xs transition-colors hover:!bg-muted hover:!text-foreground"
                        onClick={() => setSelectedNewSongOption(opt)}
                      >
                        {opt}
                      </Button>
                    )
                  )}
                </div>
                <div className="hidden md:block">
                  <ToggleGroup
                    type="single"
                    value={selectedNewSongOption}
                    onValueChange={(v) =>
                      setSelectedNewSongOption(v ?? "N/A")
                    }
                    variant="outline"
                    size="sm"
                    className="w-auto flex-wrap justify-start"
                  >
                    <ToggleGroupItem
                      value="N/A"
                      className="shrink-0 text-xs"
                    >
                      N/A
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="New Original Song"
                      className="shrink-0 text-xs"
                    >
                      New Original Song
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="New Cover Song"
                      className="shrink-0 text-xs"
                    >
                      New Cover Song
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </>
            ) : (
              <Input
                value={selectedNewSongOption}
                readOnly
                className="h-6 w-full text-xs md:w-auto"
              />
            )}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

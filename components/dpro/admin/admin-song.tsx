"use client"

import { useState } from "react"
import { Plus } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { useSongsData } from "@/hooks/use-songs-data"
import {
  transformSongForUpdate,
  updateSong,
} from "@/lib/utils/song-utils"
import type { SongDataFull } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { SongDropdown } from "./song-dropdown"
import { SongDetailsForm } from "./song-details-form"
import { SongModal } from "./song-modal"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"

export function AdminSong() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const { allSongs, categories, artists, refetchSongs } = useSongsData()
  const [selectedSong, setSelectedSong] = useState<SongDataFull | null>(null)
  const [editedSong, setEditedSong] = useState<SongDataFull | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSongModalOpen, setIsSongModalOpen] = useState(false)
  const [isNewSong, setIsNewSong] = useState(false)

  const handleSongSelect = (song: SongDataFull) => {
    setSelectedSong(song)
    setEditedSong(song)
    setIsEditing(false)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editedSong) return
    const { name, value } = e.target
    setEditedSong({
      ...editedSong,
      [name]:
        name === "song_categoryorder"
          ? value === ""
            ? null
            : (() => {
                const n = parseInt(value, 10)
                return Number.isNaN(n) ? null : n
              })()
          : value,
    })
  }

  const toggleEdit = async () => {
    if (isEditing) await handleSaveChanges()
    else setIsEditing(true)
  }

  const handleSaveChanges = async () => {
    if (!editedSong) return
    setIsSubmitting(true)
    try {
      const songToUpdate = transformSongForUpdate(editedSong)
      const updated = await updateSong(songToUpdate, token)
      setSelectedSong(updated)
      setEditedSong(updated)
      setIsEditing(false)
      refetchSongs()
    } catch (error) {
      console.error("Error updating song:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update song"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenNewSongModal = () => {
    setIsNewSong(true)
    setIsSongModalOpen(true)
  }

  const handleSongModalSave = () => {
    refetchSongs()
    setIsSongModalOpen(false)
  }

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Song Management">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenNewSongModal}
          className="wl-home-v2-tours-header-pill gap-1"
          title="New song"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
        </Button>
        <SongDropdown
          songs={allSongs}
          onSongSelect={handleSongSelect}
          selectedSong={selectedSong}
        />
      </AdminTabToolbar>
      {selectedSong && (
        <SongDetailsForm
          selectedSong={selectedSong}
          editedSong={editedSong}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          categories={categories}
          artists={artists}
          onToggleEdit={toggleEdit}
          onInputChange={handleInputChange}
        />
      )}
      <SongModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        song={selectedSong}
        onSave={handleSongModalSave}
        isNewSong={isNewSong}
      />
    </AdminTabShell>
  )
}

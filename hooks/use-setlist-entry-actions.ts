"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { parseLengthToHhMmSs } from "@/lib/utils/show-utils"
import type { AdminSetlistEntryData } from "@/types/admin"

export function useSetlistEntryActions() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "processing" | "done" | "error"
  >("idle")

  const updateStatistics = async () => {
    const { error } = await invokeDproAdmin(token, {
      action: "rpc_update_all_setlist_entries",
    })
    if (error) {
      setSaveStatus("error")
      return false
    }
    setSaveStatus("done")
    return true
  }

  const saveGuestAssociations = async (
    entryId: string,
    selectedGuestIds: string[],
  ) => {
    const { error } = await invokeDproAdmin(token, {
      action: "setlist_entry_guests_replace",
      setlist_entry_id: entryId,
      guest_ids: selectedGuestIds,
    })
    if (error) throw new Error(error)
  }

  const saveEntry = async (
    editedEntry: AdminSetlistEntryData,
    selectedGuestIds: string[],
    selectedNewSongOption: string,
    isNewEntry: boolean,
    onSave: () => void,
    onSaveStatusUpdate: (status: "idle" | "processing" | "done" | "error") => void,
  ) => {
    if (!token) {
      alert("You must be signed in to save.")
      return
    }
    if (isNewEntry && (!editedEntry.entry_set || !editedEntry.entry_song)) {
      alert("Please fill in all required fields (Set and Song are required)")
      return
    }
    setSaveStatus("processing")
    onSaveStatusUpdate("processing")
    try {
      const entryToSave = {
        ...editedEntry,
        entry_set: editedEntry.entry_set === "--" ? null : editedEntry.entry_set,
        entry_setnum: (() => {
          const v = editedEntry.entry_setnum
          if (v == null) return 1
          if (typeof v === "string" && v === "--") return 1
          const n = Number(v)
          return Number.isNaN(n) ? 1 : n
        })(),
        entry_song: editedEntry.entry_song === "--" ? null : editedEntry.entry_song,
        entry_short:
          editedEntry.entry_short === "" || editedEntry.entry_short === "--"
            ? null
            : editedEntry.entry_short,
        entry_segue:
          editedEntry.entry_segue === "" || editedEntry.entry_segue === "--"
            ? null
            : editedEntry.entry_segue,
        entry_length: (() => {
          const raw = editedEntry.entry_length
          if (!raw || raw === "") return null
          const normalized = parseLengthToHhMmSs(raw)
          return normalized ?? raw
        })(),
        entry_placement:
          editedEntry.entry_placement === "" ||
          editedEntry.entry_placement === "--"
            ? null
            : editedEntry.entry_placement,
        entry_coachnotes:
          editedEntry.entry_coachnotes === "" ? null : editedEntry.entry_coachnotes,
        entry_new: selectedNewSongOption === "N/A" ? "FALSE" : selectedNewSongOption,
      }

      if (isNewEntry) {
        const insertRow: Record<string, unknown> = {
          entry_set: entryToSave.entry_set,
          entry_setnum: entryToSave.entry_setnum,
          entry_song: entryToSave.entry_song,
          entry_show: entryToSave.entry_show,
          entry_new: entryToSave.entry_new,
        }
        if (entryToSave.entry_short) insertRow.entry_short = entryToSave.entry_short
        if (entryToSave.entry_segue) insertRow.entry_segue = entryToSave.entry_segue
        if (entryToSave.entry_length) insertRow.entry_length = entryToSave.entry_length
        if (entryToSave.entry_placement)
          insertRow.entry_placement = entryToSave.entry_placement
        if (entryToSave.entry_coachnotes)
          insertRow.entry_coachnotes = entryToSave.entry_coachnotes

        const { data, error } = await invokeDproAdmin<{ rows: { entry_id: string }[] }>(
          token,
          { action: "setlist_entries_insert", row: insertRow },
        )
        if (error) {
          alert(`Error creating entry: ${error}`)
          setSaveStatus("error")
          onSaveStatusUpdate("error")
          throw new Error(error)
        }
        const rows = data?.rows
        if (!rows?.length) {
          alert("Error creating entry: no row returned")
          setSaveStatus("error")
          onSaveStatusUpdate("error")
          throw new Error("No row returned")
        }
        const savedEntryId = rows[0].entry_id
        if (selectedGuestIds.length > 0) {
          await saveGuestAssociations(savedEntryId, selectedGuestIds)
        }
        onSave()
      } else {
        const patch: Record<string, unknown> = {
          entry_set: entryToSave.entry_set,
          entry_setnum: entryToSave.entry_setnum,
          entry_song: entryToSave.entry_song,
          entry_short: entryToSave.entry_short,
          entry_segue: entryToSave.entry_segue,
          entry_length: entryToSave.entry_length,
          entry_placement: entryToSave.entry_placement,
          entry_coachnotes: entryToSave.entry_coachnotes,
          entry_new: entryToSave.entry_new,
        }
        const { error } = await invokeDproAdmin(token, {
          action: "setlist_entries_update",
          entry_id: entryToSave.entry_id,
          patch,
        })
        if (error) {
          alert(`Error updating entry: ${error}`)
          setSaveStatus("error")
          onSaveStatusUpdate("error")
          throw new Error(error)
        }
        await saveGuestAssociations(entryToSave.entry_id, selectedGuestIds)
        onSave()
      }
      await updateStatistics()
      setSaveStatus("done")
      onSaveStatusUpdate("done")
    } catch {
      setSaveStatus("error")
      onSaveStatusUpdate("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteEntry = async (
    entryId: string,
    onSave: () => void,
    onClose: () => void,
    onSaveStatusUpdate: (status: "idle" | "processing" | "done" | "error") => void,
  ) => {
    if (!token) {
      alert("You must be signed in.")
      return
    }
    setIsSubmitting(true)
    setSaveStatus("processing")
    onSaveStatusUpdate("processing")
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_entries_delete",
        entry_id: entryId,
      })
      if (error) {
        alert(`Error deleting entry: ${error}`)
        setSaveStatus("error")
        onSaveStatusUpdate("error")
      } else {
        await updateStatistics()
        onSave()
        onClose()
      }
    } catch {
      setSaveStatus("error")
      onSaveStatusUpdate("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, saveStatus, saveEntry, deleteEntry }
}

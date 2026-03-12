"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { parseLengthToHhMmSs } from "@/lib/utils/show-utils"
import type { AdminSetlistEntryData } from "@/types/admin"

export function useSetlistEntryActions() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "processing" | "done" | "error"
  >("idle")

  const updateStatistics = async () => {
    if (!supabase) return false
    try {
      const { error } = await supabase.rpc("update_all_setlist_entries")
      if (error) {
        setSaveStatus("error")
        return false
      }
      setSaveStatus("done")
      return true
    } catch {
      setSaveStatus("error")
      return false
    }
  }

  const saveGuestAssociations = async (
    entryId: string,
    selectedGuestIds: string[]
  ) => {
    if (!supabase) return
    const { data: currentAssociations, error: fetchError } = await supabase
      .from("setlist_entry_guests")
      .select("guest_id")
      .eq("setlist_entry_id", entryId)
    if (fetchError) throw fetchError
    const currentGuestIds = currentAssociations?.map((i) => i.guest_id) || []
    const guestsToAdd = selectedGuestIds.filter(
      (id) => !currentGuestIds.includes(id)
    )
    const guestsToRemove = currentGuestIds.filter(
      (id) => !selectedGuestIds.includes(id)
    )
    if (guestsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("setlist_entry_guests")
        .delete()
        .eq("setlist_entry_id", entryId)
        .in("guest_id", guestsToRemove)
      if (deleteError) throw deleteError
    }
    for (const guestId of guestsToAdd) {
      const { error: insertError } = await supabase
        .from("setlist_entry_guests")
        .insert({ setlist_entry_id: entryId, guest_id: guestId })
      if (insertError && insertError.code !== "23505") throw insertError
    }
  }

  const saveEntry = async (
    editedEntry: AdminSetlistEntryData,
    selectedGuestIds: string[],
    selectedNewSongOption: string,
    isNewEntry: boolean,
    onSave: () => void,
    onSaveStatusUpdate: (status: "idle" | "processing" | "done" | "error") => void
  ) => {
    if (!supabase) return
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

      let savedEntryId: string
      if (isNewEntry) {
        const insertData: Record<string, unknown> = {
          entry_set: entryToSave.entry_set,
          entry_setnum: entryToSave.entry_setnum,
          entry_song: entryToSave.entry_song,
          entry_show: entryToSave.entry_show,
          entry_new: entryToSave.entry_new,
        }
        if (entryToSave.entry_short) insertData.entry_short = entryToSave.entry_short
        if (entryToSave.entry_segue) insertData.entry_segue = entryToSave.entry_segue
        if (entryToSave.entry_length)
          insertData.entry_length = entryToSave.entry_length
        if (entryToSave.entry_placement)
          insertData.entry_placement = entryToSave.entry_placement
        if (entryToSave.entry_coachnotes)
          insertData.entry_coachnotes = entryToSave.entry_coachnotes

        const { data, error } = await supabase
          .from("setlist_entries")
          .insert(insertData)
          .select()
        if (error) {
          alert(`Error creating entry: ${error.message}`)
          setSaveStatus("error")
          onSaveStatusUpdate("error")
          throw error
        }
        if (data && data.length > 0) {
          savedEntryId = data[0].entry_id
          if (selectedGuestIds.length > 0)
            await saveGuestAssociations(savedEntryId, selectedGuestIds)
        }
        onSave()
      } else {
        const { error } = await supabase
          .from("setlist_entries")
          .update({
            entry_set: entryToSave.entry_set,
            entry_setnum: entryToSave.entry_setnum,
            entry_song: entryToSave.entry_song,
            entry_short: entryToSave.entry_short,
            entry_segue: entryToSave.entry_segue,
            entry_length: entryToSave.entry_length,
            entry_placement: entryToSave.entry_placement,
            entry_coachnotes: entryToSave.entry_coachnotes,
            entry_new: entryToSave.entry_new,
          })
          .eq("entry_id", entryToSave.entry_id)
        if (error) {
          alert(`Error updating entry: ${error.message}`)
          setSaveStatus("error")
          onSaveStatusUpdate("error")
          throw error
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
    onSaveStatusUpdate: (status: "idle" | "processing" | "done" | "error") => void
  ) => {
    if (!supabase) return
    setIsSubmitting(true)
    setSaveStatus("processing")
    onSaveStatusUpdate("processing")
    try {
      const { error } = await supabase
        .from("setlist_entries")
        .delete()
        .eq("entry_id", entryId)
      if (error) {
        alert(`Error deleting entry: ${error.message}`)
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

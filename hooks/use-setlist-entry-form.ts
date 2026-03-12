"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type {
  AdminSetlistEntryData,
  GuestCategory,
} from "@/types/admin"

export function useSetlistEntryForm(
  entry: AdminSetlistEntryData | null,
  isNewEntry: boolean
) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState<AdminSetlistEntryData | null>(
    null
  )
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([])
  const [selectedSongName, setSelectedSongName] = useState("")
  const [selectedNewSongOption, setSelectedNewSongOption] = useState("N/A")

  const getDefaultPlacement = (setName: string): string | null => {
    if (!setName || setName === "--") return null
    const mainSetMatch = setName.match(/^(?:Set )?(\d)$/)
    if (mainSetMatch) return `Main Set ${mainSetMatch[1]}`
    const encoreMatch = setName.match(/^E(\d)$/)
    if (encoreMatch) return `Encore ${encoreMatch[1]}`
    return null
  }

  useEffect(() => {
    if (entry) {
      if (isNewEntry) {
        const defaultPlacement = getDefaultPlacement(entry.entry_set || "")
        const entryWithDefaults: AdminSetlistEntryData = {
          ...entry,
          entry_set: entry.entry_set || "--",
          entry_setnum:
            typeof entry.entry_setnum === "string"
              ? parseInt(entry.entry_setnum) || 0
              : entry.entry_setnum || 0,
          entry_song: entry.entry_song || "",
          entry_short: entry.entry_short ?? null,
          entry_segue: entry.entry_segue ?? null,
          entry_placement: defaultPlacement,
          entry_new: entry.entry_new || "FALSE",
        }
        setEditedEntry(entryWithDefaults)
        setSelectedSongName("")
        setSelectedNewSongOption("N/A")
      } else {
        setEditedEntry(entry)
        setSelectedSongName(entry.entry_song || "")
        if (entry.entry_new === "New Original Song")
          setSelectedNewSongOption("New Original Song")
        else if (entry.entry_new === "New Cover Song")
          setSelectedNewSongOption("New Cover Song")
        else setSelectedNewSongOption("N/A")
      }
      setIsEditing(isNewEntry)
      if (!isNewEntry && entry.entry_id) {
        fetchEntryGuests(entry.entry_id)
      } else {
        setSelectedGuestIds([])
      }
    }
  }, [entry, isNewEntry])

  const fetchEntryGuests = async (entryId: string) => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from("setlist_entry_guests")
        .select("guest_id")
        .eq("setlist_entry_id", entryId)
      if (!error && data)
        setSelectedGuestIds(data.map((item) => item.guest_id))
    } catch {
      // silent
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editedEntry) return
    const { name, value } = e.target
    if (name === "entry_set" && isNewEntry) {
      const defaultPlacement = getDefaultPlacement(value)
      setEditedEntry({
        ...editedEntry,
        [name]: value === "--" ? null : value,
        entry_placement: defaultPlacement,
      })
    } else {
      let updatedValue: string | number | null = value
      if (value === "--") {
        updatedValue = name === "entry_setnum" ? 0 : null
      } else if (name === "entry_setnum" || name === "entry_setorder") {
        updatedValue = value === "" ? 0 : parseInt(value) || 0
      }
      setEditedEntry({ ...editedEntry, [name]: updatedValue })
    }
  }

  const handleSongSelection = (songName: string) => {
    if (!editedEntry) return
    setSelectedSongName(songName)
    setEditedEntry({ ...editedEntry, entry_song: songName })
  }

  const handleGuestSelection = (guestId: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId]
    )
  }

  const handleSelectAllGooseMembers = (allGuests: GuestCategory[]) => {
    const gooseGuestIds =
      allGuests
        .find((c) => c.category === "Goose (current)")
        ?.guests.map((g) => g.guest_id) || []
    setSelectedGuestIds((prev) => {
      const next = [...prev]
      gooseGuestIds.forEach((id) => {
        if (!next.includes(id)) next.push(id)
      })
      return next
    })
  }

  return {
    isEditing,
    setIsEditing,
    editedEntry,
    setEditedEntry,
    selectedGuestIds,
    setSelectedGuestIds,
    selectedSongName,
    setSelectedSongName,
    selectedNewSongOption,
    setSelectedNewSongOption,
    handleInputChange,
    handleSongSelection,
    handleGuestSelection,
    handleSelectAllGooseMembers,
    getDefaultPlacement,
  }
}

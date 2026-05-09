"use client"

import { useState, useEffect } from "react"
import { getDefaultPlacementForSet } from "@/lib/setlist-default-placement"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type {
  AdminSetlistEntryData,
  GuestCategory,
} from "@/types/admin"

export function useSetlistEntryForm(
  entry: AdminSetlistEntryData | null,
  isNewEntry: boolean,
) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState<AdminSetlistEntryData | null>(
    null
  )
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([])
  const [selectedSongName, setSelectedSongName] = useState("")
  const [selectedNewSongOption, setSelectedNewSongOption] = useState("N/A")

  useEffect(() => {
    if (entry) {
      if (isNewEntry) {
        const defaultPlacement = getDefaultPlacementForSet(entry.entry_set || "")
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
    if (!token) return
    try {
      const { data, error } = await invokeDproAdmin<{ guest_ids: string[] }>(token, {
        action: "setlist_entry_guests_select",
        setlist_entry_id: entryId,
      })
      if (!error && data?.guest_ids) setSelectedGuestIds(data.guest_ids)
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
      const defaultPlacement = getDefaultPlacementForSet(value)
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
    getDefaultPlacement: getDefaultPlacementForSet,
  }
}

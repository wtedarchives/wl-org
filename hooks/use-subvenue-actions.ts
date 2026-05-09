"use client"

import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type { SubvenueData } from "@/types/admin"

export function useSubvenueActions() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const saveSubvenue = async (
    editedSubvenue: SubvenueData,
    selectedSubvenue: SubvenueData | null,
    isCreatingNew: boolean,
    setIsSubmitting: (value: boolean) => void,
    setIsCreatingNew: (value: boolean) => void,
    setIsEditing: (value: boolean) => void,
    setSelectedSubvenue: (subvenue: SubvenueData) => void,
    fetchAllSubvenues: () => void
  ) => {
    if (!editedSubvenue || !token) return
    if (
      !editedSubvenue.subvenue.trim() ||
      !editedSubvenue.subvenue_venue.trim()
    ) {
      alert("Subvenue name and venue are required.")
      return
    }
    setIsSubmitting(true)
    try {
      if (isCreatingNew) {
        const { error } = await invokeDproAdmin(token, {
          action: "subvenues_insert",
          row: {
            subvenue: editedSubvenue.subvenue.trim(),
            subvenue_venue: editedSubvenue.subvenue_venue.trim(),
            subvenue_startdate: editedSubvenue.subvenue_startdate,
            subvenue_enddate: editedSubvenue.subvenue_enddate,
          },
        })
        if (error) {
          if (error.includes("23505") || error.toLowerCase().includes("duplicate"))
            alert("A subvenue with this name already exists.")
          else throw new Error(error)
          return
        }
        setIsCreatingNew(false)
      } else {
        const { error } = await invokeDproAdmin(token, {
          action: "subvenues_update",
          match: { subvenue: selectedSubvenue!.subvenue },
          patch: {
            subvenue: editedSubvenue.subvenue.trim(),
            subvenue_venue: editedSubvenue.subvenue_venue.trim(),
            subvenue_startdate: editedSubvenue.subvenue_startdate,
            subvenue_enddate: editedSubvenue.subvenue_enddate,
          },
        })
        if (error) throw new Error(error)
      }
      setSelectedSubvenue(editedSubvenue)
      setIsEditing(false)
      fetchAllSubvenues()
    } catch (error) {
      console.error("Error saving subvenue:", error)
      alert("Failed to save subvenue. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  return { saveSubvenue }
}

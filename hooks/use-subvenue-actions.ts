"use client"

import { supabase } from "@/lib/supabase"
import type { SubvenueData } from "@/types/admin"

export function useSubvenueActions() {
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
    if (!editedSubvenue || !supabase) return
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
        const { error } = await supabase.from("subvenues").insert([
          {
            subvenue: editedSubvenue.subvenue.trim(),
            subvenue_venue: editedSubvenue.subvenue_venue.trim(),
            subvenue_startdate: editedSubvenue.subvenue_startdate,
            subvenue_enddate: editedSubvenue.subvenue_enddate,
          },
        ])
        if (error) {
          if (error.code === "23505")
            alert("A subvenue with this name already exists.")
          else throw error
          return
        }
        setIsCreatingNew(false)
      } else {
        const { error } = await supabase
          .from("subvenues")
          .update({
            subvenue: editedSubvenue.subvenue.trim(),
            subvenue_venue: editedSubvenue.subvenue_venue.trim(),
            subvenue_startdate: editedSubvenue.subvenue_startdate,
            subvenue_enddate: editedSubvenue.subvenue_enddate,
          })
          .eq("subvenue", selectedSubvenue!.subvenue)
        if (error) throw error
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

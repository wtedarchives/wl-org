"use client"

import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type { VenueData } from "@/types/admin"

export function useVenueActions() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const saveVenue = async (
    editedVenue: VenueData,
    selectedVenue: VenueData | null,
    isCreatingNew: boolean,
    setIsSubmitting: (value: boolean) => void,
    setIsCreatingNew: (value: boolean) => void,
    setIsEditing: (value: boolean) => void,
    setSelectedVenue: (venue: VenueData) => void,
    fetchAllVenues: () => void
  ) => {
    if (!editedVenue || !token) return
    if (!editedVenue.venue.trim() || !editedVenue.venue_location.trim()) {
      alert("Venue name and location are required.")
      return
    }
    setIsSubmitting(true)
    try {
      if (isCreatingNew) {
        const { error } = await invokeDproAdmin(token, {
          action: "venues_insert",
          row: {
            venue: editedVenue.venue.trim(),
            venue_location: editedVenue.venue_location.trim(),
            venue_coachnotes: editedVenue.venue_coachnotes,
            venue_global: editedVenue.venue_global,
            venue_address: editedVenue.venue_address,
            venue_latitude: editedVenue.venue_latitude?.trim() || null,
            venue_longitude: editedVenue.venue_longitude?.trim() || null,
          },
        })
        if (error) {
          if (error.includes("23505") || error.toLowerCase().includes("duplicate"))
            alert("A venue with this name and location already exists.")
          else throw new Error(error)
          return
        }
        setIsCreatingNew(false)
      } else {
        const { error } = await invokeDproAdmin(token, {
          action: "venues_update",
          match: {
            venue: selectedVenue!.venue,
            venue_location: selectedVenue!.venue_location,
          },
          patch: {
            venue: editedVenue.venue.trim(),
            venue_location: editedVenue.venue_location.trim(),
            venue_coachnotes: editedVenue.venue_coachnotes,
            venue_global: editedVenue.venue_global,
            venue_address: editedVenue.venue_address,
            venue_latitude: editedVenue.venue_latitude?.trim() || null,
            venue_longitude: editedVenue.venue_longitude?.trim() || null,
          },
        })
        if (error) throw new Error(error)
      }
      setSelectedVenue(editedVenue)
      setIsEditing(false)
      fetchAllVenues()
    } catch (error) {
      console.error("Error saving venue:", error)
      alert("Failed to save venue. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  return { saveVenue }
}

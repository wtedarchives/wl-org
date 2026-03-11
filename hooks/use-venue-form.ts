"use client"

import { useState, useEffect, useRef } from "react"
import type { VenueData } from "@/types/admin"

export function useVenueForm(allVenues: VenueData[]) {
  const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedVenue, setEditedVenue] = useState<VenueData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const venueDataLoadedRef = useRef(false)

  useEffect(() => {
    if (allVenues.length > 0 && !venueDataLoadedRef.current) {
      venueDataLoadedRef.current = true
      try {
        const storedVenue = localStorage.getItem("adminSelectedVenue")
        if (storedVenue) {
          const storedVenueData = allVenues.find(
            (v) => v.venue === storedVenue
          )
          if (storedVenueData) {
            setSelectedVenue(storedVenueData)
            setEditedVenue(storedVenueData)
          }
        }
      } catch {
        // silent
      }
    }
  }, [allVenues])

  const handleVenueSelect = (venue: VenueData) => {
    setSelectedVenue(venue)
    setEditedVenue(venue)
    setIsEditing(false)
    setIsCreatingNew(false)
    try {
      localStorage.setItem("adminSelectedVenue", venue.venue)
    } catch {
      // silent
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editedVenue) return
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    const newValue = type === "checkbox" ? checked : value === "" ? null : value
    setEditedVenue({ ...editedVenue, [name]: newValue })
  }

  const handleCreateNew = () => {
    const newVenue: VenueData = {
      venue: "",
      venue_location: "",
      venue_coachnotes: null,
      venue_global: false,
      venue_address: null,
      venue_latitude: null,
      venue_longitude: null,
    }
    setSelectedVenue(newVenue)
    setEditedVenue(newVenue)
    setIsCreatingNew(true)
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (isCreatingNew) {
      setSelectedVenue(null)
      setEditedVenue(null)
      setIsCreatingNew(false)
    } else {
      setEditedVenue(selectedVenue)
    }
    setIsEditing(false)
  }

  return {
    selectedVenue,
    isEditing,
    editedVenue,
    isSubmitting,
    isCreatingNew,
    setSelectedVenue,
    setIsEditing,
    setEditedVenue,
    setIsSubmitting,
    setIsCreatingNew,
    handleVenueSelect,
    handleInputChange,
    handleCreateNew,
    handleCancel,
  }
}

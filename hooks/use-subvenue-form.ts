"use client"

import { useState, useEffect, useRef } from "react"
import type { SubvenueData, VenueDataBasic } from "@/types/admin"

export function useSubvenueForm(allSubvenues: SubvenueData[]) {
  const [selectedSubvenue, setSelectedSubvenue] =
    useState<SubvenueData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubvenue, setEditedSubvenue] = useState<SubvenueData | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false)
  const [venueSearchTerm, setVenueSearchTerm] = useState("")
  const subvenueDataLoadedRef = useRef(false)

  useEffect(() => {
    if (allSubvenues.length > 0 && !subvenueDataLoadedRef.current) {
      subvenueDataLoadedRef.current = true
      try {
        const storedSubvenue = localStorage.getItem("adminSelectedSubvenue")
        if (storedSubvenue) {
          const stored = allSubvenues.find((s) => s.subvenue === storedSubvenue)
          if (stored) {
            setSelectedSubvenue(stored)
            setEditedSubvenue(stored)
          }
        }
      } catch {
        // silent
      }
    }
  }, [allSubvenues])

  const handleSubvenueSelect = (subvenue: SubvenueData) => {
    setSelectedSubvenue(subvenue)
    setEditedSubvenue(subvenue)
    setIsEditing(false)
    setIsCreatingNew(false)
    try {
      localStorage.setItem("adminSelectedSubvenue", subvenue.subvenue)
    } catch {
      // silent
    }
  }

  const handleVenueSelect = (venue: VenueDataBasic) => {
    if (!editedSubvenue) return
    setEditedSubvenue({ ...editedSubvenue, subvenue_venue: venue.venue })
    setIsVenueDropdownOpen(false)
    setVenueSearchTerm("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedSubvenue) return
    const { name, value } = e.target
    setEditedSubvenue({
      ...editedSubvenue,
      [name]: value === "" ? null : value,
    })
  }

  const handleCreateNew = () => {
    const newSubvenue: SubvenueData = {
      subvenue: "",
      subvenue_venue: "",
      subvenue_startdate: null,
      subvenue_enddate: null,
    }
    setSelectedSubvenue(newSubvenue)
    setEditedSubvenue(newSubvenue)
    setIsCreatingNew(true)
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (isCreatingNew) {
      setSelectedSubvenue(null)
      setEditedSubvenue(null)
      setIsCreatingNew(false)
    } else {
      setEditedSubvenue(selectedSubvenue)
    }
    setIsEditing(false)
  }

  return {
    selectedSubvenue,
    isEditing,
    editedSubvenue,
    isSubmitting,
    isCreatingNew,
    isVenueDropdownOpen,
    venueSearchTerm,
    setSelectedSubvenue,
    setIsEditing,
    setEditedSubvenue,
    setIsSubmitting,
    setIsCreatingNew,
    setIsVenueDropdownOpen,
    setVenueSearchTerm,
    handleSubvenueSelect,
    handleVenueSelect,
    handleInputChange,
    handleCreateNew,
    handleCancel,
  }
}

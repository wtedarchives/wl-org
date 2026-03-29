"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { convertFromEasternToUTC } from "@/lib/utils/show-utils"
import type { AdminShowData } from "@/types/admin"

export function useShowActions(
  allShows: AdminShowData[],
  fetchAllShows: () => void,
  fetchShowReleases?: (showId: string) => void
) {
  const [selectedShow, setSelectedShow] = useState<AdminShowData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedShow, setEditedShow] = useState<AdminShowData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showDataLoadedRef = useRef(false)

  useEffect(() => {
    if (allShows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true
      try {
        const storedShowId = localStorage.getItem("adminSelectedShowId")
        if (storedShowId) {
          const storedShow = allShows.find((s) => s.show_id === storedShowId)
          if (storedShow) {
            setSelectedShow(storedShow)
            setEditedShow(storedShow)
            fetchShowReleases?.(storedShow.show_id)
          }
        }
      } catch {
        // silent
      }
    }
  }, [allShows])

  const handleShowSelect = (
    show: AdminShowData,
    fetchReleases: (showId: string) => void
  ) => {
    setSelectedShow(show)
    setEditedShow(show)
    setIsEditing(false)
    fetchReleases(show.show_id)
    try {
      localStorage.setItem("adminSelectedShowId", show.show_id)
    } catch {
      // silent
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editedShow) return
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    if (name === "show_date" && value) {
      setEditedShow({ ...editedShow, [name]: value })
    } else {
      const newValue =
        type === "checkbox" ? checked : value === "" ? null : value
      setEditedShow({ ...editedShow, [name]: newValue })
    }
  }

  const toggleEdit = () => {
    if (isEditing) handleSaveChanges()
    else setIsEditing(true)
  }

  const patchShow = useCallback((patch: Partial<AdminShowData>) => {
    setSelectedShow((prev) => (prev ? { ...prev, ...patch } : null))
    setEditedShow((prev) => (prev ? { ...prev, ...patch } : null))
  }, [])

  const handleSaveChanges = async () => {
    if (!editedShow || !supabase) return
    setIsSubmitting(true)
    try {
      const showTimeUTC = editedShow.show_time
        ? convertFromEasternToUTC(editedShow.show_time)
        : null
      const updateData = {
        show_date: editedShow.show_date,
        show_group: editedShow.show_group,
        show_tour: editedShow.show_tour,
        show_subvenue: editedShow.show_subvenue,
        show_iscanon: editedShow.show_iscanon,
        show_year: editedShow.show_year,
        show_issetlistgame: editedShow.show_issetlistgame,
        show_detail: editedShow.show_detail,
        show_alert: editedShow.show_alert,
        show_coachnotes: editedShow.show_coachnotes,
        show_time: showTimeUTC,
        show_callbacks: editedShow.show_callbacks,
        show_wl_link: editedShow.show_wl_link,
      }
      const { error } = await supabase
        .from("shows")
        .update(updateData)
        .eq("show_id", editedShow.show_id)
      if (error) throw error
      setSelectedShow(editedShow)
      setIsEditing(false)
      fetchAllShows()
    } catch {
      // silent
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedShow,
    isEditing,
    editedShow,
    isSubmitting,
    handleShowSelect,
    handleInputChange,
    toggleEdit,
    patchShow,
  }
}

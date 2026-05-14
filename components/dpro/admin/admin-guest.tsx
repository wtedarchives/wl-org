"use client"

import { useState, useEffect, useRef } from "react"
import { Plus } from "@phosphor-icons/react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { GuestModal } from "./guest-modal"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"
import { AdminGuestDropdown } from "./admin-guest-dropdown"
import { AdminGuestForm } from "./admin-guest-form"
import type { GuestData } from "./admin-guest-dropdown"

export function AdminGuest() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [allGuests, setAllGuests] = useState<GuestData[]>([])
  const [selectedGuest, setSelectedGuest] = useState<GuestData | null>(null)
  const [editedGuest, setEditedGuest] = useState<GuestData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)
  const [isNewGuest, setIsNewGuest] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current && supabase) {
      supabase
        .from("guests")
        .select(
          "guest, guest_id, guest_displayname, guest_instrument, guest_category, guest_canonid"
        )
        .order("guest", { ascending: true })
        .then(({ data, error }) => {
          if (!error) setAllGuests(data ?? [])
        })
      mountedRef.current = true
    }
  }, [])

  const handleGuestSelect = (guest: GuestData) => {
    setSelectedGuest(guest)
    setEditedGuest(guest)
    setIsEditing(false)
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editedGuest) return
    const { name, value } = e.target
    const nextValue =
      name === "guest" ? value : value === "" ? null : value
    setEditedGuest({
      ...editedGuest,
      [name]: nextValue,
    })
  }

  const toggleEdit = () => {
    if (isEditing) handleSaveChanges()
    else setIsEditing(true)
  }

  const handleSaveChanges = async () => {
    if (!editedGuest || !token) return
    setIsSubmitting(true)
    try {
      const guestToUpdate = {
        ...editedGuest,
        guest_displayname:
          editedGuest.guest_displayname === ""
            ? null
            : editedGuest.guest_displayname,
        guest_instrument:
          editedGuest.guest_instrument === ""
            ? null
            : editedGuest.guest_instrument,
        guest_category:
          editedGuest.guest_category === ""
            ? null
            : editedGuest.guest_category,
      }
      const { error } = await invokeDproAdmin(token, {
        action: "guests_update",
        guest_id: guestToUpdate.guest_id,
        patch: {
          guest: guestToUpdate.guest,
          guest_displayname: guestToUpdate.guest_displayname,
          guest_instrument: guestToUpdate.guest_instrument,
          guest_category: guestToUpdate.guest_category,
        },
      })
      if (error) throw new Error(error)
      setSelectedGuest(guestToUpdate)
      setEditedGuest(guestToUpdate)
      setIsEditing(false)
      if (supabase) {
        const { data } = await supabase
          .from("guests")
          .select(
            "guest, guest_id, guest_displayname, guest_instrument, guest_category, guest_canonid"
          )
          .order("guest", { ascending: true })
        if (data) setAllGuests(data)
      }
    } catch (error) {
      console.error("Error updating guest:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenNewGuestModal = () => {
    setIsNewGuest(true)
    setIsGuestModalOpen(true)
  }

  const handleGuestModalSave = () => {
    if (supabase) {
      supabase
        .from("guests")
        .select(
          "guest, guest_id, guest_displayname, guest_instrument, guest_category, guest_canonid"
        )
        .order("guest", { ascending: true })
        .then(({ data }) => data && setAllGuests(data))
    }
    setIsGuestModalOpen(false)
  }

  const handleCategoryChange = (v: string) =>
    setEditedGuest((prev) =>
      prev ? { ...prev, guest_category: v === "__none__" ? "" : v } : null
    )

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Personnel Management">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenNewGuestModal}
          className="wl-home-v2-tours-header-pill gap-1"
          title="New personnel"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
        </Button>
        <AdminGuestDropdown
          guests={allGuests}
          onGuestSelect={handleGuestSelect}
          selectedGuest={selectedGuest}
        />
      </AdminTabToolbar>
      {selectedGuest && (
        <AdminGuestForm
          guest={selectedGuest}
          editedGuest={editedGuest}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onInputChange={handleInputChange}
          onCategoryChange={handleCategoryChange}
          onToggleEdit={toggleEdit}
        />
      )}
      <GuestModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        guest={selectedGuest}
        onSave={handleGuestModalSave}
        isNewGuest={isNewGuest}
      />
    </AdminTabShell>
  )
}

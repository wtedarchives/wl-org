"use client"

import { useState, useEffect, useRef } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { GuestModal } from "./guest-modal"
import { AdminGuestDropdown } from "./admin-guest-dropdown"
import { AdminGuestForm } from "./admin-guest-form"
import type { GuestData } from "./admin-guest-dropdown"

export function AdminGuest() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [allGuests, setAllGuests] = useState<GuestData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<GuestData | null>(null)
  const [editedGuest, setEditedGuest] = useState<GuestData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)
  const [isNewGuest, setIsNewGuest] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedGuestRef = useRef<HTMLButtonElement | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (isDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        isDropdownOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

  useEffect(() => {
    if (
      isDropdownOpen &&
      selectedGuest &&
      selectedGuestRef.current &&
      scrollContainerRef.current
    ) {
      setTimeout(() => {
        selectedGuestRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }, 100)
    }
  }, [isDropdownOpen, selectedGuest])

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

  const filteredGuests = allGuests.filter((g) =>
    g.guest.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleGuestSelect = (guest: GuestData) => {
    setSelectedGuest(guest)
    setEditedGuest(guest)
    setIsDropdownOpen(false)
    setSearchTerm("")
    setIsEditing(false)
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editedGuest) return
    const { name, value } = e.target
    setEditedGuest({
      ...editedGuest,
      [name]: value === "" ? null : value,
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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Personnel Management</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewGuestModal}
          >
            <Plus className="size-4" />
          </Button>
          <AdminGuestDropdown
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filteredGuests={filteredGuests}
            selectedGuest={selectedGuest}
            onGuestSelect={handleGuestSelect}
            triggerRef={triggerRef}
            dropdownRef={dropdownRef}
            scrollContainerRef={scrollContainerRef}
            selectedGuestRef={selectedGuestRef}
            dropdownPosition={dropdownPosition}
          />
        </div>
      </div>
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
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search, Save, Edit, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GuestModal } from "./guest-modal"

interface GuestData {
  guest: string
  guest_id: string
  guest_displayname: string | null
  guest_instrument: string | null
  guest_category: string | null
  guest_canonid: number | null
}

const GUEST_CATEGORIES = [
  "Goose (current)",
  "Goose (former)",
  "Group",
  "Guest",
]

export function AdminGuest() {
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    if (!editedGuest || !supabase) return
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
      const { error } = await supabase
        .from("guests")
        .update({
          guest: guestToUpdate.guest,
          guest_displayname: guestToUpdate.guest_displayname,
          guest_instrument: guestToUpdate.guest_instrument,
          guest_category: guestToUpdate.guest_category,
        })
        .eq("guest_id", guestToUpdate.guest_id)
      if (error) throw error
      setSelectedGuest(guestToUpdate)
      setEditedGuest(guestToUpdate)
      setIsEditing(false)
      const { data } = await supabase
        .from("guests")
        .select(
          "guest, guest_id, guest_displayname, guest_instrument, guest_category, guest_canonid"
        )
        .order("guest", { ascending: true })
      if (data) setAllGuests(data)
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

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Guest Management</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewGuestModal}
          >
            <Plus className="size-4" />
          </Button>
          <div>
            <Button
              ref={triggerRef}
              variant="outline"
              size="sm"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="gap-2"
            >
              Guest
              <ChevronDown className="size-4" />
            </Button>
            {isDropdownOpen &&
              createPortal(
                <div
                  ref={dropdownRef}
                  className="fixed z-[100] w-64 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-md border bg-background shadow-lg"
                  style={{
                    top: dropdownPosition.top,
                    right: dropdownPosition.right,
                  }}
                >
                <div className="p-1">
                  <div className="relative">
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search guests..."
                      className="h-8 pr-8 text-xs"
                    />
                    <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div
                  ref={scrollContainerRef}
                  className="max-h-64 overflow-y-auto divide-y"
                >
                  {filteredGuests.map((guest) => (
                    <button
                      key={guest.guest_id}
                      ref={
                        selectedGuest?.guest_id === guest.guest_id
                          ? selectedGuestRef
                          : null
                      }
                      type="button"
                      onClick={() => handleGuestSelect(guest)}
                      className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted ${
                        selectedGuest?.guest_id === guest.guest_id
                          ? "bg-muted"
                          : ""
                      }`}
                    >
                      {guest.guest}
                    </button>
                  ))}
                  {filteredGuests.length === 0 && (
                    <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                      No guests found
                    </div>
                  )}
                </div>
              </div>,
                document.body
              )}
          </div>
        </div>
      </div>
      {selectedGuest && (
        <div className="px-2 pb-1">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">{selectedGuest.guest}</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleEdit}
              disabled={isSubmitting}
              className="gap-1"
            >
              {isEditing ? (
                <>
                  <Save className="size-4" />
                  Save
                </>
              ) : (
                <>
                  <Edit className="size-4" />
                  Edit
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Guest Name
              </label>
              <Input
                type="text"
                name="guest"
                value={editedGuest?.guest ?? ""}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Display Name
              </label>
              <Input
                type="text"
                name="guest_displayname"
                value={editedGuest?.guest_displayname ?? ""}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Instrument
              </label>
              <Input
                type="text"
                name="guest_instrument"
                value={editedGuest?.guest_instrument ?? ""}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Category
              </label>
              {isEditing ? (
                <Select
                  value={editedGuest?.guest_category ?? ""}
                  onValueChange={(v) =>
                    setEditedGuest((prev) =>
                      prev ? { ...prev, guest_category: v } : null
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="-- Select Category --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Select Category --</SelectItem>
                    {GUEST_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={editedGuest?.guest_category ?? ""}
                  readOnly
                  className="h-8 text-xs"
                />
              )}
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Canon ID
              </label>
              <Input
                value={editedGuest?.guest_canonid ?? ""}
                readOnly
                className="h-8 text-xs"
              />
              <p className="mt-0.5 text-xs italic text-muted-foreground">
                Auto-generated value
              </p>
            </div>
          </div>
        </div>
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

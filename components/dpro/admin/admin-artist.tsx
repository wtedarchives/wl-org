"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ArtistBasic {
  artist: string
  artist_id: string
}

export function AdminArtist() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [allArtists, setAllArtists] = useState<ArtistBasic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState("")
  const [newArtistName, setNewArtistName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buttonState, setButtonState] = useState<
    "default" | "success" | "error"
  >("default")
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
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
    if (buttonState !== "default") {
      const t = setTimeout(() => setButtonState("default"), 2000)
      return () => clearTimeout(t)
    }
  }, [buttonState])

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
    if (!mountedRef.current && supabase) {
      supabase
        .from("artists")
        .select("artist, artist_id")
        .order("artist", { ascending: true })
        .then(({ data, error }) => {
          if (!error) setAllArtists(data ?? [])
        })
      mountedRef.current = true
    }
  }, [])

  const filteredArtists = allArtists.filter((a) =>
    a.artist.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!supabase) return
    if (!token) {
      setButtonState("error")
      return
    }
    setButtonState("default")
    if (!newArtistName.trim()) {
      setButtonState("error")
      return
    }
    setIsSubmitting(true)
    try {
      const exists = allArtists.some(
        (a) =>
          a.artist.toLowerCase() === newArtistName.trim().toLowerCase()
      )
      if (exists) {
        setButtonState("error")
        return
      }
      const { error } = await invokeDproAdmin(token, {
        action: "rpc_add_artist",
        artist_name: newArtistName.trim(),
      })
      if (error) throw new Error(`Failed to add artist: ${error}`)
      setButtonState("success")
      setNewArtistName("")
      const { data } = await supabase
        .from("artists")
        .select("artist, artist_id")
        .order("artist", { ascending: true })
      if (data) setAllArtists(data)
    } catch {
      setButtonState("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Artist Management</h3>
        <div>
          <Button
            ref={triggerRef}
            variant="outline"
            size="sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="gap-2"
          >
            Current Artists
            <ChevronDown className="size-4" />
          </Button>
          {isDropdownOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                className="wl-home-v2-archive-admin-floating-dropdown fixed"
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
                      placeholder="Search artists..."
                      className="h-8 pr-8 text-xs"
                    />
                    <Search className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[rgb(49,51,49)]">
                  {filteredArtists.map((artist) => (
                    <button
                      key={artist.artist_id}
                      type="button"
                      onClick={() => {
                        setSelectedArtist(artist.artist)
                        setIsDropdownOpen(false)
                        setSearchTerm("")
                      }}
                      className="wl-home-v2-archive-admin-floating-dropdown__row"
                    >
                      {artist.artist}
                    </button>
                  ))}
                  {filteredArtists.length === 0 && (
                    <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
                      No artists found
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Input
          type="text"
          value={newArtistName}
          onChange={(e) => setNewArtistName(e.target.value)}
          placeholder="Enter artist name"
          className="h-8 min-w-0 flex-1 text-xs"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            buttonState === "success" ||
            buttonState === "error"
          }
          variant={
            buttonState === "success"
              ? "default"
              : buttonState === "error"
                ? "destructive"
                : "default"
          }
          className="h-8 shrink-0"
        >
          {isSubmitting
            ? "Adding..."
            : buttonState === "success"
              ? <CheckCircle className="size-4" />
              : buttonState === "error"
                ? <XCircle className="size-4" />
                : "Submit"}
        </Button>
      </div>
    </div>
  )
}

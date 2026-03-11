"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Search, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ArtistBasic {
  artist: string
  artist_id: string
}

export function AdminArtist() {
  const [allArtists, setAllArtists] = useState<ArtistBasic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState("")
  const [newArtistName, setNewArtistName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buttonState, setButtonState] = useState<
    "default" | "success" | "error"
  >("default")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (buttonState !== "default") {
      const t = setTimeout(() => setButtonState("default"), 2000)
      return () => clearTimeout(t)
    }
  }, [buttonState])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
      const { error } = await supabase.rpc("add_artist", {
        artist_name: newArtistName.trim(),
      })
      if (error) throw new Error(`Failed to add artist: ${error.message}`)
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
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="gap-2"
          >
            Current Artists
            <ChevronDown className="size-4" />
          </Button>
          {isDropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-64 max-h-96 overflow-y-auto rounded-md border bg-background shadow-lg">
              <div className="p-1">
                <div className="relative">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search artists..."
                    className="h-8 pr-8 text-xs"
                  />
                  <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {filteredArtists.map((artist) => (
                  <button
                    key={artist.artist_id}
                    type="button"
                    onClick={() => {
                      setSelectedArtist(artist.artist)
                      setIsDropdownOpen(false)
                      setSearchTerm("")
                    }}
                    className="w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted"
                  >
                    {artist.artist}
                  </button>
                ))}
                {filteredArtists.length === 0 && (
                  <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                    No artists found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1 md:flex-row">
        <Input
          type="text"
          value={newArtistName}
          onChange={(e) => setNewArtistName(e.target.value)}
          placeholder="Enter artist name"
          className="h-8 flex-grow text-xs"
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
          className="min-w-[80px]"
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

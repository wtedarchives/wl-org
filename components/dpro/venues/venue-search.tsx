"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface VenueBasic {
  subvenue: string
  subvenue_venue: string
  subvenue_venue_location: string
  venue_id: string
}

export function VenueSearch({
  className = "",
  onOpenChange,
}: {
  className?: string
  onOpenChange?: (open: boolean) => void
}) {
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)
  const [venues, setVenues] = useState<VenueBasic[]>([])
  const [open, setOpen] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }
  const [searchValue, setSearchValue] = useState("")
  const [selectedVenue, setSelectedVenue] = useState("")

  useEffect(() => {
    if (open) setSearchValue("")
  }, [open])

  useEffect(() => {
    async function fetchAllVenues() {
      if (!supabase) return
      try {
        const { data, error } = await supabase
          .from("subvenues")
          .select(
            `
            subvenue,
            subvenue_venue,
            subvenue_venue_location,
            venues!inner (
              venue_id
            )
          `,
          )
          .order("subvenue", { ascending: true })

        if (error) throw error

        const processed =
          (data as Array<{
            subvenue: string
            subvenue_venue: string
            subvenue_venue_location: string
            venues: { venue_id: string } | Array<{ venue_id: string }>
          }>)?.map((row) => {
            const v = row.venues
            const venueId = Array.isArray(v) ? v[0]?.venue_id : v?.venue_id
            return {
              subvenue: row.subvenue,
              subvenue_venue: row.subvenue_venue,
              subvenue_venue_location: row.subvenue_venue_location,
              venue_id: venueId ?? "",
            }
          }) ?? []
        setVenues(processed.filter((v) => v.venue_id))
      } catch {
        setVenues([])
      }
    }
    fetchAllVenues()
  }, [])

  const handleSelect = (venueId: string, subvenue: string) => {
    setSelectedVenue(subvenue)
    setOpen(false)
    router.push(`/archive/venue/${venueId}`)
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-between gap-2 pr-2 font-semibold text-xs md:w-auto"
        onClick={() => handleOpenChange(true)}
      >
        <span className="truncate">{selectedVenue || "Search"}</span>
        <Search className="size-3 shrink-0" />
      </Button>
      <CommandDialog open={open} onOpenChange={handleOpenChange} label="Search venues">
        <CommandInput
          placeholder="Search venues..."
          value={searchValue}
          onValueChange={(value) => {
            setSearchValue(value)
            listRef.current?.scrollTo({ top: 0 })
          }}
        />
        <CommandList ref={listRef}>
          <CommandEmpty>No venues found.</CommandEmpty>
          <CommandGroup heading="Venues">
            {venues.map((venue) => (
              <CommandItem
                key={`${venue.subvenue}-${venue.subvenue_venue}`}
                value={`${venue.subvenue} ${venue.subvenue_venue} ${venue.subvenue_venue_location}`}
                keywords={[
                  venue.subvenue,
                  venue.subvenue_venue,
                  venue.subvenue_venue_location ?? "",
                ]}
                onSelect={() => handleSelect(venue.venue_id, venue.subvenue)}
              >
                {venue.subvenue}
                {venue.subvenue_venue_location && (
                  <span className="ml-2.5 text-[10px] text-muted-foreground font-normal">
                    {venue.subvenue_venue_location}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}

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
import { formatInstrument } from "@/lib/personnel-utils"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"

interface GuestBasic {
  guest: string
  guest_id: string
  guest_instrument?: string | null
}

export function PersonnelSearch({ className = "" }: { className?: string }) {
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)
  const [guests, setGuests] = useState<GuestBasic[]>([])
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedGuest, setSelectedGuest] = useState("")

  useEffect(() => {
    if (open) setSearchValue("")
  }, [open])

  useEffect(() => {
    async function fetchAllGuests() {
      if (!supabase) return
      try {
        const { data, error } = await supabase
          .from("guests")
          .select("guest, guest_id, guest_instrument")
          .order("guest", { ascending: true })

        if (error) throw error
        setGuests((data as GuestBasic[]) ?? [])
      } catch {
        setGuests([])
      }
    }
    fetchAllGuests()
  }, [])

  const handleSelect = (guestId: string, guestName: string) => {
    setSelectedGuest(guestName)
    setOpen(false)
    router.push(getPersonnelArchiveUrl(guestId))
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-between gap-2 pr-2 font-semibold text-xs md:w-auto"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{selectedGuest || "Search"}</span>
        <Search className="size-3 shrink-0" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} label="Search personnel">
        <CommandInput
          placeholder="Search personnel..."
          value={searchValue}
          onValueChange={(value) => {
            setSearchValue(value)
            listRef.current?.scrollTo({ top: 0 })
          }}
        />
        <CommandList ref={listRef}>
          <CommandEmpty>No personnel found.</CommandEmpty>
          <CommandGroup heading="Personnel">
            {guests.map((guest) => (
              <CommandItem
                key={guest.guest_id}
                value={guest.guest_id}
                keywords={[guest.guest, guest.guest_instrument ?? ""]}
                onSelect={() => handleSelect(guest.guest_id, guest.guest)}
              >
                {guest.guest}
                {guest.guest_instrument && (
                  <span className="ml-2.5 text-[10px] text-muted-foreground font-normal">
                    {formatInstrument(guest.guest_instrument)}
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

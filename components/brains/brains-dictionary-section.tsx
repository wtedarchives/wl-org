"use client"

import { useState } from "react"
import { CaretDown } from "@phosphor-icons/react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

import { BrainsAddArtist } from "./brains-add-artist"
import { BrainsAddPersonnel } from "./brains-add-personnel"
import { BrainsAddSong } from "./brains-add-song"
import { useBrainsWork } from "./brains-work-context"

type Panel = "song" | "personnel" | "artist"

const PANELS: { id: Panel; label: string }[] = [
  { id: "song", label: "Songs" },
  { id: "personnel", label: "Personnel" },
  { id: "artist", label: "Artists" },
]

/**
 * Songs, personnel and artists — the archive-wide lists a setlister may add to.
 *
 * Collapsed by default and one panel at a time. The setlist is the job; these are
 * for the moment a debut or a sit-in needs a record that does not exist yet, so
 * they stay out of the way until asked for. That matters most on a phone, where
 * three open panels would push the setlist off the screen.
 *
 * Each panel is search-then-add: brains holds insert rights on these tables and no
 * update rights, so the lookup exists to prevent duplicates rather than to edit.
 */
export function BrainsDictionarySection() {
  const { readOnly } = useBrainsWork()
  const [open, setOpen] = useState<Panel | null>(null)

  if (readOnly) return null

  return (
    <section className="flex min-w-0 flex-col gap-2 border-t border-white/10 pt-3">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-white/90">
        Add to the archive
      </span>

      <div className="flex min-w-0 flex-col gap-1.5">
        {PANELS.map(({ id, label }) => {
          const isOpen = open === id
          return (
            <Collapsible
              key={id}
              open={isOpen}
              onOpenChange={(next) => setOpen(next ? id : null)}
            >
              <CollapsibleTrigger className="flex w-full min-w-0 items-center justify-between gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-white/85">
                  {label}
                </span>
                <CaretDown
                  className={cn(
                    "size-3.5 shrink-0 opacity-70 transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-1 pt-2">
                {id === "song" && <BrainsAddSong />}
                {id === "personnel" && <BrainsAddPersonnel />}
                {id === "artist" && <BrainsAddArtist />}
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </section>
  )
}

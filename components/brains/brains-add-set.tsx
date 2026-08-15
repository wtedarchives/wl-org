"use client"

import { useState } from "react"
import { Plus } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { compareBrainsSets, formatBrainsSetLabel } from "@/lib/brains-sets"
import { cn } from "@/lib/utils"

interface BrainsAddSetProps {
  availableSets: string[]
  onAdd: (setKey: string) => void
}

export function BrainsAddSet({ availableSets, onAdd }: BrainsAddSetProps) {
  const [open, setOpen] = useState(false)
  const sorted = [...availableSets].sort(compareBrainsSets)

  if (sorted.length === 0) return null

  return (
    <div className="wl-home-v2-brains-add-set">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="wl-home-v2-tours-header-pill min-h-11 gap-1"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
        Add set
      </Button>
      <div
        className={cn(
          "wl-home-v2-brains-add-set__panel",
          open ?
            "wl-home-v2-brains-add-set__panel--open"
          : "wl-home-v2-brains-add-set__panel--closed",
        )}
      >
        <div className="wl-home-v2-brains-add-set__inner">
          <p className="m-0 mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/55">
            Which set?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((setKey) => (
              <Button
                key={setKey}
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={() => {
                  onAdd(setKey)
                  setOpen(false)
                }}
              >
                {formatBrainsSetLabel(setKey)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

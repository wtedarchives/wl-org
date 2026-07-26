"use client"

import { X } from "lucide-react"
import type { TourData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PosterFormToursSectionProps {
  tourNames: string[]
  tours: TourData[]
  availableTours: TourData[]
  tourPickKey: number
  onTourPick: (tourName: string) => void
  onRemoveTour: (tourName: string) => void
}

export function PosterFormToursSection({
  tourNames,
  tours,
  availableTours,
  tourPickKey,
  onTourPick,
  onRemoveTour,
}: PosterFormToursSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Tours</Label>
      {availableTours.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {tours.length === 0
            ? "Loading tours…"
            : "All tours already linked."}
        </p>
      ) : (
        <Select
          key={tourPickKey}
          onValueChange={(v) => {
            onTourPick(v)
          }}
        >
          <SelectTrigger className="h-11 w-full text-xs sm:h-8">
            <SelectValue placeholder="Add tour" />
          </SelectTrigger>
          <SelectContent>
            {availableTours.map((t) => (
              <SelectItem key={t.tour} value={t.tour}>
                {t.tour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {tourNames.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {tourNames.map((tour) => (
            <li
              key={tour}
              className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
            >
              <span className="min-w-0 truncate">{tour}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 p-0"
                onClick={() => onRemoveTour(tour)}
                aria-label={`Remove tour ${tour}`}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No tours linked.</p>
      )}
    </div>
  )
}

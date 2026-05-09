"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VenueMapFilterModalProps {
  isOpen: boolean
  onClose: () => void
  groups: Array<{ group: string }>
  tours: Array<{ tour: string }>
  selectedGroup: string
  selectedTour: string
  onGroupChange: (value: string) => void
  onTourChange: (value: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  wlHomeV2?: boolean
}

export function VenueMapFilterModal({
  isOpen,
  onClose,
  groups,
  tours,
  selectedGroup,
  selectedTour,
  onGroupChange,
  onTourChange,
  onClearFilters,
  hasActiveFilters,
  wlHomeV2 = false,
}: VenueMapFilterModalProps) {
  const isGroupDropdownDisabled = selectedTour !== "Show All"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={
          wlHomeV2 ?
            "venues-archive-map-filter-dialog max-w-md border-0 shadow-none ring-0 sm:max-w-md"
          : "sm:max-w-md"
        }
      >
        <DialogHeader>
          <DialogTitle
            className={wlHomeV2 ? "venues-archive-map-filter-dialog-title" : ""}
          >
            Venue map filters
          </DialogTitle>
        </DialogHeader>
        <div
          className={
            wlHomeV2 ? "venues-archive-map-filter-dialog-body space-y-6" : "space-y-6 py-4"
          }
        >
          <div className="space-y-2">
            <label
              htmlFor="tour-filter-modal"
              className={
                wlHomeV2 ?
                  "venues-archive-map-filter-field-label"
                : "block text-sm font-medium"
              }
            >
              Filter by tour
            </label>
            <Select
              value={selectedTour}
              onValueChange={(value) => {
                onTourChange(value)
                onClose()
              }}
            >
              <SelectTrigger
                id="tour-filter-modal"
                className={wlHomeV2 ? "venues-archive-map-select-trigger w-full" : ""}
              >
                <SelectValue placeholder="[Show All]" />
              </SelectTrigger>
              <SelectContent
                className={
                  wlHomeV2 ? "venues-archive-map-select-content" : undefined
                }
              >
                <SelectItem value="Show All">[Show All]</SelectItem>
                {tours.map((tour) => (
                  <SelectItem key={tour.tour} value={tour.tour}>
                    {tour.tour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="group-filter-modal"
              className={
                wlHomeV2 ?
                  "venues-archive-map-filter-field-label"
                : "block text-sm font-medium"
              }
            >
              Filter by group
            </label>
            <Select
              value={selectedGroup}
              onValueChange={(value) => {
                onGroupChange(value)
                onClose()
              }}
              disabled={isGroupDropdownDisabled}
            >
              <SelectTrigger
                id="group-filter-modal"
                className={
                  wlHomeV2 ?
                    cn(
                      "venues-archive-map-select-trigger w-full",
                      isGroupDropdownDisabled && "opacity-50",
                    )
                  : isGroupDropdownDisabled ? "opacity-50" : ""
                }
              >
                <SelectValue placeholder="[Show All]" />
              </SelectTrigger>
              <SelectContent
                className={
                  wlHomeV2 ? "venues-archive-map-select-content" : undefined
                }
              >
                <SelectItem value="Show All">[Show All]</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.group} value={group.group}>
                    {group.group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters ?
            <div
              className={
                wlHomeV2 ?
                  "venues-archive-map-filter-actions border-t border-[rgb(53,56,54)] pt-4"
                : "border-t pt-4"
              }
            >
              {wlHomeV2 ?
                <button
                  type="button"
                  className="venues-archive-map-clear-btn venues-archive-map-clear-btn--full"
                  onClick={() => {
                    onClearFilters()
                    onClose()
                  }}
                >
                  Clear all filters
                </button>
              : <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    onClearFilters()
                    onClose()
                  }}
                >
                  Clear All Filters
                </Button>
              }
            </div>
          : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
}: VenueMapFilterModalProps) {
  const isGroupDropdownDisabled = selectedTour !== "Show All"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Venue Map Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label
              htmlFor="tour-filter-modal"
              className="block text-sm font-medium"
            >
              Filter by Tour:
            </label>
            <Select
              value={selectedTour}
              onValueChange={(value) => {
                onTourChange(value)
                onClose()
              }}
            >
              <SelectTrigger id="tour-filter-modal">
                <SelectValue placeholder="[Show All]" />
              </SelectTrigger>
              <SelectContent>
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
              className="block text-sm font-medium"
            >
              Filter by Group:
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
                className={isGroupDropdownDisabled ? "opacity-50" : ""}
              >
                <SelectValue placeholder="[Show All]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Show All">[Show All]</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.group} value={group.group}>
                    {group.group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  onClearFilters()
                  onClose()
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

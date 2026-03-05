"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface SetlistRatingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRating: number | null
  initialReview: string | null
  onSubmit: (rating: number, review: string) => Promise<void>
  submitting: boolean
}

export function SetlistRatingSheet({
  open,
  onOpenChange,
  initialRating,
  initialReview,
  onSubmit,
  submitting,
}: SetlistRatingSheetProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")

  useEffect(() => {
    if (open) {
      setRating(initialRating ?? 0)
      setReview(initialReview ?? "")
      setHoverRating(0)
    }
  }, [open, initialRating, initialReview])

  const displayRating = hoverRating || rating
  const handleSubmit = async () => {
    const r = rating || 1
    await onSubmit(r, review)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-xl"
        showCloseButton={true}
      >
        <div className="mx-auto max-w-sm space-y-4 pb-6">
          <h3 className="text-sm font-semibold">Rate this show</h3>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="p-0.5 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <Star
                  className={`size-8 transition-colors ${
                    value <= displayRating
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground/30"
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="setlist-rating-review" className="text-xs">
              Review (optional)
            </Label>
            <Textarea
              id="setlist-rating-review"
              placeholder="Share your thoughts..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              rows={3}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || (rating < 1 || rating > 5)}
          >
            {submitting ? "Saving…" : "Submit rating"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

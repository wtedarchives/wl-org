import type { ReviewEntry } from "@/hooks/use-setlist-rating"

export type SetlistRatingPanelVisualVariant = "default" | "wl-home-v2"

export interface SetlistRatingPanelProps {
  /** When true, syncs local form state and refetches reviews (same as drawer `open`). */
  active: boolean
  averageRating: number
  reviewCount: number
  userRating: number | null
  userReview: string | null
  reviews: ReviewEntry[]
  isLoadingReviews: boolean
  reviewsError: string | null
  onSubmit: (rating: number, review: string) => Promise<void>
  submitting: boolean
  onFetchReviews: () => void
  validateReview: (text: string) => string | null
  className?: string
  /** Match WL Home v2 “Request a Song” modal inner panel (catalog surface + dividers). */
  visualVariant?: SetlistRatingPanelVisualVariant
}

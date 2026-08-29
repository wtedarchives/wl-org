"use client"

import { useState, useEffect, useCallback } from "react"
import { invokeSubmitShowRating } from "@/lib/show-rating-edge"
import { supabase } from "@/lib/supabase"
import type { WysteriaSession } from "@/lib/jwt"

export interface ReviewEntry {
  rating: number
  review: string | null
  username: string
}

// Apostrophes: straight ', iOS long-press ` ‘ ’, plus common typographic variants.
const REVIEW_VALID_REGEX = /^[a-zA-Z0-9\s.,!?'"`´‘’‚‛ʼʻ′()<>—–-]*$/

export function useSetlistRating(showId: string | undefined, session: WysteriaSession | null) {
  const [averageRating, setAverageRating] = useState<number>(0)
  const [reviewCount, setReviewCount] = useState<number>(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [userReview, setUserReview] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewEntry[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!showId || !supabase) {
      setLoading(false)
      return
    }
    const client = supabase
    async function fetchRatings() {
      setLoading(true)
      try {
        const { data, error } = await client
          .from("show_ratings")
          .select("user_id, rating, review")
          .eq("show_id", showId)
        if (error) throw error
        const rows = (data ?? []) as { user_id: string; rating: number; review: string | null }[]
        if (rows.length > 0) {
          const sum = rows.reduce((s, r) => s + r.rating, 0)
          setAverageRating(Math.round((sum / rows.length) * 100) / 100)
          setReviewCount(rows.length)
        } else {
          setAverageRating(0)
          setReviewCount(0)
        }
        if (session) {
          const mine = rows.find((r) => r.user_id === session?.profileId)
          if (mine) {
            setUserRating(mine.rating)
            setUserReview(mine.review ?? null)
          } else {
            setUserRating(null)
            setUserReview(null)
          }
        } else {
          setUserRating(null)
          setUserReview(null)
        }
      } catch (err) {
        console.error("Error fetching show ratings:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRatings()
  }, [showId, session?.profileId])

  const fetchReviews = useCallback(async () => {
    if (!showId || !supabase) return
    const client = supabase
    setIsLoadingReviews(true)
    setReviewsError(null)
    try {
      const { data: rows, error } = await client
        .from("show_ratings")
        .select("rating, review, user_id")
        .eq("show_id", showId)
        .order("rating", { ascending: false })
      if (error) throw error
      const ratings = (rows ?? []) as {
        rating: number
        review: string | null
        user_id: string
      }[]
      if (ratings.length === 0) {
        setReviews([])
        return
      }
      const userIds = [...new Set(ratings.map((r) => r.user_id))]
      const { data: profiles } = await client
        .from("profiles")
        .select("id, username")
        .in("id", userIds)
      const userMap = new Map(
        (profiles ?? []).map((p: { id: string; username: string | null }) => [
          p.id,
          p.username ?? "Anonymous",
        ])
      )
      const entries: ReviewEntry[] = ratings.map((r) => ({
        rating: r.rating,
        review: r.review ?? null,
        username: userMap.get(r.user_id) ?? "Anonymous",
      }))
      entries.sort((a, b) => {
        if (a.rating !== b.rating) return b.rating - a.rating
        return a.username.localeCompare(b.username)
      })
      setReviews(entries)
    } catch (err) {
      console.error("Error fetching reviews:", err)
      setReviewsError("Failed to load reviews.")
    } finally {
      setIsLoadingReviews(false)
    }
  }, [showId])

  const submitRating = useCallback(
    async (rating: number, review: string) => {
      if (!showId || !session?.token) return
      const r = Math.min(5, Math.max(1, Math.round(rating)))
      const rev = review.trim() || null
      setSubmitting(true)
      try {
        const result = await invokeSubmitShowRating(session.token, {
          show_id: showId,
          rating: r,
          review: rev,
        })
        if (!result.ok) {
          console.error("Error submitting rating:", result.error)
          return
        }
        setUserRating(result.user_rating)
        setUserReview(result.user_review)
        setAverageRating(result.average_rating)
        setReviewCount(result.review_count)
        fetchReviews()
      } catch (err) {
        console.error("Error submitting rating:", err)
      } finally {
        setSubmitting(false)
      }
    },
    [showId, session?.token, fetchReviews],
  )

  const validateReview = useCallback((text: string): string | null => {
    if (!text.trim()) return null
    if (!REVIEW_VALID_REGEX.test(text)) {
      return "Review can only contain letters, numbers, and basic punctuation."
    }
    return null
  }, [])

  return {
    averageRating,
    reviewCount,
    userRating,
    userReview,
    reviews,
    isLoadingReviews,
    reviewsError,
    loading,
    submitting,
    submitRating,
    fetchReviews,
    validateReview,
  }
}

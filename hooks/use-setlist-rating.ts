"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export function useSetlistRating(showId: string | undefined, user: User | null) {
  const [averageRating, setAverageRating] = useState<number>(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [userReview, setUserReview] = useState<string | null>(null)
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
        } else {
          setAverageRating(0)
        }
        if (user) {
          const mine = rows.find((r) => r.user_id === user.id)
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
  }, [showId, user?.id])

  const submitRating = useCallback(
    async (rating: number, review: string) => {
      if (!showId || !user || !supabase) return
      const client = supabase
      const r = Math.min(5, Math.max(1, Math.round(rating)))
      const rev = review.trim() || null
      setSubmitting(true)
      try {
        const { data: existing } = await client
          .from("show_ratings")
          .select("uuid")
          .eq("show_id", showId)
          .eq("user_id", user.id)
          .maybeSingle()
        if (existing && (existing as { uuid: string }).uuid) {
          await client
            .from("show_ratings")
            .update({ rating: r, review: rev })
            .eq("show_id", showId)
            .eq("user_id", user.id)
        } else {
          await client.from("show_ratings").insert({
            show_id: showId,
            user_id: user.id,
            rating: r,
            review: rev,
          })
        }
        setUserRating(r)
        setUserReview(rev)
        const { data: all } = await client
          .from("show_ratings")
          .select("rating")
          .eq("show_id", showId)
        const rows = (all ?? []) as { rating: number }[]
        if (rows.length > 0) {
          const sum = rows.reduce((s, row) => s + row.rating, 0)
          setAverageRating(Math.round((sum / rows.length) * 100) / 100)
        }
      } catch (err) {
        console.error("Error submitting rating:", err)
      } finally {
        setSubmitting(false)
      }
    },
    [showId, user]
  )

  return {
    averageRating,
    userRating,
    userReview,
    loading,
    submitting,
    submitRating,
  }
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { supabase } from "@/lib/supabase"

interface MetaShow {
  show_id: string
}

export function useShowMetadata(shows: MetaShow[], currentYear: string) {
  const hasFetchedSetlists = useRef(false)
  const hasFetchedReleases = useRef(false)
  const hasFetchedRadioIds = useRef(false)

  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(
    new Set(),
  )
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(
    new Set(),
  )
  const [showsWithRadioIds, setShowsWithRadioIds] = useState<Set<string>>(
    new Set(),
  )

  const showIdsKey = useMemo(
    () =>
      shows.length === 0 ?
        ""
      : [...shows.map((s) => s.show_id)].sort().join("|"),
    [shows],
  )

  useEffect(() => {
    hasFetchedSetlists.current = false
    hasFetchedReleases.current = false
    hasFetchedRadioIds.current = false
    setShowsWithSetlists(new Set())
    setShowsWithReleases(new Set())
    setShowsWithRadioIds(new Set())
  }, [showIdsKey])

  useEffect(() => {
    if (
      !supabase ||
      !currentYear ||
      shows.length === 0 ||
      hasFetchedSetlists.current
    ) {
      return
    }
    const client = supabase
    async function fetchShowsWithSetlists() {
      try {
        const { data, error } = await client
          .from("show_setlists")
          .select("show_id")
          .in(
            "show_id",
            shows.map((s) => s.show_id),
          )
        if (error) throw error
        const setlistSet = new Set((data ?? []).map((item) => item.show_id))
        setShowsWithSetlists(setlistSet)
        hasFetchedSetlists.current = true
      } catch {
        // Metadata is optional; ignore transient errors.
      }
    }
    fetchShowsWithSetlists()
  }, [shows, currentYear, showIdsKey])

  useEffect(() => {
    if (
      !supabase ||
      !currentYear ||
      shows.length === 0 ||
      hasFetchedReleases.current
    ) {
      return
    }
    const client = supabase
    async function fetchShowsWithReleases() {
      try {
        const showIds = shows.map((s) => s.show_id)
        const { count, error: countError } = await client
          .from("releases_shows")
          .select("*", { count: "exact", head: true })
          .in("show_id", showIds)
        if (countError) throw countError
        const batchSize = 1000
        const totalBatches = Math.ceil((count ?? 0) / batchSize)
        let allReleaseShows: { show_id: string }[] = []
        for (let i = 0; i < totalBatches; i += 1) {
          const start = i * batchSize
          const end = Math.min(start + batchSize - 1, (count ?? 0) - 1)
          const { data, error } = await client
            .from("releases_shows")
            .select("show_id")
            .in("show_id", showIds)
            .range(start, end)
          if (error) throw error
          if (data) {
            allReleaseShows = allReleaseShows.concat(
              data as { show_id: string }[],
            )
          }
        }
        const releaseSet = new Set(allReleaseShows.map((item) => item.show_id))
        setShowsWithReleases(releaseSet)
        hasFetchedReleases.current = true
      } catch {
        // Metadata is optional; ignore transient errors.
      }
    }
    fetchShowsWithReleases()
  }, [shows, currentYear, showIdsKey])

  useEffect(() => {
    if (
      !supabase ||
      !currentYear ||
      shows.length === 0 ||
      hasFetchedRadioIds.current
    ) {
      return
    }
    const client = supabase
    async function fetchShowsWithRadioIds() {
      try {
        const { data, error } = await client
          .from("setlist_entries")
          .select("entry_show, radio_id")
          .in(
            "entry_show",
            shows.map((s) => s.show_id),
          )
          .not("radio_id", "is", null)

        if (error) throw error

        const radioSet = new Set(
          (data ?? [])
            .map((item) => (item as any).entry_show as string | null)
            .filter(Boolean) as string[],
        )
        setShowsWithRadioIds(radioSet)
        hasFetchedRadioIds.current = true
      } catch {
        // Metadata is optional; ignore transient errors.
      }
    }
    fetchShowsWithRadioIds()
  }, [shows, currentYear, showIdsKey])

  return { showsWithSetlists, showsWithReleases, showsWithRadioIds }
}


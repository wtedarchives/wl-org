"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { useWlHomeV2OpenLogin } from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { useShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { useSetlistArchiveShowId } from "@/hooks/use-setlist-archive-show-id"
import { useSetlistData, useShowDates, useTours } from "@/hooks/use-setlist-data"
import { useSetlistAdmin } from "@/hooks/use-setlist-admin"
import { useSetlistNavigation } from "@/hooks/use-setlist-navigation"
import { useSetlistReleases } from "@/hooks/use-setlist-releases"
import { useSetlistScan } from "@/hooks/use-setlist-scan"
import { useShowChanges } from "@/hooks/use-setlist-show-changes"
import {
  useAttendeeCount,
  useShowPosition,
} from "@/hooks/use-setlist-display"
import { useSetlistAttendance } from "@/hooks/use-setlist-attendance"
import { useSetlistRating } from "@/hooks/use-setlist-rating"
import { useMaxShowCanonId } from "@/hooks/use-max-show-canonid"
import { useSetlistYearId } from "@/hooks/use-setlist-year-id"
import { useSongPairs } from "@/hooks/use-song-pairs"
import { buildSetlistPlainTextCopy } from "@/lib/setlist-plain-text-copy"
import { uniqueWtedEntriesFromPair } from "@/lib/song-pairs"
import { pickRandomShareBackground } from "@/lib/wl-home-v2-share-backgrounds"
import type { SetlistEntry } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

type SongModalMode = "single" | "multi-section"

export function useWlHomeV2SetlistPageClient() {
  const { session } = useAuth()
  const openLogin = useWlHomeV2OpenLogin()
  const { showId, invalidParams } = useSetlistArchiveShowId()
  const { show, setlist, loading, showLengthRank } = useSetlistData(showId)
  const { songPairs, loading: songPairsLoading } = useSongPairs()
  const {
    showAdminUi,
    linkCopied,
    handleCopyLink,
    handleEditShow,
  } = useSetlistAdmin(session, showId, show?.show_id)
  const { tours } = useTours()
  const { showDates } = useShowDates(show ?? null, showId)
  const showPosition = useShowPosition(show ?? null, showDates)
  const { handleTourSelect, handleShowSelect } = useSetlistNavigation(
    show ?? null,
  )
  const yearId = useSetlistYearId(show?.show_date)
  const { maxCanonId, loading: maxCanonLoading } = useMaxShowCanonId()
  const showPositionInTour = useShowPositionInTour(
    showId,
    show?.show_tour ?? undefined,
  )

  const jotyHeadingId = useId()
  const songModalHeadingId = useId()
  const songModalTourId = useId()
  const wtedModalHeadingId = useId()
  const ratingModalHeadingId = useId()
  const scanHeadingId = useId()
  const [jotyModalOpen, setJotyModalOpen] = useState(false)
  const [songModalOpen, setSongModalOpen] = useState(false)
  const [songModalEntry, setSongModalEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [songModalEntries, setSongModalEntries] = useState<SetlistEntry[]>([])
  const [songModalMode, setSongModalMode] = useState<SongModalMode>("single")
  const [songModalPairAltName, setSongModalPairAltName] = useState<
    string | null
  >(null)
  const [wtedModalOpen, setWtedModalOpen] = useState(false)
  const [wtedModalEntry, setWtedModalEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedModalEntryOptions, setWtedModalEntryOptions] = useState<
    SetlistEntry[] | null
  >(null)
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [jotyYear, setJotyYear] = useState<number | null>(null)
  const [jotyHighlightedEntryId, setJotyHighlightedEntryId] = useState<
    string | null
  >(null)
  const [copiedEntryIds, setCopiedEntryIds] = useState<Set<string>>(new Set())
  const [setlistTextCopied, setSetlistTextCopied] = useState(false)
  const [setlistScanModalOpen, setSetlistScanModalOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [shareExportOpen, setShareExportOpen] = useState(false)
  const [shareExportBg, setShareExportBg] = useState(
    pickRandomShareBackground,
  )

  const { changes: showChanges, loading: showChangesLoading } =
    useShowChanges(showId)

  useEffect(() => {
    setHoveredCategory(null)
  }, [showId])
  const { setlistUrl } = useSetlistScan(showId)
  const { releases, releaseToEntriesMap } = useSetlistReleases(showId)
  const fallbackWtedArtwork = releases[0]?.release_artwork ?? null

  const { attendeeCount, setAttendeeCount } = useAttendeeCount(
    showId,
    show ?? null,
  )
  const {
    averageRating,
    reviewCount,
    userRating,
    userReview,
    reviews,
    isLoadingReviews,
    reviewsError,
    submitting,
    submitRating,
    fetchReviews,
    validateReview,
  } = useSetlistRating(showId, session)
  const { attended, toggling, toggle } = useSetlistAttendance(
    showId,
    session,
    setAttendeeCount,
  )

  const onRatingClick = useCallback(() => {
    if (session) {
      setRatingModalOpen(true)
      return
    }
    openLogin?.()
  }, [session, openLogin])

  const onAttendanceClick = useCallback(() => {
    if (!session) {
      openLogin?.()
      return
    }
    void toggle()
  }, [session, toggle, openLogin])

  const handleNumberClick = useCallback(async (entryId: string) => {
    try {
      await navigator.clipboard.writeText(entryId)
      setCopiedEntryIds((prev) => new Set(prev).add(entryId))
      setTimeout(() => {
        setCopiedEntryIds((prev) => {
          const next = new Set(prev)
          next.delete(entryId)
          return next
        })
      }, 2000)
    } catch {
      // ignore
    }
  }, [])

  const onJotyBadgeClick = useCallback(
    (entry: SetlistEntry) => {
      const y = show?.show_date?.slice(0, 4)
      setJotyYear(y ? Number(y) : null)
      setJotyHighlightedEntryId(entry.entry_id)
      setJotyModalOpen(true)
    },
    [show?.show_date],
  )

  const onSongClick = useCallback((entry: SetlistEntry) => {
    setSongModalEntry(entry)
    setSongModalEntries([entry])
    setSongModalMode("single")
    setSongModalPairAltName(null)
    setSongModalOpen(true)
  }, [])

  const onPairSongClick = useCallback(
    (entries: SetlistEntry[], pair: SongPair) => {
      if (entries.length === 0) return
      setSongModalEntry(null)
      setSongModalEntries(entries)
      setSongModalMode("multi-section")
      setSongModalPairAltName(pair.alt_name?.trim() ?? null)
      setSongModalOpen(true)
    },
    [],
  )

  const onWtedClick = useCallback(
    (entry: SetlistEntry) => {
      if (!session) {
        openLogin?.()
        return
      }
      setWtedModalEntryOptions(null)
      setWtedModalEntry(entry)
      setWtedModalOpen(true)
    },
    [session, openLogin],
  )

  const onPairWtedClick = useCallback(
    (entries: SetlistEntry[]) => {
      if (!session) {
        openLogin?.()
        return
      }
      const options = uniqueWtedEntriesFromPair(entries)
      if (options.length === 0) return
      if (options.length === 1) {
        setWtedModalEntryOptions(null)
        setWtedModalEntry(options[0]!)
        setWtedModalOpen(true)
        return
      }
      setWtedModalEntryOptions(options)
      setWtedModalEntry(options[0]!)
      setWtedModalOpen(true)
    },
    [session, openLogin],
  )

  const closeSongModal = useCallback(() => {
    setSongModalOpen(false)
    setSongModalEntry(null)
    setSongModalEntries([])
    setSongModalMode("single")
    setSongModalPairAltName(null)
  }, [])

  const closeWtedModal = useCallback(() => {
    setWtedModalOpen(false)
    setWtedModalEntry(null)
    setWtedModalEntryOptions(null)
  }, [])

  const activeSongModalEntry =
    songModalMode === "multi-section" ? null : songModalEntry

  const openShareExport = useCallback(() => {
    setShareExportBg(pickRandomShareBackground())
    setShareExportOpen(true)
  }, [])

  const handleCopySetlistText = useCallback(async () => {
    if (!show) return
    try {
      await navigator.clipboard.writeText(
        buildSetlistPlainTextCopy(show, setlist),
      )
      setSetlistTextCopied(true)
      setTimeout(() => setSetlistTextCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy setlist text:", err)
    }
  }, [show, setlist])

  useEffect(() => {
    if (!wtedModalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      closeWtedModal()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [wtedModalOpen, closeWtedModal])

  const wtedModalShow = useMemo(
    () => ({
      show_date: show?.show_date ?? "",
      show_venue_location: show?.show_venue_location ?? null,
      show_group: show?.show_group ?? null,
    }),
    [show?.show_date, show?.show_venue_location, show?.show_group],
  )

  return {
    invalidParams,
    showId,
    show,
    setlist,
    loading,
    songPairsLoading,
    songPairs,
    yearId,
    showAdminUi,
    linkCopied,
    handleCopyLink,
    handleEditShow,
    tours,
    showDates,
    showPosition,
    handleTourSelect,
    handleShowSelect,
    maxCanonId,
    maxCanonLoading,
    showPositionInTour,
    showLengthRank,
    showChanges,
    showChangesLoading,
    setlistUrl,
    releases,
    releaseToEntriesMap,
    attendeeCount,
    averageRating,
    reviewCount,
    userRating,
    userReview,
    reviews,
    isLoadingReviews,
    reviewsError,
    submitting,
    submitRating,
    fetchReviews,
    validateReview,
    attended,
    toggling,
    onRatingClick,
    onAttendanceClick,
    handleNumberClick,
    onJotyBadgeClick,
    onSongClick,
    onPairSongClick,
    onWtedClick,
    onPairWtedClick,
    copiedEntryIds,
    setlistTextCopied,
    handleCopySetlistText,
    hoveredCategory,
    setHoveredCategory,
    shareExportOpen,
    setShareExportOpen,
    shareExportBg,
    openShareExport,
    jotyModalOpen,
    setJotyModalOpen,
    jotyYear,
    jotyHighlightedEntryId,
    jotyHeadingId,
    ratingModalOpen,
    setRatingModalOpen,
    ratingModalHeadingId,
    songModalOpen,
    closeSongModal,
    activeSongModalEntry,
    songModalEntries,
    songModalMode,
    songModalPairAltName,
    songModalHeadingId,
    songModalTourId,
    wtedModalOpen,
    closeWtedModal,
    wtedModalEntry,
    wtedModalEntryOptions,
    wtedModalShow,
    fallbackWtedArtwork,
    wtedModalHeadingId,
    setlistScanModalOpen,
    setSetlistScanModalOpen,
    scanHeadingId,
  }
}

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { useSetlistOperations } from "@/components/dpro/setlistgame/song-selection/hooks"
import { createSongOperations } from "@/components/dpro/setlistgame/song-selection/operations"
import { createSubmissionHandler } from "@/components/dpro/setlistgame/song-selection/submission"
import type {
  SongPick,
  SongSelectionShow,
} from "@/components/dpro/setlistgame/song-selection/types"
import {
  generatePickId,
  getSetDisplayName,
  getSongsForSet,
  getUniqueSets,
} from "@/components/dpro/setlistgame/song-selection/utils"

export type EchoLiveExistingPick = {
  song: string
  set: string
  setnum: number
  placement?: string | null
}

export type UseEchoLivePicksEditorOptions = {
  showId: string
  showTime: string
  showScored: boolean
  submissionId?: string | null
  existingPicks?: EchoLiveExistingPick[]
  onSubmitSuccess?: () => void
}

function compareSetKeys(a: string, b: string): number {
  const aIsEncore = a.startsWith("E")
  const bIsEncore = b.startsWith("E")

  if (aIsEncore === bIsEncore) {
    const aNum = aIsEncore ? Number.parseInt(a.substring(1), 10) : Number.parseInt(a, 10)
    const bNum = bIsEncore ? Number.parseInt(b.substring(1), 10) : Number.parseInt(b, 10)
    return aNum - bNum
  }

  return aIsEncore ? 1 : -1
}

function existingPicksToEditorState(existingPicks: EchoLiveExistingPick[]): {
  songPicks: SongPick[]
  currentSet: string
  nextSetNum: number
} {
  const uniqueSets = [...new Set(existingPicks.map((pick) => pick.set))].sort(
    compareSetKeys,
  )

  const breaks: SongPick[] = uniqueSets.map((set) => ({
    id: generatePickId(),
    song: `--- ${getSetDisplayName(set)} ---`,
    set,
    setnum: 0,
    isBreak: true,
  }))

  const picksWithIds: SongPick[] = existingPicks.map((pick) => ({
    id: generatePickId(),
    song: pick.song,
    set: pick.set,
    setnum: pick.setnum,
    placement: pick.placement ?? undefined,
  }))

  const highestSetNum = Math.max(...existingPicks.map((pick) => pick.setnum), 0)

  return {
    songPicks: [...breaks, ...picksWithIds],
    currentSet: uniqueSets.at(-1) ?? "1",
    nextSetNum: highestSetNum + 1,
  }
}

export function useEchoLivePicksEditor({
  showId,
  showTime,
  showScored,
  submissionId = null,
  existingPicks = [],
  onSubmitSuccess,
}: UseEchoLivePicksEditorOptions) {
  const { session } = useAuth()
  const isEditing = Boolean(submissionId)
  const loadedExistingRef = useRef(false)

  const [songPicks, setSongPicks] = useState<SongPick[]>([])
  const [currentSet, setCurrentSet] = useState("1")
  const [nextSetNum, setNextSetNum] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const { canAddSetBreak, canAddEncoreBreak, renumberSongPicks } =
    useSetlistOperations(songPicks, setSongPicks)

  const renumberRef = useRef(renumberSongPicks)
  renumberRef.current = renumberSongPicks

  const operations = createSongOperations(
    songPicks,
    setSongPicks,
    currentSet,
    setCurrentSet,
    nextSetNum,
    setNextSetNum,
    setError,
    canAddSetBreak,
    canAddEncoreBreak,
    renumberSongPicks,
  )

  useEffect(() => {
    if (loadedExistingRef.current || existingPicks.length === 0) return

    loadedExistingRef.current = true
    const next = existingPicksToEditorState(existingPicks)
    setSongPicks(next.songPicks)
    setCurrentSet(next.currentSet)
    setNextSetNum(next.nextSetNum)
  }, [existingPicks])

  const showForSubmit = useMemo<SongSelectionShow>(
    () => ({
      show_id: showId,
      show_date: "",
      show_subvenue: "",
      show_venue_location: "",
      show_time: showTime,
      show_tour: "",
      show_scored: showScored,
      submission_id: submissionId ?? undefined,
    }),
    [showId, showScored, showTime, submissionId],
  )

  const handleSubmit = useMemo(
    () =>
      createSubmissionHandler(
        session,
        showForSubmit,
        songPicks,
        isEditing,
        setSubmitting,
        setError,
        setSuccess,
        () => {
          window.setTimeout(() => setSuccess(false), 2000)
        },
        onSubmitSuccess,
      ),
    [
      isEditing,
      onSubmitSuccess,
      session,
      showForSubmit,
      songPicks,
    ],
  )

  const draftedSongNames = new Set(
    songPicks.filter((p) => !p.isBreak).map((p) => p.song),
  )

  const addSongFromCatalog = useCallback(
    (songName: string) => {
      operations.handleAddSong(songName)
    },
    [operations],
  )

  const clearAll = useCallback(() => {
    setSongPicks([])
    setCurrentSet("1")
    setNextSetNum(1)
    setError(null)
    setSuccess(false)
  }, [])

  const scheduleRenumber = useCallback(() => {
    window.setTimeout(() => renumberRef.current(), 0)
  }, [])

  const moveSongUp = useCallback(
    (pickId: string) => {
      operations.moveSongUp(pickId)
      scheduleRenumber()
    },
    [operations, scheduleRenumber],
  )

  const moveSongDown = useCallback(
    (pickId: string) => {
      operations.moveSongDown(pickId)
      scheduleRenumber()
    },
    [operations, scheduleRenumber],
  )

  return {
    songPicks,
    error,
    submitting,
    success,
    isEditing,
    draftedSongNames,
    addSongFromCatalog,
    clearAll,
    handleSubmit,
    canAddSetBreak: canAddSetBreak(),
    canAddEncoreBreak: canAddEncoreBreak(),
    handleAddSetBreak: operations.handleAddSetBreak,
    handleAddEncoreBreak: operations.handleAddEncoreBreak,
    handleAddNewOriginalSong: operations.handleAddNewOriginalSong,
    handleAddNewCoverSong: operations.handleAddNewCoverSong,
    handleRemoveSong: operations.handleRemoveSong,
    handleRemoveSet: operations.handleRemoveSet,
    moveSongUp,
    moveSongDown,
    getSetDisplayName,
    getUniqueSets,
    getSongsForSet,
  }
}

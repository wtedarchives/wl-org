"use client"

import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-context"
import {
  VOTE_PICK_LIMIT,
  getVoteSong,
  getVoteSongIdByName,
} from "@/components/vote/colorado-run-setlists"
import { loadMyVote, submitMyVote } from "@/components/vote/vote-api"
import { VoteBallot } from "@/components/vote/vote-ballot"
import { VoteSetlists } from "@/components/vote/vote-setlists"

export function VotePicker() {
  const { session, loading, signIn } = useAuth()
  const [pickIds, setPickIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!session) {
      setPickIds([])
      setSubmitted(false)
      setError(null)
      setHydrated(true)
      return
    }

    let cancelled = false
    setHydrated(false)
    void loadMyVote(session.token).then((result) => {
      if (cancelled) return
      if (result.submitted) {
        setPickIds(
          result.selections
            .map((name) => getVoteSongIdByName(name))
            .filter((id): id is string => id != null),
        )
        setSubmitted(true)
      }
      setError(result.error)
      setHydrated(true)
    })

    return () => {
      cancelled = true
    }
  }, [loading, session])

  const ranks = useMemo(() => {
    const map = new Map<string, number>()
    pickIds.forEach((id, index) => map.set(id, index + 1))
    return map
  }, [pickIds])

  const locked = !hydrated || submitted || submitting
  const canAdd = !locked && !!session && pickIds.length < VOTE_PICK_LIMIT

  function toggle(songId: string) {
    if (!session) {
      signIn()
      return
    }
    if (locked) return
    setPickIds((current) => {
      const index = current.indexOf(songId)
      if (index >= 0) return current.filter((id) => id !== songId)
      if (current.length >= VOTE_PICK_LIMIT) return current
      return [...current, songId]
    })
  }

  function move(index: number, direction: -1 | 1) {
    if (locked) return
    setPickIds((current) => {
      const next = index + direction
      if (next < 0 || next >= current.length) return current
      const copy = [...current]
      const [item] = copy.splice(index, 1)
      copy.splice(next, 0, item)
      return copy
    })
  }

  function remove(index: number) {
    if (locked) return
    setPickIds((current) => current.filter((_, i) => i !== index))
  }

  async function submit() {
    if (!session || pickIds.length !== VOTE_PICK_LIMIT || locked) return
    const selections = pickIds.map((id) => getVoteSong(id)?.song.name ?? null)
    if (selections.some((name) => name == null)) {
      setError("One of your picks is no longer on the ballot.")
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await submitMyVote(session.token, selections as string[])
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      if (result.error.toLowerCase().includes("already submitted")) {
        setSubmitted(true)
      }
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="vote-layout">
      <VoteSetlists
        ranks={ranks}
        locked={locked}
        signedIn={!!session}
        canAdd={canAdd}
        onToggle={toggle}
      />
      <VoteBallot
        pickIds={pickIds}
        submitted={submitted}
        signedIn={!!session}
        submitting={submitting}
        error={error}
        onMove={move}
        onRemove={remove}
        onSubmit={() => {
          void submit()
        }}
        onSignIn={signIn}
      />
    </div>
  )
}

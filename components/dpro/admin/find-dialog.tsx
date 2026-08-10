"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import {
  isUserUuid,
  searchProfilesByUsername,
  USER_SEARCH_MIN_QUERY_LENGTH,
  type UserSearchResult,
} from "@/lib/user-search"

interface FindDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SEARCH_DEBOUNCE_MS = 250

export function FindDialog({ open, onOpenChange }: FindDialogProps) {
  const router = useRouter()
  const headingId = useId()
  const subtextId = useId()
  const showFieldId = useId()
  const userFieldId = useId()
  const userResultsId = useId()
  const [showId, setShowId] = useState("")
  const [userQuery, setUserQuery] = useState("")
  const [userResults, setUserResults] = useState<UserSearchResult[] | null>(null)
  const [userSearching, setUserSearching] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)
  const latestUserQuery = useRef("")

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  // Debounced username lookup. UUIDs skip the search entirely.
  useEffect(() => {
    const trimmed = userQuery.trim()
    latestUserQuery.current = trimmed

    if (
      !open ||
      isUserUuid(trimmed) ||
      trimmed.length < USER_SEARCH_MIN_QUERY_LENGTH
    ) {
      setUserResults(null)
      setUserSearching(false)
      setUserError(null)
      return
    }

    setUserSearching(true)
    setUserError(null)
    const timer = setTimeout(() => {
      searchProfilesByUsername(trimmed)
        .then((rows) => {
          if (latestUserQuery.current !== trimmed) return
          setUserResults(rows)
        })
        .catch((e) => {
          if (latestUserQuery.current !== trimmed) return
          setUserResults(null)
          setUserError(e instanceof Error ? e.message : "Search failed")
        })
        .finally(() => {
          if (latestUserQuery.current !== trimmed) return
          setUserSearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [open, userQuery])

  const resetUserSearch = () => {
    setUserQuery("")
    setUserResults(null)
    setUserSearching(false)
    setUserError(null)
    latestUserQuery.current = ""
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleFindShow = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = showId.trim()
    if (!trimmed) return
    onOpenChange(false)
    router.push(getSetlistArchiveUrl(trimmed))
    setShowId("")
  }

  const goToUser = (id: string) => {
    onOpenChange(false)
    router.push(getUserProfileUrl(id))
    resetUserSearch()
  }

  const handleFindUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = userQuery.trim()
    if (!trimmed) return

    if (isUserUuid(trimmed)) {
      goToUser(trimmed)
      return
    }

    if (trimmed.length < USER_SEARCH_MIN_QUERY_LENGTH) {
      setUserError(
        `Enter at least ${USER_SEARCH_MIN_QUERY_LENGTH} characters or a user UUID.`,
      )
      return
    }

    // Prefer whatever the debounced search already resolved for this query.
    let rows = userResults
    if (!rows || userSearching) {
      setUserSearching(true)
      try {
        rows = await searchProfilesByUsername(trimmed)
        if (latestUserQuery.current !== trimmed) return
        setUserResults(rows)
        setUserError(null)
      } catch (err) {
        if (latestUserQuery.current !== trimmed) return
        setUserResults(null)
        setUserError(err instanceof Error ? err.message : "Search failed")
        return
      } finally {
        if (latestUserQuery.current === trimmed) setUserSearching(false)
      }
    }

    const exact = rows.find(
      (row) => row.username.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exact) {
      goToUser(exact.id)
      return
    }
    if (rows.length === 1) {
      goToUser(rows[0].id)
      return
    }
    if (rows.length === 0) {
      setUserError(`No user found matching “${trimmed}”.`)
    }
  }

  const showUserResults =
    !isUserUuid(userQuery) &&
    userQuery.trim().length >= USER_SEARCH_MIN_QUERY_LENGTH

  const backdropClass = open ? "modal-backdrop open" : "modal-backdrop"

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={backdropClass}
        id="admin-find-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false)
        }}
      >
        <div
          className="modal modal--wted-request modal--dpro-find"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Find</h3>
              <p id={subtextId} className="modal-request-sub">
                Jump to a setlist by show UUID or a public profile by username
                or user UUID.
              </p>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body">
            <div className="modal-dpro-find-inner">
              <form
                className="modal-dpro-find-form"
                onSubmit={handleFindShow}
              >
                <Label htmlFor={showFieldId} className="modal-dpro-find-label">
                  Show ID
                </Label>
                <div className="modal-dpro-find-field-row">
                  <Input
                    id={showFieldId}
                    placeholder="Enter show UUID"
                    value={showId}
                    onChange={(e) => setShowId(e.target.value)}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="wbtn primary modal-dpro-find-submit"
                    disabled={!showId.trim()}
                  >
                    Go
                  </button>
                </div>
              </form>
              <form
                className="modal-dpro-find-form"
                onSubmit={handleFindUser}
              >
                <Label htmlFor={userFieldId} className="modal-dpro-find-label">
                  User
                </Label>
                <div className="modal-dpro-find-field-row">
                  <Input
                    id={userFieldId}
                    placeholder="Enter username or user UUID"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    role="combobox"
                    aria-expanded={showUserResults}
                    aria-controls={userResultsId}
                  />
                  <button
                    type="submit"
                    className="wbtn primary modal-dpro-find-submit"
                    disabled={!userQuery.trim()}
                  >
                    Go
                  </button>
                </div>
                {showUserResults ? (
                  <div
                    id={userResultsId}
                    className="modal-dpro-find-results"
                    role="listbox"
                    aria-label="Matching users"
                  >
                    {userSearching && !userResults ? (
                      <p className="modal-dpro-find-results-note">Searching…</p>
                    ) : null}
                    {userError ? (
                      <p className="modal-dpro-find-results-note modal-dpro-find-results-note--error">
                        {userError}
                      </p>
                    ) : null}
                    {!userSearching && !userError && userResults?.length === 0 ? (
                      <p className="modal-dpro-find-results-note">
                        No matching users.
                      </p>
                    ) : null}
                    {userResults?.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="modal-dpro-find-result"
                        onClick={() => goToUser(row.id)}
                      >
                        <span className="modal-dpro-find-result-name">
                          {row.username}
                        </span>
                        <span className="modal-dpro-find-result-id">
                          {row.id}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}

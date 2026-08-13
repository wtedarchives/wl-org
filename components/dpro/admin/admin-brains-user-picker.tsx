"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MagnifyingGlass, X } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import {
  isUserUuid,
  searchProfilesByUsername,
  USER_SEARCH_MIN_QUERY_LENGTH,
  type UserSearchResult,
} from "@/lib/user-search"

const DEBOUNCE_MS = 250

interface AdminBrainsUserPickerProps {
  selected: UserSearchResult | null
  onSelect: (user: UserSearchResult | null) => void
  inputId?: string
}

/**
 * Pick the person to assign, by username or user UUID — the same two inputs the
 * Find dialog accepts, reusing its `searchProfilesByUsername`.
 *
 * There is no roster of "eligible setlisters" to choose from: the assignment
 * itself is the permission, so any profile can be granted one and there is no
 * second list to keep in sync.
 */
export function AdminBrainsUserPicker({
  selected,
  onSelect,
  inputId,
}: AdminBrainsUserPickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const timerRef = useRef<number | null>(null)

  const resolveUuid = useCallback(async (uuid: string) => {
    if (!supabase) return
    setSearching(true)
    setNotFound(false)
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", uuid)
        .maybeSingle()
      if (data?.id) {
        onSelect({
          id: data.id as string,
          username: ((data.username as string | null) ?? "").trim() || "(no username)",
        })
        setQuery("")
        setResults([])
      } else {
        setNotFound(true)
      }
    } finally {
      setSearching(false)
    }
  }, [onSelect])

  useEffect(() => {
    const trimmed = query.trim()
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)

    if (trimmed === "") {
      setResults([])
      setNotFound(false)
      return
    }

    // A pasted UUID needs no search — resolve it straight to a profile.
    if (isUserUuid(trimmed)) {
      void resolveUuid(trimmed)
      return
    }

    if (trimmed.length < USER_SEARCH_MIN_QUERY_LENGTH) {
      setResults([])
      return
    }

    timerRef.current = window.setTimeout(() => {
      setSearching(true)
      setNotFound(false)
      searchProfilesByUsername(trimmed)
        .then((rows) => {
          setResults(rows)
          setNotFound(rows.length === 0)
        })
        .catch(() => {
          setResults([])
          setNotFound(true)
        })
        .finally(() => setSearching(false))
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [query, resolveUuid])

  if (selected) {
    return (
      <div className="wl-home-v2-archive-admin-inline-field-row min-w-0">
        <Input
          id={inputId}
          value={selected.username}
          readOnly
          aria-label="Selected person"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="wl-home-v2-tours-header-pill shrink-0 gap-1"
          onClick={() => {
            onSelect(null)
            setQuery("")
          }}
          title="Choose a different person"
        >
          <X className="size-3.5 shrink-0 opacity-80" aria-hidden />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="relative min-w-0">
        <MagnifyingGlass
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/45"
          aria-hidden
        />
        {/* pl-9 not pl-7: the icon spans 10–24px, so 28px left the glyph almost
            touching the placeholder. */}
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Username or user UUID"
          className="wl-home-v2-archive-admin-input--with-leading-icon"
          aria-label="Find a person to assign"
        />
      </div>

      {searching ?
        <p className="m-0 text-[11px] text-white/50">Searching…</p>
      : null}

      {notFound && !searching ?
        <p className="m-0 text-[11px] text-white/50">No match</p>
      : null}

      {results.length > 0 ?
        <ul className="m-0 flex max-h-44 min-w-0 list-none flex-col gap-0.5 overflow-y-auto rounded-md border border-[rgb(49,51,49)] bg-black/35 p-1">
          {results.map((row) => (
            <li key={row.id} className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  onSelect(row)
                  setQuery("")
                  setResults([])
                }}
                className="w-full min-w-0 truncate rounded px-2 py-1.5 text-left text-xs text-white/85 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                {row.username}
              </button>
            </li>
          ))}
        </ul>
      : null}
    </div>
  )
}

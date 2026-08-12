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
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate font-mono text-xs text-white/90">
          {selected.username}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="wl-home-v2-tours-header-pill gap-1"
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
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="relative min-w-0">
        <MagnifyingGlass
          className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Username or user UUID"
          className="h-8 pl-7 text-xs"
          aria-label="Find a person to assign"
        />
      </div>

      {searching && (
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/50">
          Searching…
        </p>
      )}

      {notFound && !searching && (
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/50">
          No match
        </p>
      )}

      {results.length > 0 && (
        <ul className="flex max-h-44 min-w-0 flex-col gap-0.5 overflow-y-auto">
          {results.map((row) => (
            <li key={row.id} className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  onSelect(row)
                  setQuery("")
                  setResults([])
                }}
                className="w-full min-w-0 truncate rounded px-2 py-1 text-left font-mono text-xs text-white/85 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                {row.username}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

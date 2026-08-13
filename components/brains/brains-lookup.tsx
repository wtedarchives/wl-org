"use client"

import { useMemo, useState } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Cap on rendered matches — enough to scan, few enough to stay light on a phone. */
const MAX_RESULTS = 25

interface BrainsLookupProps<T> {
  items: T[]
  keyOf: (item: T) => string
  labelOf: (item: T) => string
  /** Read-only summary of the selection. */
  renderDetail: (item: T) => React.ReactNode
  placeholder: string
  /** Render the list immediately instead of only after typing. */
  alwaysOpen?: boolean
}

/**
 * Search an archive list and inspect one entry, read-only.
 *
 * Exists for duplicate-checking: before adding a song or a person, a setlister
 * needs to see whether it is already there. Nothing here edits — brains grants
 * insert on these tables and nothing more — so the selection renders as a plain
 * detail card rather than a form, which also makes it obvious that it is not
 * editable rather than looking like a form that silently fails to save.
 */
export function BrainsLookup<T>({
  items,
  keyOf,
  labelOf,
  renderDetail,
  placeholder,
  alwaysOpen = false,
}: BrainsLookupProps<T>) {
  const [query, setQuery] = useState("")
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches =
      q === "" ? items : items.filter((i) => labelOf(i).toLowerCase().includes(q))
    return matches.slice(0, MAX_RESULTS)
  }, [items, query, labelOf])

  const selected = items.find((i) => keyOf(i) === selectedKey) ?? null
  const showList = alwaysOpen || query.trim() !== ""

  const labelCls =
    "font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/60"

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="relative min-w-0">
        <MagnifyingGlass
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="wl-home-v2-archive-admin-input--with-leading-icon h-8 text-xs"
        />
      </div>

      {showList && (
        <ul className="flex max-h-56 min-w-0 flex-col gap-0.5 overflow-y-auto">
          {filtered.map((item) => {
            const key = keyOf(item)
            return (
              <li key={key} className="min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedKey((k) => (k === key ? null : key))
                  }
                  aria-pressed={selectedKey === key}
                  className="w-full min-w-0 truncate rounded px-2 py-1 text-left text-xs text-white/85 hover:bg-white/10 aria-pressed:bg-white/15 focus-visible:bg-white/10 focus-visible:outline-none"
                >
                  {labelOf(item)}
                </button>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className={labelCls}>
              Nothing found — safe to add it below
            </li>
          )}
          {items.length > filtered.length && query.trim() === "" && (
            <li className={labelCls}>
              Showing {filtered.length} of {items.length} — type to narrow
            </li>
          )}
        </ul>
      )}

      {selected && (
        <div className="flex min-w-0 flex-col gap-1 rounded border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <span className="min-w-0 break-words text-xs font-medium">
              {labelOf(selected)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 shrink-0 px-1.5 text-[10px]"
              onClick={() => setSelectedKey(null)}
            >
              Close
            </Button>
          </div>
          {renderDetail(selected)}
          <span className={labelCls}>Already in the archive — read only</span>
        </div>
      )}
    </div>
  )
}

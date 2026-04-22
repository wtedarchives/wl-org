"use client"

import { useEffect, useRef, useState } from "react"
import { History } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  WTED_RADIO_STATUS_POLL_MS,
  WTED_RADIO_STATUS_URL,
  type RadioCoStatusResponse,
} from "@/lib/wted-radio-co-status"
import { cn } from "@/lib/utils"

const RECENTLY_PLAYED_LIMIT = 20

const cardClassName =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0"

export function WtedRecentlyPlayedCard({
  className,
  hideHeader = false,
}: {
  className?: string
  hideHeader?: boolean
}) {
  const [titles, setTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const awaitingFirstPaint = useRef(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const showInitialLoading = awaitingFirstPaint.current
      try {
        setError(null)
        if (showInitialLoading) setLoading(true)
        const res = await fetch(WTED_RADIO_STATUS_URL)
        if (!res.ok) {
          throw new Error(`Radio.co returned ${res.status}`)
        }
        const data = (await res.json()) as RadioCoStatusResponse
        if (cancelled) return
        const next =
          data.history
            ?.slice(0, RECENTLY_PLAYED_LIMIT)
            .map((h) => h.title?.trim())
            .filter((t): t is string => Boolean(t)) ?? []
        setTitles(next)
      } catch {
        if (!cancelled) {
          setError("Could not load recently played tracks.")
          setTitles([])
        }
      } finally {
        if (!cancelled && showInitialLoading) {
          setLoading(false)
          awaitingFirstPaint.current = false
        }
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), WTED_RADIO_STATUS_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return (
    <Card className={cn(cardClassName, className)}>
      {!hideHeader ? (
        <CardHeader className="shrink-0 border-b border-wl-dark-grey/50 py-2 bg-black/30">
          <div className="flex min-w-0 flex-row items-center justify-between gap-2">
            <CardTitle className="shrink-0 text-[13px] font-semibold text-wl-white">
              Recently Played Tracks
            </CardTitle>
            <History className="size-4 shrink-0 text-wl-white/80" />
          </div>
        </CardHeader>
      ) : null}
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 text-left text-xs leading-snug text-wl-white">
          {loading && titles.length === 0 ? (
            <p className="text-[11px] text-wl-white/70">Loading…</p>
          ) : error ? (
            <p className="text-[11px] text-wl-white/80">{error}</p>
          ) : titles.length === 0 ? (
            <p className="text-[11px] text-wl-white/70">No history yet.</p>
          ) : (
            <ul className="list-none space-y-1.5">
              {titles.map((title, i) => (
                <li
                  key={`${title}-${i}`}
                  className="pl-6 text-[0.75rem] leading-[0.95rem] indent-[-1.5rem]"
                >
                  {title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

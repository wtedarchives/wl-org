"use client"

import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import {
  buildTrmnlPayload,
  currentScheduleSlot,
  isShowLive,
  selectScheduleSlots,
  TRMNL_DEFAULT_TZ,
  TRMNL_LIVE_WINDOW_MS,
  type RadioCoScheduleEventInput,
  type RadioCoStatusInput,
  type TrmnlPayload,
  type TrmnlSetlistEntryInput,
  type TrmnlShowInput,
} from "@/supabase/functions/_shared/trmnl-feed/payload"
import {
  resolveNowPlayingArtwork,
  resolveScheduleTitles,
  type TrmnlFetchRows,
} from "@/supabase/functions/_shared/trmnl-feed/lookups"

import "./trmnl-preview.css"

/**
 * Dev preview for the TRMNL private plugin (`supabase/functions/trmnl-feed`).
 *
 * Two panes: the 800x480 screen at exact device pixels in pure black and white,
 * and the JSON behind it. `Build locally` runs the shared builder in the browser
 * against the same upstreams the edge function uses, so you can iterate on
 * `_shared/trmnl-feed/payload.ts` without deploying; `Fetch from edge` calls the
 * deployed function to confirm the two agree.
 *
 * The mock is also the reference for the plugin's Liquid markup — the columns,
 * the set headers and the segue rules here are what the template reproduces.
 */

const RADIO_CO_STATION_ID = "s3c11c85d6"
const STATUS_URL = `https://public.radio.co/stations/${RADIO_CO_STATION_ID}/status`
const SCHEDULE_URL = `https://public.radio.co/stations/${RADIO_CO_STATION_ID}/embed/schedule`

const SHOW_COLUMNS =
  "show_id,show_date,show_time,show_tour,show_subvenue,show_venue_location"
const SETLIST_COLUMNS =
  "entry_set,entry_setnum,entry_song,entry_short,entry_segue,entry_setorder,songs ( song_displayname )"

/** Where the entered API key is kept. Dev-only, never bundled. */
const API_KEY_STORAGE = "trmnl-preview-api-key"

type Source = "local" | "edge"
type ModeOverride = "" | "schedule" | "setlist"

/** The shared lookups run against the anon client, same rows as the homepage. */
const fetchRows: TrmnlFetchRows = async (table, columns, filterColumn, values) => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .in(filterColumn, values)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Array<Record<string, unknown>>
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Same live-window lookup the edge function runs, through the anon client. */
async function loadShow(
  showId: string,
  mode: ModeOverride,
  nowMs: number,
): Promise<TrmnlShowInput | null> {
  if (!supabase || mode === "schedule") return null

  const base = supabase.from("shows").select(SHOW_COLUMNS)
  const { data, error } =
    showId ?
      await base.eq("show_id", showId).limit(1)
    : await base
        .lte("show_time", new Date(nowMs).toISOString())
        .gte("show_time", new Date(nowMs - TRMNL_LIVE_WINDOW_MS).toISOString())
        .order("show_time", { ascending: false })
        .limit(1)

  if (error || !data?.length) return null
  const row = data[0] as TrmnlShowInput & { show_time: string | null }
  const forced = Boolean(showId) || mode === "setlist"
  return forced || isShowLive(row.show_time, nowMs) ? row : null
}

async function loadSetlist(showId: string): Promise<TrmnlSetlistEntryInput[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("setlist_entries")
    .select(SETLIST_COLUMNS)
    .eq("entry_show", showId)
    .order("entry_setorder", { ascending: true })
  if (error) return []
  return (data ?? []) as TrmnlSetlistEntryInput[]
}

export function TrmnlPreview() {
  const [source, setSource] = useState<Source>("local")
  const [tz, setTz] = useState(TRMNL_DEFAULT_TZ)
  const [mode, setMode] = useState<ModeOverride>("")
  const [showId, setShowId] = useState("")
  const [at, setAt] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [payload, setPayload] = useState<TrmnlPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setApiKey(window.localStorage.getItem(API_KEY_STORAGE) ?? "")
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const atMs = at ? new Date(at).getTime() : Number.NaN
      const nowMs = Number.isNaN(atMs) ? Date.now() : atMs

      if (source === "edge") {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
        if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
        const url = new URL(`${base}/functions/v1/trmnl-feed`)
        url.searchParams.set("tz", tz)
        if (mode) url.searchParams.set("mode", mode)
        if (showId) url.searchParams.set("show_id", showId)
        if (at) url.searchParams.set("at", new Date(nowMs).toISOString())

        const res = await fetch(url, { headers: { "X-API-Key": apiKey } })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
        setPayload(body as TrmnlPayload)
        return
      }

      const [status, schedule, show] = await Promise.all([
        fetchJson<
          RadioCoStatusInput & {
            current_track?: { artwork_url?: string | null } | null
          }
        >(STATUS_URL),
        fetchJson<{ data?: RadioCoScheduleEventInput[] }>(SCHEDULE_URL),
        loadShow(showId, mode, nowMs),
      ])
      const setlist = show ? await loadSetlist(show.show_id) : []

      const slots = selectScheduleSlots(schedule?.data ?? [], nowMs, tz)
      const onAir = currentScheduleSlot(slots, nowMs)
      const resolution = await resolveScheduleTitles(
        slots,
        onAir ? slots.indexOf(onAir) : -1,
        fetchRows,
      )
      const trackArtwork = await resolveNowPlayingArtwork(
        {
          radioCoArtworkUrl: status?.current_track?.artwork_url ?? null,
          trackTitle: status?.current_track?.title ?? null,
          onAirEpisodeArtwork: resolution.onAirEpisodeArtwork,
          onAirShowLink: resolution.onAirShowLink,
        },
        fetchRows,
      )

      setPayload(
        buildTrmnlPayload({
          status,
          slots,
          slotTitles: resolution.titles,
          trackArtwork,
          show,
          setlist,
          nowMs,
          tz,
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [apiKey, at, mode, showId, source, tz])

  useEffect(() => {
    void load()
  }, [load])

  function rememberApiKey(value: string) {
    setApiKey(value)
    window.localStorage.setItem(API_KEY_STORAGE, value)
  }

  return (
    <div className="trmnl-preview">
      <header className="trmnl-preview__bar">
        <strong>TRMNL feed preview</strong>
        <span>supabase/functions/trmnl-feed · 800×480 · 1-bit</span>
      </header>

      <div className="trmnl-preview__controls">
        <label>
          Source
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as Source)}
          >
            <option value="local">Build locally</option>
            <option value="edge">Fetch from edge</option>
          </select>
        </label>

        <label>
          Timezone
          <input value={tz} onChange={(e) => setTz(e.target.value)} />
        </label>

        <label>
          Right column
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ModeOverride)}
          >
            <option value="">Auto (live window)</option>
            <option value="schedule">Force schedule</option>
            <option value="setlist">Force setlist</option>
          </select>
        </label>

        <label className="trmnl-preview__wide">
          Show ID
          <input
            value={showId}
            placeholder="uuid — pin a show, ignoring the live window"
            onChange={(e) => setShowId(e.target.value.trim())}
          />
        </label>

        <label>
          As of
          <input
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
          />
        </label>

        {source === "edge" && (
          <label className="trmnl-preview__wide">
            API key
            <input
              type="password"
              value={apiKey}
              placeholder="bot_api_keys value for TRMNL"
              onChange={(e) => rememberApiKey(e.target.value)}
            />
          </label>
        )}

        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>

      {error && <p className="trmnl-preview__error">{error}</p>}

      <div className="trmnl-preview__panes">
        <div className="trmnl-preview__screen-wrap">
          <TrmnlScreen payload={payload} />
          <p className="trmnl-preview__caption">
            Exact device pixels. Only pure black and white — anything grey here
            will dither on the panel.
          </p>
        </div>

        <pre className="trmnl-preview__json">
          {payload ? JSON.stringify(payload, null, 2) : "—"}
        </pre>
      </div>
    </div>
  )
}

/** The screen itself. Mirrors what the plugin's Liquid markup has to produce. */
function TrmnlScreen({ payload }: { payload: TrmnlPayload | null }) {
  if (!payload) {
    return <div className="trmnl-screen trmnl-screen--empty">no data</div>
  }

  const { now_playing: np, on_air: onAir, live } = payload

  return (
    <div className="trmnl-screen">
      <div className="trmnl-screen__col trmnl-screen__col--left">
        <div className="trmnl-screen__eyebrow">Now Playing on WTED Radio</div>
        <div className="trmnl-screen__track">{np?.primary ?? "—"}</div>
        {np?.secondary && (
          <div className="trmnl-screen__track-sub">{np.secondary}</div>
        )}
        {np?.artwork && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="trmnl-screen__art" src={np.artwork} alt="" />
        )}

        {onAir && (
          <div className="trmnl-screen__onair">
            <div className="trmnl-screen__eyebrow">On Air</div>
            <div className="trmnl-screen__onair-title">{onAir.title}</div>
            <div className="trmnl-screen__onair-time">{onAir.time}</div>
          </div>
        )}
      </div>

      <div
        className={`trmnl-screen__col trmnl-screen__col--right trmnl-screen__col--${payload.density}`}
      >
        {payload.right === "setlist" && live ?
          <>
            <div className="trmnl-screen__eyebrow">Live Now · {live.date}</div>
            <div className="trmnl-screen__venue">
              {live.venue}
              {live.location ? ` — ${live.location}` : ""}
            </div>
            {live.sets.map((set) => (
              <div key={set.label} className="trmnl-screen__set">
                <div className="trmnl-screen__set-label">{set.label}</div>
                {set.entries.map((entry, i) => (
                  <div
                    key={`${set.label}-${i}`}
                    className={
                      entry.now ?
                        "trmnl-screen__song trmnl-screen__song--now"
                      : "trmnl-screen__song"
                    }
                  >
                    {entry.song}
                    {entry.short && (
                      <span className="trmnl-screen__short">
                        [{entry.short}]
                      </span>
                    )}
                    {/* null → nothing; "" → bare arrow; text → labelled */}
                    {entry.segue !== null && (
                      <span className="trmnl-screen__segue">
                        {entry.segue ? `→ ${entry.segue}` : "→"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        : <>
            <div className="trmnl-screen__eyebrow">Today on WTED Radio</div>
            {payload.schedule.map((row, i) => (
              <div
                key={`${row.time}-${i}`}
                className={
                  row.now ?
                    "trmnl-screen__slot trmnl-screen__slot--now"
                  : "trmnl-screen__slot"
                }
              >
                <span className="trmnl-screen__slot-time">{row.time}</span>
                <span className="trmnl-screen__slot-title">{row.title}</span>
              </div>
            ))}
          </>
        }
      </div>

      {/* Station mark, bottom-right of the panel, over both columns. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="trmnl-screen__logo" src="/WL.png" alt="" />
    </div>
  )
}

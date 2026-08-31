"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CircleNotch, DownloadSimple } from "@phosphor-icons/react"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { useAuth } from "@/components/auth-context"
import {
  fetchRadioScheduleMergedSlotsForLocalDay,
  type RadioScheduleSlot,
} from "@/hooks/use-radio-schedule"
import { buildScheduleShareCardViewModel } from "@/lib/wl-radio-schedule-share-card-view-model"
import {
  buildRadioScheduleShareExportDayOptions,
  isSameLocalCalendarDay,
  type RadioScheduleShareExportDayOption,
} from "@/lib/wl-home-v2-radio-schedule-share-export-days"
import { downloadOrWebSharePng } from "@/lib/wl-home-v2-share-image-download"
import {
  radioScheduleShareStoragePath,
  uploadRadioScheduleSharePng,
} from "@/lib/radio-schedule-share-upload"
import { maySeeScheduleShareImage } from "@/supabase/functions/_shared/schedule-share-card/access.ts"
import {
  SCHEDULE_CARD_HEIGHT_PX,
  SCHEDULE_CARD_WIDTH_PX,
} from "@/supabase/functions/_shared/schedule-share-card/card.ts"

import "./wl-home-v2-schedule-image.css"

const RENDER_ENDPOINT = "/api/schedule-share-image"

type DayState = {
  slots: RadioScheduleSlot[]
  blob: Blob
  objectUrl: string
}

function scheduleImageFilename(dayKey: string): string {
  return `wted-schedule-${dayKey}.jpg`
}

/** `/social-radio-schedule` lists only `.png`, so the upload copy is a PNG. */
function scheduleUploadFilename(dayKey: string): string {
  return `wted-schedule-${dayKey}.png`
}

export function WlHomeV2ScheduleImagePageClient() {
  const { session, loading: authLoading } = useAuth()
  const allowed = maySeeScheduleShareImage(
    session?.isAdmin ?? false,
    session?.profileId,
  )

  const [dayOptions, setDayOptions] = useState<
    RadioScheduleShareExportDayOption[]
  >(() => buildRadioScheduleShareExportDayOptions())
  const [selectedDayKey, setSelectedDayKey] = useState(
    () => buildRadioScheduleShareExportDayOptions()[0]!.key,
  )
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [current, setCurrent] = useState<DayState | null>(null)

  /*
   * Rendered images are cached per day so flicking between days is instant and
   * does not re-spend a Lambda invocation. Object URLs are revoked on unmount;
   * eight story JPEGs is a few MB at most, so nothing is evicted before then.
   */
  const cacheRef = useRef(new Map<string, DayState>())
  useEffect(() => {
    const cache = cacheRef.current
    return () => {
      for (const entry of cache.values()) URL.revokeObjectURL(entry.objectUrl)
      cache.clear()
    }
  }, [])

  /** The picker is built at mount; re-anchor it if the tab is open past midnight. */
  useEffect(() => {
    const id = setInterval(() => {
      const next = buildRadioScheduleShareExportDayOptions()
      setDayOptions((prev) =>
        prev[0]?.key === next[0]?.key ? prev : next,
      )
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const renderDay = useCallback(
    async (option: RadioScheduleShareExportDayOption, force = false) => {
      const token = session?.token
      if (!token) return

      const cached = cacheRef.current.get(option.key)
      if (cached && !force) {
        setCurrent(cached)
        setError(null)
        return
      }

      setBusy(true)
      setError(null)
      setNotice(null)
      try {
        // `isNowPlaying` only matters for today, and the card does not draw it.
        const nowMs =
          isSameLocalCalendarDay(option.day, new Date()) ? Date.now() : 0
        const { slots, error: scheduleError } =
          await fetchRadioScheduleMergedSlotsForLocalDay(option.day, nowMs)
        if (scheduleError) {
          setError(scheduleError)
          return
        }

        const viewModel = buildScheduleShareCardViewModel(option.day, slots)
        const res = await fetch(RENDER_ENDPOINT, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dayKey: option.key, viewModel }),
        })
        if (!res.ok) {
          const detail = await res.text().catch(() => "")
          setError(
            res.status === 401 || res.status === 403 ?
              "Your session is not allowed to generate schedule images."
            : `Render failed (${res.status}). ${detail.slice(0, 160)}`,
          )
          return
        }

        const blob = await res.blob()
        const previous = cacheRef.current.get(option.key)
        if (previous) URL.revokeObjectURL(previous.objectUrl)
        const entry: DayState = {
          slots,
          blob,
          objectUrl: URL.createObjectURL(blob),
        }
        cacheRef.current.set(option.key, entry)
        setCurrent(entry)
      } catch (e) {
        console.error(e)
        setError("Could not generate that image. Try again.")
      } finally {
        setBusy(false)
      }
    },
    [session?.token],
  )

  /** Render whichever day is selected, including the first one on mount. */
  useEffect(() => {
    if (!allowed || !session?.token) return
    const option = dayOptions.find((o) => o.key === selectedDayKey)
    if (option) void renderDay(option)
  }, [allowed, session?.token, selectedDayKey, dayOptions, renderDay])

  const handleDownload = useCallback(async () => {
    if (!current) return
    try {
      const how = await downloadOrWebSharePng(
        current.blob,
        scheduleImageFilename(selectedDayKey),
        { shareTitle: "WTED Radio schedule" },
      )
      setNotice(
        how === "shared" ?
          "Share sheet opened — tap Save Image to add it to Photos."
        : "Download started.",
      )
    } catch (e) {
      console.error(e)
      setError("Could not save that image. Try again.")
    }
  }, [current, selectedDayKey])

  /**
   * Publishes the same card to the `radio-schedules` bucket, which is what
   * `/social-radio-schedule` lists. Admin-only, because the upload edge
   * function is; a re-render is cheap and gives it the PNG that page expects.
   */
  const handleUpload = useCallback(async () => {
    const token = session?.token
    const option = dayOptions.find((o) => o.key === selectedDayKey)
    if (!token || !option) return

    setUploading(true)
    setError(null)
    setNotice(null)
    try {
      const nowMs =
        isSameLocalCalendarDay(option.day, new Date()) ? Date.now() : 0
      const { slots, error: scheduleError } =
        await fetchRadioScheduleMergedSlotsForLocalDay(option.day, nowMs)
      if (scheduleError) {
        setError(scheduleError)
        return
      }
      const viewModel = buildScheduleShareCardViewModel(option.day, slots)
      const res = await fetch(`${RENDER_ENDPOINT}?format=png`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dayKey: option.key, viewModel }),
      })
      if (!res.ok) {
        setError(`Render failed (${res.status}).`)
        return
      }
      const filename = scheduleUploadFilename(option.key)
      const { publicUrl, error: uploadError } =
        await uploadRadioScheduleSharePng(
          token,
          radioScheduleShareStoragePath(option.key, filename),
          await res.blob(),
        )
      if (uploadError) {
        setError(uploadError)
        return
      }
      setNotice(
        publicUrl ?
          `Uploaded for the social page: ${publicUrl}`
        : "Uploaded for the social page.",
      )
    } catch (e) {
      console.error(e)
      setError("Could not upload that image. Try again.")
    } finally {
      setUploading(false)
    }
  }, [dayOptions, selectedDayKey, session?.token])

  const selectedOption = dayOptions.find((o) => o.key === selectedDayKey)

  return (
    <WlHomeV2>
      <header className="wl-home-v2-page-lede wl-home-v2-schedule-image__lede">
        <div className="wl-home-v2-schedule-image__column">
          <h1>Schedule image</h1>
          <div className="wl-home-v2-page-lede-body">
            <p>
              A 9∶16 story image of the WTED Radio schedule for today or any of
              the next seven days, rendered on the server so it works the same
              on a phone as on a desktop. Times and dates come from this
              device&rsquo;s timezone.
            </p>
          </div>
        </div>
      </header>

      <section
        className="wl-home-v2-schedule-image__section"
        aria-label="Schedule image"
      >
        <div className="wl-home-v2-schedule-image__column">
          {authLoading ?
            <p className="wl-home-v2-schedule-image__message wl-home-v2-schedule-image__message--muted">
              Checking your session…
            </p>
          : !allowed ?
            <p
              className="wl-home-v2-schedule-image__message wl-home-v2-schedule-image__message--muted"
              role="status"
            >
              This page is not available on your account.
            </p>
          : <>
              <div
                className="wl-home-v2-schedule-image__days"
                role="group"
                aria-label="Schedule day"
              >
                {dayOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className="wl-home-v2-schedule-image__day"
                    aria-pressed={opt.key === selectedDayKey}
                    disabled={busy && opt.key !== selectedDayKey}
                    onClick={() => setSelectedDayKey(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div
                className="wl-home-v2-schedule-image__preview"
                style={{
                  aspectRatio: `${SCHEDULE_CARD_WIDTH_PX} / ${SCHEDULE_CARD_HEIGHT_PX}`,
                }}
              >
                {current ?
                  // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from the renderer
                  <img
                    src={current.objectUrl}
                    alt={`WTED Radio schedule for ${selectedOption?.label ?? "the selected day"}`}
                    className="wl-home-v2-schedule-image__img"
                  />
                : null}
                {busy ?
                  <div className="wl-home-v2-schedule-image__busy">
                    <CircleNotch
                      className="wl-home-v2-schedule-image__spinner"
                      aria-hidden
                    />
                    <span>Rendering…</span>
                  </div>
                : null}
              </div>

              {current && current.slots.length === 0 ?
                <p className="wl-home-v2-schedule-image__message wl-home-v2-schedule-image__message--muted">
                  Radio.co lists no shows for this calendar day.
                </p>
              : null}

              <div className="wl-home-v2-schedule-image__actions">
                <button
                  type="button"
                  className="wl-home-v2-schedule-image__action wl-home-v2-schedule-image__action--primary"
                  disabled={!current || busy || uploading}
                  onClick={() => void handleDownload()}
                >
                  <DownloadSimple
                    className="wl-home-v2-schedule-image__action-icon"
                    aria-hidden
                  />
                  Download image
                </button>
                {session?.isAdmin ?
                  <button
                    type="button"
                    className="wl-home-v2-schedule-image__action"
                    disabled={busy || uploading || !selectedOption}
                    onClick={() => void handleUpload()}
                  >
                    {uploading ? "Uploading…" : "Upload for social page"}
                  </button>
                : null}
                <button
                  type="button"
                  className="wl-home-v2-schedule-image__action"
                  disabled={busy || uploading || !selectedOption}
                  onClick={() => {
                    if (selectedOption) void renderDay(selectedOption, true)
                  }}
                >
                  Regenerate
                </button>
              </div>

              {error ?
                <p
                  className="wl-home-v2-schedule-image__message wl-home-v2-schedule-image__message--error"
                  role="alert"
                >
                  {error}
                </p>
              : notice ?
                <p className="wl-home-v2-schedule-image__message wl-home-v2-schedule-image__message--muted">
                  {notice}
                </p>
              : null}
            </>
          }
        </div>
      </section>
    </WlHomeV2>
  )
}

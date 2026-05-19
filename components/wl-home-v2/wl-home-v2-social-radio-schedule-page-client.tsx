"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleNotch, DownloadSimple } from "@phosphor-icons/react"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  downloadRadioScheduleSocialImage,
  fetchRadioScheduleSocialImages,
  type RadioScheduleSocialImage,
} from "@/lib/radio-schedule-social-list"

import "./wl-home-v2-social-radio-schedule.css"

export function WlHomeV2SocialRadioSchedulePageClient() {
  const [items, setItems] = useState<RadioScheduleSocialImage[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      const { items: nextItems, error } = await fetchRadioScheduleSocialImages()
      if (cancelled) return
      setItems(nextItems)
      setLoadError(error)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleDownload = useCallback(async (item: RadioScheduleSocialImage) => {
    setDownloadingKey(item.dayKey)
    setDownloadError(null)
    try {
      await downloadRadioScheduleSocialImage(item)
    } catch (e) {
      console.error(e)
      setDownloadError("Could not download that image. Try again.")
    } finally {
      setDownloadingKey(null)
    }
  }, [])

  return (
    <WlHomeV2>
      <header className="wl-home-v2-page-lede wl-home-v2-social-radio-schedule__lede">
        <div className="wl-home-v2-social-radio-schedule__column">
          <h1>Social radio schedule</h1>
          <div className="wl-home-v2-page-lede-body">
            <p>
              Download schedule images for today and the next three days. Links
              appear when an image has been generated for that date.
            </p>
          </div>
        </div>
      </header>

      <section
        className="wl-home-v2-social-radio-schedule__section"
        aria-label="Schedule image downloads"
      >
        <div className="wl-home-v2-social-radio-schedule__column">
          {loading ?
            <WlHomeV2PageLoading message="Loading schedule images…" />
          : loadError ?
            <p
              className="wl-home-v2-social-radio-schedule__message wl-home-v2-social-radio-schedule__message--error"
              role="alert"
            >
              {loadError}
            </p>
          : items.length === 0 ?
            <p className="wl-home-v2-social-radio-schedule__message wl-home-v2-social-radio-schedule__message--muted">
              No schedule images are available for the next four days yet.
            </p>
          : <ul className="wl-home-v2-social-radio-schedule__list">
              {items.map((item) => {
                const busy = downloadingKey === item.dayKey
                return (
                  <li key={item.dayKey}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDownload(item)}
                      className="widget-panel wl-home-v2-social-radio-schedule__download-btn"
                    >
                      <span className="wl-home-v2-social-radio-schedule__download-label">
                        {item.label}
                      </span>
                      {busy ?
                        <CircleNotch
                          className="wl-home-v2-social-radio-schedule__download-icon wl-home-v2-social-radio-schedule__download-icon--spin"
                          aria-hidden
                        />
                      : <DownloadSimple
                          className="wl-home-v2-social-radio-schedule__download-icon"
                          aria-hidden
                        />
                      }
                      <span className="sr-only">Download schedule image</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          }
          {downloadError ?
            <p
              className="wl-home-v2-social-radio-schedule__message wl-home-v2-social-radio-schedule__message--error wl-home-v2-social-radio-schedule__message--error-spaced"
              role="alert"
            >
              {downloadError}
            </p>
          : null}
        </div>
      </section>
    </WlHomeV2>
  )
}

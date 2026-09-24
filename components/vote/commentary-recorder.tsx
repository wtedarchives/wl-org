"use client"

import { useEffect, useRef, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { loadMyCommentary, submitCommentary } from "@/components/vote/commentary-api"

const MAX_SECONDS = 60

function preferredMime() {
  if (typeof MediaRecorder === "undefined") return ""
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? ""
}

function formatClock(seconds: number) {
  const whole = Math.min(MAX_SECONDS, Math.max(0, Math.floor(seconds)))
  return `0:${String(whole).padStart(2, "0")}`
}

export function CommentaryRecorder() {
  const { session, loading, signIn } = useAuth()
  const [hydrated, setHydrated] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const startedAtRef = useRef(0)

  useEffect(() => {
    if (loading) return
    if (!session) {
      setSubmitted(false)
      setPlaybackUrl(null)
      setError(null)
      setHydrated(true)
      return
    }

    let cancelled = false
    setHydrated(false)
    void loadMyCommentary(session.token).then((result) => {
      if (cancelled) return
      setSubmitted(result.submitted)
      setPlaybackUrl(result.playbackUrl)
      setError(result.error)
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [loading, session])

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function stopRecording() {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === "inactive") return
    const seconds = (Date.now() - startedAtRef.current) / 1000
    setDuration(Math.min(MAX_SECONDS, seconds))
    recorder.stop()
    setRecording(false)
  }

  async function startRecording() {
    if (!session) {
      signIn()
      return
    }
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setBlob(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = preferredMime()
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const next = new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
        setBlob(next)
        setPreviewUrl(URL.createObjectURL(next))
      }
      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      setElapsed(0)
      setRecording(true)
      recorder.start()
    } catch {
      setError("Microphone access is needed to record.")
    }
  }

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000
      setElapsed(seconds)
      if (seconds >= MAX_SECONDS) stopRecording()
    }, 200)
    return () => window.clearInterval(timer)
  }, [recording])

  async function submit() {
    if (!session || !blob || submitted || submitting) return
    setSubmitting(true)
    setError(null)
    const result = await submitCommentary(session.token, blob, duration || elapsed)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      if (result.error.toLowerCase().includes("already submitted")) setSubmitted(true)
      return
    }
    setSubmitted(true)
    if (previewUrl) setPlaybackUrl(previewUrl)
  }

  const previewOpen = Boolean(previewUrl || (submitted && playbackUrl))
  const listenUrl = submitted ? playbackUrl : previewUrl

  return (
    <div className="commentary">
      {submitted ? (
        <p className="commentary__note" role="status">
          Your commentary is in. One recording per account.
        </p>
      ) : !session && hydrated ? (
        <p className="commentary__note">
          Sign in with your Wysteria Lane account to record. You can submit once.
        </p>
      ) : null}

      {error ? (
        <p className="commentary__error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="commentary__clock" aria-live="polite">
        {recording ? formatClock(elapsed) : duration > 0 ? formatClock(duration) : "0:00"}
      </p>

      <div className="commentary__actions">
        {!session && hydrated ? (
          <button type="button" className="commentary__button commentary__button--submit" onClick={signIn}>
            Sign in to record
          </button>
        ) : null}
        {submitted || !session ? null : recording ? (
          <button type="button" className="commentary__button" onClick={stopRecording}>
            Stop
          </button>
        ) : (
          <button
            type="button"
            className="commentary__button commentary__button--record"
            disabled={!hydrated || submitting}
            onClick={() => {
              void startRecording()
            }}
          >
            {blob ? "Record again" : "Record"}
          </button>
        )}
        {submitted || !session ? null : (
          <button
            type="button"
            className="commentary__button commentary__button--submit"
            disabled={!blob || recording || submitting}
            onClick={() => {
              void submit()
            }}
          >
            {submitting ? "Submitting…" : "Submit commentary"}
          </button>
        )}
      </div>

      <div className={`commentary__preview${previewOpen ? " commentary__preview--open" : ""}`}>
        {listenUrl ? (
          <audio className="commentary__audio" controls src={listenUrl} />
        ) : null}
      </div>
    </div>
  )
}

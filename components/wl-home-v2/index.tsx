"use client"

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"

import "./wl-home-v2.css"
import { WlHomeV2Footer } from "./wl-home-v2-footer"
import { WlHomeV2ForgotPasswordModal } from "./wl-home-v2-forgot-password-modal"
import { WlHomeV2Header } from "./wl-home-v2-header"
import { WlHomeV2LoginModal } from "./wl-home-v2-login-modal"
import { WlHomeV2RequestModal } from "./wl-home-v2-request-modal"
import { WlHomeV2ScheduleModal } from "./wl-home-v2-schedule-modal"
import { WlHomeV2SignupModal } from "./wl-home-v2-signup-modal"
import { WlHomeV2Tiles } from "./wl-home-v2-tiles"
import {
  type WlHomeV2TrailHue,
  useWlHomeV2CursorTrail,
} from "./use-wl-home-v2-cursor-trail"

export function WlHomeV2() {
  const rootRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [finePointer, setFinePointer] = useState(false)
  const onFinePointer = useCallback((v: boolean) => {
    setFinePointer(v)
  }, [])

  const [trailEnabled, setTrailEnabled] = useState(true)
  const [density, setDensity] = useState(3)
  const [hue, setHue] = useState<WlHomeV2TrailHue>("orange")

  const [requestOpen, setRequestOpen] = useState(false)
  const requestHeadingId = useId()

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const scheduleHeadingId = useId()

  const [loginOpen, setLoginOpen] = useState(false)
  const loginHeadingId = useId()

  const [forgotOpen, setForgotOpen] = useState(false)
  const forgotHeadingId = useId()

  const [signupOpen, setSignupOpen] = useState(false)
  const signupHeadingId = useId()

  const [tweaksOpen, setTweaksOpen] = useState(false)

  useWlHomeV2CursorTrail(
    rootRef,
    coreRef,
    ringRef,
    canvasRef,
    trailEnabled,
    density,
    hue,
    onFinePointer,
  )

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data || {}
      if (d.type === "__activate_edit_mode") setTweaksOpen(true)
      if (d.type === "__deactivate_edit_mode") setTweaksOpen(false)
    }
    window.addEventListener("message", onMsg)
    try {
      window.parent.postMessage({ type: "__edit_mode_available" }, "*")
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener("message", onMsg)
  }, [])

  useEffect(() => {
    if (!requestOpen && !scheduleOpen && !loginOpen && !forgotOpen && !signupOpen)
      return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      setRequestOpen(false)
      setScheduleOpen(false)
      setLoginOpen(false)
      setForgotOpen(false)
      setSignupOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [requestOpen, scheduleOpen, loginOpen, forgotOpen, signupOpen])

  const rootClass = "wl-home-v2" + (finePointer ? " trail-active" : "")

  return (
    <div ref={rootRef} className={rootClass}>
      <div className="wl-home-v2__stack">
        <WlHomeV2Header
          onOpenLogin={() => setLoginOpen(true)}
          onOpenSignup={() => {
            setLoginOpen(false)
            setSignupOpen(true)
          }}
        />

        <main>
          <WlHomeV2Tiles
            onOpenRequest={() => setRequestOpen(true)}
            onOpenLogin={() => setLoginOpen(true)}
            onOpenSchedule={() => setScheduleOpen(true)}
          />
        </main>

        <WlHomeV2Footer />
      </div>

      {/* Outside main + stack shell so z-index stacks above header (header z-5 vs main z-3). */}
      <WlHomeV2RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        headingId={requestHeadingId}
      />
      <WlHomeV2ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        headingId={scheduleHeadingId}
      />
      <WlHomeV2LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        headingId={loginHeadingId}
        onOpenForgotPassword={() => {
          setLoginOpen(false)
          setForgotOpen(true)
        }}
        onOpenSignUp={() => {
          setLoginOpen(false)
          setSignupOpen(true)
        }}
      />
      <WlHomeV2ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        headingId={forgotHeadingId}
        onBackToLogin={() => {
          setForgotOpen(false)
          setLoginOpen(true)
        }}
      />
      <WlHomeV2SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        headingId={signupHeadingId}
        onBackToLogin={() => {
          setSignupOpen(false)
          setLoginOpen(true)
        }}
      />

      <div className="cursor-ring" ref={ringRef} id="cursorRing" />
      <div className="cursor-core" ref={coreRef} id="cursorCore" />
      <canvas className="trail-canvas" ref={canvasRef} id="trailCanvas" />

      <div className={"tweaks" + (tweaksOpen ? " open" : "")} id="tweaks">
        <h3>Tweaks</h3>
        <label>
          Cursor trail
          <input
            type="checkbox"
            id="tk-trail"
            checked={trailEnabled}
            onChange={(e) => setTrailEnabled(e.target.checked)}
          />
        </label>
        <label>
          Trail density
          <input
            type="range"
            id="tk-density"
            min={0}
            max={8}
            step={1}
            value={density}
            onInput={(e) => {
              const v = +(e.target as HTMLInputElement).value
              setDensity(v)
            }}
          />
          <span className="val" id="tk-density-val">
            {density}
          </span>
        </label>
        <label>
          Trail hue
          <select
            id="tk-hue"
            value={hue}
            onChange={(e) => setHue(e.target.value as WlHomeV2TrailHue)}
          >
            <option value="orange">Orange</option>
            <option value="green">Green</option>
            <option value="white">White</option>
            <option value="rainbow">Rainbow</option>
          </select>
        </label>
      </div>
    </div>
  )
}

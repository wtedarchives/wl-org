"use client"

import { useEffect, useState } from "react"

import { WlHomeV2 } from "@/components/wl-home-v2"

import "./wl-home-v2-thankyou-view.css"

const REDIRECT_SECONDS = 10

export function WlHomeV2ThankyouView() {
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id)
          window.location.href = "/"
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [])

  return (
    <WlHomeV2>
      <div className="wl-home-v2-thankyou">
        <div className="wl-home-v2-thankyou__inner">
          <h1 className="wl-home-v2-thankyou__title">Thank You!</h1>
          <p className="wl-home-v2-thankyou__copy">
            Your gift is what enables WTED and the Wysteria Lane community to
            continue to thrive. Thanks again, and keep it TED.
          </p>
          <p className="wl-home-v2-thankyou__countdown" aria-live="polite">
            Heading home in&nbsp;
            <span className="wl-home-v2-thankyou__countdown-num">{seconds}</span>
            …
          </p>
        </div>
      </div>
    </WlHomeV2>
  )
}

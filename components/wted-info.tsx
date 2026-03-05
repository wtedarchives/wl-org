"use client"

import { useEffect, useRef } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const RADIO_HISTORY_SRC = "https://embed.radio.co/embed/s3c11c85d6/history.js?l=20"

export function WtedInfo() {
  const historyContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = historyContainerRef.current
    if (!container) return

    // Remove any existing script and clear content to prevent double rendering
    // (e.g. from React Strict Mode remount or async script load timing)
    const existingScript = document.querySelector(
      `script[src="${RADIO_HISTORY_SRC}"]`
    )
    if (existingScript) existingScript.remove()
    container.innerHTML = ""

    const script = document.createElement("script")
    script.src = RADIO_HISTORY_SRC
    script.async = true
    script.dataset.radioHistory = "true"
    container.appendChild(script)

    return () => {
      script.remove()
      if (historyContainerRef.current) {
        historyContainerRef.current.innerHTML = ""
      }
    }
  }, [])

  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <style>{`
        .radioco_history20 ul li {
          padding-bottom: 10px;
          padding-left: 1.5rem;
          text-indent: -1.5rem;
        }
      `}</style>
      <main className="flex-1">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center text-wl-white">
            <h1 className="text-xl font-bold">WTED Goose Radio</h1>
            <p className="mt-1 text-base font-medium">Powered by Wysteria Lane</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-0 bg-wl-dark-grey/90 text-wl-white ring-0">
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold">Listen Live</CardTitle>
                <CardDescription className="text-wl-white/80">
                  Stream WTED Goose Radio right in your browser.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-center">
                  <iframe
                    src="https://embed.radio.co/player/55044fc.html"
                    title="WTED Goose Radio Player"
                    allow="autoplay"
                    scrolling="no"
                    className="mx-auto w-full max-w-xl rounded-md border-0 shadow-xl"
                    style={{ height: "100px" }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-wl-dark-grey/90 text-wl-white ring-0">
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold">WTED Mobile Apps</CardTitle>
                <CardDescription className="text-wl-white/80">
                  Take WTED Goose Radio with you wherever you go.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform duration-300 hover:scale-105"
                  >
                    <img
                      src="/app-store-badge.svg"
                      alt="Download on the App Store"
                      className="h-[66px] w-auto object-contain shadow-xl"
                    />
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform duration-300 hover:scale-105"
                  >
                    <img
                      src="/google-play-badge.svg"
                      alt="Get it on Google Play"
                      className="h-[66px] w-auto object-contain shadow-xl"
                    />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 bg-wl-dark-grey/90 text-wl-white ring-0">
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-semibold">Upcoming Schedule</CardTitle>
              <CardDescription className="text-wl-white/80">
                See what&apos;s coming up on WTED Goose Radio.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-center">
                <iframe
                  src="https://embed.radio.co/embeds/schedule/es27f0222.html"
                  title="WTED Schedule"
                  allow="autoplay"
                  scrolling="no"
                  className="mx-auto w-full rounded-md border-0 shadow-xl"
                  style={{ height: "600px" }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-0 bg-wl-dark-grey/90 text-wl-white ring-0">
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold">Request a Song</CardTitle>
                <CardDescription className="text-wl-white/80">
                  Request a song to be played on WTED Goose Radio.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <iframe
                  src="https://embed.radio.co/request/w2255950.html"
                  title="WTED Request a Song"
                  allow="autoplay"
                  scrolling="no"
                  className="w-full rounded-md border-0 shadow-xl"
                  style={{ height: "500px" }}
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-wl-dark-grey/90 text-wl-white ring-0">
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold">Recently Played Tracks</CardTitle>
                <CardDescription className="text-wl-white/80">
                  See what was recently played on WTED Goose Radio.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div
                  ref={historyContainerRef}
                  id="radio-co-history"
                  className="text-left text-sm leading-[1rem] text-wl-white"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}


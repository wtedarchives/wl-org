"use client"

import {
  WTED_ABOUT_LAST_UPDATED,
  WtedAboutLegacyBody,
} from "@/components/wted/wted-about-shared"

export function WtedAbout() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center text-wl-white">
            <h1 className="text-xl font-bold">About Us and FAQ</h1>
            <p className="mt-2 text-sm text-wl-white/80">
              Last updated: {WTED_ABOUT_LAST_UPDATED}
            </p>
          </div>

          <div className="mt-6">
            <WtedAboutLegacyBody />
          </div>
        </div>
      </main>
    </div>
  )
}

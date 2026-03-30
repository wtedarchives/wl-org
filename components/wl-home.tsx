"use client"

import Image from "next/image"
import Link from "next/link"

import { ColumnBanner } from "@/components/column-banner"
import { CommunityArchiveSection } from "@/components/community-archive-section"
import { WtedRadioScheduleCard } from "@/components/wted-radio-schedule-card"
import { WtedRequestSongCard } from "@/components/wted-request-song-card"

export function WlHome() {
  return (
    <div
      className="flex h-full flex-col rounded-b-none bg-wl-dark-green bg-[linear-gradient(to_bottom,rgba(40,91,78,0.8),rgba(40,91,78,0.8)),url('/newbg.png')] bg-cover bg-center bg-fixed md:rounded-b-xl"
    >
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          {/* Hero: image + text blurb above columns */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
            <div className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] shadow-lg lg:aspect-auto lg:h-full lg:min-h-[140px] lg:w-48 xl:w-56">
              <Image
                src="/goose-press-2025.jpg"
                alt="Goose press photo with confetti"
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover object-center"
                priority
              />
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-wl-dark-grey/50 bg-[#313a34] p-4">
              <h1 className="mb-2 text-center text-xl font-bold text-wl-white lg:text-left lg:text-2xl">
                Welcome to Wysteria Lane
              </h1>
              <p className="text-sm leading-5 text-wl-white lg:text-left">
                <span className="font-bold">Wysteria Lane </span>
                is the home for WTED Goose Radio, a 24/7 radio station dedicated to Goose music. 
                Join us in the Community Forum, and explore our
                comprehensive Setlist Archive, all available free of charge.
              </p>
            </div>
          </div>

          {/* Radio section: full-width hero, then Schedule | Request, then Explore links */}
          <section className="mb-6 flex flex-col gap-3">
            <ColumnBanner
              src="/wted-radio-banner.jpg"
              alt="WTED Radio"
              label="WTED Goose Radio"
              description="Listen to Goose on-demand, 24/7."
              href="/wted"
              mutedBg
              logoSrc="/WTED3.png"
              rightContent={
                <>
                  <a
                    href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[50px] w-full max-w-[140px] shrink-0 items-center justify-center transition-transform duration-300 hover:scale-105 sm:h-[66px] xl:max-w-[180px]"
                  >
                    <Image
                      src="/app-store-badge.svg"
                      alt="Download on the App Store"
                      width={120}
                      height={40}
                      className="h-full w-full object-contain object-center shadow-xl"
                    />
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[50px] w-full max-w-[140px] shrink-0 items-center justify-center transition-transform duration-300 hover:scale-105 sm:h-[66px] xl:max-w-[180px]"
                  >
                    <Image
                      src="/google-play-badge.svg"
                      alt="Get it on Google Play"
                      width={135}
                      height={40}
                      className="h-full w-full object-contain object-center shadow-xl"
                    />
                  </a>
                </>
              }
            />
            <div className="flex flex-col divide-y divide-wl-dark-grey/50 overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] sm:flex-row sm:divide-x sm:divide-y-0">
              <span className="flex flex-1 items-center justify-center bg-wl-orange/80 px-4 py-2 text-center text-[13px] font-semibold text-wl-white">
                Explore WTED Radio
              </span>
              <Link
                href="/wted/info"
                className="flex flex-1 items-center justify-center px-4 py-2 text-center text-xs font-semibold text-wl-white transition-colors hover:bg-[#3d4842]"
              >
                WTED Info
              </Link>
              <Link
                href="/wted/gorps"
                className="flex flex-1 items-center justify-center px-4 py-2 text-center text-xs font-semibold text-wl-white transition-colors hover:bg-[#3d4842]"
              >
                GORPs and Contributors
              </Link>
              <Link
                href="/wted/shows"
                className="flex flex-1 items-center justify-center px-4 py-2 text-center text-xs font-semibold text-wl-white transition-colors hover:bg-[#3d4842]"
              >
                Shows and More
              </Link>
              <Link
                href="/wted/about"
                className="flex flex-1 items-center justify-center px-4 py-2 text-center text-xs font-semibold text-wl-white transition-colors hover:bg-[#3d4842]"
              >
                About Us and FAQ
              </Link>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-2 xl:gap-6">
              <div className="flex min-h-0 flex-col">
                <WtedRadioScheduleCard className="h-full flex flex-col min-h-0" />
              </div>
              <div className="flex min-h-0 flex-col">
                <WtedRequestSongCard />
              </div>
            </div>
          </section>

          {/* Community and Archive: left headers, right carousels */}
          <CommunityArchiveSection />
        </div>
      </main>
    </div>
  )
}


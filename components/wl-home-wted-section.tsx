"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Broadcast,
  ClockCounterClockwise,
  PencilSimple,
} from "@phosphor-icons/react"

import { RadioHomeSlot } from "@/components/persistent-radio"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { WtedRadioScheduleCard } from "@/components/wted-radio-schedule-card"
import { WtedRecentlyPlayedCard } from "@/components/wted-recently-played-card"
import { WtedRequestSongCard } from "@/components/wted-request-song-card"
import { useIsMinXl } from "@/hooks/use-mobile"
import { useOnceInView } from "@/hooks/use-once-in-view"

/** Matches `CardHeader` / `CardTitle` on schedule & request cards (WTED card uses centered titles). */
function WtedCardSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-3 md:-mx-4">
      <div className="flex min-w-0 flex-row items-center justify-center gap-2 px-3 md:px-4">
        <h3 className="w-full text-center text-[13px] font-semibold text-wl-white">
          {children}
        </h3>
      </div>
    </div>
  )
}

const accordionPanelCardClassName =
  "h-[328px] min-h-0 flex flex-col overflow-hidden rounded-none border-0 shadow-none ring-0"

/** Defers the heavy `wted_radio_ids` catalog fetch until the third column nears the viewport. */
function WtedRequestSongCardLazyOnXl() {
  const { ref, active } = useOnceInView("240px 0px 200px 0px")
  return (
    <div ref={ref} className="flex h-[365px] min-h-0 flex-col">
      <WtedRequestSongCard catalogFetchEnabled={active} />
    </div>
  )
}

function WtedExploreRadioNavInner() {
  return (
    <div className="grid w-max max-w-full grid-cols-1 gap-0.5">
      <span className="flex w-full min-w-0 cursor-default select-none items-center justify-center rounded-lg bg-wl-orange/80 px-3 py-1 text-center text-[13px] font-semibold leading-tight text-wl-white">
        Explore WTED Radio
      </span>
      <Link
        href="/wted/program-director"
        className="flex w-full min-w-0 items-center justify-center rounded-lg bg-wl-dark-green px-3 py-1 text-center text-xs font-semibold leading-tight text-wl-white transition-colors hover:bg-[#3d4842]"
      >
        Program Director
      </Link>
      <Link
        href="/wted/about"
        className="flex w-full min-w-0 items-center justify-center rounded-lg bg-wl-dark-green px-3 py-1 text-center text-xs font-semibold leading-tight text-wl-white transition-colors hover:bg-[#3d4842]"
      >
        About Us and FAQ
      </Link>
      <Link
        href="/wted/gorps"
        className="flex w-full min-w-0 items-center justify-center rounded-lg bg-wl-dark-green px-3 py-1 text-center text-xs font-semibold leading-tight text-wl-white transition-colors hover:bg-[#3d4842]"
      >
        GORPs and Contributors
      </Link>
    </div>
  )
}

function HomeWtedRadioCards() {
  const isXlGrid = useIsMinXl()
  const [mobileWtedAccordion, setMobileWtedAccordion] = useState<
    string | undefined
  >("schedule")

  if (isXlGrid) {
    return (
      <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-3 xl:gap-6">
        <div className="flex h-[365px] min-h-0 flex-col">
          <WtedRadioScheduleCard className="h-full min-h-0 flex flex-col overflow-hidden" />
        </div>
        <div className="flex h-[365px] min-h-0 flex-col">
          <WtedRecentlyPlayedCard className="h-full min-h-0 flex flex-col" />
        </div>
        <WtedRequestSongCardLazyOnXl />
      </div>
    )
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={mobileWtedAccordion}
      onValueChange={setMobileWtedAccordion}
      className="overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] text-xs shadow-sm ring-0"
    >
      <AccordionItem value="schedule" className="border-0">
        <AccordionTrigger className="border-b border-wl-dark-grey/50 bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="min-w-0">Upcoming Schedule</span>
            <Broadcast className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <div className="min-h-0">
            <WtedRadioScheduleCard
              hideHeader
              className={accordionPanelCardClassName}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="recent" className="border-0 border-t border-wl-dark-grey/50">
        <AccordionTrigger className="border-b border-wl-dark-grey/50 bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="min-w-0">Recently Played Tracks</span>
            <ClockCounterClockwise className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <div className="min-h-0">
            <WtedRecentlyPlayedCard
              hideHeader
              className={accordionPanelCardClassName}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="request" className="border-0 border-t border-wl-dark-grey/50">
        <AccordionTrigger className="border-b border-wl-dark-grey/50 bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="min-w-0">Request a Song</span>
            <PencilSimple className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <div className="min-h-0">
            <WtedRequestSongCard
              hideHeader
              className={accordionPanelCardClassName}
              catalogFetchEnabled={mobileWtedAccordion === "request"}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function WlHomeWtedSection({
  onWtedCardClick,
}: {
  onWtedCardClick: () => void
}) {
  return (
    <>
      {/* WTED: full-card bg image; click (xl+) pulses the radio embed; inner links still navigate */}
      <div
        className="group relative isolate mb-4 overflow-hidden rounded-xl border border-wl-dark-grey/50 shadow-sm transition-all duration-200 ease-out"
        onClick={onWtedCardClick}
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <div className="relative size-full">
            <Image
              src="/wted-radio-banner.jpg"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, min(1280px, 100vw)"
              className="object-cover object-center grayscale transition-all duration-300 ease-out brightness-[0.6] group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:brightness-[0.75]"
              unoptimized
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/55"
            aria-hidden
          />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-stretch">
          <div className="flex w-full flex-col items-center justify-center gap-0.5 px-4 md:min-w-0 md:w-auto md:flex-1 md:basis-0">
            <Image
              src="/WTED3.png"
              alt=""
              width={64}
              height={64}
              className="mt-3 h-14 w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:h-16 md:mt-0"
              unoptimized
            />
            <span className="text-center text-xl font-semibold leading-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-2xl">
              WTED Goose Radio
            </span>
            <span className="mt-1.5 text-center text-sm font-medium leading-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-base">
              Listen to Goose on-demand, 24/7.
            </span>
          </div>

          {/* Middle column: xl+ only. Below xl, explore links live in the right column. */}
          <nav
            className="hidden min-w-0 flex-col items-center justify-center px-3 py-2 xl:flex xl:min-w-0 xl:flex-1 xl:basis-0 xl:shrink xl:self-center"
            aria-label="Explore WTED Radio"
          >
            <WtedExploreRadioNavInner />
          </nav>

          <div className="flex w-full min-w-0 shrink-0 flex-col gap-4 p-3 md:min-w-0 md:flex-1 md:basis-0 md:shrink md:self-center md:p-4 xl:w-[min(100%,420px)] xl:flex-none xl:shrink-0">
            <nav
              className="hidden min-w-0 flex-col items-center justify-center px-0 py-1 md:flex xl:hidden"
              aria-label="Explore WTED Radio"
            >
              <WtedExploreRadioNavInner />
            </nav>
            <div className="hidden min-w-0 flex-col gap-1 xl:flex">
              <WtedCardSectionHeader>Listen Now</WtedCardSectionHeader>
              <div className="min-h-[66px] w-full min-w-0">
                <RadioHomeSlot />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 md:pt-0">
              <WtedCardSectionHeader>WTED on the Go!</WtedCardSectionHeader>
              <div className="flex min-w-0 w-full flex-row flex-wrap items-center justify-center gap-4 px-0.5 py-1">
                <a
                  href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 max-w-full shrink-0 items-center transition-transform duration-300 hover:scale-105"
                >
                  <Image
                    src="/app-store-badge.svg"
                    alt="Download on the App Store"
                    width={120}
                    height={40}
                    className="h-12 w-auto max-w-full object-contain object-center shadow-xl"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 max-w-full shrink-0 items-center transition-transform duration-300 hover:scale-105"
                >
                  <Image
                    src="/google-play-badge.svg"
                    alt="Get it on Google Play"
                    width={135}
                    height={40}
                    className="h-12 w-auto max-w-full object-contain object-center shadow-xl"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-6 flex flex-col gap-3">
        {/* Explore bar only below md; desktop uses vertical nav inside WTED card */}
        <div className="flex flex-col divide-y divide-wl-dark-grey/50 overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] sm:flex-row sm:divide-x sm:divide-y-0 md:hidden">
          <span className="flex flex-1 cursor-default select-none items-center justify-center bg-wl-orange/80 px-4 py-2 text-center text-[13px] font-semibold text-wl-white">
            Explore WTED Radio
          </span>
          <Link
            href="/wted/program-director"
            className="flex flex-1 items-center justify-center px-4 py-2 text-center text-xs font-semibold text-wl-white transition-colors hover:bg-[#3d4842]"
          >
            Program Director
          </Link>
          <Link
            href="/wted/about"
            className="flex flex-1 items-center justify-center px-4 py-2 text-center text-xs font-semibold text-wl-white transition-colors hover:bg-[#3d4842]"
          >
            About Us and FAQ
          </Link>
          <Link
            href="/wted/gorps"
            className="flex flex-1 items-center justify-center px-4 py-2 text-center text-xs font-semibold text-wl-white transition-colors hover:bg-[#3d4842]"
          >
            GORPs and Contributors
          </Link>
        </div>
        <HomeWtedRadioCards />
      </section>
    </>
  )
}

"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

import {
  MAIN_INSET_SCROLL_ID,
  welcomeHeroInlineLinkClassName,
  welcomeHeroInlineLinkFocusClassName,
  welcomeHeroInlineLinkTextClassName,
} from "@/components/wl-home-shared"

export function WlHomeHero({
  onWtedInlineLinkClick,
}: {
  onWtedInlineLinkClick: () => void
}) {
  return (
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
          is the home for{" "}
          <a
            href={`#${MAIN_INSET_SCROLL_ID}`}
            onClick={(e) => {
              e.preventDefault()
              onWtedInlineLinkClick()
            }}
            className={cn(
              "inline cursor-pointer text-left",
              welcomeHeroInlineLinkFocusClassName,
            )}
            aria-label="Scroll to top and highlight WTED radio player"
          >
            <span className={welcomeHeroInlineLinkTextClassName}>
              WTED Goose Radio
            </span>
            <span className="font-normal text-inherit">,</span>
          </a>{" "}
          a 24/7 radio station dedicated to Goose music. Join us in the{" "}
          <a
            href="https://community.wysterialane.org"
            target="_blank"
            rel="noopener noreferrer"
            className={welcomeHeroInlineLinkClassName}
          >
            Wysteria Lane Community
          </a>{" "}
          forum, and explore our comprehensive concert{" "}
          <a
            href="/old/archive"
            className={cn(
              "inline cursor-pointer text-left",
              welcomeHeroInlineLinkFocusClassName,
            )}
          >
            <span className={welcomeHeroInlineLinkTextClassName}>
              WTED Archives
            </span>
            <span className="font-normal text-inherit">,</span>
          </a>{" "}
          all available free of charge.
        </p>
      </div>
    </div>
  )
}

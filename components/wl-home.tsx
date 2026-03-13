"use client"

import Image from "next/image"
import Link from "next/link"

import { HomeStatsColumn } from "@/components/home-stats-column"

function ColumnBanner({
  src,
  alt,
  label,
  href,
  dim = false,
  logoSrc,
}: {
  src: string
  alt: string
  label: string
  href?: string
  dim?: boolean
  logoSrc?: string
}) {
  const brightnessClasses = dim
    ? "brightness-[0.55] group-hover:brightness-[0.75]"
    : "brightness-90 group-hover:brightness-95"

  const inner = (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className={`object-cover grayscale transition-all duration-300 ease-out group-hover:scale-105 group-hover:blur-[1px] group-hover:grayscale-0 ${brightnessClasses}`}
        unoptimized
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt=""
            width={80}
            height={80}
            className="h-16 w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:h-20"
          />
        ) : null}
        <span className="text-2xl font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {label}
        </span>
      </div>
    </>
  )

  const wrapperClassName =
    "group relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 lg:aspect-[16/9]"

  if (href) {
    const isExternal = href.startsWith("http")
    return (
      <Link
        href={href}
        className={wrapperClassName}
        {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {inner}
      </Link>
    )
  }

  return <div className={wrapperClassName}>{inner}</div>
}

export function WlHome() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          {/* Hero: image + text blurb above columns */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
            <div className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 shadow-lg lg:aspect-auto lg:h-full lg:min-h-[140px] lg:w-48 xl:w-56">
              <Image
                src="/goose-press-2025.jpg"
                alt="Goose press photo with confetti"
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover object-center"
                priority
              />
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 p-4">
              <h1 className="mb-2 text-center text-xl font-bold text-wl-white lg:text-left lg:text-2xl">
                Welcome to The World of TED
              </h1>
              <p className="text-sm leading-5 text-wl-white lg:text-left">
                <span className="font-bold">WTED.org – the World of TED</span>
                , is the online home for a fan site
                and streaming radio station for the band Goose. WTED.org manages
                and operates WTED Goose Radio, the WTED.org Community, and a
                comprehensive setlist archive, all available free of charge.
              </p>
            </div>
          </div>

          {/* Three columns */}
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
            {/* Left: WTED Radio */}
            <aside className="flex flex-col gap-3 lg:order-1">
              <ColumnBanner
                src="/wted-radio-banner.jpg"
                alt="WTED Radio"
                label="WTED Radio"
                href="/wted"
                logoSrc="/WTED3.png"
              />
              <div className="min-h-[120px] rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 p-4 text-center text-sm text-wl-white/70">
                Placeholder for WTED Radio
              </div>
            </aside>

            {/* Center: Community Forum */}
            <div className="flex flex-1 flex-col gap-3 lg:order-2">
              <ColumnBanner
                src="/community-banner.jpg"
                alt="Community Forum"
                label="Community Forum"
                href="https://community.wysterialane.org"
                dim
                logoSrc="/WL.png"
              />
              <div className="min-h-[100px] rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 p-4">
                <p className="text-center text-sm text-wl-white/70">
                  Placeholder for Community Forum
                </p>
              </div>
            </div>

            {/* Right: Setlist Archive */}
            <aside className="flex flex-col gap-3 lg:order-3">
              <ColumnBanner
                src="/archive-banner.jpg"
                alt="Setlist Archive"
                label="Setlist Archive"
                href="/archive/tours"
                logoSrc="/wted-sa-cropped.png"
              />
              <HomeStatsColumn />
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}


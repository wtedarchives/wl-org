"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  GOOSE101_INTRO,
  GOOSE101_SECTIONS,
  type Goose101Section,
} from "@/app/(main)/goose101/content"

const SECTION_COUNT = 24

function SectionBlock({
  section,
  sectionRef,
}: {
  section: Goose101Section
  sectionRef: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={sectionRef}
      className="mb-4"
      data-section-id={String(section.id)}
    >
      {section.images?.length ? (
        <div className="float-right ml-4 mb-2 space-y-4">
          {section.images.map((img) => (
            <a
              key={img.src}
              href={img.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-auto w-48 rounded-lg shadow-xl transition-transform duration-300 hover:scale-105"
              />
            </a>
          ))}
        </div>
      ) : null}
      <h2
        id={`section-${section.id}`}
        className="mb-2 text-lg font-bold leading-[1.25rem] text-wl-white"
      >
        {section.id}. {section.title}
      </h2>
      <div className="space-y-4 text-sm font-normal leading-[1.125rem] text-wl-white">
        {section.paragraphs.map((p, i) => (
          <p key={i} className={i === 1 && section.paragraphs.length > 1 ? "mb-2" : ""} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
        {section.links?.length ? (
          <p className="mt-2">
            {section.links.map((l, i) => (
              <span key={l.href}>
                {i > 0 && <br />}
                <Link
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  {l.label}: {l.href}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        {section.youtubeIds?.length ? (
          <div className={section.youtubeIds.length > 1 ? "mt-4 space-y-4" : "mt-4"}>
            {section.youtubeIds.map((id) => (
              <iframe
                key={id}
                className="mx-auto aspect-video w-full max-w-2xl rounded-lg shadow-xl transition-transform duration-300 hover:scale-105"
                src={`https://www.youtube.com/embed/${id}`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="clear-both" />
    </div>
  )
}

export function Goose101() {
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const hrRefs = useRef<(HTMLDivElement | null)[]>([])
  const navContainerRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section-id")
            if (id) setActiveSection(Number(id))
          }
        })
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )
    sectionRefs.current.forEach((ref) => {
      if (ref && observerRef.current) observerRef.current.observe(ref)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    if (activeSection == null) return
    const container = navContainerRef.current
    const mobile = mobileNavRef.current
    const btn = container?.querySelector(`[data-nav-section="${activeSection}"]`) as HTMLElement
    const mobileBtn = mobile?.querySelector(`[data-nav-section="${activeSection}"]`) as HTMLElement
    if (btn && container) {
      const c = container.getBoundingClientRect()
      const b = btn.getBoundingClientRect()
      const target = container.scrollTop + (b.top - c.top) - c.height / 2 + b.height / 2
      container.scrollTo({ top: target, behavior: "smooth" })
    }
    if (mobileBtn && mobile) {
      mobileBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [activeSection])

  const scrollToSection = (num: number) => {
    const el = hrRefs.current[num - 1]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const navButtons = (
    <>
      {Array.from({ length: SECTION_COUNT }, (_, i) => i + 1).map((num, index) => (
        <div key={num} className="contents">
          <Button
            data-nav-section={num}
            variant="outline"
            size="icon"
            className={cn(
              "size-8 shrink-0 rounded-full border font-medium transition-all duration-300",
              activeSection === num
                ? "border-wl-orange text-wl-white"
                : "border-wl-white bg-transparent text-wl-white hover:scale-110 hover:bg-wl-green"
            )}
            style={
              activeSection === num
                ? { backgroundColor: "var(--wl-orange)" }
                : undefined
            }
            onClick={() => scrollToSection(num)}
            aria-label={`Go to section ${num}`}
          >
            {num}
          </Button>
          {index < SECTION_COUNT - 1 && (
            <div className="h-4 w-px shrink-0 bg-wl-white/50 py-1" aria-hidden />
          )}
        </div>
      ))}
    </>
  )

  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="relative flex-1">
        <div className="relative flex w-full max-w-7xl flex-col px-4 md:flex-row md:gap-4 lg:px-6">
          {/* Desktop: sticky vertical nav column (in flow so it works with sidebar layout) */}
          <div
            ref={navContainerRef}
            className="sticky top-[var(--header-height,0)] z-20 hidden w-10 shrink-0 overflow-x-hidden overflow-y-auto self-start pt-8 md:block [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ height: "calc(100vh - var(--header-height, 0px) - 80px)" }}
          >
            <div className="flex min-h-max flex-col items-center justify-start">
              {navButtons}
            </div>
          </div>

          {/* Mobile: sticky horizontal nav */}
          <div
            ref={mobileNavRef}
            className="sticky top-0 z-20 flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden border-b border-wl-white/20 bg-wl-dark-green/95 px-4 py-2 backdrop-blur md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {Array.from({ length: SECTION_COUNT }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                data-nav-section={num}
                variant="outline"
                size="icon"
                className={cn(
                  "size-8 shrink-0 rounded-full border font-medium transition-all duration-300",
                  activeSection === num
                    ? "border-wl-orange text-wl-white"
                    : "border-wl-white bg-transparent text-wl-white hover:bg-wl-green"
                )}
                style={
                  activeSection === num
                    ? { backgroundColor: "var(--wl-orange)" }
                    : undefined
                }
                onClick={() => scrollToSection(num)}
                aria-label={`Go to section ${num}`}
              >
                {num}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 px-4 pb-8 pt-6 md:px-8">
            <h1 className="mb-6 text-center text-xl font-bold text-wl-white">
              Goose 101: An Introduction And Guide
            </h1>
            <div className="space-y-4 text-sm font-normal leading-[1.125rem] text-wl-white">
              {GOOSE101_INTRO.paragraphs.map((p, i) => (
                <p key={i} className={i === 2 ? "text-xs italic" : ""}>
                  {p}
                </p>
              ))}
            </div>

            {GOOSE101_SECTIONS.map((section, i) => (
              <div key={section.id} className="space-y-4 text-wl-white">
                <div
                  ref={(el) => {
                    hrRefs.current[i] = el
                  }}
                  className="clear-both scroll-mt-[44px] md:scroll-mt-0"
                >
                  <Separator className="my-6 border-wl-orange" />
                </div>
                <SectionBlock
                  section={section}
                  sectionRef={(el) => {
                    sectionRefs.current[i] = el
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

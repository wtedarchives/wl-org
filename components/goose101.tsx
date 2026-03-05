"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
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

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null
  let parent = el.parentElement
  while (parent) {
    const { overflowY } = getComputedStyle(parent)
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay")
      return parent
    parent = parent.parentElement
  }
  return null
}

export function Goose101() {
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const [mobileNavAtTop, setMobileNavAtTop] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const hrRefs = useRef<(HTMLDivElement | null)[]>([])
  const navContainerRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const contentWrapperRef = useRef<HTMLDivElement>(null)

  // Observe sections so active circle updates as user scrolls (use scroll container as root when present)
  useLayoutEffect(() => {
    const scrollRoot = getScrollParent(contentWrapperRef.current) ?? null
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section-id")
            if (id) setActiveSection(Number(id))
          }
        })
      },
      {
        root: scrollRoot,
        rootMargin: scrollRoot ? "-20% 0px -60% 0px" : "-20% 0px -60% 0px",
        threshold: 0,
      }
    )
    const observer = observerRef.current
    const refs = sectionRefs.current
    const toObserve = refs.filter((r): r is HTMLDivElement => r != null)
    toObserve.forEach((ref) => observer.observe(ref))
    return () => observer.disconnect()
  }, [])

  // Mobile: when the site header scrolls out of view, move circle nav to top of screen.
  // Listen to scroll on the scroll container, or window if layout has overflow-hidden.
  useEffect(() => {
    const headerEl = document.querySelector("header")
    const scrollContainer = getScrollParent(contentWrapperRef.current)

    const updateNavPosition = () => {
      if (!headerEl) return
      const scrollTop = scrollContainer
        ? scrollContainer.scrollTop
        : typeof window !== "undefined"
          ? window.scrollY
          : 0
      const headerHeight = headerEl.getBoundingClientRect().height
      setMobileNavAtTop(scrollTop > headerHeight)
    }

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updateNavPosition, { passive: true })
      updateNavPosition()
      return () => scrollContainer.removeEventListener("scroll", updateNavPosition)
    }

    // No overflow-auto ancestor (layout uses overflow-hidden): scroll is on window
    window.addEventListener("scroll", updateNavPosition, { passive: true })
    updateNavPosition()
    return () => window.removeEventListener("scroll", updateNavPosition)
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
    // Only scroll the horizontal nav strip; do not use scrollIntoView (it would scroll the page to top)
    if (mobileBtn && mobile) {
      const containerWidth = mobile.clientWidth
      const btnLeft = mobileBtn.offsetLeft
      const btnWidth = mobileBtn.offsetWidth
      const targetScroll = btnLeft - containerWidth / 2 + btnWidth / 2
      mobile.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" })
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
    <div
      ref={contentWrapperRef}
      className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl"
    >
      <main className="relative flex-1">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 md:flex-row md:gap-4 lg:px-6">
          {/* Desktop: fixed vertical nav (sticky fails when ancestor has overflow-hidden) */}
          <div
            className="hidden w-10 shrink-0 md:block"
            aria-hidden
          />
          <div
            ref={navContainerRef}
            className="fixed top-[var(--header-height,0)] z-20 hidden h-[calc(100vh-var(--header-height,0px)-80px)] w-10 overflow-x-hidden overflow-y-auto pt-8 md:block [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              left: "calc(var(--sidebar-width, 0px) + 1rem + (100vw - var(--sidebar-width, 0px) - min(100vw - var(--sidebar-width, 0px), 82rem)) / 2)",
            }}
          >
            <div className="flex min-h-max flex-col items-center justify-start">
              {navButtons}
            </div>
          </div>

          {/* Mobile: fixed nav; sits below header until header scrolls away, then moves to top */}
          <div
            ref={mobileNavRef}
            className="fixed left-0 right-0 z-20 flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden border-b border-wl-white/20 bg-wl-dark-green/95 px-4 py-2 backdrop-blur transition-[top] duration-200 ease-out md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              top: mobileNavAtTop ? 0 : "var(--header-height, 0)",
            }}
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

          {/* Content: pt for mobile so content isn't under fixed nav; header sits below nav */}
          <div className="min-w-0 flex-1 px-4 pb-8 pt-[calc(var(--header-height,0px)+52px)] md:pt-6 md:px-8">
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
                  className="clear-both scroll-mt-[56px] md:scroll-mt-0"
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

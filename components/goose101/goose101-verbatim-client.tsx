"use client"

import { useEffect, useRef } from "react"

import { GOOSE101_MAIN_SNIPPET } from "./goose101-main-snippet"

import "./goose101-verbatim.css"

const MAIN_INSET_SCROLL_ID = "main-inset-scroll"
const TOC_FOCUS_LINE_EXTRA = 120
const PROGRESS_VIEWPORT_BIAS = 0.08

type ScrollSurface = HTMLElement | Window

function isWindow(surface: ScrollSurface): surface is Window {
  return surface === window
}

/** `(main)` uses `#main-inset-scroll`; WL Home v2 scrolls on `window`. */
function getScrollSurface(): ScrollSurface {
  const inset = document.getElementById(MAIN_INSET_SCROLL_ID)
  if (inset instanceof HTMLElement) {
    const oy = getComputedStyle(inset).overflowY
    if (oy === "auto" || oy === "scroll" || oy === "overlay") return inset
  }
  return window
}

function viewportHeight(surface: ScrollSurface): number {
  return isWindow(surface) ? window.innerHeight : surface.clientHeight
}

function scrollTop(surface: ScrollSurface): number {
  return isWindow(surface) ? window.scrollY : surface.scrollTop
}

function scrollSurfaceTo(surface: ScrollSurface, y: number, behavior?: ScrollBehavior) {
  if (isWindow(surface)) window.scrollTo({ top: y, behavior })
  else surface.scrollTo({ top: y, behavior })
}

/** Top edge of element within the scrolling coordinate system (`window` vs inset pane). */
function contentOffsetTop(el: HTMLElement, surface: ScrollSurface): number {
  if (isWindow(surface)) {
    const r = el.getBoundingClientRect()
    return window.scrollY + r.top
  }
  const sr = surface.getBoundingClientRect()
  const er = el.getBoundingClientRect()
  return surface.scrollTop + (er.top - sr.top)
}

export function Goose101VerbatimClient() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = wrapRef.current
    const bar = progressRef.current
    if (!root || !bar) return

    const scrollSurface = getScrollSurface()

    const article = root.querySelector("#article")
    if (!(article instanceof HTMLElement)) return

    const updateProgress = () => {
      const viewportH = viewportHeight(scrollSurface)
      const rectTop = contentOffsetTop(article, scrollSurface)
      const artH = article.offsetHeight

      const total = Math.max(artH - viewportH, 1)
      const scrolled =
        scrollTop(scrollSurface) + viewportH * PROGRESS_VIEWPORT_BIAS - rectTop
      const pct = Math.max(0, Math.min(1, scrolled / total))
      bar.style.width = `${pct * 100}%`
    }

    const tocLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>("#toc a"))

    const updateToc = () => {
      const targets = tocLinks
        .map((l) => {
          const sel = l.getAttribute("href")
          if (!sel?.startsWith("#")) return null
          return root.querySelector<HTMLElement>(sel)
        })
        .filter(Boolean) as HTMLElement[]

      let activeEl: HTMLElement | null = targets[0] ?? null
      const focusLine = scrollTop(scrollSurface) + TOC_FOCUS_LINE_EXTRA
      for (const t of targets) {
        if (contentOffsetTop(t, scrollSurface) <= focusLine) activeEl = t
        else break
      }

      tocLinks.forEach((l) => {
        const href = l.getAttribute("href")?.slice(1)
        const on = !!(activeEl?.id && href === activeEl.id)
        l.classList.toggle("active", on)
      })
    }

    const onScroll = () => {
      updateProgress()
      updateToc()
    }

    const ytCleanups: (() => void)[] = []

    root.querySelectorAll(".yt-embed").forEach((node) => {
      const thumb = node.querySelector(".yt-thumb")
      if (!(node instanceof HTMLElement) || !(thumb instanceof HTMLElement)) return
      const onClick = () => {
        const id = node.dataset.yt
        if (!id) return
        node.innerHTML = ""
        const iframe = document.createElement("iframe")
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`
        iframe.title = "YouTube video player"
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        iframe.referrerPolicy = "strict-origin-when-cross-origin"
        iframe.allowFullscreen = true
        iframe.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;border:0;"
        node.appendChild(iframe)
      }
      thumb.addEventListener("click", onClick)
      ytCleanups.push(() => thumb.removeEventListener("click", onClick))
    })

    const tocCleanups: (() => void)[] = []
    tocLinks.forEach((l) => {
      const onTocClick = (e: MouseEvent) => {
        const href = l.getAttribute("href")
        if (!href?.startsWith("#")) return
        const target = root.querySelector<HTMLElement>(href)
        if (!(target instanceof HTMLElement)) return

        e.preventDefault()
        const y = Math.max(
          0,
          contentOffsetTop(target, scrollSurface) - TOC_FOCUS_LINE_EXTRA,
        )
        scrollSurfaceTo(scrollSurface, y, "smooth")
        window.history.replaceState(null, "", href)
      }
      l.addEventListener("click", onTocClick as EventListener)
      tocCleanups.push(() => l.removeEventListener("click", onTocClick as EventListener))
    })

    if (isWindow(scrollSurface))
      window.addEventListener("scroll", onScroll, { passive: true })
    else scrollSurface.addEventListener("scroll", onScroll, { passive: true })

    window.addEventListener("resize", onScroll)

    onScroll()

    return () => {
      if (isWindow(scrollSurface))
        window.removeEventListener("scroll", onScroll)
      else scrollSurface.removeEventListener("scroll", onScroll)

      window.removeEventListener("resize", onScroll)
      ytCleanups.forEach((fn) => fn())
      tocCleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="goose101-verbatim-shell wl-goose101 wl-goose101-shell flex min-h-full min-w-0 flex-1 flex-col"
    >
      <div ref={progressRef} className="progress-bar" aria-hidden />
      <div
        dangerouslySetInnerHTML={{ __html: GOOSE101_MAIN_SNIPPET }}
        suppressHydrationWarning
      />
    </div>
  )
}

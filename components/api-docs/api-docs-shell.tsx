"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

export function ApiDocsShell({
  sidebar,
  toc,
  children,
}: {
  sidebar: React.ReactNode
  toc: React.ReactNode
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)

  const openMenu = useCallback(() => {
    setMenuOpen(true)
    window.requestAnimationFrame(() => setMenuVisible(true))
  }, [])

  const closeMenu = useCallback(() => {
    setMenuVisible(false)
    window.setTimeout(() => setMenuOpen(false), 220)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [closeMenu, menuOpen])

  return (
    <div className="api-docs">
      <header className="api-docs-topbar">
        <Link href="/" className="api-docs-brand">
          <span className="api-docs-brand-mark">WTED ARCHIVES</span>
          <span className="api-docs-brand-sep" aria-hidden="true">
            /
          </span>
          <span className="api-docs-brand-page">API</span>
        </Link>
        <div className="api-docs-topbar-actions">
          <Link href="/" className="api-docs-topbar-home">
            Home
          </Link>
          <button
            type="button"
            className="api-docs-menu-btn"
            aria-expanded={menuVisible}
            aria-controls="api-docs-sidebar"
            onClick={menuVisible ? closeMenu : openMenu}
          >
            <span className="sr-only">{menuVisible ? "Close menu" : "Open menu"}</span>
            <span className="api-docs-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <div className="api-docs-body">
        {menuOpen ?
          <button
            type="button"
            className={`api-docs-backdrop${menuVisible ? " is-open" : ""}`}
            aria-label="Close menu"
            onClick={closeMenu}
          />
        : null}

        <aside
          id="api-docs-sidebar"
          className={`api-docs-sidebar${menuVisible ? " is-open" : ""}`}
        >
          <div className="api-docs-sidebar-inner" onClick={closeMenu}>
            {sidebar}
          </div>
        </aside>

        <div className="api-docs-article-wrap">{children}</div>

        <aside className="api-docs-toc" aria-label="On this page">
          {toc}
        </aside>
      </div>
    </div>
  )
}

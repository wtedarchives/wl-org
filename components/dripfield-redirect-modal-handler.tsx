"use client"

import { useCallback, useEffect, useId, useState } from "react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  dismissDripfieldRedirectModal,
  hasDismissedDripfieldRedirectModal,
} from "@/lib/dripfield-redirect-modal-storage"

/* Ensure request-modal shell tokens exist when this opens outside a page that
   already imported the v2 stylesheet (handler lives in root Providers). */
import "@/components/wl-home-v2/wl-home-v2.css"
import "./dripfield-redirect-modal.css"

/**
 * When visitors arrive via dripfield.pro redirects (?from=dripfield), show a
 * one-time “we’ve moved” notice in the Request a Song modal shell, then strip
 * the query param.
 */
export function DripfieldRedirectModalHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const headingId = useId()
  const bodyId = useId()
  const [open, setOpen] = useState(false)

  useWlHomeV2ScrollLock(open)

  const stripFromParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (!params.has("from")) return
    params.delete("from")
    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname || "/"
    router.replace(url)
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (searchParams.get("from") !== "dripfield") return

    if (hasDismissedDripfieldRedirectModal()) {
      stripFromParam()
      return
    }

    setOpen(true)
  }, [searchParams, stripFromParam])

  const handleClose = useCallback(() => {
    dismissDripfieldRedirectModal()
    setOpen(false)
    stripFromParam()
  }, [stripFromParam])

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="dripfield-redirect-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--dripfield-redirect"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={bodyId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Dripfield.pro is now WTED Archives</h3>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body">
            <div id={bodyId} className="modal-dripfield-copy">
              <Image
                src="/wted-sa-cropped-2.png"
                alt="WTED Archives"
                width={110}
                height={110}
                className="modal-dripfield-logo-img"
              />
              <p>
                Dripfield.pro has a new home here on WTEDRadio.com, and has been
                rebranded to WTED Archives. All of the data, features, and
                functionality of Dripfield.pro has been brought over to WTED
                Archives, including your personal stats.
              </p>
              <p>
                Log in using your Wysteria Lane Community account, and we hope
                you enjoy this new era of WTED Radio!
              </p>
            </div>
            <div className="modal-dripfield-actions">
              <button
                type="button"
                className="wbtn green"
                onClick={handleClose}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}

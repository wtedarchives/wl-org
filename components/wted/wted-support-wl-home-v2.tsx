"use client"

import { createElement, useEffect } from "react"

import {
  WTED_SUPPORT_STRIPE_BUY_BUTTON_ID,
  WTED_SUPPORT_STRIPE_PRICING_TABLE_ID,
  WTED_SUPPORT_STRIPE_PUBLISHABLE_KEY,
} from "@/components/wted/wted-support-constants"

export function WtedSupportWlHomeV2() {
  useEffect(() => {
    const loadScript = (src: string) => {
      if (document.querySelector(`script[src="${src}"]`)) return
      const script = document.createElement("script")
      script.src = src
      script.async = true
      document.body.appendChild(script)
    }

    loadScript("https://js.stripe.com/v3/pricing-table.js")
    loadScript("https://js.stripe.com/v3/buy-button.js")
  }, [])

  return (
    <>
      <header className="wl-home-v2-page-lede flex justify-center">
        <div className="w-[min(100%,1280px)] min-w-0 text-start">
          <h1>Support WTED</h1>
          <div className="wl-home-v2-page-lede-body">
            <p>
              Thank you for choosing to support WTED and the Wysteria Lane
              community! You can choose a monthly gift or a one-time amount of
              your choosing below.
            </p>
            <p>
              Please note that these subscriptions and gifts are{" "}
              <strong>not tax deductible</strong> at this time. Additionally,
              creating a subscription here does not impact your account at the
              Wysteria Lane community; you can pick the method that works best
              for you! If you have questions, please reach out to{" "}
              <a href="mailto:wted@wtedradio.com">wted@wtedradio.com</a>.
            </p>
          </div>
        </div>
      </header>

      <section
        className="flex w-full min-w-0 flex-col items-center px-5 py-6 lg:px-7 lg:py-8"
        aria-label="Support options"
      >
        <div
          className="mb-6 h-px w-full shrink-0 bg-[var(--wl-orange)]"
          role="separator"
        />

        <div className="flex w-full max-w-full flex-col items-center gap-6">
          {createElement("stripe-pricing-table" as any, {
            "pricing-table-id": WTED_SUPPORT_STRIPE_PRICING_TABLE_ID,
            "publishable-key": WTED_SUPPORT_STRIPE_PUBLISHABLE_KEY,
            class: "w-full max-w-full self-center",
          })}
          {createElement("stripe-buy-button" as any, {
            "buy-button-id": WTED_SUPPORT_STRIPE_BUY_BUTTON_ID,
            "publishable-key": WTED_SUPPORT_STRIPE_PUBLISHABLE_KEY,
            class: "self-center",
          })}
        </div>
      </section>
    </>
  )
}

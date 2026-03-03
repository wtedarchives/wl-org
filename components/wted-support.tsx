"use client"

import { useEffect } from "react"

import { Separator } from "@/components/ui/separator"

const STRIPE_PUBLISHABLE_KEY =
  "pk_live_51No6yACzMQF2fsuo7ZgLtZKrvx8JM2aiGPn7v6W3oWOzS5ZehhZPc0N1ocirqEuv82BNaWIiY0xlyp8RtsfMH3G000IL1r0ZxO"

export function WtedSupport() {
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
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center text-wl-white">
            <h1 className="text-xl font-bold">Support WTED</h1>
          </div>

          <div className="mt-4 space-y-4 text-left text-sm leading-[1.25rem] text-wl-white">
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
              <a
                href="mailto:wted@wtedradio.com"
                className="font-medium text-wl-orange underline hover:text-wl-light-orange"
              >
                wted@wtedradio.com
              </a>
              .
            </p>
          </div>

          <Separator className="my-6 bg-wl-orange" />

          <div className="flex w-full flex-col items-center gap-6">
            <stripe-pricing-table
              pricing-table-id="prctbl_1NugUyCzMQF2fsuobAOsUi5S"
              publishable-key={STRIPE_PUBLISHABLE_KEY}
              class="w-full"
            />
            <stripe-buy-button
              buy-button-id="buy_btn_1NugdqCzMQF2fsuoRp2sFoxp"
              publishable-key={STRIPE_PUBLISHABLE_KEY}
              class="w-full"
            />
          </div>
        </div>
      </main>
    </div>
  )
}


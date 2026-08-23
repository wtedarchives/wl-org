"use client"

import type { ReactNode } from "react"

import { PersistentRadioRoot } from "@/components/persistent-radio"
import { Providers } from "@/components/providers"

/** Auth, toasts, and the in-app radio shell. Not used by `/embed/radio`. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <PersistentRadioRoot>{children}</PersistentRadioRoot>
    </Providers>
  )
}

"use client"

import { WlHomeV2 } from "@/components/wl-home-v2"

import { Goose101VerbatimClient } from "./goose101-verbatim-client"

export function WlHomeV2Goose101View() {
  return (
    <WlHomeV2>
      <Goose101VerbatimClient />
    </WlHomeV2>
  )
}

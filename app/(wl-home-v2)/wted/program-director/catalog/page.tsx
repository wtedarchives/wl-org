import type { Metadata } from "next"

import { WlHomeV2ProgramDirectorCatalogView } from "@/components/wted/wl-home-v2-program-director-catalog-view"

export const metadata: Metadata = {
  title: "Performance Catalog",
  description:
    "Performances chosen for WTED Goose Radio shows (catalog preview — full listing coming soon).",
}

export default function WtedProgramDirectorCatalogPage() {
  return <WlHomeV2ProgramDirectorCatalogView />
}

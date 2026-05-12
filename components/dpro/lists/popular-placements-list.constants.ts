import type { PlacementRow } from "@/hooks/use-popular-placements-data"

export type PopularPlacementsDataSlice = {
  showOpeners: PlacementRow[]
  setOpeners: PlacementRow[]
  setClosers: PlacementRow[]
  encores: PlacementRow[]
}

export type PopularPlacementSectionDef = {
  title: string
  slotTitle: string
  getItems: (d: PopularPlacementsDataSlice) => PlacementRow[]
}

export const POPULAR_PLACEMENT_SECTIONS = [
  {
    title: "Top Show Openers",
    slotTitle: "Show Openers",
    getItems: (d: PopularPlacementsDataSlice) => d.showOpeners,
  },
  {
    title: "Top Set Openers",
    slotTitle: "Set Openers",
    getItems: (d: PopularPlacementsDataSlice) => d.setOpeners,
  },
  {
    title: "Top Set Closers",
    slotTitle: "Set Closers",
    getItems: (d: PopularPlacementsDataSlice) => d.setClosers,
  },
  {
    title: "Top Encores",
    slotTitle: "Encores",
    getItems: (d: PopularPlacementsDataSlice) => d.encores,
  },
] as const satisfies readonly PopularPlacementSectionDef[]

export type PopularPlacementSection =
  (typeof POPULAR_PLACEMENT_SECTIONS)[number]

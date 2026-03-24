"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { VenueSearch } from "./venue-search"
import { VenueMap } from "./venue-map"
import {
  useVenuesData,
  type VenueSortField,
  type VenueSortDirection,
} from "@/hooks/use-venues-data"
import { useVenueMapData } from "@/hooks/use-venue-map-data"

const SORT_FIELDS: { field: VenueSortField; label: string }[] = [
  { field: "subvenue", label: "Venue" },
  { field: "subvenue_venue_location", label: "Location" },
  { field: "goose_show_count", label: "Goose" },
  { field: "other_show_count", label: "Other" },
]

export function VenuesContent() {
  const { openMobile } = useSidebar()
  const [sortField, setSortField] = useState<VenueSortField>("subvenue")
  const [sortDirection, setSortDirection] =
    useState<VenueSortDirection>("asc")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const { venues, loading: venuesLoading, progress, error } = useVenuesData(
    sortField,
    sortDirection,
  )
  const { loading: mapLoading, ...mapData } = useVenueMapData()
  const [mapChunkReady, setMapChunkReady] = useState(false)

  useEffect(() => {
    import("./venue-map-inner").then(() => setMapChunkReady(true))
  }, [])

  const loading = venuesLoading || mapLoading || !mapChunkReady

  useEffect(() => {
    document.title = "Venues – WysteriaLane.org"
    return () => {
      document.title = ""
    }
  }, [])

  const handleSort = (field: VenueSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: VenueSortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="size-3.5 shrink-0" />
    ) : (
      <ChevronDown className="size-3.5 shrink-0" />
    )
  }

  if (loading) {
    return (
      <LoadingPageCard
        message="Loading venues…"
        progress={progress}
      />
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            Trouble loading venues. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="mb-1 w-full">
        <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm py-0">
          <div className="bg-muted/60 px-3 py-1.5 flex justify-between items-center gap-2">
            <h1 className="text-sm font-semibold">Venues</h1>
            <VenueSearch onOpenChange={setIsSearchOpen} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-4 lg:flex-1 lg:min-w-0 order-2 lg:order-1">
          <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm py-0 flex-1 min-h-0">
            {venues.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No venues found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[50vh] lg:max-h-none">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      {SORT_FIELDS.map(({ field, label }) => (
                        <TableHead
                          key={field}
                          className={
                            field === "goose_show_count" ||
                            field === "other_show_count"
                              ? "text-center cursor-pointer hover:bg-muted"
                              : "cursor-pointer hover:bg-muted"
                          }
                          onClick={() => handleSort(field)}
                        >
                          <div
                            className={
                              "flex items-center gap-1 " +
                              (field === "goose_show_count" ||
                              field === "other_show_count"
                                ? "justify-center"
                                : "")
                            }
                          >
                            {field === "goose_show_count" ? (
                              <Image
                                src="/Goose2.png"
                                alt="Goose"
                                width={32}
                                height={32}
                                className="size-6 object-contain"
                              />
                            ) : (
                              label
                            )}
                            <SortIcon field={field} />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow
                        key={`${venue.subvenue}-${venue.venue_id}`}
                        className="hover:bg-muted/40"
                      >
                        <TableCell className="px-2 py-0.5 font-medium">
                          <Link
                            href={`/archive/venue/${venue.venue_id}`}
                            className="hover:underline"
                          >
                            {venue.subvenue}
                          </Link>
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-muted-foreground">
                          {venue.subvenue_venue_location}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-center">
                          {venue.goose_show_count}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-center">
                          {venue.other_show_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
        <div
          className={`relative lg:w-[50%] xl:w-[45%] shrink-0 order-1 lg:order-2 ${
            isSearchOpen || openMobile ? "hidden" : ""
          }`}
        >
          <VenueMap mapData={mapData} />
        </div>
      </div>
    </div>
  )
}

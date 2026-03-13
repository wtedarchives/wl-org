"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils/show-utils"
import type { ShowData, ShowChangeData } from "@/types/admin"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { ShowChangeModal } from "./show-change-modal"
import { getChangeTypeIcon } from "../setlist/setlist-show-change-icon"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 1000

export function AdminChanges() {
  const [shows, setShows] = useState<ShowData[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showChanges, setShowChanges] = useState<ShowChangeData[]>([])
  const [changesLoading, setChangesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null)
  const [selectedChange, setSelectedChange] = useState<ShowChangeData | null>(
    null
  )
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const [isNewChange, setIsNewChange] = useState(false)
  const showDataLoadedRef = useRef(false)

  const fetchShows = async () => {
    if (!supabase) return
    setLoading(true)
    setLoadingProgress(5)
    let allShowsData: ShowData[] = []
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await supabase
        .from("shows")
        .select(
          "show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid"
        )
        .order("show_date", { ascending: false })
        .order("show_canonid", { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (error) throw error
      if (data?.length) {
        allShowsData = [...allShowsData, ...data]
        page++
        setLoadingProgress(Math.min(95, 5 + page * 15))
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
    setShows(allShowsData ?? [])
    setLoadingProgress(100)
    setTimeout(() => setLoading(false), 300)
  }

  const fetchShowChanges = async (showId: string) => {
    if (!supabase) return
    setChangesLoading(true)
    try {
      const { data, error } = await supabase
        .from("show_changes")
        .select("show_change_uuid, show_id, change_order, change_type, change")
        .eq("show_id", showId)
        .order("change_order", { ascending: true })
      if (!error) setShowChanges(data ?? [])
    } catch {
      setShowChanges([])
    } finally {
      setChangesLoading(false)
    }
  }

  useEffect(() => {
    fetchShows()
  }, [])

  useEffect(() => {
    if (shows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true
      try {
        const stored = localStorage.getItem("adminSelectedShowId")
        if (stored) {
          const s = shows.find((x) => x.show_id === stored)
          if (s) {
            setSelectedShow(s)
            fetchShowChanges(stored)
          }
        }
      } catch {
        // silent
      }
    }
  }, [shows])

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "adminSelectedShowId" && e.newValue) {
        const s = shows.find((x) => x.show_id === e.newValue)
        if (s && (!selectedShow || selectedShow.show_id !== e.newValue)) {
          setSelectedShow(s)
          fetchShowChanges(e.newValue)
        }
      }
    }
    window.addEventListener("storage", h)
    return () => window.removeEventListener("storage", h)
  }, [selectedShow, shows])

  useEffect(() => {
    const h = () => {
      if (document.visibilityState === "visible") {
        try {
          const stored = localStorage.getItem("adminSelectedShowId")
          if (stored && (!selectedShow || selectedShow.show_id !== stored)) {
            const s = shows.find((x) => x.show_id === stored)
            if (s) {
              setSelectedShow(s)
              fetchShowChanges(stored)
            }
          } else if (selectedShow) {
            fetchShowChanges(selectedShow.show_id)
          }
        } catch {
          // silent
        }
      }
    }
    document.addEventListener("visibilitychange", h)
    return () => document.removeEventListener("visibilitychange", h)
  }, [selectedShow, shows])

  const filteredShows = useMemo(() => {
    return shows.filter((show) => {
      const formattedDate = formatDate(show.show_date)
      const canonid = show.show_canonid ? `[${show.show_canonid}]` : ""
      const display = `${formattedDate} ${canonid} [${show.show_group} — ${show.show_venue_location}]`
      return display.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [shows, searchTerm])

  const handleShowSelect = (show: { show_id: string }) => {
    const fullShow = shows.find((s) => s.show_id === show.show_id)
    if (!fullShow) return
    setSelectedShow(fullShow)
    fetchShowChanges(show.show_id)
    setIsDropdownOpen(false)
    setSearchTerm("")
    try {
      localStorage.setItem("adminSelectedShowId", show.show_id)
    } catch {
      // silent
    }
  }

  const handleChangeSelect = (change: ShowChangeData) => {
    setSelectedChange(change)
    setIsNewChange(false)
    setIsChangeModalOpen(true)
  }

  const handleCreateNewChange = () => {
    if (!selectedShow) return
    const newChange: ShowChangeData = {
      show_change_uuid: "",
      show_id: selectedShow.show_id,
      change_order:
        showChanges.length > 0
          ? Math.max(...showChanges.map((c) => c.change_order)) + 1
          : 1,
      change_type: "",
      change: "",
    }
    setSelectedChange(newChange)
    setIsNewChange(true)
    setIsChangeModalOpen(true)
  }

  const handleSaveChange = () => {
    if (selectedShow) fetchShowChanges(selectedShow.show_id)
    setIsChangeModalOpen(false)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Show Changes Management</h3>
        <AdminShowDropdown
          isOpen={isDropdownOpen}
          onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredShows={filteredShows}
          onShowSelect={handleShowSelect}
          loading={loading}
          loadingProgress={loadingProgress}
          selectedShow={selectedShow}
          triggerLabel="Show"
        />
      </div>
      {selectedShow && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">
                {formatDate(selectedShow.show_date)} [{selectedShow.show_group}]
              </h4>
              <div className="text-xs text-muted-foreground">
                {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNewChange}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {changesLoading ? (
            <div className="flex items-center justify-center gap-2 p-3">
              <div className="flex gap-2">
                <div className="size-3 animate-pulse rounded-lg bg-muted" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
              </div>
              <p className="ml-2 text-xs text-muted-foreground">
                Loading changes...
              </p>
            </div>
          ) : showChanges.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="py-1 text-center text-xs">Order</TableHead>
                    <TableHead className="py-1 text-center text-xs">Type</TableHead>
                    <TableHead className="py-1 text-center text-xs w-8" />
                    <TableHead className="py-1 text-left text-xs">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showChanges.map((change) => (
                    <TableRow
                      key={change.show_change_uuid}
                      className="cursor-pointer text-xs hover:bg-muted/50"
                      onClick={() => handleChangeSelect(change)}
                    >
                      <TableCell className="py-1 text-center">
                        {change.change_order}
                      </TableCell>
                      <TableCell className="py-1 text-center">
                        {change.change_type}
                      </TableCell>
                      <TableCell className="py-1 text-center">
                        {(() => {
                          const iconConfig = getChangeTypeIcon(change.change_type)
                          return iconConfig ? (
                            <iconConfig.Icon
                              className={`size-3.5 shrink-0 ${iconConfig.colorClass}`}
                            />
                          ) : null
                        })()}
                      </TableCell>
                      <TableCell className="py-1">
                        <div
                          className="[&_a]:font-medium"
                          dangerouslySetInnerHTML={{ __html: change.change }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
              No changes found for this show.
            </div>
          )}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
          Select a show to view its changes.
        </div>
      )}
      {loading && loadingProgress < 100 && !selectedShow && (
        <div className="flex h-56 flex-col items-center justify-center">
          <div className="flex gap-2">
            <div className="size-4 animate-pulse rounded-lg bg-muted" />
            <div className="size-4 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
            <div className="size-4 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Loading shows ({Math.round(loadingProgress)}%)
          </p>
        </div>
      )}
      <ShowChangeModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        change={selectedChange}
        onSave={handleSaveChange}
        isNewChange={isNewChange}
      />
    </div>
  )
}

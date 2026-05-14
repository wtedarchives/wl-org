"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Plus } from "lucide-react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { supabase } from "@/lib/supabase"
import type { ReleaseData } from "@/types/admin"
import { ReleaseModal } from "./release-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"

const PAGE_SIZE = 1000

export function AdminReleases() {
  const [releases, setReleases] = useState<ReleaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRelease, setSelectedRelease] = useState<ReleaseData | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddMode, setIsAddMode] = useState(false)

  const fetchReleases = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      let allReleasesData: ReleaseData[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from("releases")
          .select("*")
          .order("release_displayname", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error) throw error
        if (data && data.length > 0) {
          allReleasesData = [...allReleasesData, ...data]
          page++
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setReleases(allReleasesData || [])
    } catch (error) {
      console.error("Error fetching releases:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReleases()
  }, [fetchReleases])

  const handleReleaseClick = (release: ReleaseData) => {
    setSelectedRelease(release)
    setIsAddMode(false)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedRelease(null)
    setIsAddMode(true)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedRelease(null)
    setIsAddMode(false)
  }

  const handleModalSave = () => {
    fetchReleases()
    handleModalClose()
  }

  const filteredReleases = useMemo(() => {
    if (!searchQuery) return releases
    const query = searchQuery.toLowerCase()
    return releases.filter(
      (release) =>
        release.release_displayname.toLowerCase().includes(query) ||
        release.release.toLowerCase().includes(query) ||
        (release.release_service &&
          release.release_service.toLowerCase().includes(query))
    )
  }, [releases, searchQuery])

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Manage Releases">
        <div className="wl-home-v2-archive-admin-toolbar-search">
          <div className="wl-home-v2-archive-admin-toolbar-search__inner">
            <Input
              type="text"
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full min-w-0 text-xs focus-visible:ring-0"
            />
            <MagnifyingGlass
              className="wl-home-v2-archive-admin-toolbar-search__icon"
              aria-hidden
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddNew}
          className="wl-home-v2-tours-header-pill shrink-0 gap-1"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
          Add release
        </Button>
      </AdminTabToolbar>
      <p className="mb-2 text-xs text-muted-foreground">
        Click on any release to view and edit its details.
      </p>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex gap-2">
            <div className="size-4 animate-pulse rounded-full bg-muted" />
            <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
            <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Loading releases...
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px]">
          <Table className="set-table">
            <TableHeader>
              <TableRow>
                <TableHead className="py-1 text-left text-xs">Display Name</TableHead>
                <TableHead className="py-1 text-left text-xs">Service</TableHead>
                <TableHead className="py-1 text-left text-xs">Release</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReleases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-2 py-2 text-center text-xs text-muted-foreground"
                  >
                    {searchQuery
                      ? "No releases matching your search"
                      : "No releases found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReleases.map((release) => (
                  <TableRow
                    key={release.release_id}
                    className="cursor-pointer text-xs"
                    onClick={() => handleReleaseClick(release)}
                  >
                    <TableCell className="py-1">
                      {release.release_displayname}
                    </TableCell>
                    <TableCell className="py-1">
                      {release.release_service || "—"}
                    </TableCell>
                    <TableCell className="py-1">
                      {release.release}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <ReleaseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        release={selectedRelease}
        isAddMode={isAddMode}
      />
    </AdminTabShell>
  )
}

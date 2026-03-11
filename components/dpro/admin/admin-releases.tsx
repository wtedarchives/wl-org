"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, X, Plus } from "lucide-react"
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
    <div>
      <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-sm font-semibold">Manage Releases</h3>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:flex-initial">
            <Input
              type="text"
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full pl-8 pr-8 text-xs lg:w-48"
            />
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <Button variant="default" size="sm" onClick={handleAddNew} className="gap-1">
            <Plus className="size-4" />
            Add Release
          </Button>
        </div>
      </div>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Display Name</TableHead>
                <TableHead className="text-xs">Service</TableHead>
                <TableHead className="text-xs">Release</TableHead>
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
                    className="cursor-pointer text-[0.625rem] hover:bg-muted/50"
                    onClick={() => handleReleaseClick(release)}
                  >
                    <TableCell className="font-medium">
                      {release.release_displayname}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {release.release_service || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
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
    </div>
  )
}

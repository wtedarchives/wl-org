"use client"

import { useDiscographyEntriesPanel } from "@/hooks/use-discography-entries-panel"
import { DiscographyEntriesPanelLinksTable } from "./discography-entries-panel-links-table"
import { DiscographyEntriesPanelAddFromSetlist } from "./discography-entries-panel-add-from-setlist"

interface DiscographyEntriesPanelProps {
  discographyUuid: string
}

export function DiscographyEntriesPanel({
  discographyUuid,
}: DiscographyEntriesPanelProps) {
  const {
    links,
    loadingLinks,
    songByEntryId,
    orderDraft,
    setOrderDraft,
    panelError,
    deleteTarget,
    setDeleteTarget,
    deleting,
    saveOrder,
    handleDelete,
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    selectedShow,
    setlistEntries,
    loadingSetlist,
    selectedIds,
    adding,
    filteredShows,
    handleShowSelect,
    linkCountBySetlistEntry,
    nextOrderLabel,
    toggleSelected,
    handleAddSelected,
    allShowsLoading,
    loadingProgress,
  } = useDiscographyEntriesPanel(discographyUuid)

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 bg-muted/15">
      <h3 className="text-sm font-semibold">Setlist links</h3>
      <p className="min-w-0 hyphens-auto text-pretty text-[11px] leading-snug text-muted-foreground break-words">
        Link setlist lines to this release. Order controls display sequence.
        Duplicate song lines are allowed.
      </p>
      {panelError ? (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          {panelError}
        </div>
      ) : null}

      {loadingLinks ? (
        <p className="text-xs text-muted-foreground">Loading links…</p>
      ) : links.length === 0 ? (
        <p className="text-xs text-muted-foreground">No links yet.</p>
      ) : (
        <DiscographyEntriesPanelLinksTable
          links={links}
          songByEntryId={songByEntryId}
          orderDraft={orderDraft}
          setOrderDraft={setOrderDraft}
          saveOrder={saveOrder}
          deleteTarget={deleteTarget}
          setDeleteTarget={setDeleteTarget}
          deleting={deleting}
          handleDelete={handleDelete}
        />
      )}

      <DiscographyEntriesPanelAddFromSetlist
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredShows={filteredShows}
        onShowSelect={handleShowSelect}
        allShowsLoading={allShowsLoading}
        loadingProgress={loadingProgress}
        selectedShow={selectedShow}
        loadingSetlist={loadingSetlist}
        setlistEntries={setlistEntries}
        linkCountBySetlistEntry={linkCountBySetlistEntry}
        selectedIds={selectedIds}
        toggleSelected={toggleSelected}
        adding={adding}
        nextOrderLabel={nextOrderLabel}
        onAddSelected={handleAddSelected}
      />
    </div>
  )
}

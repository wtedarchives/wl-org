"use client"

import type { Dispatch, SetStateAction } from "react"
import type { DiscographyEntryLink } from "@/types/admin"
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

export interface DiscographyEntriesPanelLinksTableProps {
  links: DiscographyEntryLink[]
  songByEntryId: Record<string, string>
  orderDraft: Record<string, string>
  setOrderDraft: Dispatch<SetStateAction<Record<string, string>>>
  saveOrder: (linkUuid: string) => void | Promise<void>
  deleteTarget: string | null
  setDeleteTarget: (uuid: string | null) => void
  deleting: boolean
  handleDelete: (uuid: string) => void | Promise<void>
}

export function DiscographyEntriesPanelLinksTable({
  links,
  songByEntryId,
  orderDraft,
  setOrderDraft,
  saveOrder,
  deleteTarget,
  setDeleteTarget,
  deleting,
  handleDelete,
}: DiscographyEntriesPanelLinksTableProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-[10px] border border-border/80">
      <Table className="set-table min-w-[18rem]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-14 py-0.5 text-xs">Order</TableHead>
            <TableHead className="py-0.5 text-xs">Song</TableHead>
            <TableHead className="w-16 py-0.5 text-right text-xs">
              Delete
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.uuid}>
              <TableCell className="py-0.5">
                <Input
                  type="number"
                  className="h-6 w-14 px-1 py-0.5 text-xs tabular-nums leading-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={orderDraft[link.uuid] ?? ""}
                  onChange={(e) =>
                    setOrderDraft((d) => ({
                      ...d,
                      [link.uuid]: e.target.value,
                    }))
                  }
                  onBlur={() => void saveOrder(link.uuid)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap py-0.5 text-xs">
                {songByEntryId[link.setlist_entry] ?? "—"}
              </TableCell>
              <TableCell className="py-0.5 text-right">
                {deleteTarget === link.uuid ? (
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-[10px] px-1.5 py-0.5"
                      disabled={deleting}
                      onClick={() => void handleDelete(link.uuid)}
                    >
                      OK
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[10px] px-1.5 py-0.5"
                      onClick={() => setDeleteTarget(null)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-destructive px-1.5 py-0.5"
                    onClick={() => setDeleteTarget(link.uuid)}
                  >
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

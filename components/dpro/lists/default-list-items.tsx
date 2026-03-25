"use client"

import Link from "next/link"
import type { ListItem } from "@/hooks/use-list-ind-data"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"

interface DefaultListItemsProps {
  items: ListItem[]
  listCategory: string
}

export function DefaultListItems({
  items,
  listCategory,
}: DefaultListItemsProps) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        No items in this list
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/60">
      {items.map((item, index) => (
        <Link
          key={item.list_item_id}
          href={
            listCategory === "songs"
              ? `/archive/song/${item.list_item_id}`
              : getSetlistArchiveUrl(item.list_item_id)
          }
          className="block px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
        >
          <span className="text-muted-foreground mr-2">{index + 1}.</span>
          {item.list_item_name}
        </Link>
      ))}
    </div>
  )
}

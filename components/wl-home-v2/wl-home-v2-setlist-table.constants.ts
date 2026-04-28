/** Shared Radix Tooltip props for setlist thead + row tooltips (WL Home v2). */
export const SETLIST_HEADER_TOOLTIP_CONTENT = {
  side: "bottom" as const,
  sideOffset: 6,
}

/** Portaled row tooltips (Song stats, WTED, Last, personnel): same panel as `setlist-header-tooltip`. */
export const SETLIST_V2_ROW_TOOLTIP_CONTENT = {
  className: "setlist-header-tooltip",
  side: "top" as const,
  sideOffset: 6,
} as const

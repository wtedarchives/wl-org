import type { SetlistEntry } from "@/types/setlist"

import type { ShareExportRow as SharedShareExportRow } from "@/supabase/functions/_shared/setlist-share-card/set-grouping"

/** The shared row type bound to the app's full entry shape. */
export type ShareExportRow = SharedShareExportRow<SetlistEntry>

export type {
  ShareExportDetailPill,
  ShareExportDetailPillLine,
} from "@/supabase/functions/_shared/setlist-share-card/show-details"

export { buildShareExportDetailPills } from "@/supabase/functions/_shared/setlist-share-card/show-details"

export { buildShareExportRows } from "@/supabase/functions/_shared/setlist-share-card/set-grouping"


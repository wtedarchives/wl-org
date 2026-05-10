import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import { getListArchiveUrl } from "@/lib/list-archive-url"

export const LISTS_ARCHIVE_BREADCRUMBS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Lists", href: "/archive/lists" },
]

export function getListsArchiveDetailBreadcrumbs(
  listName: string,
  listId: string,
): BreadcrumbItem[] {
  return [
    ...LISTS_ARCHIVE_BREADCRUMBS,
    { label: listName, href: getListArchiveUrl(listId) },
  ]
}


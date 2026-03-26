"use client"

import { useMemo } from "react"
import { notFound, useSearchParams } from "next/navigation"
import { ListIndContent } from "@/components/dpro/lists/list-ind-content"
import { ListsContent } from "@/components/dpro/lists/lists-content"

const LIST_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveListIdFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
): { listId: string; invalidParams: boolean } {
  const idList = searchParams
    .getAll("id")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(idList).size > 1) {
    return { listId: "", invalidParams: true }
  }
  return { listId: idList[0] ?? "", invalidParams: false }
}

export default function ListsArchivePageClient() {
  const searchParams = useSearchParams()
  const { listId, invalidParams } = useMemo(
    () => resolveListIdFromSearchParams(searchParams),
    [searchParams],
  )

  if (invalidParams) notFound()

  if (listId) {
    if (!LIST_ID_RE.test(listId)) notFound()
    return <ListIndContent listId={listId} />
  }

  return <ListsContent />
}

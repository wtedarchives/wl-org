"use client"

import { QueryClient } from "@tanstack/react-query"

import { ARCHIVE_QUERY_STALE_MS } from "@/lib/archive-query-keys"

export function createArchiveQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ARCHIVE_QUERY_STALE_MS,
        refetchOnWindowFocus: false,
      },
    },
  })
}

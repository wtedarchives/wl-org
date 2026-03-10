"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface ListIndData {
  list_id: string
  list_name: string
  list_description: string | null
  list_category: string
  list_order: number
  list_type: string | null
}

export interface ListItem {
  list_item_id: string
  list_item_name: string
  list_item_order: number
}

export function useListIndData(listId: string | undefined) {
  const [list, setList] = useState<ListIndData | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!listId || !client) {
      setLoading(false)
      return
    }

    async function fetchData(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        const { data: listData, error: listError } = await sb
          .from("lists")
          .select("list_id, list_name, list_description, list_category, list_order, list_type")
          .eq("list_id", listId)
          .single()

        if (listError) throw listError
        if (!listData) {
          setList(null)
          setLoading(false)
          return
        }

        setList({
          list_id: listData.list_id,
          list_name: listData.list_name,
          list_description: listData.list_description ?? null,
          list_category: listData.list_category,
          list_order: listData.list_order,
          list_type: (listData as { list_type?: string }).list_type ?? null,
        })

        const listType = (listData as { list_type?: string }).list_type
        if (listType === "default" || !listType) {
          const { data: itemsData, error: itemsError } = await sb
            .from("list_items")
            .select("list_item_id, list_item_name, list_item_order")
            .eq("list_id", listId)
            .order("list_item_order", { ascending: true })

          if (itemsError) {
            if (itemsError.code === "42P01") {
              setItems([])
            } else {
              throw itemsError
            }
          } else {
            setItems((itemsData as ListItem[]) ?? [])
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load list")
        setList(null)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchData(client)
  }, [listId])

  return { list, items, loading, error }
}

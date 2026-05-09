"use client"

import { useMemo } from "react"
import type { WysteriaSession } from "@/lib/jwt"

export interface UseAdminStatusResult {
  isAdmin: boolean
  loading: boolean
}

/**
 * Admin flag from the Wysteria JWT (`is_admin` claim), same source as `AuthContext.isAdmin`.
 * No Supabase `user_roles` fetch — matches the SSO auth flow and avoids redirect races.
 */
export function useAdminStatus(session: WysteriaSession | null): UseAdminStatusResult {
  return useMemo(
    () => ({
      isAdmin: session?.isAdmin ?? false,
      loading: false,
    }),
    [session]
  )
}

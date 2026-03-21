import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client for build-time data fetching (generateStaticParams).
 * Uses NEXT_PUBLIC_ vars which are available at build time.
 */
export function createBuildSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

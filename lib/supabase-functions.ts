/**
 * Base URL for Supabase Edge Functions.
 * Supabase injects functions at {SUPABASE_URL}/functions/v1/{function-name}
 */
export function getSupabaseFunctionsUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return ""
  return `${url.replace(/\/$/, "")}/functions/v1`
}

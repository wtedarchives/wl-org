/**
 * Public read API base URL for docs and client examples.
 */
export function getBotReadApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    return "https://your-project.supabase.co/functions/v1/bot-read-api"
  }
  return `${url.replace(/\/$/, "")}/functions/v1/bot-read-api`
}

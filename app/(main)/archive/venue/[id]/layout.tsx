import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("venues").select("venue_id")
  return (data ?? []).map((r) => ({ id: r.venue_id }))
}

export default function VenueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

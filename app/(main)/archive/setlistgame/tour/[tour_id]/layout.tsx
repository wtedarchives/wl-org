import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("tours").select("tour_id")
  return (data ?? []).map((r) => ({ tour_id: r.tour_id }))
}

export default function SetlistGameTourLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

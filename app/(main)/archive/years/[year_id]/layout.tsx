import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("years").select("year_id")
  return (data ?? []).map((r) => ({ year_id: r.year_id }))
}

export default function YearLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

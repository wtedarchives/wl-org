import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("shows").select("show_id")
  return (data ?? []).map((r) => ({ show_id: r.show_id }))
}

export default function SetlistGameShowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

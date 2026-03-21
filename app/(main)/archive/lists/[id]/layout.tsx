import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("lists").select("list_id")
  return (data ?? []).map((r) => ({ id: r.list_id }))
}

export default function ListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

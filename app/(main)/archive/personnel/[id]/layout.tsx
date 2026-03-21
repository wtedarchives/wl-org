import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("guests").select("guest_id")
  return (data ?? []).map((r) => ({ id: r.guest_id }))
}

export default function PersonnelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

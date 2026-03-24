import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("discography").select("uuid")
  return (data ?? []).map((r) => ({ id: r.uuid }))
}

export default function DiscographyReleaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

import { createBuildSupabaseClient } from "@/lib/build-supabase"

export async function generateStaticParams() {
  const supabase = createBuildSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from("songs").select("song_id")
  return (data ?? []).map((r) => ({ id: r.song_id }))
}

export default function SongLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

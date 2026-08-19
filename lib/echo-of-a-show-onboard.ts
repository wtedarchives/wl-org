import { supabase } from "@/lib/supabase"

export type EchoLastWinner = {
  username: string
  score: number
  closer: boolean
  players: number
}

export async function fetchEchoLastWinner(
  showId: string,
): Promise<EchoLastWinner | null> {
  if (!supabase) return null
  const [{ data: top }, { count }] = await Promise.all([
    supabase
      .from("setlist_game_submissions")
      .select("user_id, score, submission_id")
      .eq("show_id", showId)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("setlist_game_submissions")
      .select("*", { count: "exact", head: true })
      .eq("show_id", showId),
  ])
  if (!top?.user_id) return null
  const [{ data: profile }, { data: closerRow }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", top.user_id).maybeSingle(),
    supabase
      .from("setlist_game_picks")
      .select("showcloser_correct")
      .eq("submission_id", top.submission_id)
      .eq("showcloser_correct", true)
      .limit(1)
      .maybeSingle(),
  ])
  return {
    username: (profile?.username as string | undefined) ?? "Player",
    score: top.score ?? 0,
    closer: Boolean(closerRow),
    players: count ?? 0,
  }
}

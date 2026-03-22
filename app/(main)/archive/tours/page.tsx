import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"

const DEFAULT_TOUR_NAME = "2026 Misc"

export default async function DproToursPage() {
  if (!supabase) {
    redirect("/archive")
  }
  const { data: tour } = await supabase
    .from("tours")
    .select("tour_id")
    .eq("tour", DEFAULT_TOUR_NAME)
    .single()

  if (tour?.tour_id) {
    redirect(`/archive/tours/${tour.tour_id}`)
  }

  redirect("/archive")
}

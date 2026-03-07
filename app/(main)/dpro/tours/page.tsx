import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"

const DEFAULT_TOUR_NAME = "2025 Holiday Run"

export default async function DproToursPage() {
  if (!supabase) {
    redirect("/dpro")
  }
  const { data: tour } = await supabase
    .from("tours")
    .select("tour_id")
    .eq("tour", DEFAULT_TOUR_NAME)
    .single()

  if (tour?.tour_id) {
    redirect(`/dpro/tours/${tour.tour_id}`)
  }

  redirect("/dpro")
}

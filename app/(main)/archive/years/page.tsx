import { redirect } from "next/navigation"

const DEFAULT_YEAR_ID = "4ca4a7dd-19c5-45af-ab9b-6f7e20f4b445"

export default function DproYearsPage() {
  redirect(`/archive/years/${DEFAULT_YEAR_ID}`)
}

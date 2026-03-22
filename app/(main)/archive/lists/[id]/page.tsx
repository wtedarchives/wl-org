import { Suspense } from "react"
import { ListIndContent } from "@/components/dpro/lists/list-ind-content"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return {
    title: "List – WysteriaLane.org",
  }
}

export default async function ListIndPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense fallback={<LoadingPageCard message="Loading list…" />}>
      <ListIndContent listId={id} />
    </Suspense>
  )
}

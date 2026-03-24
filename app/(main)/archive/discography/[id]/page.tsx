"use client"

import { use, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useDiscographyReleaseData } from "@/hooks/use-discography-release-data"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function formatReleaseDate(iso: string | null): string | null {
  if (!iso) return null
  const parts = iso.split("-").map(Number)
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return iso
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function DiscographyReleasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const { release, loading, error } = useDiscographyReleaseData(id)

  const title = release?.displayname ?? ""

  useEffect(() => {
    if (!release) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs([
      { label: "Setlist Archive", href: "/archive" },
      { label: "Discography", href: "/archive/discography" },
      { label: release.displayname, href: "" },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [release, setSetlistBreadcrumbs])

  useEffect(() => {
    if (release) {
      document.title = `${release.displayname} – WysteriaLane.org`
      return () => {
        document.title = ""
      }
    }
  }, [release])

  if (!id) notFound()

  if (loading) {
    return (
      <LoadingPageCard
        message={title ? `Loading ${title}…` : undefined}
        page="discography"
      />
    )
  }

  if (error || !release) {
    notFound()
  }

  const releaseDateLabel = formatReleaseDate(release.release_date)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {release.artwork ? (
          <div className="mx-auto w-full max-w-[240px] shrink-0 sm:mx-0">
            <div className="overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm transition-all duration-200 ease-out">
              <Image
                src={release.artwork}
                alt={release.displayname}
                width={480}
                height={480}
                className="aspect-square w-full object-cover"
                unoptimized
              />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {release.displayname}
            </h1>
            {release.artist ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {release.artist}
              </p>
            ) : null}
          </div>

          <Separator />

          <dl className="grid gap-2 text-sm">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium text-foreground">{release.category}</dd>
            </div>
            {releaseDateLabel ? (
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-muted-foreground">Release date</dt>
                <dd className="font-medium text-foreground">
                  {releaseDateLabel}
                </dd>
              </div>
            ) : null}
          </dl>

          <Link
            href="/archive/discography"
            className="inline-flex text-sm font-medium text-primary transition-colors duration-200 hover:underline"
          >
            ← All discography
          </Link>
        </div>
      </div>

      {release.name && release.name !== release.displayname ? (
        <Card className="border-border/60 bg-card/80 py-0">
          <CardContent className="py-3 px-4 text-xs text-muted-foreground">
            Also listed as{" "}
            <span className="font-medium text-foreground">{release.name}</span>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

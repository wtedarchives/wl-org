"use client"

import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SHOWS_ENTRIES,
  SHOWS_INTRO,
  type ShowEntry,
} from "@/app/(main)/wted/shows/content"

function ShowCard({ show }: { show: ShowEntry }) {
  return (
    <Card className="border-0 bg-wl-dark-grey text-wl-white ring-0 transition-all duration-200 hover:scale-[1.02] hover:bg-wl-dark-grey/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{show.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p
          className="text-left text-sm leading-[1rem] text-wl-white/95 [&_a]:font-medium [&_a]:text-wl-orange [&_a]:underline [&_a]:hover:text-wl-light-orange"
          dangerouslySetInnerHTML={{ __html: show.description }}
        />
      </CardContent>
    </Card>
  )
}

export function WtedShows() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center text-wl-white">
            <h1 className="text-xl font-bold">{SHOWS_INTRO.title}</h1>
          </div>
          <div className="mt-4 space-y-4 text-left text-wl-white leading-[1.25rem]">
            <p>
              WTED Goose Radio features a slate of regularly occurring shows and
              features that cover a wide range of topics and experiences, all
              curated for your listening pleasure. You can check out the schedule
              of shows on our homepage or in our iOS and Android apps and plan to
              tune in.
            </p>
            <p>
              Have an idea or want to contribute to a show? Become a GORP (Goose
              Obsessed Radio Personality) over at the{" "}
              <Link
                href={SHOWS_INTRO.communityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-wl-orange underline hover:text-wl-light-orange"
              >
                {SHOWS_INTRO.communityLabel}
              </Link>
              !
            </p>
          </div>

          <Separator className="my-6 bg-wl-orange" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWS_ENTRIES.map((show) => (
              <ShowCard key={show.title} show={show} />
            ))}
          </div>

          <Separator className="my-6 bg-wl-orange" />

          <section className="text-left text-wl-white">
            <h2 className="mb-3 text-center text-lg font-semibold">
              Other Features
            </h2>
            <div className="space-y-4 leading-[1.25rem]">
              <p>
                Check the schedule on the homepage or in the app and tune in
                regularly to hear curated playlists featuring seasonal tour
                mixes, highlights from special tours like Taboose,
                listener-curated special shows, events and partnerships with
                friends of WTED, and more. The limits of WTED are driven only by
                the creativity of listeners like you.
              </p>
              <p>
                If you have an idea, want to contribute, or simply wish to
                express your unbridled enthusiasm for WTED, join us over at the{" "}
                <Link
                  href={SHOWS_INTRO.communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  {SHOWS_INTRO.communityLabel}
                </Link>
                !
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

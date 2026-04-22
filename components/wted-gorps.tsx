"use client"

import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { GORPS_ENTRIES, GORPS_INTRO, type GorpEntry } from "@/components/wted/wted-gorps-content"

function GorpCard({ entry }: { entry: GorpEntry }) {
  const firstName = entry.name.split(/\s+/)[0] ?? entry.name

  return (
    <Card className="border-0 bg-wl-dark-grey/90 text-wl-white ring-0">
      <CardContent>
        {/* Image floats so all content (name + bio + quote) wraps around it */}
        <img
          src={entry.image.src}
          alt={entry.image.alt}
          className="float-right mb-2 ml-4 h-auto w-36 rounded-lg object-cover shadow-xl transition-transform duration-300 hover:scale-105"
        />
        <h2 className="pb-2 text-left text-lg font-semibold leading-[1.25rem] text-wl-white sm:text-center">
          {entry.name}
        </h2>
        <div className="space-y-2 text-sm font-normal leading-[1.125rem] [&_a]:font-medium [&_a]:text-wl-orange [&_a]:underline [&_a]:hover:text-wl-light-orange">
          {entry.bio.map((p, i) => (
            <p
              key={i}
              className="text-wl-white"
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
          {entry.bullets?.length ? (
            <ul className="list-disc list-outside space-y-1 pl-5 text-wl-white">
              {entry.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="mt-3 font-medium text-wl-white">{firstName} says:</p>
        <blockquote className="mt-2 flex overflow-hidden rounded-lg">
          <div
            className="w-1 shrink-0 rounded-l-lg bg-wl-orange"
            aria-hidden
          />
          <div className="flex-1 rounded-r-lg bg-wl-orange/20 px-4 py-2 text-xs text-wl-white">
            {entry.quote.split("\n\n").map((para, i) => (
              <p key={i} className={i > 0 ? "mt-2" : ""}>
                {para}
              </p>
            ))}
          </div>
        </blockquote>
        <div className="clear-both" />
      </CardContent>
    </Card>
  )
}

export function WtedGorps() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center text-wl-white">
            <h1 className="text-xl font-bold">{GORPS_INTRO.title}</h1>
          </div>
          <p className="mt-4 text-left text-sm leading-[1.25rem] text-wl-white">
            Our community of contributors is part of what makes WTED Goose Radio
            a great source of detailed history, background, and trivia
            surrounding some of the best Goose performances in their catalog.
            Our Goose Jockeys and GORPs are featured so you can learn more about
            their background and history with the band below. Want to join
            their ranks? Join the{" "}
            <Link
              href={GORPS_INTRO.communityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-wl-orange underline hover:text-wl-light-orange"
            >
              {GORPS_INTRO.communityLabel}
            </Link>
            !
          </p>

          <Separator className="my-6 bg-wl-orange" />

          <div className="flex flex-col gap-6">
            {GORPS_ENTRIES.map((entry) => (
              <GorpCard key={entry.name} entry={entry} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { LineSegments, PencilSimple } from "@phosphor-icons/react"
import {
  BarChart3,
  BookOpen,
  Calendar,
  Disc3,
  ListMusic,
  MapPin,
  Music,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ARCHIVE_ENTRIES,
  ARCHIVE_INTRO,
  type ArchiveEntry,
} from "@/app/(main)/old/archive/content"

const ARCHIVE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  BookOpen,
  Calendar,
  Disc3,
  LineSegments,
  ListMusic,
  MapPin,
  Music,
  PencilSimple,
  Trophy,
  UserCircle,
  Users,
}

function ArchiveCard({ entry }: { entry: ArchiveEntry }) {
  const Icon = ARCHIVE_ICONS[entry.icon]
  return (
    <Link href={entry.href} className="block h-full">
      <Card className="h-full border-0 bg-wl-dark-grey text-wl-white ring-0 transition-all duration-200 hover:scale-[1.02] hover:bg-wl-dark-grey/90">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            {Icon ? <Icon className="size-5 shrink-0 text-wl-orange" /> : null}
            {entry.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-left text-sm leading-[1.25rem] text-wl-white/95">
            {entry.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ArchiveLanding() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center text-wl-white">
            <h1 className="text-xl font-bold">{ARCHIVE_INTRO.title}</h1>
          </div>
          <div className="mt-4 space-y-4 text-left text-wl-white leading-[1.25rem]">
            <p>{ARCHIVE_INTRO.description}</p>
          </div>

          <Separator className="my-6 bg-wl-orange" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ARCHIVE_ENTRIES.map((entry) => (
              <ArchiveCard key={entry.title} entry={entry} />
            ))}
          </div>

          <Separator className="my-6 bg-wl-orange" />

          <section className="text-left text-wl-white">
            <h2 className="mb-3 text-center text-lg font-semibold">
              Submit & Contribute
            </h2>
            <div className="space-y-4 leading-[1.25rem]">
              <p>
                Have setlist corrections, new shows, or other archive data to
                contribute? Use our{" "}
                <Link
                  href="/archive/submit"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  Submit
                </Link>{" "}
                form to help keep the archive accurate and up to date.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

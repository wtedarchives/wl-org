"use client"

import Image from "next/image"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

const FEATURED_TOPICS = [
  {
    src: "/featured-1.jpg",
    topic: "April Tour 2026 GORP Signup",
    href: "https://community.wysterialane.org/t/april-tour-2026-gorp-signup/5352/1",
  },
  {
    src: "/featured-2.png",
    topic: "3/28/26 - Jam In The Streets - Athens, GA",
    href: "https://community.wysterialane.org/t/3-28-26-jam-in-the-streets-athens-ga/5254",
  },
  {
    src: "/featured-3.jpeg",
    topic: "Wysteria Lane Run Club",
    href: "https://community.wysterialane.org/t/wysteria-lane-run-club/3367",
  },
  {
    src: "/featured-4.jpeg",
    topic: "Roll Call: Nice to Meet You",
    href: "https://community.wysterialane.org/t/roll-call-nice-to-meet-you/172",
  },
] as const

const cardClassName =
  "rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 py-0 text-xs shadow-sm ring-0"

export function FeaturedTopicsCard() {
  return (
    <Card className={cardClassName}>
      <CardHeader className="border-b border-wl-dark-grey/50 py-2">
        <CardTitle className="text-[13px] font-semibold text-wl-white">
          Featured Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 [&_[data-slot=table-container]]:overflow-visible">
        <Table className="w-full min-w-0 table-fixed text-[11px] [&_tr:last-child_td]:pb-2">
          <TableBody>
            {FEATURED_TOPICS.map((item, index) => (
              <TableRow
                key={index}
                className="border-wl-dark-grey/50 hover:bg-wl-dark-grey/30"
              >
                <TableCell className="w-[66px] pl-2 pr-2 py-1 align-middle">
                  <div className="relative h-14 w-14 overflow-hidden rounded">
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover object-center"
                    />
                  </div>
                </TableCell>
                <TableCell className="min-w-0 pl-2 pr-2 py-1 align-middle whitespace-normal">
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words text-[12px] font-semibold text-wl-white hover:underline leading-3"
                    title={item.topic}
                  >
                    {item.topic}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

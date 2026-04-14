"use client"

import Image from "next/image"
import Link from "next/link"

import { MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { useDiscourseFeaturedTopics } from "@/hooks/use-discourse-featured-topics"
import { decodeHtmlEntitiesForDisplay } from "@/lib/decode-html-entities"
import { cn } from "@/lib/utils"

function FeaturedTopicsSkeleton({ isAccordion }: { isAccordion: boolean }) {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <TableRow key={i} className="border-wl-dark-grey/40">
          <TableCell className="w-[66px] pl-2 pr-2 py-1 align-middle">
            <Skeleton
              className={cn(
                "h-14 w-14",
                isAccordion ? "rounded-none" : "rounded",
              )}
            />
          </TableCell>
          <TableCell className="min-w-0 pl-2 pr-2 py-1 align-middle">
            <div className="flex min-w-0 flex-col gap-1">
              <Skeleton className="h-4 w-full max-w-[220px]" />
              <Skeleton className="h-3 w-full max-w-[160px]" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function FeaturedTopicsCard({
  variant = "default",
}: {
  variant?: "default" | "accordion"
}) {
  const isAccordion = variant === "accordion"
  const { topics, loading, error } = useDiscourseFeaturedTopics()

  return (
    <Card
      className={cn(
        "bg-[#844b45] py-0 text-xs shadow-sm ring-0 border border-wl-dark-grey/50",
        isAccordion ? "rounded-none border-0 shadow-none" : "rounded-xl",
      )}
    >
      {!isAccordion ? (
        <CardHeader className="border-b border-wl-dark-grey/50 py-2 bg-[#b2655e]">
          <div className="flex flex-row items-center justify-between gap-2 min-w-0">
            <CardTitle className="shrink-0 text-[13px] font-semibold text-wl-white">
              Featured Topics
            </CardTitle>
            <MessageCircle className="size-4 shrink-0 text-wl-white/80" />
          </div>
        </CardHeader>
      ) : null}
      <CardContent className="p-0 [&_[data-slot=table-container]]:overflow-visible">
        <Table
          className={cn(
            "w-full min-w-0 table-fixed text-[11px] [&_tr:last-child_td]:pb-2",
            "transition-opacity duration-200 ease-out",
            loading ? "opacity-90" : "opacity-100",
          )}
        >
          <TableBody>
            {loading ? (
              <FeaturedTopicsSkeleton isAccordion={isAccordion} />
            ) : error && topics.length === 0 ? (
              <TableRow className="border-wl-dark-grey/40 hover:bg-transparent">
                <TableCell
                  colSpan={2}
                  className="px-3 py-4 text-center text-[12px] text-wl-white/90"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : topics.length === 0 ? (
              <TableRow className="border-wl-dark-grey/40 hover:bg-transparent">
                <TableCell
                  colSpan={2}
                  className="px-3 py-4 text-center text-[12px] text-wl-white/85"
                >
                  No featured topics right now.
                </TableCell>
              </TableRow>
            ) : (
              topics.map((item) => {
                const remote = /^https?:\/\//i.test(item.src)
                return (
                  <TableRow
                    key={item.id}
                    className="border-wl-dark-grey/40 hover:bg-[#b2655e]"
                  >
                    <TableCell className="w-[66px] pl-2 pr-2 py-1 align-middle">
                      <div
                        className={cn(
                          "relative h-14 w-14 overflow-hidden",
                          isAccordion ? "rounded-none" : "rounded",
                        )}
                      >
                        <Image
                          src={item.src}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover object-center"
                          unoptimized={remote}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 pl-2 pr-2 py-1 align-middle whitespace-normal">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <Link
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-words text-[12px] font-semibold text-wl-white hover:underline leading-3"
                          title={decodeHtmlEntitiesForDisplay(item.topic)}
                        >
                          {decodeHtmlEntitiesForDisplay(item.topic)}
                        </Link>
                        <span className="text-[11px] text-wl-white/80">
                          {item.posts_count}{" "}
                          {item.posts_count === 1 ? "post" : "posts"}
                          {" · "}
                          {item.views.toLocaleString()}{" "}
                          {item.views === 1 ? "view" : "views"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

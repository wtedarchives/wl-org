"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  getStatHeaderClassName,
  getStatHeaderHoverColor,
  formatTimeInterval,
  copyStatsToClipboard,
} from "@/lib/utils/user-stats-utils"
import type { StatData } from "@/types/user-stats"

interface ProfileStatBoxProps {
  stat: StatData
  showCopyButton?: boolean
}

export function ProfileStatBox({ stat, showCopyButton = true }: ProfileStatBoxProps) {
  const [isCopied, setIsCopied] = useState(false)
  const {
    type,
    title,
    data,
    loading,
    countKey = "play_count",
    showDate = false,
    showLength = false,
    songNameKey = "song",
    songIdKey = "song_id",
  } = stat

  const handleCopy = () => {
    copyStatsToClipboard(
      data as unknown as Record<string, unknown>[],
      songNameKey,
      countKey,
      !!showLength,
      title,
      type
    )
    setIsCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setIsCopied(false), 2000)
  }

  const headerClassName = getStatHeaderClassName(type)
  const headerHoverColor = getStatHeaderHoverColor(type)

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader
        className={`flex flex-row items-center justify-between gap-2 ${headerClassName}`}
      >
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {!loading && data.length > 0 && showCopyButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 -mr-1 rounded-md opacity-90 transition-colors hover:!bg-white focus-visible:ring-2 focus-visible:ring-white/50 [&:hover_svg]:!text-[var(--copy-hover)]"
            style={
              {
                "--copy-hover": headerHoverColor,
              } as React.CSSProperties
            }
            onClick={handleCopy}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
          >
            {isCopied ? (
              <Check className="size-3.5 text-green-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No data available
          </div>
        ) : (
          <Table>
            <TableBody>
              {data.map((item, index) => {
                const rec = item as unknown as Record<string, unknown>
                const songName = rec[songNameKey] as string
                const songId = rec[songIdKey] as string
                const countVal = rec[countKey]
                const displayValue = showLength
                  ? formatTimeInterval((rec.length as string) ?? "")
                  : String(countVal)
                const categoryArtwork = rec.category_artwork as string | undefined
                const showDateVal = rec.show_date as string | undefined
                const showId = rec.show_id as string | undefined

                return (
                  <TableRow key={index}>
                    <TableCell className="align-middle py-0.5 pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/archive/song/${songId}`}
                            className="text-xs font-medium text-foreground underline-offset-4 hover:underline mr-2"
                          >
                            {songName}
                          </Link>
                          {showDate && showDateVal && showId && (
                            <>
                              {" "}
                              <Link
                                href={`/archive/setlist/${showId}`}
                                className="text-[10px] text-muted-foreground underline-offset-4 hover:underline"
                              >
                                [{showDateVal}]
                              </Link>
                            </>
                          )}
                        </div>
                        {categoryArtwork && (
                          <Image
                            src={categoryArtwork}
                            alt=""
                            width={16}
                            height={16}
                            className="size-5 shrink-0 rounded object-cover border border-border"
                            unoptimized
                            onError={(e) => {
                              const el = e.target as HTMLImageElement
                              if (el) el.style.display = "none"
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`align-middle py-1.5 text-center text-xs font-medium tabular-nums ${
                        showLength ? "w-[50px] pl-2" : "w-[30px]"
                      }`}
                    >
                      {displayValue}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

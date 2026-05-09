"use client"

import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SetlistGameRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetlistGameRulesDialog({
  open,
  onOpenChange,
}: SetlistGameRulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>Setlist Game Rules</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Scoring System</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-green-700">+2 points</span> for
                correctly picking a <span className="font-medium">song</span>.
                <span className="block pl-4 text-[11px]">
                  If you pick Arcadia, and it was played at any point during the
                  show, +2 points.
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700">+2 points</span> for
                correctly picking a <span className="font-medium">song</span> in
                the correct <span className="font-medium">set</span>.
                <span className="block pl-4 text-[11px]">
                  If you pick Arcadia to be played in Set 1, and it was played
                  during Set 1, +2 points. If it was played in Set 2 or the
                  Encore, no points.
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700">+3 points</span> for
                correctly picking a <span className="font-medium">song</span> in
                the correct <span className="font-medium">spot</span> in the
                correct <span className="font-medium">set</span>.
                <span className="block pl-4 text-[11px]">
                  If you pick Arcadia to be played as the third song in Set 1,
                  and it was played in that exact spot, +3 points.
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700">+2 points</span> for
                correctly picking a <span className="font-medium">song</span> as
                a <span className="font-medium">set opener</span> or{" "}
                <span className="font-medium">set closer</span>.
                <span className="block pl-4 text-[11px]">
                  If you pick Arcadia to be played as Set 1 Opener, and it opened
                  any non-encore set, +2 points.
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700">+3 points</span> for
                correctly picking a <span className="font-medium">song</span> as
                a <span className="font-medium">set opener</span> or{" "}
                <span className="font-medium">set closer</span> in the correct{" "}
                <span className="font-medium">set</span>.
                <span className="block pl-4 text-[11px]">
                  If you pick Arcadia to be played as Set 1 Opener, and it opened
                  Set 1, +3 points.
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700">+3 points</span> for
                correctly picking the <span className="font-medium">final song</span>{" "}
                of the show, known as a show closer.
                <span className="block pl-4 text-[11px]">
                  If you pick Arcadia to close the show, and it&apos;s played as
                  such, +3 points.
                </span>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <h4 className="font-medium mb-2">Penalties</h4>
            <div className="text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-red-700">-3 points</span> for
                every <span className="font-medium">extra song</span> you pick for
                a show.
                <span className="block pl-4 text-[11px]">
                  If you pick 14 songs, and the band only plays 12, six points
                  will be deducted.
                </span>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <h4 className="font-medium mb-2">Guidelines</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
              <li>
                Users can select one setlist per show, including up to five
                regular sets and three encore sets, with an infinite amount of
                songs per set.
              </li>
              <li>
                Users can select the same song only once per show. The only
                exception is when picking New Original Song or New Cover Song.
              </li>
              <li>
                Submissions will close one hour prior to the show&apos;s local
                start time.
              </li>
              <li>
                Scoring for shows takes place once a show&apos;s recording is
                available on Bandcamp, nugs.net, YouTube, or tape.
              </li>
              <li>
                We track all performances of every song, regardless if the band
                lists them in Coach&apos;s Notes.
              </li>
              <li>
                Submissions are timestamped, so if a submission is received
                after the cutoff date, it will be removed.
              </li>
            </ul>
          </div>

          <div className="bg-muted/40 px-3 py-2 rounded-md border border-border">
            <p className="text-xs text-muted-foreground">
              If you experience unforeseen errors,{" "}
              <Link
                href="/old/archive/submit"
                className="font-bold no-underline hover:underline"
              >
                submit a bug report here
              </Link>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

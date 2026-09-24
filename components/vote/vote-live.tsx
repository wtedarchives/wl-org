"use client"

import { useEffect, useState, type ReactNode } from "react"

import { isVotingClosed } from "@/components/vote/voting-window"

export function VoteLive({ children }: { children: ReactNode }) {
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    setClosed(isVotingClosed())
  }, [])

  return (
    <>
      <p className="vote-page__closes">
        {closed
          ? "Voting has concluded. Tune in to WTED Goose Radio to hear the Community's final Top 10."
          : "Voting concludes October 11th at 11:59pm ET."}
      </p>
      {closed ? null : children}
    </>
  )
}

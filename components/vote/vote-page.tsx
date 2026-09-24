import Image from "next/image"
import Link from "next/link"

import { VoteLive } from "@/components/vote/vote-live"
import { VotePicker } from "@/components/vote/vote-picker"

import "./vote-page.css"

export function VotePage() {
  return (
    <div className="vote-page">
      <header className="vote-page__header">
        <div className="vote-page__logo">
          <Image
            src="/WL.png"
            alt=""
            width={96}
            height={96}
            priority
            className="vote-page__logo-img"
          />
        </div>
        <p className="vote-page__brand">Wysteria Lane Community</p>
      </header>
      <main className="vote-page__main">
        <h1 className="vote-page__title">
          Vote for the Top 10 Moments from the 2026 Colorado Run!
        </h1>
        <p className="vote-page__lead">
          Choose 10 songs and rank them 1 through 10, with 1 as your best
          moment. Your first pick is worth 10 points, your second is worth 9,
          and so on down to 1. After voting closes, the songs with the most
          points across every ballot become the community&apos;s top 10. Each
          account can submit once.
        </p>
        <VoteLive>
          <Link href="/vote/commentary" className="vote-page__commentary">
            Record Commentary
          </Link>
          <VotePicker />
        </VoteLive>
      </main>
    </div>
  )
}

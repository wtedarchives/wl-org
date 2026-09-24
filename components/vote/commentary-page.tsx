import Image from "next/image"
import Link from "next/link"

import { CommentaryRecorder } from "@/components/vote/commentary-recorder"

import "./vote-page.css"
import "./commentary-page.css"

export function CommentaryPage() {
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
      <main className="vote-page__main commentary-page__main">
        <Link href="/vote" className="commentary-page__back">
          Back to voting
        </Link>
        <h1 className="vote-page__title">Record commentary</h1>
        <p className="vote-page__lead">
          Tell us about a moment from the 2026 Colorado run. Record up to 60
          seconds. Each account can submit one commentary.
        </p>
        <CommentaryRecorder />
      </main>
    </div>
  )
}

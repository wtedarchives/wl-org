"use client"

import Link from "next/link"

import {
  GORPS_ENTRIES,
  GORPS_INTRO,
  type GorpEntry,
} from "@/components/wted/wted-gorps-content"

function GorpTile({ entry }: { entry: GorpEntry }) {
  const firstName = entry.name.split(/\s+/)[0] ?? entry.name

  return (
    <section className="tile tile-gorp">
      <div className="tile-gorp-inner">
        <figure className="tile-gorp-figure">
          <img
            src={entry.image.src}
            alt={entry.image.alt}
            className="tile-gorp-img"
          />
        </figure>
        <div className="tile-gorp-body">
          <h2 className="tile-gorp-name">{entry.name}</h2>
          <div className="tile-gorp-bio">
            {entry.bio.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
            {entry.bullets?.length ?
              <ul className="tile-gorp-bullets">
                {entry.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            : null}
          </div>
          <p className="tile-gorp-quote-intro">{firstName} says:</p>
          <blockquote className="tile-gorp-quote">
            <div className="tile-gorp-quote-bar" aria-hidden />
            <div className="tile-gorp-quote-body">
              {entry.quote.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </blockquote>
        </div>
      </div>
    </section>
  )
}

export function WtedGorpsWlHomeV2() {
  return (
    <>
      <header className="wl-home-v2-page-lede">
        <h1>{GORPS_INTRO.title}</h1>
        <div className="wl-home-v2-page-lede-body">
          <p>
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
            >
              {GORPS_INTRO.communityLabel}
            </Link>
            !
          </p>
        </div>
      </header>

      <section
        className="grid grid--gorps"
        aria-label="GORPs and contributors"
      >
        {GORPS_ENTRIES.map((entry) => (
          <GorpTile key={entry.name} entry={entry} />
        ))}
      </section>
    </>
  )
}

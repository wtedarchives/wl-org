"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  HELP_FAQ_ENTRIES,
  HELP_INTRO,
  type HelpFaqEntry,
} from "@/components/help/help-content"
import "./help-page.css"

function HelpYoutubeEmbed({
  videoId,
  title,
}: {
  videoId: string
  title: string
}) {
  const [loaded, setLoaded] = useState(false)
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return (
    <div className="help-yt-embed">
      {loaded ?
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      : <button
          type="button"
          className="help-yt-thumb"
          style={{ backgroundImage: `url(${thumb})` }}
          onClick={() => setLoaded(true)}
          aria-label={`Play video: ${title}`}
        >
          <span className="help-yt-play" aria-hidden />
        </button>
      }
    </div>
  )
}

function HelpFaqTile({ entry }: { entry: HelpFaqEntry }) {
  return (
    <section className="tile tile-help-faq" id={entry.id}>
      <div className="tile-help-faq-inner">
        <h2 className="tile-help-faq-question">{entry.question}</h2>
        <HelpYoutubeEmbed videoId={entry.youtubeId} title={entry.question} />
        <div className="tile-help-faq-body">
          {entry.paragraphs?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {entry.groups?.length ?
            <div className="tile-help-faq-groups">
              {entry.groups.map((group) => (
                <div key={group.title} className="tile-help-faq-group">
                  <h3 className="tile-help-faq-group-title">{group.title}</h3>
                  {group.items.length === 1 ?
                    <p>{group.items[0]}</p>
                  : <ul className="tile-help-faq-bullets">
                      {group.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  }
                </div>
              ))}
            </div>
          : null}
        </div>
      </div>
    </section>
  )
}

export function HelpPageContent() {
  return (
    <>
      <header className="wl-home-v2-page-lede">
        <h1>{HELP_INTRO.title}</h1>
        <div className="wl-home-v2-page-lede-body">
          <p>{HELP_INTRO.body}</p>
        </div>
      </header>

      <section
        className={cn("grid", "grid--help-faq")}
        aria-label="Frequently asked questions"
      >
        {HELP_FAQ_ENTRIES.map((entry) => (
          <HelpFaqTile key={entry.id} entry={entry} />
        ))}
      </section>
    </>
  )
}

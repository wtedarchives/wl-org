"use client"

import { useState } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { SongStat } from "@/hooks/use-setlist-game-show-data"

type FieldTab = "songs" | "openers" | "closers"

const TABS: { id: FieldTab; label: string }[] = [
  { id: "songs", label: "Songs" },
  { id: "openers", label: "Show openers" },
  { id: "closers", label: "Show closers" },
]

export function EchoOfAShowFieldPicks({
  topSongs,
  topOpeners,
  topClosers,
}: {
  topSongs: SongStat[]
  topOpeners: SongStat[]
  topClosers: SongStat[]
}) {
  const [tab, setTab] = useState<FieldTab>("songs")
  const stats =
    tab === "openers" ? topOpeners : tab === "closers" ? topClosers : topSongs
  const title =
    tab === "openers"
      ? "Top show openers"
      : tab === "closers"
        ? "Top show closers"
        : "Top songs picked"

  return (
    <section className="echo-of-a-show__panel">
      <div className="echo-of-a-show__standings-head">
        <span className="echo-of-a-show__stat-label">{title}</span>
        <span className="echo-of-a-show__field-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                tab === item.id
                  ? "echo-of-a-show__field-tab echo-of-a-show__field-tab--on"
                  : "echo-of-a-show__field-tab"
              }
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </span>
      </div>
      {stats.length === 0 ?
        <p className="echo-of-a-show__empty echo-of-a-show__empty--inset">
          No field picks yet.
        </p>
      : <div className="echo-of-a-show__field-grid">
          {stats.map((stat) => (
            <div key={`${tab}-${stat.song}`} className="echo-of-a-show__field-row">
              <div className="echo-of-a-show__field-line">
                <SongDisplayName
                  song={stat.song}
                  songDisplayName={stat.song_displayname}
                  className="echo-of-a-show__field-song"
                  underlineOnHover={false}
                />
                <span className="echo-of-a-show__field-count">
                  <span>{stat.count}</span>{" "}
                  <span className="echo-of-a-show__field-pct">{stat.percentage}%</span>
                </span>
              </div>
              <div className="echo-of-a-show__field-track">
                <div
                  className="echo-of-a-show__field-fill"
                  style={{ ["--echo-bar" as string]: `${stat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>}
    </section>
  )
}

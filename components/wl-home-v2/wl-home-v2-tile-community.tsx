"use client"

import { ArrowRight } from "@phosphor-icons/react"
import Image from "next/image"
import type { CSSProperties } from "react"

import { decodeHtmlEntitiesForDisplay } from "@/lib/decode-html-entities"
import { WL_HOME_V2_COMMUNITY_URL } from "./wl-home-v2-constants"
import type { DiscourseFeaturedTopic } from "@/hooks/use-discourse-featured-topics"

export function WlHomeV2TileCommunity({
  featuredTopics,
  featuredTopicsLoading,
  featuredTopicsError,
}: {
  featuredTopics: DiscourseFeaturedTopic[]
  featuredTopicsLoading: boolean
  featuredTopicsError: string | null
}) {
  return (
    <section
      className="tile tile-community"
      style={{ "--tile-bg": "url('/newbg2.jpeg')" } as CSSProperties}
    >
      <a
        href={WL_HOME_V2_COMMUNITY_URL}
        className="tile-link"
        aria-label="WTED Community — opens in a new tab"
        target="_blank"
        rel="noopener noreferrer"
      />
      <div className="icon-wrap">
        <div className="icon-bg" />
        <Image
          src="/WL.png"
          alt=""
          width={110}
          height={110}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="tile-widget">
        <div
          className={[
            "widget-panel",
            "transition-opacity duration-200 ease-out",
            featuredTopicsLoading ? "opacity-90" : "opacity-100",
          ].join(" ")}
          aria-busy={featuredTopicsLoading}
        >
          <div className="wp-head">
            <span>Featured Topics</span>
          </div>
          {featuredTopicsLoading ?
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="topic-row" aria-hidden>
                <span className="block h-3 min-w-0 flex-1 max-w-[85%] rounded bg-white/10 motion-safe:animate-pulse" />
                <span className="count text-transparent">0 posts</span>
              </div>
            ))
          : featuredTopicsError && featuredTopics.length === 0 ?
            <p className="m-0 py-1 text-[11px] leading-snug text-white/70">
              {featuredTopicsError}
            </p>
          : featuredTopics.length === 0 ?
            <p className="m-0 py-1 text-[11px] leading-snug text-white/70">
              No featured topics right now.
            </p>
          : featuredTopics.map((item) => {
              const titleText = decodeHtmlEntitiesForDisplay(item.topic)
              const postsLabel =
                item.posts_count === 1 ? "post" : "posts"
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="topic-row"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={titleText}
                >
                  <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] leading-3">
                    {titleText}
                  </span>
                  <span className="count shrink-0">
                    {item.posts_count.toLocaleString()} {postsLabel}
                  </span>
                </a>
              )
            })}
        </div>
      </div>

      <div className="tile-body">
        <h2>
          WTED
          <br />
          Community
        </h2>
        <p>
          A home made for Goose fans, by Goose fans. Discuss the band and join the couch tour.
        </p>
        <span className="cta">
          <span className="cta-label">Join the community</span>
          <ArrowRight
            className="arrow"
            size={16}
            weight="regular"
            aria-hidden
          />
        </span>
      </div>
    </section>
  )
}

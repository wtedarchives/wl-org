"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react"
import Image from "next/image"

import {
  useDiscourseTopicTopPosts,
  type DiscourseTopicTopPost,
} from "@/hooks/use-discourse-topic-top-posts"
import {
  describeWlTopPostDisplay,
  logWlTopPostCardRender,
} from "@/lib/wl-top-posts-display-debug"
import {
  resolveWlTopPostAvatarUrl,
  WL_TOP_POSTS_DEFAULT_AVATAR,
} from "@/lib/wl-top-posts-avatar"
import { isValidWlCommunityTopicUrl } from "@/lib/wl-community-topic-url"
import { renderWlTopPostPlainText } from "@/lib/wl-top-posts-plain-text"
import { cn } from "@/lib/utils"

import "./wl-top-posts.css"

const AUTO_ADVANCE_MS = 4000

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}

function WlTopPostAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  const [src, setSrc] = useState(() => resolveWlTopPostAvatarUrl(avatarUrl))

  useEffect(() => {
    setSrc(resolveWlTopPostAvatarUrl(avatarUrl))
  }, [avatarUrl])

  return (
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      className="wl-top-posts__avatar"
      onError={() => setSrc(WL_TOP_POSTS_DEFAULT_AVATAR)}
    />
  )
}

function WlTopPostCard({
  post,
  onOpen,
}: {
  post: DiscourseTopicTopPost
  onOpen: (url: string) => void
}) {
  const decision = describeWlTopPostDisplay(post)
  const isImageOnly = decision.displayMode === "image-only"
  const isTextOnly = decision.displayMode === "text-only"
  const isTextAndImage = decision.displayMode === "text-and-image"

  useEffect(() => {
    logWlTopPostCardRender(post, decision)
  }, [
    decision.displayMode,
    decision.plainText,
    decision.postId,
    decision.previewImageUrl,
    decision.showPlainText,
    decision.showPreviewImage,
    post,
  ])

  return (
    <button
      type="button"
      className="wl-top-posts__card"
      onClick={() => onOpen(post.post_url)}
      aria-label={`Open post by ${post.username} on Wysteria Lane Community`}
    >
      <div className="wl-top-posts__card-head">
        <WlTopPostAvatar avatarUrl={post.avatar_url} />
        <span className="wl-top-posts__username">{post.username}</span>
      </div>
      <div
        className={cn(
          "wl-top-posts__body",
          isImageOnly && "wl-top-posts__body--image-only",
          isTextOnly && "wl-top-posts__body--text-only",
          isTextAndImage && "wl-top-posts__body--text-and-image",
        )}
      >
        {decision.showPlainText ?
          <p className="wl-top-posts__body-text">
            {renderWlTopPostPlainText(post.plain_text, post.emoji_images)}
          </p>
        : null}
        {decision.showPreviewImage && post.preview_image_url ?
          <img
            src={post.preview_image_url}
            alt=""
            className={cn(
              "wl-top-posts__preview-image",
              isImageOnly && "wl-top-posts__preview-image--full",
            )}
          />
        : null}
      </div>
    </button>
  )
}

export function WLTopPosts({ wlLink }: { wlLink: string }) {
  const trimmedLink = wlLink.trim()
  if (!isValidWlCommunityTopicUrl(trimmedLink)) return null

  return <WLTopPostsLoaded wlLink={trimmedLink} />
}

function WLTopPostsLoaded({ wlLink }: { wlLink: string }) {
  const { posts, loading, failed, empty } = useDiscourseTopicTopPosts(wlLink)
  const [activeIndex, setActiveIndex] = useState(0)
  const [cardVisible, setCardVisible] = useState(true)
  const transitioningRef = useRef(false)

  useEffect(() => {
    setActiveIndex(0)
    setCardVisible(true)
    transitioningRef.current = false
  }, [wlLink, posts])

  const advancePost = useCallback(() => {
    if (posts.length <= 1 || transitioningRef.current) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveIndex((index) => (index + 1) % posts.length)
      return
    }

    transitioningRef.current = true
    setCardVisible(false)
  }, [posts.length])

  const handleRotatorTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== "opacity") return

      if (cardVisible) {
        transitioningRef.current = false
        return
      }

      setActiveIndex((index) => (index + 1) % posts.length)
      requestAnimationFrame(() => {
        setCardVisible(true)
      })
    },
    [cardVisible, posts.length],
  )

  useEffect(() => {
    if (posts.length <= 1) return

    const id = window.setInterval(advancePost, AUTO_ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [advancePost, posts.length, wlLink])

  if (failed) return null

  const activePost = posts[activeIndex]
  const rotatorLabel =
    activePost ?
      `Top community posts, showing post ${activeIndex + 1} of ${posts.length} by ${activePost.username}`
    : "Top posts from the Wysteria Lane Community show thread"

  return (
    <section
      className="wl-home-v2-years-tile wl-top-posts"
      style={
        {
          "--tile-bg": "url('/newbg.png')",
        } as CSSProperties
      }
    >
      <div className="wl-home-v2-years-tile-inner">
        <div className="side-card wl-top-posts__side-card">
          <button
            type="button"
            className="wl-top-posts__header-link"
            onClick={() => openInNewTab(wlLink)}
          >
            <Image
              src="/WL.png"
              alt=""
              width={22}
              height={22}
              className="size-[22px] shrink-0 object-contain"
              unoptimized
            />
            <span className="wl-top-posts__header-text">
              Chat in the Wysteria Lane Community
            </span>
          </button>

          {loading ?
            <p className="wl-top-posts__loading">Loading community posts…</p>
          : empty ?
            <p className="wl-top-posts__empty">No posts in this thread yet.</p>
          : activePost ?
            posts.length === 1 ?
              <WlTopPostCard post={activePost} onOpen={openInNewTab} />
            : <div
                className="wl-top-posts__rotator"
                aria-roledescription="carousel"
                aria-label={rotatorLabel}
                aria-live="polite"
              >
                <div
                  className={cn(
                    "wl-top-posts__rotator-inner",
                    cardVisible ?
                      "wl-top-posts__rotator-inner--visible"
                    : "wl-top-posts__rotator-inner--hidden",
                  )}
                  onTransitionEnd={handleRotatorTransitionEnd}
                >
                  <WlTopPostCard post={activePost} onOpen={openInNewTab} />
                </div>
              </div>
          : null}
        </div>
      </div>
    </section>
  )
}

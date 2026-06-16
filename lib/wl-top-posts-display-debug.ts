/** Shared display diagnostics for WLTopPosts (browser console). */

export type WlTopPostDisplayMode =
  | "text-and-image"
  | "image-only"
  | "text-only"
  | "empty"

export type WlTopPostExtractionPipelineStep = {
  step: string
  summary: string
  data?: Record<string, unknown>
}

export type WlTopPostExtractionDebug = {
  cookedLength: number
  cookedPreview: string
  pipeline: WlTopPostExtractionPipelineStep[]
  imageUrls: string[]
  previewImageUrl: string | null
  textSourcePreview: string
  rawPlainText: string
  plainText: string
  displayMode: WlTopPostDisplayMode
  renderPlan: {
    showPreviewImage: boolean
    showPlainText: boolean
    previewImageLayout: "full-width" | "float-right" | "none"
    plainTextLayout: "wrap-beside-image" | "full-width" | "none"
  }
}

export type WlTopPostDisplayInput = {
  id: number
  post_number: number
  username: string
  plain_text: string
  preview_image_url: string | null
  display_mode?: WlTopPostDisplayMode
  extraction_debug?: WlTopPostExtractionDebug
}

export type WlTopPostDisplayDecision = {
  postId: number
  postNumber: number
  username: string
  displayMode: WlTopPostDisplayMode
  showPreviewImage: boolean
  showPlainText: boolean
  previewImageUrl: string | null
  plainText: string
  textCharacterCount: number
  serverDisplayMode: WlTopPostDisplayMode | undefined
  renderPlan: WlTopPostExtractionDebug["renderPlan"]
}

export function computeWlTopPostRenderPlan(
  previewImageUrl: string | null,
  plainText: string,
): WlTopPostExtractionDebug["renderPlan"] {
  const showPreviewImage = Boolean(previewImageUrl)
  const showPlainText = plainText.length > 0

  if (showPreviewImage && showPlainText) {
    return {
      showPreviewImage: true,
      showPlainText: true,
      previewImageLayout: "float-right",
      plainTextLayout: "wrap-beside-image",
    }
  }
  if (showPreviewImage) {
    return {
      showPreviewImage: true,
      showPlainText: false,
      previewImageLayout: "full-width",
      plainTextLayout: "none",
    }
  }
  if (showPlainText) {
    return {
      showPreviewImage: false,
      showPlainText: true,
      previewImageLayout: "none",
      plainTextLayout: "full-width",
    }
  }
  return {
    showPreviewImage: false,
    showPlainText: false,
    previewImageLayout: "none",
    plainTextLayout: "none",
  }
}

export function computeWlTopPostDisplayMode(
  previewImageUrl: string | null,
  plainText: string,
): WlTopPostDisplayMode {
  const showPreviewImage = Boolean(previewImageUrl)
  const showPlainText = plainText.length > 0
  if (showPreviewImage && showPlainText) return "text-and-image"
  if (showPreviewImage) return "image-only"
  if (showPlainText) return "text-only"
  return "empty"
}

export function describeWlTopPostDisplay(
  post: WlTopPostDisplayInput,
): WlTopPostDisplayDecision {
  const plainText = post.plain_text.trim()
  const previewImageUrl = post.preview_image_url?.trim() ?
      post.preview_image_url.trim()
    : null
  const displayMode = computeWlTopPostDisplayMode(previewImageUrl, plainText)
  const renderPlan = computeWlTopPostRenderPlan(previewImageUrl, plainText)

  return {
    postId: post.id,
    postNumber: post.post_number,
    username: post.username,
    displayMode,
    showPreviewImage: renderPlan.showPreviewImage,
    showPlainText: renderPlan.showPlainText,
    previewImageUrl,
    plainText,
    textCharacterCount: plainText.length,
    serverDisplayMode: post.display_mode,
    renderPlan,
  }
}

function logExtractionPipeline(debug: WlTopPostExtractionDebug): void {
  console.group("[WLTopPosts] cooked → display pipeline")
  console.log("cooked preview:", debug.cookedPreview)
  console.log("cooked length:", debug.cookedLength)
  debug.pipeline.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.step}`, entry.summary, entry.data ?? "")
  })
  console.log("image URLs found:", debug.imageUrls)
  console.log("preview image chosen:", debug.previewImageUrl ?? "(none)")
  console.log("text after HTML strip:", debug.rawPlainText || "(empty)")
  console.log("text after metadata clean:", debug.plainText || "(empty)")
  console.log("display_mode:", debug.displayMode)
  console.log("render plan:", debug.renderPlan)
  console.groupEnd()
}

export function logWlTopPostsDisplayDecisions(
  posts: WlTopPostDisplayInput[],
  context: { wlLink: string; topicId: number | null },
): void {
  console.group(
    `[WLTopPosts] display decisions (topic ${context.topicId ?? "?"})`,
  )
  console.log("wlLink:", context.wlLink)
  console.log("postCount:", posts.length)

  posts.forEach((post, index) => {
    const decision = describeWlTopPostDisplay(post)
    console.group(
      `#${index + 1} post ${decision.postNumber} (${decision.username})`,
    )
    console.log("client decision:", {
      displayMode: decision.displayMode,
      serverDisplayMode: decision.serverDisplayMode ?? "(not provided)",
      showPreviewImage: decision.showPreviewImage,
      showPlainText: decision.showPlainText,
      previewImageUrl: decision.previewImageUrl,
      plainText: decision.plainText || "(no plain text)",
      renderPlan: decision.renderPlan,
    })
    if (post.extraction_debug) {
      logExtractionPipeline(post.extraction_debug)
    } else {
      console.warn(
        "No extraction_debug on post — redeploy discourse-topic-top-posts for full cooked pipeline logs.",
      )
    }
    if (
      decision.serverDisplayMode &&
      decision.serverDisplayMode !== decision.displayMode
    ) {
      console.warn("Server display_mode differs from client-derived mode.", {
        server: decision.serverDisplayMode,
        client: decision.displayMode,
      })
    }
    console.groupEnd()
  })

  console.groupEnd()
}

export function logWlTopPostCardRender(
  post: WlTopPostDisplayInput,
  decision: WlTopPostDisplayDecision,
): void {
  console.log(
    `[WLTopPosts] render post ${decision.postNumber} (${decision.username})`,
    {
      displayMode: decision.displayMode,
      showPreviewImage: decision.showPreviewImage,
      showPlainText: decision.showPlainText,
      plainText: decision.plainText || "(no plain text)",
      previewImageUrl: decision.previewImageUrl,
      renderPlan: decision.renderPlan,
    },
  )
  if (decision.displayMode === "empty") {
    console.warn(
      "[WLTopPosts] rendering empty body — no plain text and no preview image.",
      post.extraction_debug ?? "missing extraction_debug",
    )
  }
}

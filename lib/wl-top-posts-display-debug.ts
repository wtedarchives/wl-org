/** Shared display helpers for WLTopPosts. */

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

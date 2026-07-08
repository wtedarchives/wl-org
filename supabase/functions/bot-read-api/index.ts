/**
 * Read-only JSON API for Discord bot consumers.
 *
 * Auth: X-API-Key header or Authorization: Bearer <api-key>
 * Keys: public.bot_api_keys (SHA-256 hash). Create via generate_bot_api_key(label).
 *
 * GET ?endpoint=tours
 * GET ?endpoint=shows&tour_id=<uuid>
 * GET ?endpoint=setlist&show_id=<uuid>   (show_id required)
 * GET ?endpoint=songs
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  BOT_READ_API_CORS,
  createServiceClient,
  extractApiKey,
  handleSetlistEndpoint,
  handleShowsEndpoint,
  handleSongsEndpoint,
  handleToursEndpoint,
  jsonResponse,
  logBotApiRequest,
  touchApiKeyLastUsed,
  validateApiKey,
} from "../_shared/bot-read-api-utils.ts"

const VALID_ENDPOINTS = new Set(["tours", "shows", "setlist", "songs"])

function queryParamSnapshot(url: URL): Record<string, string> {
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: BOT_READ_API_CORS })
  }

  const startedAt = Date.now()
  const url = new URL(req.url)
  const endpoint = url.searchParams.get("endpoint")?.trim().toLowerCase() ?? ""
  const queryParams = queryParamSnapshot(url)

  let apiKeyId: string | null = null
  let response = jsonResponse({ error: "Internal error" }, 500)
  let errorMessage: string | null = null

  const client = createServiceClient()

  try {
    if (!client) {
      response = jsonResponse({ error: "Server configuration error" }, 500)
      errorMessage = "Server configuration error"
      return response
    }

    if (req.method !== "GET") {
      response = jsonResponse({ error: "Method not allowed" }, 405)
      errorMessage = "Method not allowed"
      return response
    }

    if (!endpoint || !VALID_ENDPOINTS.has(endpoint)) {
      response = jsonResponse(
        {
          error:
            "Missing or invalid endpoint. Use endpoint=tours|shows|setlist|songs",
        },
        400,
      )
      errorMessage = "Missing or invalid endpoint"
      return response
    }

    const rawKey = extractApiKey(req)
    if (!rawKey) {
      response = jsonResponse({ error: "Unauthorized" }, 401)
      errorMessage = "Missing API key"
      return response
    }

    const { key, error: keyLookupError } = await validateApiKey(client, rawKey)
    if (keyLookupError) {
      response = jsonResponse({ error: "Failed to validate API key" }, 500)
      errorMessage = keyLookupError
      return response
    }

    if (!key) {
      response = jsonResponse({ error: "Unauthorized" }, 401)
      errorMessage = "Invalid or revoked API key"
      return response
    }

    apiKeyId = key.id

    if (endpoint === "tours") {
      const result = await handleToursEndpoint(client)
      response = result.response
      errorMessage = result.errorMessage
    } else if (endpoint === "shows") {
      const tourId = url.searchParams.get("tour_id")?.trim() ?? ""
      if (!tourId) {
        response = jsonResponse(
          { error: "Missing required parameter: tour_id" },
          400,
        )
        errorMessage = "Missing required parameter: tour_id"
      } else {
        const result = await handleShowsEndpoint(client, tourId)
        response = result.response
        errorMessage = result.errorMessage
      }
    } else if (endpoint === "setlist") {
      const showId = url.searchParams.get("show_id")?.trim() ?? ""
      const result = await handleSetlistEndpoint(client, showId)
      response = result.response
      errorMessage = result.errorMessage
    } else if (endpoint === "songs") {
      const result = await handleSongsEndpoint(client)
      response = result.response
      errorMessage = result.errorMessage
    }

    if (apiKeyId && response.status >= 200 && response.status < 400) {
      await touchApiKeyLastUsed(client, apiKeyId)
    }

    return response
  } finally {
    if (client) {
      const durationMs = Date.now() - startedAt
      await logBotApiRequest(client, {
        apiKeyId,
        endpoint: endpoint || "unknown",
        queryParams,
        statusCode: response.status,
        errorMessage,
        durationMs,
      })
    }
  }
})

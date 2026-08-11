import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  boundedSupabaseImageUrl,
  buildLinkFacets,
  createBlueskyClient,
  rkeyFromPostUri,
  type BlueskyBlob,
  type BlueskyClient,
  type BlueskyPostRecord,
  type BlueskyStrongRef,
} from "./bluesky.ts"
import {
  buildBlueskyExternalCardMeta,
  buildBlueskyRootPostText,
  buildBlueskyShowEventPostText,
  buildBlueskySongPostText,
  type BlueskyRootShowInfo,
} from "./bluesky-setlist-copy.ts"
import {
  getSetlistShowAbsoluteUrl,
  type SetlistDiscourseShowEvent,
} from "./discourse-brains-chat.ts"
import { resolveSongCategoryArtwork } from "./setlist-push-notifications.ts"

/** What happened on the Bluesky leg — surfaced in the admin toast. */
export type BlueskyPostResult = {
  status: "created" | "updated" | "disabled" | "failed"
  uri?: string
  error?: string
}

type PostKind = "root" | "song" | SetlistDiscourseShowEvent

type StoredPostRow = {
  id: string
  uri: string
  cid: string
  rkey: string
  created_at: string
  embed: Record<string, unknown> | null
  reply_root_uri: string | null
  reply_root_cid: string | null
  reply_parent_uri: string | null
  reply_parent_cid: string | null
}

type ThreadRow = {
  show_id: string
  root_uri: string
  root_cid: string
  last_uri: string
  last_cid: string
}

type ThreadState = { root: BlueskyStrongRef; tail: BlueskyStrongRef }

const nowIso = () => new Date().toISOString()

const imagesEmbed = (blob: BlueskyBlob, alt: string) => ({
  $type: "app.bsky.embed.images",
  images: [{ alt, image: blob }],
})

/**
 * Position of this show within its tour. Mirrors `useShowPositionInTour` —
 * chronological by `show_date`, then `show_canonid`, then `show_group`.
 */
async function loadTourPosition(
  db: SupabaseClient,
  showId: string,
  tourName: string,
): Promise<{ position: number; total: number } | null> {
  const { data, error } = await db
    .from("shows")
    .select("show_id, show_canonid, show_date, show_group")
    .eq("show_tour", tourName)
  if (error) {
    console.error("bluesky tour position:", error.message)
    return null
  }
  if (!data?.length) return null

  const rows = data as Array<{
    show_id: string
    show_canonid: number | null
    show_date: string
    show_group: string | null
  }>
  const sorted = [...rows].sort((a, b) => {
    const timeA = new Date(a.show_date).getTime()
    const timeB = new Date(b.show_date).getTime()
    if (timeA !== timeB) return timeA - timeB
    const aCanon = a.show_canonid !== null
    const bCanon = b.show_canonid !== null
    if (aCanon && bCanon) return a.show_canonid! - b.show_canonid!
    if (aCanon) return -1
    if (bCanon) return 1
    return (a.show_group ?? "").localeCompare(b.show_group ?? "")
  })

  const index = sorted.findIndex((row) => row.show_id === showId)
  return index >= 0 ? { position: index + 1, total: sorted.length } : null
}

/** First poster image linked to this show, if any. `show_posters.show` is jsonb. */
async function loadShowPosterImage(
  db: SupabaseClient,
  showId: string,
): Promise<string | undefined> {
  const { data, error } = await db
    .from("show_posters")
    .select("image")
    .filter("show", "cs", JSON.stringify([showId]))
    .not("image", "is", null)
    .limit(1)
  if (error) {
    console.error("bluesky show poster lookup:", error.message)
    return undefined
  }
  const image = (data?.[0]?.image as string | null)?.trim()
  return image || undefined
}

async function loadRootShowInfo(
  db: SupabaseClient,
  showId: string,
): Promise<BlueskyRootShowInfo> {
  const { data, error } = await db
    .from("shows")
    .select(
      "show_date, show_group, show_subvenue, show_venue_location, show_detail, show_tour",
    )
    .eq("show_id", showId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Show not found")

  const showTour = (data.show_tour as string | null)?.trim() || null
  return {
    showId,
    showDate: String(data.show_date ?? ""),
    showGroup: data.show_group as string | null,
    showSubvenue: data.show_subvenue as string | null,
    showVenueLocation: data.show_venue_location as string | null,
    showDetail: data.show_detail as string | null,
    showTour,
    tourPosition: showTour ? await loadTourPosition(db, showId, showTour) : null,
  }
}

async function readThread(
  db: SupabaseClient,
  showId: string,
): Promise<ThreadState | null> {
  const { data, error } = await db
    .from("bluesky_threads")
    .select("show_id, root_uri, root_cid, last_uri, last_cid")
    .eq("show_id", showId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as ThreadRow
  return {
    root: { uri: row.root_uri, cid: row.root_cid },
    tail: { uri: row.last_uri, cid: row.last_cid },
  }
}

/**
 * The show's thread root, creating it on first use.
 *
 * Embed is the show poster when one exists, otherwise a link card — a post
 * carries at most one embed, and the setlist URL is already in the root text
 * as a facet either way.
 */
async function ensureThreadRoot(
  db: SupabaseClient,
  client: BlueskyClient,
  showId: string,
): Promise<ThreadState> {
  const existing = await readThread(db, showId)
  if (existing) return existing

  const info = await loadRootShowInfo(db, showId)
  const text = buildBlueskyRootPostText(info)
  const url = getSetlistShowAbsoluteUrl(showId)

  const posterImage = await loadShowPosterImage(db, showId)
  // Posters are full-resolution scans and routinely blow past the 2MB embed cap,
  // so they go through Storage's image transform on the way out.
  const posterBlob =
    posterImage ?
      await client.uploadImage(boundedSupabaseImageUrl(posterImage))
    : undefined
  let embed: Record<string, unknown>
  if (posterBlob) {
    const card = buildBlueskyExternalCardMeta(info)
    embed = imagesEmbed(posterBlob, `Show poster — ${card.title}`)
  } else {
    const card = buildBlueskyExternalCardMeta(info)
    embed = {
      $type: "app.bsky.embed.external",
      external: { uri: url, title: card.title, description: card.description },
    }
  }

  const record: BlueskyPostRecord = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: nowIso(),
    langs: ["en"],
    facets: buildLinkFacets(text, [url]),
    embed,
  }

  const created = await client.createPost(record)
  const ref: BlueskyStrongRef = { uri: created.uri, cid: created.cid }

  const { error: threadErr } = await db.from("bluesky_threads").insert({
    show_id: showId,
    root_uri: ref.uri,
    root_cid: ref.cid,
    last_uri: ref.uri,
    last_cid: ref.cid,
  })
  if (threadErr) {
    // Lost a race against a concurrent first press — defer to the stored thread
    // so replies still chain onto a single root.
    const raced = await readThread(db, showId)
    if (raced) return raced
    throw new Error(threadErr.message)
  }

  const { error: postErr } = await db.from("bluesky_posts").insert({
    show_id: showId,
    kind: "root",
    uri: ref.uri,
    cid: ref.cid,
    rkey: created.rkey,
    text,
    embed,
  })
  if (postErr) console.error("bluesky_posts root insert:", postErr.message)

  return { root: ref, tail: ref }
}

/** Post a reply onto the thread tail and advance the tail. */
async function appendThreadReply(
  db: SupabaseClient,
  client: BlueskyClient,
  showId: string,
  thread: ThreadState,
  kind: PostKind,
  text: string,
  options: { entryId?: string; urls?: string[]; embed?: Record<string, unknown> },
): Promise<BlueskyStrongRef> {
  const record: BlueskyPostRecord = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: nowIso(),
    langs: ["en"],
    reply: { root: thread.root, parent: thread.tail },
  }
  const facets = buildLinkFacets(text, options.urls ?? [])
  if (facets.length) record.facets = facets
  if (options.embed) record.embed = options.embed

  const created = await client.createPost(record)
  const ref: BlueskyStrongRef = { uri: created.uri, cid: created.cid }

  const { error: insertErr } = await db.from("bluesky_posts").insert({
    show_id: showId,
    entry_id: options.entryId ?? null,
    kind,
    uri: ref.uri,
    cid: ref.cid,
    rkey: created.rkey,
    text,
    embed: options.embed ?? null,
    reply_root_uri: thread.root.uri,
    reply_root_cid: thread.root.cid,
    reply_parent_uri: thread.tail.uri,
    reply_parent_cid: thread.tail.cid,
  })
  if (insertErr) {
    // The post is live; without the row we'd lose the ability to edit it.
    console.error("bluesky_posts insert:", insertErr.message)
  }

  const { error: tailErr } = await db
    .from("bluesky_threads")
    .update({ last_uri: ref.uri, last_cid: ref.cid, updated_at: nowIso() })
    .eq("show_id", showId)
  if (tailErr) console.error("bluesky_threads tail update:", tailErr.message)

  return ref
}

type SongContext = {
  showId: string
  text: string
  artworkUrl: string | undefined
}

async function loadSongContext(
  db: SupabaseClient,
  entryId: string,
): Promise<SongContext> {
  const { data: entry, error: entryErr } = await db
    .from("setlist_entries")
    .select("entry_id, entry_show, entry_song, entry_coachnotes")
    .eq("entry_id", entryId)
    .maybeSingle()
  if (entryErr) throw new Error(entryErr.message)
  if (!entry) throw new Error("Setlist entry not found")

  const entrySong = entry.entry_song as string | null
  const { data: songRow } = await db
    .from("songs")
    .select("song_displayname")
    .eq("song", (entrySong ?? "").trim())
    .maybeSingle()

  return {
    showId: String(entry.entry_show),
    text: buildBlueskySongPostText(
      songRow?.song_displayname as string | null | undefined,
      entrySong,
      entry.entry_coachnotes as string | null,
    ),
    artworkUrl: await resolveSongCategoryArtwork(db, entrySong),
  }
}

/** Base64 JPEG (no data: prefix) → bytes, or undefined when unusable. */
function decodeJpegBase64(base64: string | undefined): Uint8Array | undefined {
  const raw = (base64 ?? "").trim()
  if (!raw) return undefined
  try {
    // Tolerate a data: prefix in case a caller sends the full data URL.
    const payload = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes.byteLength > 0 ? bytes : undefined
  } catch (err) {
    console.error("bluesky song image decode:", err)
    return undefined
  }
}

export type PostSetlistSongOptions = {
  /**
   * Base64 JPEG of the setlist share card, captured in the browser at press
   * time. The card is rendered by `html-to-image` from live DOM, which Deno
   * can't reproduce, so it has to arrive from the client.
   */
  songImageJpegBase64?: string
}

/**
 * Create — or, on a repeat press, edit — this entry's song post.
 *
 * `putRecord` keeps the post's URI and its original `createdAt`, and the stored
 * reply refs and embed are replayed so an edit can't detach the post from the
 * thread or drop its artwork. Note that Bluesky's AppView does not re-index
 * updated post records, so an edit is durable in the repo but invisible in
 * clients — see the notes in the admin brain button.
 */
export async function postSetlistSongToBluesky(
  db: SupabaseClient,
  entryId: string,
  options: PostSetlistSongOptions = {},
): Promise<BlueskyPostResult> {
  try {
    const client = await createBlueskyClient(db)
    if (!client) return { status: "disabled" }

    const context = await loadSongContext(db, entryId)

    const { data: existingRow, error: existingErr } = await db
      .from("bluesky_posts")
      .select(
        "id, uri, cid, rkey, created_at, embed, reply_root_uri, reply_root_cid, reply_parent_uri, reply_parent_cid",
      )
      .eq("entry_id", entryId)
      .eq("kind", "song")
      .maybeSingle()
    if (existingErr) throw new Error(existingErr.message)

    if (existingRow) {
      const stored = existingRow as StoredPostRow
      const rkey = stored.rkey?.trim() || rkeyFromPostUri(stored.uri)
      if (!rkey) throw new Error(`Stored Bluesky post has no rkey: ${stored.uri}`)

      const record: BlueskyPostRecord = {
        $type: "app.bsky.feed.post",
        text: context.text,
        createdAt: new Date(stored.created_at).toISOString(),
        langs: ["en"],
      }
      if (stored.embed) record.embed = stored.embed
      if (
        stored.reply_root_uri && stored.reply_root_cid &&
        stored.reply_parent_uri && stored.reply_parent_cid
      ) {
        record.reply = {
          root: { uri: stored.reply_root_uri, cid: stored.reply_root_cid },
          parent: { uri: stored.reply_parent_uri, cid: stored.reply_parent_cid },
        }
      }

      const ref = await client.putPost(rkey, record)
      const { error: updateErr } = await db
        .from("bluesky_posts")
        .update({ cid: ref.cid, text: context.text, updated_at: nowIso() })
        .eq("id", stored.id)
      if (updateErr) console.error("bluesky_posts update:", updateErr.message)

      return { status: "updated", uri: ref.uri }
    }

    const thread = await ensureThreadRoot(db, client, context.showId)

    // Setlist share card when the client captured one; category artwork is the
    // fallback so a failed capture still yields an illustrated post.
    const capturedBytes = decodeJpegBase64(options.songImageJpegBase64)
    const imageBlob =
      capturedBytes ? await client.uploadImageBytes(capturedBytes, "image/jpeg")
      : context.artworkUrl ?
        await client.uploadImage(boundedSupabaseImageUrl(context.artworkUrl))
      : undefined

    const ref = await appendThreadReply(
      db,
      client,
      context.showId,
      thread,
      "song",
      context.text,
      {
        entryId,
        embed:
          imageBlob ?
            imagesEmbed(imageBlob, context.text.split("\n")[0])
          : undefined,
      },
    )
    return { status: "created", uri: ref.uri }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Bluesky post failed"
    console.error("postSetlistSongToBluesky:", error)
    return { status: "failed", error }
  }
}

/**
 * Post a show-event marker into the thread. These are repeatable by design
 * (onstage fires again for each set), so every press appends a new reply.
 */
export async function postSetlistShowEventToBluesky(
  db: SupabaseClient,
  showId: string,
  event: SetlistDiscourseShowEvent,
): Promise<BlueskyPostResult> {
  try {
    const client = await createBlueskyClient(db)
    if (!client) return { status: "disabled" }

    const thread = await ensureThreadRoot(db, client, showId)
    const text = buildBlueskyShowEventPostText(showId, event)
    const ref = await appendThreadReply(
      db,
      client,
      showId,
      thread,
      event,
      text,
      { urls: event === "onstage" ? [] : [getSetlistShowAbsoluteUrl(showId)] },
    )
    return { status: "created", uri: ref.uri }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Bluesky post failed"
    console.error("postSetlistShowEventToBluesky:", error)
    return { status: "failed", error }
  }
}

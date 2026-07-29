#!/usr/bin/env node
/**
 * Local-only review UI for the poster import. Nothing here touches the site
 * build or the database — it reads records.json, serves the cropped images off
 * disk, and writes your decisions to review-state.json.
 *
 *   node scripts/posters/review-server.mjs
 *   open http://localhost:4321
 */

import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, createReadStream } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRAPE_DIR =
  process.env.SCRAPE_DIR || '/Users/watsonbriant/Downloads/****wted/goose_posters'
const STATE = join(HERE, 'review-state.json')
const PORT = Number(process.env.PORT || 4321)

const records = JSON.parse(readFileSync(join(HERE, 'records.json'), 'utf8'))
const shows = JSON.parse(readFileSync(join(HERE, 'shows-cache.json'), 'utf8'))
const tours = JSON.parse(readFileSync(join(HERE, 'tours-cache.json'), 'utf8'))
const artistMap = JSON.parse(readFileSync(join(HERE, 'artist-map.json'), 'utf8'))

const showById = new Map(shows.map((s) => [s.show_id, s]))
const label = (id) => {
  const s = showById.get(id)
  return s
    ? `${s.show_date} — ${s.show_subvenue} (${s.show_venue_location})${
        s.show_canonid ? '' : ' [no canonid]'
      }`
    : `${id} (unknown)`
}

let state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {}
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2))

const json = (res, body, code = 200) => {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const p = url.pathname

  if (p === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    return res.end(readFileSync(join(HERE, 'review-ui.html'), 'utf8'))
  }

  if (p === '/api/records') {
    return json(
      res,
      records.map((r) => ({
        ...r,
        show_labels: (r.show || []).map(label),
        review: state[r.id] || null,
      }))
    )
  }

  if (p === '/api/tours') return json(res, tours)

  if (p === '/api/artists') {
    return json(
      res,
      Object.entries(artistMap).map(([handle, v]) => ({ handle, ...v }))
    )
  }

  // Show search for fixing/adding show links by hand.
  if (p === '/api/shows') {
    const q = (url.searchParams.get('q') || '').toLowerCase().trim()
    if (!q) return json(res, [])
    const hits = shows
      .filter(
        (s) =>
          s.show_date.includes(q) ||
          (s.show_subvenue || '').toLowerCase().includes(q) ||
          (s.show_venue_location || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        // Surface the ones that satisfy the import rules first.
        const rank = (s) => (s.show_canonid !== null ? 0 : 2) + (s.show_group === 'Goose' ? 0 : 1)
        return rank(a) - rank(b) || a.show_date.localeCompare(b.show_date)
      })
      .slice(0, 40)
    return json(res, hits.map((s) => ({ ...s, label: label(s.show_id) })))
  }

  if (p === '/api/save' && req.method === 'POST') {
    const body = JSON.parse(await new Promise((r) => {
      let d = ''
      req.on('data', (c) => (d += c))
      req.on('end', () => r(d || '{}'))
    }))
    state[body.id] = { ...body.review, updated_at: new Date().toISOString() }
    save()
    return json(res, { ok: true, reviewed: Object.keys(state).length })
  }

  if (p === '/api/export') {
    const approved = records
      .filter((r) => state[r.id]?.status === 'approved')
      .map((r) => {
        const e = state[r.id].edits || {}
        return {
          uuid: r.uuid,
          image_file: r.image_file,
          show: e.show !== undefined ? e.show : r.show,
          tour: e.tour !== undefined ? e.tour : r.tour,
          artist: e.artist !== undefined ? e.artist : r.artist,
          print_run: e.print_run !== undefined ? e.print_run : r.print_run,
          description: e.description !== undefined ? e.description : r.description,
        }
      })
    writeFileSync(join(HERE, 'approved.json'), JSON.stringify(approved, null, 2))
    return json(res, { written: approved.length, file: 'approved.json' })
  }

  if (p.startsWith('/img/')) {
    const file = basename(decodeURIComponent(p.slice(5)))
    const full = join(SCRAPE_DIR, file)
    if (!existsSync(full)) {
      res.writeHead(404)
      return res.end('not found')
    }
    res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'max-age=3600' })
    return createReadStream(full).pipe(res)
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  const done = Object.values(state).filter((s) => s.status).length
  console.log(`poster review  →  http://localhost:${PORT}`)
  console.log(`${records.length} records, ${done} already reviewed`)
})

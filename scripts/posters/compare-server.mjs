#!/usr/bin/env node
/**
 * Local-only comparison UI: existing show_posters rows beside the Expresso
 * Beans candidates that resolved to the same show or tour.
 *
 * Read-only against Supabase. Every keep/delete/add decision is staged into
 * eb-decisions.json; nothing is written to the database or storage from here.
 *
 *   node scripts/posters/compare-server.mjs
 *   open http://localhost:4322
 */

import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, createReadStream } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const EB_DIR = process.env.EB_DIR || '/Users/watsonbriant/eb/eb_goose'
const CROP_DIR =
  process.env.SCRAPE_DIR || '/Users/watsonbriant/Downloads/****wted/goose_posters'
const STATE = join(HERE, 'eb-decisions.json')
const PORT = Number(process.env.PORT || 4322)

const groups = JSON.parse(readFileSync(join(HERE, 'compare-groups.json'), 'utf8'))
const shows = JSON.parse(readFileSync(join(HERE, 'shows-cache.json'), 'utf8'))
const tours = JSON.parse(readFileSync(join(HERE, 'tours-cache.json'), 'utf8'))

const showById = new Map(shows.map((s) => [s.show_id, s]))
const label = (id) => {
  const s = showById.get(id)
  return s
    ? `${s.show_date} — ${s.show_subvenue} (${s.show_venue_location})${s.show_canonid ? '' : ' [no canonid]'}`
    : `${id} (unknown)`
}

let state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {}
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2))
const json = (res, body, code = 200) => {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

// Stable id per card: db rows keyed by uuid, candidates by image filename.
const idOf = (r) => (r.source === 'database' ? `db:${r.uuid}` : `eb:${r.id}`)

const decorate = (r) => ({
  ...r,
  _id: idOf(r),
  show_labels: (r.show || []).map(label),
  decision: state[idOf(r)] || null,
})

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const p = url.pathname

  if (p === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    return res.end(readFileSync(join(HERE, 'compare-ui.html'), 'utf8'))
  }

  if (p === '/api/groups') {
    const decided = (arr) => arr.filter((r) => state[idOf(r)]?.action).length
    return json(
      res,
      groups.map((g) => ({
        key: g.key,
        label: g.label,
        type: g.type,
        existing: g.existing.length,
        candidates: g.candidates.length,
        decided: decided(g.existing) + decided(g.candidates),
        total: g.existing.length + g.candidates.length,
      }))
    )
  }

  if (p === '/api/group') {
    const g = groups.find((x) => x.key === url.searchParams.get('key'))
    if (!g) return json(res, { error: 'no such group' }, 404)
    return json(res, {
      ...g,
      existing: g.existing.map(decorate),
      candidates: g.candidates.map(decorate),
    })
  }

  if (p === '/api/tours') return json(res, tours)

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
        const rank = (s) => (s.show_canonid !== null ? 0 : 2) + (s.show_group === 'Goose' ? 0 : 1)
        return rank(a) - rank(b) || a.show_date.localeCompare(b.show_date)
      })
      .slice(0, 40)
    return json(res, hits.map((s) => ({ ...s, label: label(s.show_id) })))
  }

  if (p === '/api/save' && req.method === 'POST') {
    const body = JSON.parse(
      await new Promise((r) => {
        let d = ''
        req.on('data', (c) => (d += c))
        req.on('end', () => r(d || '{}'))
      })
    )
    for (const [id, dec] of Object.entries(body.decisions || {})) {
      state[id] = { ...dec, updated_at: new Date().toISOString() }
    }
    save()
    return json(res, { ok: true, staged: Object.keys(state).length })
  }

  // The staged plan. Still nothing executed — this is just the file the
  // apply step will read once you've reviewed it.
  if (p === '/api/export') {
    const byId = new Map()
    for (const g of groups) for (const r of [...g.existing, ...g.candidates]) byId.set(idOf(r), r)

    const merged = (r, dec) => {
      const e = dec?.edits || {}
      return {
        show: e.show !== undefined ? e.show : r.show,
        tour: e.tour !== undefined ? e.tour : r.tour,
        artist: e.artist !== undefined ? e.artist : r.artist,
        print_run: e.print_run !== undefined ? e.print_run : r.print_run ?? null,
        description: e.description !== undefined ? e.description : r.description,
      }
    }

    const plan = { add: [], delete: [], update: [] }
    for (const [id, dec] of Object.entries(state)) {
      const r = byId.get(id)
      if (!r || !dec.action) continue
      if (dec.action === 'add') {
        plan.add.push({
          source_image: join(EB_DIR, r.image_path),
          image_file: r.image_file,
          print_id: r.print_id,
          eb_url: r.eb_url,
          resolution: r.resolution,
          ...merged(r, dec),
        })
      } else if (dec.action === 'delete') {
        plan.delete.push({ uuid: r.uuid, image: r.image })
      } else if (dec.action === 'keep' && dec.edits && Object.keys(dec.edits).length) {
        plan.update.push({ uuid: r.uuid, ...merged(r, dec) })
      }
    }
    writeFileSync(join(HERE, 'eb-plan.json'), JSON.stringify(plan, null, 2))
    return json(res, {
      file: 'eb-plan.json',
      add: plan.add.length,
      delete: plan.delete.length,
      update: plan.update.length,
    })
  }

  if (p.startsWith('/img/eb/')) {
    const rel = decodeURIComponent(p.slice(8)) // <print_id>/<file>
    const full = join(EB_DIR, 'images', rel)
    if (!full.startsWith(join(EB_DIR, 'images')) || !existsSync(full)) {
      res.writeHead(404)
      return res.end('not found')
    }
    res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'max-age=3600' })
    return createReadStream(full).pipe(res)
  }

  if (p.startsWith('/img/crop/')) {
    const full = join(CROP_DIR, basename(decodeURIComponent(p.slice(10))))
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
  console.log(`poster comparison  →  http://localhost:${PORT}`)
  console.log(
    `${groups.length} groups | ${Object.keys(state).length} decisions staged | read-only against Supabase`
  )
})

#!/usr/bin/env node
/**
 * Uploads approved poster images to the show-posters bucket and inserts the
 * matching show_posters rows.
 *
 *   node scripts/posters/import-posters.mjs --dry-run        # show what would happen
 *   node scripts/posters/import-posters.mjs --limit 5        # test batch
 *   node scripts/posters/import-posters.mjs                  # the rest
 *
 * Resumable and idempotent: every completed step is recorded in import-log.json,
 * so re-running only picks up what hasn't finished. Safe to interrupt.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.import (gitignored).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const SCRAPE_DIR =
  process.env.SCRAPE_DIR || '/Users/watsonbriant/Downloads/****wted/goose_posters'
const BUCKET = 'show-posters'
const LOG = join(HERE, 'import-log.json')

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity

// --- env ---------------------------------------------------------------
const readEnv = (file) => {
  const out = {}
  if (!existsSync(file)) return out
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
const env = { ...readEnv(join(ROOT, '.env.local')), ...readEnv(join(ROOT, '.env.import')) }

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_BASE) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing from .env.local')
if (!KEY && !DRY) {
  console.error('\nSUPABASE_SERVICE_ROLE_KEY missing. Put it in .env.import:')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...\n')
  process.exit(1)
}

const H = { apikey: KEY, authorization: `Bearer ${KEY}` }

// --- state -------------------------------------------------------------
const approved = JSON.parse(readFileSync(join(HERE, 'approved.json'), 'utf8'))
let log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {}
const saveLog = () => writeFileSync(LOG, JSON.stringify(log, null, 2))

const storagePath = (r) => `${r.uuid}/${r.image_file}`
const publicUrl = (r) =>
  `${URL_BASE}/storage/v1/object/public/${BUCKET}/${storagePath(r)}`

async function upload(r) {
  const bytes = readFileSync(join(SCRAPE_DIR, r.image_file))
  const res = await fetch(
    `${URL_BASE}/storage/v1/object/${BUCKET}/${encodeURI(storagePath(r))}`,
    { method: 'POST', headers: { ...H, 'content-type': 'image/jpeg' }, body: bytes }
  )
  if (!res.ok) {
    const text = await res.text()
    // A retry after a partial run will hit an existing object; that's fine.
    if (res.status === 409 || text.includes('already exists')) return 'exists'
    throw new Error(`upload ${res.status}: ${text}`)
  }
  return 'uploaded'
}

async function insert(r) {
  const row = {
    uuid: r.uuid,
    show: r.show,
    tour: r.tour,
    artist: r.artist,
    print_run: r.print_run,
    description: r.description,
    image: publicUrl(r),
  }
  const res = await fetch(`${URL_BASE}/rest/v1/show_posters`, {
    method: 'POST',
    headers: { ...H, 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`insert ${res.status}: ${await res.text()}`)
}

// --- run ---------------------------------------------------------------
const remaining = approved.filter((r) => !log[r.uuid]?.inserted)
const todo = remaining.slice(0, LIMIT === Infinity ? undefined : LIMIT)
const done = approved.length - remaining.length

console.log(
  `${approved.length} approved | ${done} already imported | ${remaining.length} remaining` +
    (todo.length < remaining.length ? ` | processing ${todo.length} (--limit)` : '')
)
if (DRY) {
  for (const r of todo.slice(0, 5)) {
    console.log(`\n  ${r.image_file}`)
    console.log(`    path:  ${BUCKET}/${storagePath(r)}`)
    console.log(`    url:   ${publicUrl(r)}`)
    console.log(`    show:  ${JSON.stringify(r.show)}`)
    console.log(`    tour:  ${JSON.stringify(r.tour)}`)
    console.log(`    artist:${JSON.stringify(r.artist)}`)
    console.log(`    descr: ${JSON.stringify(r.description)}`)
  }
  console.log(`\n(dry run — ${todo.length} records would be processed, nothing written)`)
  process.exit(0)
}

let ok = 0
let failed = 0
for (const [i, r] of todo.entries()) {
  try {
    if (!log[r.uuid]?.uploaded) {
      const how = await upload(r)
      log[r.uuid] = { ...log[r.uuid], uploaded: true, how, path: storagePath(r) }
      saveLog()
    }
    await insert(r)
    log[r.uuid] = { ...log[r.uuid], inserted: true, at: new Date().toISOString() }
    saveLog()
    ok++
    process.stdout.write(`\r  ${i + 1}/${todo.length} ok=${ok} failed=${failed}`)
  } catch (err) {
    failed++
    log[r.uuid] = { ...log[r.uuid], error: String(err.message).slice(0, 300) }
    saveLog()
    console.log(`\n  FAILED ${r.image_file}: ${err.message}`)
  }
}
console.log(`\n\ndone — ${ok} imported, ${failed} failed`)
if (failed) console.log('re-run to retry the failures (completed rows are skipped)')

#!/usr/bin/env node
/**
 * Checks every unique releases.release_artwork URL to confirm it resolves to a
 * real image. Flags missing/blank URLs, non-2xx responses, non-image content
 * types, zero-byte bodies, and network failures.
 *
 * Usage:
 *   node scripts/check-release-artwork.mjs [--csv out.csv] [--concurrency 12]
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

const CSV_OUT = flag('csv', 'artwork-check.csv')
const CONCURRENCY = Number(flag('concurrency', 5))
const TIMEOUT_MS = Number(flag('timeout', 15000))
const MAX_RETRIES = Number(flag('retries', 5))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- env ---------------------------------------------------------------
const envPath = resolve(process.cwd(), '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // fall through to process env
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// --- fetch all releases ------------------------------------------------
async function fetchAllReleases() {
  const rows = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const url =
      `${SUPABASE_URL}/rest/v1/releases` +
      `?select=release_id,release_displayname,release_artwork` +
      `&order=release_id&offset=${offset}&limit=${pageSize}`
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!res.ok) throw new Error(`releases query failed: ${res.status} ${await res.text()}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < pageSize) break
  }
  return rows
}

// --- URL check ---------------------------------------------------------
async function probe(url) {
  const attempt = async (method) => {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: ctl.signal,
        // Range keeps GET fallbacks cheap on hosts that reject HEAD.
        headers: method === 'GET' ? { Range: 'bytes=0-2047' } : undefined,
      })
      const type = res.headers.get('content-type') || ''
      const len = res.headers.get('content-length')
      return {
        status: res.status,
        ok: res.ok,
        type,
        len: len === null ? null : Number(len),
        retryAfter: Number(res.headers.get('retry-after')) || 0,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  const once = async () => {
    let r
    try {
      r = await attempt('HEAD')
      // Some CDNs/storage backends mishandle HEAD — retry with a ranged GET.
      if (!r.ok || (!r.type.startsWith('image/') && r.status !== 404)) {
        try {
          r = await attempt('GET')
        } catch {
          /* keep the HEAD result */
        }
      }
    } catch (err) {
      try {
        r = await attempt('GET')
      } catch (err2) {
        return { error: String(err2.message || err.message) }
      }
    }
    return r
  }

  // Throttling (429) and transient 5xx aren't broken images — back off and retry.
  const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504])
  let r
  for (let i = 0; i <= MAX_RETRIES; i++) {
    r = await once()
    if (!r.error && !TRANSIENT.has(r.status)) break
    if (i === MAX_RETRIES) break
    await sleep(Math.max((r.retryAfter || 0) * 1000, 1000 * 2 ** i) + Math.random() * 500)
  }
  if (r.error) return { verdict: 'network_error', detail: r.error }

  if (!r.ok) return { verdict: 'http_error', detail: `HTTP ${r.status}`, status: r.status }
  if (!r.type.startsWith('image/'))
    return { verdict: 'not_an_image', detail: `content-type: ${r.type || 'none'}`, status: r.status }
  if (r.len === 0) return { verdict: 'empty_file', detail: '0 bytes', status: r.status }
  return { verdict: 'ok', detail: `${r.type}${r.len ? `, ${r.len} bytes` : ''}`, status: r.status }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  let done = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx], idx)
        done++
        if (done % 25 === 0 || done === items.length) {
          process.stderr.write(`\r  checked ${done}/${items.length}`)
        }
      }
    })
  )
  process.stderr.write('\n')
  return out
}

// --- main --------------------------------------------------------------
const releases = await fetchAllReleases()
console.log(`Fetched ${releases.length} releases.`)

const blank = releases.filter((r) => !r.release_artwork || !r.release_artwork.trim())
const byUrl = new Map()
for (const r of releases) {
  const url = (r.release_artwork || '').trim()
  if (!url) continue
  if (!byUrl.has(url)) byUrl.set(url, [])
  byUrl.get(url).push(r)
}

const urls = [...byUrl.keys()]
console.log(`${urls.length} unique URLs, ${blank.length} rows with no artwork.\n`)

const malformed = []
const checkable = []
for (const u of urls) {
  if (/^https?:\/\//i.test(u)) checkable.push(u)
  else malformed.push(u)
}

const results = await mapLimit(checkable, CONCURRENCY, async (url) => ({
  url,
  ...(await probe(url)),
}))

const rows = [
  ...blank.map((r) => ({
    verdict: 'missing_url',
    detail: '',
    url: '',
    status: '',
    release_id: r.release_id,
    release_displayname: r.release_displayname,
  })),
  ...malformed.flatMap((url) =>
    byUrl.get(url).map((r) => ({
      verdict: 'malformed_url',
      detail: 'not http(s)',
      url,
      status: '',
      release_id: r.release_id,
      release_displayname: r.release_displayname,
    }))
  ),
  ...results.flatMap((res) =>
    byUrl.get(res.url).map((r) => ({
      verdict: res.verdict,
      detail: res.detail,
      url: res.url,
      status: res.status ?? '',
      release_id: r.release_id,
      release_displayname: r.release_displayname,
    }))
  ),
]

const bad = rows.filter((r) => r.verdict !== 'ok')

const counts = rows.reduce((acc, r) => ((acc[r.verdict] = (acc[r.verdict] || 0) + 1), acc), {})
console.log('Results by verdict (per release row):')
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(16)} ${v}`)
}

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const csv = [
  'verdict,status,detail,release_id,release_displayname,release_artwork',
  ...bad.map((r) =>
    [r.verdict, r.status, r.detail, r.release_id, r.release_displayname, r.url].map(esc).join(',')
  ),
].join('\n')
writeFileSync(CSV_OUT, csv + '\n')

console.log(`\n${bad.length} problem rows written to ${CSV_OUT}`)
if (bad.length) {
  console.log('\nFirst 20:')
  for (const r of bad.slice(0, 20)) {
    console.log(`  [${r.verdict}] ${r.release_displayname} — ${r.url || '(no url)'} ${r.detail}`)
  }
}

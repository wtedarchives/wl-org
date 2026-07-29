#!/usr/bin/env python3
"""
Maps the Expresso Beans scrape onto show_posters shape.

One record per IMAGE (all angles/details retained), carrying its listing's
resolved shows/tour, artist, composed description, and print run. Nothing that
can't be resolved is guessed — it lands in the unassigned pile with flags.

Output: eb-records.json   one entry per image (5,194)
        eb-review.csv     the ones needing a human decision
"""

import csv
import json
import os
import re
from collections import Counter, defaultdict
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
EB_DIR = os.environ.get("EB_DIR", "/Users/watsonbriant/eb/eb_goose")

listings = [json.loads(l) for l in open(os.path.join(EB_DIR, "posters.ndjson"))]
shows = json.load(open(os.path.join(HERE, "shows-cache.json")))
tours = json.load(open(os.path.join(HERE, "tours-cache.json")))
artist_map = json.load(open(os.path.join(HERE, "artist-map.json")))

MONTHS = {
    m: i
    for i, ms in enumerate(
        [("jan", "january"), ("feb", "february"), ("mar", "march"), ("apr", "april"),
         ("may",), ("jun", "june"), ("jul", "july"), ("aug", "august"),
         ("sep", "sept", "september"), ("oct", "october"), ("nov", "november"),
         ("dec", "december")],
        start=1,
    )
    for m in ms
}
MON = "|".join(sorted(MONTHS, key=len, reverse=True))

by_date = defaultdict(list)
for s in shows:
    by_date[s["show_date"]].append(s)
tour_by_name = {t["tour"].lower(): t for t in tours}

# Which tours are actually Goose tours? The table also holds side-project and
# catch-all tours ("2023 Zach Nugent's Dead Set Fall", "2025 Guesting") that a
# Goose poster should never fuzzy-match onto.
_tour_groups = defaultdict(Counter)
for s_ in shows:
    if s_.get("show_tour"):
        _tour_groups[s_["show_tour"]][s_["show_group"]] += 1
goose_tours = {
    name.lower()
    for name, c in _tour_groups.items()
    if c and c.most_common(1)[0][0] == "Goose" and c["Goose"] / sum(c.values()) >= 0.8
}

# Name -> instagram link, carried over from the Instagram pass.
link_by_name = {
    v["name"].lower(): v["link"] for v in artist_map.values() if v.get("name")
}
# EB often uses the studio/handle as the credit ("BioWorkZ"), so index those too.
for handle, v in artist_map.items():
    link_by_name.setdefault(handle.lower(), v["link"])
    link_by_name.setdefault(handle.lower().replace("_", " "), v["link"])
    link_by_name.setdefault(handle.lower().replace(".", " "), v["link"])


def yr(y):
    y = int(y)
    return y if y > 100 else 2000 + y


def mk(y, mo, d):
    """Build a date string, or None if the pieces aren't a plausible show date."""
    try:
        y, mo, d = int(y), int(mo), int(d)
    except (TypeError, ValueError):
        return None
    if not (1 <= mo <= 12 and 1 <= d <= 31 and 2014 <= y <= 2027):
        return None
    try:
        return date(y, mo, d).isoformat()
    except ValueError:  # e.g. Feb 30
        return None


def span(a, b):
    """Every day from a to b inclusive, if that's a sane run length."""
    if not a or not b:
        return [x for x in (a, b) if x]
    d1, d2 = date.fromisoformat(a), date.fromisoformat(b)
    if d2 < d1 or (d2 - d1).days > 45:
        return [a, b]
    return [(d1 + timedelta(days=i)).isoformat() for i in range((d2 - d1).days + 1)]


def parse_event(event, fallback_year):
    """Return (sorted dates, pattern, is_range) for EB's ~74 event shapes.

    Ordering matters: four-digit-year forms are tried before the loose numeric
    form, otherwise '5/8-11/2025' reads as May 8 '11.  A dash between two dates
    means a run; '&' / 'and' mean exactly those nights and must not be filled in.
    """
    if not event:
        return [], None, False
    s = re.sub(r"^[^:]{0,40}:\s*", "", event.strip())
    fy = int(fallback_year) if fallback_year and str(fallback_year).isdigit() else None

    # October 30 - November 2, 2025
    m = re.search(rf"({MON})\.?\s+(\d{{1,2}})\s*[-–]\s*({MON})\.?\s+(\d{{1,2}}),?\s*(\d{{4}})", s, re.I)
    if m:
        a = mk(m[5], MONTHS[m[1].lower()], m[2])
        b = mk(m[5], MONTHS[m[3].lower()], m[4])
        return sorted(span(a, b)), "Mon d-Mon d, y", True

    # May 6 & 8-9, 2021   /   June 3, 2026   /   December 8-9, 2023
    m = re.search(rf"({MON})\.?\s+([\d\s,&–-]+?),?\s+(\d{{4}})\b", s, re.I)
    if m:
        mo, y, out, rng = MONTHS[m[1].lower()], m[3], set(), False
        for part in re.split(r"[,&]|\band\b", m[2]):
            part = part.strip()
            r2 = re.match(r"^(\d{1,2})\s*[-–]\s*(\d{1,2})$", part)
            if r2:
                out.update(span(mk(y, mo, r2[1]), mk(y, mo, r2[2])))
                rng = True
            elif part.isdigit():
                d = mk(y, mo, part)
                if d:
                    out.add(d)
        if out:
            return sorted(out), "Mon d[-d], y", rng

    # 5/8-11/2025  (day range inside one month, explicit 4-digit year)
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})\s*[-–]\s*(\d{1,2})[/-](\d{4})\b", s)
    if m:
        return sorted(span(mk(m[4], m[1], m[2]), mk(m[4], m[1], m[3]))), "m/d-d/yyyy", True

    # 5/30-6/29/2025  (range crossing months, explicit 4-digit year)
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})\s*[-–]\s*(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", s)
    if m:
        return sorted(span(mk(m[5], m[1], m[2]), mk(m[5], m[3], m[4]))), "m/d-m/d/yyyy", True

    # Full dates: 3/4/22 - 3/7/22, 06/12/2022 & 06/14/2022, 12-05-19
    hits = re.findall(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", s)
    hits = [h for h in hits if mk(yr(h[2]), h[0], h[1])]
    if hits:
        out = {mk(yr(y), mo, d) for mo, d, y in hits}
        joined_by_dash = bool(re.search(r"\d\s*[-–]\s*\d{1,2}[/-]", s)) and not re.search(r"&|\band\b", s)
        if len(out) == 2 and joined_by_dash:
            a, b = sorted(out)
            return span(a, b), "m/d/y run", True
        return sorted(out), "m/d/y", False

    # 5/7-5/9 or 5/7-9 with the year only in the listing's `year` field
    if fy:
        m = re.search(r"\b(\d{1,2})/(\d{1,2})\s*[-–]\s*(?:(\d{1,2})/)?(\d{1,2})\b", s)
        if m:
            a = mk(fy, m[1], m[2])
            b = mk(fy, m[3] or m[1], m[4])
            if a and b:
                return sorted(span(a, b)), "m/d-m/d (year from field)", True
        m = re.search(r"\b(\d{1,2})/(\d{1,2})\b", s)
        if m:
            d = mk(fy, m[1], m[2])
            if d:
                return [d], "m/d (year from field)", False
    return [], None, False


def qualifying(cands):
    canon = [c for c in cands if c.get("show_canonid") is not None]
    if canon:
        goose = [c for c in canon if c.get("show_group") == "Goose"]
        return goose or canon
    return [c for c in cands if c.get("show_group") == "Goose"]


def toks(s):
    return {w for w in re.findall(r"[a-z0-9]+", (s or "").lower()) if len(w) > 2}


def resolve(dates, venues, is_range=False):
    """dates -> show rows, with the EB venue string used to verify (not to guess)."""
    picked, notes = [], []
    vt = set()
    for v in venues or []:
        if not v.startswith("*"):
            vt |= toks(v)

    for d in dates:
        q = qualifying(by_date.get(d, []))
        if not q:
            # In a run like "May 24-26" only some nights are Goose shows; that's
            # expected, so only a miss on a single explicit date is worth flagging.
            if not is_range:
                notes.append(f"no qualifying show on {d}")
            continue
        if len(q) > 1 and vt:
            hits = [c for c in q if toks(c["show_subvenue"]) & vt or toks(c["show_venue_location"]) & vt]
            if hits:
                q = hits
        if len(q) > 1:
            notes.append(f"{len(q)} shows on {d}")
        # Venue sanity check — flags a date that matched a different city.
        if vt and len(q) == 1:
            got = toks(q[0]["show_subvenue"]) | toks(q[0]["show_venue_location"])
            if not (got & vt):
                notes.append(f"venue mismatch on {d}: EB={list(vt)[:3]} db={q[0]['show_subvenue']}")
        picked += q
    return picked, notes


def flip_artist(a):
    """'Mahn, Max (Twin Home Prints)' -> ('Max Mahn', 'Twin Home Prints')"""
    studio = None
    m = re.search(r"\(([^)]+)\)\s*$", a)
    if m:
        studio = m.group(1).strip()
        a = a[: m.start()].strip()
    if a == "*band":
        return "Goose", studio
    if "," in a:
        last, first = [x.strip() for x in a.split(",", 1)]
        a = f"{first} {last}".strip()
    return a, studio


def describe(r):
    parts = []
    if r.get("technique") and r["technique"] != "None":
        parts.append(r["technique"])
    if r.get("size"):
        s = re.sub(r"\s*[xX]\s*", '"x', r["size"].strip()) + '"'
        parts.append(s)
    if r.get("paper"):
        parts.append(r["paper"])
    if r.get("markings") and r["markings"] != "None":
        parts.append(r["markings"])
    return ", ".join(parts) or None


def parse_run(v):
    if not v:
        return None
    n = re.sub(r"[^\d]", "", str(v))
    return int(n) if n and int(n) <= 32767 else None


records = []
for r in listings:
    flags = []
    dates, pat, is_range = parse_event(r.get("event"), r.get("year"))
    picked, notes = resolve(dates, r.get("venues"), is_range) if dates else ([], [])
    if dates and is_range and not picked:
        notes.append(f"no qualifying show in range {dates[0]}..{dates[-1]}")
    flags += notes

    tour = None
    if not picked:
        blob = f"{r.get('event') or ''} {r['title']}".lower()
        for name, t in tour_by_name.items():
            if name in blob:
                tour = t
                break
        if not tour:
            # "Summer Tour 2021" vs the table's "2021 Summer [Festival Run]" —
            # require the year plus another significant word before accepting.
            STOP = {"tour", "the", "and", "of", "goose", "leg", "poster", "vol"}
            want = {w for w in re.findall(r"[a-z0-9]+", blob) if len(w) > 2 and w not in STOP}
            years = {w for w in want if re.fullmatch(r"20\d{2}", w)}
            best, score = None, (0, 0)
            if years:
                for name, t in tour_by_name.items():
                    if name not in goose_tours:
                        continue
                    have = {w for w in re.findall(r"[a-z0-9]+", name) if len(w) > 2 and w not in STOP}
                    if not have or not (have & years):
                        continue
                    overlap = len(want & have)
                    # Precision, not raw overlap: "2023 Fall" matches 2/2 of its
                    # own words, the Dead Set tour only 2/6.
                    prec = overlap / len(have)
                    # Tie-break on raw overlap so the more specific tour wins
                    # ("2022 Fall Taboose" over plain "2022 Fall").
                    if overlap >= 2 and prec >= 0.6 and (prec, overlap) > score:
                        best, score = t, (prec, overlap)
            if best:
                tour = best
                flags.append(f"tour matched fuzzily: {best['tour']!r}")

    if not picked and not tour:
        flags.append("unassigned — no show or tour")
    if not dates:
        flags.append("no parseable event date")

    artists, links = [], []
    for a in r["artists"]:
        name, studio = flip_artist(a)
        link = link_by_name.get(name.lower())
        if not link and studio:
            link = link_by_name.get(studio.lower()) or link_by_name.get(
                re.sub(r"[^a-z0-9]", "", studio.lower())
            )
        if not link:
            link = link_by_name.get(re.sub(r"[^a-z0-9]", "", name.lower()))
        artists.append({"name": name, "link": link or ""})
        if not link:
            links.append(name)
    if links:
        flags.append(f"no instagram link: {', '.join(links)}")

    base = {
        "print_id": r["print_id"],
        "title": r["title"],
        "eb_url": r["url"],
        "class": r["class"],
        "status": r["status"],
        "event": r.get("event"),
        "venues": r.get("venues"),
        "show": [s["show_id"] for s in picked] or None,
        "show_detail": [
            f"{s['show_date']} {s['show_subvenue']} ({s['show_venue_location']})" for s in picked
        ],
        "tour": [tour["tour"]] if tour else None,
        "artist": artists or None,
        "print_run": parse_run(r.get("run")),
        "description": describe(r),
        "editions": r.get("editions"),
        "flags": flags,
    }

    for img in r["images"]:
        records.append(
            {
                **base,
                "id": img["filename"][:-4],
                "image_file": img["filename"],
                "image_path": os.path.join("images", r["print_id"], img["filename"]),
                "image_index": img["index"],
                "image_total": img["total"],
                "width": img["width"],
                "height": img["height"],
                "resolution": f"{img['width']}x{img['height']}",
            }
        )

json.dump(records, open(os.path.join(HERE, "eb-records.json"), "w"), indent=2, ensure_ascii=False)

need = [r for r in records if r["flags"]]
seen = set()
with open(os.path.join(HERE, "eb-review.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["print_id", "title", "event", "venues", "flags", "show_detail", "tour"])
    for r in need:
        if r["print_id"] in seen:
            continue
        seen.add(r["print_id"])
        w.writerow([r["print_id"], r["title"], r["event"], " | ".join(r["venues"] or []),
                    "; ".join(r["flags"]), " | ".join(r["show_detail"]), (r["tour"] or [""])[0]])

lst = {r["print_id"]: r for r in records}
print(f"listings: {len(listings)}  ->  image records: {len(records)}")
print(f"  listings with show:  {sum(1 for r in lst.values() if r['show'])}")
print(f"  listings with tour:  {sum(1 for r in lst.values() if r['tour'] and not r['show'])}")
print(f"  UNASSIGNED:          {sum(1 for r in lst.values() if not r['show'] and not r['tour'])}")
print(f"  print_run set:       {sum(1 for r in lst.values() if r['print_run'] is not None)}")
print(f"  description set:     {sum(1 for r in lst.values() if r['description'])}")
print(f"  artist w/ ig link:   {sum(1 for r in lst.values() if r['artist'] and any(a['link'] for a in r['artist']))}")
print("\nflags (by listing):")
for f, n in Counter(re.sub(r"\d{4}-\d{2}-\d{2}", "<date>", x) for r in lst.values() for x in r["flags"]).most_common(12):
    print(f"  {n:5}  {f[:95]}")

#!/usr/bin/env python3
"""
Turns each scraped Instagram post into a proposed show_posters record.

Deterministic pass only — dates, artist handle, size, and Conscious Alliance are
parsed with rules; show UUIDs are resolved by matching parsed dates against the
cached shows table. Anything the rules can't settle is flagged for review rather
than guessed.

Output: extracted.json  (one entry per post, with a `flags` list)
        extract-review.csv (only the posts needing a human look)
"""

import csv
import glob
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
SCRAPE_DIR = os.environ.get(
    "SCRAPE_DIR", "/Users/watsonbriant/Downloads/****wted/goose_posters"
)

shows = json.load(open(os.path.join(HERE, "shows-cache.json")))
tours = json.load(open(os.path.join(HERE, "tours-cache.json")))
artist_map = json.load(open(os.path.join(HERE, "artist-map.json")))
date_overrides = {
    k: v
    for k, v in json.load(open(os.path.join(HERE, "date-overrides.json"))).items()
    if not k.startswith("_")
}

MONTHS = {
    m: i
    for i, ms in enumerate(
        [
            ("jan", "january"), ("feb", "february"), ("mar", "march"),
            ("apr", "april"), ("may",), ("jun", "june"), ("jul", "july"),
            ("aug", "august"), ("sep", "sept", "september"), ("oct", "october"),
            ("nov", "november"), ("dec", "december"),
        ],
        start=1,
    )
    for m in ms
}
MONTH_RE = "|".join(sorted(MONTHS, key=len, reverse=True))

ART_BY = re.compile(r"[Aa]rt(?:work)?\s+by\s*@([A-Za-z0-9._]+)")
SIZE = re.compile(r"(\d{1,2})\s*[\"”]?\s*[xX×]\s*(\d{1,2})\s*[\"”]?")
CONSCIOUS = re.compile(r"@consciousalliance", re.I)


def yr(y):
    y = int(y)
    return y if y > 100 else 2000 + y


def parse_dates(caption):
    """Return (dates, pattern_name, is_range) for the first date expression found."""
    for line in caption.split("\n"):
        line = line.strip()
        if not line:
            continue

        # 5/7-9/26  or  12/12-13/25   (day range inside one month)
        m = re.search(r"\b(\d{1,2})/(\d{1,2})\s*[-–]\s*(\d{1,2})/(\d{2,4})\b", line)
        if m:
            mo, d1, d2, y = int(m[1]), int(m[2]), int(m[3]), yr(m[4])
            if d1 <= d2:
                return [f"{y}-{mo:02d}-{d:02d}" for d in range(d1, d2 + 1)], "m/d-d/y", True

        # 4/30-5/2/26   (range crossing months)
        m = re.search(r"\b(\d{1,2})/(\d{1,2})\s*[-–]\s*(\d{1,2})/(\d{1,2})/(\d{2,4})\b", line)
        if m:
            y = yr(m[5])
            return (
                [f"{y}-{int(m[1]):02d}-{int(m[2]):02d}", f"{y}-{int(m[3]):02d}-{int(m[4]):02d}"],
                "m/d-m/d/y",
                True,
            )

        # 9/1/24
        m = re.search(r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b", line)
        if m:
            return [f"{yr(m[3])}-{int(m[1]):02d}-{int(m[2]):02d}"], "m/d/y", False

        # Aug. 20-21, 2022
        m = re.search(
            rf"\b({MONTH_RE})\.?\s+(\d{{1,2}})\s*[-–]\s*(\d{{1,2}}),?\s*(\d{{4}})", line, re.I
        )
        if m:
            mo, y = MONTHS[m[1].lower()], int(m[4])
            d1, d2 = int(m[2]), int(m[3])
            if d1 <= d2:
                return [f"{y}-{mo:02d}-{d:02d}" for d in range(d1, d2 + 1)], "Mon d-d, y", True

        # Aug. 16, 2022
        m = re.search(rf"\b({MONTH_RE})\.?\s+(\d{{1,2}}),?\s*(\d{{4}})", line, re.I)
        if m:
            return [f"{int(m[3])}-{MONTHS[m[1].lower()]:02d}-{int(m[2]):02d}"], "Mon d, y", False

    return [], None, False


by_date = defaultdict(list)
for s in shows:
    by_date[s["show_date"]].append(s)

tour_by_name = {t["tour"].lower(): t for t in tours}


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def qualifying(cands):
    """Apply the priority rules: canonid first, then group == Goose.

    A date whose only shows are side projects (no canonid, not Goose) yields
    nothing — attaching a Vasudo set to a Goose poster is worse than leaving the
    poster unlinked for review.
    """
    canon = [c for c in cands if c.get("show_canonid") is not None]
    if canon:
        goose = [c for c in canon if c.get("show_group") == "Goose"]
        return goose or canon, ("canonid+goose" if goose else "canonid")
    goose = [c for c in cands if c.get("show_group") == "Goose"]
    return (goose, "goose-no-canonid") if goose else ([], "none")


def pick_shows(dates, caption, is_range):
    """Resolve dates -> show rows. Ranges are treated as a window: only the days
    that actually have a qualifying show count, since a '6/19-28/20' style caption
    describes a run, not ten consecutive shows."""
    picked, notes = [], []
    matched_days = 0

    for d in dates:
        cands = by_date.get(d, [])
        ranked, how = qualifying(cands)
        if not ranked:
            if not is_range:
                notes.append(
                    f"no show on {d}" if not cands else f"only non-Goose shows on {d}"
                )
            continue

        matched_days += 1
        if how == "goose-no-canonid":
            notes.append(f"no canonid on {d}")

        # Several qualifying shows on one day (e.g. two Goose sets at the same
        # venue) — keep them all rather than picking one arbitrarily.
        if len(ranked) > 1:
            cap = norm(caption)
            hits = [
                c for c in ranked
                if (norm(c.get("show_subvenue")) and norm(c["show_subvenue"]) in cap)
                or (norm(c.get("show_venue_location")) and norm(c["show_venue_location"]) in cap)
            ]
            if hits and len(hits) < len(ranked):
                ranked = hits
            if len(ranked) > 1:
                notes.append(f"{len(ranked)} shows kept on {d}")
        picked += ranked

    if is_range and not matched_days:
        notes.append(f"no qualifying show in range {dates[0]}..{dates[-1]}")
    return picked, notes


def detect_tour(caption):
    low = caption.lower()
    for name, t in tour_by_name.items():
        if name in low:
            return t
    # Captions phrase tours as "UK and Europe Spring Tour 2026" while the tours
    # table stores "2026 Europe Spring" — match on shared significant words.
    m = re.search(r"^(.*\bTour\b.*)$", caption, re.M)
    if m:
        STOP = {"tour", "the", "and", "of", "past", "poster"}
        want = {w for w in re.findall(r"[a-z0-9]+", m.group(1).lower()) if w not in STOP}
        best, score = None, 0
        for name, t in tour_by_name.items():
            have = {w for w in re.findall(r"[a-z0-9]+", name) if w not in STOP}
            overlap = len(want & have)
            if overlap > score and overlap >= 2:
                best, score = t, overlap
        if best:
            return best
    m = re.search(r"^(.*\bTour\b.*\d{4}|\b\d{4}\b.*\bTour\b.*)$", caption, re.M)
    return {"tour_id": None, "tour": m.group(1).strip()} if m else None


records = []
for path in sorted(glob.glob(os.path.join(SCRAPE_DIR, "*.json"))):
    base = os.path.basename(path)[:-5]
    # instaloader also drops a profile-metadata json in the folder; skip it.
    if not re.match(r"^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_UTC$", base):
        continue
    node = json.load(open(path))["node"]
    edges = node.get("edge_media_to_caption", {}).get("edges", [])
    caption = edges[0]["node"]["text"] if edges else ""
    images = sorted(glob.glob(os.path.join(SCRAPE_DIR, base + ".jpg"))) + sorted(
        glob.glob(os.path.join(SCRAPE_DIR, base + "_*.jpg"))
    )

    flags = []
    if base in date_overrides:
        dates, pattern, is_range = date_overrides[base], "override", len(date_overrides[base]) > 1
    else:
        dates, pattern, is_range = parse_dates(caption)
        # Two-digit years like "6/23/34" are caption typos, not shows in 2034.
        implausible = [d for d in dates if not (2014 <= int(d[:4]) <= 2027)]
        if implausible:
            flags.append(f"implausible year: {implausible[0]}")
            dates = []
    picked, notes = pick_shows(dates, caption, is_range) if dates else ([], [])
    flags += notes

    tour = None
    if not picked:
        tour = detect_tour(caption)
        if tour and not tour["tour_id"]:
            flags.append("tour name not in tours table")

    m = ART_BY.search(caption)
    handle = m.group(1).lower().rstrip(".") if m else None
    artist = None
    if handle:
        a = artist_map.get(handle)
        artist = [{"name": a["name"], "link": a["link"]}] if a else None
        if not a:
            flags.append(f"artist @{handle} not in map")
    else:
        flags.append("no artist credited")

    desc_parts = []
    sm = SIZE.search(caption)
    if sm:
        desc_parts.append(f'{sm[1]}"x{sm[2]}"')
    if CONSCIOUS.search(caption):
        desc_parts.append("Conscious Alliance")

    if not caption.strip():
        flags.append("no caption")
    elif not dates and not tour:
        flags.append("no date or tour found")
    if not images:
        flags.append("no images")

    records.append(
        {
            "base": base,
            "caption": caption,
            "images": [os.path.basename(i) for i in images],
            "date_pattern": pattern,
            "dates": dates,
            "show": [s["show_id"] for s in picked] or None,
            "show_detail": [
                f"{s['show_date']} {s.get('show_subvenue')} ({s.get('show_venue_location')})"
                for s in picked
            ],
            "tour": [tour["tour"]] if tour else None,
            "tour_id": tour["tour_id"] if tour else None,
            "artist": artist,
            "print_run": None,
            "description": "\n".join(desc_parts) or None,
            "flags": flags,
        }
    )

json.dump(records, open(os.path.join(HERE, "extracted.json"), "w"), indent=2, ensure_ascii=False)

need = [r for r in records if r["flags"]]
with open(os.path.join(HERE, "extract-review.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["base", "flags", "caption", "dates", "show_detail", "tour", "images"])
    for r in need:
        w.writerow([
            r["base"], "; ".join(r["flags"]), r["caption"].replace("\n", " / "),
            ",".join(r["dates"]), " | ".join(r["show_detail"]),
            (r["tour"] or [""])[0], ",".join(r["images"]),
        ])

print(f"posts:            {len(records)}")
print(f"images:           {sum(len(r['images']) for r in records)}")
print(f"resolved to show: {sum(1 for r in records if r['show'])}")
print(f"resolved to tour: {sum(1 for r in records if r['tour'] and not r['show'])}")
print(f"neither:          {sum(1 for r in records if not r['show'] and not r['tour'])}")
print(f"clean (no flags): {len(records) - len(need)}")
print(f"need review:      {len(need)}\n")
print("date patterns:", dict(Counter(r["date_pattern"] for r in records)))
print("\nflag counts:")
for f, n in Counter(re.sub(r"\d{4}-\d{2}-\d{2}", "<date>", f) for r in records for f in r["flags"]).most_common():
    print(f"  {n:4}  {f}")

#!/usr/bin/env python3
"""
Builds the grouping that drives the comparison UI: for every show and tour,
the posters already in the database alongside the Expresso Beans candidates
that resolved to it.

A poster spanning two shows appears under both — decisions are keyed by poster
id, not by group, so seeing it twice is harmless.

Output: compare-groups.json
"""

import json
import os
import struct
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
EB_DIR = os.environ.get("EB_DIR", "/Users/watsonbriant/eb/eb_goose")
CROP_DIR = os.environ.get(
    "SCRAPE_DIR", "/Users/watsonbriant/Downloads/****wted/goose_posters"
)

existing = json.load(open(os.path.join(HERE, "show-posters-cache.json")))
cands = json.load(open(os.path.join(HERE, "eb-records.json")))
shows = {s["show_id"]: s for s in json.load(open(os.path.join(HERE, "shows-cache.json")))}


def jpeg_size(path):
    """Width/height straight out of the JPEG SOF marker — no dependencies."""
    try:
        with open(path, "rb") as f:
            if f.read(2) != b"\xff\xd8":
                return None
            while True:
                b = f.read(1)
                while b and b != b"\xff":
                    b = f.read(1)
                marker = f.read(1)
                while marker == b"\xff":
                    marker = f.read(1)
                if not marker:
                    return None
                if marker[0] in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                                 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    f.read(3)
                    h, w = struct.unpack(">HH", f.read(4))
                    return w, h
                (seglen,) = struct.unpack(">H", f.read(2))
                f.seek(seglen - 2, 1)
    except Exception:
        return None


# Existing rows: dimensions come from the local crop that was uploaded.
for e in existing:
    fname = e["image"].rsplit("/", 1)[-1]
    dims = jpeg_size(os.path.join(CROP_DIR, fname))
    e["image_file"] = fname
    e["width"], e["height"] = dims or (None, None)
    e["resolution"] = f"{dims[0]}x{dims[1]}" if dims else "unknown"
    e["source"] = "database"

for c in cands:
    c["source"] = "expressobeans"

groups = defaultdict(lambda: {"existing": [], "candidates": []})


def show_key(sid):
    s = shows.get(sid)
    if not s:
        return f"show:{sid}", f"(unknown show {sid})", "9999"
    return (
        f"show:{sid}",
        f"{s['show_date']} — {s['show_subvenue']} ({s['show_venue_location']})",
        s["show_date"],
    )


def place(rec, bucket):
    keys = []
    for sid in rec.get("show") or []:
        keys.append(show_key(sid))
    for t in rec.get("tour") or []:
        keys.append((f"tour:{t}", f"TOUR — {t}", t[:4] if t[:4].isdigit() else "0000"))
    if not keys:
        keys = [("unassigned", "UNASSIGNED — needs manual mapping", "zzzz")]
    for key, label, sortk in keys:
        g = groups[key]
        g["key"], g["label"], g["sort"] = key, label, sortk
        g["type"] = key.split(":")[0]
        g[bucket].append(rec)


for e in existing:
    place(e, "existing")
for c in cands:
    place(c, "candidates")

out = sorted(groups.values(), key=lambda g: (g["type"] != "show", g["sort"], g["label"]))
json.dump(out, open(os.path.join(HERE, "compare-groups.json"), "w"), indent=2, ensure_ascii=False)

both = [g for g in out if g["existing"] and g["candidates"]]
only_new = [g for g in out if not g["existing"] and g["candidates"]]
only_old = [g for g in out if g["existing"] and not g["candidates"]]
print(f"groups: {len(out)}")
print(f"  with existing AND candidates: {len(both)}   <- the real comparison work")
print(f"  candidates only:              {len(only_new)}")
print(f"  existing only:                {len(only_old)}")
print(f"\nexisting rows placed:   {sum(len(g['existing']) for g in out)} (from {len(existing)})")
print(f"candidate images placed:{sum(len(g['candidates']) for g in out)} (from {len(cands)})")
un = next((g for g in out if g["key"] == "unassigned"), None)
if un:
    print(f"\nunassigned: {len(un['candidates'])} candidate images, {len(un['existing'])} existing")
nodim = sum(1 for e in existing if not e["width"])
if nodim:
    print(f"warning: {nodim} existing rows had no local crop to measure")

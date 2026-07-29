#!/usr/bin/env python3
"""
Fans extracted.json (one entry per Instagram post) out to records.json
(one entry per cropped image) — the unit of import for show_posters.

Each record gets a stable uuid now so the storage path and the eventual row
agree, and so review decisions survive re-runs of this script.
"""

import json
import os
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "records.json")

posts = json.load(open(os.path.join(HERE, "extracted.json")))

# Keep uuids stable across re-runs so review-state.json keys stay valid.
existing = {}
if os.path.exists(OUT):
    existing = {r["id"]: r["uuid"] for r in json.load(open(OUT))}

records = []
for p in posts:
    for i, img in enumerate(p["images"]):
        rid = img[:-4]  # image filename without .jpg
        records.append(
            {
                "id": rid,
                "uuid": existing.get(rid) or str(uuid.uuid4()),
                "base": p["base"],
                "image_file": img,
                "image_index": i + 1,
                "image_count": len(p["images"]),
                "show": p["show"],
                "show_detail": p["show_detail"],
                "tour": p["tour"],
                "tour_id": p["tour_id"],
                "artist": p["artist"],
                "print_run": None,
                "description": p["description"],
                "caption": p["caption"],
                "flags": p["flags"],
            }
        )

json.dump(records, open(OUT, "w"), indent=2, ensure_ascii=False)
print(f"{len(posts)} posts -> {len(records)} image records")
print(f"  with show:  {sum(1 for r in records if r['show'])}")
print(f"  with tour:  {sum(1 for r in records if r['tour'] and not r['show'])}")
print(f"  neither:    {sum(1 for r in records if not r['show'] and not r['tour'])}")
print(f"  flagged:    {sum(1 for r in records if r['flags'])}")
print(f"wrote {OUT}")

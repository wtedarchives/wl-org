#!/usr/bin/env python3
"""
Builds handle -> {name, link} for every "Art by @handle" credited in the
goose_posters scrape.

Names come from two places, in priority order:
  1. `full_name` on Instagram tagged-user nodes already present in the scraped
     json (free, no network).
  2. Manual/fetched fill-in via an overrides file.

Output: artist-map.json  { "<handle>": {"name": ..., "link": ..., "source": ...} }
Unresolved handles are written with name=null so they're easy to work through.
"""

import json
import glob
import os
import re
import sys
from collections import Counter

SCRAPE_DIR = os.environ.get(
    "SCRAPE_DIR", "/Users/watsonbriant/Downloads/****wted/goose_posters"
)
OUT = os.path.join(os.path.dirname(__file__), "artist-map.json")
OVERRIDES = os.path.join(os.path.dirname(__file__), "artist-overrides.json")

ART_BY = re.compile(r"[Aa]rt(?:work)?\s+by\s*@([A-Za-z0-9._]+)")


def clean(handle):
    return handle.lower().rstrip(".")


def load_posts():
    posts = []
    for path in sorted(glob.glob(os.path.join(SCRAPE_DIR, "*.json"))):
        with open(path) as fh:
            node = json.load(fh)["node"]
        edges = node.get("edge_media_to_caption", {}).get("edges", [])
        posts.append(
            {
                "base": os.path.basename(path)[:-5],
                "caption": edges[0]["node"]["text"] if edges else "",
                "tagged": [
                    e["node"]["user"]
                    for e in node.get("edge_media_to_tagged_user", {}).get("edges", [])
                ],
            }
        )
    return posts


def main():
    posts = load_posts()

    # Every full_name Instagram handed us in the scrape, from any post.
    names_from_tags = {}
    for p in posts:
        for u in p["tagged"]:
            uname, full = clean(u.get("username") or ""), (u.get("full_name") or "").strip()
            if uname and full:
                names_from_tags.setdefault(uname, full)

    credits = Counter()
    for p in posts:
        m = ART_BY.search(p["caption"])
        if m:
            credits[clean(m.group(1))] += 1

    overrides = {}
    if os.path.exists(OVERRIDES):
        overrides = {clean(k): v for k, v in json.load(open(OVERRIDES)).items()}

    artist_map = {}
    for handle, count in sorted(credits.items()):
        if handle in overrides and overrides[handle]:
            name, source = overrides[handle], "override"
        elif handle in names_from_tags:
            name, source = names_from_tags[handle], "instagram_tag"
        else:
            name, source = None, "unresolved"
        artist_map[handle] = {
            "name": name,
            "link": f"https://www.instagram.com/{handle}/",
            "source": source,
            "poster_count": count,
        }

    with open(OUT, "w") as fh:
        json.dump(artist_map, fh, indent=2, ensure_ascii=False, sort_keys=True)

    resolved = [h for h, v in artist_map.items() if v["name"]]
    unresolved = [h for h, v in artist_map.items() if not v["name"]]
    by_source = Counter(v["source"] for v in artist_map.values())

    print(f"posts scanned:        {len(posts)}")
    print(f"distinct artists:     {len(artist_map)}")
    print(f"  resolved:           {len(resolved)}  {dict(by_source)}")
    print(f"  unresolved:         {len(unresolved)}")
    print(f"\nwrote {OUT}")
    if unresolved:
        covered = sum(artist_map[h]["poster_count"] for h in unresolved)
        print(f"\n{len(unresolved)} handles need names ({covered} posters affected):")
        for h in sorted(unresolved, key=lambda x: -artist_map[x]["poster_count"]):
            print(f"  {artist_map[h]['poster_count']:3}  @{h}")


if __name__ == "__main__":
    sys.exit(main())

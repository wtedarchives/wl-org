#!/usr/bin/env python3
"""
Fills in display names for handles that build-artist-map.py couldn't resolve
from the scrape, via Instagram's public web_profile_info endpoint.

Writes artist-overrides.json (handle -> name), which build-artist-map.py picks
up on its next run. Re-running only fetches handles still missing, so it's safe
to stop and resume.

Usage: python3 scripts/posters/fetch-artist-names.py [--delay 3]
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(__file__)
MAP = os.path.join(HERE, "artist-map.json")
OVERRIDES = os.path.join(HERE, "artist-overrides.json")

API = "https://www.instagram.com/api/v1/users/web_profile_info/?username={}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "x-ig-app-id": "936619743392459",
}

delay = 3.0
if "--delay" in sys.argv:
    delay = float(sys.argv[sys.argv.index("--delay") + 1])


def fetch(handle):
    req = urllib.request.Request(API.format(handle), headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        user = json.load(r)["data"]["user"]
    if not user:
        return None, "no_such_user"
    name = (user.get("full_name") or "").strip()
    return (name or None), ("ok" if name else "no_full_name")


artist_map = json.load(open(MAP))
overrides = json.load(open(OVERRIDES)) if os.path.exists(OVERRIDES) else {}

todo = [h for h, v in artist_map.items() if not v["name"] and not overrides.get(h)]
print(f"{len(todo)} handles to fetch, {delay}s apart\n")

stats = {"ok": 0, "no_full_name": 0, "no_such_user": 0, "error": 0}
for i, handle in enumerate(todo, 1):
    try:
        name, status = fetch(handle)
    except urllib.error.HTTPError as e:
        name, status = None, f"http_{e.code}"
    except Exception as e:  # network hiccup, DNS, timeout
        name, status = None, f"error:{type(e).__name__}"

    stats[status if status in stats else "error"] = (
        stats.get(status if status in stats else "error", 0) + 1
    )
    if name:
        overrides[handle] = name
    print(f"  [{i:>3}/{len(todo)}] @{handle:<32} {name or '— ' + status}")

    # Persist as we go so a rate-limit stop doesn't lose progress.
    with open(OVERRIDES, "w") as fh:
        json.dump(overrides, fh, indent=2, ensure_ascii=False, sort_keys=True)

    # 400s are per-account quirks on Instagram's side; only real throttling
    # (429) or an auth wall (401/403) is worth aborting the run for.
    if status in ("http_429", "http_401", "http_403"):
        print(f"\n  Throttled/blocked ({status}) — stopping. Re-run later to resume.")
        break
    if i < len(todo):
        time.sleep(delay)

print(f"\n{stats}")
print(f"wrote {OVERRIDES} ({len(overrides)} names)")
print("\nNow re-run: python3 scripts/posters/build-artist-map.py")

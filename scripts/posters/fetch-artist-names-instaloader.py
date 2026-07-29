#!/usr/bin/env python3
"""
Same job as fetch-artist-names.py, but goes through instaloader with a logged-in
session instead of the anonymous web endpoint — far less likely to get blocked.

Requires a one-time login first:
    instaloader --login <your_ig_username>

Run with the pipx venv python that has instaloader installed:
    "$HOME/Library/Application Support/pipx/venvs/instaloader/bin/python" \
        scripts/posters/fetch-artist-names-instaloader.py --user <your_ig_username>

Resumable: only fetches handles still missing a name, saves after each one.
"""

import json
import os
import sys
import time

import instaloader

HERE = os.path.dirname(os.path.abspath(__file__))
MAP = os.path.join(HERE, "artist-map.json")
OVERRIDES = os.path.join(HERE, "artist-overrides.json")


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


ig_user = arg("--user")
delay = float(arg("--delay", 4))
if not ig_user:
    sys.exit("need --user <your_ig_username> (the account you logged in with)")

L = instaloader.Instaloader(
    quiet=True, download_pictures=False, download_videos=False,
    download_comments=False, save_metadata=False,
)
try:
    L.load_session_from_file(ig_user)
except FileNotFoundError:
    sys.exit(f"no saved session for '{ig_user}'. Run:  instaloader --login {ig_user}")

artist_map = json.load(open(MAP))
overrides = json.load(open(OVERRIDES)) if os.path.exists(OVERRIDES) else {}
todo = [h for h, v in artist_map.items() if not v["name"] and not overrides.get(h)]

print(f"session: {ig_user} | {len(todo)} handles to fetch, {delay}s apart\n")

stats = {"ok": 0, "no_name": 0, "missing": 0, "error": 0}
for i, handle in enumerate(todo, 1):
    try:
        p = instaloader.Profile.from_username(L.context, handle)
        name = (p.full_name or "").strip()
        if name:
            overrides[handle], status = name, "ok"
        else:
            status = "no_name"
    except instaloader.exceptions.ProfileNotExistsException:
        name, status = None, "missing"
    except Exception as e:
        name, status = None, "error"
        print(f"       ({type(e).__name__}: {e})")

    stats[status] += 1
    print(f"  [{i:>3}/{len(todo)}] @{handle:<32} {overrides.get(handle) or '— ' + status}")

    with open(OVERRIDES, "w") as fh:
        json.dump(overrides, fh, indent=2, ensure_ascii=False, sort_keys=True)
    if i < len(todo):
        time.sleep(delay)

print(f"\n{stats}\nwrote {OVERRIDES} ({len(overrides)} names)")
print("\nNow re-run: python3 scripts/posters/build-artist-map.py")

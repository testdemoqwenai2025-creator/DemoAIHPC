#!/usr/bin/env python3
"""
add-share-button.py — Phase 29 patch.

Adds the 🔗 Share button to the existing animated-derivation
controls row on every page that already has anim-record.
Idempotent.
"""
import os
import re

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
DOCS = os.path.join(ROOT, "docs")

SHARE_BUTTON = (
    '            <button class="anim-share" style="background: var(--bg-elevated-2, #1a2133); '
    'border: 1px solid var(--border-strong, #2a3548); color: var(--text, #f3f4f6); '
    'padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" '
    'title="Phase 29 — captures the current frame as a PNG snapshot + copies a shareable URL with the current timestamp. '
    'Visiting the URL auto-resumes the clip at that timestamp.">🔗 Share</button>'
)

# Pattern: insert the Share button right after the anim-record button
PAT = re.compile(
    r'(<button class="anim-record"[^>]*>⬇ Record WebM</button>)'
)

patched = 0
skipped = 0
for dirpath, _, files in os.walk(DOCS):
    if "archive" in dirpath:
        continue
    for fname in files:
        if not fname.endswith(".html"):
            continue
        path = os.path.join(dirpath, fname)
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        if "anim-share" in s:
            skipped += 1
            continue
        # Only patch pages that have the anim-record button
        if 'class="anim-record"' not in s:
            continue
        new_s, n = PAT.subn(lambda m: m.group(1) + "\n" + SHARE_BUTTON, s)
        if n > 0:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_s)
            patched += 1
            rel = os.path.relpath(path, DOCS)
            print(f"  ✓ patched: {rel}")

print(f"\nPatched: {patched} | Skipped (already): {skipped}")

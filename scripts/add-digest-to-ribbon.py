#!/usr/bin/env python3
"""
add-digest-to-ribbon.py — Phase 25 batch script.

Inserts a "Weekly Science Digest" link as the FIRST entry in the
Insights dropdown across every page that has one. Idempotent:
re-running on already-patched pages is a no-op.

Run:
    python3 scripts/add-digest-to-ribbon.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")

PAGES = []
for dirpath, _, files in os.walk(DOCS):
    for f in files:
        if f.endswith(".html"):
            PAGES.append(os.path.join(dirpath, f))

DIGEST_LINK = '<a href="digest.html">Weekly Science Digest</a>'
DIGEST_LINK_DEEP = '<a href="../digest.html">Weekly Science Digest</a>'

patched = 0
skipped = 0
for path in sorted(PAGES):
    with open(path, "r", encoding="utf-8") as f:
        html_content = f.read()
    # Skip if already patched
    if "Weekly Science Digest" in html_content:
        skipped += 1
        continue
    # Find the Insights dropdown menu
    # Pattern: <summary>Insights</summary><div class="ribbon-menu">...
    # The first <a href=...>...</a> inside is the first entry.
    # We want to insert our link BEFORE the first existing entry.
    # But the digest link's relative path depends on the page's depth.
    rel = os.path.relpath(path, DOCS)
    is_deep = (os.sep in rel)  # subdirectory page
    link = DIGEST_LINK_DEEP if is_deep else DIGEST_LINK

    # Pattern: <summary>Insights</summary><div class="ribbon-menu"><a href="dashboard.html">...
    # Match the start of the menu and insert our link as the first child.
    pat = re.compile(
        r'(<summary>Insights</summary><div class="ribbon-menu">)(<a href=)'
    )
    new_html, n = pat.subn(rf'\1{link}\2', html_content)
    if n == 0:
        # Try a variant: maybe there's a space or different class
        pat2 = re.compile(
            r'(<summary>Insights</summary>\s*<div class="ribbon-menu">)(\s*<a href=)'
        )
        new_html, n = pat2.subn(rf'\1{link}\2', html_content)
    if n > 0:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_html)
        patched += 1
        print(f"  ✓ patched: {rel}")
    else:
        print(f"  ⚠ no Insights dropdown: {rel}")

print()
print(f"Patched: {patched} | Skipped (already had it): {skipped} | Total: {len(PAGES)}")

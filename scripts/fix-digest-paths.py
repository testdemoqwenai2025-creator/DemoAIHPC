#!/usr/bin/env python3
"""
fix-digest-paths.py — Phase 25 patch.

Fixes the relative path to digest.html on /science/<domain>/<topic>.html
pages (2 levels deep). The original batch script add-digest-to-ribbon.py
used '../digest.html' for ALL subdirectory pages, which is wrong for
2-deep pages (resolves to /science/digest.html, not /digest.html).
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")

# 2-deep pages: /science/<domain>/<topic>.html — needs ../../digest.html
TWO_DEEP_DIRS = [
    ("science", "biology"),
    ("science", "chemistry"),
    ("science", "maths"),
    ("science", "physics"),
]

patched = 0
for parts in TWO_DEEP_DIRS:
    dirpath = os.path.join(DOCS, *parts)
    if not os.path.isdir(dirpath):
        continue
    for fname in sorted(os.listdir(dirpath)):
        if not fname.endswith(".html"):
            continue
        path = os.path.join(dirpath, fname)
        with open(path, "r", encoding="utf-8") as f:
            html_content = f.read()
        # Find the existing (incorrect) link and replace it
        old = '<a href="../digest.html">Weekly Science Digest</a>'
        new = '<a href="../../digest.html">Weekly Science Digest</a>'
        if old in html_content:
            new_html = html_content.replace(old, new)
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_html)
            patched += 1
            rel = os.path.relpath(path, DOCS)
            print(f"  ✓ fixed: {rel}")

print(f"\nFixed: {patched} pages")

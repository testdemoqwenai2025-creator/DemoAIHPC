#!/usr/bin/env python3
"""
add-audit-to-ribbon.py — Phase 28 batch script.

Adds a "📊 Audit Dashboard" link as the SECOND entry in the Insights
dropdown across every page that has one. Idempotent.
"""
import os
import re

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
DOCS = os.path.join(ROOT, "docs")

# Pages to scan: every HTML file under /docs EXCEPT archived issues
# (those have <base href> tags + should remain historical snapshots)
PAGES = []
for dirpath, _, files in os.walk(DOCS):
    if "archive" in dirpath:
        continue
    for f in files:
        if f.endswith(".html"):
            PAGES.append(os.path.join(dirpath, f))

patched = 0
skipped = 0
for path in sorted(PAGES):
    with open(path, "r", encoding="utf-8") as f:
        html_content = f.read()
    if "Audit Dashboard" in html_content:
        skipped += 1
        continue
    rel = os.path.relpath(path, DOCS)
    is_deep = (os.sep in rel)
    # Use the same depth-resolution logic as add-digest-to-ribbon.py
    # For root pages: audit.html
    # For /concepts/* and /demos/*: ../audit.html
    # For /science/<domain>/*: ../../audit.html
    parts = rel.split(os.sep)
    if len(parts) == 1:
        link = '<a href="audit.html">📊 Audit Dashboard</a>'
    elif len(parts) == 2:
        link = '<a href="../audit.html">📊 Audit Dashboard</a>'
    elif len(parts) == 3:
        link = '<a href="../../audit.html">📊 Audit Dashboard</a>'
    else:
        link = '<a href="' + "../" * (len(parts) - 1) + 'audit.html">📊 Audit Dashboard</a>'
    # Find the Insights dropdown menu and insert after the Weekly Digest link
    # Pattern: <summary>Insights</summary><div class="ribbon-menu"><a href="...digest.html">Weekly Science Digest</a>
    pat = re.compile(r'(<summary>Insights</summary><div class="ribbon-menu"><a href="[^"]*digest[^"]*">Weekly Science Digest</a>)')
    new_html, n = pat.subn(rf'\1{link}', html_content)
    if n == 0:
        # Maybe the page doesn't have Weekly Digest — try inserting as the first entry
        pat2 = re.compile(r'(<summary>Insights</summary><div class="ribbon-menu">)(<a href=)')
        new_html, n = pat2.subn(rf'\1{link}\2', html_content)
    if n > 0:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_html)
        patched += 1
        print(f"  ✓ patched: {rel}")
    else:
        # Page doesn't have Insights dropdown — skip silently
        pass

print(f"\nPatched: {patched} | Skipped: {skipped} | Total: {len(PAGES)}")

#!/usr/bin/env python3
"""
fix-concept-ribbons.py — Phase 26 patch.

Several older concept cards (concepts.html + 4 sub-pages) only have
Platform + Insights dropdowns in their ribbon — they're missing
AETHEL Suite and Science. This script inserts the two missing
dropdowns between Platform and Insights on each affected page.

Idempotent.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")

# Pages that need the fix (root-level + concepts sub-pages)
TARGETS = [
    "concepts.html",
    "concepts/audience-annotations.html",
    "concepts/cross-domain-graph.html",
    "concepts/provenance-first.html",
    "concepts/replayable-decision-traces.html",
]

# AETHEL Suite + Science dropdowns (root-level relative path)
DROPDOWNS_ROOT = '<details class="ribbon-dropdown"><summary>AETHEL Suite</summary><div class="ribbon-menu"><a href="aethel.html">AETHEL Connector</a><a href="connectors.html">Scientific Connectors Hub</a><a href="query.html">Query Executor</a><a href="graph.html">Knowledge Graph</a><a href="workflows.html">Domain Workflows</a></div></details><details class="ribbon-dropdown"><summary>Science</summary><div class="ribbon-menu"><a href="science-biology.html">Biology Hub</a><a href="science-chemistry.html">Chemistry Hub</a><a href="science-physics.html">Physics Hub</a><a href="science-maths.html">Mathematics Hub</a><a href="science-bioinformatics.html">Bioinformatics</a><a href="science-cheminformatics.html">Cheminformatics</a></div></details>'
# Sub-page relative path (../ prefix)
DROPDOWNS_DEEP = '<details class="ribbon-dropdown"><summary>AETHEL Suite</summary><div class="ribbon-menu"><a href="../aethel.html">AETHEL Connector</a><a href="../connectors.html">Scientific Connectors Hub</a><a href="../query.html">Query Executor</a><a href="../graph.html">Knowledge Graph</a><a href="../workflows.html">Domain Workflows</a></div></details><details class="ribbon-dropdown"><summary>Science</summary><div class="ribbon-menu"><a href="../science-biology.html">Biology Hub</a><a href="../science-chemistry.html">Chemistry Hub</a><a href="../science-physics.html">Physics Hub</a><a href="../science-maths.html">Mathematics Hub</a><a href="../science-bioinformatics.html">Bioinformatics</a><a href="../science-cheminformatics.html">Cheminformatics</a></div></details>'

patched = 0
skipped = 0
for rel in TARGETS:
    path = os.path.join(DOCS, rel)
    if not os.path.isfile(path):
        print(f"  ⚠ missing: {rel}")
        continue
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()
    # Already has AETHEL Suite? skip
    if "<summary>AETHEL Suite</summary>" in s:
        skipped += 1
        print(f"  - already patched: {rel}")
        continue
    # Insert AETHEL Suite + Science BETWEEN Platform and Insights
    # Pattern: </div></details>  (end of Platform)  <details...Insights
    is_subpage = "/" in rel
    dropdowns = DROPDOWNS_DEEP if is_subpage else DROPDOWNS_ROOT
    pat = re.compile(r'(</div></details>)(\s*<details class="ribbon-dropdown"><summary>Insights</summary>)')
    new_s, n = pat.subn(rf'\1{dropdowns}\2', s, count=1)
    if n == 0:
        print(f"  ⚠ could not find insertion point: {rel}")
        continue
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_s)
    patched += 1
    print(f"  ✓ patched: {rel}")

print(f"\nPatched: {patched} | Skipped: {skipped}")

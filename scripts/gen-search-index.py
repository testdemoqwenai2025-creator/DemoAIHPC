#!/usr/bin/env python3
"""Phase 54: Generate a unified search index (docs/search-index.json) by
walking every HTML file under docs/, extracting title + description +
first heading + category. The search.html page fetches this JSON and
performs client-side fuzzy search.

Categories: Platform / Visualiser / Science Hub / Concept Card /
ML Demo / Feed Entry / Digest Issue / Meta Page
"""
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(REPO, "docs")
OUT_PATH = os.path.join(DOCS, "search-index.json")


def extract_meta(filepath, rel_path):
    """Extract title + description + h1 + category from an HTML file."""
    with open(filepath, "r", encoding="utf-8") as f:
        s = f.read()
    title = None
    desc = None
    h1 = None
    # Title
    m = re.search(r'<title>([^<]+)</title>', s)
    if m:
        title = m.group(1).strip()
    # Meta description
    m = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', s, re.IGNORECASE)
    if m:
        desc = m.group(1).strip()
    # First H1
    m = re.search(r'<h1[^>]*>([^<]+)</h1>', s)
    if m:
        h1 = m.group(1).strip()
    # Category
    cat = "Page"
    if rel_path.startswith("concepts/ml-"):
        cat = "ML Concept Card"
    elif rel_path.startswith("concepts/digest-"):
        cat = "Digest Concept Card"
    elif rel_path.startswith("concepts/"):
        cat = "Platform Concept Card"
    elif rel_path.startswith("science/"):
        cat = "Science Sub-page"
    elif rel_path.startswith("demos/"):
        cat = "Demo"
    elif rel_path.startswith("digest/archive/"):
        cat = "Digest Issue"
    elif rel_path in ("lab.html", "ai-lab.html", "cloud-lab.html"):
        cat = "Lab"
    elif rel_path in ("feeds.html",):
        cat = "Feeds"
    elif rel_path in ("concepts.html",):
        cat = "Concepts Index"
    elif rel_path in ("404.html",):
        cat = "404 Page"
    elif rel_path in ("audit.html", "timeline.html", "retrospective.html",
                      "component-registry.html", "roadmap.html"):
        cat = "Meta Page"
    elif rel_path in ("playground.html", "quantum-shorts.html", "bloch.html",
                      "medical-atlas.html"):
        cat = "Visualiser"
    elif rel_path.startswith("science-"):
        cat = "Science Hub"
    # Build searchable text
    text = " ".join(filter(None, [title, desc, h1])).lower()
    return {
        "url": rel_path,
        "title": title or h1 or rel_path,
        "description": desc or "",
        "category": cat,
        "text": text,
    }


def main():
    entries = []
    for dirpath, _, files in os.walk(DOCS):
        for fn in sorted(files):
            if not fn.endswith(".html"):
                continue
            fp = os.path.join(dirpath, fn)
            rel = os.path.relpath(fp, DOCS).replace(os.sep, "/")
            # Skip archive index (not useful in search)
            if rel == "digest/archive/index.html":
                continue
            if rel == "concepts/digest-index.html":
                continue
            try:
                entry = extract_meta(fp, rel)
                entries.append(entry)
            except Exception:
                pass
    # Sort by category then title
    entries.sort(key=lambda e: (e["category"], e["title"]))
    output = {
        "generated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat().replace("+00:00", "Z"),
        "total_entries": len(entries),
        "categories": sorted(set(e["category"] for e in entries)),
        "entries": entries,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Written: {OUT_PATH} ({len(entries)} entries, {os.path.getsize(OUT_PATH):,} bytes)")
    # Print category summary
    from collections import Counter
    cats = Counter(e["category"] for e in entries)
    for cat, n in cats.most_common():
        print(f"  {cat}: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Phase 51: Auto-generate docs/concepts.html as a proper browsable index
of ALL concept cards under docs/concepts/.

Previously, docs/concepts.html was a placeholder that linked to only ~6
hand-picked "platform concept" cards (provenance-chain, lazy-evaluation,
etc.) and ignored the 120+ auto-generated ml-* and digest-* cards. This
meant 126 cards were effectively undiscoverable from the platform's main
navigation.

This generator walks every *.html file under docs/concepts/, extracts
metadata (title, description, category), and renders a unified index
page with:
- Category chips (ML / Digest / Quantum / Platform / Other)
- Searchable filter input (client-side, no backend)
- Card grid with title + description + category badge
- Link back to home + science hubs

Idempotent: regenerates the same output every time. Re-runs in CI.
"""
import html as html_mod
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONCEPTS_DIR = os.path.join(REPO, "docs", "concepts")
OUT_PATH = os.path.join(REPO, "docs", "concepts.html")


def extract_metadata(filepath):
    """Extract title + description + h1 from a concept card HTML file."""
    with open(filepath, "r", encoding="utf-8") as f:
        s = f.read()
    title = None
    desc = None
    h1 = None
    m = re.search(r'<title>([^<]+)</title>', s)
    if m:
        title = m.group(1).strip()
    m = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', s, re.IGNORECASE)
    if m:
        desc = m.group(1).strip()
    m = re.search(r'<h1[^>]*>([^<]+)</h1>', s)
    if m:
        h1 = m.group(1).strip()
    return title, desc, h1


def categorize(filename):
    """Categorize a concept card by filename prefix."""
    if filename.startswith("ml-"):
        return ("ML", "#06b6d4", "Machine Learning — loss functions, activations, optimisers, normalisation, attention")
    if filename.startswith("digest-"):
        return ("Digest", "#8b5cf6", "Weekly Science Digest — curated articles with Math→Code derivations")
    if filename.startswith("fock-"):
        return ("Quantum", "#ec4899", "Quantum mechanics — second quantisation, Fock states")
    if filename in ("provenance-chain.html", "provenance-first.html", "lazy-evaluation.html",
                    "cross-domain-graph.html", "audience-annotations.html",
                    "replayable-decision-traces.html"):
        return ("Platform", "#f59e0b", "Platform concept — architectural pattern or design principle")
    return ("Other", "#9ca3af", "Other concept card")


def main():
    if not os.path.isdir(CONCEPTS_DIR):
        print(f"ERROR: {CONCEPTS_DIR} does not exist", file=sys.stderr)
        return 1

    cards = []
    for fn in sorted(os.listdir(CONCEPTS_DIR)):
        if not fn.endswith(".html"):
            continue
        if fn in ("index.html", "digest-index.html"):
            continue  # skip sub-index pages
        fp = os.path.join(CONCEPTS_DIR, fn)
        title, desc, h1 = extract_metadata(fp)
        cat, color, cat_desc = categorize(fn)
        cards.append({
            "filename": fn,
            "title": title or h1 or fn[:-5],
            "description": desc or "",
            "category": cat,
            "color": color,
            "category_desc": cat_desc,
        })

    print(f"Indexed {len(cards)} concept cards from {CONCEPTS_DIR}")

    # Build the HTML page
    cards_json = []
    for c in cards:
        cards_json.append({
            "filename": c["filename"],
            "title": c["title"],
            "description": c["description"],
            "category": c["category"],
            "color": c["color"],
        })

    # Group counts
    from collections import Counter
    cat_counts = Counter(c["category"] for c in cards)

    # Build the page
    html = '''<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="AIHPC Advanced — Concept Cards Index. Browse all {n_cards} concept cards: ML loss functions, weekly digest articles, quantum mechanics, platform patterns. Auto-generated from docs/concepts/." />
    <title>Concept Cards Index — AIHPC Advanced</title>
    <style>
      :root {{
        --bg: #0b0f1a;
        --bg-elevated: #121826;
        --bg-elevated-2: #1a2133;
        --border: #1f2937;
        --border-strong: #2a3548;
        --text: #f3f4f6;
        --text-muted: #9ca3af;
        --text-muted-2: #6b7280;
        --accent: #8b5cf6;
        --accent-2: #06b6d4;
      }}
      * {{ box-sizing: border-box; }}
      html, body {{ margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; min-height: 100vh; }}
      body::before {{ content: ""; position: fixed; inset: 0; background: radial-gradient(1200px 600px at 20% -10%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(900px 500px at 90% 110%, rgba(6,182,212,0.12), transparent 60%); pointer-events: none; z-index: 0; }}
      .container {{ max-width: 1200px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }}
      h1 {{ font-size: 36px; margin: 0 0 8px; background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; }}
      .lead {{ font-size: 16px; color: var(--text-muted); margin: 0 0 32px; max-width: 700px; }}
      .back-link {{ display: inline-block; font-size: 13px; color: var(--accent-2); text-decoration: none; margin-bottom: 16px; }}
      .back-link:hover {{ text-decoration: underline; }}

      /* Stats strip */
      .stats-strip {{ display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }}
      .stat-card {{ background: rgba(18,24,38,0.7); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; min-width: 120px; }}
      .stat-card .num {{ font-size: 24px; font-weight: 800; font-family: ui-monospace, SF Mono, Menlo, monospace; }}
      .stat-card .label {{ font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }}

      /* Filter input */
      .filter-row {{ display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }}
      .filter-input {{ flex: 1; min-width: 240px; background: rgba(18,24,38,0.7); border: 1px solid var(--border-strong); border-radius: 8px; padding: 12px 16px; color: var(--text); font-size: 14px; font-family: inherit; }}
      .filter-input:focus {{ outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(139,92,246,0.2); }}
      .filter-input::placeholder {{ color: var(--text-muted-2); }}

      /* Category chips */
      .chip-row {{ display: flex; gap: 8px; flex-wrap: wrap; }}
      .chip {{ background: rgba(18,24,38,0.7); border: 1px solid var(--border-strong); color: var(--text-muted); padding: 6px 14px; border-radius: 9999px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; user-select: none; }}
      .chip:hover {{ border-color: var(--accent); color: var(--text); }}
      .chip.active {{ background: linear-gradient(90deg, var(--accent), var(--accent-2)); border-color: transparent; color: white; }}
      .chip .count {{ opacity: 0.7; margin-left: 4px; }}

      /* Card grid */
      .card-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }}
      .card {{ background: rgba(18,24,38,0.7); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-decoration: none; color: var(--text); transition: all 0.2s; display: flex; flex-direction: column; gap: 8px; }}
      .card:hover {{ border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,92,246,0.15); }}
      .card .cat-badge {{ display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }}
      .card .card-title {{ font-size: 14px; font-weight: 700; margin: 0; line-height: 1.4; }}
      .card .card-desc {{ font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.5; flex: 1; }}
      .card .card-foot {{ display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--text-muted-2); font-family: ui-monospace, monospace; }}

      .no-results {{ grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted); font-size: 14px; }}

      /* Ribbon (consistent with the rest of the platform) */
      .ribbon {{ position: sticky; top: 0; z-index: 50; background: linear-gradient(180deg, rgba(11,15,26,0.95) 0%, rgba(11,15,26,0.85) 100%); border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); }}
    </style>
  </head>
  <body>
    <div class="container">
      <a href="index.html" class="back-link">← Home</a>
      <h1>Concept Cards Index</h1>
      <p class="lead">Browse all {n_cards} concept cards on the AIHPC Advanced platform. Each card is a self-contained mini-article with Math→Code→Output pedagogy and a 6-language polyglot code section (Python / Rust / Go / C / Elixir / Scala). Use the search box to filter by title or description; click a category chip to narrow by topic.</p>

      <div class="stats-strip">
        <div class="stat-card"><div class="num" style="color: #06b6d4;">{n_cards}</div><div class="label">Total cards</div></div>
        <div class="stat-card"><div class="num" style="color: #06b6d4;">{n_ml}</div><div class="label">Machine Learning</div></div>
        <div class="stat-card"><div class="num" style="color: #8b5cf6;">{n_digest}</div><div class="label">Digest articles</div></div>
        <div class="stat-card"><div class="num" style="color: #ec4899;">{n_quantum}</div><div class="label">Quantum</div></div>
        <div class="stat-card"><div class="num" style="color: #f59e0b;">{n_platform}</div><div class="label">Platform</div></div>
      </div>

      <div class="filter-row">
        <input class="filter-input" id="filter-input" placeholder="🔍 Search {n_cards} concept cards by title, keyword, or category…" autocomplete="off" />
      </div>
      <div class="chip-row" id="chip-row" style="margin-bottom: 24px;">
        <span class="chip active" data-cat="ALL">All <span class="count">({n_cards})</span></span>
        <span class="chip" data-cat="ML" style="--chip-color: #06b6d4;">ML <span class="count">({n_ml})</span></span>
        <span class="chip" data-cat="Digest" style="--chip-color: #8b5cf6;">Digest <span class="count">({n_digest})</span></span>
        <span class="chip" data-cat="Quantum" style="--chip-color: #ec4899;">Quantum <span class="count">({n_quantum})</span></span>
        <span class="chip" data-cat="Platform" style="--chip-color: #f59e0b;">Platform <span class="count">({n_platform})</span></span>
      </div>

      <div class="card-grid" id="card-grid">
        <!-- Cards injected by JS -->
      </div>

      <p style="font-size: 11px; color: var(--text-muted-2); margin-top: 32px; font-family: ui-monospace, monospace;">Auto-generated by <code>scripts/gen-concepts-index.py</code> from <code>docs/concepts/*.html</code>. Re-runs in CI on every push.</p>
    </div>

    <script>
      var CARDS = {cards_json};
      var activeCategory = 'ALL';
      var searchTerm = '';

      function renderCards() {{
        var grid = document.getElementById('card-grid');
        var filtered = CARDS.filter(function (c) {{
          if (activeCategory !== 'ALL' && c.category !== activeCategory) return false;
          if (searchTerm) {{
            var t = (c.title + ' ' + c.description + ' ' + c.filename).toLowerCase();
            if (t.indexOf(searchTerm.toLowerCase()) < 0) return false;
          }}
          return true;
        }});
        if (filtered.length === 0) {{
          grid.innerHTML = '<div class="no-results">No concept cards match your filter. Try a different search term or category.</div>';
          return;
        }}
        grid.innerHTML = filtered.map(function (c) {{
          var title = escapeHtml(c.title);
          var desc = escapeHtml(c.description || c.title);
          var truncDesc = desc.length > 140 ? desc.slice(0, 137) + '…' : desc;
          return '<a class="card" href="concepts/' + c.filename + '">'
               +   '<span class="cat-badge" style="background: ' + c.color + '22; color: ' + c.color + '; border: 1px solid ' + c.color + ';">' + c.category + '</span>'
               +   '<h3 class="card-title">' + title + '</h3>'
               +   '<p class="card-desc">' + truncDesc + '</p>'
               +   '<div class="card-foot"><span>' + c.filename + '</span><span style="color: ' + c.color + ';">→</span></div>'
               + '</a>';
        }}).join('');
      }}
      function escapeHtml(s) {{
        return String(s).replace(/[&<>"']/g, function (c) {{
          return ({{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }})[c];
        }});
      }}
      document.getElementById('filter-input').addEventListener('input', function (e) {{
        searchTerm = e.target.value;
        renderCards();
      }});
      document.querySelectorAll('.chip').forEach(function (chip) {{
        chip.addEventListener('click', function () {{
          document.querySelectorAll('.chip').forEach(function (c) {{ c.classList.remove('active'); }});
          chip.classList.add('active');
          activeCategory = chip.dataset.cat;
          renderCards();
        }});
      }});
      // Keyboard shortcut: press / to focus the search box
      document.addEventListener('keydown', function (e) {{
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {{
          e.preventDefault();
          document.getElementById('filter-input').focus();
          document.getElementById('filter-input').select();
        }}
      }});
      renderCards();
    </script>
  </body>
</html>
'''.format(
        n_cards=len(cards),
        n_ml=cat_counts.get("ML", 0),
        n_digest=cat_counts.get("Digest", 0),
        n_quantum=cat_counts.get("Quantum", 0),
        n_platform=cat_counts.get("Platform", 0),
        cards_json=__import__("json").dumps(cards_json, indent=2),
    )

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Written: {OUT_PATH} ({len(html):,} bytes, {len(cards)} cards indexed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

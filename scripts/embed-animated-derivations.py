#!/usr/bin/env python3
"""
embed-animated-derivations.py — Phase 28 batch script.

Walks every HTML page under /docs that has a Math→Code derivation
block (.derivation-step elements) and inserts:
  1. A <script src=".../animated-derivation.js"></script> tag in <head>
  2. An animated canvas + controls UI block ABOVE the static
     derivation block, with play/pause/replay/record-WebM controls.
  3. A <script> block at the end of <body> that parses the static
     .derivation-step elements on the page into DERIVATIONS
     registry entries (one per page; first derivation block wins
     if there are multiple), then calls AIHPC_ANIM.init().

The result: every page with a 5-step Math→Code derivation now has
a "video clip" of the derivation that the user can play, replay,
or record as WebM.

Idempotent: re-running on already-patched pages is a no-op.

Run:
    python3 scripts/embed-animated-derivations.py
"""
import os
import re
import html as html_mod

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
DOCS = os.path.join(ROOT, "docs")

# Determine the correct relative path to animated-derivation.js
# based on the page's depth.
def get_script_src(rel_path):
    depth = rel_path.count(os.sep)
    if depth == 0:
        return "animated-derivation.js"
    return "../" * depth + "animated-derivation.js"


def has_derivation_block(html_content):
    """Check if the page has at least one .derivation-step element."""
    return 'class="derivation-step"' in html_content or "class='derivation-step'" in html_content


def find_derivation_title(html_content):
    """Find the title for the animated derivation.
    Prefer the <h1> of the page; fall back to <title>."""
    m = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.DOTALL)
    if m:
        # Strip HTML tags
        title = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        if title:
            return title
    m = re.search(r'<title>(.*?)</title>', html_content)
    if m:
        return m.group(1).strip()
    return "Math → Code derivation"


def parse_derivation_steps(html_content):
    """Parse the .derivation-step blocks on the page into a list of
    {title, math, explain} dicts. Returns the first 5 (or all if fewer).

    Handles multiple format variants:
      Standard:
        <div class="derivation-step">
          <strong>title</strong>
          <div class="step-math">math</div>
          <div class="step-explain">explain</div>
          [optional <code class="step-code">...</code>]
        </div>
      kmeans variant:
        <div class="derivation-step">
          <span class="step-num">1</span>
          <strong>title</strong> — subtitle
          <div class="step-math">math</div>
          <div class="step-explain">explain</div>
          [optional code]
        </div>
    """
    steps = []
    pattern = re.compile(
        r'<div class="derivation-step">\s*'
        r'(?:<span class="step-num">[^<]*</span>\s*)?'  # optional step-num span
        r'<strong>(.*?)</strong>[\s\S]*?'  # title (allow trailing subtitle)
        r'<div class="step-math">(.*?)</div>\s*'
        r'<div class="step-explain">(.*?)</div>[\s\S]*?'
        r'</div>',
        re.DOTALL
    )
    for m in pattern.finditer(html_content):
        title = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        math = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        explain = re.sub(r'<[^>]+>', '', m.group(3)).strip()
        steps.append({"title": title, "math": math, "explain": explain})
    return steps


def emit_animated_block(derivation_id, title, steps, script_src):
    """Emit the HTML for the animated canvas + controls + registration script."""
    # Convert steps to JSON
    steps_json = []
    for s in steps:
        steps_json.append({
            "title": s["title"],
            "math": s["math"],
            "explain": s["explain"],
        })
    import json
    steps_json_str = json.dumps(steps_json, ensure_ascii=False)

    html_block = f'''      <!-- Animated derivation (Phase 28) — video clip of the Math→Code derivation -->
      <div class="anim-container" style="margin: 32px 0 24px; padding: 20px; background: rgba(18,24,38,0.6); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; backdrop-filter: blur(12px);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-2, #06b6d4);">🎬 Animated derivation clip — Phase 28</div>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button class="anim-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play</button>
            <button class="anim-pause" style="background: var(--bg-elevated-2, #1a2133); border: 1px solid var(--border-strong, #2a3548); color: var(--text, #f3f4f6); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">⏸ Pause</button>
            <button class="anim-replay" style="background: var(--bg-elevated-2, #1a2133); border: 1px solid var(--border-strong, #2a3548); color: var(--text, #f3f4f6); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">↺ Replay</button>
            <button class="anim-record" style="background: var(--bg-elevated-2, #1a2133); border: 1px solid var(--border-strong, #2a3548); color: var(--text, #f3f4f6); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" title="Records the animation as a downloadable WebM video clip. Pure client-side — no external services.">⬇ Record WebM</button>
            <button class="anim-share" style="background: var(--bg-elevated-2, #1a2133); border: 1px solid var(--border-strong, #2a3548); color: var(--text, #f3f4f6); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" title="Phase 29 — captures the current frame as a PNG snapshot + copies a shareable URL with the current timestamp. Visiting the URL auto-resumes the clip at that timestamp.">🔗 Share</button>
          </div>
        </div>
        <canvas class="anim-derivation" data-derivation-id="{derivation_id}" style="display: block; max-width: 100%; height: auto; border-radius: 8px; background: #0b0f1a;"></canvas>
        <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted-2, #6b7280);">Press Play to watch the derivation animate. Press Record WebM to capture the clip as a downloadable .webm video — pure client-side via MediaRecorder; nothing leaves your browser.</div>
      </div>

      <script src="{script_src}"></script>
      <script>
        // Register the derivation for this page
        AIHPC_ANIM.register('{derivation_id}', {{
          title: {json.dumps(title, ensure_ascii=False)},
          steps: {steps_json_str},
          duration: {max(8, len(steps) * 2.4):.1f},  // ~2.4s per step, min 8s
        }});
        // Initialize (auto-init runs on DOMContentLoaded, but call explicitly
        // in case the page is already loaded)
        AIHPC_ANIM.init();
      </script>
'''
    return html_block


def patch_page(path):
    """Patch one HTML page with the animated derivation block."""
    rel = os.path.relpath(path, DOCS)
    with open(path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Skip if already patched
    if "anim-derivation" in html_content:
        return "skipped"

    # Skip if no derivation block
    if not has_derivation_block(html_content):
        return "no-derivation"

    # Parse the derivation steps
    steps = parse_derivation_steps(html_content)
    if len(steps) < 3:
        return "too-few-steps"

    title = find_derivation_title(html_content)
    derivation_id = re.sub(r'[^a-z0-9-]', '', title.lower().replace(' ', '-'))[:50]
    if not derivation_id:
        derivation_id = "page-derivation"

    script_src = get_script_src(rel)
    anim_block = emit_animated_block(derivation_id, title, steps, script_src)

    # Find the FIRST <h2>Math → Code derivation</h2> or <h2>Math &rarr; Code derivation</h2>
    # We want to insert the anim block RIGHT BEFORE the first .derivation-step's parent <h2>
    # OR right before the first .derivation-step's container.
    # Simpler: find the first <div class="derivation-step"> and insert the anim block
    # before its PRECEDING <h2>Math ...</h2> heading (if any) — or before the first
    # derivation-step itself.
    #
    # Strategy: find the line with the first 'Math &rarr; Code derivation' h2, OR
    # the first derivation-step, and insert before it.
    insert_pattern = re.compile(
        r'(<h2[^>]*>\s*Math (?:→|&rarr;) Code derivation[^<]*</h2>|<div class="derivation-step">)',
        re.IGNORECASE
    )
    m = insert_pattern.search(html_content)
    if not m:
        return "no-insert-point"

    new_html = html_content[:m.start()] + anim_block + "\n      " + html_content[m.start():]

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)
    return "patched"


def main():
    pages = []
    for dirpath, _, files in os.walk(DOCS):
        # Skip the digest/archive subdirectory — those are static snapshots
        if "/digest/archive" in dirpath or "/digest\\archive" in dirpath:
            continue
        for f in files:
            if f.endswith(".html"):
                pages.append(os.path.join(dirpath, f))

    patched = 0
    skipped = 0
    no_derivation = 0
    too_few = 0
    no_insert = 0

    for path in sorted(pages):
        rel = os.path.relpath(path, DOCS)
        result = patch_page(path)
        if result == "patched":
            print(f"  ✓ patched: {rel}")
            patched += 1
        elif result == "skipped":
            skipped += 1
        elif result == "no-derivation":
            no_derivation += 1
        elif result == "too-few-steps":
            too_few += 1
            print(f"  ⚠ too few steps: {rel}")
        elif result == "no-insert-point":
            no_insert += 1
            print(f"  ⚠ no insert point: {rel}")

    print()
    print(f"Patched: {patched} | Skipped (already): {skipped} | No derivation: {no_derivation} | Too few steps: {too_few} | No insert point: {no_insert} | Total: {len(pages)}")


if __name__ == "__main__":
    main()

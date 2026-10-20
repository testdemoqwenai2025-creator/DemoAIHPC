#!/usr/bin/env python3
"""patch-ml-page-v40-attention.py — Phase 40

Adds live attention heat-map widgets to the 3 attention demos on
docs/science-ml.html:
  1. scaled-dot-product-attention (single head)
  2. multi-head-attention (head selector)
  3. flash-attention (same heat-map + tiling stat)

The heat-map is mounted in an attention-specific div that follows each
demo's existing ClickForDemo card. Uses the new docs/attention-heatmap.js
component.

Idempotent — checks for 'patch-ml-page-v40-attention: APPLIED'.
"""
import os
import sys
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN_ML = os.path.join(ROOT, "scripts", "gen-ml-page.py")
MARKER = "patch-ml-page-v40-attention: APPLIED"

# HTML to inject for each attention demo's heat-map widget
HEATMAP_SECTION_TEMPLATE = '''
    <section class="container" style="margin-top: 16px;">
      <span class="tag">Phase 40 &middot; Live Attention Heat-Map</span>
      <h2 style="font-size: 18px; margin: 8px 0 12px;">{TITLE}</h2>
      <p class="lead" style="font-size: 13px;">Type any sentence in the input box. The heat-map re-computes attention weights token-by-token via Q&middot;K<sup>T</sup>/&radic;d<sub>k</sub>. Watch the diagonal pattern (self-attention), off-diagonal spikes (related tokens), and how multi-head specialisation shows different patterns per head.</p>
      <div style="display: grid; grid-template-columns: 320px 1fr; gap: 12px;">
        <div id="{CONTAINER_ID}"></div>
        <div style="padding: 12px; background: rgba(11,15,26,0.6); border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.6;">
          <h3 style="font-size: 13px; color: var(--accent-2); margin: 0 0 8px;">How to read this heat-map</h3>
          <p style="margin: 0 0 8px; color: var(--text-muted);"><strong>Rows</strong> = query position (which token is asking "what should I attend to?"). <strong>Columns</strong> = key position (which token am I being asked about?). <strong>Cell colour</strong> = softmax weight (darker = low, brighter = high).</p>
          <p style="margin: 0; color: var(--text-muted);">The heat-map reveals <strong>self-attention patterns</strong>: (a) the diagonal is usually bright (each token attends to itself), (b) related tokens (e.g. "fox" &amp; "dog" in our default) form off-diagonal hot spots, (c) multi-head shows different specialisations — head 1 may track syntax, head 2 may track coreference.</p>
        </div>
      </div>
    </section>
    <script>
      document.addEventListener('DOMContentLoaded', function () {{
        if (!window.AIHPC_ATTN) return;
        AIHPC_ATTN.mount('{CONTAINER_ID}', {{
          tokens: ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'],
        }});
        AIHPC_ATTN.play('{CONTAINER_ID}');
      }});
    </script>
'''


def patch_gen_ml_page() -> int:
    if not os.path.exists(GEN_ML):
        print(f"ERROR: {GEN_ML} not found", file=sys.stderr)
        return 2
    src = open(GEN_ML, encoding="utf-8").read()
    if MARKER in src:
        print("patch-ml-page-v40-attention: already applied. Skipping.")
        return 0

    # 1. Add attention-heatmap.js script tag (after ml-etl.js)
    script_anchor = '<script src="animated-derivation.js"></script>\\n    <script src="graph-table-sync.js"></script>\\n    <script src="ml-etl.js"></script>'
    if script_anchor in src:
        src = src.replace(
            script_anchor,
            script_anchor + '\\n    <script src="attention-heatmap.js"></script>',
            1,
        )
        print("  + added <script src=attention-heatmap.js> tag")

    # 2. Insert 3 attention heat-map sections (one per attention demo)
    #    Just after the LOSS_FUNCTIONS loop, after the Phase 38 block.
    # Find the marker for the end of the Phase 38 block.
    anchor = "# patch-ml-page-v38-optimisers: APPLIED"
    if anchor not in src:
        # Fall back: the extras marker
        anchor = "# patch-ml-page-v37-extras: APPLIED"
        if anchor not in src:
            print("ERROR: Phase 37/38 anchor not found.", file=sys.stderr)
            return 3

    heatmap_sections = []
    for demo_id, title, container_id in [
        ("scaled-dot-product-attention", "Scaled Dot-Product Attention — live heat-map", "attn-sdpa-container"),
        ("multi-head-attention", "Multi-Head Attention — 4-head heat-map selector", "attn-mha-container"),
        ("flash-attention", "FlashAttention — same heat-map, IO-aware computation", "attn-flash-container"),
    ]:
        section = HEATMAP_SECTION_TEMPLATE.format(
            TITLE=title,
            CONTAINER_ID=container_id,
        )
        heatmap_sections.append(repr(section.strip()))

    injection = (
        "\n        # Phase 40: Live attention heat-maps for the 3 attention demos\n"
        "        parts.append(\n"
        f"            {heatmap_sections[0]}\n"
        "            + '<div style=\"height: 24px;\"></div>'\n"
        f"            + {heatmap_sections[1]}\n"
        "            + '<div style=\"height: 24px;\"></div>'\n"
        f"            + {heatmap_sections[2]}\n"
        "        )\n"
        f"        # {MARKER}\n"
    )
    src = src.replace(anchor, anchor + injection, 1)

    with open(GEN_ML, "w", encoding="utf-8") as f:
        f.write(src)

    print("  + inserted 3 live attention heat-map sections")
    return 0


def regenerate() -> int:
    print("patch-ml-page-v40-attention: regenerating docs/science-ml.html ...")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "gen-ml-page.py")])
    if r.returncode != 0:
        print("ERROR: gen-ml-page.py failed", file=sys.stderr)
        return r.returncode
    return 0


if __name__ == "__main__":
    rc = patch_gen_ml_page()
    if rc != 0:
        sys.exit(rc)
    rc = regenerate()
    if rc != 0:
        sys.exit(rc)
    print("patch-ml-page-v40-attention: done.")

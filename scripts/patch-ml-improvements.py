#!/usr/bin/env python3
"""
patch-ml-improvements.py — Phase 32 patch.

Adds three improvements to scripts/gen-ml-page.py:

1. Math-to-code annotations: each Python code sample gets a header
   comment block showing how each math symbol maps to a code variable.
   Example:
     # L = (1/n) Σ (y_i − ŷ_i)²
     # y_i → y_true[i]  ŷ_i → y_pred[i]  n → len(y_true)
     # Σ → .sum()  ² → ** 2  (1/n) → / n

2. Graph-table-sync component: replaces the static SVG in the Observe:
   Graphs sub-tab with a GTS container that animates through the
   table rows + shows math annotations at inflection points.

3. Script tag: adds <script src="graph-table-sync.js"> to the head.

Idempotent.
"""
import os
import re

GEN_PATH = "/home/z/my-project/AETH-1-Content-Archive/scripts/gen-ml-page.py"

with open(GEN_PATH, "r", encoding="utf-8") as f:
    src = f.read()

# ---- 1. Add script tag ----
if "graph-table-sync.js" not in src:
    src = src.replace(
        '    <script src="animated-derivation.js"></script>',
        '    <script src="animated-derivation.js"></script>\n    <script src="graph-table-sync.js"></script>',
    )
    print("  ✓ added graph-table-sync.js script tag")

# ---- 2. Replace static SVG in Graphs sub-tab with GTS container ----
# Find the pattern: <div class="graph-block">{lf['graph_svg']}</div>
# Replace with: <div class="gts-container" data-gts-id="gts-{lf['id']}"></div>
if 'gts-container' not in src:
    src = src.replace(
        '''            <div class="observe-content" data-sub="graphs">
              <div class="graph-block">{lf['graph_svg']}</div>
            </div>''',
        '''            <div class="observe-content" data-sub="graphs">
              <div class="gts-container" data-gts-id="gts-{lf['id']}" style="padding: 16px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted-2);">Press Play to animate the table values onto the graph. At inflection points (max error, threshold crossing), math annotations appear on the graph.</div>
            </div>'''
    )
    print("  ✓ replaced static SVG with GTS container")

# ---- 3. Add GTS registration for each loss function ----
# Find the AIHPC_ANIM.register block and add GTS registration after it
# We need to add GTS configs per loss function

# GTS configs per loss function id
GTS_CONFIGS = {
    "mse": {
        "xCol": 3, "yCol": 4,
        "xLabel": "error (y−ŷ)", "yLabel": "loss (e²)",
        "curveFn": "function(x) { return x * x; }",
        "inflectionFn": "function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L = e² = ' + row[4] + ' — max error, quadratic penalty'} : null; }",
    },
    "mae": {
        "xCol": 3, "yCol": 3,
        "xLabel": "error (y−ŷ)", "yLabel": "loss (|e|)",
        "curveFn": "function(x) { return Math.abs(x); }",
        "inflectionFn": "function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L = |e| = ' + Math.abs(row[3]) + ' — linear penalty'} : null; }",
    },
    "binary-cross-entropy": {
        "xCol": 2, "yCol": 5,
        "xLabel": "ŷ (predicted prob)", "yLabel": "loss",
        "curveFn": "function(x) { x = Math.max(1e-15, Math.min(1-1e-15, x)); return -(Math.log(x)); }",
        "inflectionFn": "function(row, i, rows) { return parseFloat(row[5]) > 3 ? {annotation: 'L = ' + row[5] + ' — confident wrong prediction'} : null; }",
    },
    "categorical-cross-entropy": {
        "xCol": 2, "yCol": 4,
        "xLabel": "ŷ_true_class", "yLabel": "loss",
        "curveFn": "function(x) { return -Math.log(Math.max(1e-15, x)); }",
        "inflectionFn": "function(row, i, rows) { return parseFloat(row[4]) > 3 ? {annotation: 'L = ' + row[4] + ' — low confidence on true class'} : null; }",
    },
    "hinge-loss": {
        "xCol": 3, "yCol": 4,
        "xLabel": "y·ŷ (margin)", "yLabel": "loss",
        "curveFn": "function(x) { return Math.max(0, 1 - x); }",
        "inflectionFn": "function(row, i, rows) { return parseFloat(row[4]) > 1.5 ? {annotation: 'L = ' + row[4] + ' — margin violation'} : null; }",
    },
    "log-cosh": {
        "xCol": 3, "yCol": 4,
        "xLabel": "error", "yLabel": "loss (log-cosh)",
        "curveFn": "function(x) { return Math.log(Math.cosh(x)); }",
        "inflectionFn": "function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L = ' + row[4] + ' — large error, MAE-like'} : null; }",
    },
    "huber-loss": {
        "xCol": 3, "yCol": 4,
        "xLabel": "|error|", "yLabel": "Huber loss (δ=1.0)",
        "curveFn": "function(x) { return x <= 1.0 ? 0.5*x*x : 1.0*(x - 0.5); }",
        "inflectionFn": "function(row, i, rows) { return parseFloat(row[3]) > 1.0 ? {annotation: 'L = ' + row[4] + ' — beyond δ=1.0, linear region'} : (parseFloat(row[3]) === 1.0 ? {annotation: 'L = ½δ² = 0.5 — δ threshold'} : null); }",
    },
    "kl-divergence": {
        "xCol": 2, "yCol": 4,
        "xLabel": "Q(x)", "yLabel": "P·log(P/Q)",
        "curveFn": "null",
        "inflectionFn": "function(row, i, rows) { return parseFloat(row[4]) < 0 ? {annotation: 'P < Q here: negative contribution'} : null; }",
    },
    "cosine-similarity": {
        "xCol": 3, "yCol": 4,
        "xLabel": "cos(θ)", "yLabel": "loss = 1−cos(θ)",
        "curveFn": "function(x) { return 1 - x; }",
        "inflectionFn": "function(row, i, rows) { return parseFloat(row[4]) > 1.5 ? {annotation: 'L = ' + row[4] + ' — anti-parallel vectors'} : null; }",
    },
}

# Build the GTS registration script
# We need to add this AFTER the AIHPC_ANIM.register blocks
# Find the pattern: the first `// ---- Particle background ----` and insert before it
gts_registrations = []
for lf_id, cfg in GTS_CONFIGS.items():
    # Get the sample_data from the manifest
    # We need to reference the data dynamically — but since the manifest
    # is in the same Python file, we can access it at generation time.
    # Instead, we'll emit JS that references the loss function's sample_data
    # via a JS object we construct.
    gts_registrations.append(f"""
      // GTS registration for {lf_id}
      (function () {{
        var lf = LOSS_FUNCTIONS.find(function (l) {{ return l.id === '{lf_id}'; }});
        if (lf && lf.sample_data) {{
          AIHPC_GTS.register('gts-{lf_id}', {{
            title: lf.name,
            headers: lf.sample_data.headers,
            rows: lf.sample_data.rows,
            xCol: {cfg['xCol']},
            yCol: {cfg['yCol']},
            xLabel: {repr(cfg['xLabel'])},
            yLabel: {repr(cfg['yLabel'])},
            curveFn: {cfg['curveFn']},
            inflectionFn: {cfg['inflectionFn']},
            duration: 6,
          }});
        }}
      }})();""")

gts_block = '\n'.join(gts_registrations)

# We also need to expose LOSS_FUNCTIONS as a JS object
# Currently, the manifest is Python-only. We need to serialise it.
# The simplest: add a JS const LOSS_FUNCTIONS = [...] that mirrors the manifest.
# But that would duplicate a lot of data.
# Alternative: reference the sample_data via the CODE_BANK approach — but
# the sample_data isn't in CODE_BANK.
# Best approach: add a SAMPLE_DATA_BANK JS object alongside CODE_BANK.

# Actually, let me add the GTS registration differently — inline with
# each loss function's section, using the sample_data that's already
# embedded in the page's HTML table. We can parse it from the DOM.

# Simpler approach: emit the GTS configs as a JS object that references
# the sample_data by parsing the table rows from the DOM.

# Even simpler: just hardcode the sample_data rows as JS arrays in the
# GTS registration. This duplicates data but keeps the code simple.

# Let me use the approach of embedding the sample_data as JSON in the
# GTS registration script. I'll add a SAMPLE_DATA_BANK similar to CODE_BANK.

# Actually, the gen-ml-page.py already has the sample_data in the
# LOSS_FUNCTIONS list. I can serialise it to a JS object.

# Let me add a SAMPLE_DATA_BANK JS object that contains all the sample_data.
if 'SAMPLE_DATA_BANK' not in src:
    # Find the CODE_BANK section and add SAMPLE_DATA_BANK after it
    # The CODE_BANK is built in the main() function
    # I'll add the SAMPLE_DATA_BANK + GTS registrations right after the CODE_BANK

    # Find: const CODE_BANK = {  ...  };
    # Insert after: const SAMPLE_DATA_BANK = { ... };
    # Then insert GTS registrations

    # Actually, let me find the "// ---- Data table Show-more ----" section
    # and insert the SAMPLE_DATA_BANK + GTS before it.

    # Find the pattern where CODE_BANK is emitted
    code_bank_end = src.find("      };\n\n      document.querySelectorAll")
    if code_bank_end > 0:
        # Build SAMPLE_DATA_BANK
        # We need to import json to serialise the sample_data
        # But the gen-ml-page.py already imports json
        sample_data_bank = """
      // Phase 32: Sample data bank for graph-table-sync
      const SAMPLE_DATA_BANK = {"""
        for lf_id, cfg in GTS_CONFIGS.items():
            sample_data_bank += f"""
        '{lf_id}': {{ headers: [], rows: [] }}, // populated from DOM"""
        sample_data_bank += """
      };

      // Phase 32: Graph-table-sync registrations"""
        sample_data_bank += gts_block
        sample_data_bank += """
      // Initialize GTS after DOM ready
      document.addEventListener('DOMContentLoaded', function () { AIHPC_GTS.init(); });
"""
        src = src[:code_bank_end + 8] + sample_data_bank + src[code_bank_end + 8:]
        print("  ✓ added SAMPLE_DATA_BANK + GTS registrations")

# Actually, the approach above references LOSS_FUNCTIONS.find() which doesn't
# exist in JS. Let me fix the GTS registrations to parse the table data from
# the DOM instead.

# Replace the GTS registrations with DOM-parsing versions
# Each GTS container has a sibling table; we can parse the table headers + rows
dom_gts_registrations = []
for lf_id, cfg in GTS_CONFIGS.items():
    dom_gts_registrations.append(f"""
      // GTS for {lf_id} — parse table from DOM
      (function () {{
        var card = document.getElementById('demo-{lf_id}');
        if (!card) return;
        var table = card.querySelector('.data-table');
        if (!table) return;
        var headers = [];
        table.querySelectorAll('thead th').forEach(function (th) {{ headers.push(th.textContent.trim()); }});
        var rows = [];
        table.querySelectorAll('tbody tr').forEach(function (tr) {{
          var row = [];
          tr.querySelectorAll('td').forEach(function (td) {{ row.push(td.textContent.trim()); }});
          rows.push(row);
        }});
        if (headers.length && rows.length) {{
          AIHPC_GTS.register('gts-{lf_id}', {{
            title: '{lf_id}',
            headers: headers,
            rows: rows,
            xCol: {cfg['xCol']},
            yCol: {cfg['yCol']},
            xLabel: {repr(cfg['xLabel'])},
            yLabel: {repr(cfg['yLabel'])},
            curveFn: {cfg['curveFn']},
            inflectionFn: {cfg['inflectionFn']},
            duration: 6,
          }});
        }}
      }})();""")

# Replace the old GTS registrations with DOM-based ones
old_gts_pattern = re.compile(
    r'// Phase 32: Graph-table-sync registrations.*?(?=// Initialize GTS|// ---- Particle)',
    re.DOTALL
)
new_gts_block = """
      // Phase 32: Graph-table-sync registrations (DOM-parsing)
""" + '\n'.join(dom_gts_registrations) + """
      // Initialize GTS after DOM ready
      document.addEventListener('DOMContentLoaded', function () { AIHPC_GTS.init(); });
"""
src = old_gts_pattern.sub(new_gts_block, src)
print("  ✓ replaced GTS registrations with DOM-parsing versions")

# ---- 4. Add math-to-code annotations to Python code samples ----
# For each loss function, prepend the Python code with a math-mapping comment block

MATH_ANNOTATIONS = {
    "mse": "# L = (1/n) Σ (y_i − ŷ_i)²\n# y_i → y_true[i]   ŷ_i → y_pred[i]   n → len(y_true)\n# Σ → .sum()  ² → ** 2  (1/n) → np.mean()\n",
    "mae": "# L = (1/n) Σ |y_i − ŷ_i|\n# y_i → y_true[i]   ŷ_i → y_pred[i]   n → len(y_true)\n# |·| → np.abs()  Σ → .sum()  (1/n) → np.mean()\n",
    "binary-cross-entropy": "# L = −(1/n) Σ [y log(ŷ) + (1−y) log(1−ŷ)]\n# y → y_true[i]   ŷ → y_pred[i] (sigmoid output)   n → len(y_true)\n# log → np.log()  clip ŷ to (1e-15, 1−1e-15) to avoid log(0)\n",
    "categorical-cross-entropy": "# L = −(1/n) Σ_i Σ_c y_ic log(ŷ_ic)\n# y_ic → y_true[i][c] (one-hot)   ŷ_ic → y_pred[i][c] (softmax)\n# Σ_c → .sum(axis=1)  Σ_i → .sum()  (1/n) → np.mean()\n",
    "hinge-loss": "# L = (1/n) Σ max(0, 1 − y·ŷ)\n# y → y_true[i] ∈ {−1,+1}   ŷ → y_pred[i] (raw score)\n# max(0,·) → np.maximum(0, ·)   y·ŷ → y_true * y_pred\n",
    "log-cosh": "# L = (1/n) Σ log(cosh(ŷ − y))\n# y → y_true[i]   ŷ → y_pred[i]   cosh → np.cosh()\n# log → np.log()  cosh(e) ≈ e²/2 (small e) or |e| (large e)\n",
    "huber-loss": "# L_δ(e) = { ½e²  if |e|≤δ;  δ(|e|−½δ)  if |e|>δ }\n# e → y_pred - y_true   δ → delta (threshold, default 1.0)\n# ½e² → 0.5*e*e  δ(|e|−½δ) → delta*(abs(e)-0.5*delta)\n# np.where(abs_e <= delta, quad, linear) for piecewise\n",
    "kl-divergence": "# D_KL(P||Q) = Σ P(x) log(P(x)/Q(x))\n# P → p[i] (true distribution)   Q → q[i] (predicted distribution)\n# log(P/Q) → np.log(p/q)  Σ → np.sum()  clip to 1e-15\n",
    "cosine-similarity": "# L = 1 − (A·B) / (||A||·||B||)\n# A·B → np.dot(a, b)  ||A|| → np.linalg.norm(a)\n# L → 1.0 - dot/(na*nb + eps)  eps=1e-8 for stability\n",
}

for lf_id, annotation in MATH_ANNOTATIONS.items():
    # Find the Python code sample for this loss function
    # Pattern: '"python": "...code..."'
    # Prepend the annotation
    old_pattern = f'"python": "'
    # Find the specific python entry for this loss function
    # The loss function's code block starts with '"python": "'
    # But there are multiple such patterns. We need to find the one
    # within the specific loss function's code block.

    # Simpler: just replace the FIRST occurrence of the Python code
    # that starts with the function name.
    # For MSE: 'import numpy as np\ndef mse('
    # For MAE: 'import numpy as np\ndef mae('

    # Actually, let me just find ALL '"python": "' entries and prepend
    # the annotation to each one that doesn't already have it.

    # Since the annotations are loss-function-specific, I need to
    # find the right one. Let me use the function name as a marker.

    # Skip if already annotated
    if annotation.split('\n')[0] in src:
        continue

    # Find the python code entry for this loss function by looking for
    # the code that contains the function name
    for func_name_marker in [f'def {lf_id.replace("-","_")}', f'fn {lf_id.replace("-","_")}']:
        idx = src.find(func_name_marker)
        if idx < 0:
            continue
        # Find the '"python": "' that precedes this marker
        py_start = src.rfind('"python": "', 0, idx)
        if py_start < 0:
            continue
        # Insert the annotation after the opening quote
        insert_pos = py_start + len('"python": "')
        src = src[:insert_pos] + annotation + src[insert_pos:]
        print(f"  ✓ added math annotation to {lf_id} Python code")
        break

with open(GEN_PATH, "w", encoding="utf-8") as f:
    f.write(src)
print("\nPatch complete.")

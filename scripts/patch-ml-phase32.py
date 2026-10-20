#!/usr/bin/env python3
"""
patch-ml-phase32.py — Phase 32 ML page improvements.

Adds three improvements to scripts/gen-ml-page.py:

1. <script src="graph-table-sync.js"> in the head
2. GTS container replacing static SVG in Observe:Graphs
3. GTS configs + DOM-parsing registrations
4. Math-to-code annotations on Python code samples
   (showing how each math symbol maps to a code variable)

This script is a .py FILE (not inline -c) to avoid Bash shell
escaping issues with backslash-n.
"""
import re

GEN_PATH = "/home/z/my-project/AETH-1-Content-Archive/scripts/gen-ml-page.py"

with open(GEN_PATH, "r", encoding="utf-8") as f:
    src = f.read()

# ---- 1. Add script tag ----
if "graph-table-sync.js" not in src:
    src = src.replace(
        '<script src="animated-derivation.js"></script>',
        '<script src="animated-derivation.js"></script>\\n    <script src="graph-table-sync.js"></script>',
    )
    print("  [1] added graph-table-sync.js script tag")

# ---- 2. Replace static SVG with GTS container ----
if "gts-container" not in src:
    old_graph = """            <div class="observe-content" data-sub="graphs">
              <div class="graph-block">{lf['graph_svg']}</div>
            </div>"""
    new_graph = """            <div class="observe-content" data-sub="graphs">
              <div class="gts-container" data-gts-id="gts-{lf['id']}" style="padding: 16px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted-2);">Press Play to animate the table values onto the graph. Math annotations appear at inflection points.</div>
            </div>"""
    src = src.replace(old_graph, new_graph)
    print("  [2] replaced static SVG with GTS container")

# ---- 3. Add GTS configs + DOM-parsing registrations ----
if "GTS_CONFIGS" not in src:
    gts_block = """
      // ---- Phase 32: Graph-table-sync ----
      var GTS_CONFIGS = {
        'mse': { xCol: 3, yCol: 4, xLabel: 'error (y-Ey)', yLabel: 'loss (e^2)',
          curveFn: function(x) { return x * x; },
          inflectionFn: function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L=e^2=' + row[4] + ' - max error, quadratic penalty'} : null; } },
        'mae': { xCol: 3, yCol: 3, xLabel: 'error (y-Ey)', yLabel: 'loss (|e|)',
          curveFn: function(x) { return Math.abs(x); },
          inflectionFn: function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L=|e|=' + Math.abs(row[3]) + ' - max error, linear penalty'} : null; } },
        'binary-cross-entropy': { xCol: 2, yCol: 5, xLabel: 'y_hat (prob)', yLabel: 'loss',
          curveFn: function(x) { x = Math.max(1e-15, Math.min(1-1e-15, x)); return -Math.log(x); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[5]) > 3 ? {annotation: 'L=' + row[5] + ' - confident wrong'} : null; } },
        'categorical-cross-entropy': { xCol: 2, yCol: 4, xLabel: 'y_hat_true', yLabel: 'loss',
          curveFn: function(x) { return -Math.log(Math.max(1e-15, x)); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) > 3 ? {annotation: 'L=' + row[4] + ' - low confidence'} : null; } },
        'hinge-loss': { xCol: 3, yCol: 4, xLabel: 'y*y_hat (margin)', yLabel: 'loss',
          curveFn: function(x) { return Math.max(0, 1 - x); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) > 1.5 ? {annotation: 'L=' + row[4] + ' - margin violation'} : null; } },
        'log-cosh': { xCol: 3, yCol: 4, xLabel: 'error', yLabel: 'loss (log-cosh)',
          curveFn: function(x) { return Math.log(Math.cosh(x)); },
          inflectionFn: function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L=' + row[4] + ' - large error, MAE-like'} : null; } },
        'huber-loss': { xCol: 3, yCol: 4, xLabel: '|error|', yLabel: 'Huber (delta=1.0)',
          curveFn: function(x) { return x <= 1.0 ? 0.5*x*x : 1.0*(x - 0.5); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[3]) > 1.0 ? {annotation: 'L=' + row[4] + ' - beyond delta=1.0, linear'} : (Math.abs(parseFloat(row[3]) - 1.0) < 0.01 ? {annotation: 'delta threshold: quadratic->linear'} : null); } },
        'kl-divergence': { xCol: 2, yCol: 4, xLabel: 'Q(x)', yLabel: 'P*log(P/Q)',
          curveFn: null,
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) < 0 ? {annotation: 'P<Q: negative contribution'} : null; } },
        'cosine-similarity': { xCol: 3, yCol: 4, xLabel: 'cos(theta)', yLabel: 'loss=1-cos(theta)',
          curveFn: function(x) { return 1 - x; },
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) > 1.5 ? {annotation: 'L=' + row[4] + ' - anti-parallel'} : null; } },
      };
      document.querySelectorAll('.demo-card').forEach(function (card) {
        var id = card.id.replace(/^demo-/, '');
        var cfg = GTS_CONFIGS[id];
        if (!cfg) return;
        var table = card.querySelector('.data-table');
        if (!table) return;
        var headers = [];
        table.querySelectorAll('thead th').forEach(function (th) { headers.push(th.textContent.trim()); });
        var rows = [];
        table.querySelectorAll('tbody tr').forEach(function (tr) {
          var row = [];
          tr.querySelectorAll('td').forEach(function (td) { row.push(td.textContent.trim()); });
          rows.push(row);
        });
        if (headers.length && rows.length && window.AIHPC_GTS) {
          AIHPC_GTS.register('gts-' + id, {
            title: id, headers: headers, rows: rows,
            xCol: cfg.xCol, yCol: cfg.yCol, xLabel: cfg.xLabel, yLabel: cfg.yLabel,
            curveFn: cfg.curveFn, inflectionFn: cfg.inflectionFn, duration: 6,
          });
        }
      });
      document.addEventListener('DOMContentLoaded', function () { if (window.AIHPC_GTS) AIHPC_GTS.init(); });

"""
    # Insert before "// ---- Particle background ----"
    src = src.replace("// ---- Particle background ----", gts_block + "      // ---- Particle background ----")
    print("  [3] added GTS configs + DOM-parsing registrations")

# ---- 4. Math-to-code annotations on Python code samples ----
# Use \n (literal backslash-n) in the annotation strings so Python
# interprets them as newline escapes when the file is executed.
ANNOTATIONS = {
    "mse": "# L = (1/n) Sum (y_i - y_hat_i)^2\\n# y_i -> y_true[i]  y_hat_i -> y_pred[i]  n -> len(y_true)\\n# Sum -> .sum()  ^2 -> ** 2  (1/n) -> np.mean()\\n",
    "mae": "# L = (1/n) Sum |y_i - y_hat_i|\\n# y_i -> y_true[i]  y_hat_i -> y_pred[i]  n -> len(y_true)\\n# |.| -> np.abs()  Sum -> .sum()  (1/n) -> np.mean()\\n",
    "binary-cross-entropy": "# L = -(1/n) Sum [y log(y_hat) + (1-y) log(1-y_hat)]\\n# y -> y_true[i]  y_hat -> y_pred[i] (sigmoid output)\\n# log -> np.log()  clip y_hat to (1e-15, 1-1e-15)\\n",
    "categorical-cross-entropy": "# L = -(1/n) Sum_i Sum_c y_ic log(y_hat_ic)\\n# y_ic -> y_true[i][c] (one-hot)  y_hat_ic -> y_pred[i][c] (softmax)\\n# Sum_c -> sum(axis=1)  Sum_i -> sum()  (1/n) -> mean()\\n",
    "hinge-loss": "# L = (1/n) Sum max(0, 1 - y*y_hat)\\n# y -> y_true[i] in {-1,+1}  y_hat -> y_pred[i] (raw score)\\n# max(0,.) -> np.maximum(0, .)  y*y_hat -> y_true * y_pred\\n",
    "log-cosh": "# L = (1/n) Sum log(cosh(y_hat - y))\\n# y -> y_true[i]  y_hat -> y_pred[i]  cosh -> np.cosh()\\n# log -> np.log()  cosh(e) ~ e^2/2 (small e) or |e| (large e)\\n",
    "huber-loss": "# L_delta(e) = { 0.5*e^2  if |e|<=delta;  delta*(|e|-0.5*delta)  if |e|>delta }\\n# e -> y_pred - y_true  delta -> delta (threshold, default 1.0)\\n# 0.5*e^2 -> 0.5*e*e  delta*(|e|-0.5*delta) -> delta*(abs(e)-0.5*delta)\\n",
    "kl-divergence": "# D_KL(P||Q) = Sum P(x) log(P(x)/Q(x))\\n# P -> p[i] (true dist)  Q -> q[i] (predicted dist)\\n# log(P/Q) -> np.log(p/q)  Sum -> np.sum()  clip to 1e-15\\n",
    "cosine-similarity": "# L = 1 - (A.B) / (||A||*||B||)\\n# A.B -> np.dot(a, b)  ||A|| -> np.linalg.norm(a)\\n# L -> 1.0 - dot/(na*nb + eps)  eps=1e-8\\n",
}

FUNC_MARKERS = {
    "mse": "def mse(",
    "mae": "def mae(",
    "binary-cross-entropy": "def bce(",
    "categorical-cross-entropy": "def cce(",
    "hinge-loss": "def hinge(",
    "log-cosh": "def log_cosh(",
    "huber-loss": "def huber(",
    "kl-divergence": "def kl_divergence(",
    "cosine-similarity": "def cosine_similarity_loss(",
}

n_annotated = 0
for lf_id, ann in ANNOTATIONS.items():
    marker = FUNC_MARKERS.get(lf_id)
    if not marker:
        continue
    idx = src.find(marker)
    if idx < 0:
        continue
    py_start = src.rfind('"python": "', 0, idx)
    if py_start < 0:
        continue
    insert_pos = py_start + len('"python": "')
    # Check if already annotated
    if src[insert_pos:insert_pos+4] == "# L " or src[insert_pos:insert_pos+5] == "# D_KL" or src[insert_pos:insert_pos+8] == "# L_delta":
        continue
    src = src[:insert_pos] + ann + src[insert_pos:]
    n_annotated += 1
    print(f"  [4] annotated: {lf_id}")

with open(GEN_PATH, "w", encoding="utf-8") as f:
    f.write(src)
print(f"\nDone. Script tag + GTS + {n_annotated} math annotations applied.")

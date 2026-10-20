#!/usr/bin/env python3
"""
patch-ml-page-v37-extras.py — Phase 37

Inserts two new sections into scripts/gen-ml-page.py so that the
regenerated docs/science-ml.html gets:

  A) A top-of-page "Upload CSV → live loss graph" widget that lets the
     user paste a CSV with columns (y_true, y_pred) and immediately
     sees the live loss values for the regression demos (MSE, MAE,
     log-cosh, Huber, KL, cosine) — all powered by the existing GTS
     component, which we extended with 3D support in extend-gts-3d.py.

  B) An "Optimiser Showdown" 3D-trajectory section after the optimiser
     demos. Renders three GTS-3D widgets side-by-side, each with the
     same Beale-like loss surface and the optimiser's trajectory through
     it, so the user can compare the optimisers visually.

Also loads docs/ml-etl.js (created below).

Idempotent — checks for the marker 'patch-ml-page-v37-extras: APPLIED'.
"""
import os
import re
import sys
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN_ML = os.path.join(ROOT, "scripts", "gen-ml-page.py")
ML_ETL_JS = os.path.join(ROOT, "docs", "ml-etl.js")
MARKER = "patch-ml-page-v37-extras: APPLIED"


# ============================================================================
# 1. ml-etl.js — pure client-side CSV → live loss widget
# ============================================================================

ML_ETL_JS_SOURCE = '''/**
 * ml-etl.js — Phase 37 ETL panel for the ML page.
 *
 * Lets the user paste a CSV with columns `y_true, y_pred` (or upload a
 * .csv file) and immediately see live loss values for the regression
 * demos (MSE, MAE, log-cosh, Huber, KL, cosine) — feeding the parsed
 * rows into the GTS components registered on the page.
 *
 * Pure client-side. No external services. Honours the AIHPC data-
 * residency principle: parsed data stays in the browser; no upload.
 *
 * Public API (window.AIHPC_ML_ETL):
 *   register(container_id)         — mount the widget
 *   parseCSV(text)                 — returns { headers, rows, errors }
 *   computeLosses(rows, yTrueCol, yPredCol) — returns per-loss values
 *   pushToGTS(rows, yTrueCol, yPredCol)     — update all live GTS graphs
 */
(function (global) {
  'use strict';

  function parseCSV(text) {
    // Strip BOM, normalize newlines
    text = text.replace(/^\\uFEFF/, '').replace(/\\r\\n?/g, '\\n');
    var lines = text.split('\\n').filter(function (l) { return l.trim() && !l.trim().startsWith('#'); });
    if (lines.length === 0) return { headers: [], rows: [], errors: ['Empty input'] };
    function splitLine(line) {
      var out = [], cur = '', inQuote = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (inQuote) {
          if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (c === '"') { inQuote = false; }
          else cur += c;
        } else {
          if (c === '"') inQuote = true;
          else if (c === ',') { out.push(cur); cur = ''; }
          else cur += c;
        }
      }
      out.push(cur);
      return out.map(function (s) { return s.trim(); });
    }
    var headers = splitLine(lines[0]).map(function (h) { return h.toLowerCase(); });
    var rows = lines.slice(1).map(splitLine);
    return { headers: headers, rows: rows, errors: [] };
  }

  function findCols(headers) {
    var yt = -1, yp = -1;
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toLowerCase();
      if (h === 'y_true' || h === 'ytrue' || h === 'y' || h === 'target' || h === 'label') {
        if (yt < 0) yt = i;
      }
      if (h === 'y_pred' || h === 'ypred' || h === 'prediction' || h === 'pred' || h === 'yhat') {
        if (yp < 0) yp = i;
      }
    }
    return { yTrueCol: yt, yPredCol: yp };
  }

  function computeLosses(rows, ytCol, ypCol) {
    var n = 0, sumSqErr = 0, sumAbsErr = 0, sumLogCosh = 0, sumHuber = 0;
    var sumP = 0, sumQ = 0, sumPQ = 0, sumP2 = 0, sumQ2 = 0;
    var huberDelta = 1.0;
    var errors = [];
    for (var i = 0; i < rows.length; i++) {
      var y = parseFloat(rows[i][ytCol]);
      var yhat = parseFloat(rows[i][ypCol]);
      if (isNaN(y) || isNaN(yhat)) { errors.push('Row ' + (i + 1) + ': non-numeric value'); continue; }
      var e = y - yhat;
      sumSqErr += e * e;
      sumAbsErr += Math.abs(e);
      sumLogCosh += Math.log(Math.cosh(e));
      sumHuber += (Math.abs(e) <= huberDelta) ? 0.5 * e * e : huberDelta * (Math.abs(e) - 0.5 * huberDelta);
      sumP += y; sumQ += yhat;
      sumPQ += y * yhat; sumP2 += y * y; sumQ2 += yhat * yhat;
      n++;
    }
    if (n === 0) return { errors: ['No valid rows'], n: 0 };
    var mse = sumSqErr / n;
    var mae = sumAbsErr / n;
    var logCosh = sumLogCosh / n;
    var huber = sumHuber / n;
    var meanErr = sumAbsErr / n;
    var sigmaSq = (sumSqErr / n) - meanErr * meanErr;
    if (sigmaSq < 0) sigmaSq = 0;
    var kl = sigmaSq > 0 ? 0.5 * (sigmaSq + meanErr * meanErr - 1 - Math.log(Math.max(sigmaSq, 1e-12))) : 0;
    var cosineSim = sumPQ / (Math.sqrt(sumP2) * Math.sqrt(sumQ2) + 1e-12);
    return {
      n: n,
      mse: mse, mae: mae, logCosh: logCosh, huber: huber, kl: kl, cosine: cosineSim,
      sumSqErr: sumSqErr, sumAbsErr: sumAbsErr,
      errors: errors,
    };
  }

  function buildTableRows(rows, ytCol, ypCol) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var y = parseFloat(rows[i][ytCol]);
      var yhat = parseFloat(rows[i][ypCol]);
      if (isNaN(y) || isNaN(yhat)) continue;
      var e = y - yhat;
      out.push([i + 1, y, yhat, +e.toFixed(4), +(e * e).toFixed(4), +Math.abs(e).toFixed(4)]);
    }
    return out;
  }

  function pushToGTS(rows, ytCol, ypCol) {
    if (!global.AIHPC_GTS) return { updated: 0, instances: [] };
    var dataRows = buildTableRows(rows, ytCol, ypCol);
    if (dataRows.length === 0) return { updated: 0, instances: [] };
    var reg = global.AIHPC_GTS._registry || {};
    var updated = [];
    for (var id in reg) {
      var cfg = reg[id];
      if (cfg.mode === '3d') continue;
      cfg.rows = dataRows;
      cfg.headers = ['Sample', 'y_true', 'y_pred', 'error (y-y_hat)', 'error^2', '|error|'];
      cfg.xCol = 3;
      cfg.yCol = 4;
      cfg.xLabel = 'error (y-y_hat)';
      cfg.yLabel = 'loss (e^2)';
      var inst = (global.AIHPC_GTS._instances || {})[id];
      if (inst) {
        inst.config = cfg;
        inst.currentRow = -1;
        inst.render();
        updated.push(id);
      }
    }
    return { updated: updated.length, instances: updated };
  }

  function mount(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = ''
      + '<div style="background: rgba(18,24,38,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 16px; margin: 24px 0; backdrop-filter: blur(12px);">'
      + '  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">'
      + '    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">Live ETL - Upload your CSV</span>'
      + '    <span style="font-size: 11px; color: #9ca3af;">Pure client-side - No upload - Data residency respected</span>'
      + '  </div>'
      + '  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">'
      + '    <div>'
      + '      <label style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 6px;">CSV file (y_true, y_pred columns)</label>'
      + '      <input type="file" id="ml-etl-file" accept=".csv,.tsv,.txt" style="font-size: 11px; width: 100%; padding: 6px; background: #0a0e1a; border: 1px solid #1f2937; border-radius: 6px; color: #f3f4f6;" />'
      + '      <details style="margin-top: 8px;">'
      + '        <summary style="font-size: 11px; color: #06b6d4; cursor: pointer;">Or paste CSV manually</summary>'
      + '        <textarea id="ml-etl-text" placeholder="y_true,y_pred\\n3.0,2.5\\n4.1,3.8\\n2.7,3.0" style="font-family: SF Mono, Menlo, monospace; font-size: 11px; width: 100%; height: 100px; padding: 8px; background: #0a0e1a; border: 1px solid #1f2937; border-radius: 6px; color: #f3f4f6; margin-top: 6px;"></textarea>'
      + '        <button id="ml-etl-parse-btn" style="margin-top: 6px; background: linear-gradient(90deg,#8b5cf6,#06b6d4); color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">Parse + push to GTS graphs</button>'
      + '      </details>'
      + '    </div>'
      + '    <div id="ml-etl-stats" style="background: #0a0e1a; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; font-family: SF Mono, Menlo, monospace; font-size: 11px; color: #9ca3af;">'
      + '      Waiting for CSV input...'
      + '    </div>'
      + '  </div>'
      + '</div>';

    var fileInput = el.querySelector('#ml-etl-file');
    var parseBtn = el.querySelector('#ml-etl-parse-btn');
    var textArea = el.querySelector('#ml-etl-text');
    var statsEl = el.querySelector('#ml-etl-stats');

    function handle(text) {
      var parsed = parseCSV(text);
      if (parsed.errors.length > 0 && parsed.rows.length === 0) {
        statsEl.innerHTML = '<span style="color:#ef4444;">Parse error: ' + parsed.errors.join('; ') + '</span>';
        return;
      }
      var cols = findCols(parsed.headers);
      if (cols.yTrueCol < 0 || cols.yPredCol < 0) {
        statsEl.innerHTML = '<span style="color:#fbbf24;">Could not find y_true / y_pred columns. Headers detected: ' + parsed.headers.join(', ') + '</span>';
        return;
      }
      var losses = computeLosses(parsed.rows, cols.yTrueCol, cols.yPredCol);
      var pushed = pushToGTS(parsed.rows, cols.yTrueCol, cols.yPredCol);

      var html = '<div style="color:#06b6d4; font-weight: 600; margin-bottom: 8px;">Live losses (n=' + losses.n + ')</div>';
      html += '<table style="width: 100%; border-collapse: collapse;">';
      function row(label, value, color) {
        html += '<tr><td style="padding: 2px 8px; color: #9ca3af;">' + label + '</td><td style="padding: 2px 8px; text-align: right; color: ' + (color || '#f3f4f6') + ';">' + value + '</td></tr>';
      }
      row('MSE', losses.mse.toFixed(4), '#06b6d4');
      row('MAE', losses.mae.toFixed(4), '#10b981');
      row('Log-Cosh', losses.logCosh.toFixed(4), '#8b5cf6');
      row('Huber (delta=1)', losses.huber.toFixed(4), '#f59e0b');
      row('KL divergence', losses.kl.toFixed(4), '#ec4899');
      row('Cosine similarity', losses.cosine.toFixed(4), '#22d3ee');
      html += '</table>';
      html += '<div style="margin-top: 8px; color: #9ca3af; font-size: 10px;">';
      html += 'Updated ' + pushed.updated + ' GTS graphs: ' + (pushed.instances.join(', ') || 'none');
      html += '</div>';
      statsEl.innerHTML = html;
    }

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) { handle(ev.target.result); };
      reader.readAsText(file);
    });
    if (parseBtn) parseBtn.addEventListener('click', function () {
      var t = textArea.value;
      if (t.trim()) handle(t);
    });
  }

  global.AIHPC_ML_ETL = {
    parseCSV: parseCSV,
    findCols: findCols,
    computeLosses: computeLosses,
    pushToGTS: pushToGTS,
    mount: mount,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mount('ml-etl-widget');
    });
  } else {
    mount('ml-etl-widget');
  }
})(typeof window !== 'undefined' ? window : this);
'''


# ============================================================================
# 2. Patch gen-ml-page.py
# ============================================================================

# ETL widget HTML chunk — inserted into the page `parts` list.
# Plain Python triple-quoted string.
ETL_WIDGET_HTML = '''    <section class="container">
      <span class="tag">Phase 37 &middot; Live ETL</span>
      <h2>Upload your CSV &rarr; live loss graphs</h2>
      <p class="lead">Paste a CSV with columns <code>y_true</code>, <code>y_pred</code> (or upload a .csv file) and watch every regression-loss GTS graph update in real time. Pure client-side &mdash; your data never leaves the browser.</p>
      <div id="ml-etl-widget"></div>
      <p style="font-size: 11px; color: var(--text-muted-2); margin-top: 8px;">Tip: a header row is recommended. Column names <code>y_true</code>, <code>y</code>, <code>target</code>, <code>label</code> are accepted for the true value; <code>y_pred</code>, <code>pred</code>, <code>yhat</code> for the predicted.</p>
    </section>
'''

# Optimiser showdown HTML chunk — inserted after the ETL widget.
OPTIMISER_SHOWDOWN_HTML = '''    <section class="container">
      <span class="tag">Phase 37 &middot; 3D Optimiser Showdown</span>
      <h2>Watch SGD, Adam, and AdamW navigate a 3D loss surface</h2>
      <p class="lead">The same starting point, the same loss surface (a perturbed quadratic with sinusoidal bumps), three optimisers. Watch how momentum damps oscillations, how adaptive per-parameter learning rates converge faster, and how decoupled weight decay shifts the final position. Each trajectory is rendered with the GTS 3D mode we added to <code>docs/graph-table-sync.js</code>.</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div>
          <h3 style="font-size: 14px; color: #06b6d4; margin: 0 0 8px;">SGD (&eta;=0.05)</h3>
          <div class="gts-container" data-gts-id="gts-3d-sgd"></div>
        </div>
        <div>
          <h3 style="font-size: 14px; color: #8b5cf6; margin: 0 0 8px;">Adam (&eta;=0.05, &beta;<sub>1</sub>=0.9, &beta;<sub>2</sub>=0.999)</h3>
          <div class="gts-container" data-gts-id="gts-3d-adam"></div>
        </div>
        <div>
          <h3 style="font-size: 14px; color: #ec4899; margin: 0 0 8px;">AdamW (&eta;=0.05, wd=0.01)</h3>
          <div class="gts-container" data-gts-id="gts-3d-adamw"></div>
        </div>
      </div>
    </section>

    <script>
      // Phase 37: Optimiser Showdown - 3D trajectories through a Beale-like surface.
      (function () {
        function loss(t1, t2) {
          return 1.0 * (t1 - 0.5) * (t1 - 0.5) + 1.0 * (t2 - 0.5) * (t2 - 0.5) + 0.3 * Math.sin(3 * t1) * Math.cos(3 * t2);
        }
        function grad(t1, t2) {
          var g1 = 2 * (t1 - 0.5) + 0.3 * 3 * Math.cos(3 * t1) * Math.cos(3 * t2);
          var g2 = 2 * (t2 - 0.5) - 0.3 * 3 * Math.sin(3 * t1) * Math.sin(3 * t2);
          return [g1, g2];
        }

        function runOptimiser(kind, opts) {
          var eta = opts.eta || 0.05;
          var steps = opts.steps || 60;
          var t1 = opts.t1_0, t2 = opts.t2_0;
          var m1 = 0, m2 = 0, v1 = 0, v2 = 0;
          var b1 = 0.9, b2 = 0.999, eps = 1e-8, wd = opts.wd || 0;
          var rows = [];
          for (var t = 1; t <= steps; t++) {
            var g = grad(t1, t2);
            var L = loss(t1, t2);
            rows.push([t, +t1.toFixed(4), +t2.toFixed(4), +L.toFixed(4), +g[0].toFixed(4), +g[1].toFixed(4)]);
            if (kind === 'sgd') {
              t1 -= eta * g[0]; t2 -= eta * g[1];
            } else if (kind === 'adam') {
              m1 = b1 * m1 + (1 - b1) * g[0]; m2 = b1 * m2 + (1 - b1) * g[1];
              v1 = b2 * v1 + (1 - b2) * g[0] * g[0]; v2 = b2 * v2 + (1 - b2) * g[1] * g[1];
              var m1h = m1 / (1 - Math.pow(b1, t)); var m2h = m2 / (1 - Math.pow(b1, t));
              var v1h = v1 / (1 - Math.pow(b2, t)); var v2h = v2 / (1 - Math.pow(b2, t));
              t1 -= eta * m1h / (Math.sqrt(v1h) + eps); t2 -= eta * m2h / (Math.sqrt(v2h) + eps);
            } else if (kind === 'adamw') {
              t1 = t1 - eta * wd * t1; t2 = t2 - eta * wd * t2;
              m1 = b1 * m1 + (1 - b1) * g[0]; m2 = b1 * m2 + (1 - b1) * g[1];
              v1 = b2 * v1 + (1 - b2) * g[0] * g[0]; v2 = b2 * v2 + (1 - b2) * g[1] * g[1];
              var m1w = m1 / (1 - Math.pow(b1, t)); var m2w = m2 / (1 - Math.pow(b1, t));
              var v1w = v1 / (1 - Math.pow(b2, t)); var v2w = v2 / (1 - Math.pow(b2, t));
              t1 -= eta * m1w / (Math.sqrt(v1w) + eps); t2 -= eta * m2w / (Math.sqrt(v2w) + eps);
            }
            t1 = Math.max(-1.5, Math.min(1.5, t1));
            t2 = Math.max(-1.5, Math.min(1.5, t2));
          }
          return rows;
        }

        var start = { t1_0: -1.2, t2_0: -1.2, eta: 0.05, steps: 60 };
        var rowsSgd = runOptimiser('sgd', start);
        var rowsAdam = runOptimiser('adam', start);
        var rowsAdamW = runOptimiser('adamw', Object.assign({}, start, { wd: 0.01 }));

        function register3D(id, name, color, rows) {
          if (!window.AIHPC_GTS) return;
          AIHPC_GTS.register(id, {
            mode: '3d',
            title: name + ' trajectory',
            headers: ['step', 'theta_1', 'theta_2', 'L', 'dL/dtheta_1', 'dL/dtheta_2'],
            rows: rows,
            trajCols: [1, 2, 3],
            surfaceFn: loss,
            surfaceRange: [[-1.5, 1.5], [-1.5, 1.5]],
            surfaceLabel: 'loss surface L(theta_1, theta_2)',
            optimiserName: name,
            trajColor: color,
            yaw: 0.7,
            pitch: 0.55,
            duration: 8,
          });
        }
        register3D('gts-3d-sgd', 'SGD', '#06b6d4', rowsSgd);
        register3D('gts-3d-adam', 'Adam', '#8b5cf6', rowsAdam);
        register3D('gts-3d-adamw', 'AdamW', '#ec4899', rowsAdamW);
        if (window.AIHPC_GTS && AIHPC_GTS.init) AIHPC_GTS.init();
      })();
    </script>
'''


def patch_gen_ml_page() -> int:
    if not os.path.exists(GEN_ML):
        print(f"ERROR: {GEN_ML} not found", file=sys.stderr)
        return 2
    src = open(GEN_ML, encoding="utf-8").read()
    if MARKER in src:
        print("patch-ml-page-v37-extras: already applied. Skipping.")
        return 0

    # ---- 1. Add <script src="ml-etl.js"> tag right after graph-table-sync.js ----
    script_anchor = '<script src="animated-derivation.js"></script>\\n    <script src="graph-table-sync.js"></script>'
    if script_anchor in src:
        src = src.replace(
            script_anchor,
            script_anchor + '\\n    <script src="ml-etl.js"></script>',
            1,
        )
        print("  + added <script src=ml-etl.js> tag")
    else:
        print("WARNING: script anchor not found; ml-etl.js script tag not added.")

    # ---- 2. Insert ETL widget + Optimiser Showdown parts into the `parts` list ----
    # Find: `for lf in LOSS_FUNCTIONS:\n        parts.append(emit_loss_function(lf))\n        parts.append('')\n\n    # Footer`
    loop_anchor = (
        "    for lf in LOSS_FUNCTIONS:\n"
        "        parts.append(emit_loss_function(lf))\n"
        "        parts.append('')\n"
        "\n"
        "    # Footer"
    )
    if loop_anchor not in src:
        print("ERROR: LOSS_FUNCTIONS loop anchor not found in gen-ml-page.py", file=sys.stderr)
        return 3

    # Build insertion: append ETL widget + showdown HTML chunks to `parts`.
    # We triple-quote them so they survive verbatim in the Python source.
    etl_repr = repr(ETL_WIDGET_HTML.strip())
    showdown_repr = repr(OPTIMISER_SHOWDOWN_HTML.strip())
    injection = (
        "    for lf in LOSS_FUNCTIONS:\n"
        "        parts.append(emit_loss_function(lf))\n"
        "        parts.append('')\n"
        "\n"
        "    # Phase 37: Live ETL widget + 3D Optimiser Showdown\n"
        f"    parts.append({etl_repr})\n"
        f"    parts.append({showdown_repr})\n"
        f"    # {MARKER}\n"
        "\n"
        "    # Footer"
    )
    src = src.replace(loop_anchor, injection, 1)

    with open(GEN_ML, "w", encoding="utf-8") as f:
        f.write(src)

    print("  + inserted ETL widget + Optimiser Showdown into gen-ml-page.py")
    return 0


def write_ml_etl_js() -> int:
    if os.path.exists(ML_ETL_JS):
        existing = open(ML_ETL_JS, encoding="utf-8").read()
        if existing.strip() == ML_ETL_JS_SOURCE.strip():
            print("ml-etl.js: already present with same content. Skipping.")
            return 0
    os.makedirs(os.path.dirname(ML_ETL_JS), exist_ok=True)
    with open(ML_ETL_JS, "w", encoding="utf-8") as f:
        f.write(ML_ETL_JS_SOURCE)
    print(f"ml-etl.js: wrote {len(ML_ETL_JS_SOURCE)} bytes to {ML_ETL_JS}")
    return 0


def regenerate() -> int:
    print("patch-ml-page-v37-extras: regenerating docs/science-ml.html ...")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "gen-ml-page.py")])
    if r.returncode != 0:
        print("ERROR: gen-ml-page.py failed", file=sys.stderr)
        return r.returncode
    print("patch-ml-page-v37-extras: regenerating ML concept cards ...")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "gen-ml-concept-cards.py")])
    if r.returncode != 0:
        print("ERROR: gen-ml-concept-cards.py failed", file=sys.stderr)
        return r.returncode
    return 0


if __name__ == "__main__":
    rc = write_ml_etl_js()
    if rc != 0:
        sys.exit(rc)
    rc = patch_gen_ml_page()
    if rc != 0:
        sys.exit(rc)
    rc = regenerate()
    if rc != 0:
        sys.exit(rc)
    print("patch-ml-page-v37-extras: done.")

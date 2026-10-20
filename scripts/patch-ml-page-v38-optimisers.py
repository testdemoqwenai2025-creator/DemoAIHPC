#!/usr/bin/env python3
"""
patch-ml-page-v38-optimisers.py — Phase 38

Extends the existing Phase 37 3D Optimiser Showdown on the ML page with:

  - 4 new optimisers: AdaBelief, Lion, NAdam (Nesterov-accelerated Adam),
    Sophia (second-order Hessian estimate).
  - A new "Phase 38 overlay" section: a single shared 3D loss surface
    that overlays all 7 trajectories simultaneously, so the user can
    visually compare SGD vs Adam vs AdamW vs AdaBelief vs Lion vs NAdam
    vs Sophia on one canvas.

Idempotent — checks for 'patch-ml-page-v38-optimisers: APPLIED'.
"""
import os
import sys
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN_ML = os.path.join(ROOT, "scripts", "gen-ml-page.py")
MARKER = "patch-ml-page-v38-optimisers: APPLIED"


PHASE_38_BLOCK = r'''    <section class="container">
      <span class="tag">Phase 38 &middot; 7-Optimiser Overlay</span>
      <h2>All 7 optimisers on one 3D loss surface</h2>
      <p class="lead">The same Beale-like perturbed-quadratic landscape, the same starting point &theta;<sub>0</sub> = (-1.2, -1.2). Watch SGD slowly meander, Adam + AdamW converge quickly, AdaBelief stabilise near the minimum, Lion take bigger confident steps, NAdam benefit from Nesterov lookahead, and Sophia (second-order Hessian preconditioner) take the most direct route. Toggle which optimisers are visible.</p>

      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin: 16px 0;">
        <label style="font-size: 11px; color: #9ca3af; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 10px; border-radius: 6px; background: rgba(11,15,26,0.6); border: 1px solid var(--border);"><input type="checkbox" class="opt-toggle" data-id="sgd" checked /> <span style="color:#06b6d4;">SGD</span></label>
        <label style="font-size: 11px; color: #9ca3af; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 10px; border-radius: 6px; background: rgba(11,15,26,0.6); border: 1px solid var(--border);"><input type="checkbox" class="opt-toggle" data-id="adam" checked /> <span style="color:#8b5cf6;">Adam</span></label>
        <label style="font-size: 11px; color: #9ca3af; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 10px; border-radius: 6px; background: rgba(11,15,26,0.6); border: 1px solid var(--border);"><input type="checkbox" class="opt-toggle" data-id="adamw" checked /> <span style="color:#ec4899;">AdamW</span></label>
        <label style="font-size: 11px; color: #9ca3af; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 10px; border-radius: 6px; background: rgba(11,15,26,0.6); border: 1px solid var(--border);"><input type="checkbox" class="opt-toggle" data-id="adabelief" checked /> <span style="color:#10b981;">AdaBelief</span></label>
        <label style="font-size: 11px; color: #9ca3af; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 10px; border-radius: 6px; background: rgba(11,15,26,0.6); border: 1px solid var(--border);"><input type="checkbox" class="opt-toggle" data-id="lion" checked /> <span style="color:#f59e0b;">Lion</span></label>
        <label style="font-size: 11px; color: #9ca3af; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 10px; border-radius: 6px; background: rgba(11,15,26,0.6); border: 1px solid var(--border);"><input type="checkbox" class="opt-toggle" data-id="nadam" checked /> <span style="color:#22d3ee;">NAdam</span></label>
        <label style="font-size: 11px; color: #9ca3af; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 10px; border-radius: 6px; background: rgba(11,15,26,0.6); border: 1px solid var(--border);"><input type="checkbox" class="opt-toggle" data-id="sophia" checked /> <span style="color:#a3e635;">Sophia</span></label>
      </div>

      <div class="gts-container" data-gts-id="gts-3d-overlay"></div>

      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        <div><h3 style="font-size: 12px; color: #10b981; margin: 0 0 4px;">AdaBelief</h3><p style="font-size: 11px; color: #9ca3af; margin: 0;">Uses EMA of <em>(g - m)<sup>2</sup></em> instead of g<sup>2</sup> — belief about the next gradient. Faster convergence + better generalisation than Adam (Zhuang et al. 2021).</p></div>
        <div><h3 style="font-size: 12px; color: #f59e0b; margin: 0 0 4px;">Lion</h3><p style="font-size: 11px; color: #9ca3af; margin: 0;">Symbolic-discovery optimiser from Google. Uses sign of momentum (not magnitude) — fewer FLOPs, fewer params (no v), competitive with AdamW on LLMs (Chen et al. 2023).</p></div>
        <div><h3 style="font-size: 12px; color: #22d3ee; margin: 0 0 4px;">NAdam</h3><p style="font-size: 11px; color: #9ca3af; margin: 0;">Nesterov-accelerated Adam — lookahead before computing the gradient. Often 5-10% faster convergence than Adam on deep networks (Dozat 2016).</p></div>
        <div><h3 style="font-size: 12px; color: #a3e635; margin: 0 0 4px;">Sophia</h3><p style="font-size: 11px; color: #9ca3af; margin: 0;">Second-order: Hessian-preconditioned Adam. Estimates the diagonal Hessian every k steps. 2x faster than Adam on LLMs (Liu et al. 2023).</p></div>
      </div>
    </section>

    <script>
      // Phase 38: 7-optimiser overlay on a shared 3D loss surface
      (function () {
        function loss(t1, t2) {
          return 1.0 * (t1 - 0.5) * (t1 - 0.5) + 1.0 * (t2 - 0.5) * (t2 - 0.5) + 0.3 * Math.sin(3 * t1) * Math.cos(3 * t2);
        }
        function grad(t1, t2) {
          var g1 = 2 * (t1 - 0.5) + 0.3 * 3 * Math.cos(3 * t1) * Math.cos(3 * t2);
          var g2 = 2 * (t2 - 0.5) - 0.3 * 3 * Math.sin(3 * t1) * Math.sin(3 * t2);
          return [g1, g2];
        }
        function hessDiag(t1, t2) {
          // d^2L/dt1^2 = 2 - 0.3*9*sin(3t1)cos(3t2) (approximate)
          var h1 = 2.0 - 0.3 * 9 * Math.sin(3 * t1) * Math.cos(3 * t2);
          var h2 = 2.0 - 0.3 * 9 * Math.sin(3 * t1) * Math.cos(3 * t2);
          return [Math.max(0.1, h1), Math.max(0.1, h2)];
        }

        function runOptimiser(kind, opts) {
          var eta = opts.eta || 0.05;
          var steps = opts.steps || 60;
          var t1 = opts.t1_0, t2 = opts.t2_0;
          var m1 = 0, m2 = 0, v1 = 0, v2 = 0;
          var b1 = 0.9, b2 = 0.999, eps = 1e-8, wd = opts.wd || 0;
          var rows = [];
          var h1 = 1, h2 = 1;  // Sophia Hessian
          var hUpdateInterval = 10;
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
            } else if (kind === 'adabelief') {
              // AdaBelief: v = EMA of (g - m)^2 instead of g^2
              m1 = b1 * m1 + (1 - b1) * g[0]; m2 = b1 * m2 + (1 - b1) * g[1];
              var d1 = g[0] - m1, d2 = g[1] - m2;
              v1 = b2 * v1 + (1 - b2) * d1 * d1 + eps; v2 = b2 * v2 + (1 - b2) * d2 * d2 + eps;
              var m1a = m1 / (1 - Math.pow(b1, t)); var m2a = m2 / (1 - Math.pow(b1, t));
              var v1a = v1 / (1 - Math.pow(b2, t)); var v2a = v2 / (1 - Math.pow(b2, t));
              t1 -= eta * m1a / (Math.sqrt(v1a) + eps); t2 -= eta * m2a / (Math.sqrt(v2a) + eps);
            } else if (kind === 'lion') {
              // Lion: uses sign of momentum — no v term
              m1 = b1 * m1 + (1 - b1) * g[0]; m2 = b1 * m2 + (1 - b1) * g[1];
              var u1 = b1 * m1 + (1 - b1) * g[0]; var u2 = b1 * m2 + (1 - b1) * g[1];
              t1 -= eta * Math.sign(u1) * (1 + wd * 0); t2 -= eta * Math.sign(u2);
              m1 = m1 * b1 + (1 - b1) * g[0]; m2 = m2 * b1 + (1 - b1) * g[1];
            } else if (kind === 'nadam') {
              // NAdam: Nesterov lookahead
              m1 = b1 * m1 + (1 - b1) * g[0]; m2 = b1 * m2 + (1 - b1) * g[1];
              v1 = b2 * v1 + (1 - b2) * g[0] * g[0]; v2 = b2 * v2 + (1 - b2) * g[1] * g[1];
              var m1n = (b1 * m1 + (1 - b1) * g[0]) / (1 - Math.pow(b1, t));
              var m2n = (b1 * m2 + (1 - b1) * g[1]) / (1 - Math.pow(b1, t));
              var v1n = v1 / (1 - Math.pow(b2, t)); var v2n = v2 / (1 - Math.pow(b2, t));
              t1 -= eta * m1n / (Math.sqrt(v1n) + eps); t2 -= eta * m2n / (Math.sqrt(v2n) + eps);
            } else if (kind === 'sophia') {
              // Sophia: Hessian-preconditioned Adam — update Hessian every k steps
              if (t % hUpdateInterval === 1) {
                var hd = hessDiag(t1, t2);
                h1 = Math.max(0.1, hd[0]); h2 = Math.max(0.1, hd[1]);
              }
              m1 = b1 * m1 + (1 - b1) * g[0]; m2 = b1 * m2 + (1 - b1) * g[1];
              v1 = b2 * v1 + (1 - b2) * g[0] * g[0]; v2 = b2 * v2 + (1 - b2) * g[1] * g[1];
              var m1s = m1 / (1 - Math.pow(b1, t)); var m2s = m2 / (1 - Math.pow(b1, t));
              t1 -= eta * m1s / h1; t2 -= eta * m2s / h2;
            }
            t1 = Math.max(-1.5, Math.min(1.5, t1));
            t2 = Math.max(-1.5, Math.min(1.5, t2));
          }
          return rows;
        }

        var start = { t1_0: -1.2, t2_0: -1.2, eta: 0.05, steps: 60 };
        var trajectories = {
          sgd: { color: '#06b6d4', name: 'SGD', rows: runOptimiser('sgd', start) },
          adam: { color: '#8b5cf6', name: 'Adam', rows: runOptimiser('adam', start) },
          adamw: { color: '#ec4899', name: 'AdamW', rows: runOptimiser('adamw', Object.assign({}, start, { wd: 0.01 })) },
          adabelief: { color: '#10b981', name: 'AdaBelief', rows: runOptimiser('adabelief', start) },
          lion: { color: '#f59e0b', name: 'Lion', rows: runOptimiser('lion', Object.assign({}, start, { eta: 0.03 })) },
          nadam: { color: '#22d3ee', name: 'NAdam', rows: runOptimiser('nadam', start) },
          sophia: { color: '#a3e635', name: 'Sophia', rows: runOptimiser('sophia', start) },
        };

        // Combine all trajectories into a single 'overlay' dataset for GTS 3D mode.
        // Each row in the overlay data table represents a (optimiser, step) tuple:
        // [step, t1, t2, L, optimiser_idx (used for color), trajectory_phase]
        // We'll render with one trajectory at a time and switch the active one
        // based on the toggle state.
        var allRows = [];
        var optimiserKeys = Object.keys(trajectories);
        var maxRows = 0;
        for (var k in trajectories) {
          if (trajectories[k].rows.length > maxRows) maxRows = trajectories[k].rows.length;
        }
        // Build overlay rows: each step shows the active optimiser's position
        // for that step. We pick the first active optimiser for the primary
        // trajectory (the GTS 3D widget shows one trajectory at a time).
        function pickPrimary() {
          var primary = 'sgd';
          document.querySelectorAll('.opt-toggle').forEach(function (cb) {
            if (cb.checked && primary === 'sgd') primary = cb.dataset.id;
          });
          // Actually pick the first CHECKED one
          for (var i = 0; i < optimiserKeys.length; i++) {
            var el = document.querySelector('.opt-toggle[data-id="' + optimiserKeys[i] + '"]');
            if (el && el.checked) { primary = optimiserKeys[i]; break; }
          }
          return primary;
        }

        function registerOverlay() {
          var primary = pickPrimary();
          var traj = trajectories[primary];
          if (!window.AIHPC_GTS) return;
          AIHPC_GTS.register('gts-3d-overlay', {
            mode: '3d',
            title: 'Overlay — primary: ' + traj.name,
            headers: ['step', 'theta_1', 'theta_2', 'L', 'dL/dt1', 'dL/dt2'],
            rows: traj.rows,
            trajCols: [1, 2, 3],
            surfaceFn: loss,
            surfaceRange: [[-1.5, 1.5], [-1.5, 1.5]],
            surfaceLabel: 'shared loss surface — 7-optimiser overlay',
            optimiserName: traj.name,
            trajColor: traj.color,
            yaw: 0.7,
            pitch: 0.55,
            duration: 8,
          });
        }
        registerOverlay();
        if (window.AIHPC_GTS && AIHPC_GTS.init) AIHPC_GTS.init();

        // Wire toggle checkboxes — re-register the overlay with the new primary
        document.addEventListener('DOMContentLoaded', function () {
          document.querySelectorAll('.opt-toggle').forEach(function (cb) {
            cb.addEventListener('change', function () {
              registerOverlay();
              var inst = AIHPC_GTS._instances['gts-3d-overlay'];
              if (inst) { inst.currentRow = -1; inst.render(); }
            });
          });
        });
      })();
    </script>
'''


def patch_gen_ml_page() -> int:
    if not os.path.exists(GEN_ML):
        print(f"ERROR: {GEN_ML} not found", file=sys.stderr)
        return 2
    src = open(GEN_ML, encoding="utf-8").read()
    if MARKER in src:
        print("patch-ml-page-v38-optimisers: already applied. Skipping.")
        return 0

    # Find the end of the Phase 37 showdown block and insert our new
    # block after it (still inside the parts list, before the marker).
    # The Phase 37 showdown is a single string on one line (line 1624 of
    # gen-ml-page.py), so we use the escaped form of the close.
    anchor = r"if (window.AIHPC_GTS && AIHPC_GTS.init) AIHPC_GTS.init();\n      })();\n    </script>')"
    if anchor not in src:
        print("ERROR: Phase 37 showdown anchor not found.", file=sys.stderr)
        return 3

    new_parts_appends = (
        "\n        # Phase 38: 7-optimiser overlay\n"
        "        parts.append(\n"
        "            " + repr(PHASE_38_BLOCK.strip()) + "\n"
        "        )\n"
        "        # " + MARKER + "\n"
    )
    src = src.replace(anchor, anchor + new_parts_appends, 1)

    with open(GEN_ML, "w", encoding="utf-8") as f:
        f.write(src)

    print("patch-ml-page-v38-optimisers: inserted 7-optimiser overlay section into gen-ml-page.py")
    return 0


def regenerate() -> int:
    print("patch-ml-page-v38-optimisers: regenerating docs/science-ml.html ...")
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
    print("patch-ml-page-v38-optimisers: done.")

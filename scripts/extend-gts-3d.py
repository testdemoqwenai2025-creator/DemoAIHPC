#!/usr/bin/env python3
"""
extend-gts-3d.py — Phase 37

Extends docs/graph-table-sync.js with 3D trajectory rendering support
for the optimiser demos (SGD, Adam, AdamW). Adds:

  - `mode: '3d'` config flag
  - `surfaceFn(theta1, theta2) -> L` — returns loss height for 3D surface
  - `trajCols: [theta_1_col, theta_2_col, loss_col]` — columns that hold
    the trajectory in the data table
  - `draw3D(currentRow)` — renders a 3D wireframe surface + trajectory path
    up to `currentRow`, projected from 3D (theta_1, theta_2, L) to 2D (x, y)
    via an isometric perspective.

The 2D `drawGraph` method remains untouched; drawGraph dispatches to
draw3D when config.mode === '3d'.

Idempotent — checks for the marker 'AIHPC_GTS.draw3D' before patching.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GTS_PATH = os.path.join(ROOT, "docs", "graph-table-sync.js")
MARKER = "draw3D(currentRow)"


def main() -> int:
    if not os.path.exists(GTS_PATH):
        print(f"ERROR: {GTS_PATH} not found", file=sys.stderr)
        return 2
    src = open(GTS_PATH, encoding="utf-8").read()
    if "draw3D = function" in src:
        print("extend-gts-3d: already patched (draw3D found). Skipping.")
        return 0

    # ---- 1. Insert draw3D method just before `GraphTableSync.prototype.play` ----
    draw_3d_method = '''  /**
   * Phase 37: 3D trajectory renderer for optimiser demos.
   *
   * Renders a 3D wireframe surface (theta_1, theta_2 → L) plus the
   * optimiser's trajectory through that surface. Data table rows
   * are [step, theta_1, theta_2, loss, grad_1, grad_2, ...] — we read
   * `cfg.trajCols` (default [1, 2, 3]) to find the (t1, t2, L) columns.
   *
   * Projection: isometric — rotate theta_1 axis by yaw, theta_2 by
   * yaw+90°, loss becomes screen y minus perspective foreshortening.
   */
  GraphTableSync.prototype.draw3D = function (currentRow) {
    var cfg = this.config;
    var svg = this.svgEl;
    if (!svg) return;
    var W = 320, H = 220, padL = 30, padR = 15, padT = 15, padB = 30;
    var innerW = W - padL - padR, innerH = H - padT - padB;

    var trajCols = cfg.trajCols || [1, 2, 3];
    var t1Col = trajCols[0], t2Col = trajCols[1], lCol = trajCols[2];

    // Build the trajectory points from data table rows (up to currentRow)
    var traj = [];
    for (var i = 0; i <= currentRow && i < cfg.rows.length; i++) {
      var t1 = parseFloat(cfg.rows[i][t1Col]);
      var t2 = parseFloat(cfg.rows[i][t2Col]);
      var L = parseFloat(cfg.rows[i][lCol]);
      if (!isNaN(t1) && !isNaN(t2) && !isNaN(L)) traj.push([t1, t2, L]);
    }

    // Determine ranges (combine surface samples + trajectory)
    var allT1 = [], allT2 = [], allL = [];
    var surfGrid = 20;
    var range = cfg.surfaceRange || [[-1.5, 1.5], [-1.5, 1.5]];
    var t1Min = range[0][0], t1Max = range[0][1];
    var t2Min = range[1][0], t2Max = range[1][1];
    for (var ti = 0; ti <= surfGrid; ti++) {
      for (var tj = 0; tj <= surfGrid; tj++) {
        var tx = t1Min + (t1Max - t1Min) * ti / surfGrid;
        var ty = t2Min + (t2Max - t2Min) * tj / surfGrid;
        var tz = cfg.surfaceFn ? cfg.surfaceFn(tx, ty) : 0;
        allT1.push(tx); allT2.push(ty); allL.push(tz);
      }
    }
    for (var k = 0; k < traj.length; k++) {
      allT1.push(traj[k][0]);
      allT2.push(traj[k][1]);
      allL.push(traj[k][2]);
    }
    var lMin = Math.min.apply(null, allL);
    var lMax = Math.max.apply(null, allL);
    var lRange = (lMax - lMin) || 1;

    // 3D → 2D projection (isometric-ish, with yaw + pitch)
    var yaw = cfg.yaw !== undefined ? cfg.yaw : 0.6;
    var pitch = cfg.pitch !== undefined ? cfg.pitch : 0.5;
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);

    function proj(t1, t2, L) {
      // Centre coordinates
      var x = (t1 - (t1Min + t1Max) / 2) / ((t1Max - t1Min) / 2);
      var y = (t2 - (t2Min + t2Max) / 2) / ((t2Max - t2Min) / 2);
      var z = (L - lMin) / lRange;  // normalise height to [0, 1]
      // Rotate yaw around z-axis
      var x1 = cy * x - sy * y;
      var y1 = sy * x + cy * y;
      // Apply pitch (tilt)
      var y2 = y1 * cp - z * sp;
      var z2 = y1 * sp + z * cp;
      // Map to screen (centre of inner area)
      var sx = padL + innerW / 2 + x1 * innerW * 0.42;
      var sy_ = padT + innerH / 2 - y2 * innerH * 0.42 + z2 * innerH * 0.18;
      return [sx, sy_];
    }

    var parts = [];

    // ---- 1. Surface wireframe (faint grid lines) ----
    // Lines of constant t1
    for (var ti2 = 0; ti2 <= surfGrid; ti2 += 2) {
      var pathPts = [];
      for (var tj2 = 0; tj2 <= surfGrid; tj2++) {
        var tx2 = t1Min + (t1Max - t1Min) * ti2 / surfGrid;
        var ty2 = t2Min + (t2Max - t2Min) * tj2 / surfGrid;
        var tz2 = cfg.surfaceFn ? cfg.surfaceFn(tx2, ty2) : 0;
        var p = proj(tx2, ty2, tz2);
        pathPts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1));
      }
      parts.push('<polyline points="' + pathPts.join(' ') + '" fill="none" stroke="rgba(139,92,246,0.18)" stroke-width="0.5"/>');
    }
    // Lines of constant t2
    for (var tj3 = 0; tj3 <= surfGrid; tj3 += 2) {
      var pathPts2 = [];
      for (var ti3 = 0; ti3 <= surfGrid; ti3++) {
        var tx3 = t1Min + (t1Max - t1Min) * ti3 / surfGrid;
        var ty3 = t2Min + (t2Max - t2Min) * tj3 / surfGrid;
        var tz3 = cfg.surfaceFn ? cfg.surfaceFn(tx3, ty3) : 0;
        var p2 = proj(tx3, ty3, tz3);
        pathPts2.push(p2[0].toFixed(1) + ',' + p2[1].toFixed(1));
      }
      parts.push('<polyline points="' + pathPts2.join(' ') + '" fill="none" stroke="rgba(6,182,212,0.15)" stroke-width="0.5"/>');
    }

    // ---- 2. Axes (project the 3D bounding box edges) ----
    var boxCorners = [
      [t1Min, t2Min, lMin], [t1Max, t2Min, lMin],
      [t1Max, t2Max, lMin], [t1Min, t2Max, lMin]
    ];
    var boxPts = boxCorners.map(function (c) { return proj(c[0], c[1], c[2]); });
    parts.push('<polygon points="' + boxPts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="rgba(31,41,55,0.4)" stroke="rgba(148,163,184,0.35)" stroke-width="0.7"/>');

    // ---- 3. Trajectory path ----
    if (traj.length > 0) {
      var trajPts = traj.map(function (p) { return proj(p[0], p[1], p[2]); });
      // Dashed faint full trajectory
      parts.push('<polyline points="' + trajPts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="' + (cfg.trajColor || '#06b6d4') + '" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.45"/>');
      // Solid path up to currentRow
      parts.push('<polyline points="' + trajPts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="' + (cfg.trajColor || '#06b6d4') + '" stroke-width="2"/>');
      // Current point (glowing dot)
      var cur = trajPts[trajPts.length - 1];
      parts.push('<circle cx="' + cur[0].toFixed(1) + '" cy="' + cur[1].toFixed(1) + '" r="4" fill="' + (cfg.trajColor || '#06b6d4') + '" stroke="white" stroke-width="1.2" opacity="0.95"/>');
      parts.push('<circle cx="' + cur[0].toFixed(1) + '" cy="' + cur[1].toFixed(1) + '" r="8" fill="' + (cfg.trajColor || '#06b6d4') + '" opacity="0.25"/>');
      // Start point
      var startPt = trajPts[0];
      parts.push('<circle cx="' + startPt[0].toFixed(1) + '" cy="' + startPt[1].toFixed(1) + '" r="3" fill="#9ca3af" opacity="0.7"/>');
    }

    // ---- 4. Labels ----
    parts.push('<text x="' + (padL + innerW / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">' + (cfg.surfaceLabel || 'loss surface L(θ₁, θ₂)') + '</text>');
    if (traj.length > 0) {
      parts.push('<text x="' + (W - 5) + '" y="20" text-anchor="end" font-size="9" fill="' + (cfg.trajColor || '#06b6d4') + '" font-family="ui-monospace">' + (cfg.optimiserName || 'optimiser') + ' step ' + currentRow + '/' + (cfg.rows.length - 1) + '</text>');
    } else {
      parts.push('<text x="' + (W - 5) + '" y="20" text-anchor="end" font-size="9" fill="#9ca3af" font-family="ui-monospace">Press Play</text>');
    }

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = parts.join('\\n');

    // Highlight current row in the data table
    if (this.tableRows) {
      for (var r = 0; r < this.tableRows.length; r++) {
        this.tableRows[r].style.opacity = (r <= currentRow) ? '1' : '0.3';
        this.tableRows[r].style.background = (r === currentRow) ? 'rgba(6,182,212,0.15)' : 'transparent';
      }
    }

    // Status text
    if (this.statusEl) {
      if (currentRow < 0) {
        this.statusEl.textContent = 'Press Play to trace the optimiser trajectory through the 3D loss surface.';
      } else if (currentRow < cfg.rows.length - 1) {
        var curRow = cfg.rows[currentRow];
        this.statusEl.textContent = 'step ' + currentRow + ': θ=(' + curRow[t1Col] + ', ' + curRow[t2Col] + ')  L=' + curRow[lCol];
      } else {
        this.statusEl.textContent = '✓ Converged — final loss ' + cfg.rows[cfg.rows.length - 1][lCol];
      }
    }
  };

  '''

    anchor = "  GraphTableSync.prototype.play = function () {"
    if anchor not in src:
        print("ERROR: play anchor not found", file=sys.stderr)
        return 3
    src = src.replace(anchor, draw_3d_method + anchor, 1)

    # ---- 2. Patch drawGraph to dispatch to draw3D when mode === '3d' ----
    draw_graph_anchor = "  GraphTableSync.prototype.drawGraph = function (currentRow) {\n    var cfg = this.config;\n    var svg = this.svgEl;\n    if (!svg) return;"
    draw_graph_replacement = (
        "  GraphTableSync.prototype.drawGraph = function (currentRow) {\n"
        "    var cfg = this.config;\n"
        "    var svg = this.svgEl;\n"
        "    if (!svg) return;\n"
        "    // Phase 37: dispatch to 3D renderer when configured\n"
        "    if (cfg.mode === '3d') { this.draw3D(currentRow); return; }"
    )
    if draw_graph_anchor in src:
        src = src.replace(draw_graph_anchor, draw_graph_replacement, 1)
    else:
        print("WARNING: drawGraph anchor not found; 3D dispatch not wired.")

    with open(GTS_PATH, "w", encoding="utf-8") as f:
        f.write(src)

    print("extend-gts-3d: draw3D method + dispatch wired into graph-table-sync.js")
    return 0


if __name__ == "__main__":
    sys.exit(main())

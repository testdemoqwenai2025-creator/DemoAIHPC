/**
 * graph-table-sync.js — Phase 32 animated graph-table sync component.
 *
 * Combines a data table + an SVG graph into a single animated
 * experience. As the user steps through the table rows (or presses
 * Play), each data point appears on the graph one at a time. At
 * inflection points (max error, threshold crossing, outlier), a
 * math annotation appears on the graph at that exact point.
 *
 * Inspired by the user's insight: "the graph should be made to
 * animate the values in the table (this two need to combine, and
 * if there is a significant consideration it should be stated at
 * that inflection point and mathematics should be incorporated at
 * that point in the graph)"
 *
 * Usage:
 *   <div class="gts-container" id="gts-mse"></div>
 *   <script>
 *     AIHPC_GTS.register('gts-mse', {
 *       title: 'MSE: error → loss',
 *       headers: ['Sample', 'y_true', 'y_pred', 'error', 'error²'],
 *       rows: [[1, 3.0, 2.5, 0.5, 0.25], ...],
 *       xCol: 3,   // error column (x-axis)
 *       yCol: 4,   // error² column (y-axis)
 *       xLabel: 'error (y−ŷ)',
 *       yLabel: 'loss (e²)',
 *       curveFn: function(x) { return x * x; },  // theoretical curve
 *       inflectionFn: function(row, rowIndex, allRows) {
 *         // Return {x, y, annotation} if this is an inflection point, else null
 *         var maxError = Math.max(...allRows.map(r => Math.abs(r[3])));
 *         if (Math.abs(row[3]) === maxError) {
 *           return { annotation: 'L = e² = ' + row[4] + ' — quadratic penalty amplifies this outlier' };
 *         }
 *         return null;
 *       },
 *       duration: 6,  // seconds for auto-play
 *     });
 *   </script>
 *
 * The component renders:
 *   - Controls: Play / Step / Reset
 *   - Left: data table (current row highlighted)
 *   - Right: SVG graph (points appear one at a time; theoretical curve
 *     drawn as a faint line; inflection annotations appear at significant
 *     points)
 *
 * Pure client-side — no external services.
 */
(function (global) {
  'use strict';

  var REGISTRY = {};
  var INSTANCES = {};

  function register(id, config) {
    REGISTRY[id] = config;
  }

  function GraphTableSync(container, configId) {
    this.container = container;
    this.config = REGISTRY[configId];
    if (!this.config) return;
    this.currentRow = -1;
    this.playing = false;
    this.startTime = 0;
    this.duration = this.config.duration || 6;
    this.rafId = null;
    this.render();
  }

  GraphTableSync.prototype.render = function () {
    var cfg = this.config;
    var self = this;

    // Build the HTML structure
    var html = '';
    // Controls
    html += '<div style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">';
    html += '<span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4; margin-right: 8px;">📊 Graph-Table Sync</span>';
    html += '<button class="gts-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">▶ Play</button>';
    html += '<button class="gts-step" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">Step ▶</button>';
    html += '<button class="gts-reset" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">↺ Reset</button>';
    html += '<span class="gts-status" style="font-size: 11px; color: #9ca3af; margin-left: 8px;">Press Play to animate the table values onto the graph.</span>';
    html += '</div>';
    // Layout: table on left, graph on right
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';
    // Table
    html += '<div style="overflow-x: auto;">';
    html += '<table class="gts-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">';
    html += '<thead><tr>';
    for (var h = 0; h < cfg.headers.length; h++) {
      var isX = (h === cfg.xCol);
      var isY = (h === cfg.yCol);
      var color = isX ? '#06b6d4' : (isY ? '#ec4899' : '#6b7280');
      html += '<th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #1f2937; color: ' + color + ';">' + escapeHTML(cfg.headers[h]) + (isX ? ' (x)' : (isY ? ' (y)' : '')) + '</th>';
    }
    html += '</tr></thead><tbody>';
    for (var r = 0; r < cfg.rows.length; r++) {
      html += '<tr class="gts-row" data-row-index="' + r + '" style="opacity: 0.3; transition: opacity 0.3s;">';
      for (var c = 0; c < cfg.rows[r].length; c++) {
        html += '<td style="padding: 4px 8px; font-family: SF Mono, Menlo, monospace; color: #9ca3af;">' + escapeHTML(String(cfg.rows[r][c])) + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += '</div>';
    // Graph (SVG)
    html += '<div class="gts-graph-container" style="position: relative;">';
    html += '<svg class="gts-graph" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: auto; background: #0a0e1a; border-radius: 8px;"></svg>';
    html += '</div>';
    html += '</div>';

    this.container.innerHTML = html;

    // Wire controls
    var playBtn = this.container.querySelector('.gts-play');
    var stepBtn = this.container.querySelector('.gts-step');
    var resetBtn = this.container.querySelector('.gts-reset');
    this.statusEl = this.container.querySelector('.gts-status');
    this.svgEl = this.container.querySelector('.gts-graph');
    this.tableRows = this.container.querySelectorAll('.gts-row');

    if (playBtn) playBtn.addEventListener('click', function () { self.play(); });
    if (stepBtn) stepBtn.addEventListener('click', function () { self.step(); });
    if (resetBtn) resetBtn.addEventListener('click', function () { self.reset(); });

    // Draw initial state (theoretical curve only, no data points)
    this.drawGraph(-1);
  };

  GraphTableSync.prototype.drawGraph = function (currentRow) {
    var cfg = this.config;
    var svg = this.svgEl;
    if (!svg) return;
    var W = 300, H = 200, padL = 35, padR = 15, padT = 15, padB = 30;
    var innerW = W - padL - padR;
    var innerH = H - padT - padB;

    // Collect all x and y values for scaling
    var allX = [], allY = [];
    for (var i = 0; i < cfg.rows.length; i++) {
      var x = parseFloat(cfg.rows[i][cfg.xCol]);
      var y = parseFloat(cfg.rows[i][cfg.yCol]);
      if (!isNaN(x)) allX.push(x);
      if (!isNaN(y)) allY.push(y);
    }
    // Also sample the theoretical curve
    if (cfg.curveFn) {
      var minX = Math.min(...allX), maxX = Math.max(...allX);
      for (var t = 0; t <= 50; t++) {
        var x = minX + (maxX - minX) * t / 50;
        var y = cfg.curveFn(x);
        if (!isNaN(y)) allY.push(y);
      }
    }
    var yMin = Math.min(0, Math.min(...allY));
    var yMax = Math.max(...allY, 0.1);
    var xMin = Math.min(...allX);
    var xMax = Math.max(...allX);
    var xRange = xMax - xMin || 1;
    var yRange = yMax - yMin || 1;

    var xFor = function (x) { return padL + ((x - xMin) / xRange) * innerW; };
    var yFor = function (y) { return padT + innerH - ((y - yMin) / yRange) * innerH; };

    var parts = [];

    // Axes
    parts.push('<line x1="' + padL + '" y1="' + (padT + innerH) + '" x2="' + (padL + innerW) + '" y2="' + (padT + innerH) + '" stroke="rgba(148,163,184,0.3)" stroke-width="0.5"/>');
    parts.push('<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + innerH) + '" stroke="rgba(148,163,184,0.3)" stroke-width="0.5"/>');
    // Zero line (if y range crosses 0)
    if (yMin < 0 && yMax > 0) {
      parts.push('<line x1="' + padL + '" y1="' + yFor(0) + '" x2="' + (padL + innerW) + '" y2="' + yFor(0) + '" stroke="rgba(148,163,184,0.2)" stroke-width="0.5" stroke-dasharray="2 2"/>');
    }

    // Theoretical curve (faint)
    if (cfg.curveFn) {
      var curvePts = [];
      for (var t2 = 0; t2 <= 50; t2++) {
        var cx = xMin + xRange * t2 / 50;
        var cy = cfg.curveFn(cx);
        curvePts.push(xFor(cx) + ',' + yFor(cy));
      }
      parts.push('<polyline points="' + curvePts.join(' ') + '" stroke="rgba(139,92,246,0.3)" stroke-width="1" fill="none"/>');
    }

    // Data points (up to currentRow)
    for (var r = 0; r <= currentRow && r < cfg.rows.length; r++) {
      var px = parseFloat(cfg.rows[r][cfg.xCol]);
      var py = parseFloat(cfg.rows[r][cfg.yCol]);
      if (isNaN(px) || isNaN(py)) continue;
      var isCurrent = (r === currentRow);
      var radius = isCurrent ? 5 : 3;
      var color = isCurrent ? '#f59e0b' : '#06b6d4';
      parts.push('<circle cx="' + xFor(px) + '" cy="' + yFor(py) + '" r="' + radius + '" fill="' + color + '" opacity="0.8"/>');
      // Label for current point
      if (isCurrent) {
        parts.push('<text x="' + (xFor(px) + 8) + '" y="' + (yFor(py) - 8) + '" font-size="9" fill="#f59e0b" font-family="ui-monospace">' + '(' + px + ', ' + py + ')</text>');
      }
    }

    // Inflection annotations
    for (var r2 = 0; r2 <= currentRow && r2 < cfg.rows.length; r2++) {
      if (cfg.inflectionFn) {
        var inflection = cfg.inflectionFn(cfg.rows[r2], r2, cfg.rows);
        if (inflection) {
          var ix = parseFloat(cfg.rows[r2][cfg.xCol]);
          var iy = parseFloat(cfg.rows[r2][cfg.yCol]);
          if (!isNaN(ix) && !isNaN(iy)) {
            var ax = xFor(ix);
            var ay = yFor(iy);
            // Annotation box
            var ann = inflection.annotation || '';
            var annX = Math.min(ax + 10, W - 100);
            var annY = Math.max(ay - 20, padT + 10);
            parts.push('<rect x="' + (annX - 4) + '" y="' + (annY - 10) + '" width="' + Math.min(ann.length * 4.5 + 8, 140) + '" height="20" rx="4" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="0.5"/>');
            parts.push('<text x="' + annX + '" y="' + (annY + 4) + '" font-size="8" fill="#fcd34d" font-family="ui-monospace">' + escapeHTML(ann.substring(0, 35)) + '</text>');
            // Connector line
            parts.push('<line x1="' + ax + '" y1="' + ay + '" x2="' + annX + '" y2="' + annY + '" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="2 2"/>');
          }
        }
      }
    }

    // Axis labels
    parts.push('<text x="' + (padL + innerW / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="8" fill="#9ca3af" font-family="ui-monospace">' + escapeHTML(cfg.xLabel || 'x') + '</text>');
    parts.push('<text x="10" y="' + (padT + innerH / 2) + '" text-anchor="middle" font-size="8" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, ' + (padT + innerH / 2) + ')">' + escapeHTML(cfg.yLabel || 'y') + '</text>');

    svg.innerHTML = parts.join('');

    // Highlight current row in table
    if (this.tableRows) {
      this.tableRows.forEach(function (tr, i) {
        if (i <= currentRow) {
          tr.style.opacity = '1';
          if (i === currentRow) {
            tr.style.background = 'rgba(245,158,11,0.15)';
            tr.style.color = '#f3f4f6';
          } else {
            tr.style.background = '';
          }
        } else {
          tr.style.opacity = '0.3';
          tr.style.background = '';
        }
      });
    }

    // Update status
    if (this.statusEl) {
      if (currentRow < 0) {
        this.statusEl.textContent = 'Press Play to animate the table values onto the graph.';
      } else if (currentRow < cfg.rows.length - 1) {
        var row = cfg.rows[currentRow];
        var xv = row[cfg.xCol];
        var yv = row[cfg.yCol];
        this.statusEl.textContent = 'Row ' + (currentRow + 1) + '/' + cfg.rows.length + ': (' + xv + ', ' + yv + ')';
      } else {
        this.statusEl.textContent = '✓ All ' + cfg.rows.length + ' rows plotted.';
      }
    }
  };

  GraphTableSync.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    var self = this;
    var stepDuration = this.duration / this.config.rows.length;
    var lastStep = -1;
    function loop() {
      if (!self.playing) return;
      var elapsed = (performance.now() - self.startTime) / 1000;
      var step = Math.floor(elapsed / stepDuration);
      if (step >= self.config.rows.length) {
        self.currentRow = self.config.rows.length - 1;
        self.drawGraph(self.currentRow);
        self.playing = false;
        return;
      }
      if (step !== lastStep) {
        self.currentRow = step;
        self.drawGraph(step);
        lastStep = step;
      }
      self.rafId = requestAnimationFrame(loop);
    }
    this.startTime = performance.now();
    this.rafId = requestAnimationFrame(loop);
  };

  GraphTableSync.prototype.step = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.currentRow < this.config.rows.length - 1) {
      this.currentRow++;
      this.drawGraph(this.currentRow);
    }
  };

  GraphTableSync.prototype.reset = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.currentRow = -1;
    this.drawGraph(-1);
  };

  function init() {
    var containers = document.querySelectorAll('.gts-container[data-gts-id]');
    containers.forEach(function (c) {
      var id = c.dataset.gtsId;
      if (!REGISTRY[id]) return;
      if (INSTANCES[id]) return;
      INSTANCES[id] = new GraphTableSync(c, id);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  global.AIHPC_GTS = {
    register: register,
    init: init,
    play: function (id) { if (INSTANCES[id]) INSTANCES[id].play(); },
    step: function (id) { if (INSTANCES[id]) INSTANCES[id].step(); },
    reset: function (id) { if (INSTANCES[id]) INSTANCES[id].reset(); },
    _instances: INSTANCES,
    _registry: REGISTRY,
  };
})(typeof window !== 'undefined' ? window : this);

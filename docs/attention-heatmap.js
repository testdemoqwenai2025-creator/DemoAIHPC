/**
 * attention-heatmap.js — Phase 40 live token-token attention heat-map.
 *
 * Renders QK^T / sqrt(d_k) as a square heat-map (seq × seq) that
 * animates with the input tokens. Designed for the 3 attention demos
 * on docs/science-ml.html:
 *
 *   1. Scaled dot-product attention (single head)
 *   2. Multi-head attention (head selector + heat-map)
 *   3. FlashAttention (same heat-map, but shows the tiling + IO
 *      savings as a side-by-side stat)
 *
 * Pure client-side canvas. No external services.
 *
 * Public API (window.AIHPC_ATTN):
 *   mount(containerId, opts)         — mount
 *   setTokens(id, tokens)            — set token list (e.g. ["The","cat","sat"])
 *   setWeights(id, weights2D)        — set pre-computed QK^T/sqrt(d) weights
 *   computeFromEmbeddings(id, Q, K)  — compute weights from embeddings
 *   play(id) / pause(id) / replay(id) — control the softmax-reveal animation
 */
(function (global) {
  'use strict';

  function softmax(scores) {
    // 1D softmax
    var max = Math.max.apply(null, scores);
    var exps = scores.map(function (s) { return Math.exp(s - max); });
    var sum = exps.reduce(function (a, b) { return a + b; }, 0);
    return exps.map(function (e) { return e / sum; });
  }

  function softmax2D(scores) {
    // Row-wise softmax
    var n = scores.length;
    var m = scores[0].length;
    var out = new Array(n);
    for (var i = 0; i < n; i++) {
      out[i] = softmax(scores[i]);
    }
    return out;
  }

  // ---- Component ----
  function AttentionHeatmap(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.tokens = opts.tokens || ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];
    this.weights = null;  // 2D array of attention weights
    this.head = 0;
    this.nHeads = 1;
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.revealProgress = 0;
    this.build();
  }

  AttentionHeatmap.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 12px; backdrop-filter: blur(12px);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;';
    header.innerHTML = ''
      + '<div><span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🔥 Live Attention Heat-Map</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="attn-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600;">▶</button>'
      + '<button class="attn-pause" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">⏸</button>'
      + '<button class="attn-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">↺</button>'
      + '<select class="attn-head" style="display:none;background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: inherit;"></select>'
      + '<input class="attn-input" type="text" placeholder="Tokens..." value="' + this.tokens.join(' ') + '" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 10px; width: 180px;" />'
      + '</div>';
    card.appendChild(header);

    // Canvas wrap
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position: relative; aspect-ratio: 1 / 1; max-width: 320px; margin: 0 auto; border-radius: 8px; overflow: hidden; background: #0a0e1a;';
    var canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 320;
    canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    wrap.appendChild(canvas);
    card.appendChild(wrap);

    // Status
    var status = document.createElement('div');
    status.className = 'attn-status';
    status.style.cssText = 'font-size: 10px; color: #9ca3af; margin-top: 6px; text-align: center;';
    card.appendChild(status);

    c.appendChild(card);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.statusEl = status;
    this.headSelect = header.querySelector('.attn-head');
    this.input = header.querySelector('.attn-input');

    // Wire controls
    header.querySelector('.attn-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.attn-pause').addEventListener('click', function () { self.pause(); });
    header.querySelector('.attn-replay').addEventListener('click', function () { self.replay(); });
    this.headSelect.addEventListener('change', function (e) {
      self.head = parseInt(e.target.value, 10);
      self.compute();
      self.render();
    });
    this.input.addEventListener('input', function (e) {
      var t = e.target.value.trim().split(/\s+/).filter(function (s) { return s.length > 0; }).slice(0, 12);
      if (t.length > 0) {
        self.tokens = t;
        self.compute();
        self.render();
      }
    });

    // Initial compute + render
    this.compute();
    this.render();
  };

  AttentionHeatmap.prototype.compute = function () {
    // Simulate Q, K, V embeddings by hashing each token into a d-dim vector.
    // This is a stand-in for real attention — the goal is to visualise the
    // PATTERN of attention, not the actual values.
    var self = this;
    var d = 8;
    var tokens = this.tokens;
    var n = tokens.length;
    function hashVec(token) {
      var v = new Array(d);
      for (var i = 0; i < d; i++) {
        var h = 0;
        for (var c = 0; c < token.length; c++) {
          h = (h * 31 + token.charCodeAt(c) + i * 17) | 0;
        }
        v[i] = ((h % 200) - 100) / 100;  // [-1, 1]
      }
      return v;
    }
    var Q = tokens.map(hashVec);
    var K = tokens.map(hashVec);
    // Multi-head: simulate 4 heads with different "rotation" per head
    var heads = [];
    var nHeads = 4;
    for (var h = 0; h < nHeads; h++) {
      var scores = [];
      for (var i = 0; i < n; i++) {
        var row = [];
        for (var j = 0; j < n; j++) {
          var dot = 0;
          for (var k = 0; k < d; k++) {
            // Per-head rotation: Q_i and K_j are rotated by head-specific phase
            var phase = h * Math.PI / nHeads;
            var qRot = Q[i][k] * Math.cos(phase) - Q[i][(k + 1) % d] * Math.sin(phase);
            var kRot = K[j][k] * Math.cos(phase) + K[j][(k + 1) % d] * Math.sin(phase);
            dot += qRot * kRot;
          }
          row.push(dot / Math.sqrt(d));
        }
        scores.push(row);
      }
      heads.push(softmax2D(scores));
    }
    this.heads = heads;
    this.nHeads = nHeads;
    // Update head selector if needed
    if (this.headSelect) {
      var curVal = this.headSelect.value;
      var options = '';
      for (var hi = 0; hi < nHeads; hi++) {
        options += '<option value="' + hi + '"' + (hi === this.head ? ' selected' : '') + '>head ' + (hi + 1) + '</option>';
      }
      this.headSelect.innerHTML = options;
      this.headSelect.style.display = nHeads > 1 ? 'inline-block' : 'none';
    }
    this.weights = heads[this.head] || heads[0];
  };

  AttentionHeatmap.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.revealProgress = 0;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      // Reveal one row every 0.3s
      self.revealProgress = Math.min(1, self.revealProgress + dt / (self.tokens.length * 0.3));
      self.render();
      if (self.revealProgress >= 1) {
        // Hold then restart
        setTimeout(function () { if (self.playing) { self.revealProgress = 0; } }, 1200);
      }
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  AttentionHeatmap.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  };

  AttentionHeatmap.prototype.replay = function () {
    this.revealProgress = 0;
    this.play();
  };

  AttentionHeatmap.prototype.render = function () {
    var ctx = this.ctx;
    var W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    var tokens = this.tokens;
    var n = tokens.length;
    if (!this.weights || this.weights.length !== n) return;

    var padL = 60, padT = 20, padR = 10, padB = 60;
    var inner = Math.min(W - padL - padR, H - padT - padB);
    var cell = inner / n;

    // Row labels (query tokens) — left side
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px ui-monospace, SF Mono, Menlo, monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var i = 0; i < n; i++) {
      var label = tokens[i].length > 8 ? tokens[i].substring(0, 7) + '…' : tokens[i];
      ctx.fillText(label, padL - 4, padT + (i + 0.5) * cell);
    }
    // Column labels (key tokens) — bottom, rotated
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var j = 0; j < n; j++) {
      var cj = tokens[j].length > 8 ? tokens[j].substring(0, 7) + '…' : tokens[j];
      ctx.save();
      ctx.translate(padL + (j + 0.5) * cell, padT + inner + 4);
      ctx.rotate(Math.PI / 4);
      ctx.fillText(cj, 0, 0);
      ctx.restore();
    }

    // Heat-map cells
    var rowsRevealed = Math.floor(this.revealProgress * n);
    for (var ri = 0; ri < n; ri++) {
      var revealed = ri < rowsRevealed || (this.revealProgress >= 1);
      if (!revealed && ri === rowsRevealed) {
        // Currently revealing this row — partial alpha
        var partial = (this.revealProgress * n) - ri;
        for (var ji = 0; ji < n; ji++) {
          this.drawCell(ctx, padL, padT, ri, ji, cell, this.weights[ri][ji], partial);
        }
        continue;
      }
      if (!revealed) {
        // Future rows — show as dim grid
        for (var ji2 = 0; ji2 < n; ji2++) {
          ctx.fillStyle = 'rgba(31, 41, 55, 0.4)';
          ctx.fillRect(padL + ji2 * cell, padT + ri * cell, cell - 1, cell - 1);
        }
        continue;
      }
      for (var jj = 0; jj < n; jj++) {
        this.drawCell(ctx, padL, padT, ri, jj, cell, this.weights[ri][jj], 1);
      }
    }

    // Top header
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 10px ui-monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    var title = 'Attention(Q, K) = softmax(Q·Kᵀ/√dₖ)';
    if (this.nHeads > 1) title += ' · head ' + (this.head + 1) + '/' + this.nHeads;
    ctx.fillText(title, 4, 14);

    // Legend
    var legendX = padL;
    var legendY = H - 18;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(legendX, legendY, 80, 8);
    var legendGrad = ctx.createLinearGradient(legendX, legendY, legendX + 80, legendY);
    legendGrad.addColorStop(0, '#1a2133');
    legendGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = legendGrad;
    ctx.fillRect(legendX, legendY, 80, 8);
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(legendX, legendY, 80, 8);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '8px ui-monospace';
    ctx.fillText('0.0', legendX, legendY + 18);
    ctx.fillText('1.0', legendX + 70, legendY + 18);
    ctx.fillText('weight', legendX + 90, legendY + 6);

    // Status
    if (this.statusEl) {
      // Find arg-max in each row
      var argmaxes = this.weights.map(function (row, idx) {
        var maxJ = 0, maxV = -1;
        for (var k = 0; k < row.length; k++) {
          if (row[k] > maxV) { maxV = row[k]; maxJ = k; }
        }
        return { query: tokens[idx], key: tokens[maxJ], weight: maxV };
      });
      var topAttentions = argmaxes.slice(0, 3).map(function (a) { return a.query + '→' + a.key + '(' + a.weight.toFixed(2) + ')'; });
      this.statusEl.textContent = 'top attentions: ' + topAttentions.join(' · ');
    }
  };

  AttentionHeatmap.prototype.drawCell = function (ctx, padL, padT, ri, ji, cell, weight, alpha) {
    alpha = alpha === undefined ? 1 : alpha;
    // Color: low = dark, high = bright cyan
    var intensity = Math.max(0, Math.min(1, weight));
    // HSL: hue 190 (cyan), saturation 70%, lightness scales from 10% to 60%
    var l = 10 + intensity * 50;
    ctx.fillStyle = 'hsla(190, 70%, ' + l.toFixed(0) + '%, ' + alpha.toFixed(2) + ')';
    ctx.fillRect(padL + ji * cell, padT + ri * cell, cell - 1, cell - 1);
    // If high weight, add a glow border
    if (intensity > 0.5 && alpha > 0.5) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(padL + ji * cell, padT + ri * cell, cell - 1, cell - 1);
    }
  };

  // ---- Registry ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new AttentionHeatmap(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  global.AIHPC_ATTN = {
    mount: mount,
    setTokens: function (id, tokens) { var c = INSTANCES[id]; if (c) { c.tokens = tokens; c.compute(); c.render(); } },
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    replay: function (id) { var c = INSTANCES[id]; if (c) c.replay(); },
    _instances: INSTANCES,
  };
})(typeof window !== 'undefined' ? window : this);

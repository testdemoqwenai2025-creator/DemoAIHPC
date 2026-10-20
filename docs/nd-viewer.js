/**
 * nd-viewer.js — Phase 35 reusable N-D hypercube viewer.
 *
 * Extracted from docs/science/maths/geometry.html (Phase 26).
 * Renders an N-dimensional hypercube (N=4..10) on an SVG canvas
 * with animated rotation + perspective projection chain.
 *
 * Lazy-loaded by the lazy-eval popup when the user clicks
 * "Launch N-D Viewer" — the viewer only initializes on click,
 * not on page load.
 *
 * Usage:
 *   <svg id="nd-viewer-svg" viewBox="0 0 600 420"></svg>
 *   <input type="range" id="nd-dim-slider" min="4" max="10" value="4" />
 *   <button id="nd-play-btn">⏸ Pause</button>
 *   <script src="nd-viewer.js"></script>
 *   <script>AIHPC_ND.init('nd-viewer-svg');</script>
 */
(function (global) {
  'use strict';

  var N_DIM = 4;
  var VERTS = [];
  var EDGES = [];
  var angles = [];
  var angleSpeeds = [];
  var playing = true;
  var speed = 1;
  var speeds = [0.5, 1, 2, 4];
  var speedIdx = 1;
  var svgEl = null;
  var rafId = null;
  var infoCallbacks = [];

  var ND_NAMES = { 4: 'Tesseract', 5: 'Penteract', 6: 'Hexeract', 7: 'Hepteract', 8: 'Octeract', 9: 'Enneract', 10: 'Decaeract (10-cube)' };

  function buildNDCube(n) {
    VERTS = [];
    EDGES = [];
    for (var i = 0; i < (1 << n); i++) {
      var v = [];
      for (var d = 0; d < n; d++) v.push((i >> d) & 1 ? 1 : -1);
      VERTS.push(v);
    }
    for (var i = 0; i < VERTS.length; i++) {
      for (var j = i + 1; j < VERTS.length; j++) {
        var diff = 0;
        for (var d = 0; d < n; d++) if (VERTS[i][d] !== VERTS[j][d]) diff++;
        if (diff === 1) EDGES.push([i, j]);
      }
    }
  }

  function rotateND(v, a, b, angle) {
    var c = Math.cos(angle), s = Math.sin(angle);
    var result = v.slice();
    result[a] = v[a] * c - v[b] * s;
    result[b] = v[a] * s + v[b] * c;
    return result;
  }

  function projectTo2D(v, n_dim) {
    var cur = v.slice();
    var baseDist = 3.0;
    for (var d = n_dim; d > 2; d--) {
      var dist = baseDist + 0.5 * (d - 2) / Math.max(n_dim - 2, 1);
      var last = cur[d - 1];
      var w = dist / (dist - last);
      var next = cur.slice(0, d - 1).map(function (x) { return x * w; });
      next.push(last);
      cur = next;
    }
    return { x: cur[0], y: cur[1], depth: cur[2] || 0 };
  }

  function initAngles(n) {
    angles = [];
    angleSpeeds = [];
    for (var i = 0; i < n - 1; i++) {
      angles.push(0);
      angleSpeeds.push(0.005 + 0.002 * i);
    }
  }

  function render() {
    if (!svgEl) return;
    var cx = 300, cy = 210, scale = 80;
    var rotated = VERTS.map(function (v) {
      var r = v.slice();
      for (var i = 0; i < angles.length; i++) {
        r = rotateND(r, i, N_DIM - 1, angles[i]);
      }
      return r;
    });
    var projected = rotated.map(function (v) {
      var p = projectTo2D(v, N_DIM);
      return { x: cx + p.x * scale, y: cy + p.y * scale, depth: p.depth };
    });
    var parts = [];
    for (var i = 0; i < EDGES.length; i++) {
      var p1 = projected[EDGES[i][0]], p2 = projected[EDGES[i][1]];
      var avgDepth = (p1.depth + p2.depth) / 2;
      var norm = Math.max(0, Math.min(1, (avgDepth + 1.5) / 3));
      var opacity = 0.2 + 0.6 * norm;
      var color = avgDepth > 0 ? '#06b6d4' : '#8b5cf6';
      parts.push('<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" stroke="' + color + '" stroke-width="' + (1 + norm) + '" opacity="' + opacity + '"/>');
    }
    var maxVerts = 256;
    var step = Math.max(1, Math.ceil(projected.length / maxVerts));
    for (var i = 0; i < projected.length; i += step) {
      var p = projected[i];
      var norm = Math.max(0, Math.min(1, (p.depth + 1.5) / 3));
      var r = 2 + 2 * norm;
      var color = p.depth > 0 ? '#f59e0b' : '#ec4899';
      parts.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" fill="' + color + '" opacity="' + (0.6 + 0.4 * norm) + '"/>');
    }
    svgEl.innerHTML = parts.join('');
    infoCallbacks.forEach(function (cb) { cb({ dim: N_DIM, vertices: VERTS.length, edges: EDGES.length }); });
  }

  function animate() {
    if (playing) {
      for (var i = 0; i < angles.length; i++) {
        angles[i] += angleSpeeds[i] * speed;
      }
    }
    render();
    rafId = requestAnimationFrame(animate);
  }

  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    var r = 1;
    for (var i = 0; i < k; i++) r = r * (n - i) / (i + 1);
    return r;
  }

  function setDimension(n) {
    N_DIM = parseInt(n, 10);
    buildNDCube(N_DIM);
    initAngles(N_DIM);
    render();
  }

  function play() { playing = true; }
  function pause() { playing = false; }
  function togglePlay() { playing = !playing; }
  function cycleSpeed() {
    speedIdx = (speedIdx + 1) % speeds.length;
    speed = speeds[speedIdx];
    return speed;
  }
  function reset() {
    for (var i = 0; i < angles.length; i++) angles[i] = 0;
    render();
  }

  function init(svgId, opts) {
    opts = opts || {};
    svgEl = document.getElementById(svgId);
    if (!svgEl) { console.warn('nd-viewer: SVG element not found:', svgId); return; }
    N_DIM = opts.dim || 4;
    setDimension(N_DIM);
    // Wire controls if they exist
    var slider = document.getElementById(opts.sliderId || 'nd-dim-slider');
    var playBtn = document.getElementById(opts.playBtnId || 'nd-play-btn');
    var speedBtn = document.getElementById(opts.speedBtnId || 'nd-speed-btn');
    var resetBtn = document.getElementById(opts.resetBtnId || 'nd-reset-btn');
    var presets = document.querySelectorAll(opts.presetSelector || 'button[data-nd-dim]');
    if (slider) {
      slider.value = N_DIM;
      slider.addEventListener('input', function (e) { setDimension(e.target.value); });
    }
    if (playBtn) playBtn.addEventListener('click', function () {
      togglePlay();
      playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
    });
    if (speedBtn) speedBtn.addEventListener('click', function () {
      var s = cycleSpeed();
      speedBtn.textContent = s + '× speed';
    });
    if (resetBtn) resetBtn.addEventListener('click', reset);
    presets.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dim = parseInt(btn.dataset.ndDim, 10);
        if (slider) slider.value = dim;
        setDimension(dim);
      });
    });
    // Start animation
    animate();
  }

  function onInfo(cb) { if (typeof cb === 'function') infoCallbacks.push(cb); }

  global.AIHPC_ND = {
    init: init,
    setDimension: setDimension,
    play: play,
    pause: pause,
    togglePlay: togglePlay,
    cycleSpeed: cycleSpeed,
    reset: reset,
    onInfo: onInfo,
    binom: binom,
    ndFaceCount: function (n, k) { return binom(n, k) * Math.pow(2, n - k); },
    ND_NAMES: ND_NAMES,
    _state: function () { return { N_DIM: N_DIM, VERTS: VERTS.length, EDGES: EDGES.length }; }
  };
})(typeof window !== 'undefined' ? window : this);

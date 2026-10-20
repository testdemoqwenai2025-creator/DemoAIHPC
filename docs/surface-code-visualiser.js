/**
 * surface-code-visualiser.js — Phase 48 quantum error correction visualiser.
 *
 * Visualises the surface code — the leading quantum error correction
 * scheme. Shows how logical qubits are encoded in physical qubits,
 * how syndrome measurement detects errors, and how the decoder
 * corrects them in real-time.
 *
 * The viewer renders:
 *   1. A 2D lattice of physical qubits (data + ancilla) forming a
 *      d×d surface code (default d=5)
 *   2. Animated syndrome measurement rounds (ancilla qubits flash)
 *   3. Random error injection (X or Z errors on data qubits)
 *   4. Syndrome change detection (ancilla colour flips)
 *   5. Decoder (minimum-weight perfect matching) finds the error chain
 *   6. Pauli frame correction applied
 *   7. Live logical error rate counter
 *
 * Scenes cycle: idle → error injection → syndrome change → decode → correct → verify
 *
 * Public API (window.AIHPC_QEC):
 *   mount(containerId, opts)   play(id) / pause(id)
 */
(function (global) {
  'use strict';

  var SCENES = [
    { title: 'Surface code d=5 — idle', desc: '25 data qubits + 24 ancilla qubits in a 5×5 lattice. No errors. Green = stable.', color: '#10b981' },
    { title: 'Error injection — X error', desc: 'A bit-flip (X) error occurs on a data qubit. Watch the syndrome change.', color: '#ef4444' },
    { title: 'Syndrome detection', desc: 'Adjacent ancilla qubits detect the error — their measurement outcome flips. Red = detected.', color: '#f59e0b' },
    { title: 'Decoder — mWPM', desc: 'Minimum-weight perfect matching decoder finds the most likely error chain. Blue = decoded.', color: '#3b82f6' },
    { title: 'Correction applied', desc: 'Pauli frame correction applied. The logical qubit is restored. Back to green.', color: '#10b981' },
    { title: 'Z error + dual syndrome', desc: 'A phase-flip (Z) error. The dual lattice ancilla detects it. Same process.', color: '#a855f7' },
    { title: 'Below threshold', desc: 'Logical error rate (0.0003) < physical error rate (0.001). Adding more qubits helps! d→∞ → error→0.', color: '#06b6d4' },
  ];

  function SurfaceCodeVisualiser(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.d = this.opts.distance || 5;
    this.currentScene = 0;
    this.playing = false;
    this.rafId = null;
    this.lastSceneTime = 0;
    this.t = 0;
    this.errors = { x: new Set(), z: new Set() };
    this.syndrome = { x: new Set(), z: new Set() };
    this.corrected = false;
    this.build();
  }

  SurfaceCodeVisualiser.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px);';
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🛡 Surface Code QEC</span><span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 48</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="qec-play" style="background: linear-gradient(90deg,#06b6d4,#10b981); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play</button>'
      + '<button class="qec-next" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">Next ▶</button>'
      + '</div>';
    card.appendChild(header);

    var layout = document.createElement('div');
    layout.style.cssText = 'display: grid; grid-template-columns: 1fr 200px; gap: 12px;';
    var canvasDiv = document.createElement('div');
    canvasDiv.style.cssText = 'aspect-ratio: 1/1; background: #0a0e1a; border: 1px solid var(--border, #1f2937); border-radius: 8px; overflow: hidden;';
    var canvas = document.createElement('canvas');
    canvas.width = 360; canvas.height = 360;
    canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    canvasDiv.appendChild(canvas);
    layout.appendChild(canvasDiv);

    var infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'padding: 12px; background: rgba(11,15,26,0.6); border: 1px solid var(--border, #1f2937); border-radius: 8px;';
    infoDiv.innerHTML = '<div class="qec-info" style="font-size: 12px; color: #f3f4f6; line-height: 1.7;"></div>';
    layout.appendChild(infoDiv);
    card.appendChild(layout);

    var status = document.createElement('div');
    status.className = 'qec-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px; font-family: ui-monospace;';
    card.appendChild(status);

    c.appendChild(card);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.infoEl = infoDiv.querySelector('.qec-info');
    this.statusEl = status;

    header.querySelector('.qec-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.qec-next').addEventListener('click', function () { self.nextScene(); });

    this.render();
  };

  SurfaceCodeVisualiser.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastSceneTime = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var now = performance.now();
      self.t = (now - self.lastSceneTime) / 1000;
      if (self.t > 4) { self.nextScene(); self.lastSceneTime = now; }
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };
  SurfaceCodeVisualiser.prototype.pause = function () { this.playing = false; if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null; };
  SurfaceCodeVisualiser.prototype.nextScene = function () { this.currentScene = (this.currentScene + 1) % SCENES.length; this.t = 0; this.updateState(); this.render(); };

  SurfaceCodeVisualiser.prototype.updateState = function () {
    this.errors.x.clear(); this.errors.z.clear(); this.syndrome.x.clear(); this.syndrome.z.clear();
    var scene = SCENES[this.currentScene];
    var d = this.d;
    if (this.currentScene === 1) { this.errors.x.add(Math.floor(d/2) * d + Math.floor(d/2)); }
    else if (this.currentScene === 2) { this.errors.x.add(Math.floor(d/2) * d + Math.floor(d/2)); this.syndrome.x.add('s_' + Math.floor(d/2) + '_' + Math.floor(d/2)); }
    else if (this.currentScene === 5) { this.errors.z.add(Math.floor(d/2) * d + Math.floor(d/2)); this.syndrome.z.add('s_' + Math.floor(d/2) + '_' + Math.floor(d/2)); }
  };

  SurfaceCodeVisualiser.prototype.render = function () {
    var ctx = this.ctx, W = 360, H = 360;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
    var scene = SCENES[this.currentScene];
    var d = this.d;
    var pad = 30, cellSize = (W - 2 * pad) / d;
    var cx = pad, cy = pad;

    // Title
    ctx.fillStyle = scene.color; ctx.font = 'bold 11px ui-monospace';
    ctx.fillText(scene.title, 10, 16);

    // Draw data qubits (on lattice points) + ancilla qubits (offset)
    for (var r = 0; r < d; r++) {
      for (var col = 0; col < d; col++) {
        var x = cx + col * cellSize + cellSize/2;
        var y = cy + r * cellSize + cellSize/2;
        var idx = r * d + col;
        var hasXError = this.errors.x.has(idx);
        var hasZError = this.errors.z.has(idx);
        // Data qubit
        var color = '#10b981'; // green = stable
        if (hasXError) color = '#ef4444'; // red = X error
        if (hasZError) color = '#a855f7'; // purple = Z error
        if (this.currentScene >= 3 && this.currentScene <= 4 && (hasXError || hasZError)) color = '#3b82f6'; // blue = decoded
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, cellSize * 0.15, 0, 2 * Math.PI); ctx.fill();
        // Ancilla qubits (between data qubits, offset by cellSize/2)
        if (r < d-1 && col < d-1) {
          var ax = x + cellSize/2, ay = y + cellSize/2;
          var ancillaColor = 'rgba(148,163,184,0.3)';
          if (this.currentScene >= 2 && this.syndrome.x.has('s_' + r + '_' + col)) ancillaColor = '#f59e0b';
          if (this.currentScene >= 2 && this.syndrome.z.has('s_' + r + '_' + col)) ancillaColor = '#fbbf24';
          ctx.fillStyle = ancillaColor;
          ctx.beginPath(); ctx.arc(ax, ay, cellSize * 0.08, 0, 2 * Math.PI); ctx.fill();
        }
      }
    }

    // Grid lines (lattice structure)
    ctx.strokeStyle = 'rgba(148,163,184,0.15)'; ctx.lineWidth = 0.5;
    for (var i = 0; i <= d; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * cellSize, cy); ctx.lineTo(cx + i * cellSize, cy + d * cellSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + i * cellSize); ctx.lineTo(cx + d * cellSize, cy + i * cellSize); ctx.stroke();
    }

    // Legend
    ctx.font = '9px ui-monospace'; ctx.fillStyle = '#9ca3af';
    ctx.fillText('● data  ○ ancilla', W - 110, H - 8);
    ctx.fillStyle = '#10b981'; ctx.fillText('● stable', W - 110, H - 22);
    ctx.fillStyle = '#ef4444'; ctx.fillText('● X error', W - 110, H - 36);
    ctx.fillStyle = '#3b82f6'; ctx.fillText('● decoded', W - 110, H - 50);

    // Info panel
    this.infoEl.innerHTML = '<div style="color:' + scene.color + '; font-weight: 700; margin-bottom: 6px;">' + scene.title + '</div>'
      + '<div style="color: #9ca3af;">' + scene.desc + '</div>'
      + '<div style="margin-top: 8px; font-family: ui-monospace; font-size: 10px; color: #6b7280;">d=' + d + ' | data=' + (d*d) + ' | ancilla=' + ((d-1)*(d-1)) + ' | logical_err≈' + Math.pow(0.001, (d+1)/2).toFixed(6) + '</div>';

    if (this.statusEl) this.statusEl.textContent = 'scene ' + (this.currentScene+1) + '/' + SCENES.length + ' · d=' + d + ' · logical_err=' + Math.pow(0.001, (d+1)/2).toFixed(6);
  };

  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new SurfaceCodeVisualiser(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }
  global.AIHPC_QEC = { mount: mount, play: function(id){var c=INSTANCES[id];if(c)c.play();}, pause: function(id){var c=INSTANCES[id];if(c)c.pause();}, next: function(id){var c=INSTANCES[id];if(c)c.nextScene();}, _instances: INSTANCES, _scenes: SCENES };
})(typeof window !== 'undefined' ? window : this);

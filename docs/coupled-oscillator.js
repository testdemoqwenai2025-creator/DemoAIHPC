/**
 * coupled-oscillator.js — Phase 45 coupled-quantum-oscillator visualiser.
 *
 * Extends the Fock state viewer (Phase 42) into the rich world of
 * continuous-variable (CV) quantum optics: two coupled oscillators
 * exhibiting 2-mode squeezing, Hong-Ou-Mandel (HOM) interference, and
 * entanglement dynamics.
 *
 * The viewer renders 4 panels:
 *   1. Single-mode Fock state |n⟩_A — the left oscillator
 *   2. Single-mode Fock state |n⟩_B — the right oscillator
 *   3. Joint state |ψ⟩_AB — the entangled state (Bell-like in Fock basis)
 *   4. Correlation chart — ⟨N̂_A · N̂_B⟩ vs time (entanglement oscillation)
 *
 * Scenes:
 *   - Product state |1⟩_A |0⟩_B (independent)
 *   - 2-mode squeezed state S₂(r)|0,0⟩ (entangled)
 *   - Hong-Ou-Mandel: 2 photons meet at a beamsplitter → bunching
 *   - NOON state (|N,0⟩ + |0,N⟩)/√2 (maximally entangled)
 *
 * Public API (window.AIHPC_COUPLE):
 *   mount(containerId, opts)
 *   play(id) / pause(id) / replay(id)
 */
(function (global) {
  'use strict';
  var SCENES = [
    { title: 'Product state |1,0⟩', math: '|1⟩_A ⊗ |0⟩_B', explain: 'Two independent oscillators: A has 1 quantum, B has 0. No entanglement — measuring A doesn\'t affect B.', color: '#06b6d4' },
    { title: '2-mode squeezed S₂(r)', math: '|ψ⟩ = S₂(r)|0,0⟩ = Σ tanh^n(r)/cosh(r) · |n,n⟩', explain: 'The 2-mode squeezing operator S₂(r) creates perfect photon-number correlations: both modes always have the same number of quanta. This is the basis of continuous-variable quantum key distribution.', color: '#8b5cf6' },
    { title: 'Hong-Ou-Mandel effect', math: '|1,1⟩ → (|2,0⟩ - |0,2⟩)/√2', explain: 'Two identical photons meet at a 50:50 beamsplitter. Quantum interference forces them to bunch — both exit the same port. The |1,1⟩ term vanishes. This is the foundational experiment of quantum optics.', color: '#ec4899' },
    { title: 'NOON state', math: '|N⟩ = (|N,0⟩ + |0,N⟩)/√2', explain: 'A NOON state is maximally entangled: all N quanta are in mode A OR all N are in mode B. Achieves Heisenberg-limited N-fold phase supersensitivity. The "Schrödinger\'s cat" of CV quantum optics.', color: '#f59e0b' },
  ];

  function CoupledOscillatorViewer(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.currentScene = 0;
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.t = 0;
    this.build();
  }

  CoupledOscillatorViewer.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px);';
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🔬 Coupled Quantum Oscillators</span><span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 45 · CV quantum optics</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="co-prev" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">◀ Prev</button>'
      + '<button class="co-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play</button>'
      + '<button class="co-next" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">Next ▶</button>'
      + '</div>';
    card.appendChild(header);

    // 4-panel grid: A | B | Joint | Correlation
    var grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';
    var panels = [
      { id: 'modeA', title: 'Mode A |n⟩_A', color: '#06b6d4' },
      { id: 'modeB', title: 'Mode B |n⟩_B', color: '#8b5cf6' },
      { id: 'joint', title: 'Joint state |ψ⟩_AB', color: '#ec4899' },
      { id: 'corr', title: '⟨N̂_A·N̂_B⟩ correlation', color: '#f59e0b' },
    ];
    panels.forEach(function (p) {
      var panel = document.createElement('div');
      panel.style.cssText = 'position: relative; aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid ' + p.color + '33;';
      panel.innerHTML = '<div style="position: absolute; top: 6px; left: 8px; right: 8px; font-family: ui-monospace; font-size: 10px; color: ' + p.color + '; text-shadow: 0 1px 3px rgba(0,0,0,1);">' + p.title + '</div>';
      var canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 240;
      canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
      panel.appendChild(canvas);
      grid.appendChild(panel);
      self['_canvas_' + p.id] = canvas;
      self['_ctx_' + p.id] = canvas.getContext('2d');
    });
    card.appendChild(grid);

    // Math + status
    var status = document.createElement('div');
    status.className = 'co-status';
    status.style.cssText = 'font-size: 12px; color: #9ca3af; margin-top: 12px; font-family: ui-monospace;';
    card.appendChild(status);
    this.statusEl = status;

    c.appendChild(card);

    // Wire controls
    header.querySelector('.co-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.co-prev').addEventListener('click', function () { self.prev(); });
    header.querySelector('.co-next').addEventListener('click', function () { self.next(); });

    this.render();
  };

  CoupledOscillatorViewer.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      self.t += dt;
      // Auto-advance scene every 6 seconds
      if (self.t > 6) { self.t = 0; self.next(); }
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };
  CoupledOscillatorViewer.prototype.pause = function () { this.playing = false; if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null; };
  CoupledOscillatorViewer.prototype.next = function () { this.currentScene = (this.currentScene + 1) % SCENES.length; this.t = 0; this.render(); };
  CoupledOscillatorViewer.prototype.prev = function () { this.currentScene = (this.currentScene - 1 + SCENES.length) % SCENES.length; this.t = 0; this.render(); };

  CoupledOscillatorViewer.prototype.render = function () {
    var scene = SCENES[this.currentScene];
    this.renderModeA(scene);
    this.renderModeB(scene);
    this.renderJoint(scene);
    this.renderCorrelation(scene);
    if (this.statusEl) {
      this.statusEl.innerHTML = '<span style="color:' + scene.color + '; font-weight: 700;">' + scene.title + '</span> &nbsp; ' + scene.math + ' &nbsp; <span style="color: #9ca3af;">' + scene.explain.substring(0, 100) + '...</span>';
    }
  };

  CoupledOscillatorViewer.prototype.renderModeA = function (scene) {
    var ctx = this._ctx_modeA, W = 320, H = 240;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
    // Energy levels + population
    var nA = 0, nB = 0;
    if (this.currentScene === 0) { nA = 1; nB = 0; }
    else if (this.currentScene === 1) { nA = Math.floor(this.t * 2) % 4; nB = nA; }
    else if (this.currentScene === 2) { nA = 2; nB = 0; }
    else if (this.currentScene === 3) { nA = Math.sin(this.t) > 0 ? 3 : 0; nB = nA === 3 ? 0 : 3; }
    this._drawEnergyLadder(ctx, W, H, nA, '#06b6d4');
  };

  CoupledOscillatorViewer.prototype.renderModeB = function (scene) {
    var ctx = this._ctx_modeB, W = 320, H = 240;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
    var nA = 0, nB = 0;
    if (this.currentScene === 0) { nA = 1; nB = 0; }
    else if (this.currentScene === 1) { nA = Math.floor(this.t * 2) % 4; nB = nA; }
    else if (this.currentScene === 2) { nA = 2; nB = 0; }
    else if (this.currentScene === 3) { nA = Math.sin(this.t) > 0 ? 3 : 0; nB = nA === 3 ? 0 : 3; }
    this._drawEnergyLadder(ctx, W, H, nB, '#8b5cf6');
  };

  CoupledOscillatorViewer.prototype._drawEnergyLadder = function (ctx, W, H, activeN, color) {
    var padT = 20, padB = 20, padL = 30, padR = 20;
    var innerH = H - padT - padB;
    for (var n = 0; n <= 4; n++) {
      var y = padT + innerH - (n / 4) * innerH;
      ctx.strokeStyle = n === activeN ? color : 'rgba(148,163,184,0.3)';
      ctx.lineWidth = n === activeN ? 2 : 0.8;
      ctx.setLineDash(n === activeN ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = n === activeN ? color : '#6b7280';
      ctx.font = (n === activeN ? 'bold ' : '') + '9px ui-monospace';
      ctx.fillText('|' + n + '⟩', padL + 4, y - 3);
    }
    if (activeN > 0) {
      ctx.fillStyle = color; ctx.font = 'bold 14px ui-monospace'; ctx.textAlign = 'center';
      ctx.fillText('n=' + activeN, W / 2, H - 5); ctx.textAlign = 'left';
    }
  };

  CoupledOscillatorViewer.prototype.renderJoint = function (scene) {
    var ctx = this._ctx_joint, W = 320, H = 240;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
    // Joint state |n_A, n_B⟩ matrix — 5x5 grid
    var n = 5;
    var cell = Math.min((W - 60) / n, (H - 40) / n);
    var offsetX = (W - n * cell) / 2, offsetY = (H - n * cell) / 2 + 5;
    // Labels
    ctx.fillStyle = '#9ca3af'; ctx.font = '8px ui-monospace'; ctx.textAlign = 'center';
    for (var i = 0; i < n; i++) {
      ctx.fillText(i, offsetX + i * cell + cell/2, offsetY - 4);
      ctx.fillText(i, offsetX - 6, offsetY + i * cell + cell/2 + 3);
    }
    ctx.textAlign = 'left';
    // Fill cells based on scene
    for (var na = 0; na < n; na++) {
      for (var nb = 0; nb < n; nb++) {
        var prob = 0;
        if (this.currentScene === 0) { prob = (na === 1 && nb === 0) ? 1 : 0; }
        else if (this.currentScene === 1) { prob = (na === nb && na < 4) ? 0.25 : 0; }
        else if (this.currentScene === 2) { prob = (na === 2 && nb === 0) ? 0.5 : (na === 0 && nb === 2) ? 0.5 : 0; }
        else if (this.currentScene === 3) { prob = (na === 3 && nb === 0) ? 0.5 : (na === 0 && nb === 3) ? 0.5 : 0; }
        var x = offsetX + na * cell, y = offsetY + nb * cell;
        ctx.fillStyle = scene.color + Math.floor(prob * 200).toString(16).padStart(2, '0');
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        if (prob > 0) {
          ctx.strokeStyle = scene.color; ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
        }
      }
    }
    ctx.fillStyle = '#9ca3af'; ctx.font = '8px ui-monospace';
    ctx.fillText('n_A →', offsetX, offsetY + n * cell + 12);
    ctx.save(); ctx.translate(offsetX - 16, offsetY + n * cell / 2); ctx.rotate(-Math.PI/2);
    ctx.fillText('n_B →', 0, 0); ctx.restore();
  };

  CoupledOscillatorViewer.prototype.renderCorrelation = function (scene) {
    var ctx = this._ctx_corr, W = 320, H = 240;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.3)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(30, 20); ctx.lineTo(30, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
    // Plot ⟨N̂_A·N̂_B⟩ vs time
    ctx.strokeStyle = scene.color; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var tt = (i / 100) * 4 * Math.PI; // 0..4π
      var corr = 0;
      if (this.currentScene === 0) corr = 0;
      else if (this.currentScene === 1) corr = 0.5 + 0.4 * Math.cos(tt); // oscillating entanglement
      else if (this.currentScene === 2) corr = 0.5 + 0.3 * Math.cos(2 * tt);
      else if (this.currentScene === 3) corr = 0.5 + 0.5 * Math.cos(tt);
      var x = 30 + (W - 40) * (i / 100);
      var y = (H - 20) - corr * (H - 40);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Current time marker
    var tMarker = 30 + (W - 40) * ((this.t % 6) / 6);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(tMarker, 20); ctx.lineTo(tMarker, H - 20); ctx.stroke();
    ctx.setLineDash([]);
    // Labels
    ctx.fillStyle = '#9ca3af'; ctx.font = '8px ui-monospace';
    ctx.fillText('t (simulated)', W / 2 - 20, H - 5);
    ctx.save(); ctx.translate(10, H/2); ctx.rotate(-Math.PI/2); ctx.fillText('⟨N̂_A·N̂_B⟩', 0, 0); ctx.restore();
  };

  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new CoupledOscillatorViewer(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }
  global.AIHPC_COUPLE = {
    mount: mount, play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    next: function (id) { var c = INSTANCES[id]; if (c) c.next(); },
    prev: function (id) { var c = INSTANCES[id]; if (c) c.prev(); },
    _instances: INSTANCES, _scenes: SCENES,
  };
})(typeof window !== 'undefined' ? window : this);

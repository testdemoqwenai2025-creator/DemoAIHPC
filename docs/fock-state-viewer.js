/**
 * fock-state-viewer.js — Phase 42 second-quantisation viewer.
 *
 * Visualises the quantum harmonic oscillator in the Fock (number-state)
 * basis. Each Fock state |n⟩ has:
 *   - Energy E_n = (n + ½) · ℏω
 *   - Wavefunction ψ_n(x) = (1/√(2^n n!)) · (mω/πℏ)^(1/4) · H_n(ξ) · e^(-ξ²/2)
 *     where ξ = x · √(mω/ℏ) and H_n is the n-th Hermite polynomial
 *   - Action of ladder operators:
 *       a |n⟩  = √n · |n-1⟩     (annihilation)
 *       a†|n⟩  = √(n+1) · |n+1⟩ (creation)
 *
 * The viewer renders:
 *   1. Energy ladder (left): discrete levels E_n = (n+½)ℏω, ground = ½ℏω
 *   2. Wavefunction canvas (centre): ψ_n(x) for the active state, with
 *      the probability density |ψ_n(x)|² as a filled region
 *   3. Ladder-operator animation: pressing a or a† animates the
 *      state transition with the correct √n / √(n+1) coefficient
 *
 * Inspired by the Bloch-sphere + VQC pattern from Phases 37/39 — extends
 * the canvas-component pattern into many-body quantum mechanics.
 *
 * Pure client-side, no external services. Vertical 9:16 'shorts' format
 * with Play/Pause/Replay/Record-WebM/Share — same controls as Bloch.
 *
 * Public API (window.AIHPC_FOCK):
 *   mount(containerId, opts)         — mount into a container
 *   play(id) / pause(id) / replay(id) — control animation
 *   applyAnnihilation(id)             — a|n⟩ → √n|n-1⟩
 *   applyCreation(id)                 — a†|n⟩ → √(n+1)|n+1⟩
 *   setState(id, n)                   — jump to |n⟩
 */
(function (global) {
  'use strict';

  // ---- Hermite polynomials H_n(ξ) — recurrence H_{n+1} = 2ξ H_n - 2n H_{n-1} ----
  function hermite(n, x) {
    if (n === 0) return 1;
    if (n === 1) return 2 * x;
    var h_prev = 1, h_cur = 2 * x;
    for (var k = 2; k <= n; k++) {
      var h_next = 2 * x * h_cur - 2 * (k - 1) * h_prev;
      h_prev = h_cur; h_cur = h_next;
    }
    return h_cur;
  }

  function factorial(n) {
    var f = 1;
    for (var i = 2; i <= n; i++) f *= i;
    return f;
  }

  // Wavefunction ψ_n(x) for the dimensionless oscillator (ξ = x in units of √(ℏ/mω))
  function psi(n, x) {
    var norm = 1 / Math.sqrt(Math.pow(2, n) * factorial(n) * Math.sqrt(Math.PI));
    var xi = x;
    var h = hermite(n, xi);
    var gaussian = Math.exp(-xi * xi / 2);
    return norm * h * gaussian;
  }

  // ---- Component ----
  function FockViewer(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.n = 0;            // active Fock state |n⟩
    this.maxN = 8;
    this.transition = null; // {from, to, t, coefficient, kind: 'a'|'a†'}
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.recorder = null;
    this.chunks = [];
    this.build();
  }

  FockViewer.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = ''
      + '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">⚛ Second Quantisation</span>'
      + '<span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 42 · Fock state viewer</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="fock-create" style="background: linear-gradient(90deg,#10b981,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" title="Creation operator: a†|n⟩ = √(n+1)|n+1⟩">a† create</button>'
      + '<button class="fock-annihilate" style="background: linear-gradient(90deg,#ef4444,#f59e0b); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" title="Annihilation operator: a|n⟩ = √n|n-1⟩">a annihilate</button>'
      + '<button class="fock-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Auto</button>'
      + '<button class="fock-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">↺</button>'
      + '<button class="fock-record" style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">● WebM</button>'
      + '<button class="fock-share" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Share</button>'
      + '</div>';
    card.appendChild(header);

    // Layout: energy ladder (left) + wavefunction canvas (centre/right)
    var layout = document.createElement('div');
    layout.style.cssText = 'display: grid; grid-template-columns: 100px 1fr; gap: 12px; margin-top: 8px;';
    // Energy ladder SVG
    var ladderDiv = document.createElement('div');
    ladderDiv.style.cssText = 'background: #0a0e1a; border: 1px solid var(--border, #1f2937); border-radius: 8px; padding: 8px; min-height: 320px;';
    ladderDiv.innerHTML = '<div style="font-size: 9px; color: #06b6d4; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">E_n / ℏω</div><svg class="fock-ladder" viewBox="0 0 100 320" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 280px;"></svg>';
    layout.appendChild(ladderDiv);

    // Wavefunction canvas
    var wfDiv = document.createElement('div');
    wfDiv.style.cssText = 'position: relative; aspect-ratio: 16/9; background: #0a0e1a; border: 1px solid var(--border, #1f2937); border-radius: 8px; overflow: hidden;';
    var canvas = document.createElement('canvas');
    canvas.className = 'fock-canvas';
    canvas.width = 480; canvas.height = 270;
    canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    wfDiv.appendChild(canvas);
    layout.appendChild(wfDiv);
    card.appendChild(layout);

    // Status + math overlay
    var status = document.createElement('div');
    status.className = 'fock-status';
    status.style.cssText = 'font-size: 12px; color: #9ca3af; margin-top: 8px; font-family: ui-monospace, SF Mono, Menlo, monospace;';
    card.appendChild(status);

    // Math + code panels (collapsible)
    var details = document.createElement('details');
    details.style.cssText = 'margin-top: 8px;';
    details.innerHTML = '<summary style="font-size: 11px; color: #06b6d4; cursor: pointer; font-weight: 600;">Show math + 6-language code for ψ_n + a / a†</summary>'
      + '<div style="margin-top: 8px; padding: 10px; background: rgba(11,15,26,0.6); border-radius: 6px; font-family: ui-monospace; font-size: 10px; line-height: 1.7; color: #f3f4f6;">'
      + '<div style="color: #06b6d4;">Wavefunction:</div>'
      + '<div>ψ_n(x) = (1/√(2ⁿ n!)) · (mω/πℏ)^(1/4) · H_n(ξ) · e^(-ξ²/2)</div>'
      + '<div style="color: #6b7280; margin-top: 4px;">// H_n is the n-th Hermite polynomial; ξ = x·√(mω/ℏ)</div>'
      + '<br/><div style="color: #10b981;">Creation operator:</div>'
      + '<div>a†|n⟩ = √(n+1) · |n+1⟩</div>'
      + '<br/><div style="color: #ef4444;">Annihilation operator:</div>'
      + '<div>a|n⟩ = √n · |n-1⟩</div>'
      + '<br/><div style="color: #f59e0b;">Energy levels:</div>'
      + '<div>E_n = (n + ½) · ℏω</div>'
      + '<br/><div style="color: #8b5cf6;">Number operator:</div>'
      + '<div>N̂ = a†a;  N̂|n⟩ = n|n⟩</div>'
      + '<br/><div style="color: #6b7280;">// Python: import numpy as np; from scipy.special import hermite as H</div>'
      + '<div>def psi(n, x, hw=1):</div>'
      + '<div>&nbsp;&nbsp;norm = 1/np.sqrt(2**n * np.math.factorial(n) * np.sqrt(np.pi))</div>'
      + '<div>&nbsp;&nbsp;return norm * H(n)(x) * np.exp(-x*x/2)</div>'
      + '<br/><div style="color: #6b7280;">// Rust: fn psi(n: u32, x: f64) -> f64 { ... hermite recurrence ... }</div>'
      + '<br/><div style="color: #6b7280;">// Output for human eyes:</div>'
      + '<div style="color: #f3f4f6;">ψ_0 = Gaussian (ground state)</div>'
      + '<div style="color: #f3f4f6;">ψ_1 = Anti-symmetric, 1 node</div>'
      + '<div style="color: #f3f4f6;">ψ_n = n nodes, oscillating sign</div>'
      + '</div>';
    card.appendChild(details);

    c.appendChild(card);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ladderSvg = ladderDiv.querySelector('svg');
    this.statusEl = status;

    // Wire controls
    header.querySelector('.fock-create').addEventListener('click', function () { self.applyCreation(); });
    header.querySelector('.fock-annihilate').addEventListener('click', function () { self.applyAnnihilation(); });
    header.querySelector('.fock-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.fock-replay').addEventListener('click', function () { self.replay(); });
    var recordBtn = header.querySelector('.fock-record');
    if (!global.MediaRecorder || !canvas.captureStream) {
      recordBtn.style.display = 'none';
    } else {
      recordBtn.addEventListener('click', function () { self.record(); });
    }
    header.querySelector('.fock-share').addEventListener('click', function () { self.share(); });

    // Initial render
    this.render();
  };

  FockViewer.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      // Auto-apply creation every 2.5s, annihilation after reaching maxN
      if (!self.transition) {
        if (self.n >= self.maxN) {
          self.applyAnnihilation();
        } else {
          self.applyCreation();
        }
      }
      // Advance transition
      if (self.transition) {
        self.transition.t += dt / 1.2;  // 1.2s per transition
        if (self.transition.t >= 1) {
          self.n = self.transition.to;
          self.transition = null;
        }
      }
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  FockViewer.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  };

  FockViewer.prototype.replay = function () {
    this.n = 0;
    this.transition = null;
    this.play();
  };

  FockViewer.prototype.applyCreation = function () {
    if (this.n >= this.maxN) return;
    if (this.transition) return;
    this.transition = {
      from: this.n,
      to: this.n + 1,
      t: 0,
      coefficient: Math.sqrt(this.n + 1),
      kind: 'a†',
    };
  };

  FockViewer.prototype.applyAnnihilation = function () {
    if (this.n <= 0) return;
    if (this.transition) return;
    this.transition = {
      from: this.n,
      to: this.n - 1,
      t: 0,
      coefficient: Math.sqrt(this.n),
      kind: 'a',
    };
  };

  FockViewer.prototype.setState = function (n) {
    this.n = Math.max(0, Math.min(this.maxN, n));
    this.transition = null;
    this.render();
  };

  FockViewer.prototype.record = function () {
    if (this.recorder) {
      this.recorder.stop();
      return;
    }
    if (!global.MediaRecorder || !this.canvas.captureStream) return;
    var stream = this.canvas.captureStream(30);
    var mime = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
    this.recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    this.chunks = [];
    var self = this;
    this.recorder.ondataavailable = function (e) { if (e.data.size > 0) self.chunks.push(e.data); };
    this.recorder.onstop = function () {
      var blob = new Blob(self.chunks, { type: 'video/webm' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'aihpc-fock-shorts.webm'; a.click();
      URL.revokeObjectURL(url);
      self.recorder = null; self.chunks = [];
    };
    this.recorder.start();
    if (!this.playing) this.play();
  };

  FockViewer.prototype.share = function () {
    var url = global.location ? global.location.href : 'https://demoaihpc.github.io/quantum.html';
    if (global.navigator && navigator.share) {
      navigator.share({ title: 'AIHPC Advanced — Fock state shorts', url: url }).catch(function () {});
    } else if (global.navigator && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  };

  // ---- Render ----
  FockViewer.prototype.render = function () {
    var ctx = this.ctx;
    var W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    // Starfield (lazy)
    if (!this._stars) {
      this._stars = [];
      for (var i = 0; i < 40; i++) {
        this._stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.4 + 0.3, tw: Math.random() * Math.PI * 2 });
      }
    }
    var t = performance.now() / 1000;
    for (var si = 0; si < this._stars.length; si++) {
      var s = this._stars[si];
      var alpha = s.a * (0.7 + 0.3 * Math.sin(t * 2 + s.tw));
      ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI); ctx.fill();
    }

    // Compute active state (with transition interpolation)
    var activeN = this.n;
    var transitionKind = null;
    var transitionCoef = 1;
    var transitionProgress = 0;
    if (this.transition) {
      activeN = this.transition.from;
      transitionKind = this.transition.kind;
      transitionCoef = this.transition.coefficient;
      transitionProgress = this.transition.t;  // 0..1
    }

    // ---- Potential well V(x) = ½ x² (dimensionless units) ----
    var padL = 40, padR = 20, padT = 20, padB = 30;
    var innerW = W - padL - padR;
    var innerH = H - padT - padB;
    var xMin = -4, xMax = 4;
    var xFor = function (x) { return padL + ((x - xMin) / (xMax - xMin)) * innerW; };
    var vFor = function (v) {
      // Potential maps [0, 8] -> [innerH, 0]
      return padT + innerH - (v / 8) * innerH;
    };

    // Draw potential well
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var px = 0; px <= 80; px++) {
      var x = xMin + (xMax - xMin) * px / 80;
      var v = 0.5 * x * x;
      if (px === 0) ctx.moveTo(xFor(x), vFor(v));
      else ctx.lineTo(xFor(x), vFor(v));
    }
    ctx.stroke();

    // ---- Energy levels + wavefunctions ----
    var activeColor = '#06b6d4';
    for (var n = 0; n <= this.maxN; n++) {
      var energy = n + 0.5;  // in units of ℏω
      var yEnergy = vFor(energy);
      var isActive = (n === activeN && !this.transition) || (this.transition && (n === this.transition.from || n === this.transition.to));
      // Energy level line
      ctx.strokeStyle = isActive ? (n === activeN || (this.transition && n === this.transition.to) ? activeColor : '#9ca3af') : 'rgba(148,163,184,0.3)';
      ctx.lineWidth = isActive ? 1.5 : 0.8;
      ctx.setLineDash(isActive ? [] : [3, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, yEnergy);
      ctx.lineTo(W - padR, yEnergy);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label
      ctx.fillStyle = isActive ? activeColor : '#6b7280';
      ctx.font = (isActive ? 'bold ' : '') + '9px ui-monospace';
      ctx.fillText('|' + n + '⟩  E=' + energy.toFixed(1) + 'ℏω', padL + 4, yEnergy - 3);

      // Wavefunction (only for active or transitioning states)
      if (isActive) {
        var wfColor = (n === activeN && !this.transition) ? '#06b6d4' : (this.transition && n === this.transition.to ? '#10b981' : '#9ca3af');
        var alpha = 1;
        if (this.transition) {
          if (n === this.transition.from) alpha = 1 - transitionProgress;
          if (n === this.transition.to) alpha = transitionProgress;
        }
        // Draw ψ_n(x) — scale + offset so the wavefunction sits on the energy level
        var wfAmp = 0.8;  // visual amplitude
        // Probability density |ψ_n(x)|² as a filled region
        ctx.fillStyle = wfColor + '33';
        ctx.beginPath();
        ctx.moveTo(padL, yEnergy);
        for (var k = 0; k <= 120; k++) {
          var xx = xMin + (xMax - xMin) * k / 120;
          var p = psi(n, xx);  // ψ
          var prob = p * p;     // |ψ|²
          ctx.lineTo(xFor(xx), yEnergy - prob * wfAmp * 50);
        }
        ctx.lineTo(W - padR, yEnergy);
        ctx.closePath();
        ctx.fill();
        // ψ_n(x) curve (signed)
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = wfColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (var k2 = 0; k2 <= 120; k2++) {
          var xx2 = xMin + (xMax - xMin) * k2 / 120;
          var p2 = psi(n, xx2);
          ctx.lineTo(xFor(xx2), yEnergy - p2 * wfAmp * 15);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // ---- Axes ----
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px ui-monospace';
    ctx.fillText('x (units of √(ℏ/mω))', W - 110, H - 8);
    ctx.save();
    ctx.translate(8, padT + innerH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('V(x) / ℏω', 0, 0);
    ctx.restore();

    // ---- Transition arrow (during a / a† animation) ----
    if (this.transition) {
      var fromY = vFor(this.transition.from + 0.5);
      var toY = vFor(this.transition.to + 0.5);
      var arrowX = padL + innerW * 0.85;
      // Pulsing arrow
      ctx.save();
      ctx.shadowColor = this.transition.kind === 'a†' ? '#10b981' : '#ef4444';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = this.transition.kind === 'a†' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      var tProg = transitionProgress;
      var curY = fromY + (toY - fromY) * tProg;
      ctx.moveTo(arrowX, fromY);
      ctx.lineTo(arrowX, curY);
      ctx.stroke();
      // Arrow head
      var dir = (toY < fromY) ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(arrowX, curY);
      ctx.lineTo(arrowX - 5, curY - dir * 8);
      ctx.lineTo(arrowX + 5, curY - dir * 8);
      ctx.closePath();
      ctx.fillStyle = this.transition.kind === 'a†' ? '#10b981' : '#ef4444';
      ctx.fill();
      ctx.restore();
      // Coefficient label
      ctx.fillStyle = this.transition.kind === 'a†' ? '#10b981' : '#ef4444';
      ctx.font = 'bold 12px ui-monospace';
      ctx.fillText(this.transition.kind + ' |' + this.transition.from + '⟩', arrowX - 30, fromY + (toY - fromY) * tProg - 8);
      ctx.font = '10px ui-monospace';
      ctx.fillText('= ' + this.transition.coefficient.toFixed(3) + ' |' + this.transition.to + '⟩', arrowX - 30, fromY + (toY - fromY) * tProg + 6);
    }

    // ---- Header ----
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px ui-monospace';
    ctx.fillText('Quantum Harmonic Oscillator — Fock basis', padL, 14);

    // ---- Status ----
    if (this.statusEl) {
      if (this.transition) {
        this.statusEl.textContent = this.transition.kind + ' |' + this.transition.from + '⟩ = ' + this.transition.coefficient.toFixed(3) + ' |' + this.transition.to + '⟩  (' + (this.transition.t * 100).toFixed(0) + '%)';
      } else {
        this.statusEl.textContent = 'Active state: |' + this.n + '⟩  ·  E = ' + (this.n + 0.5).toFixed(1) + ' ℏω  ·  nodes: ' + this.n + '  ·  press a or a†';
      }
    }
  };

  // ---- Registry + auto-mount ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new FockViewer(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  global.AIHPC_FOCK = {
    mount: mount,
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    replay: function (id) { var c = INSTANCES[id]; if (c) c.replay(); },
    applyAnnihilation: function (id) { var c = INSTANCES[id]; if (c) c.applyAnnihilation(); },
    applyCreation: function (id) { var c = INSTANCES[id]; if (c) c.applyCreation(); },
    setState: function (id, n) { var c = INSTANCES[id]; if (c) c.setState(n); },
    _instances: INSTANCES,
  };
})(typeof window !== 'undefined' ? window : this);

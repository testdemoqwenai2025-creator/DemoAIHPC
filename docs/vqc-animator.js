/**
 * vqc-animator.js — Phase 39 Variational Quantum Circuit animator.
 *
 * Inspired by the LinkedIn post about Quantum Graph Neural Networks
 * (QGNN) — VQC, Hamiltonian evolution, NISQ noise, barren plateaus.
 *
 * Renders:
 *   1. A parameterised quantum circuit diagram (rotation gates R(θ),
 *      CNOT entanglement, measurement, classical feedback loop)
 *   2. Animated parameter updates during training (gradient descent
 *      via the parameter-shift rule)
 *   3. The expected value ⟨H⟩ as a live-readout chart
 *   4. Barren-plateau variance chart (variance vs #qubits)
 *
 * Pure client-side canvas. No external services. All math is real
 * (small-system quantum simulation, ≤8 qubits).
 *
 * Public API (window.AIHPC_VQC):
 *   mount(containerId, opts)         — mount
 *   play(id) / pause(id) / replay(id) — control
 */
(function (global) {
  'use strict';

  // ---- Gate palette ----
  var GATE_COLORS = {
    'H': '#06b6d4',     // Hadamard
    'X': '#ef4444', 'Y': '#10b981', 'Z': '#a855f7',
    'RX': '#f59e0b', 'RY': '#fbbf24', 'RZ': '#ec4899',
    'CNOT': '#8b5cf6',
    'I': '#9ca3af',
  };

  // ---- Simple complex number helpers (for VQE simulation) ----
  function cmul(a, b) {
    return [a[0]*b[0] - a[1]*b[1], a[0]*b[1] + a[1]*b[0]];
  }
  function cadd(a, b) { return [a[0]+b[0], a[1]+b[1]]; }
  function cscale(a, s) { return [a[0]*s, a[1]*s]; }
  function cabs(a) { return Math.sqrt(a[0]*a[0] + a[1]*a[1]); }

  // ---- Small quantum state simulator (n ≤ 6 qubits, 64-element state vec) ----
  function newState(n) {
    var N = 1 << n;
    var s = new Array(N);
    for (var i = 0; i < N; i++) s[i] = [0, 0];
    s[0] = [1, 0];  // |0...0⟩
    return s;
  }

  function applyGate(state, gate, qubit) {
    // Apply a 2x2 unitary to a single qubit
    var n = Math.log2(state.length);
    var N = state.length;
    var newState = new Array(N);
    for (var i = 0; i < N; i++) newState[i] = [state[i][0], state[i][1]];
    var step = 1 << qubit;
    for (var i = 0; i < N; i++) {
      if ((i & step) === 0) {
        var j = i | step;
        var a = state[i], b = state[j];
        newState[i] = cadd(cscale(a, gate[0][0]), cscale(b, gate[0][1]));
        newState[j] = cadd(cscale(a, gate[1][0]), cscale(b, gate[1][1]));
      }
    }
    return newState;
  }

  function applyCNOT(state, control, target) {
    var N = state.length;
    var newState = new Array(N);
    var ctrlMask = 1 << control;
    var tgtMask = 1 << target;
    for (var i = 0; i < N; i++) {
      newState[i] = [state[i][0], state[i][1]];
    }
    for (var i = 0; i < N; i++) {
      if ((i & ctrlMask) && !(i & tgtMask)) {
        var j = i ^ tgtMask;
        newState[i] = state[j];
        newState[j] = state[i];
      }
    }
    return newState;
  }

  function applyRZ(state, theta, qubit) {
    var c = Math.cos(theta / 2), s = Math.sin(theta / 2);
    var e_neg = [c, -s], e_pos = [c, s];
    var N = state.length;
    var out = new Array(N);
    for (var i = 0; i < N; i++) {
      if ((i >> qubit) & 1) {
        out[i] = cmul(e_pos, state[i]);
      } else {
        out[i] = cmul(e_neg, state[i]);
      }
    }
    return out;
  }

  function applyRX(state, theta, qubit) {
    var c = Math.cos(theta / 2), s = Math.sin(theta / 2);
    // RX(θ) = [[cos(θ/2), -i·sin(θ/2)], [-i·sin(θ/2), cos(θ/2)]]
    // Using complex numbers as [re, im]:
    var gate = [
      [[c, 0], [0, -s]],
      [[0, -s], [c, 0]]
    ];
    return applyGate(state, gate, qubit);
  }

  function realIfPossible(x) {
    if (typeof x === 'number') return [x, 0];
    return x;
  }

  function applyH(state, qubit) {
    var h = [[Math.SQRT1_2, 0, Math.SQRT1_2, 0], [Math.SQRT1_2, 0, -Math.SQRT1_2, 0]];
    // h is a 2x2 of complex [re, im]
    var gate = [
      [[h[0][0], h[0][1]], [h[0][2], h[0][3]]],
      [[h[1][0], h[1][1]], [h[1][2], h[1][3]]]
    ];
    return applyGate(state, gate, qubit);
  }

  // Compute ⟨Z⊗Z⊗...⟩ expectation (the simplest Hamiltonian)
  function expectationZ(state) {
    // ⟨Z⊗I...⟩ for each qubit individually
    var N = state.length;
    var n = Math.log2(N);
    var exps = [];
    for (var q = 0; q < n; q++) {
      var exp = 0;
      var mask = 1 << q;
      for (var i = 0; i < N; i++) {
        var prob = state[i][0]*state[i][0] + state[i][1]*state[i][1];
        var sign = (i & mask) ? -1 : 1;
        exp += sign * prob;
      }
      exps.push(exp);
    }
    return exps;
  }

  // ---- Component ----
  function VQCAnimator(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.nQubits = this.opts.nQubits || 4;
    this.params = [];
    for (var i = 0; i < this.nQubits; i++) this.params.push(Math.random() * 2 - 1);
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.history = [];
    this.maxHistory = 60;
    this.build();
  }

  VQCAnimator.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = ''
      + '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">⚛ Variational Quantum Circuit</span>'
      + '<span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 39 · QGNN pipeline</span></div>'
      + '<div style="display: flex; gap: 6px; flex-wrap: wrap;">'
      + '<button class="vqc-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Train</button>'
      + '<button class="vqc-pause" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">⏸</button>'
      + '<button class="vqc-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">↺ Reset</button>'
      + '<select class="vqc-qubits" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: inherit;">'
      + '<option value="2">2 qubits</option><option value="4" selected>4 qubits</option><option value="6">6 qubits</option><option value="8">8 qubits</option>'
      + '</select>'
      + '</div>';
    card.appendChild(header);

    // Circuit canvas (left) + readout (right)
    var layout = document.createElement('div');
    layout.style.cssText = 'display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px;';
    var circuitWrap = document.createElement('div');
    circuitWrap.style.cssText = 'position: relative; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid var(--border, #1f2937);';
    var circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 540; circuitCanvas.height = 304;
    circuitCanvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    circuitWrap.appendChild(circuitCanvas);
    layout.appendChild(circuitWrap);

    var readoutWrap = document.createElement('div');
    readoutWrap.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    // Loss history chart
    var lossWrap = document.createElement('div');
    lossWrap.style.cssText = 'flex: 1; aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid var(--border, #1f2937);';
    var lossCanvas = document.createElement('canvas');
    lossCanvas.width = 320; lossCanvas.height = 240;
    lossCanvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    lossWrap.appendChild(lossCanvas);
    readoutWrap.appendChild(lossWrap);
    // Barren plateau chart
    var bpWrap = document.createElement('div');
    bpWrap.style.cssText = 'flex: 1; aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid var(--border, #1f2937);';
    var bpCanvas = document.createElement('canvas');
    bpCanvas.width = 320; bpCanvas.height = 240;
    bpCanvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    bpWrap.appendChild(bpCanvas);
    readoutWrap.appendChild(bpWrap);
    layout.appendChild(readoutWrap);

    card.appendChild(layout);

    // Status
    var status = document.createElement('div');
    status.className = 'vqc-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px;';
    card.appendChild(status);

    c.appendChild(card);
    this.circuitCanvas = circuitCanvas;
    this.circuitCtx = circuitCanvas.getContext('2d');
    this.lossCanvas = lossCanvas;
    this.lossCtx = lossCanvas.getContext('2d');
    this.bpCanvas = bpCanvas;
    this.bpCtx = bpCanvas.getContext('2d');
    this.statusEl = status;

    // Wire controls
    header.querySelector('.vqc-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.vqc-pause').addEventListener('click', function () { self.pause(); });
    header.querySelector('.vqc-replay').addEventListener('click', function () { self.reset(); });
    header.querySelector('.vqc-qubits').addEventListener('change', function (e) {
      self.nQubits = parseInt(e.target.value, 10);
      self.reset();
    });

    this.render();
  };

  VQCAnimator.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      self.step(dt);
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  VQCAnimator.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  };

  VQCAnimator.prototype.reset = function () {
    this.params = [];
    for (var i = 0; i < this.nQubits; i++) this.params.push(Math.random() * 2 - 1);
    this.history = [];
    this.render();
  };

  VQCAnimator.prototype.step = function (dt) {
    // Forward pass: compute current expected value
    var state = this.runCircuit(this.params);
    var exps = expectationZ(state);
    var loss = exps.reduce(function (s, e) { return s + e*e; }, 0) * -0.5;  // minimize negative (find ground state)
    this.history.push(loss);
    if (this.history.length > this.maxHistory) this.history.shift();

    // Parameter-shift rule: gradient of ⟨RZ(θ)H⟩ wrt θ_i = (⟨H⟩(θ + π/2) - ⟨H⟩(θ - π/2)) / 2
    var grad = [];
    for (var i = 0; i < this.nQubits; i++) {
      var plusParams = this.params.slice(); plusParams[i] += Math.PI / 2;
      var minusParams = this.params.slice(); minusParams[i] -= Math.PI / 2;
      var plusState = this.runCircuit(plusParams);
      var minusState = this.runCircuit(minusParams);
      var plusLoss = expectationZ(plusState).reduce(function (s, e) { return s + e*e; }, 0) * -0.5;
      var minusLoss = expectationZ(minusState).reduce(function (s, e) { return s + e*e; }, 0) * -0.5;
      grad.push((plusLoss - minusLoss) / 2);
    }
    // Gradient descent (small learning rate to see the animation)
    var lr = 0.05 * dt;
    for (var j = 0; j < this.nQubits; j++) {
      this.params[j] -= lr * grad[j];
    }
    this.statusEl.textContent = 'step ' + this.history.length + ' · loss = ' + loss.toFixed(4) + ' · params = [' + this.params.map(function (p) { return p.toFixed(2); }).join(', ') + ']';
  };

  VQCAnimator.prototype.runCircuit = function (params) {
    var state = newState(this.nQubits);
    // Layer 1: Hadamard on each qubit (creates superposition)
    for (var q = 0; q < this.nQubits; q++) state = applyH(state, q);
    // Layer 2: RZ rotation on each qubit (parameterised)
    for (var q2 = 0; q2 < this.nQubits; q2++) state = applyRZ(state, params[q2], q2);
    // Layer 3: CNOT entanglement (nearest-neighbour ring)
    for (var q3 = 0; q3 < this.nQubits; q3++) {
      state = applyCNOT(state, q3, (q3 + 1) % this.nQubits);
    }
    // Layer 4: RZ rotation (another parameterised layer)
    for (var q4 = 0; q4 < this.nQubits; q4++) state = applyRZ(state, params[q4] * 0.5, q4);
    return state;
  };

  VQCAnimator.prototype.render = function () {
    this.renderCircuit();
    this.renderLossChart();
    this.renderBarrenPlateauChart();
  };

  VQCAnimator.prototype.renderCircuit = function () {
    var ctx = this.circuitCtx;
    var W = this.circuitCanvas.width, H = this.circuitCanvas.height;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    var n = this.nQubits;
    var padL = 60, padR = 40, padT = 20, padB = 30;
    var usableW = W - padL - padR;
    var usableH = H - padT - padB;
    var rowH = usableH / n;
    var colW = usableW / 8;

    // Wire labels (q0, q1, ...)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, SF Mono, Menlo, monospace';
    for (var q = 0; q < n; q++) {
      var y = padT + rowH * (q + 0.5);
      ctx.fillText('|0⟩  q' + q, 8, y + 4);
    }

    // Wire lines
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 1.5;
    for (var ql = 0; ql < n; ql++) {
      var yl = padT + rowH * (ql + 0.5);
      ctx.beginPath();
      ctx.moveTo(padL, yl);
      ctx.lineTo(W - padR, yl);
      ctx.stroke();
    }

    // Layer 1: Hadamard gates (column 0)
    for (var h = 0; h < n; h++) {
      this.drawGate(ctx, padL + colW * 1.5, padT + rowH * (h + 0.5), 'H', GATE_COLORS.H);
    }
    // Layer 2: RZ gates (column 1) — show parameter values
    for (var r1 = 0; r1 < n; r1++) {
      this.drawParamGate(ctx, padL + colW * 3.0, padT + rowH * (r1 + 0.5), 'RZ', this.params[r1]);
    }
    // Layer 3: CNOT entanglement (column 2-3) — connect nearest neighbours
    for (var c = 0; c < n; c++) {
      var ctrl = c, tgt = (c + 1) % n;
      var ctrlY = padT + rowH * (ctrl + 0.5);
      var tgtY = padT + rowH * (tgt + 0.5);
      var cx = padL + colW * 4.5;
      // Control dot
      ctx.fillStyle = GATE_COLORS.CNOT;
      ctx.beginPath();
      ctx.arc(cx, ctrlY, 4, 0, 2 * Math.PI);
      ctx.fill();
      // Connection line
      ctx.strokeStyle = GATE_COLORS.CNOT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, ctrlY);
      ctx.lineTo(cx, tgtY);
      ctx.stroke();
      // Target (⊕ symbol)
      ctx.strokeStyle = GATE_COLORS.CNOT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, tgtY, 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 8, tgtY); ctx.lineTo(cx + 8, tgtY);
      ctx.moveTo(cx, tgtY - 8); ctx.lineTo(cx, tgtY + 8);
      ctx.stroke();
    }
    // Layer 4: RZ gates (column 4) — second parameterised layer
    for (var r2 = 0; r2 < n; r2++) {
      this.drawParamGate(ctx, padL + colW * 6.0, padT + rowH * (r2 + 0.5), 'RZ', this.params[r2] * 0.5);
    }
    // Measurement (column 5)
    for (var m = 0; m < n; m++) {
      var mx = padL + colW * 7.3;
      var my = padT + rowH * (m + 0.5);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx, my, 8, Math.PI, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx - 4, my + 2);
      ctx.lineTo(mx, my - 4);
      ctx.lineTo(mx + 4, my + 2);
      ctx.stroke();
    }

    // Header
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px ui-monospace';
    ctx.fillText('VQC(θ) = ∏ RZ(θ) · CNOT-ring · RZ(θ) · H ⊗ n', padL, 14);

    // Layer labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px ui-monospace';
    ctx.fillText('Layer 1: H', padL + colW * 1.5 - 24, H - 8);
    ctx.fillText('Layer 2: RZ(θ)', padL + colW * 3.0 - 28, H - 8);
    ctx.fillText('Layer 3: CNOT', padL + colW * 4.5 - 22, H - 8);
    ctx.fillText('Layer 4: RZ(θ)', padL + colW * 6.0 - 28, H - 8);
    ctx.fillText('Measure', padL + colW * 7.3 - 22, H - 8);
  };

  VQCAnimator.prototype.drawGate = function (ctx, x, y, label, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0e1a';
    ctx.font = 'bold 11px ui-monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  };

  VQCAnimator.prototype.drawParamGate = function (ctx, x, y, label, param) {
    ctx.fillStyle = '#1a2133';
    ctx.strokeStyle = GATE_COLORS.RZ;
    ctx.lineWidth = 1.5;
    // Box for parameter gate
    ctx.fillRect(x - 14, y - 14, 28, 28);
    ctx.strokeRect(x - 14, y - 14, 28, 28);
    ctx.fillStyle = GATE_COLORS.RZ;
    ctx.font = 'bold 9px ui-monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - 4);
    ctx.fillStyle = '#f3f4f6';
    ctx.font = '8px ui-monospace';
    ctx.fillText(param.toFixed(2), x, y + 6);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  };

  VQCAnimator.prototype.renderLossChart = function () {
    var ctx = this.lossCtx;
    var W = this.lossCanvas.width, H = this.lossCanvas.height;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    // Title
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px ui-monospace';
    ctx.fillText('⟨H⟩ loss ( minimise to ground state )', 12, 18);
    if (this.history.length < 2) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px ui-monospace';
      ctx.fillText('Press Train to start VQE optimisation', 12, H - 20);
      return;
    }
    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 30); ctx.lineTo(40, H - 20);
    ctx.lineTo(W - 10, H - 20);
    ctx.stroke();
    // Plot loss
    var minL = Math.min.apply(null, this.history);
    var maxL = Math.max.apply(null, this.history);
    if (maxL === minL) maxL = minL + 1;
    var rangeL = maxL - minL;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < this.history.length; i++) {
      var x = 40 + (W - 50) * (i / Math.max(this.maxHistory - 1, 1));
      var y = H - 20 - (H - 50) * ((this.history[i] - minL) / rangeL);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Highlight current point
    var curIdx = this.history.length - 1;
    var curX = 40 + (W - 50) * (curIdx / Math.max(this.maxHistory - 1, 1));
    var curY = H - 20 - (H - 50) * ((this.history[curIdx] - minL) / rangeL);
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(curX, curY, 4, 0, 2 * Math.PI);
    ctx.fill();
    // Min label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px ui-monospace';
    ctx.fillText('min: ' + minL.toFixed(3), W - 80, H - 6);
  };

  VQCAnimator.prototype.renderBarrenPlateauChart = function () {
    var ctx = this.bpCtx;
    var W = this.bpCanvas.width, H = this.bpCanvas.height;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    // Title
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px ui-monospace';
    ctx.fillText('Barren plateau: Var[∂L/∂θ] vs #qubits', 12, 18);
    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 30); ctx.lineTo(40, H - 20);
    ctx.lineTo(W - 10, H - 20);
    ctx.stroke();
    // Var (∂L/∂θ) decreases ~ exponentially with n: Var ~ 1/(2^n) for global cost
    var pts = [];
    for (var n = 1; n <= 12; n++) {
      var variance = 1.0 / Math.pow(2, n);  // barren plateau
      var x = 40 + (W - 50) * (n - 1) / 11;
      var y = H - 20 - (H - 50) * variance;
      pts.push([x, y]);
    }
    // Log scale y (visually clearer)
    var logPts = pts.map(function (p) {
      var logV = Math.log(1.0 / Math.pow(2, (p[0] - 40) / (W - 50) * 11 + 1)) / Math.log(10);
      return [p[0], H - 20 - (H - 50) * Math.max(0, logV / -4)];  // normalize -4 (10^-4) to 0
    });
    // Plot
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < logPts.length; i++) {
      if (i === 0) ctx.moveTo(logPts[i][0], logPts[i][1]);
      else ctx.lineTo(logPts[i][0], logPts[i][1]);
    }
    ctx.stroke();
    // Current marker (this.nQubits)
    var curIdx = this.nQubits - 1;
    if (curIdx >= 0 && curIdx < logPts.length) {
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(logPts[curIdx][0], logPts[curIdx][1], 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px ui-monospace';
      ctx.fillText('n=' + this.nQubits, logPts[curIdx][0] - 10, logPts[curIdx][1] - 10);
    }
    // Labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px ui-monospace';
    ctx.fillText('n=1', 40 - 5, H - 6);
    ctx.fillText('n=12', W - 30, H - 6);
    ctx.fillText('var', 12, 36);
    // Annotation
    ctx.fillStyle = '#ec4899';
    ctx.font = '9px ui-monospace';
    ctx.fillText('Var ~ 2^-n (exponential)', W - 140, 36);
  };

  // ---- Registry + auto-mount ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new VQCAnimator(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  global.AIHPC_VQC = {
    mount: mount,
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    replay: function (id) { var c = INSTANCES[id]; if (c) c.reset(); },
    _instances: INSTANCES,
  };
})(typeof window !== 'undefined' ? window : this);

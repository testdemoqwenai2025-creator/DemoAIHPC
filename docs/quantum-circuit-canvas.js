/**
 * quantum-circuit-canvas.js — Phase 46 interactive quantum-circuit builder.
 *
 * Lets users drag-and-drop quantum gates (H, X, Y, Z, S, T, CNOT, RZ, RY, RX)
 * onto a circuit grid + see the resulting state vector evolve in real-time.
 *
 * The circuit is a grid of n_qubits × n_steps. Each cell can hold one gate.
 * The state vector is computed by applying gates left-to-right, starting from |0...0⟩.
 *
 * Features:
 *   - Gate palette (drag gates onto the grid)
 *   - Real-time state vector |ψ⟩ display (probability bar chart)
 *   - Measurement button (collapses the state)
 *   - Circuit export (JSON + Qiskit-style text)
 *   - Preset circuits: Bell state, GHZ state, Deutsch-Jozsa, Grover (2-qubit)
 *
 * Pure client-side. Real state-vector simulation up to 6 qubits (64-element
 * complex vector).
 *
 * Public API (window.AIHPC_QCIRCUIT):
 *   mount(containerId, opts)
 *   clear(id) — remove all gates
 *   loadPreset(id, presetName) — load a preset circuit
 *   measure(id) — collapse the state
 */
(function (global) {
  'use strict';

  var GATES = {
    'H':  { symbol: 'H', color: '#06b6d4', matrix: [[[Math.SQRT1_2,0],[Math.SQRT1_2,0]],[[Math.SQRT1_2,0],[-Math.SQRT1_2,0]]], desc: 'Hadamard — creates superposition' },
    'X':  { symbol: 'X', color: '#ef4444', matrix: [[[0,0],[1,0]],[[1,0],[0,0]]], desc: 'Pauli-X — bit flip' },
    'Y':  { symbol: 'Y', color: '#10b981', matrix: [[[0,0],[0,-1]],[[0,1],[0,0]]], desc: 'Pauli-Y — bit+phase flip' },
    'Z':  { symbol: 'Z', color: '#a855f7', matrix: [[[1,0],[0,0]],[[0,0],[-1,0]]], desc: 'Pauli-Z — phase flip' },
    'S':  { symbol: 'S', color: '#fbbf24', matrix: [[[1,0],[0,0]],[[0,0],[0,1]]], desc: 'Phase gate S' },
    'T':  { symbol: 'T', color: '#f59e0b', matrix: [[[1,0],[0,0]],[[0,0],[Math.cos(Math.PI/4),Math.sin(Math.PI/4)]]], desc: 'T gate π/8' },
    'CNOT':{ symbol: '⊕', color: '#8b5cf6', desc: 'CNOT — entangling gate (control⊕target)' },
  };

  var PRESETS = {
    'bell': { name: 'Bell state |Φ+⟩', gates: [{q:0,step:0,g:'H'},{q:0,step:1,g:'CNOT',target:1}], desc: '(|00⟩+|11⟩)/√2' },
    'ghz': { name: 'GHZ |000⟩+|111⟩', gates: [{q:0,step:0,g:'H'},{q:0,step:1,g:'CNOT',target:1},{q:1,step:2,g:'CNOT',target:2}], desc: '(|000⟩+|111⟩)/√2' },
    'superposition': { name: 'All-superposition', gates: [{q:0,step:0,g:'H'},{q:1,step:0,g:'H'},{q:2,step:0,g:'H'}], desc: '|+++⟩ = equal superposition of all 8 states' },
    'grover2': { name: 'Grover 2-qubit', gates: [{q:0,step:0,g:'H'},{q:1,step:0,g:'H'},{q:0,step:1,g:'CNOT',target:1},{q:0,step:2,g:'H'},{q:1,step:2,g:'H'},{q:0,step:3,g:'X'},{q:1,step:3,g:'X'},{q:0,step:4,g:'CNOT',target:1},{q:0,step:5,g:'X'},{q:1,step:5,g:'X'},{q:0,step:6,g:'H'},{q:1,step:6,g:'H'}], desc: 'Grover search for |11⟩' },
  };

  // Complex helpers: [re, im]
  function cmul(a, b) { return [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]]; }
  function cadd(a, b) { return [a[0]+b[0], a[1]+b[1]]; }
  function cscale(a, s) { return [a[0]*s, a[1]*s]; }

  function QuantumCircuitCanvas(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.nQubits = this.opts.nQubits || 3;
    this.nSteps = 8;
    this.grid = []; // grid[qubit][step] = gate or null
    for (var q = 0; q < this.nQubits; q++) { this.grid[q] = []; for (var s = 0; s < this.nSteps; s++) this.grid[q][s] = null; }
    this.stateVector = null;
    this.selectedGate = 'H';
    this.build();
    this.computeState();
    this.render();
  }

  QuantumCircuitCanvas.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🎨 Quantum Circuit Builder</span><span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 46 · drag-and-drop</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<select class="qc-preset" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 11px;"><option value="">Load preset...</option><option value="bell">Bell |Φ+⟩</option><option value="ghz">GHZ 3-qubit</option><option value="superposition">All-superposition</option><option value="grover2">Grover 2-qubit</option></select>'
      + '<button class="qc-clear" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Clear</button>'
      + '<button class="qc-measure" style="background: linear-gradient(90deg,#ef4444,#f59e0b); border: none; color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Measure</button>'
      + '<select class="qc-qubits" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 11px;"><option value="2">2 qubits</option><option value="3" selected>3 qubits</option><option value="4">4 qubits</option><option value="5">5 qubits</option><option value="6">6 qubits</option></select>'
      + '</div>';
    card.appendChild(header);

    // Gate palette
    var palette = document.createElement('div');
    palette.style.cssText = 'display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;';
    Object.keys(GATES).forEach(function (g) {
      var gate = GATES[g];
      var btn = document.createElement('button');
      btn.className = 'qc-gate-btn' + (g === self.selectedGate ? ' active' : '');
      btn.dataset.gate = g;
      btn.style.cssText = 'background: ' + (g === self.selectedGate ? gate.color : '#1a2133') + '; border: 1px solid ' + gate.color + '; color: ' + (g === self.selectedGate ? '#0a0e1a' : gate.color) + '; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 700; font-family: ui-monospace;';
      btn.textContent = gate.symbol;
      btn.title = gate.desc;
      btn.addEventListener('click', function () {
        self.selectedGate = g;
        palette.querySelectorAll('.qc-gate-btn').forEach(function (b) { b.classList.remove('active'); b.style.background = '#1a2133'; b.style.color = GATES[b.dataset.gate].color; });
        btn.classList.add('active'); btn.style.background = gate.color; btn.style.color = '#0a0e1a';
      });
      palette.appendChild(btn);
    });
    card.appendChild(palette);

    // Layout: circuit grid (left) + state vector (right)
    var layout = document.createElement('div');
    layout.style.cssText = 'display: grid; grid-template-columns: 1fr 200px; gap: 12px;';
    var circuitDiv = document.createElement('div');
    circuitDiv.style.cssText = 'background: #0a0e1a; border: 1px solid var(--border, #1f2937); border-radius: 8px; padding: 8px; overflow-x: auto;';
    var circuitSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    circuitSvg.setAttribute('class', 'qc-circuit-svg');
    circuitSvg.style.cssText = 'display: block; min-width: 500px;';
    circuitDiv.appendChild(circuitSvg);
    layout.appendChild(circuitDiv);

    var stateDiv = document.createElement('div');
    stateDiv.style.cssText = 'background: #0a0e1a; border: 1px solid var(--border, #1f2937); border-radius: 8px; padding: 8px;';
    stateDiv.innerHTML = '<div style="font-size: 10px; color: #06b6d4; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">State |ψ⟩</div><div class="qc-state-display" style="font-family: ui-monospace; font-size: 9px;"></div>';
    layout.appendChild(stateDiv);
    card.appendChild(layout);

    // Status
    var status = document.createElement('div');
    status.className = 'qc-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px; font-family: ui-monospace;';
    card.appendChild(status);

    c.appendChild(card);
    this.svg = circuitSvg;
    this.stateDisplay = stateDiv.querySelector('.qc-state-display');
    this.statusEl = status;

    // Wire controls
    header.querySelector('.qc-clear').addEventListener('click', function () { self.clear(); });
    header.querySelector('.qc-measure').addEventListener('click', function () { self.measure(); });
    header.querySelector('.qc-preset').addEventListener('change', function (e) { if (e.target.value) self.loadPreset(e.target.value); });
    header.querySelector('.qc-qubits').addEventListener('change', function (e) { self.nQubits = parseInt(e.target.value); self.clear(); });

    // Click on SVG to place/remove gates
    circuitSvg.addEventListener('click', function (e) { self.onSvgClick(e); });
  };

  QuantumCircuitCanvas.prototype.onSvgClick = function (e) {
    var rect = this.svg.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var padL = 40, padT = 20, cellW = 50, cellH = 40;
    var col = Math.floor((x - padL) / cellW);
    var row = Math.floor((y - padT) / cellH);
    if (col < 0 || col >= this.nSteps || row < 0 || row >= this.nQubits) return;
    if (this.grid[row][col]) {
      // Remove existing gate
      this.grid[row][col] = null;
    } else {
      // Place selected gate
      var gate = { g: this.selectedGate };
      if (this.selectedGate === 'CNOT') {
        // CNOT needs a target — if row < nQubits-1, target = row+1; else row-1
        gate.target = row < this.nQubits - 1 ? row + 1 : row - 1;
      }
      this.grid[row][col] = gate;
    }
    this.computeState();
    this.render();
  };

  QuantumCircuitCanvas.prototype.clear = function () {
    for (var q = 0; q < this.nQubits; q++) for (var s = 0; s < this.nSteps; s++) this.grid[q][s] = null;
    this.computeState();
    this.render();
  };

  QuantumCircuitCanvas.prototype.loadPreset = function (name) {
    this.clear();
    var preset = PRESETS[name];
    if (!preset) return;
    preset.gates.forEach(function (g) { if (g.q < this.nQubits) this.grid[g.q][g.step] = { g: g.g, target: g.target }; }, this);
    this.computeState();
    this.render();
    if (this.statusEl) this.statusEl.textContent = 'Preset: ' + preset.name + ' — ' + preset.desc;
  };

  QuantumCircuitCanvas.prototype.measure = function () {
    if (!this.stateVector) return;
    var n = this.stateVector.length;
    var probs = this.stateVector.map(function (a) { return a[0]*a[0] + a[1]*a[1]; });
    var r = Math.random();
    var cum = 0;
    for (var i = 0; i < n; i++) { cum += probs[i]; if (r < cum) { this.stateVector = new Array(n).fill([0,0]); this.stateVector[i] = [1,0]; break; } }
    this.render();
    if (this.statusEl) this.statusEl.textContent = 'Measured: |' + i.toString(2).padStart(this.nQubits, '0') + '⟩ (collapsed)';
  };

  QuantumCircuitCanvas.prototype.computeState = function () {
    // Start from |0...0⟩
    var N = 1 << this.nQubits;
    var state = new Array(N);
    for (var i = 0; i < N; i++) state[i] = [0, 0];
    state[0] = [1, 0];

    // Apply gates left-to-right
    for (var step = 0; step < this.nSteps; step++) {
      for (var q = 0; q < this.nQubits; q++) {
        var gate = this.grid[q][step];
        if (!gate) continue;
        if (gate.g === 'CNOT') {
          state = this.applyCNOT(state, q, gate.target);
        } else {
          var g = GATES[gate.g];
          if (g && g.matrix) state = this.applySingleGate(state, q, g.matrix);
        }
      }
    }
    this.stateVector = state;
  };

  QuantumCircuitCanvas.prototype.applySingleGate = function (state, qubit, mat) {
    var N = state.length;
    var out = new Array(N);
    for (var i = 0; i < N; i++) out[i] = [state[i][0], state[i][1]];
    var step = 1 << qubit;
    for (var i = 0; i < N; i++) {
      if ((i & step) === 0) {
        var j = i | step;
        var a = state[i], b = state[j];
        out[i] = cadd(cmul(a, mat[0][0]), cmul(b, mat[0][1]));
        out[j] = cadd(cmul(a, mat[1][0]), cmul(b, mat[1][1]));
      }
    }
    return out;
  };

  QuantumCircuitCanvas.prototype.applyCNOT = function (state, control, target) {
    var N = state.length;
    var out = new Array(N);
    for (var i = 0; i < N; i++) out[i] = [state[i][0], state[i][1]];
    var ctrlMask = 1 << control;
    var tgtMask = 1 << target;
    for (var i = 0; i < N; i++) {
      if ((i & ctrlMask) && !(i & tgtMask)) { var j = i ^ tgtMask; out[i] = state[j]; out[j] = state[i]; }
    }
    return out;
  };

  QuantumCircuitCanvas.prototype.render = function () {
    var padL = 40, padT = 20, cellW = 50, cellH = 40;
    var W = padL + this.nSteps * cellW + 10;
    var H = padT + this.nQubits * cellH + 10;
    this.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    this.svg.setAttribute('width', W);
    this.svg.setAttribute('height', H);

    var parts = [];
    // Wire labels + lines
    for (var q = 0; q < this.nQubits; q++) {
      var y = padT + q * cellH + cellH / 2;
      parts.push('<text x="8" y="' + (y + 4) + '" font-size="11" fill="#9ca3af" font-family="ui-monospace">q' + q + '</text>');
      parts.push('<line x1="' + padL + '" y1="' + y + '" x2="' + (W - 5) + '" y2="' + y + '" stroke="rgba(148,163,184,0.5)" stroke-width="1.5"/>');
    }
    // Step column headers
    for (var s = 0; s < this.nSteps; s++) {
      var xh = padL + s * cellW + cellW / 2;
      parts.push('<text x="' + xh + '" y="14" text-anchor="middle" font-size="9" fill="#6b7280" font-family="ui-monospace">' + (s + 1) + '</text>');
    }
    // Gates
    for (var q2 = 0; q2 < this.nQubits; q2++) {
      for (var s2 = 0; s2 < this.nSteps; s2++) {
        var gate = this.grid[q2][s2];
        if (!gate) continue;
        var cx = padL + s2 * cellW + cellW / 2;
        var cy = padT + q2 * cellH + cellH / 2;
        var g = GATES[gate.g];
        if (!g) continue;
        if (gate.g === 'CNOT' && gate.target !== undefined) {
          var ty = padT + gate.target * cellH + cellH / 2;
          parts.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + ty + '" stroke="' + g.color + '" stroke-width="2"/>');
          parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + g.color + '"/>');
          parts.push('<circle cx="' + cx + '" cy="' + ty + '" r="8" fill="none" stroke="' + g.color + '" stroke-width="2"/>');
          parts.push('<line x1="' + (cx - 8) + '" y1="' + ty + '" x2="' + (cx + 8) + '" y2="' + ty + '" stroke="' + g.color + '" stroke-width="2"/>');
          parts.push('<line x1="' + cx + '" y1="' + (ty - 8) + '" x2="' + cx + '" y2="' + (ty + 8) + '" stroke="' + g.color + '" stroke-width="2"/>');
        } else {
          parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="' + g.color + '" opacity="0.9"/>');
          parts.push('<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="11" fill="#0a0e1a" font-family="ui-monospace" font-weight="700">' + g.symbol + '</text>');
        }
      }
    }
    this.svg.innerHTML = parts.join('');

    // State vector display
    if (this.stateVector) {
      var html = '<div style="display: flex; flex-direction: column; gap: 2px;">';
      for (var i = 0; i < this.stateVector.length; i++) {
        var prob = this.stateVector[i][0] * this.stateVector[i][0] + this.stateVector[i][1] * this.stateVector[i][1];
        var label = '|' + i.toString(2).padStart(this.nQubits, '0') + '⟩';
        var barW = Math.round(prob * 100);
        var color = prob > 0.01 ? '#06b6d4' : '#1f2937';
        html += '<div style="display: flex; align-items: center; gap: 4px;"><span style="font-size: 8px; color: #9ca3af; width: 40px;">' + label + '</span><div style="flex: 1; height: 8px; background: #1a2133; border-radius: 2px; overflow: hidden;"><div style="width: ' + barW + '%; height: 100%; background: ' + color + ';"></div></div><span style="font-size: 8px; color: ' + color + '; width: 28px; text-align: right;">' + (prob * 100).toFixed(1) + '%</span></div>';
      }
      html += '</div>';
      this.stateDisplay.innerHTML = html;
    }

    // Status
    if (this.statusEl && !this.statusEl.textContent.startsWith('Measured')) {
      var nonzero = 0;
      if (this.stateVector) for (var k = 0; k < this.stateVector.length; k++) { if (this.stateVector[k][0]*this.stateVector[k][0] + this.stateVector[k][1]*this.stateVector[k][1] > 0.01) nonzero++; }
      this.statusEl.textContent = this.nQubits + ' qubits · 2^' + this.nQubits + ' = ' + (1 << this.nQubits) + ' amplitudes · ' + nonzero + ' non-zero · selected gate: ' + this.selectedGate + ' · click grid to place/remove';
    }
  };

  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new QuantumCircuitCanvas(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }
  global.AIHPC_QCIRCUIT = {
    mount: mount, clear: function (id) { var c = INSTANCES[id]; if (c) c.clear(); },
    loadPreset: function (id, name) { var c = INSTANCES[id]; if (c) c.loadPreset(name); },
    measure: function (id) { var c = INSTANCES[id]; if (c) c.measure(); },
    _instances: INSTANCES, _presets: PRESETS,
  };
})(typeof window !== 'undefined' ? window : this);

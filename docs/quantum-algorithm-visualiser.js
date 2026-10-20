/**
 * quantum-algorithm-visualiser.js — Phase 47
 *
 * Animates famous quantum algorithms step-by-step on the circuit canvas:
 *   1. Deutsch-Jozsa (2-qubit, shows quantum parallelism)
 *   2. Grover's search (amplitude amplification)
 *   3. Quantum Fourier Transform (QFT, 3-qubit)
 *
 * Each algorithm is presented as a sequence of gate placements on the
 * quantum-circuit-canvas. The viewer auto-plays each step, explains what
 * the gate does, and shows the evolving state vector.
 *
 * Public API (window.AIHPC_QALGO):
 *   mount(containerId, opts)
 *   play(id) / pause(id) / next(id) / prev(id)
 */
(function (global) {
  'use strict';

  var ALGORITHMS = [
    {
      name: 'Deutsch-Jozsa (2-qubit)',
      desc: 'Determines if a function is constant or balanced in 1 query (classical: 2^(n-1)+1 queries). Shows quantum parallelism.',
      nQubits: 2,
      steps: [
        { gates: [{q:0,g:'X'},{q:1,g:'X'}], explain: 'Step 1: Initialize |11⟩ — flip both qubits from |0⟩ to |1⟩. The ancilla qubit (q1) must be |1⟩ for the phase-kickback trick.' },
        { gates: [{q:0,g:'H'},{q:1,g:'H'}], explain: 'Step 2: Apply Hadamard to both — creates superposition (|00⟩-|01⟩-|10⟩+|11⟩)/2. Both qubits are now in equal superposition.' },
        { gates: [{q:0,g:'CNOT',target:1}], explain: 'Step 3: Apply the oracle (simulated as CNOT). If the function is balanced, the CNOT creates entanglement. If constant, no effect.' },
        { gates: [{q:0,g:'H'}], explain: 'Step 4: Apply Hadamard to q0. This is the key: the Hadamard undoes the superposition, and the result tells us constant vs balanced.' },
        { gates: [{q:0,g:'measure',target:0}], explain: 'Step 5: Measure q0. If |0⟩ → constant function. If |1⟩ → balanced. Quantum: 1 query. Classical worst-case: 2^(n-1)+1 queries.' },
      ],
    },
    {
      name: "Grover's Search (2-qubit, target=|11⟩)",
      desc: 'Searches an unsorted database of N=4 items in O(√N) = 2 queries (classical: O(N) = 4). Amplitude amplification.',
      nQubits: 2,
      steps: [
        { gates: [{q:0,g:'H'},{q:1,g:'H'}], explain: 'Step 1: Initialize equal superposition |++⟩ = (|00⟩+|01⟩+|10⟩+|11⟩)/2. All 4 states equally likely.' },
        { gates: [{q:0,g:'CNOT',target:1},{q:1,g:'Z'}], explain: 'Step 2: Oracle — mark the target |11⟩ by flipping its phase. The oracle "knows" the answer; Grover amplifies the marked state.' },
        { gates: [{q:0,g:'H'},{q:1,g:'H'},{q:0,g:'X'},{q:1,g:'X'}], explain: 'Step 3: Diffusion operator (part 1) — apply H + X to both qubits. This is the "inversion about the mean" — it amplifies the marked state.' },
        { gates: [{q:0,g:'CNOT',target:1}], explain: 'Step 4: Diffusion operator (part 2) — CNOT creates the phase flip needed for amplitude amplification.' },
        { gates: [{q:0,g:'X'},{q:1,g:'X'},{q:0,g:'H'},{q:1,g:'H'}], explain: 'Step 5: Diffusion operator (part 3) — undo X + H. After 1 Grover iteration, |11⟩ has ~100% probability (optimal for N=4).' },
        { gates: [{q:0,g:'measure',target:0},{q:1,g:'measure',target:1}], explain: 'Step 6: Measure both qubits. Result: |11⟩ (the marked item) with ~100% probability. Only 1 Grover iteration needed for N=4.' },
      ],
    },
    {
      name: 'Quantum Fourier Transform (3-qubit)',
      desc: 'Computes the discrete Fourier transform of the quantum state amplitudes. The quantum analogue of the FFT — exponential speedup over classical FFT. Key subroutine of Shor\'s algorithm.',
      nQubits: 3,
      steps: [
        { gates: [{q:0,g:'H'}], explain: 'Step 1: H on q0 — creates superposition in the least-significant qubit.' },
        { gates: [{q:1,g:'CNOT',target:0}], explain: 'Step 2: Controlled-R2 (simulated as CNOT) — entangles q1 with q0, creating a controlled phase rotation.' },
        { gates: [{q:1,g:'H'}], explain: 'Step 3: H on q1 — creates superposition in q1, conditioned on q0\'s state.' },
        { gates: [{q:2,g:'CNOT',target:0}], explain: 'Step 4: Controlled-R2 between q2 and q0 — phase rotation.' },
        { gates: [{q:2,g:'CNOT',target:1}], explain: 'Step 5: Controlled-R4 between q2 and q1 — phase rotation.' },
        { gates: [{q:2,g:'H'}], explain: 'Step 6: H on q2 — completes the QFT on q2.' },
        { gates: [{q:0,g:'CNOT',target:2},{q:1,g:'CNOT',target:2},{q:0,g:'CNOT',target:1}], explain: 'Step 7: SWAP q0↔q2 (via 3 CNOTs) — reverses qubit order to match classical FFT output convention. QFT complete!' },
      ],
    },
  ];

  function QuantumAlgorithmVisualiser(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.currentAlgo = 0;
    this.currentStep = 0;
    this.playing = false;
    this.rafId = null;
    this.lastStepTime = 0;
    this.stepDuration = 2500; // ms per step
    this.build();
  }

  QuantumAlgorithmVisualiser.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px);';

    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #10b981;">📐 Quantum Algorithm Visualiser</span><span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 47</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="qa-prev" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">◀ Prev</button>'
      + '<button class="qa-play" style="background: linear-gradient(90deg,#10b981,#06b6d4); border: none; color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">▶ Play</button>'
      + '<button class="qa-next" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Next ▶</button>'
      + '</div>';
    card.appendChild(header);

    // Algorithm selector
    var algoBar = document.createElement('div');
    algoBar.style.cssText = 'display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;';
    ALGORITHMS.forEach(function (a, idx) {
      var btn = document.createElement('button');
      btn.className = 'qa-algo-btn' + (idx === 0 ? ' active' : '');
      btn.dataset.algoIdx = idx;
      btn.style.cssText = 'background: ' + (idx === 0 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : '#1a2133') + '; border: 1px solid ' + (idx === 0 ? 'transparent' : '#2a3548') + '; color: ' + (idx === 0 ? 'white' : '#9ca3af') + '; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;';
      btn.textContent = a.name;
      btn.addEventListener('click', function () {
        self.currentAlgo = idx; self.currentStep = 0; self.renderCircuit();
        algoBar.querySelectorAll('.qa-algo-btn').forEach(function (b) { b.style.background = '#1a2133'; b.style.color = '#9ca3af'; b.style.border = '1px solid #2a3548'; });
        btn.style.background = 'linear-gradient(90deg,#10b981,#06b6d4)'; btn.style.color = 'white'; btn.style.border = '1px solid transparent';
      });
      algoBar.appendChild(btn);
    });
    card.appendChild(algoBar);

    // Layout: circuit canvas (left) + explanation (right)
    var layout = document.createElement('div');
    layout.style.cssText = 'display: grid; grid-template-columns: 1fr 280px; gap: 12px;';
    var circuitDiv = document.createElement('div');
    circuitDiv.id = 'qa-circuit-mount';
    circuitDiv.style.cssText = 'min-height: 200px;';
    layout.appendChild(circuitDiv);

    var explainDiv = document.createElement('div');
    explainDiv.style.cssText = 'padding: 12px; background: rgba(11,15,26,0.6); border: 1px solid var(--border, #1f2937); border-radius: 8px;';
    explainDiv.innerHTML = '<div class="qa-explain" style="font-size: 12px; color: #f3f4f6; line-height: 1.7;">Select an algorithm and press Play.</div>';
    layout.appendChild(explainDiv);
    card.appendChild(layout);

    // Progress bar
    var progress = document.createElement('div');
    progress.style.cssText = 'margin-top: 8px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;';
    progress.innerHTML = '<div class="qa-progress" style="height: 100%; width: 0%; background: linear-gradient(90deg,#10b981,#06b6d4); transition: width 0.3s;"></div>';
    card.appendChild(progress);

    // Status
    var status = document.createElement('div');
    status.className = 'qa-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px; font-family: ui-monospace;';
    card.appendChild(status);

    c.appendChild(card);
    this.circuitMount = circuitDiv;
    this.explainEl = explainDiv.querySelector('.qa-explain');
    this.progressEl = progress.querySelector('.qa-progress');
    this.statusEl = status;

    // Wire controls
    header.querySelector('.qa-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.qa-next').addEventListener('click', function () { self.nextStep(); });
    header.querySelector('.qa-prev').addEventListener('click', function () { self.prevStep(); });

    // Mount the circuit canvas
    if (global.AIHPC_QCIRCUIT) {
      var algo = ALGORITHMS[this.currentAlgo];
      global.AIHPC_QCIRCUIT.mount('qa-circuit-mount', { nQubits: algo.nQubits });
      this.renderCircuit();
    }
  };

  QuantumAlgorithmVisualiser.prototype.renderCircuit = function () {
    var algo = ALGORITHMS[this.currentAlgo];
    if (!algo || !global.AIHPC_QCIRCUIT) return;
    // Clear the circuit
    global.AIHPC_QCIRCUIT.clear('qa-circuit-mount');
    // Apply steps 0..currentStep
    var inst = global.AIHPC_QCIRCUIT._instances['qa-circuit-mount'];
    if (!inst) return;
    for (var s = 0; s <= this.currentStep && s < algo.steps.length; s++) {
      var step = algo.steps[s];
      step.gates.forEach(function (g) {
        if (g.q < inst.nQubits && g.step === undefined) {
          // Assign step = s
          inst.grid[g.q][s] = { g: g.g, target: g.target };
        }
      });
    }
    inst.computeState();
    inst.render();

    // Update explanation
    var stepData = algo.steps[this.currentStep];
    if (stepData) {
      this.explainEl.innerHTML = '<div style="font-size: 10px; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">Step ' + (this.currentStep + 1) + ' / ' + algo.steps.length + '</div>' + stepData.explain;
    }

    // Progress bar
    var pct = ((this.currentStep + 1) / algo.steps.length) * 100;
    this.progressEl.style.width = pct + '%';

    // Status
    this.statusEl.textContent = algo.name + ' · step ' + (this.currentStep + 1) + '/' + algo.steps.length + (this.playing ? ' · playing' : ' · paused');
  };

  QuantumAlgorithmVisualiser.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastStepTime = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var now = performance.now();
      if (now - self.lastStepTime > self.stepDuration) {
        self.lastStepTime = now;
        var algo = ALGORITHMS[self.currentAlgo];
        if (self.currentStep < algo.steps.length - 1) {
          self.currentStep++;
          self.renderCircuit();
        } else {
          // Move to next algorithm
          self.currentAlgo = (self.currentAlgo + 1) % ALGORITHMS.length;
          self.currentStep = 0;
          // Re-mount circuit canvas with new qubit count
          var newAlgo = ALGORITHMS[self.currentAlgo];
          if (global.AIHPC_QCIRCUIT) {
            // Update qubit count
            var inst = global.AIHPC_QCIRCUIT._instances['qa-circuit-mount'];
            if (inst) { inst.nQubits = newAlgo.nQubits; inst.clear(); }
          }
          self.renderCircuit();
          // Update algo buttons
          var btns = self.container.querySelectorAll('.qa-algo-btn');
          btns.forEach(function (b, i) {
            b.style.background = i === self.currentAlgo ? 'linear-gradient(90deg,#10b981,#06b6d4)' : '#1a2133';
            b.style.color = i === self.currentAlgo ? 'white' : '#9ca3af';
          });
        }
      }
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  QuantumAlgorithmVisualiser.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.renderCircuit();
  };

  QuantumAlgorithmVisualiser.prototype.nextStep = function () {
    var algo = ALGORITHMS[this.currentAlgo];
    if (this.currentStep < algo.steps.length - 1) {
      this.currentStep++;
      this.renderCircuit();
    }
  };

  QuantumAlgorithmVisualiser.prototype.prevStep = function () {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderCircuit();
    }
  };

  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new QuantumAlgorithmVisualiser(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }
  global.AIHPC_QALGO = {
    mount: mount,
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    next: function (id) { var c = INSTANCES[id]; if (c) c.nextStep(); },
    prev: function (id) { var c = INSTANCES[id]; if (c) c.prevStep(); },
    _instances: INSTANCES, _algorithms: ALGORITHMS,
  };
})(typeof window !== 'undefined' ? window : this);

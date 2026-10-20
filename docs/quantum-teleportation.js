/**
 * quantum-teleportation.js — Phase 49 quantum teleportation protocol visualiser.
 *
 * Animates the full quantum teleportation protocol: entangle A-B → Bell
 * measurement on A-C → classical communication → Pauli correction on B
 * → state teleported from C to B.
 *
 * The viewer shows 3 qubit "stations" (Alice's qubit C, entangled pair
 * A-B, Bob's qubit B) with animated quantum gates and classical bits.
 *
 * Scenes: idle → entangle → Bell measure → classical send → correct → teleported
 *
 * Public API (window.AIHPC_QTELEPORT):
 *   mount(containerId, opts)   play(id) / pause(id)
 */
(function (global) {
  'use strict';

  var SCENES = [
    { title: '1. Setup — Alice has |ψ⟩, Bob is far away', desc: 'Alice (left) has an unknown state |ψ⟩ = α|0⟩ + β|1⟩ on qubit C. Bob (right) is far away. They share nothing — yet.', color: '#06b6d4', teleportStage: 0 },
    { title: '2. Entangle A-B — shared Bell pair', desc: 'A Bell pair |Φ+⟩ = (|00⟩ + |11⟩)/√2 is created between qubits A (Alice) and B (Bob). Alice holds A, Bob holds B. This is the entanglement resource.', color: '#8b5cf6', teleportStage: 1 },
    { title: '3. Bell measurement — Alice measures A+C', desc: 'Alice performs a Bell measurement on her qubits A and C. This projects A+C into one of 4 Bell states. The result: 2 classical bits.', color: '#ec4899', teleportStage: 2 },
    { title: '4. Classical communication — 2 bits to Bob', desc: 'Alice sends the 2 classical bits (00, 01, 10, or 11) to Bob via classical channel (speed of light). No quantum information is transmitted — only classical bits.', color: '#f59e0b', teleportStage: 3 },
    { title: '5. Pauli correction — Bob applies I/X/Z/XZ', desc: 'Based on the 2 classical bits, Bob applies a Pauli correction: 00→I, 01→X, 10→Z, 11→XZ. After correction, Bob\'s qubit B is in state |ψ⟩ — teleported!', color: '#10b981', teleportStage: 4 },
    { title: '6. Teleported! |ψ⟩ moved from C to B', desc: 'The unknown state |ψ⟩ has been teleported from Alice\'s qubit C to Bob\'s qubit B. The original |ψ⟩ on C was destroyed (no-cloning theorem). Quantum teleportation: information without matter transfer.', color: '#06b6d4', teleportStage: 5 },
  ];

  function QuantumTeleportationViewer(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.currentScene = 0;
    this.playing = false;
    this.rafId = null;
    this.lastSceneTime = 0;
    this.t = 0;
    this.build();
  }

  QuantumTeleportationViewer.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px);';
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">📡 Quantum Teleportation</span><span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 49</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="qt-play" style="background: linear-gradient(90deg,#06b6d4,#8b5cf6); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play</button>'
      + '<button class="qt-next" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">Next ▶</button>'
      + '</div>';
    card.appendChild(header);

    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'aspect-ratio: 16/9; background: #0a0e1a; border: 1px solid var(--border, #1f2937); border-radius: 8px; overflow: hidden;';
    var canvas = document.createElement('canvas');
    canvas.width = 540; canvas.height = 304;
    canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    canvasWrap.appendChild(canvas);
    card.appendChild(canvasWrap);

    var status = document.createElement('div');
    status.className = 'qt-status';
    status.style.cssText = 'font-size: 12px; color: #9ca3af; margin-top: 12px; font-family: ui-monospace;';
    card.appendChild(status);

    c.appendChild(card);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.statusEl = status;

    header.querySelector('.qt-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.qt-next').addEventListener('click', function () { self.nextScene(); });

    this.render();
  };

  QuantumTeleportationViewer.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastSceneTime = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var now = performance.now();
      self.t = (now - self.lastSceneTime) / 1000;
      if (self.t > 5) { self.nextScene(); self.lastSceneTime = now; }
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };
  QuantumTeleportationViewer.prototype.pause = function () { this.playing = false; if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null; };
  QuantumTeleportationViewer.prototype.nextScene = function () { this.currentScene = (this.currentScene + 1) % SCENES.length; this.t = 0; this.render(); };

  QuantumTeleportationViewer.prototype.render = function () {
    var ctx = this.ctx, W = 540, H = 304;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
    var scene = SCENES[this.currentScene];
    var stage = scene.teleportStage;

    // Starfield
    if (!this._stars) { this._stars = []; for (var i = 0; i < 30; i++) this._stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1+0.3,a:Math.random()*0.3+0.2}); }
    for (var si = 0; si < this._stars.length; si++) {
      var s = this._stars[si];
      ctx.fillStyle = 'rgba(255,255,255,' + (s.a * (0.7 + 0.3 * Math.sin(this.t * 2 + si))).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI); ctx.fill();
    }

    // 3 qubit positions: Alice (C + A) on left, Bob (B) on right
    var aliceC = { x: 80, y: 120 };   // Alice's unknown qubit
    var aliceA = { x: 180, y: 120 };  // Alice's half of Bell pair
    var bobB = { x: 420, y: 120 };    // Bob's half of Bell pair
    var alicePos = { x: 130, y: 230 };
    var bobPos = { x: 420, y: 230 };

    // Labels
    ctx.font = 'bold 11px ui-monospace';
    ctx.fillStyle = '#06b6d4'; ctx.textAlign = 'center';
    ctx.fillText('Alice', alicePos.x, alicePos.y);
    ctx.fillText('Bob', bobPos.x, bobPos.y);

    // Qubit C (Alice's unknown state)
    var cColor = stage >= 5 ? '#1a2133' : (stage >= 2 ? '#ef4444' : '#06b6d4');
    ctx.fillStyle = cColor;
    ctx.beginPath(); ctx.arc(aliceC.x, aliceC.y, 16, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px ui-monospace';
    ctx.fillText('C', aliceC.x, aliceC.y + 4);
    if (stage < 2) { ctx.fillStyle = '#06b6d4'; ctx.fillText('|ψ⟩', aliceC.x, aliceC.y - 24); }
    if (stage >= 2) { ctx.fillStyle = '#ef4444'; ctx.fillText('measured', aliceC.x, aliceC.y - 24); }

    // Qubit A (Alice's half of Bell pair)
    var aColor = stage >= 1 ? '#8b5cf6' : '#1a2133';
    ctx.fillStyle = aColor;
    ctx.beginPath(); ctx.arc(aliceA.x, aliceA.y, 16, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText('A', aliceA.x, aliceA.y + 4);
    if (stage >= 1 && stage < 2) { ctx.fillStyle = '#8b5cf6'; ctx.fillText('entangled', aliceA.x, aliceA.y - 24); }
    if (stage >= 2) { ctx.fillStyle = '#ec4899'; ctx.fillText('measured', aliceA.x, aliceA.y - 24); }

    // Qubit B (Bob's half)
    var bColor = stage >= 5 ? '#10b981' : (stage >= 1 ? '#8b5cf6' : '#1a2133');
    ctx.fillStyle = bColor;
    ctx.beginPath(); ctx.arc(bobB.x, bobB.y, 16, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText('B', bobB.x, bobB.y + 4);
    if (stage >= 1 && stage < 5) { ctx.fillStyle = '#8b5cf6'; ctx.fillText('entangled', bobB.x, bobB.y - 24); }
    if (stage >= 5) { ctx.fillStyle = '#10b981'; ctx.fillText('|ψ⟩ ✓', bobB.x, bobB.y - 24); }

    // Entanglement line A-B (shown from stage 1)
    if (stage >= 1 && stage < 2) {
      ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(aliceA.x + 16, aliceA.y); ctx.lineTo(bobB.x - 16, bobB.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#8b5cf6'; ctx.font = '9px ui-monospace';
      ctx.fillText('|Φ+⟩', (aliceA.x + bobB.x) / 2, 100);
    }

    // Bell measurement box (stage 2+)
    if (stage >= 2 && stage < 5) {
      var bx = (aliceA.x + aliceC.x) / 2, by = aliceA.y - 40;
      ctx.fillStyle = 'rgba(236,72,153,0.15)'; ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx - 40, by - 12, 80, 24, 6) : ctx.rect(bx - 40, by - 12, 80, 24);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ec4899'; ctx.font = 'bold 9px ui-monospace'; ctx.textAlign = 'center';
      ctx.fillText('Bell measure', bx, by + 4);
      // Lines from C and A to the measurement box
      ctx.strokeStyle = 'rgba(236,72,153,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(aliceC.x, aliceC.y - 16); ctx.lineTo(bx, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(aliceA.x, aliceA.y - 16); ctx.lineTo(bx, by); ctx.stroke();
    }

    // Classical communication (stage 3+)
    if (stage >= 3) {
      var clX = alicePos.x + 30 + (this.t % 2) * 200;
      if (clX > bobPos.x - 30) clX = alicePos.x + 30;
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(alicePos.x + 30, alicePos.y - 20); ctx.lineTo(bobPos.x - 30, bobPos.y - 20); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(clX, alicePos.y - 20, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.font = '9px ui-monospace'; ctx.fillStyle = '#f59e0b';
      ctx.fillText('2 classical bits', (alicePos.x + bobPos.x) / 2, alicePos.y - 30);
    }

    // Pauli correction (stage 4+)
    if (stage >= 4 && stage < 5) {
      ctx.fillStyle = 'rgba(16,185,129,0.15)'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(bobB.x - 20, bobB.y + 20, 40, 20, 4); } else { ctx.rect(bobB.x - 20, bobB.y + 20, 40, 20); }
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 8px ui-monospace'; ctx.textAlign = 'center';
      ctx.fillText('I/X/Z/XZ', bobB.x, bobB.y + 34);
    }

    // Title
    ctx.fillStyle = scene.color; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'left';
    ctx.fillText(scene.title, 10, 16);
    ctx.textAlign = 'center';

    // Status
    if (this.statusEl) {
      this.statusEl.innerHTML = '<span style="color:' + scene.color + '; font-weight: 700;">' + scene.title + '</span> &nbsp; ' + scene.desc;
    }
  };

  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new QuantumTeleportationViewer(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }
  global.AIHPC_QTELEPORT = { mount: mount, play: function(id){var c=INSTANCES[id];if(c)c.play();}, pause: function(id){var c=INSTANCES[id];if(c)c.pause();}, next: function(id){var c=INSTANCES[id];if(c)c.nextScene();}, _instances: INSTANCES, _scenes: SCENES };
})(typeof window !== 'undefined' ? window : this);

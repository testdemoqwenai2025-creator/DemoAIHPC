/**
 * biomolecular-dynamics.js — Phase 43 BioEmu2-style biomolecular dynamics
 * viewer. Inspired by the Microsoft Research BioEmu2 post (José Jiménez
 * Luna) — a foundation model for biomolecular structure, dynamics, and
 * function with 4 capabilities:
 *
 *   1. Structure prediction  — single-chain 3D fold from sequence
 *   2. Large complexes        — multi-chain assemblies (e.g. ribosome)
 *   3. Equilibrium sampling  — Boltzmann-distributed conformational ensemble
 *   4. Dynamics              — MD trajectory (time evolution of conformations)
 *
 * The viewer renders 4 panels in a 2x2 grid, each with:
 *   - A 3D ball-and-stick / ribbon / volume canvas
 *   - A play button (auto-animated)
 *   - A live metric readout (RMSD, Rg, free-energy, etc.)
 *
 * Pure client-side. All structures are procedurally generated (no real
 * PDB data). Lazy-loaded via IntersectionObserver.
 *
 * Public API (window.AIHPC_BIODYN):
 *   mount(containerId, opts)         — mount
 *   play(id) / pause(id) / replay(id) — control all 4 panels
 */
(function (global) {
  'use strict';

  function rotateYawPitch(p, yaw, pitch) {
    var x1 = p.x * Math.cos(yaw) - p.y * Math.sin(yaw);
    var y1 = p.x * Math.sin(yaw) + p.y * Math.cos(yaw);
    var z1 = p.z;
    var y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
    var z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
    return { x: x1, y: y2, z: z2 };
  }

  function project(p, cx, cy, scale) {
    return {
      x: cx + p.x * scale,
      y: cy - p.z * scale,
      depth: p.y,
    };
  }

  function depthAlpha(d) {
    return 0.4 + 0.6 * ((d + 1) / 2);
  }

  // Generate a polypeptide backbone as a smooth curve through space
  function generateBackbone(nResidues, opts) {
    opts = opts || {};
    var pts = [];
    var x = -1, y = 0, z = 0;
    var alpha = 0;  // current direction angle
    var beta = 0;
    for (var i = 0; i < nResidues; i++) {
      pts.push({ x: x, y: y, z: z });
      // Spiral-ish walk: combine alpha-helix (57°, -47°) or beta-sheet
      var phi = Math.PI * (opts.phi || 57) / 180;
      var psi = Math.PI * (opts.psi || -47) / 180;
      var step = 0.18;
      alpha += phi * 0.1;
      beta += psi * 0.1;
      x += step * Math.cos(alpha);
      y += step * Math.sin(alpha);
      z += step * Math.sin(beta);
    }
    // Normalise to [-1, 1]
    var maxX = 0, maxY = 0, maxZ = 0;
    for (var j = 0; j < pts.length; j++) {
      maxX = Math.max(maxX, Math.abs(pts[j].x));
      maxY = Math.max(maxY, Math.abs(pts[j].y));
      maxZ = Math.max(maxZ, Math.abs(pts[j].z));
    }
    var maxA = Math.max(maxX, maxY, maxZ, 0.01);
    for (var k = 0; k < pts.length; k++) {
      pts[k].x /= maxA; pts[k].y /= maxA; pts[k].z /= maxA;
    }
    return pts;
  }

  function BiomolecularDynamicsViewer(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.yaw = 0;
    this.pitch = 0.4;
    this.t = 0;
    this.build();
  }

  BiomolecularDynamicsViewer.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = ''
      + '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🧬 BioEmu2-style Biomolecular Dynamics</span>'
      + '<span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 43 · 4-panel foundation model</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="bd-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play</button>'
      + '<button class="bd-pause" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">⏸</button>'
      + '<button class="bd-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">↺ Replay</button>'
      + '</div>';
    card.appendChild(header);

    // 2x2 grid of panels
    var grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';
    var panels = [
      { id: 'structure', title: '1. Structure prediction', subtitle: 'Single-chain fold from sequence', color: '#06b6d4', metricLabel: 'pLDDT', metricValue: 0.87 },
      { id: 'complex', title: '2. Large complexes', subtitle: 'Multi-chain assembly (ribosome)', color: '#8b5cf6', metricLabel: 'Chains', metricValue: 4 },
      { id: 'ensemble', title: '3. Equilibrium sampling', subtitle: 'Boltzmann conformational ensemble', color: '#ec4899', metricLabel: 'ΔG', metricValue: -8.4 },
      { id: 'dynamics', title: '4. Dynamics', subtitle: 'MD trajectory (time evolution)', color: '#f59e0b', metricLabel: 'RMSD', metricValue: 2.1 },
    ];
    panels.forEach(function (p) {
      var panel = document.createElement('div');
      panel.style.cssText = 'position: relative; aspect-ratio: 1/1; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid ' + p.color + '33;';
      panel.innerHTML = '<div style="position: absolute; top: 6px; left: 8px; right: 8px; font-family: ui-monospace; font-size: 10px; text-shadow: 0 1px 3px rgba(0,0,0,1);"><div style="color: ' + p.color + '; font-weight: 700;">' + p.title + '</div><div style="color: #9ca3af; font-size: 9px;">' + p.subtitle + '</div></div><div style="position: absolute; bottom: 6px; left: 8px; right: 8px; font-family: ui-monospace; font-size: 10px; color: ' + p.color + '; text-shadow: 0 1px 3px rgba(0,0,0,1); display: flex; justify-content: space-between;"><span>' + p.metricLabel + '</span><span class="bd-metric-' + p.id + '">' + p.metricValue + '</span></div>';
      var canvas = document.createElement('canvas');
      canvas.width = 220; canvas.height = 220;
      canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
      panel.appendChild(canvas);
      grid.appendChild(panel);
      self['_canvas_' + p.id] = canvas;
      self['_ctx_' + p.id] = canvas.getContext('2d');
      self['_panel_' + p.id] = p;
    });
    card.appendChild(grid);

    // Status
    var status = document.createElement('div');
    status.className = 'bd-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px;';
    card.appendChild(status);

    c.appendChild(card);
    this.statusEl = status;

    // Wire controls
    header.querySelector('.bd-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.bd-pause').addEventListener('click', function () { self.pause(); });
    header.querySelector('.bd-replay').addEventListener('click', function () { self.replay(); });

    // Pre-generate backbones for each panel
    this.backbones = {
      structure: generateBackbone(80, { phi: 57, psi: -47 }),  // alpha-helix
      complex: generateBackbone(120, { phi: -120, psi: 120 }),  // beta-ish
      ensemble: [generateBackbone(60, { phi: 57, psi: -47, }), generateBackbone(60, { phi: -60, psi: 60 }), generateBackbone(60, { phi: 100, psi: -100 }), generateBackbone(60, { phi: -130, psi: 130 })],
      dynamics: generateBackbone(80, { phi: 57, psi: -47 }),
    };

    this.render();
  };

  BiomolecularDynamicsViewer.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      self.yaw += dt * 0.5;
      self.t += dt;
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  BiomolecularDynamicsViewer.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  };

  BiomolecularDynamicsViewer.prototype.replay = function () {
    this.t = 0;
    this.yaw = 0;
    this.play();
  };

  BiomolecularDynamicsViewer.prototype.render = function () {
    // Panel 1: Structure prediction — single backbone, drawn as ball-and-stick
    this.renderStructurePanel();
    // Panel 2: Large complexes — multiple backbones in different colours
    this.renderComplexPanel();
    // Panel 3: Equilibrium sampling — overlaid ensemble (ghosts)
    this.renderEnsemblePanel();
    // Panel 4: Dynamics — single backbone morphing over time
    this.renderDynamicsPanel();
    if (this.statusEl) {
      this.statusEl.textContent = 't = ' + this.t.toFixed(1) + 's · 4 panels rendering · yaw ' + (this.yaw * 180 / Math.PI).toFixed(0) + '°';
    }
  };

  BiomolecularDynamicsViewer.prototype.renderStructurePanel = function () {
    var ctx = this._ctx_structure, canvas = this._canvas_structure;
    var W = canvas.width, H = canvas.height;
    var cx = W / 2, cy = H / 2, scale = 80;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    var bb = this.backbones.structure;
    // Project + sort by depth
    var projected = bb.map(function (p) { return { orig: p, rp: rotateYawPitch(p, this.yaw, this.pitch) }; }, this);
    projected = projected.map(function (item) { item.screen = project(item.rp, cx, cy, scale); return item; });
    // Draw backbone as connected balls
    for (var i = 0; i < projected.length; i++) {
      var p = projected[i];
      var alpha = depthAlpha(p.screen.depth);
      // Ball colour: alternating alpha-helix colour vs beta
      ctx.fillStyle = i % 2 === 0 ? 'rgba(6,182,212,' + alpha.toFixed(3) + ')' : 'rgba(139,92,246,' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.screen.x, p.screen.y, 2.5 * alpha + 1, 0, 2 * Math.PI);
      ctx.fill();
      // Bond to previous
      if (i > 0) {
        var prev = projected[i - 1];
        ctx.strokeStyle = 'rgba(148,163,184,' + (alpha * 0.6).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prev.screen.x, prev.screen.y);
        ctx.lineTo(p.screen.x, p.screen.y);
        ctx.stroke();
      }
    }
    // Metric: pLDDT (animated, oscillates around 0.87)
    var plddt = 0.85 + 0.05 * Math.sin(this.t * 0.5);
    var el = this.container.querySelector('.bd-metric-structure');
    if (el) el.textContent = plddt.toFixed(2);
  };

  BiomolecularDynamicsViewer.prototype.renderComplexPanel = function () {
    var ctx = this._ctx_complex, canvas = this._canvas_complex;
    var W = canvas.width, H = canvas.height;
    var cx = W / 2, cy = H / 2, scale = 60;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    var bb = this.backbones.complex;
    var chains = [
      { color: '#8b5cf6', offset: { x: -0.3, y: -0.2, z: 0 } },
      { color: '#06b6d4', offset: { x: 0.3, y: -0.2, z: 0 } },
      { color: '#ec4899', offset: { x: -0.3, y: 0.2, z: 0 } },
      { color: '#10b981', offset: { x: 0.3, y: 0.2, z: 0 } },
    ];
    for (var ci = 0; ci < chains.length; ci++) {
      var chain = chains[ci];
      // Offset the backbone by the chain offset, then project
      var projected = bb.map(function (p) {
        var p2 = { x: p.x + chain.offset.x, y: p.y + chain.offset.y, z: p.z + chain.offset.z };
        var rp = rotateYawPitch(p2, this.yaw, this.pitch);
        return project(rp, cx, cy, scale);
      }, this);
      ctx.strokeStyle = chain.color + '88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var i = 0; i < projected.length; i++) {
        if (i === 0) ctx.moveTo(projected[i].x, projected[i].y);
        else ctx.lineTo(projected[i].x, projected[i].y);
      }
      ctx.stroke();
      // Endpoint balls
      ctx.fillStyle = chain.color;
      ctx.beginPath(); ctx.arc(projected[0].x, projected[0].y, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(projected[projected.length - 1].x, projected[projected.length - 1].y, 4, 0, 2 * Math.PI); ctx.fill();
    }
    // Metric: chains = 4
    var el = this.container.querySelector('.bd-metric-complex');
    if (el) el.textContent = '4 chains';
  };

  BiomolecularDynamicsViewer.prototype.renderEnsemblePanel = function () {
    var ctx = this._ctx_ensemble, canvas = this._canvas_ensemble;
    var W = canvas.width, H = canvas.height;
    var cx = W / 2, cy = H / 2, scale = 70;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    var backbones = this.backbones.ensemble;
    // Cycle through backbones based on t — show 4 at once, slowly morphing
    for (var bi = 0; bi < backbones.length; bi++) {
      var bb = backbones[bi];
      var alpha = 0.4 + 0.3 * Math.sin(this.t * 0.5 + bi * Math.PI / 2);
      var projected = bb.map(function (p) {
        var rp = rotateYawPitch(p, this.yaw + bi * 0.1, this.pitch);
        return project(rp, cx, cy, scale);
      }, this);
      ctx.strokeStyle = 'rgba(236,72,153,' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var i = 0; i < projected.length; i++) {
        if (i === 0) ctx.moveTo(projected[i].x, projected[i].y);
        else ctx.lineTo(projected[i].x, projected[i].y);
      }
      ctx.stroke();
    }
    // Metric: ΔG (free energy), varies with t
    var dg = -8.4 + 1.2 * Math.sin(this.t * 0.7);
    var el = this.container.querySelector('.bd-metric-ensemble');
    if (el) el.textContent = dg.toFixed(1) + ' kcal/mol';
  };

  BiomolecularDynamicsViewer.prototype.renderDynamicsPanel = function () {
    var ctx = this._ctx_dynamics, canvas = this._canvas_dynamics;
    var W = canvas.width, H = canvas.height;
    var cx = W / 2, cy = H / 2, scale = 80;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    // Backbone with time-varying perturbation (mimics MD trajectory)
    var bb = this.backbones.dynamics;
    var projected = bb.map(function (p, idx) {
      var pert = 0.1 * Math.sin(this.t * 2 + idx * 0.3);
      var p2 = { x: p.x + pert, y: p.y + pert * 0.7, z: p.z + pert * 0.5 };
      var rp = rotateYawPitch(p2, this.yaw, this.pitch);
      return project(rp, cx, cy, scale);
    }, this);
    // Trail effect: draw the backbone 5 times with decreasing alpha
    for (var trail = 0; trail < 5; trail++) {
      var trailT = this.t - trail * 0.1;
      var trailProjected = bb.map(function (p, idx) {
        var pert = 0.1 * Math.sin(trailT * 2 + idx * 0.3);
        var p2 = { x: p.x + pert, y: p.y + pert * 0.7, z: p.z + pert * 0.5 };
        var rp = rotateYawPitch(p2, this.yaw - trail * 0.05, this.pitch);
        return project(rp, cx, cy, scale);
      }, this);  // <-- pass `this` as the second arg so the callback can read this.yaw + this.pitch
      ctx.strokeStyle = 'rgba(245,158,11,' + (0.6 - trail * 0.1).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var i = 0; i < trailProjected.length; i++) {
        if (i === 0) ctx.moveTo(trailProjected[i].x, trailProjected[i].y);
        else ctx.lineTo(trailProjected[i].x, trailProjected[i].y);
      }
      ctx.stroke();
    }
    // Endpoint ball
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(projected[projected.length - 1].x, projected[projected.length - 1].y, 4, 0, 2 * Math.PI); ctx.fill();
    // Metric: RMSD (slowly drifts)
    var rmsd = 2.1 + 0.8 * Math.sin(this.t * 0.4);
    var el = this.container.querySelector('.bd-metric-dynamics');
    if (el) el.textContent = rmsd.toFixed(2) + ' Å';
  };

  // ---- Registry + auto-mount ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new BiomolecularDynamicsViewer(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  global.AIHPC_BIODYN = {
    mount: mount,
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    replay: function (id) { var c = INSTANCES[id]; if (c) c.replay(); },
    _instances: INSTANCES,
  };
})(typeof window !== 'undefined' ? window : this);

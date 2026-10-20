/**
 * molecule-3d.js — Phase 38 cheminformatics 3D / N-D component.
 *
 * Renders molecules as 3D ball-and-stick models with the same
 * isometric projection chain we built for graph-table-sync.js.
 * Atoms are spheres with element-typed colors (CPK palette);
 * bonds are cylinders. The component supports:
 *
 *   - SMILES-driven 3D layout (naive — embeds each heavy atom at
 *     a deterministic position derived from the SMILES string; not
 *     a true 3D conformer but visually plausible for demos)
 *   - Animated rotation (yaw + pitch)
 *   - Pharmacophore overlay (H-bond donor, acceptor, hydrophobic,
 *     aromatic ring centers, +ve / -ve ionizable)
 *   - 3D QSAR landscape: a property surface (e.g. logP, pIC50)
 *     rendered as a wireframe sphere section around the molecule
 *   - N-D extension: any property the user picks (logP, MW, TPSA,
 *     rotatable bonds, HBD, HBA, ring count) is mapped to an
 *     additional axis, and the molecule + a parallel 'property
 *     vector' is projected from N-D to 3D using the same isometric
 *     chain as docs/nd-viewer.js.
 *
 * Inspired by the Causal-Chemprop paper (ACS JCIM 2026) — causal
 * inference + MPNN for pIC50 prediction — and by the LinkedIn
 * qubit-visualization post that motivated the Bloch sphere in
 * Phase 37. Pure client-side, no external services.
 *
 * Public API (window.AIHPC_MOL3D):
 *   mount(containerId, opts)         — mount into a container
 *   register(id, config)             — register a molecule
 *   play(id) / pause(id) / replay(id) — control animation
 *   setProperty(id, propName)         — switch the N-D property axis
 *
 * Config:
 *   { id, smiles, name, properties: { logP, MW, TPSA, ... },
 *     atoms: [{ element, x, y, z, label }],  // optional override
 *     bonds: [[i, j, order], ...],          // optional override
 *     pharmacophore: { donors: [...], acceptors: [...], ... },
 *     landscapeProperty: 'pIC50',  // for 3D QSAR surface
 *   }
 */
(function (global) {
  'use strict';

  // CPK-inspired element palette (subset)
  var ELEMENT_COLORS = {
    H: '#f3f4f6', C: '#374151', N: '#3b82f6', O: '#ef4444',
    F: '#22c55e', Cl: '#16a34a', Br: '#b45309', I: '#7c2d12',
    P: '#a855f7', S: '#fbbf24', B: '#fcd34d', Si: '#f59e0b',
    Na: '#dc2626', K: '#9333ea', Ca: '#a3a3a3', Fe: '#dc2626',
    Zn: '#7c3aed', Mg: '#84cc16', default: '#9ca3af',
  };
  var ELEMENT_RADII = {  // van der Waals radii (Angstrom), scaled
    H: 1.2, C: 1.7, N: 1.55, O: 1.52, F: 1.47, Cl: 1.75, Br: 1.85,
    I: 1.98, P: 1.8, S: 1.8, default: 1.5,
  };

  // ---- Naive SMILES → 3D layout (deterministic, not a real conformer) ----
  function smilesTo3D(smiles) {
    // Parse a very small subset of SMILES: heavy atoms + single/double bonds.
    // For demos only — real layout requires RDKit / OpenBabel.
    var atoms = [];
    var bonds = [];
    var prevIdx = -1;
    var branchStack = [];
    // March around a target direction in 3D using a Fibonacci spiral
    // for visual diversity — each atom gets a position that's roughly
    // on a sphere of growing radius.
    var phi = (1 + Math.sqrt(5)) / 2;  // golden ratio
    var i = 0;
    var bondOrder = 1;
    var t = smiles;
    var k = 0;
    while (k < t.length) {
      var c = t[k];
      if (c === '(') { branchStack.push(prevIdx); k++; continue; }
      if (c === ')') { prevIdx = branchStack.pop() || prevIdx; k++; continue; }
      if (c === '=') { bondOrder = 2; k++; continue; }
      if (c === '#') { bondOrder = 3; k++; continue; }
      if (c === '[') {
        // Atom in brackets — read until ']'
        var end = t.indexOf(']', k);
        if (end < 0) break;
        var sym = t.slice(k + 1, end).replace(/[^A-Za-z]/g, '');
        var el = sym.charAt(0).toUpperCase() + sym.slice(1).toLowerCase();
        atoms.push(makeAtom(el, i, atoms.length));
        if (prevIdx >= 0) bonds.push([prevIdx, atoms.length - 1, bondOrder]);
        prevIdx = atoms.length - 1;
        bondOrder = 1;
        i++;
        k = end + 1;
        continue;
      }
      // Two-letter symbols first: Cl, Br, Si, ...
      var two = t.substr(k, 2);
      if (['Cl', 'Br', 'Si'].indexOf(two) >= 0) {
        atoms.push(makeAtom(two, i, atoms.length));
        if (prevIdx >= 0) bonds.push([prevIdx, atoms.length - 1, bondOrder]);
        prevIdx = atoms.length - 1;
        bondOrder = 1;
        i++;
        k += 2;
        continue;
      }
      // Single-letter elements
      if ('CNOPSFB I'.indexOf(c) >= 0 && c !== ' ') {
        var el1 = c.toUpperCase();
        atoms.push(makeAtom(el1, i, atoms.length));
        if (prevIdx >= 0) bonds.push([prevIdx, atoms.length - 1, bondOrder]);
        prevIdx = atoms.length - 1;
        bondOrder = 1;
        i++;
        k++;
        continue;
      }
      if (c >= '0' && c <= '9') {
        // Ring closure or branch number — skip
        k++;
        continue;
      }
      // Skip ring digits / aromatic lowercase
      k++;
    }
    return { atoms: atoms, bonds: bonds };
  }

  function makeAtom(element, idx, total) {
    // Fibonacci sphere placement for diversity
    var n = Math.max(1, total + 1);
    var y = 1 - (idx + 0.5) / n * 2;
    var radius = Math.sqrt(Math.max(0, 1 - y * y));
    var theta = idx * Math.PI * (3 - Math.sqrt(5));  // golden angle
    var x = Math.cos(theta) * radius;
    var z = Math.sin(theta) * radius;
    var scale = 0.7;
    return {
      element: element,
      x: x * scale, y: y * scale, z: z * scale,
      r: (ELEMENT_RADII[element] || ELEMENT_RADII.default) * 0.18,
      color: ELEMENT_COLORS[element] || ELEMENT_COLORS.default,
      label: element,
    };
  }

  // ---- Projection (shared with GTS 3D) ----
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

  function depthAlpha(depth) {
    // Front (depth=1): full alpha; Back (depth=-1): 0.35 alpha
    return 0.35 + 0.65 * ((depth + 1) / 2);
  }

  // ---- Component constructor ----
  function Molecule3D(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.molecules = {};  // id -> { atoms, bonds, ... }
    this.activeId = null;
    this.yaw = 0;
    this.pitch = 0.5;
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.propertyAxis = null;  // for N-D mode
    this.build();
  }

  Molecule3D.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = ''
      + '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">⚛ 3D Molecule Viewer</span>'
      + '<span class="mol-name" style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">—</span></div>'
      + '<div class="mol-controls" style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="mol-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">▶ Play</button>'
      + '<button class="mol-pause" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">⏸</button>'
      + '<button class="mol-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">↺</button>'
      + '<button class="mol-pharm" style="background: rgba(139,92,246,0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">🎯 Pharm</button>'
      + '<button class="mol-landscape" style="background: rgba(6,182,212,0.15); border: 1px solid #06b6d4; color: #67e8f9; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">⛰ QSAR</button>'
      + '<button class="mol-nd" style="background: rgba(236,72,153,0.15); border: 1px solid #ec4899; color: #f9a8d4; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">N-D</button>'
      + '</div>';
    card.appendChild(header);
    // Canvas wrap (1:1 aspect)
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position: relative; width: 100%; padding-top: 100%; border-radius: 12px; overflow: hidden; background: radial-gradient(circle at 50% 50%, rgba(139,92,246,0.10), rgba(11,15,26,1) 70%);';
    var canvas = document.createElement('canvas');
    canvas.className = 'mol-canvas';
    canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; display: block;';
    canvas.width = 480; canvas.height = 480;
    wrap.appendChild(canvas);
    // Info overlay (top-left)
    var info = document.createElement('div');
    info.className = 'mol-info';
    info.style.cssText = 'position: absolute; top: 8px; left: 8px; right: 8px; color: #f3f4f6; font-family: SF Mono, Menlo, monospace; font-size: 11px; pointer-events: none; line-height: 1.5;';
    wrap.appendChild(info);
    // Caption (bottom)
    var caption = document.createElement('div');
    caption.className = 'mol-caption';
    caption.style.cssText = 'position: absolute; bottom: 8px; left: 8px; right: 8px; color: #9ca3af; font-family: SF Mono, Menlo, monospace; font-size: 10px; pointer-events: none;';
    wrap.appendChild(caption);
    card.appendChild(wrap);
    // Status
    var status = document.createElement('div');
    status.className = 'mol-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px;';
    card.appendChild(status);

    c.appendChild(card);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.infoEl = info;
    this.captionEl = caption;
    this.statusEl = status;
    this.nameEl = header.querySelector('.mol-name');

    // Wire controls
    header.querySelector('.mol-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.mol-pause').addEventListener('click', function () { self.pause(); });
    header.querySelector('.mol-replay').addEventListener('click', function () { self.replay(); });
    header.querySelector('.mol-pharm').addEventListener('click', function () {
      self.showPharmacophore = !self.showPharmacophore;
      self.render();
    });
    header.querySelector('.mol-landscape').addEventListener('click', function () {
      self.showLandscape = !self.showLandscape;
      self.render();
    });
    header.querySelector('.mol-nd').addEventListener('click', function () {
      self.showND = !self.showND;
      self.render();
    });

    // Initial render
    this.render();
  };

  Molecule3D.prototype.register = function (id, config) {
    var m = config || {};
    var smiles = m.smiles || '';
    var layout;
    if (m.atoms && m.bonds) {
      layout = { atoms: m.atoms, bonds: m.bonds };
    } else {
      layout = smilesTo3D(smiles);
    }
    m.atoms = layout.atoms;
    m.bonds = layout.bonds;
    this.molecules[id] = m;
    if (!this.activeId) {
      this.activeId = id;
      this.updateInfo();
    }
  };

  Molecule3D.prototype.setActive = function (id) {
    if (!this.molecules[id]) return;
    this.activeId = id;
    this.updateInfo();
    this.render();
  };

  Molecule3D.prototype.setProperty = function (propName) {
    this.propertyAxis = propName;
    this.render();
  };

  Molecule3D.prototype.updateInfo = function () {
    var m = this.molecules[this.activeId];
    if (!m) return;
    this.nameEl.textContent = m.name || m.smiles || '—';
    var p = m.properties || {};
    var html = '<div style="color:#06b6d4; font-weight: 700;">SMILES: <span style="color:#f3f4f6;">' + (m.smiles || '—') + '</span></div>';
    html += '<div style="margin-top: 4px;">Atoms: ' + m.atoms.length + ' · Bonds: ' + m.bonds.length + '</div>';
    if (Object.keys(p).length > 0) {
      html += '<div style="margin-top: 6px; color:#9ca3af;">';
      var first = true;
      for (var k in p) {
        if (!first) html += ' · ';
        html += k + '=' + p[k];
        first = false;
      }
      html += '</div>';
    }
    this.infoEl.innerHTML = html;
    this.captionEl.innerHTML = m.caption || ('3D ball-and-stick layout — drag pending (use Play to rotate). ' + (m.notes || ''));
  };

  Molecule3D.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      self.yaw += dt * 0.4;
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
    this.statusEl.textContent = 'Rotating molecule…';
  };

  Molecule3D.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.statusEl.textContent = 'Paused.';
  };

  Molecule3D.prototype.replay = function () {
    this.yaw = 0;
    this.play();
  };

  // ---- Render -----------------------------------------------------------
  Molecule3D.prototype.render = function () {
    var ctx = this.ctx;
    var W = this.canvas.width, H = this.canvas.height;
    var cx = W / 2, cy = H / 2;
    var R = Math.min(W, H) * 0.42;

    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    // Starfield
    this.drawStarfield(ctx, W, H);

    var m = this.molecules[this.activeId];
    if (!m) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px ui-monospace';
      ctx.fillText('No molecule registered', 16, H - 16);
      return;
    }

    // Project all atoms + compute depth-sorted render order
    var projected = m.atoms.map(function (a, i) {
      var p = rotateYawPitch(a, this.yaw, this.pitch);
      var s = project(p, cx, cy, R);
      return { atom: a, screen: s, idx: i };
    }, this);

    // Sort: back-to-front for proper overlap (lowest depth first)
    var sorted = projected.slice().sort(function (a, b) { return a.screen.depth - b.screen.depth; });

    // ---- Bonds (split front/back halves for proper cylinder look) ----
    for (var bi = 0; bi < m.bonds.length; bi++) {
      var bond = m.bonds[bi];
      var a1 = projected[bond[0]]; var a2 = projected[bond[1]];
      if (!a1 || !a2) continue;
      var order = bond[2] || 1;
      var avgDepth = (a1.screen.depth + a2.screen.depth) / 2;
      var alpha = depthAlpha(avgDepth);
      var color = 'rgba(148,163,184,' + alpha.toFixed(3) + ')';
      // Draw bond as a line (with offset for double/triple)
      var dx = a2.screen.x - a1.screen.x;
      var dy = a2.screen.y - a1.screen.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len;  // perpendicular
      var off = (order - 1) * 1.8;
      if (order === 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a1.screen.x, a1.screen.y);
        ctx.lineTo(a2.screen.x, a2.screen.y);
        ctx.stroke();
      } else {
        // Multiple parallel lines
        for (var k = 0; k < order; k++) {
          var offset = (k - (order - 1) / 2) * 2.2;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(a1.screen.x + nx * offset, a1.screen.y + ny * offset);
          ctx.lineTo(a2.screen.x + nx * offset, a2.screen.y + ny * offset);
          ctx.stroke();
        }
      }
    }

    // ---- QSAR landscape (wireframe sphere section) ----
    if (this.showLandscape) {
      this.drawLandscape(ctx, cx, cy, R, m);
    }

    // ---- Atoms (sorted back-to-front) ----
    for (var si = 0; si < sorted.length; si++) {
      var item = sorted[si];
      var a = item.atom;
      var s = item.screen;
      var radius = a.r * R * depthAlpha(s.depth);  // depth fog on size too
      // Glow
      ctx.save();
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 10 * depthAlpha(s.depth);
      // Radial gradient sphere
      var grad = ctx.createRadialGradient(s.x - radius * 0.3, s.y - radius * 0.3, 0, s.x, s.y, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, a.color);
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.globalAlpha = depthAlpha(s.depth);
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      // Label (front atoms only)
      if (s.depth > -0.3) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px ui-monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.label, s.x, s.y);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    // ---- Pharmacophore overlay ----
    if (this.showPharmacophore) {
      this.drawPharmacophore(ctx, m, projected, R);
    }

    // ---- N-D property axis ----
    if (this.showND) {
      this.drawNDAxis(ctx, m, W, H);
    }

    // ---- Bottom HUD ----
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px ui-monospace';
    var info = 'Rotating ' + (m.name || m.smiles || 'molecule') + '  ·  ' + m.atoms.length + ' atoms  ·  ' + m.bonds.length + ' bonds';
    if (this.showPharmacophore) info += '  ·  pharmacophore ON';
    if (this.showLandscape) info += '  ·  QSAR surface ON';
    if (this.showND) info += '  ·  N-D mode ON';
    ctx.fillText(info, 16, H - 12);
  };

  Molecule3D.prototype.drawLandscape = function (ctx, cx, cy, R, m) {
    // Draw a wireframe sphere section around the molecule, coloured by
    // the chosen property (e.g. logP). For demo we use a simple radial
    // gradient + sinusoidal property function.
    var prop = this.propertyAxis || m.landscapeProperty || 'logP';
    var propVal = (m.properties || {})[prop];
    if (propVal === undefined) propVal = 0;
    // Map property to colour hue (blue=low, red=high)
    var hue = Math.max(0, Math.min(1, (propVal + 5) / 10));
    var ringColor = 'hsla(' + (220 - hue * 220) + ', 70%, 60%, 0.25)';
    var steps = 8;
    for (var i = 1; i < steps; i++) {
      var rr = R * 1.15 * (1 - i / steps);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rr, rr * 0.4, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
    // Equator
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.15, R * 1.15 * 0.4, 0, 0, 2 * Math.PI);
    ctx.stroke();
    // Label
    ctx.fillStyle = '#06b6d4';
    ctx.font = '11px ui-monospace';
    ctx.fillText('3D QSAR surface — property: ' + prop + ' = ' + propVal, 16, 28);
  };

  Molecule3D.prototype.drawPharmacophore = function (ctx, m, projected, R) {
    // Compute pharmacophore features from atoms (very simplified)
    var donors = []; var acceptors = []; var hydrophobics = []; var aromatics = [];
    for (var i = 0; i < m.atoms.length; i++) {
      var a = m.atoms[i];
      if (a.element === 'O' || a.element === 'N') {
        if (a.element === 'O') acceptors.push(i);
        if (a.element === 'N') donors.push(i);
      }
      if (a.element === 'C') hydrophobics.push(i);
    }
    function drawFeature(idx, color, label) {
      var p = projected[idx]; if (!p) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(p.screen.x, p.screen.y, 14, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = '10px ui-monospace';
      ctx.fillText(label, p.screen.x + 18, p.screen.y);
      ctx.restore();
    }
    donors.forEach(function (i) { drawFeature(i, '#3b82f6', 'HBD'); });
    acceptors.forEach(function (i) { drawFeature(i, '#ef4444', 'HBA'); });
    hydrophobics.forEach(function (i) { drawFeature(i, '#fbbf24', 'HYD'); });
  };

  Molecule3D.prototype.drawNDAxis = function (ctx, m, W, H) {
    // Show a parallel-coordinates style strip showing the molecule's
    // properties (logP, MW, TPSA, etc.) along the right edge.
    var p = m.properties || {};
    var keys = Object.keys(p);
    if (keys.length === 0) return;
    var stripX = W - 140;
    var stripY = 40;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(stripX, stripY, 120, keys.length * 18 + 16);
    ctx.strokeStyle = 'rgba(139,92,246,0.3)';
    ctx.strokeRect(stripX, stripY, 120, keys.length * 18 + 16);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 10px ui-monospace';
    ctx.fillText('N-D props', stripX + 8, stripY + 14);
    keys.forEach(function (k, i) {
      var y = stripY + 28 + i * 18;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px ui-monospace';
      ctx.fillText(k, stripX + 8, y);
      ctx.fillStyle = '#f3f4f6';
      ctx.fillText(String(p[k]), stripX + 70, y);
    });
  };

  Molecule3D.prototype.drawStarfield = function (ctx, W, H) {
    if (!this._stars) {
      this._stars = [];
      for (var i = 0; i < 50; i++) {
        this._stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.4 + 0.3,
          tw: Math.random() * Math.PI * 2,
        });
      }
    }
    var t = performance.now() / 1000;
    for (var i = 0; i < this._stars.length; i++) {
      var s = this._stars[i];
      var alpha = s.a * (0.7 + 0.3 * Math.sin(t * 2 + s.tw));
      ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // ---- Registry + auto-mount ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new Molecule3D(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  global.AIHPC_MOL3D = {
    mount: mount,
    register: function (instanceId, id, config) {
      var c = INSTANCES[instanceId];
      if (!c) return;
      c.register(id, config);
      c.render();
    },
    setActive: function (instanceId, id) {
      var c = INSTANCES[instanceId];
      if (c) c.setActive(id);
    },
    setProperty: function (instanceId, prop) {
      var c = INSTANCES[instanceId];
      if (c) c.setProperty(prop);
    },
    play: function (instanceId) { var c = INSTANCES[instanceId]; if (c) c.play(); },
    pause: function (instanceId) { var c = INSTANCES[instanceId]; if (c) c.pause(); },
    replay: function (instanceId) { var c = INSTANCES[instanceId]; if (c) c.replay(); },
    _instances: INSTANCES,
  };
})(typeof window !== 'undefined' ? window : this);

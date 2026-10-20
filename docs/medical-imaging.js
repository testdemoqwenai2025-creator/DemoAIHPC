/**
 * medical-imaging.js — Phase 39 multi-organ medical-imaging viewer.
 *
 * Inspired by the LinkedIn TotalSegmentator post (Wass et al. 2023)
 * which segments 117 organs from CT. We render 8 of the most
 * diagnostically relevant organs (lung, heart, liver, kidney L/R,
 * spleen, bladder, bone) on procedural CT/MRI slices.
 *
 * Design (surpassing the LinkedIn image):
 *   - Central slice thumbnail is MINIMISED (~150×150)
 *   - Peripheral slices are EMPHASISED — 6 large viewports showing
 *     different slices + organs + modalities (CT, MRI-T1, MRI-T2,
 *     X-ray, fused PET/CT, axial + coronal + sagittal)
 *   - Animated "scanner sweep" propagates segmentation organ-by-organ
 *   - Each organ glows in CPK-inspired colours
 *   - DICOM-style viewer chrome (slice #, modality, window/level, zoom)
 *
 * Pure client-side canvas. No external services. All slices are
 * procedurally generated (no real patient data).
 *
 * Public API (window.AIHPC_MEDIMG):
 *   mount(containerId, opts)         — mount into a container
 *   play(id) / pause(id) / replay(id) — control the animation
 *   setOrgan(id, organKey)          — highlight a specific organ
 *
 * Config:
 *   { id, organs: ['lung','heart',...], sweepSpeed: 1.0 }
 */
(function (global) {
  'use strict';

  // CPK-inspired organ colours (medical imaging convention)
  var ORGAN_COLORS = {
    lung: '#06b6d4',           // cyan
    heart: '#ef4444',          // red
    liver: '#b45309',         // brown-red
    'kidney-left': '#fbbf24', // amber
    'kidney-right': '#f59e0b',// amber-2
    spleen: '#a855f7',        // purple
    bladder: '#ec4899',       // pink
    bone: '#f3f4f6',          // white
    brain: '#22c55e',         // green
    stomach: '#10b981',       // emerald
    pancreas: '#84cc16',      // lime
    'aorta': '#dc2626',       // bright red
    'trachea': '#0ea5e9',     // sky
    default: '#9ca3af',
  };

  var ORGAN_LABELS = {
    lung: 'Lung',
    heart: 'Heart',
    liver: 'Liver',
    'kidney-left': 'Kidney L',
    'kidney-right': 'Kidney R',
    spleen: 'Spleen',
    bladder: 'Bladder',
    bone: 'Bone',
    brain: 'Brain',
    stomach: 'Stomach',
    pancreas: 'Pancreas',
    'aorta': 'Aorta',
    'trachea': 'Trachea',
  };

  var ORGAN_KEYS = ['lung', 'heart', 'liver', 'kidney-left', 'kidney-right', 'spleen', 'bladder', 'bone'];

  // ---- Procedural CT slice (per-slice noise + organ shapes) ----
  function generateCTSlice(width, height, sliceIdx, totalSlices, organs) {
    // Returns an ImageData-ish pixel array + organ mask.
    // Procedurally draws an axial CT slice with realistic shape.
    var canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    var ctx = canvas.getContext('2d');
    // Base background: dark CT grey (-1000 HU mapped to black)
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, width, height);
    // Body outline: elliptical torso (axial view)
    var cx = width / 2, cy = height / 2;
    var torsoRx = width * 0.42, torsoRy = height * 0.40;
    // Soft tissue base
    var bodyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, torsoRx);
    bodyGrad.addColorStop(0, '#3a3530');
    bodyGrad.addColorStop(0.5, '#2a2520');
    bodyGrad.addColorStop(1, '#1a1510');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, torsoRx, torsoRy, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Vertebra (bone) at the back
    ctx.fillStyle = '#e0d8c8';
    ctx.beginPath();
    ctx.arc(cx, cy + torsoRy * 0.65, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#1a1510';
    ctx.beginPath();
    ctx.arc(cx, cy + torsoRy * 0.65, 5, 0, 2 * Math.PI);
    ctx.fill();
    // Ribs (curving from vertebra)
    ctx.strokeStyle = '#d4cbb5';
    ctx.lineWidth = 2;
    for (var i = -3; i <= 3; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      ctx.arc(cx, cy + torsoRy * 0.65, 80 + Math.abs(i) * 10, Math.PI + i * 0.2, Math.PI + i * 0.2 + 0.8);
      ctx.stroke();
    }
    // Add noise (CT texture)
    for (var n = 0; n < 6000; n++) {
      var x = Math.random() * width;
      var y = Math.random() * height;
      var insideBody = ((x - cx) / torsoRx) ** 2 + ((y - cy) / torsoRy) ** 2 < 1;
      if (insideBody) {
        var noise = Math.random() * 20 - 10;
        ctx.fillStyle = 'rgba(' + (40 + noise) + ',' + (35 + noise) + ',' + (30 + noise) + ',0.4)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return { canvas: canvas, cx: cx, cy: cy, torsoRx: torsoRx, torsoRy: torsoRy };
  }

  // ---- Component constructor ----
  function MedicalImagingViewer(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.organs = this.opts.organs || ORGAN_KEYS;
    this.currentSlice = 0;
    this.totalSlices = 60;
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.sweepProgress = 0;  // 0..1 across organs
    this.activeOrgan = null;  // highlighted organ
    this.build();
  }

  MedicalImagingViewer.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = ''
      + '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🏥 Multi-Organ Imaging Lab</span>'
      + '<span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 39</span></div>'
      + '<div style="display: flex; gap: 6px; flex-wrap: wrap;">'
      + '<button class="med-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play sweep</button>'
      + '<button class="med-pause" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">⏸</button>'
      + '<button class="med-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">↺ Replay</button>'
      + '</div>';
    card.appendChild(header);

    // Main grid: 1 central minimised + 6 peripheral emphasis
    var grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto; gap: 12px; position: relative;';
    // 6 peripheral slices in a 3x2 grid (each large, ~280px square)
    var modalities = [
      { label: 'CT axial — lung window', mod: 'ct', w: 'lung' },
      { label: 'MRI T1 — axial', mod: 'mri-t1', w: 'brain' },
      { label: 'MRI T2 — coronal', mod: 'mri-t2', w: 't2' },
      { label: 'X-ray — chest PA', mod: 'xray', w: 'chest' },
      { label: 'PET/CT fusion — axial', mod: 'pet-ct', w: 'pet' },
      { label: 'CT sagittal — bone window', mod: 'ct-sag', w: 'bone' },
    ];
    for (var i = 0; i < 6; i++) {
      var cell = document.createElement('div');
      cell.style.cssText = 'position: relative; aspect-ratio: 1 / 1; border-radius: 10px; overflow: hidden; background: #000; border: 1px solid rgba(139,92,246,0.2); box-shadow: 0 4px 16px rgba(0,0,0,0.4);';
      var modCanvas = document.createElement('canvas');
      modCanvas.width = 280; modCanvas.height = 280;
      modCanvas.style.cssText = 'width: 100%; height: 100%; display: block;';
      cell.appendChild(modCanvas);
      var label = document.createElement('div');
      label.style.cssText = 'position: absolute; top: 6px; left: 8px; right: 8px; font-size: 10px; color: #f3f4f6; font-family: ui-monospace, SF Mono, Menlo, monospace; text-shadow: 0 1px 3px rgba(0,0,0,1); pointer-events: none; display: flex; justify-content: space-between;';
      label.innerHTML = '<span class="mod-label">' + modalities[i].label + '</span><span class="slice-num">#1</span>';
      cell.appendChild(label);
      var organLabel = document.createElement('div');
      organLabel.className = 'organ-label';
      organLabel.style.cssText = 'position: absolute; bottom: 6px; left: 8px; font-size: 10px; font-family: ui-monospace, SF Mono, Menlo, monospace; text-shadow: 0 1px 3px rgba(0,0,0,1); pointer-events: none;';
      organLabel.textContent = '';
      cell.appendChild(organLabel);
      grid.appendChild(cell);
      this['_canvas' + i] = modCanvas;
      this['_organLabel' + i] = organLabel;
      this['_modality' + i] = modalities[i];
    }
    // Central minimised overlay (small, ~120x120 in middle of grid)
    var central = document.createElement('div');
    central.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 130px; height: 130px; border-radius: 14px; border: 2px solid rgba(139,92,246,0.7); overflow: hidden; background: #000; box-shadow: 0 0 30px rgba(139,92,246,0.5), 0 8px 24px rgba(0,0,0,0.6); z-index: 10;';
    var centralCanvas = document.createElement('canvas');
    centralCanvas.width = 130; centralCanvas.height = 130;
    centralCanvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    central.appendChild(centralCanvas);
    var centralLabel = document.createElement('div');
    centralLabel.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 6px; background: linear-gradient(180deg, transparent, rgba(0,0,0,0.9)); font-size: 9px; color: #06b6d4; font-family: ui-monospace, SF Mono, Menlo, monospace; text-align: center; pointer-events: none;';
    centralLabel.textContent = 'TotalSegmentator\n117 organs';
    central.appendChild(centralLabel);
    grid.appendChild(central);
    card.appendChild(grid);
    this.centralCanvas = centralCanvas;
    this.grid = grid;

    // Organ legend
    var legend = document.createElement('div');
    legend.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; padding: 12px; background: rgba(11,15,26,0.6); border-radius: 10px; border: 1px solid var(--border, #1f2937);';
    legend.innerHTML = '<div style="font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.08em; width: 100%; margin-bottom: 4px;">Segmented organs (click to highlight in the slices)</div>';
    this.organs.forEach(function (key) {
      var chip = document.createElement('button');
      chip.dataset.organ = key;
      chip.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 9999px; background: rgba(11,15,26,0.6); border: 1px solid ' + (ORGAN_COLORS[key] || ORGAN_COLORS.default) + '; color: ' + (ORGAN_COLORS[key] || ORGAN_COLORS.default) + '; font-size: 11px; cursor: pointer; font-family: ui-monospace, SF Mono, Menlo, monospace;';
      chip.innerHTML = '<span style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background: ' + (ORGAN_COLORS[key] || ORGAN_COLORS.default) + '; box-shadow: 0 0 6px ' + (ORGAN_COLORS[key] || ORGAN_COLORS.default) + ';"></span>' + (ORGAN_LABELS[key] || key);
      chip.addEventListener('click', function () {
        self.activeOrgan = self.activeOrgan === key ? null : key;
        self.render();
      });
      legend.appendChild(chip);
    });
    card.appendChild(legend);

    // Reference + content (TotalSegmentator + AI medical imaging ecosystem)
    var content = document.createElement('div');
    content.style.cssText = 'margin-top: 16px; padding: 16px; background: rgba(11,15,26,0.6); border-radius: 10px; border: 1px solid var(--border, #1f2937); font-size: 12px; line-height: 1.6;';
    content.innerHTML = ''
      + '<h3 style="margin: 0 0 8px; font-size: 13px; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.08em;">AI Medical Imaging — recent research & tooling</h3>'
      + '<p style="margin: 0 0 8px; color: #f3f4f6;">The field of AI-driven medical-imaging segmentation has converged on a small set of general-purpose foundation models that surpass task-specific architectures. The LinkedIn TotalSegmentator post highlights the clinical impact: <strong>117 organs in 6 seconds</strong> on a single CT scan, freeing radiologists from manual contouring for radiotherapy planning, surgical navigation, and longitudinal studies.</p>'
      + '<ul style="margin: 0 0 8px; padding-left: 18px; color: #9ca3af; font-size: 11px;">'
      + '<li><strong style="color:#06b6d4;">TotalSegmentator</strong> (Wass et al. 2023, Radiology): nnU-Net-based, 117 organs, 6 s/CT, MIT licence.</li>'
      + '<li><strong style="color:#06b6d4;">nnU-Net</strong> (Isensee et al. 2021, Nature Methods): self-configuring pipeline; still the SOTA backbone for medical imaging.</li>'
      + '<li><strong style="color:#06b6d4;">SAM-Med2D</strong> (Cheng et al. 2023): Segment Anything Model fine-tuned for 2D medical imaging (X-ray, MRI).</li>'
      + '<li><strong style="color:#06b6d4;">MedSAM</strong> (Ma et al. 2024, Nature Communications): 1.5M-image SAM fine-tune; generalist medical SAM.</li>'
      + '<li><strong style="color:#06b6d4;">BiomedCLIP</strong> (Zhang et al. 2024): CLIP for medical image-text retrieval; pubmed-central pretrained.</li>'
      + '<li><strong style="color:#06b6d4;">MAISI</strong> (NVIDIA 2024): latent diffusion for synthetic CT/MRI generation + segmentor bootstrap.</li>'
      + '</ul>'
      + '<p style="margin: 0; color: #6b7280; font-size: 11px;">Pure client-side demo — all slices are procedurally generated. For real patient CT/MRI use the open-source TotalSegmentator (Apache 2.0) via the AIHPC Connector.</p>';
    card.appendChild(content);

    c.appendChild(card);

    // Wire controls
    header.querySelector('.med-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.med-pause').addEventListener('click', function () { self.pause(); });
    header.querySelector('.med-replay').addEventListener('click', function () { self.replay(); });

    // Initial render
    this.render();
  };

  // ---- Render loop ----
  MedicalImagingViewer.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      // Sweep progress 0→1 every 6 seconds, then loop
      self.sweepProgress = (self.sweepProgress + dt / 6) % 1;
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  MedicalImagingViewer.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  };

  MedicalImagingViewer.prototype.replay = function () {
    this.sweepProgress = 0;
    this.play();
  };

  MedicalImagingViewer.prototype.render = function () {
    var activeOrganIdx = Math.floor(this.sweepProgress * this.organs.length);
    var activeOrgan = this.organs[Math.min(activeOrganIdx, this.organs.length - 1)];
    if (this.activeOrgan) activeOrgan = this.activeOrgan;  // user override

    // Render the 6 peripheral slices
    for (var i = 0; i < 6; i++) {
      var canvas = this['_canvas' + i];
      var ctx = canvas.getContext('2d');
      var mod = this['_modality' + i];
      this.renderPeripheralSlice(ctx, canvas.width, canvas.height, mod, i, activeOrgan);
      // Update organ label
      var ol = this['_organLabel' + i];
      if (activeOrgan) {
        ol.textContent = '◆ ' + (ORGAN_LABELS[activeOrgan] || activeOrgan);
        ol.style.color = ORGAN_COLORS[activeOrgan] || ORGAN_COLORS.default;
      } else {
        ol.textContent = '';
      }
    }
    // Render central minimised thumbnail
    this.renderCentralSlice(this.centralCanvas.getContext('2d'), this.centralCanvas.width, this.centralCanvas.height, activeOrgan);
  };

  // ---- Per-slice rendering ----------------------------------------------------
  MedicalImagingViewer.prototype.renderPeripheralSlice = function (ctx, W, H, mod, sliceIdx, activeOrgan) {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;

    // ---- 1. Modality-specific background ----
    if (mod.mod === 'ct') {
      this.drawCTBackground(ctx, W, H, cx, cy, mod.w);
    } else if (mod.mod === 'mri-t1' || mod.mod === 'mri-t2') {
      this.drawMRIBackground(ctx, W, H, cx, cy, mod.mod);
    } else if (mod.mod === 'xray') {
      this.drawXrayBackground(ctx, W, H, cx, cy);
    } else if (mod.mod === 'pet-ct') {
      this.drawCTBackground(ctx, W, H, cx, cy, mod.w);
      this.drawPETOverlay(ctx, W, H, cx, cy);
    } else if (mod.mod === 'ct-sag') {
      this.drawCTSagittalBackground(ctx, W, H, cx, cy);
    }

    // ---- 2. Scanner sweep line (animated) ----
    var sweepX = this.sweepProgress * W;
    ctx.strokeStyle = 'rgba(6,182,212,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sweepX, 0);
    ctx.lineTo(sweepX, H);
    ctx.stroke();
    ctx.fillStyle = 'rgba(6,182,212,0.15)';
    ctx.fillRect(0, 0, sweepX, H);

    // ---- 3. Organ masks (fill in only those swept past) ----
    var organsRevealed = Math.floor(this.sweepProgress * this.organs.length);
    for (var o = 0; o < organsRevealed && o < this.organs.length; o++) {
      var key = this.organs[o];
      var organColor = ORGAN_COLORS[key] || ORGAN_COLORS.default;
      var isActive = key === activeOrgan;
      this.drawOrganMask(ctx, W, H, cx, cy, key, organColor, isActive, mod);
    }
    // Also draw the active (user-highlighted) organ even if not yet swept
    if (this.activeOrgan && organsRevealed < this.organs.length) {
      var key = this.activeOrgan;
      this.drawOrganMask(ctx, W, H, cx, cy, key, ORGAN_COLORS[key] || ORGAN_COLORS.default, true, mod);
    }

    // ---- 4. Crosshair (DICOM viewer chrome) ----
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.stroke();
    // Corner brackets (DICOM viewport chrome)
    ctx.strokeStyle = 'rgba(6,182,212,0.4)';
    ctx.lineWidth = 1;
    var b = 12;
    [[0,0],[W,0],[0,H],[W,H]].forEach(function (p) {
      ctx.beginPath();
      var x = p[0], y = p[1];
      var sx = x === 0 ? 1 : -1;
      var sy = y === 0 ? 1 : -1;
      ctx.moveTo(x + sx * b, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * b);
      ctx.stroke();
    });

    // ---- 5. Modality tag in bottom-right ----
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px ui-monospace, SF Mono, Menlo, monospace';
    ctx.fillText(mod.mod.toUpperCase() + ' · W:' + (mod.w || '?'), 8, H - 8);
  };

  MedicalImagingViewer.prototype.drawCTBackground = function (ctx, W, H, cx, cy, window) {
    // Body outline (elliptical axial torso)
    var torsoRx = W * 0.40, torsoRy = H * 0.38;
    var bodyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, torsoRx);
    bodyGrad.addColorStop(0, '#3a3530');
    bodyGrad.addColorStop(0.5, '#2a2520');
    bodyGrad.addColorStop(1, '#1a1510');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, torsoRx, torsoRy, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Spine
    ctx.fillStyle = '#e0d8c8';
    ctx.beginPath();
    ctx.arc(cx, cy + torsoRy * 0.55, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#1a1510';
    ctx.beginPath();
    ctx.arc(cx, cy + torsoRy * 0.55, 6, 0, 2 * Math.PI);
    ctx.fill();
    // Ribs (curving from spine)
    ctx.strokeStyle = '#d4cbb5';
    ctx.lineWidth = 2;
    for (var i = -3; i <= 3; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      ctx.arc(cx, cy + torsoRy * 0.55, 75 + Math.abs(i) * 12, Math.PI + i * 0.2, Math.PI + i * 0.2 + 0.7);
      ctx.stroke();
    }
    // Window-specific HU mapping
    if (window === 'lung') {
      // Brighter lung field
      ctx.fillStyle = 'rgba(20,20,15,0.5)';
      ctx.beginPath();
      ctx.ellipse(cx - torsoRx * 0.45, cy - torsoRy * 0.1, torsoRx * 0.30, torsoRy * 0.40, 0, 0, 2 * Math.PI);
      ctx.ellipse(cx + torsoRx * 0.45, cy - torsoRy * 0.1, torsoRx * 0.30, torsoRy * 0.40, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    // Noise
    for (var n = 0; n < 4000; n++) {
      var x = Math.random() * W;
      var y = Math.random() * H;
      var insideBody = ((x - cx) / torsoRx) ** 2 + ((y - cy) / torsoRy) ** 2 < 1;
      if (insideBody) {
        var noise = Math.random() * 20 - 10;
        ctx.fillStyle = 'rgba(' + (40 + noise) + ',' + (35 + noise) + ',' + (30 + noise) + ',0.4)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  MedicalImagingViewer.prototype.drawMRIBackground = function (ctx, W, H, cx, cy, mod) {
    // Brain axial view
    var r = W * 0.36;
    var brainGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    if (mod === 'mri-t1') {
      brainGrad.addColorStop(0, '#5a5540');  // grey matter
      brainGrad.addColorStop(0.7, '#9a9080'); // white matter
      brainGrad.addColorStop(1, '#2a2520');
    } else {  // mri-t2
      brainGrad.addColorStop(0, '#c4baa0');
      brainGrad.addColorStop(0.6, '#6a6560');
      brainGrad.addColorStop(1, '#1a1510');
    }
    ctx.fillStyle = brainGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Ventricles (dark CSF)
    ctx.fillStyle = mod === 'mri-t1' ? '#1a1510' : '#e0d8c8';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.18, r * 0.28, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.25, cy, r * 0.10, r * 0.18, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.25, cy, r * 0.10, r * 0.18, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Sulci/gyri noise
    for (var n = 0; n < 5000; n++) {
      var a = Math.random() * 2 * Math.PI;
      var d = Math.random() * r * 0.95;
      var x = cx + d * Math.cos(a);
      var y = cy + d * Math.sin(a) * 0.85;
      var noise = Math.random() * 30 - 15;
      ctx.fillStyle = 'rgba(' + (100 + noise) + ',' + (90 + noise) + ',' + (70 + noise) + ',0.3)';
      ctx.fillRect(x, y, 1, 1);
    }
  };

  MedicalImagingViewer.prototype.drawXrayBackground = function (ctx, W, H, cx, cy) {
    // Chest X-ray PA view
    var thoraxGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.45);
    thoraxGrad.addColorStop(0, '#0a0a0a');
    thoraxGrad.addColorStop(0.5, '#1a1a1a');
    thoraxGrad.addColorStop(1, '#000');
    ctx.fillStyle = thoraxGrad;
    ctx.fillRect(0, 0, W, H);
    // Lung fields (dark)
    ctx.fillStyle = 'rgba(15,15,15,1)';
    ctx.beginPath();
    ctx.ellipse(cx - W * 0.18, cy - H * 0.05, W * 0.15, H * 0.30, -0.1, 0, 2 * Math.PI);
    ctx.ellipse(cx + W * 0.18, cy - H * 0.05, W * 0.15, H * 0.30, 0.1, 0, 2 * Math.PI);
    ctx.fill();
    // Ribs (curving)
    ctx.strokeStyle = 'rgba(200,200,200,0.4)';
    ctx.lineWidth = 1.5;
    for (var i = -4; i <= 4; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      ctx.ellipse(cx, cy + i * 18, W * 0.32, H * 0.025, 0, 0, Math.PI);
      ctx.stroke();
    }
    // Spine (vertical bright line)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.stroke();
    // Heart shadow
    ctx.fillStyle = 'rgba(20,15,15,0.9)';
    ctx.beginPath();
    ctx.ellipse(cx - W * 0.05, cy + H * 0.05, W * 0.10, H * 0.13, 0, 0, 2 * Math.PI);
    ctx.fill();
  };

  MedicalImagingViewer.prototype.drawPETOverlay = function (ctx, W, H, cx, cy) {
    // Hot spots (warm gradient)
    for (var i = 0; i < 8; i++) {
      var x = cx + (Math.random() - 0.5) * W * 0.5;
      var y = cy + (Math.random() - 0.5) * H * 0.5;
      var r = 8 + Math.random() * 12;
      var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,180,80,0.9)');
      grad.addColorStop(0.5, 'rgba(255,80,40,0.5)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  MedicalImagingViewer.prototype.drawCTSagittalBackground = function (ctx, W, H, cx, cy) {
    // Sagittal CT — bone window. Shows spine profile + skull base.
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#3a3530');
    grad.addColorStop(0.4, '#2a2520');
    grad.addColorStop(1, '#1a1510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Spine (vertebra stack)
    ctx.fillStyle = '#e0d8c8';
    for (var i = 0; i < 12; i++) {
      var vy = H * 0.3 + i * (H * 0.05);
      ctx.beginPath();
      ctx.ellipse(W * 0.6, vy, 14, 10, 0, 0, 2 * Math.PI);
      ctx.fill();
      // Disc
      ctx.fillStyle = '#2a2520';
      ctx.fillRect(W * 0.6 - 12, vy + 8, 24, 4);
      ctx.fillStyle = '#e0d8c8';
    }
    // Skull base (top)
    ctx.beginPath();
    ctx.ellipse(W * 0.55, H * 0.18, 40, 30, 0, 0, Math.PI);
    ctx.fill();
  };

  // ---- Organ masks (where each organ appears on each slice) ----
  MedicalImagingViewer.prototype.drawOrganMask = function (ctx, W, H, cx, cy, key, color, isActive, mod) {
    var torsoRx = W * 0.40, torsoRy = H * 0.38;
    ctx.save();
    if (isActive) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = color + (isActive ? '99' : '55');
    ctx.strokeStyle = color;
    ctx.lineWidth = isActive ? 2 : 0.8;

    // Each organ is drawn at its typical anatomical location for the modality
    if (key === 'lung' && (mod.mod === 'ct' || mod.mod === 'xray' || mod.mod === 'pet-ct')) {
      // Lung fields
      ctx.beginPath();
      ctx.ellipse(cx - torsoRx * 0.45, cy - torsoRy * 0.15, torsoRx * 0.30, torsoRy * 0.40, -0.1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + torsoRx * 0.45, cy - torsoRy * 0.15, torsoRx * 0.30, torsoRy * 0.40, 0.1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (key === 'heart' && (mod.mod === 'ct' || mod.mod === 'xray')) {
      // Heart between lungs, slightly left
      ctx.beginPath();
      ctx.ellipse(cx - torsoRx * 0.15, cy - torsoRy * 0.05, torsoRx * 0.20, torsoRy * 0.25, -0.2, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    } else if (key === 'liver' && mod.mod === 'ct') {
      // Liver: large right-side organ
      ctx.beginPath();
      ctx.ellipse(cx + torsoRx * 0.25, cy + torsoRy * 0.10, torsoRx * 0.32, torsoRy * 0.22, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    } else if (key === 'kidney-left' && mod.mod === 'ct') {
      ctx.beginPath();
      ctx.ellipse(cx - torsoRx * 0.30, cy + torsoRy * 0.25, torsoRx * 0.10, torsoRy * 0.13, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    } else if (key === 'kidney-right' && mod.mod === 'ct') {
      ctx.beginPath();
      ctx.ellipse(cx + torsoRx * 0.30, cy + torsoRy * 0.25, torsoRx * 0.10, torsoRy * 0.13, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    } else if (key === 'spleen' && mod.mod === 'ct') {
      ctx.beginPath();
      ctx.ellipse(cx - torsoRx * 0.35, cy + torsoRy * 0.10, torsoRx * 0.10, torsoRy * 0.13, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    } else if (key === 'bladder' && mod.mod === 'ct') {
      ctx.beginPath();
      ctx.ellipse(cx, cy + torsoRy * 0.55, torsoRx * 0.15, torsoRy * 0.10, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    } else if (key === 'bone') {
      // Highlight spine + ribs (existing drawn in background)
      ctx.strokeStyle = color + (isActive ? 'cc' : '88');
      ctx.lineWidth = isActive ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy + torsoRy * 0.55, 14, 0, 2 * Math.PI);
      ctx.stroke();
      for (var i = -3; i <= 3; i++) {
        if (i === 0) continue;
        ctx.beginPath();
        ctx.arc(cx, cy + torsoRy * 0.55, 75 + Math.abs(i) * 12, Math.PI + i * 0.2, Math.PI + i * 0.2 + 0.7);
        ctx.stroke();
      }
    } else if (key === 'brain' && (mod.mod === 'mri-t1' || mod.mod === 'mri-t2')) {
      var r = W * 0.36;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  MedicalImagingViewer.prototype.renderCentralSlice = function (ctx, W, H, activeOrgan) {
    // Minimised central thumbnail showing the active organ + colour
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    // Background mini-CT
    var cx = W / 2, cy = H / 2;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.4);
    grad.addColorStop(0, '#3a3530');
    grad.addColorStop(1, '#1a1510');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, W * 0.4, H * 0.38, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Show active organ in a glowing mini-circle
    if (activeOrgan) {
      var color = ORGAN_COLORS[activeOrgan] || ORGAN_COLORS.default;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = color + 'aa';
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px ui-monospace, SF Mono, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ORGAN_LABELS[activeOrgan] || activeOrgan, cx, cy + 3);
      ctx.textAlign = 'left';
    }
    // Slice number indicator (DICOM-style)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '9px ui-monospace';
    ctx.fillText('SL ' + (Math.floor(this.sweepProgress * 60) + 1).toString().padStart(2, '0') + '/60', 4, 10);
  };

  // ---- Public API ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new MedicalImagingViewer(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  global.AIHPC_MEDIMG = {
    mount: mount,
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    replay: function (id) { var c = INSTANCES[id]; if (c) c.replay(); },
    setOrgan: function (id, organ) { var c = INSTANCES[id]; if (c) { c.activeOrgan = organ; c.render(); } },
    _instances: INSTANCES,
    _organColors: ORGAN_COLORS,
  };
})(typeof window !== 'undefined' ? window : this);

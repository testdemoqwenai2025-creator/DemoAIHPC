/**
 * segmentation-pipeline.js — Phase 43 medical image segmentation pipeline.
 *
 * Visualises the full medical-image-segmentation pipeline that the
 * LinkedIn infographic describes: MRI/CT input → AI prediction mask →
 * 3D reconstruction → quantitative measurements (Dice, IoU, tumour
 * volume). The viewer mimics the workflow of clinical AI tools like
 * nnU-Net, MedSAM, TotalSegmentator.
 *
 * Layout (three columns + bottom metrics):
 *   Left   : raw MRI slice (procedurally generated — brain axial view
 *            with tumour mass)
 *   Middle : prediction mask overlay (animated reveal: scanner sweeps
 *            across the slice; the AI predicts the tumour boundary;
 *            shows the AI's confidence as a heat-map under the mask)
 *   Right  : 3D reconstruction (stacked slices, slowly rotating; the
 *            tumour appears as a 3D volume once the mask is complete)
 *   Bottom : live metrics — Dice coefficient, IoU, tumour volume (cm³),
 *            Hausdorff distance (mm), sensitivity, specificity
 *
 * Pure client-side. All slices are procedural (no real patient data).
 *
 * Public API (window.AIHPC_SEG):
 *   mount(containerId, opts)         — mount
 *   play(id) / pause(id) / replay(id) — control the scanner sweep
 */
(function (global) {
  'use strict';

  // ---- Procedural MRI slice (axial brain view with optional tumour) ----
  function generateMRISlice(width, height, sliceIdx, totalSlices, tumourPos, tumourR) {
    // Returns { imageData (canvas), groundTruthMask: Uint8Array(width*height) }
    // 1 = tumour, 2 = oedema, 0 = background
    var canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    var ctx = canvas.getContext('2d');
    var cx = width / 2, cy = height / 2;
    // Brain outline (elliptical axial view)
    var brainRx = width * 0.40, brainRy = height * 0.42;
    var brainGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, brainRx);
    brainGrad.addColorStop(0, '#5a5540');  // grey matter
    brainGrad.addColorStop(0.7, '#9a9080'); // white matter
    brainGrad.addColorStop(1, '#2a2520');
    ctx.fillStyle = brainGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, brainRx, brainRy, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Ventricles (CSF, dark)
    ctx.fillStyle = '#1a1510';
    ctx.beginPath();
    ctx.ellipse(cx, cy, brainRx * 0.15, brainRy * 0.25, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - brainRx * 0.22, cy, brainRx * 0.09, brainRy * 0.18, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + brainRx * 0.22, cy, brainRx * 0.09, brainRy * 0.18, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Sulci/gyri noise
    for (var i = 0; i < 4000; i++) {
      var a = Math.random() * 2 * Math.PI;
      var d = Math.random() * brainRx * 0.95;
      var x = cx + d * Math.cos(a);
      var y = cy + d * Math.sin(a) * (brainRy / brainRx);
      var noise = Math.random() * 30 - 15;
      ctx.fillStyle = 'rgba(' + (100 + noise) + ',' + (90 + noise) + ',' + (70 + noise) + ',0.3)';
      ctx.fillRect(x, y, 1, 1);
    }
    // Build the ground-truth mask
    var mask = new Uint8Array(width * height);
    // Tumour: a circular blob at tumourPos, radius tumourR
    // Oedema: a slightly larger ring around the tumour
    for (var py = 0; py < height; py++) {
      for (var px = 0; px < width; px++) {
        var dx = px - tumourPos.x;
        var dy = py - tumourPos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var idx = py * width + px;
        if (dist < tumourR) mask[idx] = 1;  // tumour
        else if (dist < tumourR * 1.4) mask[idx] = 2;  // oedema
      }
    }
    return { canvas: canvas, mask: mask, brainRx: brainRx, brainRy: brainRy };
  }

  // ---- Component ----
  function SegmentationPipeline(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.totalSlices = 24;
    this.currentSlice = 12;
    this.sweepProgress = 0;  // 0..1, scanner sweep
    this.playing = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.tumourR = 18;
    this.tumourPos = { x: 0, y: 0 };
    this.slices = [];  // pre-generated
    this.build();
  }

  SegmentationPipeline.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5);';
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = ''
      + '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🔬 Medical Image Segmentation Pipeline</span>'
      + '<span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 43 · MRI → mask → 3D</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="seg-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play sweep</button>'
      + '<button class="seg-pause" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">⏸</button>'
      + '<button class="seg-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">↺ Replay</button>'
      + '</div>';
    card.appendChild(header);

    // 3-column layout
    var grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;';
    // Column 1: raw MRI
    var col1 = document.createElement('div');
    col1.style.cssText = 'position: relative; aspect-ratio: 1/1; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid var(--border, #1f2937);';
    col1.innerHTML = '<div style="position: absolute; top: 6px; left: 8px; right: 8px; font-size: 10px; color: #06b6d4; font-family: ui-monospace; text-shadow: 0 1px 3px rgba(0,0,0,1); display: flex; justify-content: space-between;"><span>Raw MRI T1c</span><span class="seg-slice-label">#12</span></div>';
    var c1 = document.createElement('canvas'); c1.width = 240; c1.height = 240; c1.style.cssText = 'width: 100%; height: 100%; display: block;'; col1.appendChild(c1);
    grid.appendChild(col1);
    // Column 2: prediction mask overlay
    var col2 = document.createElement('div');
    col2.style.cssText = 'position: relative; aspect-ratio: 1/1; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid var(--border, #1f2937);';
    col2.innerHTML = '<div style="position: absolute; top: 6px; left: 8px; right: 8px; font-size: 10px; color: #06b6d4; font-family: ui-monospace; text-shadow: 0 1px 3px rgba(0,0,0,1); display: flex; justify-content: space-between;"><span>AI Prediction mask</span><span class="seg-confidence">conf: —</span></div>';
    var c2 = document.createElement('canvas'); c2.width = 240; c2.height = 240; c2.style.cssText = 'width: 100%; height: 100%; display: block;'; col2.appendChild(c2);
    grid.appendChild(col2);
    // Column 3: 3D reconstruction
    var col3 = document.createElement('div');
    col3.style.cssText = 'position: relative; aspect-ratio: 1/1; border-radius: 10px; overflow: hidden; background: #0a0e1a; border: 1px solid var(--border, #1f2937);';
    col3.innerHTML = '<div style="position: absolute; top: 6px; left: 8px; right: 8px; font-size: 10px; color: #06b6d4; font-family: ui-monospace; text-shadow: 0 1px 3px rgba(0,0,0,1); display: flex; justify-content: space-between;"><span>3D Reconstruction</span><span class="seg-volume-label">vol: —</span></div>';
    var c3 = document.createElement('canvas'); c3.width = 240; c3.height = 240; c3.style.cssText = 'width: 100%; height: 100%; display: block;'; col3.appendChild(c3);
    grid.appendChild(col3);
    card.appendChild(grid);

    // Bottom metrics bar
    var metrics = document.createElement('div');
    metrics.style.cssText = 'margin-top: 12px; padding: 12px; background: rgba(11,15,26,0.7); border-radius: 8px; border: 1px solid var(--border, #1f2937); display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; font-family: ui-monospace; font-size: 11px;';
    metrics.innerHTML = ''
      + '<div><div style="color: var(--text-muted-2, #6b7280); font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Dice</div><div class="seg-m-dice" style="color: #06b6d4; font-weight: 700; font-size: 16px;">—</div></div>'
      + '<div><div style="color: var(--text-muted-2, #6b7280); font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">IoU</div><div class="seg-m-iou" style="color: #10b981; font-weight: 700; font-size: 16px;">—</div></div>'
      + '<div><div style="color: var(--text-muted-2, #6b7280); font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Volume</div><div class="seg-m-vol" style="color: #f59e0b; font-weight: 700; font-size: 16px;">—</div></div>'
      + '<div><div style="color: var(--text-muted-2, #6b7280); font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Hausdorff</div><div class="seg-m-hd" style="color: #ec4899; font-weight: 700; font-size: 16px;">—</div></div>'
      + '<div><div style="color: var(--text-muted-2, #6b7280); font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Sensitivity</div><div class="seg-m-sens" style="color: #8b5cf6; font-weight: 700; font-size: 16px;">—</div></div>'
      + '<div><div style="color: var(--text-muted-2, #6b7280); font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Specificity</div><div class="seg-m-spec" style="color: #22d3ee; font-weight: 700; font-size: 16px;">—</div></div>';
    card.appendChild(metrics);

    // Status
    var status = document.createElement('div');
    status.className = 'seg-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px;';
    card.appendChild(status);

    c.appendChild(card);

    this.canvas1 = c1; this.ctx1 = c1.getContext('2d');
    this.canvas2 = c2; this.ctx2 = c2.getContext('2d');
    this.canvas3 = c3; this.ctx3 = c3.getContext('2d');
    this.sliceLabelEl = col1.querySelector('.seg-slice-label');
    this.confidenceEl = col2.querySelector('.seg-confidence');
    this.volumeLabelEl = col3.querySelector('.seg-volume-label');
    this.diceEl = metrics.querySelector('.seg-m-dice');
    this.iouEl = metrics.querySelector('.seg-m-iou');
    this.volEl = metrics.querySelector('.seg-m-vol');
    this.hdEl = metrics.querySelector('.seg-m-hd');
    this.sensEl = metrics.querySelector('.seg-m-sens');
    this.specEl = metrics.querySelector('.seg-m-spec');
    this.statusEl = status;

    // Wire controls
    header.querySelector('.seg-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.seg-pause').addEventListener('click', function () { self.pause(); });
    header.querySelector('.seg-replay').addEventListener('click', function () { self.replay(); });

    // Pre-generate slices
    this.preGenerateSlices();
    this.render();
  };

  SegmentationPipeline.prototype.preGenerateSlices = function () {
    // Generate 24 axial MRI slices with a tumour that grows from slice 8 to slice 20
    var W = 240, H = 240;
    this.slices = [];
    for (var s = 0; s < this.totalSlices; s++) {
      // Tumour radius: peaks at slice 14, grows + shrinks
      var sliceT = (s - 8) / (20 - 8);  // 0..1 across the tumour range
      var r = 0;
      if (s >= 8 && s <= 20) {
        // Gaussian-ish profile
        r = 8 + 14 * Math.sin(Math.PI * sliceT);
      }
      // Tumour position shifts slightly per slice (3D shape)
      var px = W / 2 + Math.sin(s * 0.3) * 8;
      var py = H / 2 - 12 + Math.cos(s * 0.2) * 4;
      var gen = generateMRISlice(W, H, s, this.totalSlices, { x: px, y: py }, Math.max(0, r));
      this.slices.push({
        canvas: gen.canvas,
        mask: gen.mask,
        tumourR: r,
        tumourPos: { x: px, y: py },
      });
    }
  };

  SegmentationPipeline.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      // Sweep: scanner passes through slices in 6 seconds
      self.sweepProgress = (self.sweepProgress + dt / 6) % 1;
      self.currentSlice = Math.floor(self.sweepProgress * self.totalSlices);
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  SegmentationPipeline.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  };

  SegmentationPipeline.prototype.replay = function () {
    this.sweepProgress = 0;
    this.currentSlice = 0;
    this.play();
  };

  SegmentationPipeline.prototype.render = function () {
    var slice = this.slices[this.currentSlice];
    if (!slice) return;
    // ---- Column 1: raw MRI ----
    this.ctx1.clearRect(0, 0, this.canvas1.width, this.canvas1.height);
    this.ctx1.drawImage(slice.canvas, 0, 0);
    // DICOM-style crosshair
    this.ctx1.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx1.lineWidth = 0.5;
    var c1W = this.canvas1.width, c1H = this.canvas1.height;
    this.ctx1.beginPath();
    this.ctx1.moveTo(0, c1H / 2); this.ctx1.lineTo(c1W, c1H / 2);
    this.ctx1.moveTo(c1W / 2, 0); this.ctx1.lineTo(c1W / 2, c1H);
    this.ctx1.stroke();
    if (this.sliceLabelEl) this.sliceLabelEl.textContent = '#' + (this.currentSlice + 1) + '/' + this.totalSlices;

    // ---- Column 2: prediction mask overlay ----
    var ctx2 = this.ctx2;
    var W2 = this.canvas2.width, H2 = this.canvas2.height;
    ctx2.fillStyle = '#0a0e1a';
    ctx2.fillRect(0, 0, W2, H2);
    // Draw the raw MRI as a darker base
    ctx2.globalAlpha = 0.6;
    ctx2.drawImage(slice.canvas, 0, 0, W2, H2);
    ctx2.globalAlpha = 1;
    // AI-predicted mask — animated by sweepProgress * mask fraction revealed
    var revealFraction = this.sweepProgress;  // 0..1 of pixels revealed (scanner sweep)
    var predictedMask = slice.mask;
    // Confidence: starts low (0.5) and grows to 0.94
    var confidence = 0.5 + 0.44 * Math.min(1, this.sweepProgress * 1.5);
    // Draw mask as coloured overlay
    var maskImg = ctx2.createImageData(W2, H2);
    // Scale the mask (240x240) to the canvas size
    for (var py = 0; py < H2; py++) {
      for (var px = 0; px < W2; px++) {
        // Sample the original mask at the same coords (240x240)
        var mx = px;  // canvas is 240 too
        var my = py;
        var mIdx = my * 240 + mx;
        var mVal = predictedMask[mIdx] || 0;
        var outIdx = (py * W2 + px) * 4;
        // Reveal only the leftmost revealFraction
        var xProgress = px / W2;
        if (xProgress > revealFraction) continue;  // not yet revealed
        if (mVal === 1) {
          // Tumour core: red
          maskImg.data[outIdx] = 239; maskImg.data[outIdx + 1] = 68; maskImg.data[outIdx + 2] = 68;
          maskImg.data[outIdx + 3] = 180;  // alpha
        } else if (mVal === 2) {
          // Oedema: amber
          maskImg.data[outIdx] = 245; maskImg.data[outIdx + 1] = 158; maskImg.data[outIdx + 2] = 11;
          maskImg.data[outIdx + 3] = 100;
        } else {
          continue;  // transparent
        }
      }
    }
    ctx2.putImageData(maskImg, 0, 0);
    // Scanner sweep line
    var sweepX = revealFraction * W2;
    ctx2.strokeStyle = '#06b6d4';
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    ctx2.moveTo(sweepX, 0); ctx2.lineTo(sweepX, H2);
    ctx2.stroke();
    ctx2.fillStyle = 'rgba(6,182,212,0.15)';
    ctx2.fillRect(0, 0, sweepX, H2);
    // Confidence label
    if (this.confidenceEl) this.confidenceEl.textContent = 'conf: ' + confidence.toFixed(2);

    // ---- Column 3: 3D reconstruction ----
    var ctx3 = this.ctx3;
    var W3 = this.canvas3.width, H3 = this.canvas3.height;
    ctx3.fillStyle = '#0a0e1a';
    ctx3.fillRect(0, 0, W3, H3);
    // Starfield
    if (!this._stars3) {
      this._stars3 = [];
      for (var i = 0; i < 30; i++) this._stars3.push({ x: Math.random() * W3, y: Math.random() * H3, r: Math.random() * 1.0 + 0.3, a: Math.random() * 0.4 + 0.3 });
    }
    var tNow = performance.now() / 1000;
    for (var si = 0; si < this._stars3.length; si++) {
      var st = this._stars3[si];
      ctx3.fillStyle = 'rgba(255,255,255,' + (st.a * (0.7 + 0.3 * Math.sin(tNow * 2 + si))).toFixed(3) + ')';
      ctx3.beginPath(); ctx3.arc(st.x, st.y, st.r, 0, 2 * Math.PI); ctx3.fill();
    }
    // 3D reconstruction: stacked tumour slices, rotating around Y axis
    var yaw = tNow * 0.5;
    var cx3 = W3 / 2, cy3 = H3 / 2;
    var scale3 = 80;
    var totalTumourVol = 0;  // voxels
    for (var sl = 0; sl < this.totalSlices; sl++) {
      var sliceData = this.slices[sl];
      var r = sliceData.tumourR;
      if (r < 1) continue;
      // Each slice contributes a disc of area π·r²; stack at z = (sl - totalSlices/2) * 4
      var z = (sl - this.totalSlices / 2) * 3;
      // Apply yaw rotation: x' = x·cos(yaw) + z·sin(yaw), z' = -x·sin(yaw) + z·cos(yaw)
      var xr = 0 * Math.cos(yaw) + z * Math.sin(yaw);
      var zr = -0 * Math.sin(yaw) + z * Math.cos(yaw);
      // Project to screen: y_screen = cy3 + zr * 0.5 (perspective)
      var screenY = cy3 - zr * 0.5;
      // Disc ellipse (only revealed if sweepProgress passed this slice)
      if (sl / this.totalSlices > this.sweepProgress) continue;
      // Colour: red gradient from inside
      var grad3 = ctx3.createRadialGradient(cx3 + xr, screenY, 0, cx3 + xr, screenY, r);
      grad3.addColorStop(0, 'rgba(239,68,68,0.8)');
      grad3.addColorStop(0.7, 'rgba(245,158,11,0.4)');
      grad3.addColorStop(1, 'rgba(0,0,0,0)');
      ctx3.fillStyle = grad3;
      ctx3.beginPath();
      ctx3.ellipse(cx3 + xr, screenY, r, r * 0.4, 0, 0, 2 * Math.PI);
      ctx3.fill();
      totalTumourVol += Math.PI * r * r * 3;  // approx volume = area × thickness
    }
    // Volume label (cm³, assuming 1 voxel = 1 mm³, then /1000 for cm³)
    var tumourVolCm3 = totalTumourVol / 1000;
    if (this.volumeLabelEl) this.volumeLabelEl.textContent = 'vol: ' + tumourVolCm3.toFixed(1) + ' cm³';

    // ---- Compute Dice / IoU / Hausdorff ----
    // For demo: predicted = ground truth scaled by confidence (i.e. some pixels missed)
    // Real implementation would compare two masks. We simulate:
    var tp = 0, fp = 0, fn = 0, tn = 0;
    var n = slice.mask.length;
    for (var i2 = 0; i2 < n; i2++) {
      var gt = slice.mask[i2] === 1 ? 1 : 0;  // tumour only
      var pred = (slice.mask[i2] === 1 && Math.random() < confidence) ? 1 : 0;
      if (gt === 1 && pred === 1) tp++;
      else if (gt === 0 && pred === 1) fp++;
      else if (gt === 1 && pred === 0) fn++;
      else tn++;
    }
    var dice = (2 * tp) / (2 * tp + fp + fn || 1);
    var iou = tp / (tp + fp + fn || 1);
    var sens = tp / (tp + fn || 1);
    var spec = tn / (tn + fp || 1);
    var hd = 8.5 - 7.0 * confidence;  // mm, decreasing with confidence

    this.diceEl.textContent = dice.toFixed(3);
    this.iouEl.textContent = iou.toFixed(3);
    this.volEl.textContent = tumourVolCm3.toFixed(1) + ' cm³';
    this.hdEl.textContent = hd.toFixed(1) + ' mm';
    this.sensEl.textContent = sens.toFixed(3);
    this.specEl.textContent = spec.toFixed(3);

    if (this.statusEl) {
      this.statusEl.textContent = 'slice #' + (this.currentSlice + 1) + '/' + this.totalSlices + ' · confidence ' + confidence.toFixed(2) + ' · Dice ' + dice.toFixed(3) + ' · IoU ' + iou.toFixed(3) + ' · Hausdorff ' + hd.toFixed(1) + 'mm · vol ' + tumourVolCm3.toFixed(1) + ' cm³';
    }
  };

  // ---- Registry + auto-mount ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new SegmentationPipeline(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  global.AIHPC_SEG = {
    mount: mount,
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    replay: function (id) { var c = INSTANCES[id]; if (c) c.replay(); },
    _instances: INSTANCES,
  };
})(typeof window !== 'undefined' ? window : this);

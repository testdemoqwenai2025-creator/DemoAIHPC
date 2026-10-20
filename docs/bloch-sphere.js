/**
 * bloch-sphere.js — Phase 37 quantum-computing shorts-clip component.
 *
 * Renders a glowing 3D Bloch sphere with a quantum state vector
 * animating through canonical scenes: ground state, Hadamard, Rabi
 * oscillation, phase gate, measurement collapse, decoherence.
 *
 * Inspired by the LinkedIn qubit-visualization post (Schrödinger
 * equation, Bloch sphere, POVM, decoherence) and rendered in the
 * AIHPC Advanced style: particle background, glassmorphism, gradient
 * glow, pure SVG + Canvas.
 *
 * Pure client-side. No external services. Vertical 9:16 "shorts
 * clip" format with Play/Pause/Replay + Record-WebM + Share.
 *
 * Public API (window.AIHPC_BLOCH):
 *   mount(containerId, opts)         — mount into a container element
 *   play() / pause() / replay()      — control
 *   record()                          — record canvas as WebM (download)
 *   seek(sceneIndex)                  — jump to a scene
 *   on(event, callback)              — subscribe to events
 *
 * Browser support: Chrome / Firefox / Safari 14+ (MediaRecorder may
 * not be available in older browsers; the record button is hidden
 * if unsupported).
 */
(function (global) {
  'use strict';

  // ---- Scenes (canonical quantum-computing narratives) ----------------
  var SCENES = [
    {
      title: 'Ground state |0⟩',
      math: '|ψ⟩ = |0⟩ = [1, 0]ᵀ',
      explain: 'The ground state of a qubit — the quantum analogue of classical 0. On the Bloch sphere, this is the north pole.',
      // State vector trajectory (theta, phi) in radians; t is normalised [0,1]
      trajectory: function (t) { return { theta: 0, phi: 0 }; },
      duration: 4,
      color: '#06b6d4',
    },
    {
      title: 'Hadamard gate',
      math: '|+⟩ = H|0⟩ = (1/√2)(|0⟩ + |1⟩)',
      explain: 'Applying the Hadamard gate creates an equal superposition. The state rotates from the north pole to the +X equator.',
      trajectory: function (t) {
        // Smoothly interpolate theta from 0 to π/2
        var theta = (Math.PI / 2) * ease(t);
        return { theta: theta, phi: 0 };
      },
      duration: 4,
      color: '#8b5cf6',
    },
    {
      title: 'Rabi oscillation',
      math: '|ψ(t)⟩ = cos(Ωt/2)|0⟩ − i sin(Ωt/2)|1⟩',
      explain: 'A resonant drive causes the state to rotate around the Y axis of the Bloch sphere at the Rabi frequency Ω. The qubit oscillates between |0⟩ and |1⟩.',
      trajectory: function (t) {
        // 2 full Rabi cycles (north → south → north → south → north)
        var theta = (Math.PI * 2 * t) % (2 * Math.PI);
        // Keep theta in [0, π] by mirroring
        if (theta > Math.PI) theta = 2 * Math.PI - theta;
        return { theta: theta, phi: Math.PI / 2 };
      },
      duration: 6,
      color: '#fbbf24',
    },
    {
      title: 'Phase gate S',
      math: 'S|+⟩ = (1/√2)(|0⟩ + i|1⟩) = |+i⟩',
      explain: 'The S gate adds a π/2 phase to |1⟩. The state rotates around the Z axis (equator of Bloch sphere) by π/2 — from +X to +Y.',
      trajectory: function (t) {
        var phi = (Math.PI / 2) * ease(t);
        return { theta: Math.PI / 2, phi: phi };
      },
      duration: 4,
      color: '#ec4899',
    },
    {
      title: 'Measurement collapse',
      math: 'P(|0⟩) = |α|², P(|1⟩) = |β|²',
      explain: 'Measurement collapses the superposition to |0⟩ (with probability |α|²) or |1⟩ (with probability |β|²). The state vector jumps to a pole.',
      trajectory: function (t) {
        // Stay in superposition, then jump to |0⟩ or |1⟩ based on a
        // deterministic pseudo-random outcome (50/50)
        if (t < 0.7) {
          // Slowly drift around the equator
          return { theta: Math.PI / 2 + 0.1 * Math.sin(t * 12), phi: t * 8 };
        }
        // Collapse to |0⟩ (chosen deterministically for repeatability)
        return { theta: 0, phi: 0 };
      },
      duration: 4,
      color: '#ef4444',
    },
    {
      title: 'Decoherence',
      math: 'ρ(t) = e^(-t/T₂) ρ(0) + (1 - e^(-t/T₂)) |0⟩⟨0|',
      explain: 'Environmental coupling causes the off-diagonal terms of the density matrix to decay exponentially with time-constant T₂. On the Bloch sphere, the state vector spirals inward to the Z axis.',
      trajectory: function (t) {
        // Spiral inward
        var theta = (Math.PI / 2) * (1 - Math.exp(-3 * t)) + (Math.PI / 2) * Math.exp(-3 * t);
        // Actually: state starts at +X (theta=π/2, phi=0) and the
        // Bloch vector shrinks toward 0 (maximally mixed state) then
        // tips up to |0⟩ due to T₁ relaxation.
        var r = Math.exp(-2 * t); // length of Bloch vector (T₂)
        var thetaFin = (Math.PI / 2) * Math.exp(-1.5 * t); // tips toward |0⟩
        var phi = t * 8;
        return { theta: thetaFin, phi: phi, r: r };
      },
      duration: 6,
      color: '#10b981',
    },
  ];

  function ease(t) {
    // Smoothstep
    return t * t * (3 - 2 * t);
  }

  // ---- Bloch-sphere geometry helpers ----
  function sphericalToCartesian(theta, phi, r) {
    if (r === undefined) r = 1;
    return {
      x: r * Math.sin(theta) * Math.cos(phi),
      y: r * Math.sin(theta) * Math.sin(phi),
      z: r * Math.cos(theta),
    };
  }

  // Rotate around Y axis (yaw) and X axis (pitch)
  function rotateYawPitch(p, yaw, pitch) {
    // Yaw around Z (in our coordinate system, Z is up; the screen-y
    // we'll compute separately). For Bloch, we treat Z = up.
    // But the standard Bloch: theta is polar angle from +Z (north pole = |0⟩).
    // We rotate around vertical (Z) by yaw, around horizontal (X) by pitch.
    var x1 = p.x * Math.cos(yaw) - p.y * Math.sin(yaw);
    var y1 = p.x * Math.sin(yaw) + p.y * Math.cos(yaw);
    var z1 = p.z;
    // Pitch around X axis
    var y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
    var z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
    return { x: x1, y: y2, z: z2 };
  }

  function project(p, cx, cy, scale) {
    // Simple orthographic projection with depth fog
    return {
      x: cx + p.x * scale,
      y: cy - p.z * scale, // invert z so +Z (north pole) is up
      depth: p.y, // y is depth (out of screen); used for alpha + line width
    };
  }

  function depthAlpha(depth) {
    // depth in [-1, 1]; back is -1, front is +1
    // Front: full alpha; back: 0.25 alpha
    return 0.25 + 0.75 * ((depth + 1) / 2);
  }

  // ---- Component constructor --------------------------------------------
  function BlochComponent(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.scenes = SCENES;
    this.currentScene = 0;
    this.playing = false;
    this.sceneStartTime = 0;
    this.rafId = null;
    this.yaw = 0;
    this.pitch = 0.45;
    this.autoRotate = true;
    this.canvas = null;
    this.ctx = null;
    this.recorder = null;
    this.chunks = [];
    this.build();
  }

  BlochComponent.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    // Outer card
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); max-width: 420px; margin: 0 auto;';
    // Header (title + scene dots)
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    header.innerHTML = ''
      + '<div style="display: flex; align-items: center; gap: 6px;">'
      + '<span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">Quantum Shorts</span>'
      + '</div>'
      + '<div class="bloch-scene-dots" style="display: flex; gap: 4px;"></div>';
    card.appendChild(header);
    // Canvas wrap (vertical 9:16)
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position: relative; width: 100%; padding-top: 177.78%; border-radius: 12px; overflow: hidden; background: radial-gradient(circle at 50% 40%, rgba(139,92,246,0.15), rgba(11,15,26,1) 70%);';
    var canvas = document.createElement('canvas');
    canvas.className = 'bloch-canvas';
    canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; display: block;';
    canvas.width = 540;  // render at high res
    canvas.height = 960;
    wrap.appendChild(canvas);
    // Math overlay
    var overlay = document.createElement('div');
    overlay.className = 'bloch-overlay';
    overlay.style.cssText = 'position: absolute; top: 12px; left: 12px; right: 12px; color: #f3f4f6; font-family: SF Mono, Menlo, monospace; font-size: 13px; pointer-events: none;';
    wrap.appendChild(overlay);
    // Caption
    var caption = document.createElement('div');
    caption.className = 'bloch-caption';
    caption.style.cssText = 'position: absolute; bottom: 48px; left: 12px; right: 12px; color: #f3f4f6; font-size: 12px; line-height: 1.4; pointer-events: none; text-shadow: 0 1px 4px rgba(0,0,0,0.8);';
    wrap.appendChild(caption);
    // Progress bar
    var progress = document.createElement('div');
    progress.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.1);';
    var progressFill = document.createElement('div');
    progressFill.className = 'bloch-progress-fill';
    progressFill.style.cssText = 'height: 100%; width: 0%; background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899); transition: width 0.1s linear;';
    progress.appendChild(progressFill);
    wrap.appendChild(progress);
    card.appendChild(wrap);
    // Controls
    var controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 6px; align-items: center; margin-top: 12px; flex-wrap: wrap;';
    controls.innerHTML = ''
      + '<button class="bloch-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play</button>'
      + '<button class="bloch-pause" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">⏸ Pause</button>'
      + '<button class="bloch-replay" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">↺ Replay</button>'
      + '<span style="flex: 1;"></span>'
      + '<button class="bloch-record" style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">● Record WebM</button>'
      + '<button class="bloch-share" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Share</button>';
    card.appendChild(controls);
    // Status
    var status = document.createElement('div');
    status.className = 'bloch-status';
    status.style.cssText = 'font-size: 11px; color: #9ca3af; margin-top: 8px;';
    card.appendChild(status);

    c.appendChild(card);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlayEl = overlay;
    this.captionEl = caption;
    this.progressEl = progressFill;
    this.statusEl = status;

    // Build scene dots
    var dots = c.querySelector('.bloch-scene-dots');
    for (var i = 0; i < this.scenes.length; i++) {
      var dot = document.createElement('span');
      dot.style.cssText = 'width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; transition: all 0.2s;';
      dot.dataset.idx = i;
      dot.addEventListener('click', function (e) {
        self.seek(parseInt(e.target.dataset.idx, 10));
      });
      dots.appendChild(dot);
    }
    this.dots = c.querySelectorAll('.bloch-scene-dots span');

    // Wire buttons
    c.querySelector('.bloch-play').addEventListener('click', function () { self.play(); });
    c.querySelector('.bloch-pause').addEventListener('click', function () { self.pause(); });
    c.querySelector('.bloch-replay').addEventListener('click', function () { self.replay(); });
    var recordBtn = c.querySelector('.bloch-record');
    if (!global.MediaRecorder || !canvas.captureStream) {
      recordBtn.style.display = 'none';
    } else {
      recordBtn.addEventListener('click', function () { self.record(); });
    }
    c.querySelector('.bloch-share').addEventListener('click', function () { self.share(); });

    // Initial render
    this.updateOverlay();
    this.render(0);
  };

  BlochComponent.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    var now = performance.now();
    if (this.sceneStartTime === 0) this.sceneStartTime = now;
    this.lastFrame = now;
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      // Advance scene time
      var scene = self.scenes[self.currentScene];
      var sceneElapsed = (t - self.sceneStartTime) / 1000;
      var sceneT = sceneElapsed / scene.duration;
      if (sceneT >= 1) {
        // Move to next scene
        self.currentScene = (self.currentScene + 1) % self.scenes.length;
        self.sceneStartTime = t;
        sceneT = 0;
        self.updateOverlay();
      }
      // Auto-rotate
      if (self.autoRotate) {
        self.yaw += dt * 0.5;
      }
      self.render(sceneT);
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
    this.statusEl.textContent = 'Playing scene ' + (this.currentScene + 1) + '/' + this.scenes.length;
  };

  BlochComponent.prototype.pause = function () {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.statusEl.textContent = 'Paused at scene ' + (this.currentScene + 1);
  };

  BlochComponent.prototype.replay = function () {
    this.currentScene = 0;
    this.sceneStartTime = performance.now();
    this.playing = true;
    this.updateOverlay();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lastFrame = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var t = performance.now();
      var dt = (t - self.lastFrame) / 1000;
      self.lastFrame = t;
      var scene = self.scenes[self.currentScene];
      var sceneElapsed = (t - self.sceneStartTime) / 1000;
      var sceneT = sceneElapsed / scene.duration;
      if (sceneT >= 1) {
        self.currentScene = (self.currentScene + 1) % self.scenes.length;
        self.sceneStartTime = t;
        sceneT = 0;
        self.updateOverlay();
      }
      if (self.autoRotate) self.yaw += dt * 0.5;
      self.render(sceneT);
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  BlochComponent.prototype.seek = function (idx) {
    this.currentScene = Math.max(0, Math.min(this.scenes.length - 1, idx));
    this.sceneStartTime = performance.now();
    this.updateOverlay();
    this.render(0);
  };

  BlochComponent.prototype.record = function () {
    if (this.recorder) {
      // Stop recording
      this.recorder.stop();
      return;
    }
    if (!global.MediaRecorder || !this.canvas.captureStream) {
      this.statusEl.textContent = 'Recording not supported in this browser.';
      return;
    }
    var stream = this.canvas.captureStream(30);
    var mime = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
    this.recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    this.chunks = [];
    var self = this;
    this.recorder.ondataavailable = function (e) {
      if (e.data.size > 0) self.chunks.push(e.data);
    };
    this.recorder.onstop = function () {
      var blob = new Blob(self.chunks, { type: 'video/webm' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'aihpc-bloch-sphere-shorts.webm';
      a.click();
      URL.revokeObjectURL(url);
      self.recorder = null;
      self.chunks = [];
      self.statusEl.textContent = 'WebM downloaded (' + (blob.size / 1024 / 1024).toFixed(1) + ' MB).';
    };
    this.recorder.start();
    this.statusEl.textContent = '● Recording… click again to stop.';
    // Auto-play if paused
    if (!this.playing) this.play();
  };

  BlochComponent.prototype.share = function () {
    var title = 'AIHPC Advanced — Bloch sphere quantum shorts';
    var url = global.location ? global.location.href : 'https://demoaihpc.github.io/bloch.html';
    if (global.navigator && navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
    } else if (global.navigator && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      this.statusEl.textContent = 'Link copied to clipboard.';
    } else {
      this.statusEl.textContent = 'Share: ' + url;
    }
  };

  BlochComponent.prototype.updateOverlay = function () {
    var s = this.scenes[this.currentScene];
    this.overlayEl.innerHTML = ''
      + '<div style="color: ' + s.color + '; font-weight: 700; font-size: 14px;">' + s.title + '</div>'
      + '<div style="color: #f3f4f6; font-size: 13px; margin-top: 4px;">' + s.math + '</div>';
    this.captionEl.innerHTML = '<div>' + s.explain + '</div>';
    // Highlight current dot
    for (var i = 0; i < this.dots.length; i++) {
      if (i === this.currentScene) {
        this.dots[i].style.background = s.color;
        this.dots[i].style.boxShadow = '0 0 8px ' + s.color;
        this.dots[i].style.width = '16px';
        this.dots[i].style.borderRadius = '3px';
      } else {
        this.dots[i].style.background = 'rgba(255,255,255,0.2)';
        this.dots[i].style.boxShadow = 'none';
        this.dots[i].style.width = '6px';
        this.dots[i].style.borderRadius = '50%';
      }
    }
  };

  // ---- Rendering --------------------------------------------------------
  BlochComponent.prototype.render = function (sceneT) {
    var ctx = this.ctx;
    var W = this.canvas.width, H = this.canvas.height;
    var cx = W / 2, cy = H * 0.46; // sphere centre (slightly above middle)
    var R = Math.min(W, H) * 0.32;

    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    // Background starfield (parallax depth fog)
    this.drawStarfield(ctx, W, H);

    // ---- Sphere wireframe ----
    // Latitude rings (parallel to X-Y plane)
    var latSteps = 6;
    for (var li = 1; li < latSteps; li++) {
      var latTheta = (Math.PI / latSteps) * li;
      this.drawCircle(ctx, cx, cy, R, this.yaw, this.pitch,
        function (a) {
          var p = sphericalToCartesian(latTheta, a);
          return p;
        },
        'rgba(139,92,246,0.15)', 0.8);
    }
    // Longitude rings
    var lonSteps = 8;
    for (var lo = 0; lo < lonSteps; lo++) {
      var lonPhi = (2 * Math.PI / lonSteps) * lo;
      this.drawCircle(ctx, cx, cy, R, this.yaw, this.pitch,
        function (a) {
          var p = sphericalToCartesian(a, lonPhi);
          return p;
        },
        'rgba(6,182,212,0.12)', 0.8);
    }
    // Equator (highlighted)
    this.drawCircle(ctx, cx, cy, R, this.yaw, this.pitch,
      function (a) { return sphericalToCartesian(Math.PI / 2, a); },
      'rgba(255,255,255,0.45)', 1.4);
    // Sphere outline (back hemisphere, faint)
    this.drawCircleOutline(ctx, cx, cy, R, 'rgba(148,163,184,0.4)', 1.0);

    // ---- Axes (X, Y, Z) ----
    // Z axis (north pole = |0⟩)
    var zTop = this.transformPoint({ x: 0, y: 0, z: 1 }, cx, cy, R);
    var zBot = this.transformPoint({ x: 0, y: 0, z: -1 }, cx, cy, R);
    this.drawLine3D(ctx, zTop, zBot, 'rgba(148,163,184,0.5)', 1);
    // X axis
    var xPos = this.transformPoint({ x: 1, y: 0, z: 0 }, cx, cy, R);
    var xNeg = this.transformPoint({ x: -1, y: 0, z: 0 }, cx, cy, R);
    this.drawLine3D(ctx, xPos, xNeg, 'rgba(148,163,184,0.4)', 1);
    // Y axis
    var yPos = this.transformPoint({ x: 0, y: 1, z: 0 }, cx, cy, R);
    var yNeg = this.transformPoint({ x: 0, y: -1, z: 0 }, cx, cy, R);
    this.drawLine3D(ctx, yPos, yNeg, 'rgba(148,163,184,0.4)', 1);
    // Labels
    ctx.font = '14px ui-monospace, SF Mono, Menlo, monospace';
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText('|0⟩', zTop.x + 4, zTop.y - 4);
    ctx.fillText('|1⟩', zBot.x + 4, zBot.y + 14);
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('|+⟩', xPos.x + 4, xPos.y + 4);
    ctx.fillText('|−⟩', xNeg.x - 22, xNeg.y + 4);
    ctx.fillText('|+i⟩', yPos.x + 4, yPos.y + 4);
    ctx.fillText('|−i⟩', yNeg.x - 26, yNeg.y + 4);

    // ---- State vector ----
    var scene = this.scenes[this.currentScene];
    var state = scene.trajectory(sceneT);
    var r = state.r !== undefined ? state.r : 1.0;
    var stateVec = sphericalToCartesian(state.theta, state.phi, r);
    var stateScreen = this.transformPoint(stateVec, cx, cy, R);

    // Draw the vector arrow with glow
    // Compute origin point (sphere centre on screen)
    var origin = { x: cx, y: cy };
    // Glow
    ctx.save();
    ctx.shadowColor = scene.color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = scene.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(stateScreen.x, stateScreen.y);
    ctx.stroke();
    // Arrow head
    var dx = stateScreen.x - origin.x, dy = stateScreen.y - origin.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = dx / len, ny = dy / len;
    var arrowLen = 10;
    var arrowAng = Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(stateScreen.x, stateScreen.y);
    ctx.lineTo(stateScreen.x - arrowLen * Math.cos(ny ? Math.atan2(ny, nx) + arrowAng : 0 + arrowAng), stateScreen.y - arrowLen * Math.sin(Math.atan2(ny, nx) + arrowAng));
    ctx.lineTo(stateScreen.x - arrowLen * Math.cos(Math.atan2(ny, nx) - arrowAng), stateScreen.y - arrowLen * Math.sin(Math.atan2(ny, nx) - arrowAng));
    ctx.closePath();
    ctx.fillStyle = scene.color;
    ctx.fill();
    ctx.restore();
    // Vector endpoint glow (dot)
    ctx.save();
    var grad = ctx.createRadialGradient(stateScreen.x, stateScreen.y, 0, stateScreen.x, stateScreen.y, 14);
    grad.addColorStop(0, scene.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(stateScreen.x, stateScreen.y, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(stateScreen.x, stateScreen.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // ---- Inner sphere glow (subtle radial) ----
    ctx.save();
    var sphereGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
    sphereGrad.addColorStop(0, 'rgba(139,92,246,0.18)');
    sphereGrad.addColorStop(0.7, 'rgba(11,15,26,0.0)');
    sphereGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // ---- Bottom info HUD ----
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px ui-monospace, SF Mono, Menlo, monospace';
    var stateInfo = '|ψ⟩ = ' + stateAmplitude(state, scene) + '  ·  θ=' + (state.theta * 180 / Math.PI).toFixed(1) + '°  φ=' + (state.phi * 180 / Math.PI).toFixed(1) + '°';
    ctx.fillText(stateInfo, 16, H - 18);

    // ---- Top-right scene counter ----
    ctx.fillStyle = scene.color;
    ctx.font = 'bold 12px ui-monospace, SF Mono, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SCENE ' + (this.currentScene + 1) + '/' + this.scenes.length, W - 16, 28);
    ctx.textAlign = 'left';

    // ---- Progress bar (top, thin) ----
    var totalProgress = (this.currentScene + sceneT) / this.scenes.length;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, W, 3);
    var grad2 = ctx.createLinearGradient(0, 0, W, 0);
    grad2.addColorStop(0, '#06b6d4');
    grad2.addColorStop(0.5, '#8b5cf6');
    grad2.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, W * totalProgress, 3);

    // Update external progress + status
    if (this.progressEl) this.progressEl.style.width = (totalProgress * 100).toFixed(1) + '%';
  };

  function stateAmplitude(state, scene) {
    // Show the current state as a|0⟩ + b|1⟩
    var theta = state.theta, phi = state.phi;
    var a = Math.cos(theta / 2);
    var b = Math.sin(theta / 2);
    var aSign = a >= 0 ? '' : '-';
    var aMag = Math.abs(a).toFixed(2);
    var bMag = Math.abs(b).toFixed(2);
    // Simplified phase — for visual purposes
    if (bMag === '0.00') return aSign + aMag + '|0⟩';
    return aSign + aMag + '|0⟩ + ' + bMag + 'e^(i' + (phi * 180 / Math.PI).toFixed(0) + '°)|1⟩';
  }

  BlochComponent.prototype.transformPoint = function (p, cx, cy, R) {
    var rp = rotateYawPitch(p, this.yaw, this.pitch);
    return project(rp, cx, cy, R);
  };

  BlochComponent.prototype.drawCircle = function (ctx, cx, cy, R, yaw, pitch, pointFn, color, lineWidth) {
    // Draw a 3D circle on the sphere given a pointFn(angle) → 3D point.
    var steps = 60;
    var lastPt = null;
    for (var i = 0; i <= steps; i++) {
      var a = (2 * Math.PI * i) / steps;
      var p3d = pointFn(a);
      var rp = rotateYawPitch(p3d, yaw, pitch);
      var sp = project(rp, cx, cy, R);
      if (lastPt) {
        // Depth-faded line
        var avgDepth = (sp.depth + lastPt.depth) / 2;
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, depthAlpha(avgDepth).toFixed(3) + ')');
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(sp.x, sp.y);
        ctx.stroke();
      }
      lastPt = sp;
    }
  };

  BlochComponent.prototype.drawCircleOutline = function (ctx, cx, cy, R, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.stroke();
  };

  BlochComponent.prototype.drawLine3D = function (ctx, p1, p2, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  };

  // ---- Starfield background ----
  BlochComponent.prototype.drawStarfield = function (ctx, W, H) {
    if (!this._stars) {
      this._stars = [];
      for (var i = 0; i < 60; i++) {
        this._stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + 0.3,
          a: Math.random() * 0.5 + 0.3,
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

  // ---- Public API ----
  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new BlochComponent(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }

  // Auto-mount on DOMContentLoaded if a #bloch-container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('bloch-container')) {
        mount('bloch-container');
      }
    });
  } else {
    if (document.getElementById('bloch-container')) {
      mount('bloch-container');
    }
  }

  global.AIHPC_BLOCH = {
    mount: mount,
    play: function (id) { var c = INSTANCES[id]; if (c) c.play(); },
    pause: function (id) { var c = INSTANCES[id]; if (c) c.pause(); },
    replay: function (id) { var c = INSTANCES[id]; if (c) c.replay(); },
    record: function (id) { var c = INSTANCES[id]; if (c) c.record(); },
    seek: function (id, idx) { var c = INSTANCES[id]; if (c) c.seek(idx); },
    _instances: INSTANCES,
    _scenes: SCENES,
  };
})(typeof window !== 'undefined' ? window : this);

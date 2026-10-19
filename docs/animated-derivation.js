/**
 * AIHPC Advanced — Animated Derivation component (Phase 28).
 *
 * Renders a Math→Code derivation as a "video clip" — an animated
 * canvas sequence with timed reveals, typewriter math, and an
 * optional WebM recording (pure client-side, no external services).
 *
 * Inspired by the Hugging Face "tissuedecision-9b" Gradio space
 * (which animates medical-imaging decisions over time).
 *
 * Usage:
 *   <canvas class="anim-derivation" data-derivation-id="geometry-5step"></canvas>
 *   <script>
 *     AIHPC_ANIM.register('geometry-5step', {
 *       title: 'Tesseract: 4D → 3D → 2D projection',
 *       steps: [
 *         { title: 'Step 1: 4D vertices', math: 'V = ...', explain: '...' },
 *         ...
 *       ],
 *       duration: 12,  // seconds
 *     });
 *   </script>
 *
 * Or auto-discover: any <canvas class="anim-derivation"> with a
 * data-derivation-id attribute will be initialized via the
 * DERIVATIONS registry. The DERIVATIONS registry can be populated
 * by the page's existing inline script (just declare a global
 * DERIVATIONS object before loading this script).
 *
 * Public API:
 *   AIHPC_ANIM.register(id, config)         — register a derivation
 *   AIHPC_ANIM.init()                        — auto-initialize all canvases
 *   AIHPC_ANIM.play(id) / pause(id) / replay(id) — control
 *   AIHPC_ANIM.record(id)                    — record as WebM (download)
 *
 * The component is self-contained — no external libraries, no
 * external services. Pure browser-side canvas + MediaRecorder.
 *
 * Browser support: Chrome / Firefox / Safari 14+ (MediaRecorder
 * may not be available in older browsers; the record button will
 * be hidden if unsupported).
 */
(function (global) {
  'use strict';

  var DERIVATIONS = {};

  function register(id, config) {
    DERIVATIONS[id] = config;
  }

  function getDerivation(id) {
    return DERIVATIONS[id];
  }

  /**
   * AnimatedDerivation — one canvas instance.
   */
  function AnimatedDerivation(canvas, derivationId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.derivationId = derivationId;
    this.config = DERIVATIONS[derivationId];
    this.playing = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.duration = (this.config && this.config.duration) || 12;
    this.recorder = null;
    this.chunks = [];
    this.rafId = null;

    // CSS pixel size of the canvas
    this.W = 800;
    this.H = 400;
    canvas.width = this.W * 2;   // 2x for retina
    canvas.height = this.H * 2;
    canvas.style.width = this.W + 'px';
    canvas.style.height = this.H + 'px';
    this.ctx.scale(2, 2);

    // Draw the initial frame
    this.draw(0);
  }

  AnimatedDerivation.prototype.draw = function (t) {
    var ctx = this.ctx;
    var W = this.W, H = this.H;
    var cfg = this.config;
    if (!cfg) return;

    // Clear + background
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, W, H);

    // Subtle gradient overlay
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, 'rgba(139,92,246,0.06)');
    grad.addColorStop(1, 'rgba(6,182,212,0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Title bar
    ctx.fillStyle = '#f3f4f6';
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.fillText(cfg.title || 'Math → Code derivation', 24, 36);
    // Underline
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 48);
    ctx.lineTo(W - 24, 48);
    ctx.stroke();

    // Steps
    var steps = cfg.steps || [];
    var stepDuration = this.duration / Math.max(steps.length, 1);
    var yStep = 70;
    var stepHeight = (H - 90) / Math.max(steps.length, 1);
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      var stepStart = i * stepDuration;
      var stepT = (t - stepStart) / stepDuration;  // 0 to 1
      if (stepT < 0) continue;
      if (stepT > 1) stepT = 1;
      this.drawStep(i, step, stepT, yStep + i * stepHeight, stepHeight);
    }

    // Progress bar at bottom
    var barY = H - 16;
    ctx.fillStyle = 'rgba(148,163,184,0.2)';
    ctx.fillRect(24, barY, W - 48, 4);
    var progressWidth = (W - 48) * Math.min(1, t / this.duration);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(24, barY, progressWidth, 4);

    // Time text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, Menlo, monospace';
    var timeStr = formatTime(t) + ' / ' + formatTime(this.duration);
    ctx.fillText(timeStr, W - 80, barY - 6);

    // Recording indicator
    if (this.recorder && this.recorder.state === 'recording') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(W - 24, 32, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
      ctx.fillText('REC', W - 16, 36);
    }
  };

  AnimatedDerivation.prototype.drawStep = function (i, step, fade, y, height) {
    var ctx = this.ctx;
    var W = this.W;
    var pad = 32;

    // Step indicator circle
    ctx.fillStyle = fade > 0.1 ? '#8b5cf6' : 'rgba(139,92,246,0.3)';
    ctx.beginPath();
    ctx.arc(pad + 8, y + 14, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), pad + 8, y + 14);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Step title (fade in)
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#f3f4f6';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.fillText(step.title, pad + 26, y + 18);
    ctx.globalAlpha = 1;

    // Math (typewriter effect: show first N chars based on fade)
    if (fade > 0.05) {
      var mathFade = Math.min(1, fade * 1.5);
      var mathChars = Math.floor(step.math.length * mathFade);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '14px "Cambria Math", Georgia, serif';
      ctx.fillText(step.math.substring(0, mathChars), pad + 26, y + 38);
      // Typewriter cursor
      if (mathChars < step.math.length && mathFade < 1) {
        var metrics = ctx.measureText(step.math.substring(0, mathChars));
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(pad + 26 + metrics.width, y + 26, 2, 14);
      }
    }

    // Explain (fade in after math is mostly done)
    if (fade > 0.4) {
      var explainFade = Math.min(1, (fade - 0.4) / 0.4);
      ctx.globalAlpha = explainFade;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px -apple-system, sans-serif';
      // Word wrap
      var explainChars = Math.floor(step.explain.length * explainFade);
      wrapText(ctx, step.explain.substring(0, explainChars), pad + 26, y + 56, W - pad - 50, 14);
      ctx.globalAlpha = 1;
    }
  };

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var lineN = 0;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + ' ';
      var metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, y + lineN * lineHeight);
        line = words[i] + ' ';
        lineN++;
        if (lineN > 2) return;  // cap at 3 lines
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y + lineN * lineHeight);
  }

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  AnimatedDerivation.prototype.loop = function (now) {
    if (!this.playing) return;
    var t = (now - this.startTime) / 1000;
    if (t > this.duration) {
      this.playing = false;
      this.draw(this.duration);
      if (this.onComplete) this.onComplete();
      return;
    }
    this.draw(t);
    var self = this;
    this.rafId = requestAnimationFrame(function (n) { self.loop(n); });
  };

  AnimatedDerivation.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.startTime = performance.now() - (this.pauseTime || 0) * 1000;
    var self = this;
    this.rafId = requestAnimationFrame(function (n) { self.loop(n); });
  };

  AnimatedDerivation.prototype.pause = function () {
    if (!this.playing) return;
    this.playing = false;
    this.pauseTime = (performance.now() - this.startTime) / 1000;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  };

  AnimatedDerivation.prototype.replay = function () {
    this.pauseTime = 0;
    if (this.playing) {
      this.startTime = performance.now();
    } else {
      this.play();
    }
  };

  AnimatedDerivation.prototype.record = function () {
    if (!global.MediaRecorder || !this.canvas.captureStream) {
      alert('MediaRecorder or canvas.captureStream is not supported in this browser. Try Chrome, Firefox, or Safari 14+.');
      return;
    }
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.stop();
      return;
    }
    var stream = this.canvas.captureStream(30);
    var mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    this.recorder = new MediaRecorder(stream, { mimeType: mimeType, videoBitsPerSecond: 2500000 });
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
      a.download = 'aihpc-derivation-' + self.derivationId + '-' + Date.now() + '.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    };
    this.recorder.start();
    this.pauseTime = 0;
    this.play();
    var dur = this.duration;
    setTimeout(function () {
      if (self.recorder && self.recorder.state === 'recording') {
        self.recorder.stop();
      }
    }, (dur + 0.5) * 1000);
  };

  // ---- Registry of canvas instances ----
  var INSTANCES = {};

  function init() {
    var canvases = document.querySelectorAll('canvas.anim-derivation[data-derivation-id]');
    canvases.forEach(function (c) {
      var id = c.dataset.derivationId;
      if (!DERIVATIONS[id]) {
        // Skip — derivation not registered
        return;
      }
      if (INSTANCES[id]) return;  // already init'd
      var inst = new AnimatedDerivation(c, id);
      INSTANCES[id] = inst;

      // Find sibling controls (if any)
      var container = c.closest('.anim-container');
      if (container) {
        var playBtn = container.querySelector('.anim-play');
        var pauseBtn = container.querySelector('.anim-pause');
        var replayBtn = container.querySelector('.anim-replay');
        var recordBtn = container.querySelector('.anim-record');
        if (playBtn) playBtn.addEventListener('click', function () { inst.play(); });
        if (pauseBtn) pauseBtn.addEventListener('click', function () { inst.pause(); });
        if (replayBtn) replayBtn.addEventListener('click', function () { inst.replay(); });
        if (recordBtn) {
          // Hide record button if MediaRecorder is unsupported
          if (!global.MediaRecorder || !c.captureStream) {
            recordBtn.style.display = 'none';
          } else {
            recordBtn.addEventListener('click', function () {
              inst.record();
              var orig = recordBtn.textContent;
              if (inst.recorder && inst.recorder.state === 'recording') {
                recordBtn.textContent = '⏹ Stop & download';
                recordBtn.style.background = 'linear-gradient(90deg,#ef4444,#f59e0b)';
              }
              var checkStop = setInterval(function () {
                if (!inst.recorder || inst.recorder.state !== 'recording') {
                  recordBtn.textContent = orig;
                  recordBtn.style.background = '';
                  clearInterval(checkStop);
                }
              }, 200);
            });
          }
        }
      }
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  global.AIHPC_ANIM = {
    register: register,
    init: init,
    play: function (id) { if (INSTANCES[id]) INSTANCES[id].play(); },
    pause: function (id) { if (INSTANCES[id]) INSTANCES[id].pause(); },
    replay: function (id) { if (INSTANCES[id]) INSTANCES[id].replay(); },
    record: function (id) { if (INSTANCES[id]) INSTANCES[id].record(); },
    _instances: INSTANCES,
    _derivations: DERIVATIONS,
  };
})(typeof window !== 'undefined' ? window : this);

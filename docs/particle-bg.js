/**
 * particle-bg.js — Phase 43c shared particle background
 *
 * Replaces the inlined IIFE on 172+ HTML pages with a single shared module
 * (eliminates ~127 KB of code duplication).
 *
 * Auto-mounts on DOMContentLoaded to <canvas id="particle-canvas"> if present.
 * Honours prefers-reduced-motion: when active, draws a single static frame
 * (no RAF loop, no movement) instead of the continuous animation.
 *
 * Phase 41 algorithm: depth + parallax + radial-gradient halos.
 *
 * Public API:
 *   AIHPC_ParticleBg.mount(canvasId)  → mount to a specific canvas ID
 *   AIHPC_ParticleBg.unmount()        → stop the animation loop
 */
(function (global) {
  'use strict';

  var ParticleBg = {};
  var _rafId = null;
  var _canvas = null;
  var _ctx = null;
  var _particles = [];
  var _running = false;

  // Default particle count + colors (can be overridden via data-* attrs on the canvas)
  var DEFAULT_N = 60;
  var DEFAULT_COLORS = ['#06b6d4', '#8b5cf6', '#10b981'];

  function _reducedMotion() {
    try {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      return mq.matches;
    } catch (e) {
      return false;
    }
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _initParticles(N, colors) {
    _particles = [];
    for (var i = 0; i < N; i++) {
      var depth = Math.random();
      _particles.push({
        x: Math.random() * _canvas.width,
        y: Math.random() * _canvas.height,
        vx: (Math.random() - 0.5) * 0.15 * (0.4 + depth),
        vy: (Math.random() - 0.5) * 0.15 * (0.4 + depth),
        r: Math.random() * 2 + 0.6 + depth * 1.2,
        c: colors[i % colors.length],
        d: depth  // depth 0..1, larger = closer
      });
    }
  }

  function _render() {
    if (!_ctx || !_canvas) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    // Constellation lines (depth-weighted)
    for (var i = 0; i < _particles.length; i++) {
      for (var j = i + 1; j < _particles.length; j++) {
        var p1 = _particles[i], p2 = _particles[j];
        var d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (d < 140) {
          var alpha = 0.18 * (1 - d / 140) * Math.min(p1.d + p2.d, 1.4);
          _ctx.strokeStyle = 'rgba(139,92,246,' + alpha + ')';
          _ctx.lineWidth = 0.5 + Math.min(p1.d, p2.d);
          _ctx.beginPath();
          _ctx.moveTo(p1.x, p1.y);
          _ctx.lineTo(p2.x, p2.y);
          _ctx.stroke();
        }
      }
    }
    // Glowing particles (radial gradient halos)
    for (var k = 0; k < _particles.length; k++) {
      var p = _particles[k];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = _canvas.width;
      if (p.x > _canvas.width) p.x = 0;
      if (p.y < 0) p.y = _canvas.height;
      if (p.y > _canvas.height) p.y = 0;
      // Radial halo
      var g = _ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
      g.addColorStop(0, p.c);
      g.addColorStop(0.4, p.c + 'aa');
      g.addColorStop(1, p.c + '00');
      _ctx.fillStyle = g;
      _ctx.globalAlpha = 0.45 * p.d;
      _ctx.beginPath();
      _ctx.arc(p.x, p.y, p.r * 3.5, 0, 6.28);
      _ctx.fill();
      // Solid core
      _ctx.fillStyle = p.c;
      _ctx.globalAlpha = 0.85 * p.d;
      _ctx.beginPath();
      _ctx.arc(p.x, p.y, p.r * 0.6, 0, 6.28);
      _ctx.fill();
    }
    _ctx.globalAlpha = 1;
  }

  function _loop() {
    if (!_running) return;
    _render();
    // If reduced motion became active mid-loop, stop
    if (_reducedMotion()) {
      _running = false;
      return;
    }
    _rafId = requestAnimationFrame(_loop);
  }

  ParticleBg.mount = function (canvasId) {
    canvasId = canvasId || 'particle-canvas';
    _canvas = document.getElementById(canvasId);
    if (!_canvas) return;  // no canvas on this page — silently skip
    _ctx = _canvas.getContext('2d');
    if (!_ctx) return;

    // Allow per-page overrides via data-* attributes on the canvas
    var N = parseInt(_canvas.getAttribute('data-particle-count'), 10) || DEFAULT_N;
    var colorsAttr = _canvas.getAttribute('data-particle-colors');
    var colors = colorsAttr ? colorsAttr.split(',').map(function (s) { return s.trim(); }) : DEFAULT_COLORS;

    _resize();
    window.addEventListener('resize', _resize);
    _initParticles(N, colors);

    // Reduced-motion: render one static frame, no RAF loop
    if (_reducedMotion() || (window.AIHPC_A11Y && AIHPC_A11Y.reducedMotion && AIHPC_A11Y.reducedMotion())) {
      _render();
      return;
    }

    _running = true;
    _rafId = requestAnimationFrame(_loop);
  };

  ParticleBg.unmount = function () {
    _running = false;
    if (_rafId) cancelAnimationFrame(_rafId);
    _rafId = null;
    window.removeEventListener('resize', _resize);
    _particles = [];
  };

  // Auto-mount on DOMContentLoaded (handles the common case: <canvas id="particle-canvas">)
  function _autoMount() {
    ParticleBg.mount('particle-canvas');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _autoMount);
  } else {
    _autoMount();
  }

  // Expose globally
  global.AIHPC_ParticleBg = ParticleBg;
})(typeof window !== 'undefined' ? window : this);

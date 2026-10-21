/**
 * accessibility.js — Phase 59
 *
 * Shared accessibility utility for the AIHPC Advanced platform.
 * Provides:
 *   - AIHPC_A11Y.reducedMotion() → boolean (checks prefers-reduced-motion)
 *   - AIHPC_A11Y.onMotionPreferenceChange(callback) → fires when user toggles
 *   - AIHPC_A11Y.announce(text) → updates an ARIA live region for screen readers
 *
 * When prefers-reduced-motion: reduce is active:
 *   - Particle backgrounds are frozen (static dots, no movement)
 *   - Canvas component rotation loops are paused (show current frame)
 *   - requestAnimationFrame loops that animate visuals are skipped
 *
 * Usage in a canvas component:
 *   if (window.AIHPC_A11Y && AIHPC_A11Y.reducedMotion()) {
 *     // render one static frame, don't start the RAF loop
 *   } else {
 *     self.rafId = requestAnimationFrame(loop);
 *   }
 *
 * Or check inside the loop:
 *   function loop() {
 *     if (window.AIHPC_A11Y && AIHPC_A11Y.reducedMotion()) {
 *       // Skip the animation frame update — just render static
 *       self.render();
 *       return; // don't request next frame
 *     }
 *     self.yaw += dt * 0.4;
 *     self.render();
 *     self.rafId = requestAnimationFrame(loop);
 *   }
 */
(function (global) {
  'use strict';

  var A11Y = {};
  var _reducedMotion = false;
  var _listeners = [];
  var _liveRegion = null;

  // Check the media query
  function checkMotion() {
    try {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      _reducedMotion = mq.matches;
      return _reducedMotion;
    } catch (e) {
      return false;
    }
  }

  A11Y.reducedMotion = function () {
    return _reducedMotion;
  };

  A11Y.onMotionPreferenceChange = function (callback) {
    _listeners.push(callback);
  };

  // Create an ARIA live region for screen-reader announcements
  function ensureLiveRegion() {
    if (_liveRegion) return _liveRegion;
    _liveRegion = document.createElement('div');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;';
    document.body.appendChild(_liveRegion);
    return _liveRegion;
  }

  A11Y.announce = function (text) {
    var lr = ensureLiveRegion();
    // Clear then set — ensures screen readers re-announce
    lr.textContent = '';
    setTimeout(function () { lr.textContent = text; }, 50);
  };

  // Initialize: check current preference + listen for changes
  checkMotion();

  // Listen for changes (user might toggle system preference)
  try {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.addEventListener) {
      mq.addEventListener('change', function (e) {
        _reducedMotion = e.matches;
        _listeners.forEach(function (cb) { try { cb(_reducedMotion); } catch (e) {} });
      });
    } else if (mq.addListener) {
      // Older browsers
      mq.addListener(function (e) {
        _reducedMotion = e.matches;
        _listeners.forEach(function (cb) { try { cb(_reducedMotion); } catch (e) {} });
      });
    }
  } catch (e) {}

  // Also check localStorage for manual override
  try {
    var override = localStorage.getItem('aihpc-reduced-motion');
    if (override === 'true') _reducedMotion = true;
    if (override === 'false') _reducedMotion = false;
  } catch (e) {}

  // === Phase 42f: autoFreeze ===
  // When reduced motion is active, monkey-patch requestAnimationFrame + setInterval
  // so all 17+ canvas components automatically become "render once, no loop" without
  // needing per-component patches. This is the simplest way to honour
  // prefers-reduced-motion across the whole platform.
  A11Y.autoFreeze = function () {
    if (!_reducedMotion) return;  // no-op if user hasn't requested reduced motion
    if (global._aihpc_frozen) return;  // idempotent
    global._aihpc_frozen = true;

    // Replace requestAnimationFrame with a one-shot render
    // (calls the callback ONCE so the component gets a static frame,
    // then never schedules another frame)
    var origRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = function (cb) {
      // Render once synchronously, don't schedule more
      try { cb(performance.now()); } catch (e) {}
      return 0;  // dummy handle
    };

    // Replace setInterval with no-op (stops particle background loops etc.)
    global.setInterval = function () { return 0; };

    // setTimeouts below 100ms become 0ms (still runs once but immediately)
    // — actually keep setTimeout as-is so user interactions still work
    // (button clicks, tab switches, etc. rely on setTimeout)

    // Clear any existing RAF loops that components may have started
    // (some components start their RAF loop on script load, before this
    //  autoFreeze runs — but they call global.requestAnimationFrame which
    //  is now the patched version, so subsequent frames are no-ops)
  };

  // Expose globally
  global.AIHPC_A11Y = A11Y;

  // Auto-freeze RAF loops if reduced motion is requested
  // (call after a microtask so other scripts have loaded + started their loops)
  Promise.resolve().then(function () {
    A11Y.autoFreeze();
  });

  // If reduced motion is active, announce it to screen readers
  if (_reducedMotion) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        ensureLiveRegion();
        A11Y.announce('Reduced motion mode is active. Animations are paused.');
      });
    } else {
      ensureLiveRegion();
      A11Y.announce('Reduced motion mode is active. Animations are paused.');
    }
  }
})(typeof window !== 'undefined' ? window : this);

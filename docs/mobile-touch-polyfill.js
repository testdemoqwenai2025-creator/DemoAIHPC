/**
 * mobile-touch-polyfill.js — Phase 46c
 *
 * Maps touch events to mouse events on canvas elements so that any
 * component that listens to mousedown/mousemove/mouseup automatically
 * works on touch devices (phones, tablets).
 *
 * The polyfill is intentionally simple: it synthesises MouseEvent objects
 * with the same clientX/clientY as the touch, then dispatches them.
 * This means canvas components that already work with mouse events
 * (rotate, drag, zoom) work transparently on mobile.
 *
 * Auto-loads on every page (no per-page init needed).
 *
 * Limitations:
 *  - Single-touch only (the first touch is mapped to mouse; multi-touch
 *    gestures like pinch-zoom are not translated)
 *  - No momentum scrolling / inertia — touchend fires mouseup immediately
 *  - The component must already handle mousedown/mousemove/mouseup
 *    (this polyfill does NOT add drag-to-rotate to components that
 *    don't already have it)
 */
(function (global) {
  'use strict';

  // Don't run twice
  if (global._aihpc_touch_polyfill) return;
  global._aihpc_touch_polyfill = true;

  // Only run on touch-capable devices (avoid desktop overhead)
  var isTouchDevice = false;
  try {
    isTouchDevice = ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  } catch (e) {}
  if (!isTouchDevice) return;

  function synthesizeMouseEvent(type, touch, target) {
    var event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      buttons: type === 'mouseup' ? 0 : 1,
      relatedTarget: null
    });
    // Set the target explicitly so event listeners on the canvas fire
    Object.defineProperty(event, 'target', { value: target, writable: false });
    return event;
  }

  // Find the nearest canvas ancestor of an element
  function findCanvasAncestor(el) {
    while (el && el.tagName !== 'CANVAS') {
      el = el.parentElement;
    }
    return el;
  }

  // Listen at document level (capture phase so we see touches first)
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;  // only single-touch
    var touch = e.touches[0];
    var target = touch.target;
    if (!target) return;
    // Walk up to find a canvas
    var canvas = target.tagName === 'CANVAS' ? target : findCanvasAncestor(target);
    if (!canvas) return;
    // Synthesise mousedown on the canvas
    canvas.dispatchEvent(synthesizeMouseEvent('mousedown', touch, canvas));
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    var target = touch.target;
    if (!target) return;
    var canvas = target.tagName === 'CANVAS' ? target : findCanvasAncestor(target);
    if (!canvas) return;
    // Synthesise mousemove
    canvas.dispatchEvent(synthesizeMouseEvent('mousemove', touch, canvas));
    // Prevent default to stop page scrolling during canvas drag
    // (only if the canvas has a mousemove listener)
    if (canvas.onmousemove || canvas.__hasMouseMoveListener) {
      e.preventDefault();
    }
  }, { passive: false, capture: true });

  document.addEventListener('touchend', function (e) {
    // Use changedTouches for touchend
    if (e.changedTouches.length !== 1) return;
    var touch = e.changedTouches[0];
    var target = touch.target;
    if (!target) return;
    var canvas = target.tagName === 'CANVAS' ? target : findCanvasAncestor(target);
    if (!canvas) return;
    // Synthesise mouseup + click
    canvas.dispatchEvent(synthesizeMouseEvent('mouseup', touch, canvas));
    // The natural click event will fire after touchend on its own
  }, { passive: true, capture: true });

  // Track which canvases have mousemove listeners so we know to preventDefault
  // (can't easily introspect listeners, so we wrap addEventListener)
  var origAddEventListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = function (type, listener, options) {
    if (this.tagName === 'CANVAS' && type === 'mousemove') {
      this.__hasMouseMoveListener = true;
    }
    return origAddEventListener.call(this, type, listener, options);
  };

})(typeof window !== 'undefined' ? window : this);

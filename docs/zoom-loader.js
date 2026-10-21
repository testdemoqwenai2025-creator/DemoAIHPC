/**
 * Auto-inject zoom controls into every .canvas-wrap on the page.
 * Loaded by all v2 concept cards + paper pages via <script src="zoom-loader.js"></script>.
 *
 * Features:
 *   + / − / ↺ buttons (top-right of canvas-wrap)
 *   + Per-canvas state (canvas._zoom, 0.5×–3× range)
 *   + Wraps existing render() so zoom persists through animation frames
 *   + Phase 38.4: localStorage persistence — share URLs with ?zoom=1.4
 *   + Phase 38.4: keyboard shortcuts: +/-/0 keys for zoom in/out/reset
 */
(function () {
  var STORAGE_PREFIX = 'zoom-';

  function loadStoredZoom(canvasId) {
    // Priority: URL param ?zoom=X > localStorage > default 1.0
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var urlZoom = parseFloat(urlParams.get('zoom'));
      if (!isNaN(urlZoom) && urlZoom >= 0.5 && urlZoom <= 3.0) return urlZoom;
    } catch (e) {}
    try {
      var stored = parseFloat(localStorage.getItem(STORAGE_PREFIX + canvasId));
      if (!isNaN(stored) && stored >= 0.5 && stored <= 3.0) return stored;
    } catch (e) {}
    return 1.0;
  }

  function saveZoom(canvasId, zoom) {
    try { localStorage.setItem(STORAGE_PREFIX + canvasId, zoom.toString()); } catch (e) {}
  }

  function updateUrlZoom(zoom) {
    try {
      var u = new URL(window.location.href);
      u.searchParams.set('zoom', zoom.toString());
      window.history.replaceState({}, '', u.toString());
    } catch (e) {}
  }

  function initCanvasZoom(canvas) {
    if (!canvas || canvas._zoomInited) return;
    canvas._zoomInited = true;
    var canvasId = canvas.id || ('canvas-' + Math.random().toString(36).substr(2, 9));
    canvas._zoom = loadStoredZoom(canvasId);

    var wrap = canvas.parentElement;
    if (!wrap || !wrap.classList.contains('canvas-wrap')) return;
    // If the page already has its own zoom-controls, don't inject another
    // AND don't wrap render (would cause the two zoom systems to conflict).
    if (wrap.querySelector('.zoom-controls')) return;

    var zoomHTML =
      '<div class="zoom-controls" style="position:absolute;top:10px;right:10px;' +
      'display:flex;flex-direction:column;gap:4px;background:rgba(11,15,26,0.85);' +
      'border:1px solid #1f2937;border-radius:8px;padding:4px;z-index:5;">' +
      '<button class="zoom-btn" data-zoom="in" title="Zoom in (+)" style="width:30px;height:30px;border:none;background:transparent;color:#f3f4f6;cursor:pointer;font-size:16px;font-weight:700;border-radius:4px;">+</button>' +
      '<div class="zoom-label" style="font-size:9px;color:#9ca3af;text-align:center;padding:2px 0;">' + Math.round(canvas._zoom * 100) + '%</div>' +
      '<button class="zoom-btn" data-zoom="out" title="Zoom out (-)" style="width:30px;height:30px;border:none;background:transparent;color:#f3f4f6;cursor:pointer;font-size:16px;font-weight:700;border-radius:4px;">−</button>' +
      '<button class="zoom-btn" data-zoom="reset" title="Reset zoom (0)" style="width:30px;height:30px;border:none;background:transparent;color:#f3f4f6;cursor:pointer;font-size:14px;border-radius:4px;">↺</button>' +
      '</div>';
    wrap.insertAdjacentHTML('beforeend', zoomHTML);

    var zoomLabel = wrap.querySelector('.zoom-label');
    var ctx = canvas.getContext('2d');
    var origRender = (typeof render === 'function') ? render : null;

    function updateLabel() {
      zoomLabel.textContent = Math.round(canvas._zoom * 100) + '%';
    }

    function applyZoomTransformAndRender() {
      if (!origRender) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(canvas._zoom, canvas._zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      origRender();
      ctx.restore();
    }

    function setZoom(newZoom, persist, updateURL) {
      canvas._zoom = Math.max(0.5, Math.min(3.0, newZoom));
      updateLabel();
      applyZoomTransformAndRender();
      if (persist) saveZoom(canvasId, canvas._zoom);
      if (updateURL) updateUrlZoom(canvas._zoom);
    }

    // Initial render with stored zoom
    if (origRender) {
      // Wrap the global render() so future calls also apply zoom
      try {
        // eslint-disable-next-line no-global-assignment, no-func-assign
        render = applyZoomTransformAndRender;
      } catch (e) {
        // render is a const in some cards — fall back to manual apply
      }
      // Apply stored zoom immediately + update label
      updateLabel();
      applyZoomTransformAndRender();
    }

    // Wire up zoom buttons
    wrap.querySelector('[data-zoom="in"]').addEventListener('click', function() { setZoom(canvas._zoom + 0.2, true, true); });
    wrap.querySelector('[data-zoom="out"]').addEventListener('click', function() { setZoom(canvas._zoom - 0.2, true, true); });
    wrap.querySelector('[data-zoom="reset"]').addEventListener('click', function() { setZoom(1.0, true, true); });

    // Phase 38.4: keyboard shortcuts (+/-/0 keys)
    // Only fire when no input/textarea is focused (don't steal typing)
    document.addEventListener('keydown', function(e) {
      var activeTag = (document.activeElement && document.activeElement.tagName) || '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      // Check if the canvas-wrap is visible (in viewport)
      var rect = wrap.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(canvas._zoom + 0.2, true, true);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(canvas._zoom - 0.2, true, true);
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1.0, true, true);
      }
    });

    // Expose setZoom on the canvas for external callers
    canvas._setZoom = setZoom;
    canvas._applyZoomTransformAndRender = applyZoomTransformAndRender;
  }

  function init() {
    var canvases = document.querySelectorAll('canvas');
    canvases.forEach(initCanvasZoom);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


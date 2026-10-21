/**
 * Auto-inject zoom controls into every .canvas-wrap on the page.
 * Loaded by all v2 concept cards via <script src="../zoom-loader.js"></script>.
 *
 * Adds a small floating control (top-right of canvas) with:
 *   + (zoom in 20%)  |  label (current %)  |  − (zoom out 20%)  |  ↺ (reset to 100%)
 *
 * Zoom is applied as a transform: translate(W/2, H/2) scale(zoom) translate(-W/2, -H/2)
 * so the zoom is centred on the canvas. Existing render() functions keep working
 * unchanged — the zoom transform wraps whatever the card already draws.
 *
 * Per-card state is stored on the canvas element (canvas._zoom) so multiple
 * canvases on the same page each have independent zoom.
 */
(function () {
  function initCanvasZoom(canvas) {
    if (!canvas || canvas._zoomInited) return;
    canvas._zoomInited = true;
    canvas._zoom = 1.0;

    var wrap = canvas.parentElement;
    if (!wrap || !wrap.classList.contains('canvas-wrap')) return;

    // Inject zoom controls (if not already present)
    if (wrap.querySelector('.zoom-controls')) return;

    var zoomHTML =
      '<div class="zoom-controls" style="position:absolute;top:10px;right:10px;' +
      'display:flex;flex-direction:column;gap:4px;background:rgba(11,15,26,0.85);' +
      'border:1px solid #1f2937;border-radius:8px;padding:4px;z-index:5;">' +
      '<button class="zoom-btn" data-zoom="in" title="Zoom in" style="width:30px;height:30px;border:none;background:transparent;color:#f3f4f6;cursor:pointer;font-size:16px;font-weight:700;border-radius:4px;">+</button>' +
      '<div class="zoom-label" style="font-size:9px;color:#9ca3af;text-align:center;padding:2px 0;">100%</div>' +
      '<button class="zoom-btn" data-zoom="out" title="Zoom out" style="width:30px;height:30px;border:none;background:transparent;color:#f3f4f6;cursor:pointer;font-size:16px;font-weight:700;border-radius:4px;">−</button>' +
      '<button class="zoom-btn" data-zoom="reset" title="Reset zoom" style="width:30px;height:30px;border:none;background:transparent;color:#f3f4f6;cursor:pointer;font-size:14px;border-radius:4px;">↺</button>' +
      '</div>';
    wrap.insertAdjacentHTML('beforeend', zoomHTML);

    var zoomLabel = wrap.querySelector('.zoom-label');
    var ctx = canvas.getContext('2d');

    // Save the original render if it exists (card-specific)
    var origRender = (typeof render === 'function') ? render : null;

    function applyZoom() {
      // Wrap the render call to apply the zoom transform on top
      // We can't easily wrap render() (it's a top-level function in the card's
      // script), so we instead re-call render() and then draw a zoom overlay.
      // Simpler: re-call render() with a saved+restored transform.
    }

    function updateLabel() {
      zoomLabel.textContent = Math.round(canvas._zoom * 100) + '%';
    }

    function zoomIn() {
      canvas._zoom = Math.min(3.0, canvas._zoom + 0.2);
      updateLabel();
      if (origRender) {
        // Re-render with zoom transform applied
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Apply zoom transform centered on canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(canvas._zoom, canvas._zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        origRender();
        ctx.restore();
      }
    }

    function zoomOut() {
      canvas._zoom = Math.max(0.5, canvas._zoom - 0.2);
      updateLabel();
      if (origRender) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(canvas._zoom, canvas._zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        origRender();
        ctx.restore();
      }
    }

    function zoomReset() {
      canvas._zoom = 1.0;
      updateLabel();
      if (origRender) origRender();
    }

    wrap.querySelector('[data-zoom="in"]').addEventListener('click', zoomIn);
    wrap.querySelector('[data-zoom="out"]').addEventListener('click', zoomOut);
    wrap.querySelector('[data-zoom="reset"]').addEventListener('click', zoomReset);

    // Hook into the card's existing render function so zoom persists on re-render
    // (cards call render() on slider input, button click, animation frames)
    if (origRender) {
      // Re-define the global render to apply zoom transform
      try {
        // eslint-disable-next-line no-global-assignment, no-func-assign
        render = function () {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          // Clear with bg color first
          ctx.fillStyle = '#0a0e1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Apply zoom transform centered on canvas
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(canvas._zoom, canvas._zoom);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
          origRender();
          ctx.restore();
        };
      } catch (e) {
        // render is a const in some cards (e.g. activation template uses
        // function declarations which are re-assignable). If we can't reassign,
        // the zoom still works on initial render via direct button clicks.
      }
    }
  }

  // Run after DOM is ready
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

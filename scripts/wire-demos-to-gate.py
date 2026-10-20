#!/usr/bin/env python3
"""
wire-demos-to-gate.py — Phase 31 batch script.

Wires the 4 remaining seed demos (OLS on index.html, kmeans, pagerank,
molecular-dynamics) through the Phase 24 subscription gate:
  1. Adds <script src="subscribe-gate.js"></script> to the head
  2. Adds a tier badge container near the demo controls
  3. Adds a "⬇ Receipt" button (gated to Pro+) next to the existing
     download buttons
  4. Wires the receipt button through AIHPC.requireTier()

Idempotent.
"""
import os
import re

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
DOCS = os.path.join(ROOT, "docs")

# Pages to patch + their relative path to subscribe-gate.js
TARGETS = [
    ("demos/kmeans-clustering.html", "../subscribe-gate.js"),
    ("demos/citation-pagerank.html", "../subscribe-gate.js"),
    ("demos/molecular-dynamics.html", "../subscribe-gate.js"),
    ("index.html", "subscribe-gate.js"),
]

RECEIPT_BTN_HTML = '''            <button class="btn" id="gated-receipt-btn" title="Pro tier required — sign in at /subscribe.html" style="opacity: 0.5;">⬇ Receipt</button>'''

RECEIPT_JS = '''
      // ---- Subscription gating (Phase 31) ----
      if (window.AIHPC) {
        // Mount tier badge
        var badge = document.getElementById('demo-tier-badge');
        if (badge) AIHPC.mountTierBadge(badge);
        // Wire the receipt button
        var rBtn = document.getElementById('gated-receipt-btn');
        if (rBtn) {
          var tier = AIHPC.getTier();
          if (tier === 'free') {
            rBtn.style.opacity = '0.5';
            rBtn.title = '🔒 Pro tier required — sign in at /subscribe.html';
          } else {
            rBtn.style.opacity = '1';
            rBtn.title = 'Download provenance receipt (' + tier + ' tier)';
          }
          rBtn.addEventListener('click', function () {
            if (!AIHPC.requireTier('pro', { feature: 'Provenance receipt' })) return;
            // Generate a minimal receipt
            var receipt = {
              '@context': 'https://aihpc.advanced/prov/v1',
              '@type': 'aihpc:ProvenanceReceipt',
              demo: window.location.pathname,
              tier: AIHPC.getTier(),
              timestamp: new Date().toISOString(),
            };
            var blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'aihpc-receipt-' + Date.now() + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
        }
        // Cross-tab session updates
        AIHPC.onChange(function () {
          var b = document.getElementById('demo-tier-badge');
          if (b) AIHPC.mountTierBadge(b);
        });
      }
'''

def patch_page(rel, script_src):
    path = os.path.join(DOCS, rel)
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()
    changed = False

    # 1. Add subscribe-gate.js script tag if not present
    if script_src not in s:
        # Insert before the first <script> or before </head>
        s = s.replace('</head>', f'    <script src="{script_src}"></script>\n  </head>', 1)
        changed = True

    # 2. Add tier badge + receipt button — find the demo controls area
    # For demo pages: look for the "Run" button and add after the last download button
    # For index.html: look for the OLS demo's download button
    if 'gated-receipt-btn' not in s:
        # Find the last download button and insert the receipt button after it
        # Pattern: <button ... id="download-...-btn" ...>...</button>
        # or: <button ... id="download-btn" ...>...</button>
        pat = re.compile(r'(<button[^>]*id="download[^"]*-?btn"[^>]*>.*?</button>)', re.DOTALL)
        matches = list(pat.finditer(s))
        if matches:
            last_match = matches[-1]
            insert_pos = last_match.end()
            # Insert the receipt button + badge
            badge_html = '\n            <span data-aihpc-tier-badge="1" id="demo-tier-badge" style="margin-left: auto;"></span>\n'
            s = s[:insert_pos] + RECEIPT_BTN_HTML + badge_html + s[insert_pos:]
            changed = True

    # 3. Add the gating JS — insert before the theme toggle script
    if 'gated-receipt-btn' in s and 'Subscription gating (Phase 31)' not in s:
        # Find the last </script> before </body> and insert before it
        # Or find "// ---- Ribbon theme toggle ----" and insert before it
        pat = re.compile(r'(// ---- Ribbon theme toggle|// ---- Particle background|// Theme)')
        m = pat.search(s)
        if m:
            insert_pos = m.start()
            s = s[:insert_pos] + RECEIPT_JS + '\n      ' + s[insert_pos:]
            changed = True
        else:
            # Insert before the last </script>
            idx = s.rfind('</script>')
            if idx > 0:
                s = s[:idx] + RECEIPT_JS + '\n    ' + s[idx:]
                changed = True

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write(s)
        print(f"  ✓ patched: {rel}")
    else:
        print(f"  - already patched: {rel}")

for rel, src in TARGETS:
    patch_page(rel, src)

print("\nDone.")

#!/usr/bin/env python3
"""
gen-ml-concept-cards.py — Phase 35 auto-generated ML concept cards.

Imports LOSS_FUNCTIONS from scripts/gen-ml-page.py and generates a
standalone concept card for each ML demo at:

  docs/concepts/ml-<id>.html

Each concept card has: standard ribbon + title + category + equation +
5-step Math->Code derivation + 6-language polyglot code + Observe
(Stats/Reports/Graphs/Summary) + data table (if sample_data exists) +
animated-derivation canvas.

Run:
    python3 scripts/gen-ml-concept-cards.py
"""
import importlib.util
import json
import os
import html as html_mod

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
ML_PAGE_PATH = os.path.join(ROOT, "scripts", "gen-ml-page.py")
OUT_DIR = os.path.join(ROOT, "docs", "concepts")

RIBBON_HTML = '''    <header class="ribbon">
      <div class="ribbon-inner">
        <a href="../index.html" class="ribbon-brand"><span class="ribbon-logo">A</span><span class="ribbon-name">AIHPC Advanced</span></a>
        <nav class="ribbon-nav">
          <details class="ribbon-dropdown"><summary>Platform</summary><div class="ribbon-menu"><a href="../index.html">Home</a><a href="../demos.html">Demos</a><a href="../dashboard.html">Dashboard</a><a href="../graph.html">Knowledge Graph</a><a href="../benchmark.html">Agentic Benchmark</a><a href="../subscribe.html">Subscribe</a></div></details>
          <details class="ribbon-dropdown"><summary>AETHEL Suite</summary><div class="ribbon-menu"><a href="../aethel.html">AETHEL Connector</a><a href="../connectors.html">Scientific Connectors Hub</a><a href="../query.html">Query Executor</a><a href="../graph.html">Knowledge Graph</a><a href="../workflows.html">Domain Workflows</a></div></details>
          <details class="ribbon-dropdown"><summary>Science</summary><div class="ribbon-menu"><a href="../science-biology.html">Biology Hub</a><a href="../science-chemistry.html">Chemistry Hub</a><a href="../science-physics.html">Physics Hub</a><a href="../science-maths.html">Mathematics Hub</a><a href="../science-ml.html">Machine Learning</a><a href="../science-bioinformatics.html">Bioinformatics</a><a href="../science-cheminformatics.html">Cheminformatics</a></div></details>
          <details class="ribbon-dropdown"><summary>Insights</summary><div class="ribbon-menu"><a href="../digest.html">Weekly Science Digest</a><a href="../audit.html">Audit Dashboard</a><a href="../dashboard.html">Temporal Knowledge Graph Dashboard</a><a href="../concepts.html">Concept Cards</a><a href="lazy-evaluation.html">Lazy Evaluation as UX</a><a href="provenance-chain.html">Provenance Chain</a></div></details>
        </nav>
        <div class="ribbon-actions">
          <button id="ribbon-theme-toggle" class="ribbon-icon-btn" aria-label="Toggle dark / light theme"><span id="ribbon-theme-icon">🌙</span></button>
          <a href="../demos.html" class="ribbon-btn-primary">Get Started</a>
        </div>
      </div>
    </header>'''

CSS = """      :root { --bg:#0b0f1a; --bg-elevated:#121826; --bg-elevated-2:#1a2133; --border:#1f2937; --border-strong:#2a3548; --text:#f3f4f6; --text-muted:#9ca3af; --text-muted-2:#6b7280; --accent:#8b5cf6; --accent-2:#06b6d4; --accent-3:#f59e0b; --success:#10b981; --danger:#ef4444; --warn:#fbbf24; --info:#3b82f6; --pink:#ec4899; }
      * { box-sizing: border-box; } html, body { margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: radial-gradient(1200px 600px at 20% -10%, rgba(139,92,246,0.15), transparent 60%), var(--bg); color: var(--text); min-height: 100vh; line-height: 1.7; }
      #particle-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.35; }
      .container { max-width: 1000px; margin: 0 auto; padding: 56px 24px 96px; position: relative; z-index: 1; }
      .crumbs { font-size: 13px; color: var(--text-muted-2); margin-bottom: 8px; }
      .crumbs a { color: var(--text-muted); text-decoration: none; }
      .tag { display: inline-block; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(139,92,246,0.3); background: rgba(139,92,246,0.1); font-size: 12px; color: var(--text); margin-bottom: 12px; }
      h1 { font-size: 36px; line-height: 1.1; margin: 0 0 16px; letter-spacing: -0.02em; background: linear-gradient(90deg,#fff,#c4b5fd 60%,#67e8f9); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .lead { font-size: 16px; color: var(--text-muted); max-width: 800px; margin: 0 0 32px; }
      h2 { font-size: 22px; margin: 32px 0 12px; }
      .math-panel .math-eq { font-family: "Cambria Math", Georgia, serif; font-size: 17px; color: var(--accent-2); padding: 10px 14px; background: rgba(6,182,212,0.05); border-radius: 8px; border-left: 3px solid var(--accent-2); margin: 8px 0 12px; }
      .math-panel .math-plain { font-size: 13px; color: var(--text-muted); }
      .derivation-step { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
      .derivation-step .step-math { font-family: "Cambria Math", Georgia, serif; font-size: 14px; color: var(--accent-2); margin: 6px 0 4px; padding: 6px 10px; background: rgba(6,182,212,0.05); border-radius: 6px; }
      .derivation-step .step-explain { font-size: 12px; color: var(--text-muted); }
      .code-panel .lang-toggle { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
      .code-panel .lang-toggle button { padding: 4px 10px; background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-muted); font-size: 11px; font-weight: 600; border-radius: 6px; cursor: pointer; font-family: inherit; }
      .code-panel .lang-toggle button.active { background: linear-gradient(90deg,#8b5cf6,#06b6d4); color: white; border-color: transparent; }
      pre.code-block { background: #0a0e1a; border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 12px; line-height: 1.5; overflow: auto; color: #e5e7eb; font-family: "SF Mono", Menlo, monospace; }
      .demo-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-elevated); margin-bottom: 16px; }
      .demo-tabs button { padding: 10px 18px; background: transparent; border: none; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; }
      .demo-tabs button.active { color: var(--text); border-bottom-color: var(--accent); }
      .demo-tab-content { display: none; padding: 18px 0; }
      .demo-tab-content.active { display: block; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
      .stats-grid .stat { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
      .stats-grid .stat .l { font-size: 10px; color: var(--text-muted-2); text-transform: uppercase; letter-spacing: 0.06em; }
      .stats-grid .stat .v { font-size: 16px; font-weight: 700; color: var(--accent-2); margin-top: 2px; font-family: "SF Mono", Menlo, monospace; }
      .report-block { padding: 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; color: var(--text); line-height: 1.6; }
      .graph-block svg { width: 100%; height: auto; display: block; }
      .summary-block ul { padding-left: 22px; color: var(--text-muted); }
      .summary-block ul li { margin-bottom: 6px; font-size: 13px; }
      .data-table-container { overflow-x: auto; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
      .data-table-container table { width: 100%; border-collapse: collapse; }
      .data-table-container th { padding: 6px 10px; text-align: left; font-size: 11px; color: var(--text-muted-2); text-transform: uppercase; border-bottom: 1px solid var(--border); }
      .data-table-container td { padding: 6px 10px; font-size: 12px; color: var(--text-muted); font-family: "SF Mono", Menlo, monospace; }
      .data-table-hidden { display: none; }
      .meta { margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 13px; }
      .meta a { color: var(--text); text-decoration: none; }"""


def load_loss_functions():
    spec = importlib.util.spec_from_file_location("gen_ml_page", ML_PAGE_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.LOSS_FUNCTIONS


def emit_ml_concept_card(lf):
    aid = lf["id"]
    parts = ['<!doctype html>', '<html lang="en">', '  <head>',
             '    <meta charset="utf-8" />',
             '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
             f'    <meta name="description" content="{html_mod.escape(lf["name"])} — AIHPC Advanced ML concept card. Math-to-Code derivation, 6-language polyglot, observability." />',
             f'    <title>{html_mod.escape(lf["name"])} — AIHPC ML Concept Card</title>',
             '    <style>', CSS, '    </style>',
             '    <script src="../animated-derivation.js"></script>',
             '  </head>', '  <body>',
             '    <canvas id="particle-canvas"></canvas>',
             RIBBON_HTML,
             '    <div class="container">',
             '      <p class="crumbs"><a href="../science-ml.html">ML Hub</a> / ' + html_mod.escape(lf["category"]) + '</p>',
             f'      <span class="tag">ML Concept Card · {html_mod.escape(lf["category"])}</span>',
             f'      <h1>{html_mod.escape(lf["name"])}</h1>',
             f'      <p class="lead">{html_mod.escape(lf["explanation"])}</p>',
             '']

    # Math + 5-step derivation
    parts.append(f'      <h2>Math → Code</h2>')
    parts.append(f'      <div class="math-panel"><div class="math-eq">{html_mod.escape(lf["equation"])}</div></div>')
    parts.append(f'      <div class="derivation-step"><strong>Step 1</strong><div class="step-math">{html_mod.escape(lf["derivation"][0][1])}</div><div class="step-explain">{html_mod.escape(lf["derivation"][0][2])}</div></div>')
    for i in range(1, min(5, len(lf["derivation"]))):
        parts.append(f'      <div class="derivation-step"><strong>Step {i+1}</strong><div class="step-math">{html_mod.escape(lf["derivation"][i][1])}</div><div class="step-explain">{html_mod.escape(lf["derivation"][i][2])}</div></div>')

    # 6-language code
    parts.append('      <h2>Polyglot Code (6 languages)</h2>')
    parts.append('      <div class="code-panel"><div class="lang-toggle">')
    for lang in ['python', 'rust', 'go', 'c', 'elixir', 'scala']:
        active = ' class="active"' if lang == 'python' else ''
        parts.append(f'        <button data-lang="{lang}"{active}>{lang.capitalize()}</button>')
    parts.append(f'      </div><pre class="code-block" id="code-block-{aid}"></pre></div>')

    # Observe tabs
    parts.append('      <h2>Observe</h2>')
    parts.append('      <div class="demo-tabs">')
    parts.append('        <button class="active" data-tab="stats">Stats</button>')
    parts.append('        <button data-tab="reports">Reports</button>')
    parts.append('        <button data-tab="graphs">Graphs</button>')
    parts.append('        <button data-tab="summary">Summary</button>')
    if lf.get('sample_data'):
        parts.append('        <button data-tab="data">Data</button>')
    parts.append('      </div>')

    # Stats
    parts.append('      <div class="demo-tab-content active" data-tab="stats"><div class="stats-grid">')
    for stat in lf['stats']:
        parts.append(f'        <div class="stat"><div class="l">{html_mod.escape(stat["label"])}</div><div class="v">{html_mod.escape(stat["value"])}</div></div>')
    parts.append('      </div></div>')

    # Reports
    parts.append(f'      <div class="demo-tab-content" data-tab="reports"><div class="report-block">{html_mod.escape(lf["report"])}</div></div>')

    # Graphs
    parts.append(f'      <div class="demo-tab-content" data-tab="graphs"><div class="graph-block">{lf["graph_svg"]}</div></div>')

    # Summary
    parts.append('      <div class="demo-tab-content" data-tab="summary"><div class="summary-block"><ul>')
    for s in lf['summary']:
        parts.append(f'        <li>{html_mod.escape(s)}</li>')
    parts.append('      </ul></div></div>')

    # Data table (if sample_data)
    if lf.get('sample_data'):
        sd = lf['sample_data']
        thead = ''.join(f'<th>{html_mod.escape(str(h))}</th>' for h in sd['headers'])
        tbody_rows = []
        for i, row in enumerate(sd['rows']):
            tds = ''.join(f'<td>{html_mod.escape(str(c))}</td>' for c in row)
            hidden = ' data-table-hidden' if i >= 5 else ''
            tbody_rows.append(f'<tr class="data-table-row{hidden}">{tds}</tr>')
        tbody = '\n'.join(tbody_rows)
        n_hidden = max(0, len(sd['rows']) - 5)
        parts.append(f'      <div class="demo-tab-content" data-tab="data">')
        parts.append(f'        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">{html_mod.escape(sd["caption"])}</p>')
        parts.append(f'        <div class="data-table-container"><table class="data-table"><thead><tr>{thead}</tr></thead><tbody>{tbody}</tbody></table>')
        if n_hidden > 0:
            parts.append(f'        <button class="data-table-show-more" style="margin-top:12px;background:var(--bg-elevated-2);border:1px solid var(--border-strong);color:var(--text);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;" onclick="dataTableShowMore(this)">Show more ({n_hidden} hidden)</button>')
        parts.append(f'        </div></div>')

    # Animated-derivation canvas
    derivation_steps = [{"title": t, "math": m, "explain": e} for t, m, e in lf["derivation"]]
    steps_json = json.dumps(derivation_steps)
    title_json = json.dumps(lf["name"])
    duration = max(8, len(lf["derivation"]) * 2.4)
    code_json = json.dumps(lf["code"])

    # Phase 40: N-D parallel-coords strip — auto-embedded on every ML concept card
    nd_props_ml = [
        {'label': 'ID', 'value': aid},
        {'label': 'Category', 'value': lf.get('category', '?')},
        {'label': 'Equation', 'value': lf.get('equation', '?')[:50]},
    ]
    if 'stats' in lf:
        for stat in lf['stats'][:6]:
            nd_props_ml.append({'label': stat.get('label', '?'), 'value': stat.get('value', '?')})
    if 'sample_data' in lf:
        sd = lf['sample_data']
        # Coerce headers + caption to safe strings
        headers_list = sd.get('headers', [])
        if isinstance(headers_list, list):
            headers_str = ', '.join(str(h) for h in headers_list)
        else:
            headers_str = str(headers_list)
        nd_props_ml.append({'label': 'Headers', 'value': headers_str[:40]})
        nd_props_ml.append({'label': 'Rows', 'value': str(len(sd.get('rows', [])))})
        caption_val = sd.get('caption', '')
        if not isinstance(caption_val, str):
            caption_val = str(caption_val)
        nd_props_ml.append({'label': 'Caption', 'value': caption_val[:40]})
    nd_cells_ml = ''.join([
        f'<div style="display:flex;flex-direction:column;flex:1;min-width:0;padding:0 6px;border-right:1px solid var(--border, #1f2937);">'
        f'<div style="font-size:9px;color:var(--text-muted-2, #6b7280);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{html_mod.escape(str(p["label"]))}</div>'
        f'<div style="font-size:10px;color:var(--text, #f3f4f6);font-family:SF Mono, Menlo, monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{html_mod.escape(str(p["value"]))}</div>'
        f'</div>' for p in nd_props_ml
    ])
    parts.append(f'''      <section style="margin:24px 0;padding:14px 16px;background:rgba(11,15,26,0.6);border:1px solid rgba(139,92,246,0.25);border-radius:10px;backdrop-filter:blur(12px);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#06b6d4;">📊 N-D properties strip</span>
          <span style="font-size:10px;color:var(--text-muted-2, #6b7280);">Phase 40 · auto-generated · {len(nd_props_ml)} properties</span>
        </div>
        <div style="display:flex;align-items:flex-start;overflow-x:auto;">{nd_cells_ml}</div>
        <p style="font-size:10px;color:var(--text-muted-2, #6b7280);margin:8px 0 0;">Parallel-coordinates strip — read left-to-right. Useful for cross-demo comparison (e.g. MSE vs MAE vs Huber stats at a glance).</p>
      </section>''')

    parts.append(f'''      <h2>Animated Derivation Clip</h2>
      <div class="anim-container" style="padding:20px;background:rgba(18,24,38,0.6);border:1px solid rgba(139,92,246,0.25);border-radius:16px;margin:24px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#06b6d4;">Phase 28</span>
          <div style="display:flex;gap:4px;">
            <button class="anim-play" style="background:linear-gradient(90deg,#8b5cf6,#06b6d4);border:none;color:white;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Play</button>
            <button class="anim-replay" style="background:#1a2133;border:1px solid #2a3548;color:#f3f4f6;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">Replay</button>
            <button class="anim-record" style="background:#1a2133;border:1px solid #2a3548;color:#f3f4f6;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">WebM</button>
            <button class="anim-share" style="background:#1a2133;border:1px solid #2a3548;color:#f3f4f6;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">Share</button>
          </div>
        </div>
        <canvas class="anim-derivation" data-derivation-id="ml-cc-{aid}" style="display:block;max-width:100%;height:auto;border-radius:6px;background:#0b0f1a;"></canvas>
      </div>''')

    # Footer + scripts
    parts.append(f'''      <div class="meta">
        <p>Auto-generated ML concept card from <a href="../science-ml.html">science-ml.html</a> (demo id: <code>{aid}</code>). Generated by <code>scripts/gen-ml-concept-cards.py</code>.</p>
      </div>
    </div>
    <script>
      var CODE_BANK = {code_json};
      AIHPC_ANIM.register('ml-cc-{aid}', {{
        title: {title_json},
        steps: {steps_json},
        duration: {duration:.1f},
      }});
      function dataTableShowMore(btn) {{
        var table = btn.closest('.data-table-container').querySelector('.data-table');
        var visible = parseInt(table.dataset.visibleRows || '5', 10);
        var total = parseInt(table.dataset.totalRows || '0', 10);
        var newVisible = Math.min(total, visible + 10);
        table.querySelectorAll('.data-table-row').forEach(function(r, i) {{ if (i < newVisible) r.classList.remove('data-table-hidden'); }});
        table.dataset.visibleRows = newVisible;
        var remaining = total - newVisible;
        if (remaining > 0) btn.textContent = 'Show more (' + remaining + ' hidden)';
        else {{ btn.textContent = 'All ' + total + ' rows shown'; btn.disabled = true; btn.style.opacity = '0.5'; }}
      }}
      document.addEventListener('DOMContentLoaded', function () {{
        var block = document.getElementById('code-block-{aid}');
        if (block) block.textContent = CODE_BANK.python || '';
        document.querySelectorAll('.code-panel .lang-toggle button').forEach(function (btn) {{
          btn.addEventListener('click', function () {{
            var panel = btn.closest('.code-panel');
            panel.querySelectorAll('.lang-toggle button').forEach(function (b) {{ b.classList.toggle('active', b === btn); }});
            var block = panel.querySelector('pre.code-block');
            if (block) block.textContent = CODE_BANK[btn.dataset.lang] || '';
          }});
        }});
        document.querySelectorAll('.demo-tabs button').forEach(function (tab) {{
          tab.addEventListener('click', function () {{
            var target = tab.dataset.tab;
            document.querySelectorAll('.demo-tabs button').forEach(function (t) {{ t.classList.toggle('active', t === tab); }});
            document.querySelectorAll('.demo-tab-content').forEach(function (c) {{ c.classList.toggle('active', c.dataset.tab === target); }});
          }});
        }});
        AIHPC_ANIM.init();
      }});
      (function () {{
        var c = document.getElementById('particle-canvas');
        if (!c) return;
        var x = c.getContext('2d'); var W, H, P = []; var N = 50, cols = ['#06b6d4', '#8b5cf6', '#ec4899'];
        function r() {{ W = c.width = innerWidth; H = c.height = innerHeight; }} r(); addEventListener('resize', r);
        for (var i = 0; i < N; i++) P.push({{ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-.5)*.2, vy: (Math.random()-.5)*.2, r: Math.random()*1.5+.5, c: cols[i%3] }});
        function s() {{ x.clearRect(0,0,W,H); for (var i = 0; i < N; i++) {{ for (var j = i+1; j < N; j++) {{ var d = Math.hypot(P[i].x-P[j].x, P[i].y-P[j].y); if (d < 100) {{ x.strokeStyle = 'rgba(139,92,246,' + (.12*(1-d/100)) + ')'; x.lineWidth = .5; x.beginPath(); x.moveTo(P[i].x, P[i].y); x.lineTo(P[j].x, P[j].y); x.stroke(); }} }} for (var p of P) {{ p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0; x.fillStyle = p.c; x.globalAlpha = .4; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28); x.fill(); }} x.globalAlpha = 1; requestAnimationFrame(s); }} }} s();
      }})();
      (function () {{
        var KEY = 'aihpc-theme'; var b = document.body, r = document.querySelector('.ribbon'), i = document.getElementById('ribbon-theme-icon');
        function a(t) {{ if (t === 'light') {{ b.classList.add('light'); r && r.classList.add('light'); if (i) i.textContent = 'Sun'; }} else {{ b.classList.remove('light'); r && r.classList.remove('light'); if (i) i.textContent = 'Moon'; }} }}
        var d = 'dark'; try {{ var s = localStorage.getItem(KEY); if (s === 'light' || s === 'dark') d = s; }} catch (e) {{}} a(d);
        var btn = document.getElementById('ribbon-theme-toggle');
        if (btn) btn.addEventListener('click', function () {{ var n = b.classList.contains('light') ? 'dark' : 'light'; a(n); try {{ localStorage.setItem(KEY, n); }} catch (e) {{}} }});
      }})();
    </script>
  </body>
</html>''')
    return '\n'.join(parts)


def main():
    print("Loading LOSS_FUNCTIONS from gen-ml-page.py ...")
    loss_functions = load_loss_functions()
    print(f"  loaded {len(loss_functions)} ML demos")

    os.makedirs(OUT_DIR, exist_ok=True)
    for lf in loss_functions:
        html_str = emit_ml_concept_card(lf)
        out_path = os.path.join(OUT_DIR, f"ml-{lf['id']}.html")
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html_str)
        print(f"  generated: ml-{lf['id']}.html ({len(html_str):,} bytes)")

    print(f"\nTotal: {len(loss_functions)} ML concept cards generated at docs/concepts/ml-<id>.html")


if __name__ == '__main__':
    main()

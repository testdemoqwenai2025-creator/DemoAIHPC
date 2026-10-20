#!/usr/bin/env python3
"""
add-gts-to-science.py — Phase 36 batch script.

Adds sample data tables + the graph-table-sync (GTS) component to
all 22 science sub-pages. Each page gets:
  1. A <table class="data-table"> with 5-7 rows of domain-specific
     sample data (derived from the page's derivation math content).
  2. A <div class="gts-container"> in the Observe/Graphs section.
  3. A <script src="../graph-table-sync.js"> tag.
  4. A GTS registration script that parses the table + configures
     the component with per-page xCol/yCol/curveFn/inflectionFn.

Idempotent.
"""
import os
import re

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
DOCS = os.path.join(ROOT, "docs", "science")

# Per-page sample data + GTS configs
# Each entry: (headers, rows, caption, xCol, yCol, xLabel, yLabel, curveFn, inflectionFn)
PAGE_CONFIGS = {
    "biology/evolutionary.html": (
        ["Pair", "Distance D[i,j]", "Q[i,j]", "Min Q", "Join?"],
        [["1-2", "0.05", "-0.12", "-0.12", "Yes"], ["1-3", "0.08", "-0.08", "-0.12", "No"], ["2-3", "0.03", "-0.15", "-0.15", "Yes"], ["1-4", "0.12", "0.05", "-0.15", "No"], ["2-4", "0.07", "-0.10", "-0.15", "No"], ["3-4", "0.09", "0.02", "-0.15", "No"]],
        "Neighbor-joining: Q-matrix for 4 taxa (3 pairs shown)", 2, 2,
        "Q[i,j]", "Q value", "function(x) { return x; }",
        "function(row) { return parseFloat(row[2]) < -0.13 ? {annotation: 'Q < -0.13: join this pair'} : null; }"
    ),
    "biology/imaging.html": (
        ["Threshold t", "omega0(t)", "omega1(t)", "sigma_b(t)", "Optimal?"],
        [["50", "0.3", "0.7", "0.15", "No"], ["100", "0.2", "0.8", "0.35", "No"], ["128", "0.15", "0.85", "0.62", "Yes"], ["150", "0.1", "0.9", "0.41", "No"], ["200", "0.05", "0.95", "0.22", "No"]],
        "Otsu: between-class variance vs threshold", 0, 3,
        "threshold t", "sigma_b^2", "function(x) { return 0.62 * Math.exp(-Math.pow(x-128,2)/8000); }",
        "function(row) { return parseFloat(row[3]) > 0.55 ? {annotation: 'sigma_b max: optimal threshold'} : null; }"
    ),
    "biology/molecular.html": (
        ["Codon", "AA", "Count", "Freq", "Stop?"],
        [["AUG", "Met", "58", "0.058", "No (start)"], ["UUU", "Phe", "12", "0.012", "No"], ["UAA", "*", "1", "0.001", "Yes"], ["UAG", "*", "0", "0.0", "Yes"], ["UGA", "*", "0", "0.0", "Yes"], ["CUG", "Leu", "8", "0.008", "No"]],
        "Codon table usage for 174nt RNA (58 codons)", 2, 3,
        "count", "frequency", None,
        "function(row) { return row[4].includes('Yes') ? {annotation: 'Stop codon: translation terminates'} : null; }"
    ),
    "biology/proteins.html": (
        ["Residue", "Phi", "Psi", "Region", "Allowed?"],
        [["1", -60, -45, "alpha-helix", "Yes"], ["2", -57, -47, "alpha-helix", "Yes"], ["3", 120, 130, "beta-sheet", "Yes"], ["4", 90, 0, "loop", "Yes"], ["5", 180, 180, "disallowed", "No"], ["6", -60, -50, "alpha-helix", "Yes"]],
        "Ramachandran: phi/psi angles for 6 residues", 1, 2,
        "phi", "psi", None,
        "function(row) { return row[4] === 'No' ? {annotation: 'Disallowed: sterically forbidden'} : null; }"
    ),
    "biology/systems.html": (
        ["Step", "dt", "k1", "k4", "y_new"],
        [["0", "0.1", "0.50", "0.55", "1.050"], ["1", "0.1", "0.52", "0.57", "1.103"], ["2", "0.1", "0.55", "0.60", "1.158"], ["3", "0.1", "0.58", "0.63", "1.216"], ["4", "0.1", "0.61", "0.66", "1.277"]],
        "RK4: 4-stage slopes for dy/dt=y (exponential)", 0, 4,
        "step", "y", "function(x) { return Math.exp(x * 0.1); }",
        "function(row, i, rows) { return i === rows.length - 1 ? {annotation: 'RK4: O(h^4) accuracy'} : null; }"
    ),
    "chemistry/analytical.html": (
        ["Sample", "Wavelength", "Intensity", "I'", "Peak?"],
        [["1", "420", "85", "0.2", "No"], ["2", "430", "65", "-0.5", "No"], ["3", "440", "30", "-1.2", "Yes (min)"], ["4", "450", "55", "0.8", "No"], ["5", "460", "90", "1.5", "No"]],
        "Peak detection: intensity + derivative", 1, 3,
        "wavelength", "I'", "function(x) { return 0.5*(x-440); }",
        "function(row) { return parseFloat(row[3]) < -1 ? {annotation: 'I crosses zero: peak detected'} : null; }"
    ),
    "chemistry/computational.html": (
        ["Step", "x(t)", "x(t+dt)", "v", "a"],
        [["0", "1.0", "1.05", "0.50", "-0.50"], ["1", "1.05", "1.09", "0.45", "-0.48"], ["2", "1.09", "1.12", "0.40", "-0.45"], ["3", "1.12", "1.14", "0.35", "-0.42"], ["4", "1.14", "1.15", "0.30", "-0.40"]],
        "Verlet: position/velocity/acceleration trajectory", 0, 1,
        "step", "x(t)", None,
        "function(row, i, rows) { return i === 0 ? {annotation: 'Step 1: F = -dV/dx = -kx'} : null; }"
    ),
    "chemistry/inorganic.html": (
        ["Atom", "x", "y", "z", "Chain"],
        [["Fe", "0.00", "0.00", "0.00", "A"], ["O", "1.60", "0.00", "0.00", "A"], ["Fe", "3.20", "0.00", "0.00", "A"], ["O", "0.80", "1.60", "0.00", "B"], ["Fe", "2.40", "1.60", "0.00", "B"]],
        "CIF: atomic positions for Fe2O3 unit cell", 1, 2,
        "x", "y", None,
        "function(row) { return row[0] === 'Fe' ? {annotation: 'Fe atom: magnetic moment carrier'} : null; }"
    ),
    "chemistry/materials.html": (
        ["Point", "x", "y", "Polar angle", "On hull?"],
        [["1", "0.0", "0.0", "0.0", "Yes"], ["2", "1.0", "0.0", "0.0", "Yes"], ["3", "1.0", "1.0", "45.0", "Yes"], ["4", "0.5", "0.5", "45.0", "No (inside)"], ["5", "0.0", "1.0", "90.0", "Yes"]],
        "Convex hull: 5 points (4 on hull, 1 inside)", 1, 2,
        "x", "y", None,
        "function(row) { return row[4].includes('No') ? {annotation: 'Inside hull: not a vertex'} : null; }"
    ),
    "chemistry/organic.html": (
        ["Bond", "Type", "Order", "Length (A)", "Energy (kJ/mol)"],
        [["C-C", "single", "1", "1.54", "347"], ["C=C", "double", "2", "1.34", "614"], ["C#C", "triple", "3", "1.20", "839"], ["C-O", "single", "1", "1.43", "360"], ["C=O", "double", "2", "1.21", "745"]],
        "SMILES: bond properties (order vs length/energy)", 2, 3,
        "bond order", "length (A)", "function(x) { return 1.54 - 0.17 * (x-1); }",
        "function(row) { return parseInt(row[2]) === 3 ? {annotation: 'Triple bond: shortest + strongest'} : null; }"
    ),
    "chemistry/physical.html": (
        ["T (K)", "k (rate)", "ln k", "1/T", "Arrhenius?"],
        [["300", "1.0e-3", "-6.9", "0.0033", "Yes"], ["350", "5.0e-3", "-5.3", "0.0029", "Yes"], ["400", "2.0e-2", "-3.9", "0.0025", "Yes"], ["450", "6.0e-2", "-2.8", "0.0022", "Yes"], ["500", "1.5e-1", "-1.9", "0.0020", "Yes"]],
        "Arrhenius: rate vs temperature (linear in 1/T vs ln k)", 3, 2,
        "1/T", "ln k", "function(x) { return -5000 * x + 9.5; }",
        "function(row, i) { return i === 0 ? {annotation: 'Slope = -Ea/R = -5000'} : null; }"
    ),
    "maths/algebra.html": (
        ["Step", "a", "b", "a mod b", "gcd"],
        [["0", "48", "18", "12", "?"], ["1", "18", "12", "6", "?"], ["2", "12", "6", "0", "6"]],
        "Euclidean GCD: gcd(48, 18) = 6 (converges in 3 steps)", 0, 1,
        "a", "b", None,
        "function(row) { return parseFloat(row[3]) === 0 ? {annotation: 'b=0: gcd = ' + row[1]} : null; }"
    ),
    "maths/analysis.html": (
        ["i", "x_i", "f(x_i)", "Trap area", "Cumulative"],
        [["0", "0.0", "0.0", "0.0", "0.0"], ["1", "0.25", "0.0625", "0.0078", "0.0078"], ["2", "0.50", "0.25", "0.0391", "0.0469"], ["3", "0.75", "0.5625", "0.1016", "0.1484"], ["4", "1.0", "1.0", "0.1953", "0.3438"]],
        "Trapezoidal rule: integral of x^2 on [0,1] (n=4, h=0.25)", 0, 1,
        "x_i", "f(x_i)", "function(x) { return x * x; }",
        "function(row, i) { return i === 4 ? {annotation: 'I = 0.3438 (exact = 1/3 = 0.3333)'} : null; }"
    ),
    "maths/number-theory.html": (
        ["a", "n-1=2^s*d", "a^d mod n", "Is prime?"],
        [["2", "100=4*25", "0x4D5", "Probably"], ["3", "100=4*25", "0x1F9", "Probably"], ["5", "100=4*25", "0x1", "Probably"], ["7", "100=4*25", "0x1", "Probably"], ["21", "100=4*25", "0x1", "Composite (liar)"]],
        "Miller-Rabin: witnesses for n=101 (prime)", 0, 2,
        "witness a", "a^d mod n", None,
        "function(row) { return row[3].includes('Composite') ? {annotation: 'Composite: n is NOT prime'} : null; }"
    ),
    "maths/probability.html": (
        ["Step", "x", "P(x)", "Accept?", "Chain state"],
        [["0", "0.5", "0.61", "Yes", "0.5"], ["1", "0.7", "0.40", "Yes", "0.7"], ["2", "0.9", "0.25", "No", "0.7"], ["3", "0.3", "0.74", "Yes", "0.3"], ["4", "0.4", "0.67", "Yes", "0.4"]],
        "Metropolis-Hastings: 5 MCMC steps (target = N(0,1))", 0, 1,
        "step", "x", "function(x) { return Math.exp(-x*x/2) / Math.sqrt(2*Math.PI); }",
        "function(row) { return row[3] === 'No' ? {annotation: 'Rejected: stay at current x'} : null; }"
    ),
    "maths/geometry.html": (
        ["N", "Vertices", "Edges", "Faces", "Cells", "Name"],
        [["4", "16", "32", "24", "8", "Tesseract"], ["5", "32", "80", "80", "40", "Penteract"], ["6", "64", "192", "240", "160", "Hexeract"], ["7", "128", "448", "672", "560", "Hepteract"], ["8", "256", "1024", "1792", "1792", "Octeract"], ["10", "1024", "5120", "11520", "15360", "Decaeract"]],
        "N-cube combinatorics: C(N,k) * 2^(N-k)", 0, 1,
        "N (dim)", "vertices", "function(x) { return Math.pow(2, x); }",
        "function(row) { return parseInt(row[0]) === 10 ? {annotation: '10D: 1024 vertices!'} : null; }"
    ),
    "physics/mechanics.html": (
        ["t", "T", "V", "L=T-V", "E-L"],
        [["0", "50", "0", "50", "d/dt(m*v) - 0 = 0"], ["1", "48", "2", "46", "d/dt(m*v) + k*x = 0"], ["2", "45", "5", "40", "d/dt(m*v) + k*x = 0"], ["3", "40", "10", "30", "d/dt(m*v) + k*x = 0"], ["4", "32", "18", "14", "d/dt(m*v) + k*x = 0"]],
        "Lagrangian: T-V for a spring (k=1, m=1)", 0, 3,
        "t", "L=T-V", None,
        "function(row, i) { return i === 0 ? {annotation: 'L=T-V: Lagrangian mechanics'} : null; }"
    ),
    "physics/quantum.html": (
        ["alpha", "beta", "P(0)", "P(1)", "After H?"],
        [["1.0", "0.0", "1.0", "0.0", "No"], ["0.5+0.5i", "0.5+0.5i", "0.5", "0.5", "Yes (super)"], ["0.707", "0.707", "0.5", "0.5", "Yes (super)"], ["0.0", "1.0", "0.0", "1.0", "No"], ["0.6", "0.8", "0.36", "0.64", "Yes (super)"]],
        "Hadamard: qubit states before/after H gate", 0, 2,
        "|alpha|^2", "P(0)", "function(x) { return x; }",
        "function(row) { return row[4].includes('super') ? {annotation: 'H creates superposition'} : null; }"
    ),
    "physics/sound.html": (
        ["Frame", "Time (s)", "Freq (Hz)", "Magnitude", "Peak?"],
        [["0", "0.00", "100", "0.8", "No"], ["1", "0.01", "200", "0.3", "No"], ["2", "0.02", "440", "0.9", "Yes"], ["3", "0.03", "880", "0.6", "No"], ["4", "0.04", "1760", "0.2", "No"]],
        "STFT: 5 frames showing A440 (440 Hz) peak", 1, 2,
        "freq (Hz)", "magnitude", None,
        "function(row) { return parseFloat(row[2]) === 440 ? {annotation: 'A440: concert pitch'} : null; }"
    ),
    "physics/space.html": (
        ["Body", "x", "y", "Fx", "Fy"],
        [["Sun", "0", "0", "0", "0"], ["Earth", "1.0", "0", "-3.5e22", "0"], ["Mars", "1.5", "0", "-1.6e22", "0"], ["Moon", "1.0", "0.0026", "-2.0e20", "0"], ["Jupiter", "5.2", "0", "-1.3e21", "0"]],
        "N-body: gravitational forces on 5 bodies", 1, 3,
        "x", "Fx", "function(x) { return -3.5e22 / (x*x); }",
        "function(row) { return row[0] === 'Sun' ? {annotation: 'Sun: F=0 (center of mass)'} : null; }"
    ),
    "physics/thermo.html": (
        ["v (m/s)", "f(v)", "v_p", "v_rms", "v_mean"],
        [["100", "0.002", "404", "497", "446"], ["300", "0.014", "404", "497", "446"], ["404", "0.018", "404", "497", "446"], ["600", "0.012", "404", "497", "446"], ["1000", "0.002", "404", "497", "446"]],
        "Maxwell-Boltzmann: speed distribution for N2 at 300K", 0, 1,
        "v (m/s)", "f(v)", "function(x) { return 0.018 * Math.exp(-Math.pow(x-404,2)/80000); }",
        "function(row) { return parseFloat(row[0]) === 404 ? {annotation: 'v_p = 404 m/s (most probable)'} : null; }"
    ),
    "physics/waves.html": (
        ["k", "Re(X[k])", "Im(X[k])", "|X[k]|", "Peak?"],
        [["0", "5.0", "0.0", "5.0", "No (DC)"], ["1", "0.5", "-0.3", "0.58", "No"], ["2", "8.0", "-3.0", "8.54", "Yes"], ["3", "0.3", "0.1", "0.32", "No"], ["4", "0.1", "0.0", "0.1", "No"]],
        "FFT: 5 frequency bins showing peak at k=2 (440 Hz)", 0, 3,
        "k (freq bin)", "|X[k]|", None,
        "function(row) { return row[4].includes('Yes') ? {annotation: 'Peak at k=2: dominant frequency'} : null; }"
    ),
}

def patch_page(rel_path, config):
    path = os.path.join(DOCS, rel_path)
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()

    headers, rows, caption, xCol, yCol, xLabel, yLabel, curveFn, inflectionFn = config

    # Skip if already patched
    if 'class="gts-container"' in s:
        return "skipped"

    # 1. Add graph-table-sync.js script tag
    if "graph-table-sync.js" not in s:
        s = s.replace("</head>", '    <script src="../graph-table-sync.js"></script>\n  </head>', 1)

    # 2. Build the data table + GTS container HTML
    thead = ''.join(f'<th>{h}</th>' for h in headers)
    tbody_rows = []
    for i, row in enumerate(rows):
        tds = ''.join(f'<td>{c}</td>' for c in row)
        hidden = ' data-table-hidden' if i >= 5 else ''
        tbody_rows.append(f'<tr class="data-table-row{hidden}">{tds}</tr>')
    tbody = '\n'.join(tbody_rows)
    n_hidden = max(0, len(rows) - 5)

    table_html = f'''      <h2>Data sample</h2>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">{caption} · click "Show more" for additional rows.</p>
      <div class="data-table-container" style="overflow-x: auto; background: var(--bg-elevated, #121826); border: 1px solid var(--border, #1f2937); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table class="data-table" data-total-rows="{len(rows)}" data-visible-rows="5" style="width: 100%; border-collapse: collapse;">
          <thead><tr>{thead}</tr></thead>
          <tbody>{tbody}</tbody>
        </table>
        {f'<button class="data-table-show-more" style="margin-top: 12px; background: var(--bg-elevated-2, #1a2133); border: 1px solid var(--border-strong, #2a3548); color: var(--text, #f3f4f6); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" onclick="dataTableShowMore(this)">Show more ({n_hidden} hidden)</button>' if n_hidden > 0 else ''}
      </div>
      <div class="gts-container" data-gts-id="gts-{rel_path.replace("/", "-").replace(".html", "")}" style="padding: 16px; background: var(--bg-elevated, #121826); border: 1px solid var(--border, #1f2937); border-radius: 8px; margin-bottom: 24px;"></div>
      <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted-2);">Press Play to animate the table values onto the graph. Math annotations appear at inflection points.</div>'''

    # 3. Insert before the meta footer
    meta_idx = s.find('<div class="meta">')
    if meta_idx < 0:
        return "no-meta"
    s = s[:meta_idx] + table_html + '\n\n      ' + s[meta_idx:]

    # 4. Add GTS registration + data table show-more JS
    gts_id = f"gts-{rel_path.replace('/', '-').replace('.html', '')}"
    gts_js = f'''
      // Phase 36: Graph-table-sync + data table show-more
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
      (function () {{
        var card = document.querySelector('.gts-container');
        if (!card || !window.AIHPC_GTS) return;
        var table = document.querySelector('.data-table');
        if (!table) return;
        var headers = [];
        table.querySelectorAll('thead th').forEach(function (th) {{ headers.push(th.textContent.trim()); }});
        var rows = [];
        table.querySelectorAll('tbody tr').forEach(function (tr) {{
          var row = [];
          tr.querySelectorAll('td').forEach(function (td) {{ row.push(td.textContent.trim()); }});
          rows.push(row);
        }});
        AIHPC_GTS.register('{gts_id}', {{
          title: '{caption}',
          headers: headers,
          rows: rows,
          xCol: {xCol},
          yCol: {yCol},
          xLabel: '{xLabel}',
          yLabel: '{yLabel}',
          curveFn: {str(curveFn) if curveFn is not None else "null"},
          inflectionFn: {inflectionFn},
          duration: 6,
        }});
        AIHPC_GTS.init();
      }})();
'''
    # Insert before the ribbon theme toggle
    theme_idx = s.find("// ---- Ribbon theme toggle")
    if theme_idx < 0:
        theme_idx = s.find("// Ribbon theme")
    if theme_idx >= 0:
        s = s[:theme_idx] + gts_js + "      " + s[theme_idx:]
    else:
        # Insert before last </script>
        idx = s.rfind('</script>')
        if idx >= 0:
            s = s[:idx] + gts_js + "    " + s[idx:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(s)
    return "patched"


def main():
    patched = 0
    skipped = 0
    failed = 0
    for rel, config in PAGE_CONFIGS.items():
        result = patch_page(rel, config)
        if result == "patched":
            patched += 1
            print(f"  ✓ {rel}")
        elif result == "skipped":
            skipped += 1
        else:
            failed += 1
            print(f"  ⚠ {rel}: {result}")
    print(f"\nPatched: {patched} | Skipped: {skipped} | Failed: {failed} | Total: {len(PAGE_CONFIGS)}")

if __name__ == "__main__":
    main()

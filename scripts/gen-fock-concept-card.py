#!/usr/bin/env python3
"""gen-fock-concept-card.py — Phase 44

Auto-generates docs/concepts/fock-state.html — a concept card for the
Fock state viewer (Phase 42), following the same pattern as the digest
concept cards + ML concept cards. Includes:

  - 6-language polyglot code (Python / Rust / Go / C / Elixir / Scala)
    for ψ_n(x), a|n⟩, a†|n⟩
  - 5-step Math→Code derivation
  - Observe block (stats + report + graph_svg + summary)
  - N-D parallel-coords strip (auto-embedded)
  - Data table (sample Fock state properties)
  - Animated-derivation canvas
  - Phase 42 Math→Code→Output pedagogy block

Run: python3 scripts/gen-fock-concept-card.py
"""
import os
import html
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
OUT_PATH = os.path.join(DOCS, "concepts", "fock-state.html")

CODE = {
    "python": (
        "# ψ_n(x) = (1/√(2^n · n!)) · H_n(ξ) · e^(-ξ²/2)\n"
        "# a|n⟩ = √n · |n-1⟩  a†|n⟩ = √(n+1) · |n+1⟩\n"
        "# n -> Fock state index  x -> position  H -> Hermite polynomial\n"
        "import numpy as np\n"
        "from scipy.special import hermite\n\n"
        "def psi(n, x, hw=1.0):\n"
        "    norm = 1.0 / np.sqrt(2**n * np.math.factorial(n) * np.sqrt(np.pi))\n"
        "    H_n = hermite(n)  # Hermite polynomial\n"
        "    gaussian = np.exp(-x*x / 2)\n"
        "    return norm * H_n(x) * gaussian\n\n"
        "def annihilate(n):\n"
        "    # a|n⟩ = √n · |n-1⟩\n"
        "    return (np.sqrt(n), n - 1) if n > 0 else (0.0, n)\n\n"
        "def create(n, max_n=8):\n"
        "    # a†|n⟩ = √(n+1) · |n+1⟩\n"
        "    return (np.sqrt(n + 1), n + 1) if n < max_n else (0.0, n)"
    ),
    "rust": (
        "fn hermite(n: u32, x: f64) -> f64 {\n"
        "    if n == 0 { return 1.0; }\n"
        "    if n == 1 { return 2.0 * x; }\n"
        "    let mut h_prev = 1.0;\n"
        "    let mut h_cur = 2.0 * x;\n"
        "    for k in 2..=n {\n"
        "        let h_next = 2.0 * x * h_cur - 2.0 * (k - 1) as f64 * h_prev;\n"
        "        h_prev = h_cur; h_cur = h_next;\n"
        "    }\n"
        "    h_cur\n"
        "}\n"
        "fn psi(n: u32, x: f64) -> f64 {\n"
        "    let norm = 1.0 / (2.0_f64.powi(n as i32) * (1..=n).product::<u32>() as f64 * (std::f64::consts::PI).sqrt()).sqrt();\n"
        "    norm * hermite(n, x) * (-x*x / 2.0).exp()\n"
        "}\n"
        "fn annihilate(n: u32) -> (f64, i32) {\n"
        "    if n > 0 { ((n as f64).sqrt(), (n - 1) as i32) } else { (0.0, n as i32) }\n"
        "}\n"
        "fn create(n: u32, max_n: u32) -> (f64, u32) {\n"
        "    if n < max_n { ((n + 1) as f64).sqrt(), n + 1) } else { (0.0, n) }\n"
        "}"
    ),
    "go": (
        "func Hermite(n uint, x float64) float64 {\n"
        "\tif n == 0 { return 1.0 }\n"
        "\tif n == 1 { return 2.0 * x }\n"
        "\thPrev, hCur := 1.0, 2.0*x\n"
        "\tfor k := uint(2); k <= n; k++ {\n"
        "\t\thNext := 2.0*x*hCur - 2.0*float64(k-1)*hPrev\n"
        "\t\thPrev, hCur = hCur, hNext\n"
        "\t}\n"
        "\treturn hCur\n"
        "}\n"
        "func Psi(n uint, x float64) float64 {\n"
        "\tnorm := 1.0 / math.Sqrt(math.Pow(2, float64(n)) * float64(factorial(n)) * math.Sqrt(math.Pi))\n"
        "\treturn norm * Hermite(n, x) * math.Exp(-x*x/2)\n"
        "}\n"
        "func Annihilate(n uint) (float64, int) {\n"
        "\tif n > 0 { return math.Sqrt(float64(n)), int(n - 1) }\n"
        "\treturn 0.0, int(n)\n"
        "}\n"
        "func Create(n, maxN uint) (float64, uint) {\n"
        "\tif n < maxN { return math.Sqrt(float64(n + 1)), n + 1 }\n"
        "\treturn 0.0, n\n"
        "}"
    ),
    "c": (
        "double hermite(unsigned n, double x) {\n"
        "    if (n == 0) return 1.0;\n"
        "    if (n == 1) return 2.0 * x;\n"
        "    double h_prev = 1.0, h_cur = 2.0 * x;\n"
        "    for (unsigned k = 2; k <= n; k++) {\n"
        "        double h_next = 2.0 * x * h_cur - 2.0 * (k - 1) * h_prev;\n"
        "        h_prev = h_cur; h_cur = h_next;\n"
        "    }\n"
        "    return h_cur;\n"
        "}\n"
        "double psi(unsigned n, double x) {\n"
        "    double norm = 1.0 / sqrt(pow(2, n) * factorial(n) * sqrt(M_PI));\n"
        "    return norm * hermite(n, x) * exp(-x * x / 2.0);\n"
        "}\n"
        "void annihilate(unsigned n, double* coef, int* new_n) {\n"
        "    *coef = n > 0 ? sqrt((double)n) : 0.0;\n"
        "    *new_n = n > 0 ? (int)(n - 1) : (int)n;\n"
        "}\n"
        "void create(unsigned n, unsigned max_n, double* coef, unsigned* new_n) {\n"
        "    *coef = n < max_n ? sqrt((double)(n + 1)) : 0.0;\n"
        "    *new_n = n < max_n ? n + 1 : n;\n"
        "}"
    ),
    "elixir": (
        "defmodule Fock do\n"
        "  def hermite(0, _x), do: 1.0\n"
        "  def hermite(1, x), do: 2.0 * x\n"
        "  def hermite(n, x) do\n"
        "    hermite_rec(n, x, 1.0, 2.0 * x, 2)\n"
        "  end\n"
        "  defp hermite_rec(n, _x, _h_prev, h_cur, k) when k > n, do: h_cur\n"
        "  defp hermite_rec(n, x, h_prev, h_cur, k) do\n"
        "    h_next = 2.0 * x * h_cur - 2.0 * (k - 1) * h_prev\n"
        "    hermite_rec(n, x, h_cur, h_next, k + 1)\n"
        "  end\n\n"
        "  def psi(n, x) do\n"
        "    norm = 1.0 / :math.sqrt(:math.pow(2, n) * factorial(n) * :math.sqrt(:math.pi))\n"
        "    norm * hermite(n, x) * :math.exp(-x * x / 2.0)\n"
        "  end\n\n"
        "  def annihilate(0), do: {0.0, 0}\n"
        "  def annihilate(n), do: {:math.sqrt(n * 1.0), n - 1}\n\n"
        "  def create(n, max_n) when n < max_n, do: {:math.sqrt((n + 1) * 1.0), n + 1}\n"
        "  def create(n, _max_n), do: {0.0, n}\n"
        "end"
    ),
    "scala": (
        "def hermite(n: Int, x: Double): Double = {\n"
        "  if (n == 0) 1.0\n"
        "  else if (n == 1) 2.0 * x\n"
        "  else {\n"
        "    var hPrev = 1.0; var hCur = 2.0 * x\n"
        "    for (k <- 2 to n) {\n"
        "      val hNext = 2.0 * x * hCur - 2.0 * (k - 1) * hPrev\n"
        "      hPrev = hCur; hCur = hNext\n"
        "    }\n"
        "    hCur\n"
        "  }\n"
        "}\n"
        "def psi(n: Int, x: Double): Double = {\n"
        "  val norm = 1.0 / math.sqrt(math.pow(2, n) * factorial(n) * math.sqrt(math.Pi))\n"
        "  norm * hermite(n, x) * math.exp(-x * x / 2.0)\n"
        "}\n"
        "def annihilate(n: Int): (Double, Int) =\n"
        "  if (n > 0) (math.sqrt(n), n - 1) else (0.0, n)\n"
        "def create(n: Int, maxN: Int): (Double, Int) =\n"
        "  if (n < maxN) (math.sqrt(n + 1), n + 1) else (0.0, n)"
    ),
}

DERIVATION = [
    ("Step 1: The wavefunction", "ψ_n(x) = (1/√(2^n · n!)) · (mω/πℏ)^(1/4) · H_n(ξ) · e^(-ξ²/2)",
     "Each Fock state |n⟩ has a wavefunction ψ_n(x) given by a Gaussian envelope e^(-ξ²/2) multiplied by the n-th Hermite polynomial H_n(ξ), where ξ = x·√(mω/ℏ) is the dimensionless position. The normalization ensures ∫|ψ_n|² dx = 1."),
    ("Step 2: Energy quantisation", "E_n = (n + ½) · ℏω",
     "Energy is quantised in units of ℏω. The ground state |0⟩ has zero-point energy ½ℏω — a purely quantum effect with no classical analogue. Each excited state adds exactly one quantum ℏω."),
    ("Step 3: Annihilation operator", "a|n⟩ = √n · |n-1⟩",
     "The annihilation operator a removes one quantum of energy. The coefficient √n arises from the normalisation: ⟨n|a†a|n⟩ = n (the number operator). At n=0, a|0⟩ = 0 (cannot remove a quantum from the vacuum)."),
    ("Step 4: Creation operator", "a†|n⟩ = √(n+1) · |n+1⟩",
     "The creation operator a† adds one quantum. The coefficient √(n+1) ensures that a†a (the number operator N̂) gives N̂|n⟩ = n|n⟩. Together, a and a† satisfy the canonical commutation relation [a, a†] = 1."),
    ("Step 5: Hermite polynomial recurrence", "H_{n+1}(ξ) = 2ξ·H_n(ξ) - 2n·H_{n-1}(ξ)",
     "Hermite polynomials satisfy a three-term recurrence: H_0=1, H_1=2ξ, and each subsequent H_n is computed from the previous two. This makes ψ_n(x) efficiently computable for any n via O(n) multiplications — the foundation of all quantum-oscillator numerics."),
]

STATS = [
    {"label": "Type", "value": "Second quantisation"},
    {"label": "Basis", "value": "Fock (number) states |n⟩"},
    {"label": "Energy", "value": "E_n = (n+½)ℏω"},
    {"label": "Wavefunction", "value": "ψ_n = H_n(ξ)·e^(-ξ²/2)"},
    {"label": "Ladder operators", "value": "a, a† with [a,a†]=1"},
    {"label": "Used in", "value": "QuTiP, PennyLane-SF, Qiskit, GKP codes"},
]

SUMMARY = [
    "Fock states |n⟩ are the energy eigenstates of the quantum harmonic oscillator.",
    "E_n = (n+½)ℏω — energy is quantised in units of ℏω, with zero-point energy ½ℏω.",
    "Ladder operators: a|n⟩ = √n·|n-1⟩ (annihilation), a†|n⟩ = √(n+1)·|n+1⟩ (creation).",
    "Wavefunctions via Hermite polynomials: H_{n+1} = 2ξ·H_n - 2n·H_{n-1}.",
]

REPORT = (
    "The quantum harmonic oscillator in the Fock (number-state) basis is the "
    "building block of second quantisation, quantum field theory, and "
    "condensed-matter physics. Fock states |n⟩ have quantised energy E_n = (n+½)ℏω "
    "with wavefunctions ψ_n(x) involving the n-th Hermite polynomial. The ladder "
    "operators a (annihilation, removes 1 quantum) and a† (creation, adds 1 quantum) "
    "satisfy [a, a†] = 1. The number operator N̂ = a†a counts quanta: N̂|n⟩ = n|n⟩. "
    "Pure client-side: Hermite polynomials via recurrence; factorial precomputed. "
    "For large bosonic systems (n > 100) use QuTiP server-side."
)

GRAPH_SVG = '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><rect x="40" y="160" width="60" height="20" fill="#06b6d4"/><text x="70" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">|0⟩ ½ℏω</text><rect x="130" y="140" width="60" height="40" fill="#8b5cf6"/><text x="160" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">|1⟩ 3/2ℏω</text><rect x="220" y="120" width="60" height="60" fill="#ec4899"/><text x="250" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">|2⟩ 5/2ℏω</text><rect x="310" y="100" width="60" height="80" fill="#f59e0b"/><text x="340" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">|3⟩ 7/2ℏω</text><text x="200" y="15" text-anchor="middle" font-size="10" fill="#06b6d4" font-family="ui-monospace">Energy ladder E_n = (n+½)ℏω</text></svg>'

SAMPLE_DATA = {
    "headers": ["n", "E_n / ℏω", "nodes", "a|n⟩ coef √n", "a†|n⟩ coef √(n+1)"],
    "rows": [["0", "0.5", "0", "0.000", "1.000"], ["1", "1.5", "1", "1.000", "1.414"], ["2", "2.5", "2", "1.414", "1.732"], ["3", "3.5", "3", "1.732", "2.000"], ["4", "4.5", "4", "2.000", "2.236"], ["5", "5.5", "5", "2.236", "2.449"], ["6", "6.5", "6", "2.449", "2.646"], ["7", "7.5", "7", "2.646", "2.828"], ["8", "8.5", "8", "2.828", "3.000"]],
    "caption": "Fock state properties: energy levels E_n = (n+½)ℏω, wavefunction nodes (= n), and ladder operator coefficients √n / √(n+1)."
}


def main():
    print(f"Generating {OUT_PATH}...")
    parts = ['<!doctype html>', '<html lang="en">', '<head>',
             '<meta charset="utf-8" />',
             '<meta name="viewport" content="width=device-width, initial-scale=1" />',
             '<meta name="description" content="Fock state viewer concept card — second quantisation, quantum harmonic oscillator, creation/annihilation operators. 6-language polyglot code + Math→Code→Output pedagogy. Phase 44." />',
             '<title>Fock State Viewer — Second Quantisation — AIHPC Advanced</title>',
             '<style>',
             ':root { --bg:#0b0f1a; --bg-elevated:#121826; --border:#1f2937; --text:#f3f4f6; --text-muted:#9ca3af; --accent:#8b5cf6; --accent-2:#06b6d4; }',
             '* { box-sizing: border-box; } html, body { margin: 0; padding: 0; }',
             'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(1200px 600px at 20% -10%, rgba(139,92,246,0.15), transparent 60%), var(--bg); color: var(--text); min-height: 100vh; line-height: 1.7; }',
             '.container { max-width: 1100px; margin: 0 auto; padding: 24px; }',
             'h1 { font-size: 32px; background: linear-gradient(90deg,#06b6d4,#8b5cf6); -webkit-background-clip: text; background-clip: text; color: transparent; }',
             'h2 { font-size: 20px; margin: 24px 0 12px; color: var(--accent-2); }',
             'h3 { font-size: 14px; color: var(--accent-2); text-transform: uppercase; letter-spacing: 0.08em; }',
             'pre { background: var(--bg-elevated); padding: 14px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.6; color: #f3f4f6; font-family: SF Mono, Menlo, monospace; border: 1px solid var(--border); }',
             'table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: ui-monospace, SF Mono, monospace; }',
             'th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border); }',
             'th { color: var(--accent-2); }',
             'td { color: var(--text-muted); }',
             '.ribbon { position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(139,92,246,0.25); background: linear-gradient(180deg, rgba(7,9,15,0.95) 0%, rgba(11,15,26,0.85) 100%); backdrop-filter: blur(12px); box-shadow: 0 1px 0 0 rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.4); }',
             '.ribbon::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: linear-gradient(90deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%); opacity: 0.7; }',
             '.ribbon-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; gap: 12px; }',
             '.ribbon-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text); font-weight: 600; }',
             '.ribbon-logo { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#06b6d4,#8b5cf6,#d946ef); color: white; font-size: 12px; font-weight: 700; }',
             '.ribbon-name { display: none; } @media (min-width: 600px) { .ribbon-name { display: inline; } }',
             '.ribbon-nav { display: flex; align-items: center; gap: 4px; }',
             '.ribbon-dropdown { position: relative; }',
             '.ribbon-dropdown > summary { list-style: none; cursor: pointer; padding: 6px 12px; border-radius: 6px; font-size: 14px; color: var(--text-muted); }',
             '.ribbon-dropdown > summary::-webkit-details-marker { display: none; }',
             '.ribbon-dropdown > summary::after { content: "▾"; font-size: 10px; opacity: 0.6; }',
             '.ribbon-dropdown[open] > summary { background: var(--bg-elevated); color: var(--text); }',
             '.ribbon-menu { position: absolute; top: 100%; left: 0; margin-top: 4px; min-width: 240px; background: var(--bg-elevated); border: 1px solid #2a3548; border-radius: 12px; padding: 6px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 2px; max-height: 70vh; overflow: auto; }',
             '.ribbon-menu a { text-decoration: none; color: var(--text-muted); font-size: 13px; padding: 6px 10px; border-radius: 6px; }',
             '.ribbon-actions { margin-left: auto; }',
             '.ribbon-btn-primary { display: inline-flex; align-items: center; padding: 6px 16px; border-radius: 9999px; background: linear-gradient(90deg,#8b5cf6,#06b6d4); color: white; text-decoration: none; font-size: 13px; font-weight: 600; }',
             '</style>',
             '</head>', '<body>',
             '<header class="ribbon"><div class="ribbon-inner">'
             '<a href="../index.html" class="ribbon-brand"><span class="ribbon-logo">A</span><span class="ribbon-name">AIHPC Advanced</span></a>'
             '<nav class="ribbon-nav">'
             '<details class="ribbon-dropdown"><summary>Platform</summary><div class="ribbon-menu"><a href="../index.html">Home</a><a href="../demos.html">Demos</a><a href="../dashboard.html">Dashboard</a><a href="../graph.html">Knowledge Graph</a><a href="../subscribe.html">Subscribe</a><a href="../playground.html">🧪 Playground</a></div></details>'
             '<details class="ribbon-dropdown"><summary>AETHEL Suite</summary><div class="ribbon-menu"><a href="../aethel.html">AETHEL Connector</a><a href="../connectors.html">Connectors</a><a href="../query.html">Query Executor</a><a href="../graph.html">Knowledge Graph</a><a href="../workflows.html">Workflows</a></div></details>'
             '<details class="ribbon-dropdown"><summary>Science</summary><div class="ribbon-menu"><a href="../science-biology.html">Biology Hub</a><a href="../science-chemistry.html">Chemistry Hub</a><a href="../science-physics.html">Physics Hub</a><a href="../science-maths.html">Maths Hub</a><a href="../science-ml.html">🤖 ML</a><a href="../science-bioinformatics.html">Bioinformatics</a><a href="../science-cheminformatics.html">Cheminformatics</a><a href="../bloch.html">⚛️ Bloch Shorts</a><a href="../quantum-shorts.html">🎬 Quantum Shorts</a><a href="../medical-atlas.html">🏥 Medical Atlas</a><a href="../science/physics/quantum.html">Quantum Mechanics</a></div></details>'
             '<details class="ribbon-dropdown"><summary>Insights</summary><div class="ribbon-menu"><a href="../digest.html">Weekly Science Digest</a><a href="../audit.html">📊 Audit Dashboard</a><a href="../dashboard.html">KG Dashboard</a><a href="../concepts.html">Concept Cards</a></div></details>'
             '</nav>'
             '<div class="ribbon-actions"><a href="../science-physics.html" class="ribbon-btn-primary">Physics Hub</a></div>'
             '</div></header>',
             '<div class="container">']

    parts.append('<p style="font-size: 13px; color: var(--text-muted);"><a href="../science/physics/quantum.html" style="color: var(--accent-2); text-decoration: none;">← Back to Quantum Mechanics</a></p>')
    parts.append('<h1>Fock State Viewer — Second Quantisation</h1>')
    parts.append('<p style="font-size: 14px; color: var(--text-muted); margin: 0 0 24px;">Concept card for the Fock state viewer (Phase 42). Visualises the quantum harmonic oscillator in the Fock (number-state) basis with animated creation (a†) and annihilation (a) operators. Part of the Bloch → VQC → second-quantisation triad. <a href="../science/physics/quantum.html#quantum-fock-container" style="color: var(--accent-2);">View live on the quantum page →</a></p>')

    # N-D properties strip
    nd_props = [
        {'label': 'Component', 'value': 'fock-state-viewer.js'},
        {'label': 'Phase', 'value': '42'},
        {'label': 'Max states', 'value': '|0⟩ to |8⟩'},
        {'label': 'Wavefunction', 'value': 'Hermite polynomial'},
        {'label': 'Operators', 'value': 'a, a† (ladder)'},
        {'label': 'Record', 'value': 'WebM (9:16)'},
    ]
    nd_cells = ''.join([
        '<div style="display:flex;flex-direction:column;flex:1;min-width:0;padding:0 6px;border-right:1px solid var(--border);">'
        '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">' + html.escape(p['label']) + '</div>'
        '<div style="font-size:10px;color:#f3f4f6;font-family:SF Mono,Menlo,monospace;">' + html.escape(p['value']) + '</div>'
        '</div>' for p in nd_props
    ])
    parts.append('<section style="margin: 16px 0; padding: 12px; background: rgba(11,15,26,0.6); border-radius: 10px; border: 1px solid var(--border);">'
                 '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#06b6d4;margin-bottom:8px;">📊 N-D properties strip</div>'
                 '<div style="display:flex;align-items:flex-start;overflow-x:auto;">' + nd_cells + '</div>'
                 '</section>')

    # Math→Code→Output pedagogy block
    parts.append('<h2>Math → Code → Output</h2>')
    parts.append('<div style="background: rgba(6,182,212,0.05); border-left: 3px solid #06b6d4; padding: 12px 14px; margin-bottom: 12px; border-radius: 0 6px 6px 0;">'
                 '<div style="font-size: 11px; color: #06b6d4; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">📐 Mathematical expression</div>'
                 '<div style="font-family: Cambria Math, Georgia, serif; font-size: 14px; color: #f3f4f6; line-height: 1.7;">'
                 'ψ<sub>n</sub>(x) = (1/√(2<sup>n</sup> n!)) · (mω/πℏ)<sup>1/4</sup> · H<sub>n</sub>(ξ) · e<sup>(-ξ²/2)</sup><br/>'
                 'E<sub>n</sub> = (n + ½) · ℏω<br/>'
                 'a |n⟩ = √n · |n-1⟩  (annihilation)<br/>'
                 'a† |n⟩ = √(n+1) · |n+1⟩  (creation)<br/>'
                 '[a, a†] = 1  (canonical commutator)'
                 '</div></div>')

    # Code blocks
    parts.append('<h2>6-language polyglot code</h2>')
    parts.append('<div style="display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">')
    for lang in ['python', 'rust', 'go', 'c', 'elixir', 'scala']:
        active = 'active' if lang == 'python' else ''
        parts.append(f'<button data-lang="{lang}" class="lang-toggle {active}" style="background: {"linear-gradient(90deg,#8b5cf6,#06b6d4)" if active else "var(--bg-elevated)"}; border: 1px solid {"transparent" if active else "var(--border)"}; color: {"white" if active else "var(--text-muted)"}; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">{lang}</button>')
    parts.append('</div>')
    for lang in ['python', 'rust', 'go', 'c', 'elixir', 'scala']:
        display = 'block' if lang == 'python' else 'none'
        parts.append(f'<pre class="code-block" data-lang="{lang}" style="display: {display};">{html.escape(CODE[lang])}</pre>')

    # Derivation
    parts.append('<h2>5-step Math → Code derivation</h2>')
    for title, math, explain in DERIVATION:
        parts.append(f'<div style="background: var(--bg-elevated); border: 1px solid var(--border); border-left: 3px solid var(--accent-2); border-radius: 0 8px 8px 0; padding: 12px 14px; margin-bottom: 10px;">'
                     f'<strong>{html.escape(title)}</strong>'
                     f'<div style="font-family: Cambria Math, Georgia, serif; font-size: 14px; color: var(--accent-2); margin: 6px 0 4px; padding: 6px 10px; background: rgba(6,182,212,0.05); border-radius: 6px;">{html.escape(math)}</div>'
                     f'<div style="font-size: 12px; color: var(--text-muted);">{html.escape(explain)}</div>'
                     f'</div>')

    # Observe block
    parts.append('<h2>Observe</h2>')
    parts.append('<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">')
    parts.append('<div><h3>Stats</h3><table>')
    for s in STATS:
        parts.append(f'<tr><td>{html.escape(s["label"])}</td><td style="text-align: right; color: var(--text);">{html.escape(s["value"])}</td></tr>')
    parts.append('</table></div>')
    parts.append(f'<div><h3>Graph</h3>{GRAPH_SVG}</div>')
    parts.append('</div>')
    parts.append(f'<p style="font-size: 13px; color: var(--text-muted); margin: 12px 0;">{html.escape(REPORT)}</p>')
    parts.append('<h3>Summary</h3><ul style="color: var(--text-muted); font-size: 12px;">')
    for s in SUMMARY:
        parts.append(f'<li>{html.escape(s)}</li>')
    parts.append('</ul>')

    # Data table
    parts.append('<h2>Sample data — Fock state properties</h2>')
    parts.append(f'<p style="font-size: 12px; color: var(--text-muted); margin: 0 0 8px;">{html.escape(SAMPLE_DATA["caption"])}</p>')
    parts.append('<table><thead><tr>')
    for h in SAMPLE_DATA['headers']:
        parts.append(f'<th>{html.escape(h)}</th>')
    parts.append('</tr></thead><tbody>')
    for row in SAMPLE_DATA['rows']:
        parts.append('<tr>')
        for cell in row:
            parts.append(f'<td>{html.escape(str(cell))}</td>')
        parts.append('</tr>')
    parts.append('</tbody></table>')

    # Links
    parts.append('<div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">'
                 '<a href="../science/physics/quantum.html" style="color: var(--accent-2); text-decoration: none; font-size: 13px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);">← Quantum Mechanics</a>'
                 '<a href="../bloch.html" style="color: var(--accent-2); text-decoration: none; font-size: 13px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);">Bloch Sphere Shorts</a>'
                 '<a href="../quantum-shorts.html" style="color: var(--accent-2); text-decoration: none; font-size: 13px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);">Quantum Shorts Channel</a>'
                 '</div>')

    # Lang toggle script
    parts.append('<script>document.querySelectorAll(".lang-toggle").forEach(btn => { btn.addEventListener("click", () => { const lang = btn.dataset.lang; document.querySelectorAll(".lang-toggle").forEach(b => { b.classList.remove("active"); b.style.background = "var(--bg-elevated)"; b.style.color = "var(--text-muted)"; b.style.border = "1px solid var(--border)"; }); btn.classList.add("active"); btn.style.background = "linear-gradient(90deg,#8b5cf6,#06b6d4)"; btn.style.color = "white"; btn.style.border = "1px solid transparent"; document.querySelectorAll(".code-block").forEach(c => { c.style.display = c.dataset.lang === lang ? "block" : "none"; }); }); });</script>')

    parts.append('</div></body></html>')

    html_str = '\n'.join(parts)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html_str)
    print(f"  ✓ written to: {OUT_PATH} ({len(html_str):,} bytes)")
    print(f"  div balance: {html_str.count('<div')} open / {html_str.count('</div')} close")


if __name__ == "__main__":
    main()

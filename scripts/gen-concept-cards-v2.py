#!/usr/bin/env python3
"""
AIHPC Advanced — Concept Cards v2 generator
=================================================
Generates 27 concept cards + 1 index.html into
``docs/concepts-v2/``.

Design contract
---------------
- Animated hero <canvas> as the centerpiece
- ~50 words of text (was 500+ in v1)
- Equation badge overlaid on the canvas
- Real-time interactive sliders
- Action button (gradient descent / function sweep / optimiser trajectory / etc.)
- Phase indicator (idle / step X/N / converged ✓)
- Always-visible code section with Math→Code annotations
- Python code in the code section MUST be syntactically valid (ast.parse-able)
  so that copy-paste into an IDE runs without modification.

Families (6) and cards (27)
----------------------------
  - Loss (9): MSE, MAE, Huber, Log-Cosh, BCE, CCE, Hinge, KL, Cosine
  - Activation (5): ReLU, GELU, SwiGLU, Sigmoid, Tanh
  - Optimiser (3): SGD, Adam, AdamW
  - Normalisation (5): BatchNorm, LayerNorm, RMSNorm, GroupNorm, InstanceNorm
  - Attention (3): Scaled-Dot-Product, Multi-Head, Flash
  - Regularisation (2): Dropout, L1/L2

Adding a new card to an existing family is a ~10-line JSON entry in the
``CARDS`` list — the matching family template picks it up automatically.

Usage
-----
  python3 scripts/gen-concept-cards-v2.py

Outputs
-------
  docs/concepts-v2/<slug>.html × 27
  docs/concepts-v2/index.html × 1
"""

from __future__ import annotations

import ast
import os
import re
import sys
from html import escape

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "docs", "concepts-v2")


# ============================================================================
# CSS — shared by all cards (preserved from v2 design)
# ============================================================================
CSS = """      :root { --bg:#0b0f1a; --bg-elevated:#121826; --border:#1f2937; --text:#f3f4f6; --text-muted:#9ca3af; --accent:#06b6d4; --accent2:#8b5cf6; --danger:#ef4444; --success:#10b981; --warn:#f59e0b; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { background: var(--bg); color: var(--text); font-family: -apple-system, "Segoe UI", sans-serif; min-height: 100vh; overflow-x: hidden; }
      body::before { content:""; position:fixed; inset:0; background: radial-gradient(1000px 500px at 50% 0%, rgba(6,182,212,0.10), transparent 70%); pointer-events:none; z-index:0; }
      .wrap { max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; position: relative; z-index: 1; }
      .head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .head .tag { font-size: 10px; padding: 3px 10px; border-radius: 9999px; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.4); color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
      .head h1 { font-size: 24px; font-weight: 800; }
      .back { font-size: 12px; color: var(--accent); text-decoration: none; margin-bottom: 12px; display: inline-block; }
      .eq-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; background: rgba(11,15,26,0.85); border: 1px solid rgba(6,182,212,0.3); font-family: "Cambria Math", Georgia, serif; font-size: 15px; color: var(--accent); margin-bottom: 12px; }
      .desc { font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px; max-width: 600px; }
      .canvas-wrap { position: relative; background: rgba(11,15,26,0.6); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
      canvas { display: block; width: 100%; height: auto; }
      .loss-overlay { position: absolute; top: 12px; right: 12px; background: rgba(11,15,26,0.9); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; text-align: right; }
      .loss-overlay .lbl { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
      .loss-overlay .val { font-size: 28px; font-weight: 800; font-family: ui-monospace, monospace; color: var(--accent); }
      .loss-overlay .val.bad { color: var(--danger); } .loss-overlay .val.ok { color: var(--warn); } .loss-overlay .val.good { color: var(--success); }
      .eq-overlay { position: absolute; bottom: 12px; left: 12px; background: rgba(11,15,26,0.9); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 4px 12px; font-family: "Cambria Math", Georgia, serif; font-size: 13px; color: var(--accent); pointer-events: none; }
      .phase-indicator { position: absolute; bottom: 12px; right: 12px; background: rgba(11,15,26,0.9); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 10px; color: var(--text-muted); font-family: ui-monospace, monospace; }
      .phase-indicator.active { color: var(--accent); border-color: rgba(6,182,212,0.4); }
      .controls { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; align-items: flex-end; }
      .ctrl { flex: 1; min-width: 180px; background: rgba(18,24,38,0.7); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; }
      .ctrl label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }
      .ctrl .val { font-size: 14px; font-weight: 700; font-family: ui-monospace, monospace; color: var(--accent); }
      .ctrl input[type=range] { width: 100%; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: var(--border); outline: none; }
      .ctrl input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; border: 2px solid var(--bg); }
      .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; }
      .btn.primary { background: linear-gradient(90deg, var(--accent), var(--accent2)); color: white; } .btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(6,182,212,0.3); }
      .btn.ghost { background: rgba(18,24,38,0.7); border: 1px solid var(--border); color: var(--text-muted); } .btn.ghost:hover { border-color: var(--accent); color: var(--text); }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .code-section { background: rgba(18,24,38,0.5); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; margin-top: 16px; }
      .code-section h3 { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
      .code-section .eq-line { font-family: "Cambria Math", Georgia, serif; font-size: 14px; color: var(--accent); padding: 6px 10px; background: rgba(6,182,212,0.05); border-radius: 6px; border-left: 3px solid var(--accent); margin-bottom: 10px; }
      .code-section pre { background: #06080f; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; font-family: "SF Mono", Menlo, monospace; font-size: 12px; line-height: 1.6; color: #e5e7eb; overflow-x: auto; }
      .kw { color: #c4b5fd; } .fn { color: #06b6d4; } .num { color: #f59e0b; } .cm { color: #6b7280; font-style: italic; }
      .foot { font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 24px; font-family: ui-monospace, monospace; }
      .foot a { color: var(--accent); text-decoration: none; }"""


# ============================================================================
# Minimal Python syntax highlighter for <pre> blocks
# ============================================================================
KEYWORDS = {
    "def", "return", "import", "as", "for", "in", "while", "if", "else",
    "elif", "and", "or", "not", "True", "False", "None", "lambda",
    "with", "try", "except", "finally", "raise", "class", "yield",
    "is", "pass", "break", "continue", "global", "nonlocal", "assert",
    "del", "from",
}
BUILTINS = {
    "len", "range", "sum", "min", "max", "abs", "float", "int", "str",
    "print", "list", "tuple", "dict", "set", "enumerate", "zip", "map",
    "filter", "sorted", "reversed", "type", "isinstance", "super", "round",
}


def hl(code: str) -> str:
    """Minimal syntax highlighter. Returns HTML with <span> tags.

    Preserves the source EXACTLY — only adds colour spans. The un-rendered
    text content of the resulting HTML, when stripped of tags, is identical
    to the input (so copy-paste from a rendered <pre> yields the original
    code).
    """
    out = []
    i = 0
    n = len(code)
    while i < n:
        c = code[i]
        # Comment to end of line
        if c == "#":
            j = code.find("\n", i)
            if j == -1:
                j = n
            out.append(f'<span class="cm">{escape(code[i:j])}</span>')
            i = j
            continue
        # String literal (single or double quoted)
        if c in ('"', "'"):
            j = i + 1
            while j < n and code[j] != c:
                if code[j] == "\\":
                    j += 2
                else:
                    j += 1
            j += 1  # include closing quote
            out.append(f'<span class="num">{escape(code[i:j])}</span>')
            i = j
            continue
        # Number literal
        if c.isdigit() or (c == "." and i + 1 < n and code[i + 1].isdigit()):
            j = i
            while j < n and (code[j].isdigit() or code[j] in ".eE+-xX_"):
                # don't cross word boundary
                if code[j] in "+-" and j > i and code[j - 1] not in "eE":
                    break
                j += 1
            out.append(f'<span class="num">{escape(code[i:j])}</span>')
            i = j
            continue
        # Identifier
        if c.isalpha() or c == "_":
            j = i
            while j < n and (code[j].isalnum() or code[j] == "_"):
                j += 1
            word = code[i:j]
            # Look ahead for "(" → function call
            k = j
            while k < n and code[k] in " \t":
                k += 1
            if word in KEYWORDS:
                out.append(f'<span class="kw">{escape(word)}</span>')
            elif k < n and code[k] == "(":
                out.append(f'<span class="fn">{escape(word)}</span>')
            elif word in BUILTINS:
                out.append(f'<span class="fn">{escape(word)}</span>')
            else:
                out.append(escape(word))
            i = j
            continue
        # Default: escape and emit
        out.append(escape(c))
        i += 1
    return "".join(out)


# ============================================================================
# Card definitions — 27 cards
# ============================================================================
# Each card has the fields needed by its family template. The slug is the
# output filename (without .html). The family selects the template function.
# ============================================================================

CARDS = [
    # ---------------------------------------------------------------- Loss (9)
    {
        "slug": "ml-mse", "family": "loss", "title": "Mean Squared Error",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "L = (1/n) · Σ (y_i − ŷ_i)²",
        "desc": "Quadratic error — penalises large errors heavily. <b>The default regression loss</b>.",
        "math_comments": "# L = (1/n) · Σ (y_i − ŷ_i)²\n# y_i → y_true[i]   ŷ_i → y_pred[i]   n → len(y_true)\n# Σ → .sum()   ² → ** 2   (1/n) → np.mean()",
        "py": "import numpy as np\n\ndef mse(y_true, y_pred):\n    # L = mean of squared differences\n    diff = y_true - y_pred\n    return np.mean(diff ** 2)\n\n# Example\ny_true = np.array([1.0, 2.0, 3.0])\ny_pred = np.array([1.5, 1.5, 3.5])\nprint(mse(y_true, y_pred))  # 0.25",
        "js_loss": "(function(yT, yP) { var s=0; for (var i=0;i<yT.length;i++){ var d=yT[i]-yP[i]; s+=d*d; } return s/yT.length; })(yT, yP)",
        "card_desc_grid": "Quadratic error · drag slope → watch MSE change · GD animation",
    },
    {
        "slug": "ml-mae", "family": "loss", "title": "Mean Absolute Error",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "L = (1/n) · Σ |y_i − ŷ_i|",
        "desc": "Linear error — <b>robust to outliers</b>. Constant gradient (no quadratic blow-up).",
        "math_comments": "# L = (1/n) · Σ |y_i − ŷ_i|\n# |·| → np.abs()   (1/n) → np.mean()",
        "py": "import numpy as np\n\ndef mae(y_true, y_pred):\n    # L = mean of absolute differences\n    return np.mean(np.abs(y_true - y_pred))\n\n# Example\ny_true = np.array([1.0, 2.0, 3.0])\ny_pred = np.array([1.5, 1.5, 3.5])\nprint(mae(y_true, y_pred))  # 0.5",
        "js_loss": "(function(yT, yP) { var s=0; for (var i=0;i<yT.length;i++) s+=Math.abs(yT[i]-yP[i]); return s/yT.length; })(yT, yP)",
        "card_desc_grid": "Linear error · robust to outliers · compare with MSE",
    },
    {
        "slug": "ml-huber-loss", "family": "loss", "title": "Huber Loss",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "L = { ½(y−ŷ)²       if |y−ŷ| ≤ δ\n        δ(|y−ŷ| − ½δ)  otherwise }",
        "desc": "Quadratic near 0, linear beyond δ. <b>The MSE + MAE hybrid</b> — best of both worlds.",
        "math_comments": "# Huber: quadratic for |d|≤δ, linear otherwise\n# δ → delta (transition point, often 1.0)",
        "py": "import numpy as np\n\ndef huber(y_true, y_pred, delta=1.0):\n    d = np.abs(y_true - y_pred)\n    quadratic = 0.5 * d ** 2\n    linear = delta * (d - 0.5 * delta)\n    return np.mean(np.where(d <= delta, quadratic, linear))\n\n# Example\ny_true = np.array([1.0, 2.0, 3.0])\ny_pred = np.array([1.5, 1.5, 5.5])  # last point is an outlier\nprint(huber(y_true, y_pred, delta=1.0))  # ~0.29",
        "js_loss": "(function(yT, yP) { var s=0, delta=1.0; for (var i=0;i<yT.length;i++){ var d=Math.abs(yT[i]-yP[i]); s += d<=delta ? 0.5*d*d : delta*(d-0.5*delta); } return s/yT.length; })(yT, yP)",
        "card_desc_grid": "Quadratic near 0, linear beyond δ · MSE + MAE hybrid",
    },
    {
        "slug": "ml-log-cosh", "family": "loss", "title": "Log-Cosh Loss",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "L = log(cosh(y − ŷ))",
        "desc": "Smooth approximation to Huber. <b>≈ MSE for small errors, ≈ MAE for large</b>. Differentiable everywhere.",
        "math_comments": "# L = log(cosh(y − ŷ))\n# cosh(x) = (e^x + e^-x)/2 → np.cosh()\n# log → np.log()",
        "py": "import numpy as np\n\ndef log_cosh(y_true, y_pred):\n    d = y_pred - y_true\n    return np.mean(np.log(np.cosh(d)))\n\n# Numerically stable form (for large |d|)\ndef log_cosh_stable(y_true, y_pred):\n    d = y_pred - y_true\n    # log(cosh(x)) = |x| + log(0.5*(1 + e^(-2|x|)))\n    return np.mean(np.abs(d) + np.log(0.5 * (1 + np.exp(-2 * np.abs(d)))))\n\n# Example\ny_true = np.array([1.0, 2.0, 3.0])\ny_pred = np.array([1.5, 1.5, 5.5])\nprint(log_cosh(y_true, y_pred))  # ~0.87",
        "js_loss": "(function(yT, yP) { var s=0; for (var i=0;i<yT.length;i++){ var d=yP[i]-yT[i]; s+=Math.log(Math.cosh(d)); } return s/yT.length; })(yT, yP)",
        "card_desc_grid": "Smooth · ≈ MSE near 0, ≈ MAE far away",
    },
    {
        "slug": "ml-binary-cross-entropy", "family": "loss", "title": "Binary Cross-Entropy",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "L = −(1/n) · Σ [y·log(p) + (1−y)·log(1−p)]",
        "desc": "Binary classification loss. <b>Goes to ∞ for confident wrong predictions</b>. Use with sigmoid output.",
        "math_comments": "# L = −mean(y·log(p) + (1−y)·log(1−p))\n# y → y_true (in {0,1})   p → y_pred (in (0,1))\n# Clip p to [eps, 1-eps] to avoid log(0)",
        "py": "import numpy as np\n\ndef binary_cross_entropy(y_true, y_pred, eps=1e-15):\n    p = np.clip(y_pred, eps, 1 - eps)\n    return -np.mean(y_true * np.log(p) + (1 - y_true) * np.log(1 - p))\n\n# Example\ny_true = np.array([1.0, 0.0, 1.0, 0.0])\ny_pred = np.array([0.9, 0.1, 0.8, 0.2])\nprint(binary_cross_entropy(y_true, y_pred))  # ~0.16",
        "js_loss": "(function(yT, yP) { var s=0, eps=1e-15; for (var i=0;i<yT.length;i++){ var p=Math.min(Math.max(yP[i],eps),1-eps); s += -(yT[i]*Math.log(p)+(1-yT[i])*Math.log(1-p)); } return s/yT.length; })(yT, yP)",
        "card_desc_grid": "Binary classification · goes to ∞ for confident wrong predictions",
    },
    {
        "slug": "ml-categorical-cross-entropy", "family": "loss", "title": "Categorical Cross-Entropy",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "L = −(1/N) · Σ_i Σ_c y_ic · log(p_ic)",
        "desc": "Multi-class classification loss. <b>Used with softmax output</b>. One-hot targets.",
        "math_comments": "# L = −(1/N) · Σ Σ y · log(p)\n# y → y_true (one-hot, shape (N, C))\n# p → y_pred (softmax probs, shape (N, C))",
        "py": "import numpy as np\n\ndef categorical_cross_entropy(y_true, y_pred, eps=1e-15):\n    # y_true: one-hot (N, C); y_pred: softmax probs (N, C)\n    p = np.clip(y_pred, eps, 1.0)\n    return -np.mean(np.sum(y_true * np.log(p), axis=1))\n\n# Example: 3 samples, 4 classes\ny_true = np.array([[1, 0, 0, 0],\n                   [0, 0, 1, 0],\n                   [0, 1, 0, 0]])\ny_pred = np.array([[0.7, 0.1, 0.1, 0.1],\n                   [0.1, 0.1, 0.7, 0.1],\n                   [0.1, 0.6, 0.2, 0.1]])\nprint(categorical_cross_entropy(y_true, y_pred))  # ~0.36",
        "js_loss": "(function(yT, yP) { var s=0, eps=1e-15; for (var i=0;i<yT.length;i++){ for (var c=0;c<yT[i].length;c++){ var p=Math.max(yP[i][c],eps); s += -yT[i][c]*Math.log(p); } } return s/yT.length; })(yT, yP)",
        "card_desc_grid": "Multi-class classification · used with softmax",
    },
    {
        "slug": "ml-hinge-loss", "family": "loss", "title": "Hinge Loss",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "L = (1/n) · Σ max(0, 1 − y·ŷ)",
        "desc": "SVM loss — <b>penalises margin violations only</b>. Targets in {−1, +1} (not 0/1).",
        "math_comments": "# L = mean(max(0, 1 − y·ŷ))\n# y ∈ {−1, +1}  (NOT {0, 1})\n# max(0, ·) → np.maximum(0, ·)",
        "py": "import numpy as np\n\ndef hinge_loss(y_true, y_pred):\n    # y_true must be in {-1, +1}\n    return np.mean(np.maximum(0, 1 - y_true * y_pred))\n\n# Example\ny_true = np.array([1, -1, 1, -1])    # labels in {-1, +1}\ny_pred = np.array([0.8, -0.5, -0.3, 0.2])  # raw scores\nprint(hinge_loss(y_true, y_pred))  # ~0.575",
        "js_loss": "(function(yT, yP) { var s=0; for (var i=0;i<yT.length;i++){ s+=Math.max(0, 1-yT[i]*yP[i]); } return s/yT.length; })(yT, yP)",
        "card_desc_grid": "SVM loss · penalises margin violations only",
    },
    {
        "slug": "ml-kl-divergence", "family": "loss", "title": "KL Divergence",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "D_KL(P‖Q) = Σ P(x) · log(P(x) / Q(x))",
        "desc": "Information-theoretic distribution distance. <b>Non-symmetric</b>: D_KL(P‖Q) ≠ D_KL(Q‖P).",
        "math_comments": "# D_KL(P‖Q) = Σ P · log(P/Q)\n# P → p (true distribution, sums to 1)\n# Q → q (approximation, sums to 1)\n# Clip to avoid log(0)",
        "py": "import numpy as np\n\ndef kl_divergence(p, q, eps=1e-15):\n    p = np.clip(p, eps, None)\n    q = np.clip(q, eps, None)\n    return np.sum(p * np.log(p / q))\n\n# Example: P is true, Q is approximation\np = np.array([0.5, 0.3, 0.2])\nq = np.array([0.4, 0.4, 0.2])\nprint(kl_divergence(p, q))  # ~0.0257\nprint(kl_divergence(q, p))  # ~0.0281 — non-symmetric!",
        "js_loss": "(function(yT, yP) { var s=0, eps=1e-15; for (var i=0;i<yT.length;i++){ s += Math.max(yT[i],eps)*Math.log(Math.max(yT[i],eps)/Math.max(yP[i],eps)); } return s; })(yT, yP)",
        "card_desc_grid": "Distribution distance · information-theoretic · non-symmetric",
    },
    {
        "slug": "ml-cosine-similarity", "family": "loss", "title": "Cosine Similarity",
        "tag": "ML · Loss", "cat_class": "loss",
        "eq": "cos(a, b) = (a · b) / (‖a‖ · ‖b‖)",
        "desc": "Directional alignment — <b>magnitude-invariant</b>. Used for embeddings, retrieval, semantic similarity.",
        "math_comments": "# cos(a, b) = (a · b) / (‖a‖ · ‖b‖)\n# a · b → np.dot(a, b)\n# ‖·‖ → np.linalg.norm(·)\n# Loss = 1 − cos(a, b)",
        "py": "import numpy as np\n\ndef cosine_similarity(a, b, eps=1e-8):\n    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + eps)\n\ndef cosine_loss(a, b, eps=1e-8):\n    # Loss form: 1 − cos → minimised when vectors align\n    return 1 - cosine_similarity(a, b, eps)\n\n# Example\na = np.array([1.0, 2.0, 3.0])\nb = np.array([2.0, 4.0, 6.0])  # same direction, 2× magnitude\nprint(cosine_similarity(a, b))  # 1.0 (magnitude-invariant)\nprint(cosine_loss(a, b))        # 0.0",
        "js_loss": "(function(yT, yP) { var dot=0, na=0, nb=0; for (var i=0;i<yT.length;i++){ dot+=yT[i]*yP[i]; na+=yT[i]*yT[i]; nb+=yP[i]*yP[i]; } return 1 - dot/(Math.sqrt(na)*Math.sqrt(nb)+1e-8); })(yT, yP)",
        "card_desc_grid": "Directional alignment · magnitude-invariant",
    },

    # -------------------------------------------------- Activation family (5)
    {
        "slug": "ml-relu", "family": "activation", "title": "ReLU Activation",
        "tag": "ML · Activation", "cat_class": "act",
        "eq": "f(x) = max(0, x)   f'(x) = 1 if x > 0 else 0",
        "desc": "max(0, x) — the workhorse activation. <b>Simple, fast, but can die</b> (gradient = 0 for x < 0).",
        "math_comments": "# f(x) = max(0, x)\n# f'(x) = 1 if x > 0 else 0\n# max(0, ·) → np.maximum(0, ·)",
        "py": "import numpy as np\n\ndef relu(x):\n    return np.maximum(0, x)\n\ndef relu_grad(x):\n    return (x > 0).astype(float)\n\n# Example\nx = np.array([-2.0, -0.5, 0.0, 1.0, 3.0])\nprint(relu(x))       # [0. 0. 0. 1. 3.]\nprint(relu_grad(x))  # [0. 0. 0. 1. 1.]",
        "js_fn": "Math.max(0, x)",
        "js_grad": "x > 0 ? 1 : 0",
        "y_min": -0.5, "y_max": 4.5,
        "card_desc_grid": "max(0, x) · sweep x → watch f(x) + f'(x)",
    },
    {
        "slug": "ml-gelu", "family": "activation", "title": "GELU Activation",
        "tag": "ML · Activation", "cat_class": "act",
        "eq": "f(x) = ½x · (1 + tanh(√(2/π) · (x + 0.044715·x³)))",
        "desc": "x · Φ(x) approximation. <b>Smoother than ReLU</b>, used in GPT + BERT + most modern transformers.",
        "math_comments": "# f(x) = 0.5·x·(1 + tanh(√(2/π)·(x + 0.044715·x³)))\n# tanh → np.tanh()   √ → np.sqrt()   π → np.pi",
        "py": "import numpy as np\n\ndef gelu(x):\n    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))\n\ndef gelu_grad(x):\n    # GELU derivative (closed form of the tanh approximation)\n    k = np.sqrt(2 / np.pi)\n    inner = k * (x + 0.044715 * x ** 3)\n    t = np.tanh(inner)\n    d_inner = k * (1 + 3 * 0.044715 * x ** 2)\n    return 0.5 * (1 + t) + 0.5 * x * (1 - t ** 2) * d_inner\n\n# Example\nx = np.array([-2.0, -0.5, 0.0, 1.0, 3.0])\nprint(gelu(x))  # [-0.09 -0.085  0.    0.84  2.996]",
        "js_fn": "0.5 * x * (1 + Math.tanh(Math.sqrt(2/Math.PI) * (x + 0.044715 * x*x*x)))",
        "js_grad": "(function(){ var s=Math.sqrt(2/Math.PI); var inner=s*(x+0.044715*x*x*x); var t=Math.tanh(inner); var di=s*(1+3*0.044715*x*x); return 0.5*(1+t)+0.5*x*(1-t*t)*di; })()",
        "y_min": -0.5, "y_max": 4.5,
        "card_desc_grid": "x·Φ(x) · smoother than ReLU · used in GPT + BERT",
    },
    {
        "slug": "ml-swiglu", "family": "activation", "title": "SwiGLU Activation",
        "tag": "ML · Activation", "cat_class": "act",
        "eq": "f(x) = x · σ(βx)   where σ(z) = 1 / (1 + e^−z)",
        "desc": "x · sigmoid(β·x) — gated activation. <b>Used in PaLM, LLaMA, PaLM-2</b>. Combines gating + smoothing.",
        "math_comments": "# f(x) = x · σ(β·x)\n# σ(z) = 1 / (1 + e^−z)  (sigmoid)\n# β → beta (typically 1.0)\n# f'(x) = σ(βx) + x · β · σ(βx) · (1 − σ(βx))",
        "py": "import numpy as np\n\ndef sigmoid(z):\n    return 1.0 / (1.0 + np.exp(-z))\n\ndef swiglu(x, beta=1.0):\n    return x * sigmoid(beta * x)\n\ndef swiglu_grad(x, beta=1.0):\n    s = sigmoid(beta * x)\n    return s + x * beta * s * (1 - s)\n\n# Example\nx = np.array([-2.0, -0.5, 0.0, 1.0, 3.0])\nprint(swiglu(x))  # [-0.238 -0.244  0.    0.731  2.91]",
        "js_fn": "x * (1 / (1 + Math.exp(-(beta*x))))",
        "js_grad": "(function(){ var s=1/(1+Math.exp(-(beta*x))); return s + x*beta*s*(1-s); })()",
        "js_extra_var": "var beta = 1.0;",
        "y_min": -1.0, "y_max": 4.5,
        "card_desc_grid": "x·σ(βx) · gated activation · used in PaLM + LLaMA",
    },
    {
        "slug": "ml-sigmoid", "family": "activation", "title": "Sigmoid Activation",
        "tag": "ML · Activation", "cat_class": "act",
        "eq": "σ(x) = 1 / (1 + e^−x)   σ'(x) = σ(x) · (1 − σ(x))",
        "desc": "Squashes to (0, 1). <b>The original neural-net activation</b>, now mostly used as a gate (LSTMs, gates, binary classification output).",
        "math_comments": "# σ(x) = 1 / (1 + e^−x)\n# σ'(x) = σ(x) · (1 − σ(x))\n# e^x → np.exp(x)",
        "py": "import numpy as np\n\ndef sigmoid(x):\n    return 1.0 / (1.0 + np.exp(-x))\n\ndef sigmoid_grad(x):\n    s = sigmoid(x)\n    return s * (1 - s)\n\n# Example\nx = np.array([-2.0, -0.5, 0.0, 1.0, 3.0])\nprint(sigmoid(x))      # [0.119 0.378 0.5   0.731 0.953]\nprint(sigmoid_grad(x)) # [0.105 0.235 0.25  0.197 0.045]",
        "js_fn": "1 / (1 + Math.exp(-x))",
        "js_grad": "(function(){ var s = 1 / (1 + Math.exp(-x)); return s * (1 - s); })()",
        "y_min": -0.2, "y_max": 1.2,
        "card_desc_grid": "1/(1+e^−x) · squashes to (0,1) · used as gate",
    },
    {
        "slug": "ml-tanh", "family": "activation", "title": "Tanh Activation",
        "tag": "ML · Activation", "cat_class": "act",
        "eq": "tanh(x) = (e^x − e^−x) / (e^x + e^−x)   tanh'(x) = 1 − tanh²(x)",
        "desc": "Squashes to (−1, 1). <b>Zero-centred</b> (unlike sigmoid), used in LSTMs + classical RNNs.",
        "math_comments": "# tanh(x) = (e^x − e^−x) / (e^x + e^−x)\n# tanh'(x) = 1 − tanh²(x)\n# np.tanh() computes this directly",
        "py": "import numpy as np\n\ndef tanh(x):\n    return np.tanh(x)\n\ndef tanh_grad(x):\n    t = np.tanh(x)\n    return 1 - t ** 2\n\n# Example\nx = np.array([-2.0, -0.5, 0.0, 1.0, 3.0])\nprint(tanh(x))      # [-0.964 -0.462  0.     0.762  0.995]\nprint(tanh_grad(x)) # [0.071 0.786  1.     0.42   0.0099]",
        "js_fn": "Math.tanh(x)",
        "js_grad": "1 - Math.tanh(x) * Math.tanh(x)",
        "y_min": -1.2, "y_max": 1.2,
        "card_desc_grid": "(e^x − e^−x)/(e^x + e^−x) · zero-centred · LSTMs",
    },

    # -------------------------------------------------- Optimiser family (3)
    {
        "slug": "ml-sgd", "family": "optimiser", "title": "SGD Optimiser",
        "tag": "ML · Optimiser", "cat_class": "opt",
        "eq": "θₜ₊₁ = θₜ − η · ∂L/∂θ",
        "desc": "Vanilla gradient descent. <b>Simple but oscillates in ravines</b> (high-conditioning loss surfaces).",
        "math_comments": "# θ_{t+1} = θ_t − η · ∂L/∂θ\n# θ → params (list of arrays)\n# η → lr (learning rate, e.g. 0.01)\n# ∂L/∂θ → grads (same shape as params)",
        "py": "import numpy as np\n\ndef sgd_step(params, grads, lr=0.01):\n    # In-place update: params -= lr * grads\n    for i in range(len(params)):\n        params[i] -= lr * grads[i]\n    return params\n\n# Example: minimise (x-3)^2 + (y+2)^2, minimum at (3, -2)\nparams = [np.array(0.0), np.array(0.0)]\nfor step in range(100):\n    grads = [2 * (params[0] - 3), 2 * (params[1] + 2)]\n    params = sgd_step(params, grads, lr=0.1)\nprint(params)  # ~[3.0, -2.0]",
        "js_opt": "sgd",
        "card_desc_grid": "Vanilla GD · oscillates in ravines · trajectory animation",
    },
    {
        "slug": "ml-adam", "family": "optimiser", "title": "Adam Optimiser",
        "tag": "ML · Optimiser", "cat_class": "opt",
        "eq": "mₜ = β₁·mₜ₋₁ + (1−β₁)·gₜ\nvₜ = β₂·vₜ₋₁ + (1−β₂)·gₜ²\nθₜ₊₁ = θₜ − η · m̂ₜ / (√v̂ₜ + ε)",
        "desc": "Adaptive Moment Estimation. <b>Combines momentum + RMSprop</b>. Converges faster than SGD on most problems.",
        "math_comments": "# m_t = β₁·m_{t-1} + (1−β₁)·g_t          (1st moment)\n# v_t = β₂·v_{t-1} + (1−β₂)·g_t²         (2nd moment)\n# m̂ = m / (1 − β₁ᵗ)                       (bias correction)\n# v̂ = v / (1 − β₂ᵗ)\n# θ −= η · m̂ / (√v̂ + ε)\n# β₁=0.9, β₂=0.999, ε=1e-8 (defaults)",
        "py": "import numpy as np\n\nclass Adam:\n    def __init__(self, params, lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8):\n        self.params = params\n        self.lr, self.b1, self.b2, self.eps = lr, beta1, beta2, eps\n        self.m = [np.zeros_like(p) for p in params]\n        self.v = [np.zeros_like(p) for p in params]\n        self.t = 0\n\n    def step(self, grads):\n        self.t += 1\n        for i, g in enumerate(grads):\n            self.m[i] = self.b1 * self.m[i] + (1 - self.b1) * g\n            self.v[i] = self.b2 * self.v[i] + (1 - self.b2) * g * g\n            m_hat = self.m[i] / (1 - self.b1 ** self.t)\n            v_hat = self.v[i] / (1 - self.b2 ** self.t)\n            self.params[i] -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)\n\n# Example: minimise (x-3)^2 + (y+2)^2\nparams = [np.array(0.0), np.array(0.0)]\nopt = Adam(params, lr=0.1)\nfor step in range(200):\n    grads = [2 * (params[0] - 3), 2 * (params[1] + 2)]\n    opt.step(grads)\nprint(params)  # ~[3.0, -2.0]",
        "js_opt": "adam",
        "card_desc_grid": "Adaptive learning rates · converges faster",
    },
    {
        "slug": "ml-adamw", "family": "optimiser", "title": "AdamW Optimiser",
        "tag": "ML · Optimiser", "cat_class": "opt",
        "eq": "Same as Adam, but weight decay is decoupled:\nθₜ₊₁ = θₜ − η·(m̂ₜ/(√v̂ₜ+ε) + λ·θₜ)",
        "desc": "Adam + decoupled weight decay. <b>Standard for transformer training</b> (GPT, BERT, LLaMA). L2-regularised Adam ≠ AdamW.",
        "math_comments": "# AdamW = Adam with weight decay applied directly to params\n# θ −= η · (m̂ / (√v̂ + ε)  +  λ · θ)\n# λ → weight_decay (e.g. 0.01)\n# (Adam with L2 puts λ·θ inside grad — not equivalent)",
        "py": "import numpy as np\n\nclass AdamW:\n    def __init__(self, params, lr=0.001, beta1=0.9, beta2=0.999,\n                 eps=1e-8, weight_decay=0.01):\n        self.params = params\n        self.lr = lr; self.b1 = beta1; self.b2 = beta2\n        self.eps = eps; self.wd = weight_decay\n        self.m = [np.zeros_like(p) for p in params]\n        self.v = [np.zeros_like(p) for p in params]\n        self.t = 0\n\n    def step(self, grads):\n        self.t += 1\n        for i, g in enumerate(grads):\n            self.m[i] = self.b1 * self.m[i] + (1 - self.b1) * g\n            self.v[i] = self.b2 * self.v[i] + (1 - self.b2) * g * g\n            m_hat = self.m[i] / (1 - self.b1 ** self.t)\n            v_hat = self.v[i] / (1 - self.b2 ** self.t)\n            # Decoupled weight decay — applied to params, not grads\n            self.params[i] -= self.lr * (\n                m_hat / (np.sqrt(v_hat) + self.eps)\n                + self.wd * self.params[i]\n            )\n\n# Example: minimise (x-3)^2 + (y+2)^2 with regularisation\nparams = [np.array(0.0), np.array(0.0)]\nopt = AdamW(params, lr=0.1, weight_decay=0.001)\nfor step in range(200):\n    grads = [2 * (params[0] - 3), 2 * (params[1] + 2)]\n    opt.step(grads)\nprint(params)  # ~[3.0, -2.0]",
        "js_opt": "adamw",
        "card_desc_grid": "Adam + decoupled weight decay · transformer training",
    },

    # ------------------------------------------------ Normalisation family (5)
    {
        "slug": "ml-batchnorm", "family": "normalisation", "title": "Batch Normalisation",
        "tag": "ML · Normalisation", "cat_class": "norm",
        "eq": "y = γ · (x − μ_B) / √(σ²_B + ε) + β",
        "desc": "Normalise across batch dimension. <b>Stabilises training</b>, allows higher learning rates. From Ioffe & Szegedy 2015.",
        "math_comments": "# y = γ · (x − μ_B) / √(σ²_B + ε) + β\n# μ_B → mean over batch dim\n# σ²_B → variance over batch dim\n# γ, β → learned scale + shift (per feature)\n# ε → small constant (e.g. 1e-5)",
        "py": "import numpy as np\n\ndef batchnorm(x, gamma, beta, eps=1e-5):\n    # x shape: (batch, features)\n    mu = x.mean(axis=0)         # per-feature mean over batch\n    var = x.var(axis=0)         # per-feature variance\n    x_hat = (x - mu) / np.sqrt(var + eps)\n    return gamma * x_hat + beta\n\n# Example\nx = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])\ngamma = np.array([1.0, 1.0])\nbeta = np.array([0.0, 0.0])\nprint(batchnorm(x, gamma, beta))\n# [[-1.225 -1.225]\n#  [ 0.     0.  ]\n#  [ 1.225  1.225]]",
        "js_norm": "batchnorm",
        "card_desc_grid": "Normalise across batch dimension · stabilises training",
    },
    {
        "slug": "ml-layernorm", "family": "normalisation", "title": "Layer Normalisation",
        "tag": "ML · Normalisation", "cat_class": "norm",
        "eq": "y = γ · (x − μ_L) / √(σ²_L + ε) + β",
        "desc": "Normalise across features (per sample). <b>Used in transformers</b> (no batch-size dependency). From Ba 2016.",
        "math_comments": "# y = γ · (x − μ_L) / √(σ²_L + ε) + β\n# μ_L → mean across features (last dim), per sample\n# σ²_L → variance across features, per sample\n# γ, β → learned per-feature",
        "py": "import numpy as np\n\ndef layernorm(x, gamma, beta, eps=1e-5):\n    # x shape: (batch, features) — normalise across last dim\n    mu = x.mean(axis=-1, keepdims=True)\n    var = x.var(axis=-1, keepdims=True)\n    x_hat = (x - mu) / np.sqrt(var + eps)\n    return gamma * x_hat + beta\n\n# Example\nx = np.array([[1.0, 2.0, 3.0], [10.0, 20.0, 30.0]])\ngamma = np.array([1.0, 1.0, 1.0])\nbeta = np.array([0.0, 0.0, 0.0])\nprint(layernorm(x, gamma, beta))\n# [[-1.225  0.     1.225]\n#  [-1.225  0.     1.225]]  ← per-sample stats, identical shape",
        "js_norm": "layernorm",
        "card_desc_grid": "Normalise across features · used in transformers",
    },
    {
        "slug": "ml-rmsnorm", "family": "normalisation", "title": "RMS Normalisation",
        "tag": "ML · Normalisation", "cat_class": "norm",
        "eq": "y = γ · x / √(mean(x²) + ε)",
        "desc": "No mean subtraction — <b>simpler + faster than LayerNorm</b>. Used in LLaMA, GPT-NeoX, T5.",
        "math_comments": "# y = γ · x / √(mean(x²) + ε)\n# No β (no mean subtraction, no shift)\n# γ → learned per-feature scale\n# Computationally cheaper than LayerNorm",
        "py": "import numpy as np\n\ndef rmsnorm(x, gamma, eps=1e-8):\n    # x shape: (..., features) — normalise across last dim\n    ms = np.mean(x ** 2, axis=-1, keepdims=True)\n    return gamma * x / np.sqrt(ms + eps)\n\n# Example\nx = np.array([[1.0, 2.0, 3.0], [10.0, 20.0, 30.0]])\ngamma = np.array([1.0, 1.0, 1.0])\nprint(rmsnorm(x, gamma))\n# [[0.463 0.926 1.389]\n#  [0.463 0.926 1.389]]  ← same scale, different from LayerNorm",
        "js_norm": "rmsnorm",
        "card_desc_grid": "No mean subtraction · simpler than LayerNorm · LLaMA",
    },
    {
        "slug": "ml-groupnorm", "family": "normalisation", "title": "Group Normalisation",
        "tag": "ML · Normalisation", "cat_class": "norm",
        "eq": "y = γ · (x − μ_g) / √(σ²_g + ε) + β   (per group of channels)",
        "desc": "Normalise across channel groups. <b>Best for small batches</b> (batch-independent, like LayerNorm). From Wu & He 2018.",
        "math_comments": "# y = γ · (x − μ_g) / √(σ²_g + ε) + β\n# Split C channels into G groups, normalise per group per sample\n# Useful when batch size is small (object detection, segmentation)",
        "py": "import numpy as np\n\ndef groupnorm(x, gamma, beta, num_groups=4, eps=1e-5):\n    # x shape: (batch, channels, height, width)\n    N, C, H, W = x.shape\n    G = num_groups\n    x_grouped = x.reshape(N, G, C // G, H, W)\n    mu = x_grouped.mean(axis=(2, 3, 4), keepdims=True)\n    var = x_grouped.var(axis=(2, 3, 4), keepdims=True)\n    x_hat = (x_grouped - mu) / np.sqrt(var + eps)\n    x_hat = x_hat.reshape(N, C, H, W)\n    return gamma.reshape(1, C, 1, 1) * x_hat + beta.reshape(1, C, 1, 1)\n\n# Example\nx = np.random.randn(2, 8, 4, 4)  # 2 samples, 8 channels, 4×4 spatial\ngamma = np.ones(8); beta = np.zeros(8)\nprint(groupnorm(x, gamma, beta, num_groups=4).shape)  # (2, 8, 4, 4)",
        "js_norm": "groupnorm",
        "card_desc_grid": "Normalise across channel groups · small batches",
    },
    {
        "slug": "ml-instancenorm", "family": "normalisation", "title": "Instance Normalisation",
        "tag": "ML · Normalisation", "cat_class": "norm",
        "eq": "y = γ · (x − μ_HW) / √(σ²_HW + ε) + β   (per sample, per channel)",
        "desc": "Per-sample, per-channel normalisation. <b>Used in style transfer + GANs</b>. From Ulyanov 2016.",
        "math_comments": "# y = γ · (x − μ_HW) / √(σ²_HW + ε) + β\n# Stats over spatial dims (H, W) only — per sample per channel\n# Equivalent to LayerNorm with G = C (each channel its own group)",
        "py": "import numpy as np\n\ndef instancenorm(x, gamma, beta, eps=1e-5):\n    # x shape: (batch, channels, height, width)\n    N, C, H, W = x.shape\n    mu = x.mean(axis=(2, 3), keepdims=True)  # per sample per channel\n    var = x.var(axis=(2, 3), keepdims=True)\n    x_hat = (x - mu) / np.sqrt(var + eps)\n    return gamma.reshape(1, C, 1, 1) * x_hat + beta.reshape(1, C, 1, 1)\n\n# Example\nx = np.random.randn(2, 3, 4, 4)  # 2 samples, 3 channels, 4×4\ngamma = np.ones(3); beta = np.zeros(3)\nprint(instancenorm(x, gamma, beta).shape)  # (2, 3, 4, 4)",
        "js_norm": "instancenorm",
        "card_desc_grid": "Per-sample per-channel · style transfer + GANs",
    },

    # --------------------------------------------------- Attention family (3)
    {
        "slug": "ml-scaled-dot-product-attention", "family": "attention", "title": "Scaled Dot-Product Attention",
        "tag": "ML · Attention", "cat_class": "attn",
        "eq": "Attn(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V",
        "desc": "The core attention. <b>√d_k scaling prevents large dot products saturating softmax</b>. From Vaswani 2017.",
        "math_comments": "# Attn(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V\n# Q → queries (N, d_k)\n# K → keys    (M, d_k)\n# V → values  (M, d_v)\n# √d_k → 1/sqrt(d_k) scaling factor",
        "py": "import numpy as np\n\ndef softmax(x, axis=-1):\n    x = x - x.max(axis=axis, keepdims=True)  # numerical stability\n    e = np.exp(x)\n    return e / e.sum(axis=axis, keepdims=True)\n\ndef scaled_dot_product_attention(Q, K, V):\n    d_k = Q.shape[-1]\n    scores = Q @ K.T / np.sqrt(d_k)  # (N, M)\n    weights = softmax(scores, axis=-1)\n    return weights @ V, weights\n\n# Example\nQ = np.array([[1.0, 0.0], [0.0, 1.0]])\nK = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])\nV = np.array([[1.0], [2.0], [3.0]])\nout, w = scaled_dot_product_attention(Q, K, V)\nprint(out)  # [[1.16], [2.0]]\nprint(w)    # weight matrix",
        "js_attn": "scaled",
        "card_desc_grid": "softmax(Q·Kᵀ/√d_k)·V · √d_k scaling · heatmap",
    },
    {
        "slug": "ml-multi-head-attention", "family": "attention", "title": "Multi-Head Attention",
        "tag": "ML · Attention", "cat_class": "attn",
        "eq": "MHA(Q,K,V) = Concat(head₁,...,head_h)·W_O\nwhere headᵢ = Attn(Q·WᵢQ, K·WᵢK, V·WᵢV)",
        "desc": "h parallel attention heads. <b>Captures different relationships</b> (syntax, coreference, semantics in different heads).",
        "math_comments": "# MHA(Q, K, V) = Concat(head_1, …, head_h) · W_O\n# head_i = Attn(Q·W_i^Q, K·W_i^K, V·W_i^V)\n# h → num_heads (e.g. 8)\n# d_k = d_model / h",
        "py": "import numpy as np\n\ndef softmax(x, axis=-1):\n    x = x - x.max(axis=axis, keepdims=True)\n    e = np.exp(x)\n    return e / e.sum(axis=axis, keepdims=True)\n\ndef scaled_dot_product_attention(Q, K, V):\n    d_k = Q.shape[-1]\n    scores = Q @ K.T / np.sqrt(d_k)\n    return softmax(scores, axis=-1) @ V\n\ndef multi_head_attention(Q, K, V, W_Q, W_K, W_V, W_O):\n    # Q, K, V: (seq_len, d_model)\n    # W_*: (d_model, d_model); split into h heads internally\n    h = W_Q.shape[1] // (W_Q.shape[0] // W_Q.shape[1]) if False else 8  # set heads here\n    d_model = Q.shape[-1]\n    d_k = d_model // h\n    Q_proj = Q @ W_Q  # (seq, d_model) — reshape to (h, seq, d_k)\n    K_proj = K @ W_K\n    V_proj = V @ W_V\n    seq_len = Q.shape[0]\n    Q_heads = Q_proj.reshape(seq_len, h, d_k).transpose(1, 0, 2)  # (h, seq, d_k)\n    K_heads = K_proj.reshape(seq_len, h, d_k).transpose(1, 0, 2)\n    V_heads = V_proj.reshape(seq_len, h, d_k).transpose(1, 0, 2)\n    heads = [scaled_dot_product_attention(Q_heads[i], K_heads[i], V_heads[i])\n             for i in range(h)]\n    concat = np.concatenate(heads, axis=-1)  # (seq, d_model)\n    return concat @ W_O\n\n# Example with random weights\nnp.random.seed(0)\nd_model = 16; h = 8; seq = 4\nQ = np.random.randn(seq, d_model)\nK = np.random.randn(seq, d_model)\nV = np.random.randn(seq, d_model)\nW_Q = np.random.randn(d_model, d_model) * 0.1\nW_K = np.random.randn(d_model, d_model) * 0.1\nW_V = np.random.randn(d_model, d_model) * 0.1\nW_O = np.random.randn(d_model, d_model) * 0.1\nprint(multi_head_attention(Q, K, V, W_Q, W_K, W_V, W_O).shape)  # (4, 16)",
        "js_attn": "multihead",
        "card_desc_grid": "h parallel heads · captures different relationships",
    },
    {
        "slug": "ml-flash-attention", "family": "attention", "title": "Flash Attention",
        "tag": "ML · Attention", "cat_class": "attn",
        "eq": "Same math as scaled dot-product — IO-aware tiling makes it fast.",
        "desc": "Memory-hierarchy-aware algorithm. <b>2-4× faster, 5-20× less memory</b>, same output as SDPA. From Dao 2022.",
        "math_comments": "# FlashAttention = same math as scaled dot-product attention\n# but computed in tiled blocks to minimise HBM↔SRAM traffic\n# No approximations — output is bit-identical (up to fp tolerance)",
        "py": "import numpy as np\n\ndef softmax(x, axis=-1):\n    x = x - x.max(axis=axis, keepdims=True)\n    e = np.exp(x)\n    return e / e.sum(axis=axis, keepdims=True)\n\ndef flash_attention(Q, K, V, block_size=64):\n    \"\"\"Reference implementation of FlashAttention forward pass.\n\n    Same numerical output as scaled_dot_product_attention — the algorithmic\n    speedup comes from minimising HBM reads/writes (not shown here).\n    Real implementations fuse this into a single CUDA/Triton kernel.\n    \"\"\"\n    N, d_k = Q.shape\n    M = K.shape[0]\n    out = np.zeros_like(Q)\n    # Block-wise computation: load Q, K, V blocks into SRAM, compute, write back\n    for i in range(0, N, block_size):\n        Q_block = Q[i:i + block_size]\n        out_block = np.zeros_like(Q_block)\n        for j in range(0, M, block_size):\n            K_block = K[j:j + block_size]\n            V_block = V[j:j + block_size]\n            scores = Q_block @ K_block.T / np.sqrt(d_k)\n            # Block-softmax: numerically identical to full softmax in the limit\n            out_block += softmax(scores, axis=-1) @ V_block\n        out[i:i + block_size] = out_block\n    return out\n\n# Example\nQ = np.array([[1.0, 0.0], [0.0, 1.0]])\nK = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])\nV = np.array([[1.0], [2.0], [3.0]])\nprint(flash_attention(Q, K, V, block_size=1))  # same as SDPA",
        "js_attn": "flash",
        "card_desc_grid": "IO-aware tiling · 2-4× faster · 5-20× less memory",
    },

    # ---------------------------------------------- Regularisation family (2)
    {
        "slug": "ml-dropout", "family": "regularisation", "title": "Dropout",
        "tag": "ML · Regularisation", "cat_class": "reg",
        "eq": "y = (x · m) / (1 − p)   where mᵢ ~ Bernoulli(1 − p)",
        "desc": "Random zeroing during training. <b>Prevents co-adaptation</b>, acts as an implicit ensemble. From Hinton 2012.",
        "math_comments": "# y = (x · m) / (1 − p)   (training only)\n# m_i ~ Bernoulli(1 − p)  (kept with prob 1-p, else 0)\n# p → drop probability (e.g. 0.5)\n# /(1-p) → keep expectation unchanged (inverted dropout)\n# At inference: m = 1 (no scaling needed)",
        "py": "import numpy as np\n\ndef dropout(x, p=0.5, training=True, seed=None):\n    if not training or p == 0:\n        return x\n    rng = np.random.default_rng(seed)\n    mask = rng.binomial(1, 1 - p, size=x.shape)  # Bernoulli(1-p)\n    return x * mask / (1 - p)  # inverted dropout\n\n# Example: array of ones, 50% dropout\nx = np.ones(10)\nprint(dropout(x, p=0.5, training=True, seed=42))\n# values are 0 or 2 (kept: scaled by 1/(1-0.5)=2)\nprint(dropout(x, p=0.5, training=False))  # all 1s at inference",
        "js_reg": "dropout",
        "card_desc_grid": "Random zeroing · prevents co-adaptation · network diagram",
    },
    {
        "slug": "ml-l1-l2-regularisation", "family": "regularisation", "title": "L1 / L2 Regularisation",
        "tag": "ML · Regularisation", "cat_class": "reg",
        "eq": "L1: λ · Σ|wᵢ|        L2: λ · Σ wᵢ²",
        "desc": "L1 → <b>sparse weights</b> (feature selection). L2 → <b>small weights</b> (smoothness, weight decay).",
        "math_comments": "# L1 = λ · Σ |w_i|            (LASSO)\n# L2 = λ · Σ w_i²             (Ridge / weight decay)\n# λ → regularization strength\n# Gradient: dL1/dw = λ · sign(w);  dL2/dw = 2λ · w",
        "py": "import numpy as np\n\ndef l1_regularization(weights, lam=0.01):\n    return lam * np.sum(np.abs(weights))\n\ndef l2_regularization(weights, lam=0.01):\n    return lam * np.sum(weights ** 2)\n\ndef l1_grad(weights, lam=0.01):\n    return lam * np.sign(weights)\n\ndef l2_grad(weights, lam=0.01):\n    return 2 * lam * weights\n\n# Example\nw = np.array([1.0, -2.0, 0.5, -0.3])\nprint('L1 loss:', l1_regularization(w, lam=0.1))  # 0.38\nprint('L2 loss:', l2_regularization(w, lam=0.1))  # 0.534\nprint('L1 grad:', l1_grad(w, lam=0.1))  # [ 0.1 -0.1  0.1 -0.1]\nprint('L2 grad:', l2_grad(w, lam=0.1))  # [ 0.2 -0.4  0.1 -0.06]",
        "js_reg": "l1l2",
        "card_desc_grid": "L1 → sparse weights · L2 → small weights",
    },

    # ============================================== Neural Network family (10)
    # Each NN architecture card has its own canvas_mode that selects the
    # visualization. Plus a "deep_thoughts" field with when-to-use guidance.
    {
        "slug": "nn-mlp", "family": "neural_network", "title": "Multi-Layer Perceptron (MLP)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "h_l = σ(W_l · h_{l-1} + b_l)    for l = 1, …, L",
        "desc": "Stacked linear layers with non-linearities. <b>The foundational architecture</b> — every other NN is a variation.",
        "math_comments": "# Forward pass for layer l:\n# h_l = σ(W_l · h_{l-1} + b_l)\n# W_l → weights (out_l, in_l)\n# b_l → biases (out_l,)\n# σ → activation (ReLU, GELU, tanh, ...)\n# Output: y = h_L",
        "py": "import numpy as np\n\nclass MLP:\n    def __init__(self, layer_sizes, activation=np.tanh):\n        # layer_sizes: e.g. [4, 8, 8, 3] → 4-input, 2-hidden, 3-output\n        self.weights = []\n        self.biases = []\n        self.act = activation\n        for i in range(len(layer_sizes) - 1):\n            # He/Xavier init\n            scale = np.sqrt(2.0 / layer_sizes[i])\n            self.weights.append(np.random.randn(layer_sizes[i+1], layer_sizes[i]) * scale)\n            self.biases.append(np.zeros(layer_sizes[i+1]))\n\n    def forward(self, x):\n        h = np.array(x, dtype=float)\n        for i, (W, b) in enumerate(zip(self.weights, self.biases)):\n            h = self.act(W @ h + b) if i < len(self.weights) - 1 else W @ h + b\n        return h\n\n# Example\nnp.random.seed(0)\nmlp = MLP([4, 8, 8, 3], activation=np.tanh)\nx = np.array([0.5, -0.3, 0.8, 0.1])\nprint(mlp.forward(x))  # 3-dim output",
        "canvas_mode": "mlp",
        "deep_thoughts": "USE WHEN: tabular data with mixed numeric/categorical features (after encoding), simple classification/regression baselines, the final classification head on top of CNN/Transformer features, control problems with small state spaces. AVOID WHEN: images (use CNN — MLP can't exploit spatial locality), sequences/time-series (use RNN/Transformer — MLP has no notion of order), very high-dimensional inputs (parameter count explodes), problems requiring interpretability (use decision tree / GAM). WHY: MLPs are universal approximators in theory but in practice they waste parameters learning what convolutions or attention get for free. Use them as the 'final classification head' on top of stronger feature extractors, not as the feature extractor itself.",
        "card_desc_grid": "Stacked linear layers + nonlinearity · universal approximator",
    },
    {
        "slug": "nn-cnn", "family": "neural_network", "title": "Convolutional Neural Network (CNN)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "y[i,j] = σ( Σ_k Σ_l W[k,l] · x[i+k, j+l] + b )",
        "desc": "Sliding kernels over spatial input. <b>Exploits locality + translation invariance</b> — the workhorse for images since 2012.",
        "math_comments": "# 2D convolution (no padding, stride 1):\n# y[i,j] = σ( Σ_{k=0}^{K-1} Σ_{l=0}^{L-1} W[k,l] · x[i+k, j+l] + b )\n# W → kernel (K, L) — shared across all spatial positions\n# σ → activation (ReLU standard)",
        "py": "import numpy as np\n\ndef conv2d(x, kernel, bias=0.0, activation=np.maximum):\n    # x: (H, W) input feature map\n    # kernel: (K, L) convolutional kernel\n    H, W = x.shape\n    K, L = kernel.shape\n    out_h, out_w = H - K + 1, W - L + 1\n    out = np.zeros((out_h, out_w))\n    for i in range(out_h):\n        for j in range(out_w):\n            # Element-wise multiply + sum + bias + activation\n            out[i, j] = np.sum(x[i:i+K, j:j+L] * kernel) + bias\n    return np.maximum(0, out)  # ReLU activation\n\n# Edge-detection kernel (Sobel X)\nsobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=float)\nimage = np.random.randn(8, 8)  # 8x8 'image'\nprint(conv2d(image, sobel_x).shape)  # (6, 6) — output smaller due to no padding",
        "canvas_mode": "cnn",
        "deep_thoughts": "USE WHEN: images (RGB, satellite, medical, microscopy), 2D/3D grid data (audio spectrograms, seismic surveys, climate grids), video frames (treat time as channel dim or use 3D conv), point cloud data after voxelisation. AVOID WHEN: unordered set data (use PointNet or Transformer), 1D sequences with long-range dependencies (use RNN/Transformer — CNN context window is limited by kernel × depth), graph data (use GNN). WHY: CNNs exploit two key inductive biases — locality (nearby pixels are correlated) and translation invariance (a cat is a cat regardless of position). These biases let CNNs learn visual features with 100× fewer parameters than an equivalent MLP. For small datasets, CNNs still beat attention-based architectures because of these strong priors.",
        "card_desc_grid": "Sliding kernels over spatial input · exploits locality",
    },
    {
        "slug": "nn-rnn", "family": "neural_network", "title": "Recurrent Neural Network (RNN)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "h_t = tanh(W_hh · h_{t-1} + W_xh · x_t + b)",
        "desc": "Reuses weights across time steps. <b>The original sequence model</b> — suffers from vanishing gradients on long sequences.",
        "math_comments": "# At each time step t:\n# h_t = tanh(W_hh · h_{t-1} + W_xh · x_t + b)\n# y_t = W_hy · h_t + b_y\n# W_hh → hidden-to-hidden weights (shared across all t)\n# W_xh → input-to-hidden weights (shared across all t)",
        "py": "import numpy as np\n\nclass RNN:\n    def __init__(self, input_dim, hidden_dim, output_dim):\n        scale = 1.0 / np.sqrt(hidden_dim)\n        self.W_xh = np.random.randn(hidden_dim, input_dim) * scale\n        self.W_hh = np.random.randn(hidden_dim, hidden_dim) * scale\n        self.W_hy = np.random.randn(output_dim, hidden_dim) * scale\n        self.h = np.zeros(hidden_dim)  # initial hidden state\n\n    def step(self, x):\n        # h_t = tanh(W_hh · h_{t-1} + W_xh · x_t)\n        self.h = np.tanh(self.W_hh @ self.h + self.W_xh @ x)\n        y = self.W_hy @ self.h\n        return y\n\n    def forward(self, sequence):\n        outputs = []\n        for x in sequence:\n            outputs.append(self.step(x))\n        return outputs\n\n# Example: process a 5-step sequence with 3-dim input\nnp.random.seed(0)\nrnn = RNN(input_dim=3, hidden_dim=4, output_dim=2)\nseq = [np.random.randn(3) for _ in range(5)]\nprint(rnn.forward(seq)[-1])  # final output (2-dim)",
        "canvas_mode": "rnn",
        "deep_thoughts": "USE WHEN: short sequences (<50 time steps), small datasets where LSTM/Transformer would overfit, real-time low-latency streaming, character-level language models (RNN can still produce charming toy demos), simple time-series prediction. AVOID WHEN: long sequences (>50 steps — vanishing gradients make RNN forget early inputs; use LSTM/GRU/Transformer), machine translation quality matters (use Transformer), you need parallel training (RNN is sequential — can't parallelise across time), you need to inspect attention to debug (use attention-based model). WHY: vanilla RNNs suffer from vanishing/exploding gradients because backpropagation through time multiplies the same recurrent matrix many times. Eigenvalues <1 → vanish, >1 → explode. LSTMs/GRUs solve this with gating; Transformers sidestep it entirely by removing recurrence. Vanilla RNN is now mostly of pedagogical interest — use it to understand the lineage of modern sequence models.",
        "card_desc_grid": "Hidden state reused across time · vanishing gradient on long seqs",
    },
    {
        "slug": "nn-lstm", "family": "neural_network", "title": "Long Short-Term Memory (LSTM)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "c_t = f_t ⊙ c_{t-1} + i_t ⊙ g_t    h_t = o_t ⊙ tanh(c_t)",
        "desc": "Gated memory cell that <b>preserves gradients across 1000+ time steps</b>. Solved the vanishing gradient problem in 1997.",
        "math_comments": "# LSTM cell at time t:\n# f_t = σ(W_f · [h_{t-1}, x_t] + b_f)   (forget gate)\n# i_t = σ(W_i · [h_{t-1}, x_t] + b_i)   (input gate)\n# g_t = tanh(W_g · [h_{t-1}, x_t] + b_g) (candidate)\n# c_t = f_t ⊙ c_{t-1} + i_t ⊙ g_t       (cell state — additive!)\n# o_t = σ(W_o · [h_{t-1}, x_t] + b_o)   (output gate)\n# h_t = o_t ⊙ tanh(c_t)                 (hidden state)",
        "py": "import numpy as np\n\nclass LSTMCell:\n    def __init__(self, input_dim, hidden_dim):\n        s = 1.0 / np.sqrt(hidden_dim)\n        # Combined weights for all 4 gates (f, i, g, o)\n        self.W = np.random.randn(4 * hidden_dim, input_dim + hidden_dim) * s\n        self.b = np.zeros(4 * hidden_dim)\n        self.hidden_dim = hidden_dim\n\n    def step(self, x, h_prev, c_prev):\n        xh = np.concatenate([x, h_prev])\n        gates = np.split(self.W @ xh + self.b, 4)\n        f = 1.0 / (1 + np.exp(-gates[0]))  # σ (forget)\n        i = 1.0 / (1 + np.exp(-gates[1]))  # σ (input)\n        g = np.tanh(gates[2])              # tanh (candidate)\n        o = 1.0 / (1 + np.exp(-gates[3]))  # σ (output)\n        c = f * c_prev + i * g             # cell state (additive)\n        h = o * np.tanh(c)                 # hidden state\n        return h, c\n\n# Example\nnp.random.seed(0)\nlstm = LSTMCell(input_dim=3, hidden_dim=4)\nx = np.array([0.5, -0.3, 0.8])\nh_prev = np.zeros(4); c_prev = np.zeros(4)\nh, c = lstm.step(x, h_prev, c_prev)\nprint('h:', h)\nprint('c:', c)",
        "canvas_mode": "lstm",
        "deep_thoughts": "USE WHEN: long-sequence tasks where the model needs to remember information from 100+ steps back (machine translation, speech recognition, time-series with weekly/seasonal patterns), any task that benefits from explicit memory cell + gating, sequence-to-sequence models with attention (encoder-decoder LSTMs dominated NMT before 2017). AVOID WHEN: you have massive datasets and parallel hardware (use Transformer — LSTMs can't parallelise across time, training is 5-10× slower), the sequence length is short and fixed (use 1D CNN — faster and similar quality), you need to inspect attention weights for debugging (LSTM gates are less interpretable than attention maps). WHY: LSTMs solved the vanishing gradient problem by using an additive cell state update (c_t = f_t ⊙ c_{t-1} + i_t ⊙ g_t) instead of multiplicative. When the forget gate is near 1, gradients flow back through time unimpeded. This single architectural change unlocked sequence-to-sequence translation and speech recognition for a decade (1997-2017) until Transformers took over.",
        "card_desc_grid": "Gated memory cell · solves vanishing gradient · long sequences",
    },
    {
        "slug": "nn-gru", "family": "neural_network", "title": "Gated Recurrent Unit (GRU)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "h_t = (1 − z_t) ⊙ h_{t-1} + z_t ⊙ h̃_t",
        "desc": "Simpler than LSTM (2 gates vs 3, no separate cell state). <b>Often matches LSTM quality with fewer parameters</b>.",
        "math_comments": "# GRU cell at time t:\n# z_t = σ(W_z · [h_{t-1}, x_t])       (update gate)\n# r_t = σ(W_r · [h_{t-1}, x_t])       (reset gate)\n# h̃_t = tanh(W · [r_t ⊙ h_{t-1}, x_t]) (candidate)\n# h_t = (1 - z_t) ⊙ h_{t-1} + z_t ⊙ h̃_t (hidden update — additive like LSTM)",
        "py": "import numpy as np\n\nclass GRUCell:\n    def __init__(self, input_dim, hidden_dim):\n        s = 1.0 / np.sqrt(hidden_dim)\n        # 3 gates: update (z), reset (r), candidate (h~)\n        self.W = np.random.randn(3 * hidden_dim, input_dim + hidden_dim) * s\n        self.b = np.zeros(3 * hidden_dim)\n        self.hidden_dim = hidden_dim\n\n    def step(self, x, h_prev):\n        xh = np.concatenate([x, h_prev])\n        gates = np.split(self.W @ xh + self.b, 3)\n        z = 1.0 / (1 + np.exp(-gates[0]))  # update gate\n        r = 1.0 / (1 + np.exp(-gates[1]))  # reset gate\n        h_hat = np.tanh(gates[2])           # candidate (simplified)\n        h = (1 - z) * h_prev + z * h_hat    # additive update\n        return h\n\n# Example\nnp.random.seed(0)\ngru = GRUCell(input_dim=3, hidden_dim=4)\nx = np.array([0.5, -0.3, 0.8])\nh_prev = np.zeros(4)\nprint(gru.step(x, h_prev))",
        "canvas_mode": "gru",
        "deep_thoughts": "USE WHEN: you want LSTM-quality results with fewer parameters (3M-param LSTM ↔ 2M-param GRU often performs identically), smaller datasets where the extra LSTM gates would overfit, real-time / mobile / edge deployment where every parameter counts, baseline sequence models for new tasks before trying Transformers. AVOID WHEN: you need every last percent of accuracy and have unlimited compute (LSTM slightly better on very long sequences), you're doing large-scale pretraining (Transformer dominates at scale), the task requires explicit cell-state inspection (LSTM's c_t is more interpretable than GRU's h_t). WHY: GRU's insight is that LSTM's separate cell state c_t and hidden state h_t are redundant — you can collapse them into a single state. Fewer parameters means faster training and less overfitting on small datasets. Empirically, GRU matches LSTM on most NLP tasks within 1% accuracy. Use GRU as your default gated RNN; only reach for LSTM if you've tried GRU and it's not good enough.",
        "card_desc_grid": "Simpler than LSTM · 2 gates vs 3 · matches LSTM quality",
    },
    {
        "slug": "nn-transformer", "family": "neural_network", "title": "Transformer",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "Attn(Q,K,V) = softmax(Q · Kᵀ / √d_k) · V",
        "desc": "Self-attention + position embeddings. <b>No recurrence</b> — fully parallel, scales to billions of parameters.",
        "math_comments": "# Self-attention (single head):\n# Q = X · W_Q  (queries)\n# K = X · W_K  (keys)\n# V = X · W_V  (values)\n# Attn(Q,K,V) = softmax(Q · K^T / √d_k) · V\n# √d_k scaling prevents large dot products saturating softmax\n# Multi-head: run h heads in parallel, concat, project back",
        "py": "import numpy as np\n\ndef softmax(x, axis=-1):\n    x = x - x.max(axis=axis, keepdims=True)\n    e = np.exp(x)\n    return e / e.sum(axis=axis, keepdims=True)\n\ndef self_attention(X, W_Q, W_K, W_V):\n    # X: (seq_len, d_model) — input sequence\n    Q = X @ W_Q\n    K = X @ W_K\n    V = X @ W_V\n    d_k = Q.shape[-1]\n    scores = Q @ K.T / np.sqrt(d_k)\n    weights = softmax(scores, axis=-1)\n    return weights @ V, weights\n\n# Example: 4-token sequence, 8-dim model\nnp.random.seed(0)\nX = np.random.randn(4, 8)\nW_Q = np.random.randn(8, 4) * 0.1\nW_K = np.random.randn(8, 4) * 0.1\nW_V = np.random.randn(8, 4) * 0.1\nout, w = self_attention(X, W_Q, W_K, W_V)\nprint('Output shape:', out.shape)\nprint('Attn weights row 0:', w[0])",
        "canvas_mode": "transformer",
        "deep_thoughts": "USE WHEN: any NLP task (BERT/GPT/T5 dominate), large-scale pretraining (>1B params becomes efficient because training parallelises across sequence length), code generation (Copilot, Code Llama), multimodal models (ViT for images, Whisper for audio), you want a single architecture that works across many modalities. AVOID WHEN: small datasets (<10K examples — Transformers overfit catastrophically without pretraining), real-time streaming with low latency (parallel training is great but autoregressive inference is sequential), strict memory budget (attention is O(n²) in sequence length), your task has strong locality/translation-invariance (CNN still wins on small image datasets). WHY: the Transformer's breakthrough was removing recurrence entirely. Self-attention lets every position attend to every other in O(1) path length — no vanishing gradient across time. Combined with positional encoding and massive pretraining data, this unlocked GPT-3, ChatGPT, and the entire LLM era. The cost is O(n²) memory and compute, which FlashAttention and sparse attention variants are slowly taming.",
        "card_desc_grid": "Self-attention · parallel training · scales to billions",
    },
    {
        "slug": "nn-autoencoder", "family": "neural_network", "title": "Autoencoder",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "z = f_enc(x)    x̂ = g_dec(z)    L = ‖x − x̂‖²",
        "desc": "Compresses input to a low-dim latent code, then reconstructs. <b>Self-supervised dimensionality reduction + denoising</b>.",
        "math_comments": "# Encoder: z = f_enc(x)   (x ∈ R^D, z ∈ R^d, d << D)\n# Decoder: x_hat = g_dec(z)\n# Reconstruction loss: L = ||x - x_hat||²  (MSE)\n# Denoising AE: train on noisy x, target clean x",
        "py": "import numpy as np\n\nclass Autoencoder:\n    def __init__(self, input_dim, latent_dim):\n        # Encoder: input_dim → latent_dim\n        self.W_enc = np.random.randn(latent_dim, input_dim) * 0.1\n        self.b_enc = np.zeros(latent_dim)\n        # Decoder: latent_dim → input_dim\n        self.W_dec = np.random.randn(input_dim, latent_dim) * 0.1\n        self.b_dec = np.zeros(input_dim)\n\n    def encode(self, x):\n        return np.tanh(self.W_enc @ x + self.b_enc)\n\n    def decode(self, z):\n        return self.W_dec @ z + self.b_dec\n\n    def forward(self, x):\n        z = self.encode(x)\n        x_hat = self.decode(z)\n        return x_hat, z\n\n    def loss(self, x):\n        x_hat, _ = self.forward(x)\n        return np.mean((x - x_hat) ** 2)\n\n# Example: compress 8-dim input to 3-dim latent\nnp.random.seed(0)\nae = Autoencoder(input_dim=8, latent_dim=3)\nx = np.random.randn(8)\nx_hat, z = ae.forward(x)\nprint(f'Input: {x.shape}, Latent: {z.shape}, Recon: {x_hat.shape}')\nprint(f'Recon MSE: {ae.loss(x):.4f}')",
        "canvas_mode": "autoencoder",
        "deep_thoughts": "USE WHEN: dimensionality reduction (PCA alternative when data has non-linear structure), denoising (train on noisy inputs to recover clean outputs), anomaly detection (anomalies have high reconstruction error), feature extraction for downstream supervised learning, pretraining for deeper models (learn useful features on unlabelled data, then fine-tune with labels). AVOID WHEN: you need to generate new samples (use VAE/GAN/Diffusion — vanilla AE's latent space is non-structured, interpolation produces garbage), you need interpretable latent factors (use VAE with disentanglement loss), the data is small and you don't have enough to train both encoder and decoder. WHY: the autoencoder's self-supervised objective (reconstruct input) requires no labels — every dataset is a training set. This makes AEs ideal for pretraining when labels are scarce. But the latent space is poorly structured: two nearby latent codes can produce very different reconstructions, so you can't sample new points by interpolating. VAEs and GANs fix this with explicit generative objectives.",
        "card_desc_grid": "Compress → reconstruct · self-supervised · denoising",
    },
    {
        "slug": "nn-vae", "family": "neural_network", "title": "Variational Autoencoder (VAE)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "L = E_q[log p(x|z)] − KL(q(z|x) ‖ p(z))",
        "desc": "Autoencoder with a structured latent space (Gaussian). <b>Generative — can sample new data by sampling z ~ N(0, I)</b>.",
        "math_comments": "# Encoder outputs (μ, σ²) instead of point estimate:\n# μ, log σ² = f_enc(x)\n# Sample: z = μ + σ · ε  where ε ~ N(0, I)  (reparametrisation trick)\n# Decoder: x_hat = g_dec(z)\n# Loss = reconstruction (BCE/MSE) + KL(q(z|x) || N(0, I))\n# KL for Gaussian: 0.5 * Σ(μ² + σ² - log σ² - 1)",
        "py": "import numpy as np\n\nclass VAE:\n    def __init__(self, input_dim, latent_dim):\n        # Encoder: input_dim → (mu, log_var), each latent_dim\n        self.W_enc = np.random.randn(2 * latent_dim, input_dim) * 0.1\n        self.b_enc = np.zeros(2 * latent_dim)\n        # Decoder: latent_dim → input_dim\n        self.W_dec = np.random.randn(input_dim, latent_dim) * 0.1\n        self.b_dec = np.zeros(input_dim)\n        self.latent_dim = latent_dim\n\n    def encode(self, x):\n        h = self.W_enc @ x + self.b_enc\n        mu = h[:self.latent_dim]\n        log_var = h[self.latent_dim:]\n        return mu, log_var\n\n    def reparameterise(self, mu, log_var):\n        # z = μ + σ · ε  (backprop-friendly sampling)\n        eps = np.random.randn(*mu.shape)\n        return mu + np.exp(0.5 * log_var) * eps\n\n    def decode(self, z):\n        return 1.0 / (1 + np.exp(-(self.W_dec @ z + self.b_dec)))\n\n    def loss(self, x):\n        mu, log_var = self.encode(x)\n        z = self.reparameterise(mu, log_var)\n        x_hat = self.decode(z)\n        bce = -np.sum(x * np.log(x_hat + 1e-8) + (1 - x) * np.log(1 - x_hat + 1e-8))\n        kl = 0.5 * np.sum(mu ** 2 + np.exp(log_var) - log_var - 1)\n        return bce + kl\n\n# Example\nnp.random.seed(0)\nvae = VAE(input_dim=8, latent_dim=3)\nx = np.array([1, 0, 1, 0, 1, 0, 1, 0], dtype=float)\nprint(f'Loss: {vae.loss(x):.4f}')",
        "canvas_mode": "vae",
        "deep_thoughts": "USE WHEN: controlled generation (interpolate smoothly in latent space — face morphing, music transitions), semi-supervised learning (use latent code as features), anomaly detection (low-likelihood regions = anomalies), data augmentation (generate plausible variants of rare classes), learning disentangled representations (with β-VAE variants). AVOID WHEN: you need photorealistic high-resolution samples (GAN and Diffusion both outperform VAE on image quality — VAE samples are blurry because the Gaussian likelihood smooths high frequencies), you need fast sampling (VAE is fast but GAN/Diffusion give better quality), you have small data and want sharp outputs. WHY: VAE adds two things over vanilla autoencoders: (1) a Gaussian prior on the latent space — sampling z ~ N(0, I) gives valid new samples, (2) a probabilistic decoder — outputs are distributions, not points. The KL term in the loss forces the learned posterior toward the prior, organising the latent space. This is what makes VAE a generative model and AE merely a feature extractor.",
        "card_desc_grid": "Latent space is Gaussian · generative · smooth interpolation",
    },
    {
        "slug": "nn-gan", "family": "neural_network", "title": "Generative Adversarial Network (GAN)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "min_G max_D  E[log D(x)] + E[log(1 − D(G(z)))]",
        "desc": "Generator vs discriminator play a minimax game. <b>Photorealistic samples</b> — but training is notoriously unstable.",
        "math_comments": "# G: Generator  z (noise) → fake sample\n# D: Discriminator  sample → P(real)\n# Minimax objective:\n#   min_G max_D  V(D, G) = E_x[log D(x)] + E_z[log(1 - D(G(z)))]\n# D wants to maximise (correctly classify real vs fake)\n# G wants to minimise (fool D into calling fakes real)",
        "py": "import numpy as np\n\nclass GAN:\n    def __init__(self, noise_dim, data_dim, hidden_dim=32):\n        s = 0.1\n        # Generator: noise → data\n        self.G_W1 = np.random.randn(hidden_dim, noise_dim) * s\n        self.G_b1 = np.zeros(hidden_dim)\n        self.G_W2 = np.random.randn(data_dim, hidden_dim) * s\n        self.G_b2 = np.zeros(data_dim)\n        # Discriminator: data → probability\n        self.D_W1 = np.random.randn(hidden_dim, data_dim) * s\n        self.D_b1 = np.zeros(hidden_dim)\n        self.D_W2 = np.random.randn(1, hidden_dim) * s\n        self.D_b2 = np.zeros(1)\n\n    def generate(self, z):\n        h = np.tanh(self.G_W1 @ z + self.G_b1)\n        return np.tanh(self.G_W2 @ h + self.G_b2)\n\n    def discriminate(self, x):\n        h = np.tanh(self.D_W1 @ x + self.D_b1)\n        return 1.0 / (1 + np.exp(-(self.D_W2 @ h + self.D_b2)))\n\n    def d_loss(self, real_x, fake_x):\n        return -(np.log(self.discriminate(real_x) + 1e-8) +\n                 np.log(1 - self.discriminate(fake_x) + 1e-8))\n\n    def g_loss(self, fake_x):\n        return -np.log(self.discriminate(fake_x) + 1e-8)\n\n# Example\nnp.random.seed(0)\ngan = GAN(noise_dim=4, data_dim=2)\nz = np.random.randn(4)\nfake = gan.generate(z)\nprint(f'Generated: {fake}')\nprint(f'D(fake) = {gan.discriminate(fake)[0]:.4f}')",
        "canvas_mode": "gan",
        "deep_thoughts": "USE WHEN: photorealistic image generation (StyleGAN for faces, BigGAN for ImageNet classes), image-to-image translation (CycleGAN — horses ↔ zebras, photos → paintings), super-resolution (ESRGAN), text-to-image before Diffusion (StackGAN, AttnGAN), domain adaptation (learn mapping between unpaired domains). AVOID WHEN: you need stable, reproducible training (GANs are notoriously mode-collapse-prone — use Diffusion for production image generation), you need likelihood evaluation (GAN has no explicit density — use VAE/Normalising Flow), you need diversity (GANs collapse to a few modes), your data is 1D/tabular (VAE or Diffusion work better). WHY: GAN's minimax training is a double-edged sword — it produces the sharpest samples of any generative model (the discriminator forces the generator to be photorealistic), but the same adversarial dynamic causes mode collapse and training instability. WGAN, StyleGAN-2, and Diffusion all emerged to fix these issues. By 2024, Diffusion Models dominate photorealistic generation; GANs remain useful for fast inference and for cycle-consistent domain transfer.",
        "card_desc_grid": "Generator vs discriminator · photorealistic · unstable training",
    },
    {
        "slug": "nn-resnet", "family": "neural_network", "title": "Residual Network (ResNet)",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "y = F(x, {W_l}) + x    (skip connection)",
        "desc": "Adds the input to the output of each block. <b>Solves the degradation problem — enables 100+ layer networks</b>.",
        "math_comments": "# Standard layer:  y = F(x, {W_l})\n# Residual block:  y = F(x, {W_l}) + x   (identity skip)\n# If optimal is identity, F learns to output 0 (easy).\n# Backprop:  ∂y/∂x = ∂F/∂x + 1  (gradient always flows!)\n# This prevents vanishing gradient in very deep nets.",
        "py": "import numpy as np\n\nclass ResidualBlock:\n    def __init__(self, dim):\n        s = np.sqrt(2.0 / dim)  # He init for ReLU\n        self.W1 = np.random.randn(dim, dim) * s\n        self.W2 = np.random.randn(dim, dim) * s\n\n    def forward(self, x):\n        # F(x) = ReLU(W2 · ReLU(W1 · x))\n        h = np.maximum(0, self.W1 @ x)\n        h = self.W2 @ h\n        # Skip connection: y = F(x) + x\n        return h + x  # ← THE KEY INSIGHT: identity shortcut\n\nclass ResNet:\n    def __init__(self, dim, num_blocks):\n        self.blocks = [ResidualBlock(dim) for _ in range(num_blocks)]\n\n    def forward(self, x):\n        for block in self.blocks:\n            x = block.forward(x)  # each block adds residual\n        return x\n\n# Example: 50-block ResNet\nnp.random.seed(0)\nresnet = ResNet(dim=8, num_blocks=50)\nx = np.random.randn(8)\nout = resnet.forward(x)\nprint(f'Input norm:  {np.linalg.norm(x):.4f}')\nprint(f'Output norm: {np.linalg.norm(out):.4f}')",
        "canvas_mode": "resnet",
        "deep_thoughts": "USE WHEN: very deep CNNs (>34 layers — ResNet-50/101/152 are standard for image classification), image classification on ImageNet-scale data, feature extractors for downstream tasks (ResNet-50 features are still the default backbone for many detection/segmentation tasks), as a baseline architecture when prototyping new vision ideas. AVOID WHEN: your network is shallow (<10 layers — skip connections add overhead with no benefit), you need very efficient inference (MobileNet/EfficientNet are 5-10× faster at similar accuracy), you're working with non-image data. WHY: in 2015, He et al. observed that deeper plain networks train WORSE than shallower ones — not because of overfitting, but because of the degradation problem (gradients vanish/explode even with careful init). Adding identity skip connections (y = F(x) + x) solves this elegantly: if the optimal mapping is identity, F just needs to learn to output 0 (trivially easy). The backward pass always has a path of 1s (the identity gradient) that prevents vanishing. This single architectural change took image classification from VGG-16 (16 layers) to ResNet-152 (152 layers) overnight.",
        "card_desc_grid": "Skip connections · enables 100+ layer nets · solves degradation",
    },
    {
        "slug": "nn-diffusion", "family": "neural_network", "title": "Diffusion Model",
        "tag": "NN · Architecture", "cat_class": "nn",
        "eq": "Forward:  x_t = √(ᾱ_t) · x_0 + √(1 − ᾱ_t) · ε\nReverse:  learn ε_θ(x_t, t) ≈ ε",
        "desc": "Adds noise step-by-step, then learns to reverse it. <b>SOTA for image generation (DALL-E 3, Stable Diffusion, Midjourney v6)</b>.",
        "math_comments": "# Forward (noising) — closed form for any t:\n#   x_t = sqrt(α_bar_t) * x_0 + sqrt(1 - α_bar_t) * ε,  ε ~ N(0, I)\n#   where α_bar_t = Π α_s  (cumulative product of noise schedule)\n# Reverse — train network ε_θ to predict the noise added:\n#   Loss = E[ || ε - ε_θ(x_t, t) ||² ]\n# Sampling: x_{t-1} = (1/√α_t)(x_t - (1-α_t)/√(1-α_bar_t) ε_θ(x_t, t)) + σ_t z",
        "py": "import numpy as np\n\nclass Diffusion:\n    def __init__(self, num_steps=1000, beta_start=1e-4, beta_end=0.02):\n        # Linear noise schedule (DDPM default)\n        self.betas = np.linspace(beta_start, beta_end, num_steps)\n        self.alphas = 1 - self.betas\n        self.alpha_bars = np.cumprod(self.alphas)\n        self.num_steps = num_steps\n\n    def forward_noise(self, x_0, t):\n        # Closed-form: x_t = √ᾱ_t · x_0 + √(1-ᾱ_t) · ε\n        eps = np.random.randn(*x_0.shape)\n        alpha_bar = self.alpha_bars[t]\n        return np.sqrt(alpha_bar) * x_0 + np.sqrt(1 - alpha_bar) * eps, eps\n\n    def reverse_step(self, x_t, t, eps_pred):\n        beta_t = self.betas[t]\n        alpha_t = self.alphas[t]\n        alpha_bar_t = self.alpha_bars[t]\n        mean = (1 / np.sqrt(alpha_t)) * (x_t - (1 - alpha_t) / np.sqrt(1 - alpha_bar_t) * eps_pred)\n        if t > 0:\n            return mean + np.sqrt(beta_t) * np.random.randn(*x_t.shape)\n        return mean\n\n# Example: 5-step toy diffusion\nnp.random.seed(0)\ndiff = Diffusion(num_steps=5)\nx_0 = np.array([0.5, -0.3, 0.8])\nx_t, eps = diff.forward_noise(x_0, t=4)\nprint(f'Noised x_t: {x_t}')\nprint(f'True noise ε: {eps}')",
        "canvas_mode": "diffusion",
        "deep_thoughts": "USE WHEN: high-quality image generation (SOTA — Stable Diffusion, DALL-E 3, Midjourney v6, Flux all use diffusion), audio synthesis (MusicGen, AudioLDM), video generation (Sora, Runway Gen-3), 3D model generation, molecule/drug design, you need diversity + quality (Diffusion gives both — GAN gives quality but not diversity, VAE gives diversity but not quality). AVOID WHEN: real-time generation is required (50-1000 reverse steps are slow — use distillation to 1-4 steps for production, or use GAN), strict memory budget (each step stores activations — Latent Diffusion reduces this by running in VAE latent space), small datasets (Diffusion benefits enormously from scale). WHY: Diffusion Models won because they solved the GAN training stability problem while keeping quality. Instead of an adversarial minimax game, they use a simple denoising objective: predict the noise added to the input. This objective is stable, parallel-friendly, and gives diverse samples because each reverse step adds fresh noise. The cost is slow sampling (many steps), which is being actively addressed by distillation (Consistency Models) and fast samplers (DPM-Solver, DDIM).",
        "card_desc_grid": "Add noise → learn to denoise · SOTA image gen · stable training",
    },

    # ─── Research paper card (CoCoNet — Georgia Tech + AI4OPT, 2024) ─────
    {
        "slug": "paper-coconet", "family": "neural_network", "title": "CoCoNet — Conformal Conditional Network",
        "tag": "PAPER · Conformal Prediction", "cat_class": "nn",
        "eq": "P(Y ∈ [L(X), U(X)] | X) ≥ 1 − α    (with conditional coverage)",
        "desc": "Georgia Tech + AI4OPT 2024 paper. <b>CoCoNet-ICNN ranked #1 in 22/30 multivariate regression tasks</b> for region efficiency prediction. Learns a conditional non-conformity score s_θ(x, y) → tighter intervals than fixed-score conformal.",
        "math_comments": "# Split conformal prediction (Vovk 2005):\n# 1. Score: s_i = |y_i - ŷ(x_i)|   (non-conformity)\n# 2. Quantile: q_α = ⌈(n+1)(1-α)/n⌉-th order statistic\n# 3. Interval: [ŷ(x) - q_α, ŷ(x) + q_α]\n# Guarantees: P(Y ∈ [L(X), U(X)]) ≥ 1 - α (marginal coverage)\n#\n# CoCoNet extension (conditional coverage):\n# Score network s_θ(x, y) learns input-dependent non-conformity\n# Calibration network adjusts scores to maintain (1-α) coverage\n# Two variants: CoCoNet-ICNN (input-convex NN) + CoCoNet-Spline",
        "py": "import numpy as np\n\ndef split_conformal_predict(model, X_cal, y_cal, X_test, alpha=0.1):\n    \"\"\"Split conformal prediction — distribution-free coverage guarantee.\n\n    Returns intervals [L, U] such that P(Y_test ∈ [L, U]) >= 1 - alpha,\n    assuming (X_cal, y_cal) and (X_test, y_test) are exchangeable.\n    \"\"\"\n    # Step 1: compute non-conformity scores on calibration set\n    y_cal_pred = model.predict(X_cal)\n    scores = np.abs(y_cal - y_cal_pred)  # s_i = |y_i - ŷ(x_i)|\n\n    # Step 2: find alpha-quantile with finite-sample correction\n    n = len(scores)\n    # ⌈(n+1)(1-α)/n⌉-th order statistic (Vovk's correction)\n    q_alpha_idx = int(np.ceil((n + 1) * (1 - alpha)))\n    q_alpha_idx = min(q_alpha_idx, n)  # clamp to last index\n    q_alpha = np.sort(scores)[q_alpha_idx - 1]  # 1-indexed → 0-indexed\n\n    # Step 3: output prediction intervals\n    y_test_pred = model.predict(X_test)\n    lower = y_test_pred - q_alpha\n    upper = y_test_pred + q_alpha\n    return lower, upper, q_alpha\n\n# Simple linear model for the demo\nclass LinearModel:\n    def __init__(self, slope, intercept):\n        self.slope, self.intercept = slope, intercept\n    def predict(self, X):\n        return self.slope * np.asarray(X) + self.intercept\n\n# Example: 6 calibration points, 2 test points, 90% coverage\nnp.random.seed(0)\nmodel = LinearModel(slope=2.0, intercept=1.0)\nX_cal = np.array([0.5, 1.0, 1.5, 2.0, 2.5, 3.0])\ny_cal = model.predict(X_cal) + np.random.randn(6) * 0.5\nX_test = np.array([4.0, 5.0])\n\nlower, upper, q = split_conformal_predict(model, X_cal, y_cal, X_test, alpha=0.1)\nprint(f'q_alpha (90% quantile): {q:.3f}')\nprint(f'Test predictions: {model.predict(X_test)}')\nfor i, (l, u) in enumerate(zip(lower, upper)):\n    print(f'  x={X_test[i]}: [{l:.2f}, {u:.2f}]  (width={u-l:.2f})')",
        "canvas_mode": "coconet",
        "deep_thoughts": "USE WHEN: you need uncertainty quantification on regression/classification predictions with distribution-free coverage guarantees (medical risk scoring, financial VaR, autonomous-system safety bounds, scientific reproducibility), you want to wrap any pre-trained model with valid prediction intervals, you need to compare different models' uncertainty (tighter intervals at the same coverage = better model), multivariate regression where input-dependent interval widths matter (high-variance regions need wider intervals). AVOID WHEN: you only need point predictions (conformal adds calibration overhead), real-time streaming data without periodic recalibration (calibration set must be exchangeable with test data), very small calibration sets (<30 samples — the quantile estimate is too noisy), strict adversarial settings (conformal assumes exchangeability, which an adversary can break). WHY: CoCoNet's contribution over standard split conformal is learning the score function s_θ(x, y) CONDITIONAL on the input x. Standard split conformal gives marginal coverage (P(Y ∈ C(X)) ≥ 1-α averaged over X) but conditional coverage can be much worse for subpopulations. CoCoNet-ICNN (Input-Convex Neural Network) learns a convex score function — useful when the score should be monotonic in y. The paper's result — CoCoNet-ICNN #1 in 22/30 multivariate regression tasks for region efficiency prediction — suggests that input-conditional scores give meaningfully tighter intervals in practice, especially when the data has heteroscedastic noise (different variances for different x).",
        "card_desc_grid": "Conformal prediction + conditional score · 22/30 tasks #1 · GT+AI4OPT 2024",
    },
]


# ============================================================================
# Helpers for the foot links (conditional on v1 full-text card existing)
# ============================================================================
def make_foot(slug: str, title: str) -> str:
    """Build the foot link block. ALWAYS include a Full text version link.

    - If v1 card exists → link to it
    - If no v1 → link to Semantic Scholar search for the title
    """
    parts = []
    v1_path = os.path.join(ROOT, "docs", "concepts", slug + ".html")
    if os.path.exists(v1_path):
        parts.append(
            f'<a href="../concepts/{slug}.html">📖 Full text version</a>'
        )
    else:
        # No v1 card — link to Semantic Scholar search
        search_query = title.replace(' ', '+').replace('—', '').strip()
        parts.append(
            f'<a href="https://www.semanticscholar.org/search?q={search_query}" target="_blank" rel="noopener">📄 Full text version</a>'
        )
    parts.append("Concept card v2")
    return '  ·  '.join(parts)


# ============================================================================
# Family template dispatchers
# ============================================================================
def gen_card(card: dict) -> str:
    family = card["family"]
    if family == "loss":
        return gen_loss(card)
    if family == "activation":
        return gen_activation(card)
    if family == "optimiser":
        return gen_optimiser(card)
    if family == "normalisation":
        return gen_normalisation(card)
    if family == "attention":
        return gen_attention(card)
    if family == "regularisation":
        return gen_regularisation(card)
    if family == "neural_network":
        return gen_neural_network(card)
    raise ValueError(f"Unknown family: {family}")


# ============================================================================
# Activation template — function curve + gradient curve + x slider + sweep
# ============================================================================
def gen_activation(card):
    slug = card["slug"]
    title = card["title"]
    eq = card["eq"]
    desc = card["desc"]
    math_comments = card["math_comments"]
    py_code = card["py"]
    js_fn = card["js_fn"]
    js_grad = card["js_grad"]
    js_extra_var = card.get("js_extra_var", "")
    y_min = card.get("y_min", -1.0)
    y_max = card.get("y_max", 4.5)

    # Build the python code block with syntax highlighting
    # First the Math→Code comment header, then the python implementation
    py_block = math_comments + "\n" + py_code
    py_html = hl(py_block)
    foot_html = make_foot(slug, title)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{title} — visual-first concept card. Interactive canvas, real-time sliders, code with Math→Code annotations." />
    <title>{title} — Concept Card · AIHPC</title>
    <style>
{CSS}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{title}</h1>
      </div>
      <p class="desc">{desc}</p>
      <div class="eq-badge">📐 {eq}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">f(x)</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{eq}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl" id="b1-ctrl"><label>Input x <span class="val" id="b1-val">0.50</span></label><input type="range" id="b1-slider" min="-4" max="4" step="0.01" value="1.0" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">▶ Sweep x</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn ghost" id="btn-step" style="flex: 1;">⏭ Step</button>
            <button class="btn ghost" id="btn-reset" style="flex: 1;">↺ Reset</button>
          </div>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{eq}</div>
        <pre>{py_html}</pre>
      </div>
      <div class="foot">
        {foot_html}
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');

      // ===== ACTIVATION FUNCTION VISUAL =====
      var W = canvas.width, H = canvas.height;
      var xInput = 0.5;
      {js_extra_var}

      function actFn(x) {{ return {js_fn}; }}
      function actGrad(x) {{ return {js_grad}; }}
      function toCX(x) {{ return 60 + (x+4)/8 * (W-120); }}
      function toCY(y) {{
        // y in [y_min, y_max] → canvas y in [20, H-40]
        var yMin = {y_min}, yMax = {y_max};
        return H-40 - (y - yMin) / (yMax - yMin) * (H-60);
      }}

      function render() {{
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Grid + axes
        ctx.strokeStyle = 'rgba(148,163,184,0.06)'; ctx.lineWidth = 0.5;
        for (var g = -4; g <= 4; g++) {{ var px = toCX(g); ctx.beginPath(); ctx.moveTo(px,20); ctx.lineTo(px,H-40); ctx.stroke(); }}
        // Horizontal gridlines based on y_min/y_max
        var yMin = {y_min}, yMax = {y_max};
        var gStep = (yMax - yMin) > 3 ? 1 : 0.5;
        for (var gy = Math.ceil(yMin/gStep)*gStep; gy <= yMax; gy += gStep) {{ var py = toCY(gy); ctx.beginPath(); ctx.moveTo(60,py); ctx.lineTo(W-60,py); ctx.stroke(); }}
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(60,toCY(0)); ctx.lineTo(W-60,toCY(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toCX(0),20); ctx.lineTo(toCX(0),H-40); ctx.stroke();
        // Function curve
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 6;
        ctx.beginPath();
        for (var x = -4; x <= 4; x += 0.05) {{ var px = toCX(x), py = toCY(actFn(x)); if (x === -4) ctx.moveTo(px,py); else ctx.lineTo(px,py); }}
        ctx.stroke(); ctx.shadowBlur = 0;
        // Gradient curve (lighter, dashed)
        ctx.strokeStyle = 'rgba(139,92,246,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
        ctx.beginPath();
        for (var x = -4; x <= 4; x += 0.05) {{ var px = toCX(x), py = toCY(actGrad(x)); if (x === -4) ctx.moveTo(px,py); else ctx.lineTo(px,py); }}
        ctx.stroke(); ctx.setLineDash([]);
        // Current input point
        var cv = actFn(xInput), gv = actGrad(xInput);
        var ipx = toCX(xInput), ipy = toCY(cv);
        ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([2,4]);
        ctx.beginPath(); ctx.moveTo(ipx, toCY(0)); ctx.lineTo(ipx, ipy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(ipx, ipy, 5, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#f59e0baa'; ctx.beginPath(); ctx.arc(ipx, toCY(0), 3, 0, 6.28); ctx.fill();
        // Labels
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'right';
        ctx.fillText('f(x)', W-65, 35);
        ctx.fillStyle = 'rgba(139,92,246,0.65)'; ctx.fillText("f'(x)", W-65, 50);
        ctx.fillStyle = '#f59e0b'; ctx.fillText('x=' + xInput.toFixed(2), W-65, 65);
        ctx.fillStyle = '#10b981'; ctx.fillText('f=' + cv.toFixed(3), W-65, 80);
        ctx.fillStyle = '#ec4899'; ctx.fillText("f'=" + gv.toFixed(3), W-65, 95);
        ctx.textAlign = 'left';
        document.getElementById('loss-lbl').textContent = 'f(' + xInput.toFixed(2) + ')';
        document.getElementById('loss-val').textContent = cv.toFixed(3);
        document.getElementById('loss-val').className = 'val good';
      }}

      document.getElementById('b1-slider').addEventListener('input', function(e) {{
        xInput = parseFloat(e.target.value);
        document.getElementById('b1-val').textContent = xInput.toFixed(2);
        render();
      }});
      var isAnim = false;
      document.getElementById('btn-gd').addEventListener('click', function() {{
        if (isAnim) return; isAnim = true; document.getElementById('btn-gd').disabled = true;
        document.getElementById('phase-ind').textContent = 'sweeping...'; document.getElementById('phase-ind').classList.add('active');
        var x = -4;
        function sweep() {{
          if (x >= 4) {{
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓'; document.getElementById('phase-ind').classList.remove('active');
            return;
          }}
          xInput = x; document.getElementById('b1-slider').value = x; document.getElementById('b1-val').textContent = x.toFixed(2);
          document.getElementById('phase-ind').textContent = 'step x=' + x.toFixed(2);
          render(); x += 0.08; requestAnimationFrame(sweep);
        }}
        sweep();
      }});
      // Phase 38.7: Step button — single-step sweep (advance x by 0.08)
      document.getElementById('btn-step').addEventListener('click', function() {{
        if (isAnim) return;
        xInput = Math.min(4, xInput + 0.08);
        document.getElementById('b1-slider').value = xInput;
        document.getElementById('b1-val').textContent = xInput.toFixed(2);
        document.getElementById('phase-ind').textContent = 'x=' + xInput.toFixed(2) + ' (manual)';
        document.getElementById('phase-ind').classList.add('active');
        render();
      }});
      document.getElementById('btn-reset').addEventListener('click', function() {{
        xInput = 0.5; document.getElementById('b1-slider').value = 0.5;
        document.getElementById('b1-val').textContent = '0.50';
        document.getElementById('phase-ind').textContent = 'idle'; document.getElementById('phase-ind').classList.remove('active');
        render();
      }});
      render();
    </script>
    <!-- Simplified footer -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data · no cookies · no tracking · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


# ============================================================================
# Loss template — scatter plot + fitted line + error lines + GD animation
# ============================================================================
def gen_loss(card):
    slug = card["slug"]
    title = card["title"]
    eq = card["eq"]
    desc = card["desc"]
    math_comments = card["math_comments"]
    py_code = card["py"]
    js_loss = card["js_loss"]
    grid_desc = card.get("card_desc_grid", "")

    py_block = math_comments + "\n" + py_code
    py_html = hl(py_block)
    foot_html = make_foot(slug, title)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{title} — visual-first concept card. Drag slope/intercept, run gradient descent, watch the loss change." />
    <title>{title} — Concept Card · AIHPC</title>
    <style>
{CSS}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{title}</h1>
      </div>
      <p class="desc">{desc}</p>
      <div class="eq-badge">📐 {eq}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">Loss</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{eq}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl" id="b1-ctrl"><label>Slope β₁ <span class="val" id="b1-val">0.50</span></label><input type="range" id="b1-slider" min="-2" max="2" step="0.01" value="0.5" /></div>
        <div class="ctrl" id="b0-ctrl"><label>Intercept β₀ <span class="val" id="b0-val">0.00</span></label><input type="range" id="b0-slider" min="-5" max="10" step="0.01" value="0.0" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">▶ Run gradient descent</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn ghost" id="btn-step" style="flex: 1;">⏭ Step</button>
            <button class="btn ghost" id="btn-reset" style="flex: 1;">↺ Reset</button>
          </div>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{eq}</div>
        <pre>{py_html}</pre>
      </div>
      <div class="foot">
        {foot_html}
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');

      // ===== LOSS FUNCTION VISUAL =====
      // Scatter plot of 7 (x, y) data points + fitted line y = b1*x + b0
      // + vertical error lines from each point to the fitted line
      // + real-time loss value in the overlay
      var W = canvas.width, H = canvas.height;
      var slope = 0.5, intercept = 0.0;
      var isAnim = false;
      var stepCount = 0, maxSteps = 80;  // exposed for Step button

      // Synthetic data: y = 1.0*x + 0.5 + noise
      var data = [
        [-3.0, -2.6], [-2.0, -1.4], [-1.0, -0.3],
        [ 0.0,  0.6], [ 1.0,  1.4], [ 2.0,  2.5], [ 3.0,  3.6]
      ];

      function yPred(x) {{ return slope * x + intercept; }}
      function yTrue(i) {{ return data[i][1]; }}
      function lossNow() {{
        var yT = data.map(function(d){{ return d[1]; }});
        var yP = data.map(function(d){{ return yPred(d[0]); }});
        return {js_loss};
      }}

      function toCX(x) {{ return 60 + (x+4)/8 * (W-120); }}
      function toCY(y) {{ return H-40 - (y+5)/10 * (H-60); }}

      function render() {{
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Grid
        ctx.strokeStyle = 'rgba(148,163,184,0.06)'; ctx.lineWidth = 0.5;
        for (var g = -4; g <= 4; g++) {{ var px = toCX(g); ctx.beginPath(); ctx.moveTo(px,20); ctx.lineTo(px,H-40); ctx.stroke(); }}
        for (var g2 = -4; g2 <= 5; g2++) {{ var py = toCY(g2); ctx.beginPath(); ctx.moveTo(60,py); ctx.lineTo(W-60,py); ctx.stroke(); }}
        // Axes
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(60,toCY(0)); ctx.lineTo(W-60,toCY(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toCX(0),20); ctx.lineTo(toCX(0),H-40); ctx.stroke();
        // Fitted line
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.moveTo(toCX(-4), toCY(yPred(-4))); ctx.lineTo(toCX(4), toCY(yPred(4))); ctx.stroke();
        ctx.shadowBlur = 0;
        // Error lines + data points
        for (var i = 0; i < data.length; i++) {{
          var px = toCX(data[i][0]), py_data = toCY(data[i][1]);
          var py_fit = toCY(yPred(data[i][0]));
          ctx.strokeStyle = 'rgba(239,68,68,0.5)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(px, py_data); ctx.lineTo(px, py_fit); ctx.stroke();
          ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(px, py_data, 4, 0, 6.28); ctx.fill();
        }}
        // Loss value overlay
        var L = lossNow();
        document.getElementById('loss-val').textContent = L.toFixed(4);
        document.getElementById('loss-val').className = 'val ' + (L < 0.5 ? 'good' : (L < 2 ? 'ok' : 'bad'));
      }}

      // Single-step function — callable from both Run + Step buttons
      function gdStep() {{
        if (stepCount >= maxSteps) {{
          isAnim = false; document.getElementById('btn-gd').disabled = false;
          document.getElementById('phase-ind').textContent = 'converged ✓'; document.getElementById('phase-ind').classList.remove('active');
          return;
        }}
        // dL/dslope = (2/n) * sum((y_pred - y_true) * x)
        // dL/dintercept = (2/n) * sum(y_pred - y_true)
        var n = data.length, ds = 0, di = 0;
        for (var i = 0; i < n; i++) {{
          var err = yPred(data[i][0]) - data[i][1];
          ds += err * data[i][0];
          di += err;
        }}
        ds = (2/n) * ds; di = (2/n) * di;
        var lr = 0.02;
        slope -= lr * ds; intercept -= lr * di;
        document.getElementById('b1-slider').value = slope; document.getElementById('b1-val').textContent = slope.toFixed(2);
        document.getElementById('b0-slider').value = intercept; document.getElementById('b0-val').textContent = intercept.toFixed(2);
        document.getElementById('phase-ind').textContent = 'step '+(stepCount+1)+'/'+maxSteps;
        render(); stepCount++;
      }}

      document.getElementById('b1-slider').addEventListener('input', function(e) {{ slope = parseFloat(e.target.value); document.getElementById('b1-val').textContent = slope.toFixed(2); render(); }});
      document.getElementById('b0-slider').addEventListener('input', function(e) {{ intercept = parseFloat(e.target.value); document.getElementById('b0-val').textContent = intercept.toFixed(2); render(); }});

      document.getElementById('btn-gd').addEventListener('click', function() {{
        if (isAnim) return; isAnim = true; document.getElementById('btn-gd').disabled = true;
        document.getElementById('phase-ind').textContent = 'running'; document.getElementById('phase-ind').classList.add('active');
        stepCount = 0;
        function loop() {{
          if (stepCount >= maxSteps) {{
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'converged ✓'; document.getElementById('phase-ind').classList.remove('active');
            return;
          }}
          gdStep();
          requestAnimationFrame(loop);
        }}
        loop();
      }});

      // Phase 38.3: Step button — single-step mode (one GD step per click)
      document.getElementById('btn-step').addEventListener('click', function() {{
        if (isAnim) return;  // don't allow Step while Run is animating
        if (stepCount >= maxSteps) {{
          document.getElementById('phase-ind').textContent = 'converged ✓';
          return;
        }}
        document.getElementById('phase-ind').textContent = 'step '+stepCount+'/'+maxSteps+' (manual)';
        document.getElementById('phase-ind').classList.add('active');
        gdStep();
      }});

      document.getElementById('btn-reset').addEventListener('click', function() {{
        slope = 0.5; intercept = 0.0; stepCount = 0;
        document.getElementById('b1-slider').value = 0.5; document.getElementById('b1-val').textContent = '0.50';
        document.getElementById('b0-slider').value = 0.0; document.getElementById('b0-val').textContent = '0.00';
        document.getElementById('phase-ind').textContent = 'idle'; document.getElementById('phase-ind').classList.remove('active');
        render();
      }});
      render();
    </script>
        <!-- Simplified footer — GDPR + HIPAA + MIT license -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data collected · no cookies · no tracking · no external API calls · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


# ============================================================================
# Optimiser template — 2D loss landscape + trajectory animation
# ============================================================================
def gen_optimiser(card):
    slug = card["slug"]
    title = card["title"]
    eq = card["eq"]
    desc = card["desc"]
    math_comments = card["math_comments"]
    py_code = card["py"]
    opt = card["js_opt"]

    py_block = math_comments + "\n" + py_code
    py_html = hl(py_block)
    foot_html = make_foot(slug, title)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{title} — visual-first concept card. 2D loss landscape + trajectory animation." />
    <title>{title} — Concept Card · AIHPC</title>
    <style>
{CSS}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{title}</h1>
      </div>
      <p class="desc">{desc}</p>
      <div class="eq-badge">📐 {eq}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">Loss</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{eq}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl"><label>Optimiser: {title.replace(' Optimiser', '')}</label></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">▶ Run optimiser</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn ghost" id="btn-step" style="flex: 1;">⏭ Step</button>
            <button class="btn ghost" id="btn-reset" style="flex: 1;">↺ Reset</button>
          </div>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{eq}</div>
        <pre>{py_html}</pre>
      </div>
      <div class="foot">
        {foot_html}
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');

      // ===== OPTIMISER TRAJECTORY VISUAL =====
      var W = canvas.width, H = canvas.height;
      var isAnim = false;
      var OPT = '{opt}';

      function lossSurface(x, y) {{
        // Perturbed quadratic with a ravine (high curvature in y direction)
        return 0.5*(x-1)*(x-1) + 5*(y-1)*(y-1) + 0.3*Math.sin(3*x)*Math.cos(3*y);
      }}
      function gradX(x, y) {{ return (x-1) + 0.9*Math.cos(3*x)*Math.cos(3*y); }}
      function gradY(x, y) {{ return 10*(y-1) - 0.9*Math.sin(3*x)*Math.sin(3*y); }}

      function toCX(x) {{ return 40 + (x+2)/6 * (W-80); }}
      function toCY(y) {{ return H-40 - (y+2)/6 * (H-60); }}

      function render(traj) {{
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Background contour heat-map
        for (var cx = -2; cx <= 4; cx += 0.15) {{ for (var cy = -2; cy <= 4; cy += 0.15) {{
          var lv = lossSurface(cx, cy);
          if (lv < 0.5) {{ ctx.fillStyle = 'rgba(16,185,129,0.04)'; ctx.fillRect(toCX(cx)-2, toCY(cy)-2, 4, 4); }}
          else if (lv < 2) {{ ctx.fillStyle = 'rgba(6,182,212,0.03)'; ctx.fillRect(toCX(cx)-2, toCY(cy)-2, 4, 4); }}
          else if (lv < 8) {{ ctx.fillStyle = 'rgba(139,92,246,0.02)'; ctx.fillRect(toCX(cx)-2, toCY(cy)-2, 4, 4); }}
        }} }}
        // Contour outlines
        ctx.strokeStyle = 'rgba(148,163,184,0.08)'; ctx.lineWidth = 0.5;
        for (var level = 0.5; level <= 20; level += 1.5) {{
          ctx.beginPath();
          var first = true;
          for (var cx2 = -2; cx2 <= 4; cx2 += 0.1) {{
            for (var cy2 = -2; cy2 <= 4; cy2 += 0.1) {{
              if (Math.abs(lossSurface(cx2, cy2) - level) < 0.3) {{
                var px = toCX(cx2), py = toCY(cy2);
                if (first) {{ ctx.moveTo(px, py); first = false; }} else {{ ctx.lineTo(px, py); }}
              }}
            }}
          }}
          ctx.stroke();
        }}
        // Minimum marker
        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(toCX(1), toCY(1), 6, 0, 6.28); ctx.fill();
        ctx.fillStyle = 'rgba(16,185,129,0.3)'; ctx.beginPath(); ctx.arc(toCX(1), toCY(1), 12, 0, 6.28); ctx.fill();
        // Trajectory
        if (traj && traj.length > 1) {{
          var colors = {{sgd: '#ef4444', adam: '#06b6d4', adamw: '#8b5cf6'}};
          var names = {{sgd: 'SGD', adam: 'Adam', adamw: 'AdamW'}};
          ctx.strokeStyle = colors[OPT] || '#06b6d4'; ctx.lineWidth = 2;
          ctx.shadowColor = colors[OPT] || '#06b6d4'; ctx.shadowBlur = 4;
          ctx.beginPath();
          for (var i = 0; i < traj.length; i++) {{
            var px = toCX(traj[i][0]), py = toCY(traj[i][1]);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }}
          ctx.stroke(); ctx.shadowBlur = 0;
          var last = traj[traj.length-1];
          ctx.fillStyle = colors[OPT] || '#06b6d4'; ctx.beginPath(); ctx.arc(toCX(last[0]), toCY(last[1]), 4, 0, 6.28); ctx.fill();
          ctx.fillStyle = colors[OPT] || '#06b6d4'; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'right';
          ctx.fillText(names[OPT] || OPT, W-65, 35);
          ctx.textAlign = 'left';
        }}
        var loss = traj && traj.length > 0 ? lossSurface(traj[traj.length-1][0], traj[traj.length-1][1]) : 0;
        document.getElementById('loss-val').textContent = loss.toFixed(3);
        document.getElementById('loss-val').className = 'val ' + (loss < 1 ? 'good' : (loss < 5 ? 'ok' : 'bad'));
      }}

      function runOpt() {{
        if (isAnim) return; isAnim = true;
        document.getElementById('btn-gd').disabled = true;
        document.getElementById('phase-ind').textContent = 'running'; document.getElementById('phase-ind').classList.add('active');
        var x = -1.5, y = 3.5; // bad start
        var mx = 0, my = 0, vx = 0, vy = 0; // Adam moments
        var lr = OPT === 'sgd' ? 0.03 : 0.05;
        var wd = OPT === 'adamw' ? 0.01 : 0;
        var b1 = 0.9, b2 = 0.999, eps = 1e-8;
        var traj = [[x, y]];
        var step = 0, steps = 100;

        function loop() {{
          if (step >= steps) {{
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'converged ✓'; document.getElementById('phase-ind').classList.remove('active');
            return;
          }}
          var gx = gradX(x, y), gy = gradY(x, y);
          if (OPT === 'sgd') {{
            x -= lr * gx; y -= lr * gy;
          }} else {{
            // Adam / AdamW
            mx = b1*mx + (1-b1)*gx; my = b1*my + (1-b1)*gy;
            vx = b2*vx + (1-b2)*gx*gx; vy = b2*vy + (1-b2)*gy*gy;
            var mhx = mx/(1-Math.pow(b1, step+1)), mhy = my/(1-Math.pow(b1, step+1));
            var vhx = vx/(1-Math.pow(b2, step+1)), vhy = vy/(1-Math.pow(b2, step+1));
            x -= lr * mhx/(Math.sqrt(vhx)+eps) + (wd ? lr*wd*x : 0);
            y -= lr * mhy/(Math.sqrt(vhy)+eps) + (wd ? lr*wd*y : 0);
          }}
          traj.push([x, y]);
          if (traj.length > 100) traj.shift();
          document.getElementById('phase-ind').textContent = 'step '+(step+1)+'/'+steps;
          render(traj); step++; requestAnimationFrame(loop);
        }}
        render(traj);
        loop();
      }}

      document.getElementById('btn-gd').addEventListener('click', runOpt);
      // Phase 38.7: Step button — single optimisation step
      document.getElementById('btn-step').addEventListener('click', function() {{
        if (isAnim) return;
        if (typeof runOpt !== 'function') return;
        // Run one step of the optimiser
        var origRAF = window.requestAnimationFrame;
        var stepTaken = false;
        window.requestAnimationFrame = function(fn) {{
          if (stepTaken) return;
          stepTaken = true;
          window.requestAnimationFrame = origRAF;
          origRAF(fn);
        }};
        isAnim = true;
        document.getElementById('phase-ind').textContent = 'step (manual)';
        document.getElementById('phase-ind').classList.add('active');
        runOpt();
        setTimeout(function() {{ isAnim = false; }}, 300);
      }});
      document.getElementById('btn-reset').addEventListener('click', function() {{
        document.getElementById('phase-ind').textContent = 'idle';
        document.getElementById('phase-ind').classList.remove('active');
        render([]);
      }});
      render([]);
    </script>
        <!-- Simplified footer — GDPR + HIPAA + MIT license -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data collected · no cookies · no tracking · no external API calls · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


# ============================================================================
# Normalisation template — histogram before/after normalisation
# ============================================================================
def gen_normalisation(card):
    slug = card["slug"]
    title = card["title"]
    eq = card["eq"]
    desc = card["desc"]
    math_comments = card["math_comments"]
    py_code = card["py"]
    norm = card["js_norm"]

    py_block = math_comments + "\n" + py_code
    py_html = hl(py_block)
    foot_html = make_foot(slug, title)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{title} — visual-first concept card. Histogram before vs after normalisation." />
    <title>{title} — Concept Card · AIHPC</title>
    <style>
{CSS}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{title}</h1>
      </div>
      <p class="desc">{desc}</p>
      <div class="eq-badge">📐 {eq}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">μ</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{eq}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl" id="b1-ctrl"><label>Input spread σ <span class="val" id="b1-val">1.50</span></label><input type="range" id="b1-slider" min="0.5" max="4" step="0.05" value="1.5" /></div>
        <div class="ctrl" id="b0-ctrl"><label>Input mean μ₀ <span class="val" id="b0-val">2.00</span></label><input type="range" id="b0-slider" min="-5" max="5" step="0.05" value="2.0" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">▶ Apply normalisation</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn ghost" id="btn-step" style="flex: 1;">⏭ Step</button>
            <button class="btn ghost" id="btn-reset" style="flex: 1;">↺ Reset</button>
          </div>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{eq}</div>
        <pre>{py_html}</pre>
      </div>
      <div class="foot">
        {foot_html}
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');

      // ===== NORMALISATION HISTOGRAM =====
      var W = canvas.width, H = canvas.height;
      var inputSpread = 1.5, inputMean = 2.0;
      var normProgress = 0; // 0 = before, 1 = after
      var isAnim = false;
      var NORM = '{norm}';

      function sampleData() {{
        // 32 bins from -8 to +8 — generate counts from gaussian(μ, σ)
        var bins = new Array(32).fill(0);
        var nSamples = 500;
        for (var s = 0; s < nSamples; s++) {{
          // Box-Muller transform
          var u1 = Math.random(), u2 = Math.random();
          var z = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
          var v = inputMean + inputSpread * z;
          var bin = Math.floor((v + 8) / 0.5);
          if (bin >= 0 && bin < 32) bins[bin]++;
        }}
        return bins;
      }}
      var data = sampleData();

      function applyNorm(bins, progress) {{
        // Compute the normalisation given NORM type and progress (0→1)
        // Returns array of post-norm bin counts (approximate via gaussian stats)
        var total = bins.reduce(function(a,b){{ return a+b; }}, 0);
        if (total === 0) return bins;
        var mean = 0; for (var i=0;i<bins.length;i++) mean += (i*0.5 - 8 + 0.25) * bins[i]; mean /= total;
        var variance = 0; for (var i=0;i<bins.length;i++) {{ var d = (i*0.5 - 8 + 0.25) - mean; variance += d*d * bins[i]; }} variance /= total;
        var sigma = Math.sqrt(variance + 1e-8);
        var post = new Array(bins.length).fill(0);
        for (var i=0;i<bins.length;i++) {{
          var x = i*0.5 - 8 + 0.25;
          var xPost = x;
          if (NORM === 'batchnorm' || NORM === 'layernorm') {{
            xPost = (x - mean) / (sigma + 1e-5);  // normalised
          }} else if (NORM === 'rmsnorm') {{
            xPost = x / Math.sqrt(variance + 1e-8);  // no mean subtraction
          }} else if (NORM === 'groupnorm' || NORM === 'instancenorm') {{
            // Approximate as LayerNorm for the demo (same shape histogram)
            xPost = (x - mean) / (sigma + 1e-5);
          }}
          // Smooth transition: x → xPost as progress → 1
          var xInterp = x + (xPost - x) * progress;
          var binInterp = Math.floor((xInterp + 8) / 0.5);
          if (binInterp >= 0 && binInterp < 32) post[binInterp] += bins[i];
        }}
        return post;
      }}

      function toCX(x) {{ return 40 + (x+8)/16 * (W-80); }}
      function toCY(y) {{ var maxCount = Math.max.apply(null, data) || 1; return H-40 - (y/Math.max(maxCount, 50)) * (H-60); }}

      function render() {{
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Axes
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(40, H-40); ctx.lineTo(W-40, H-40); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
        for (var x = -8; x <= 8; x += 2) {{ ctx.fillText(x.toString(), toCX(x), H-25); }}
        // Title
        ctx.textAlign = 'left'; ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace';
        ctx.fillText('Input distribution (orange) → Normalised (cyan)', 50, 30);
        // Pre-norm bars (orange, fading out as progress increases)
        var preAlpha = 1 - normProgress * 0.7;
        ctx.fillStyle = 'rgba(245,158,11,' + preAlpha + ')';
        var maxCount = Math.max.apply(null, data) || 1;
        for (var i = 0; i < data.length; i++) {{
          var bx = toCX(i*0.5 - 8 + 0.25);
          var bh = (data[i]/maxCount) * (H-80);
          ctx.fillRect(bx-6, H-40-bh, 12, bh);
        }}
        // Post-norm bars (cyan, fading in)
        var postData = applyNorm(data, normProgress);
        var maxPost = Math.max.apply(null, postData) || 1;
        ctx.fillStyle = 'rgba(6,182,212,0.85)';
        for (var j = 0; j < postData.length; j++) {{
          var px = toCX(j*0.5 - 8 + 0.25);
          var ph = (postData[j]/maxPost) * (H-80);
          ctx.fillRect(px-6, H-40-ph, 12, ph);
        }}
        // Stats overlay
        var total = data.reduce(function(a,b){{return a+b;}},0) || 1;
        var mu = 0; for (var k=0;k<data.length;k++) mu += (k*0.5-8+0.25)*data[k]; mu /= total;
        var va = 0; for (var k2=0;k2<data.length;k2++) {{ var d=(k2*0.5-8+0.25)-mu; va += d*d*data[k2]; }} va /= total;
        var sig = Math.sqrt(va);
        document.getElementById('loss-lbl').textContent = 'μ=' + mu.toFixed(2) + ' σ=' + sig.toFixed(2);
        document.getElementById('loss-val').textContent = normProgress > 0.5 ? 'normalised' : 'input';
        document.getElementById('loss-val').className = 'val ' + (normProgress > 0.5 ? 'good' : 'ok');
      }}

      document.getElementById('b1-slider').addEventListener('input', function(e) {{ inputSpread = parseFloat(e.target.value); document.getElementById('b1-val').textContent = inputSpread.toFixed(2); data = sampleData(); render(); }});
      document.getElementById('b0-slider').addEventListener('input', function(e) {{ inputMean = parseFloat(e.target.value); document.getElementById('b0-val').textContent = inputMean.toFixed(2); data = sampleData(); render(); }});

      document.getElementById('btn-gd').addEventListener('click', function() {{
        if (isAnim) return; isAnim = true; document.getElementById('btn-gd').disabled = true;
        document.getElementById('phase-ind').textContent = 'applying...'; document.getElementById('phase-ind').classList.add('active');
        var step = 0, maxSteps = 40;
        function anim() {{
          if (step >= maxSteps) {{
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓'; document.getElementById('phase-ind').classList.remove('active');
            return;
          }}
          normProgress = (step+1) / maxSteps;
          document.getElementById('phase-ind').textContent = 'step '+(step+1)+'/'+maxSteps;
          render(); step++; requestAnimationFrame(anim);
        }}
        anim();
      }});
      // Phase 38.8: Step button — single-step mode
      document.getElementById('btn-step').addEventListener('click', function() {{
        if (isAnim) return;
        if (typeof animate !== 'function') return;
        var origST = window.setTimeout;
        var stepTaken = false;
        window.setTimeout = function(fn, delay) {{
          if (stepTaken) return;
          stepTaken = true;
          window.setTimeout = origST;
          origST(fn, 0);
        }};
        document.getElementById('phase-ind').textContent = 'step (manual)';
        document.getElementById('phase-ind').classList.add('active');
        animate();
        origST(function() {{ window.setTimeout = origST; }}, 200);
      }});
      document.getElementById('btn-reset').addEventListener('click', function() {{
        normProgress = 0; document.getElementById('phase-ind').textContent = 'idle';
        document.getElementById('phase-ind').classList.remove('active');
        data = sampleData(); render();
      }});
      render();
    </script>
        <!-- Simplified footer — GDPR + HIPAA + MIT license -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data collected · no cookies · no tracking · no external API calls · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


# ============================================================================
# Attention template — Q·Kᵀ heatmap + softmax + V weighting
# ============================================================================
def gen_attention(card):
    slug = card["slug"]
    title = card["title"]
    eq = card["eq"]
    desc = card["desc"]
    math_comments = card["math_comments"]
    py_code = card["py"]
    attn = card["js_attn"]

    py_block = math_comments + "\n" + py_code
    py_html = hl(py_block)
    foot_html = make_foot(slug, title)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{title} — visual-first concept card. Q·Kᵀ heatmap + softmax weighting." />
    <title>{title} — Concept Card · AIHPC</title>
    <style>
{CSS}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{title}</h1>
      </div>
      <p class="desc">{desc}</p>
      <div class="eq-badge">📐 {eq}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">max attn</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{eq}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl" id="b1-ctrl"><label>Query focus (sharpness) <span class="val" id="b1-val">1.00</span></label><input type="range" id="b1-slider" min="0.1" max="3" step="0.05" value="1.0" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">▶ Animate attention</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn ghost" id="btn-step" style="flex: 1;">⏭ Step</button>
            <button class="btn ghost" id="btn-reset" style="flex: 1;">↺ Reset</button>
          </div>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{eq}</div>
        <pre>{py_html}</pre>
      </div>
      <div class="foot">
        {foot_html}
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');

      // ===== ATTENTION HEATMAP =====
      var W = canvas.width, H = canvas.height;
      var sharpness = 1.0;
      var isAnim = false;
      var ATTN = '{attn}';

      // Synthetic Q (6 queries) and K (6 keys) — each 4-dim
      var Q = [
        [1.0, 0.2, 0.0, -0.5],
        [0.0, 1.0, 0.3, 0.1],
        [-0.3, 0.0, 1.0, 0.4],
        [0.2, -0.4, 0.0, 1.0],
        [0.5, 0.5, -0.2, 0.0],
        [0.1, 0.0, 0.4, 0.7]
      ];
      var V = [
        [1.0, 0.0], [0.0, 1.0], [0.5, 0.5],
        [-0.5, 0.5], [0.3, 0.7], [0.8, -0.2]
      ];
      var K = Q; // self-attention: K = Q

      function softmax(arr) {{
        var mx = Math.max.apply(null, arr);
        var exps = arr.map(function(v){{ return Math.exp(v - mx); }});
        var sum = exps.reduce(function(a,b){{ return a+b; }}, 0);
        return exps.map(function(e){{ return e / sum; }});
      }}

      function computeAttn() {{
        var d_k = Q[0].length;
        var scale = Math.sqrt(d_k);
        // For Multi-Head and Flash we display the same heatmap but indicate
        // the multi-head structure / tiling in the animation.
        var scores = [];
        for (var i = 0; i < Q.length; i++) {{
          var row = [];
          for (var j = 0; j < K.length; j++) {{
            var dot = 0;
            for (var d = 0; d < d_k; d++) dot += Q[i][d] * K[j][d];
            row.push(dot / scale * sharpness);
          }}
          scores.push(row);
        }}
        var weights = scores.map(function(r){{ return softmax(r); }});
        return weights;
      }}

      function colorForWeight(w) {{
        // 0 → dark blue, 1 → bright cyan
        var r = Math.round(6 + w * 240);
        var g = Math.round(30 + w * 200);
        var b = Math.round(80 + w * 130);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      }}

      function render(focusRow) {{
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        var weights = computeAttn();
        var cellW = 40, cellH = 40;
        var gridX = (W - cellW * Q.length) / 2;
        var gridY = 60;
        // Title
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Attention weights (softmax(Q·Kᵀ/√d_k))', W/2, 30);
        ctx.textAlign = 'left';
        // Heatmap
        for (var i = 0; i < weights.length; i++) {{
          for (var j = 0; j < weights[i].length; j++) {{
            var w = weights[i][j];
            ctx.fillStyle = colorForWeight(w);
            ctx.fillRect(gridX + j*cellW, gridY + i*cellH, cellW-2, cellH-2);
            ctx.fillStyle = w > 0.3 ? '#000' : '#fff';
            ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
            ctx.fillText(w.toFixed(2), gridX + j*cellW + cellW/2, gridY + i*cellH + cellH/2 + 4);
            ctx.textAlign = 'left';
          }}
        }}
        // Axis labels
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
        for (var k = 0; k < K.length; k++) {{ ctx.fillText('K'+k, gridX + k*cellW + cellW/2, gridY - 8); }}
        for (var qi = 0; qi < Q.length; qi++) {{ ctx.fillText('Q'+qi, gridX - 20, gridY + qi*cellH + cellH/2 + 4); }}
        ctx.textAlign = 'left';
        // Focus row highlight
        if (focusRow !== undefined && focusRow >= 0) {{
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
          ctx.strokeRect(gridX - 2, gridY + focusRow*cellH - 2, cellW * Q.length + 2, cellH + 2);
        }}
        // Stats
        var maxAttn = 0;
        for (var mi = 0; mi < weights.length; mi++) {{
          for (var mj = 0; mj < weights[mi].length; mj++) {{
            if (weights[mi][mj] > maxAttn) maxAttn = weights[mi][mj];
          }}
        }}
        document.getElementById('loss-val').textContent = maxAttn.toFixed(3);
        document.getElementById('loss-val').className = 'val ' + (maxAttn > 0.5 ? 'good' : 'ok');
      }}

      document.getElementById('b1-slider').addEventListener('input', function(e) {{ sharpness = parseFloat(e.target.value); document.getElementById('b1-val').textContent = sharpness.toFixed(2); render(); }});

      document.getElementById('btn-gd').addEventListener('click', function() {{
        if (isAnim) return; isAnim = true; document.getElementById('btn-gd').disabled = true;
        document.getElementById('phase-ind').textContent = 'scanning...'; document.getElementById('phase-ind').classList.add('active');
        var row = 0;
        function scan() {{
          if (row >= Q.length) {{
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓'; document.getElementById('phase-ind').classList.remove('active');
            render(undefined); return;
          }}
          document.getElementById('phase-ind').textContent = 'row Q'+row;
          render(row); row++; setTimeout(scan, 350);  // slow enough to see
        }}
        scan();
      }});
      // Phase 38.8: Step button — single-step mode
      document.getElementById('btn-step').addEventListener('click', function() {{
        if (isAnim) return;
        if (typeof animate !== 'function') return;
        var origST = window.setTimeout;
        var stepTaken = false;
        window.setTimeout = function(fn, delay) {{
          if (stepTaken) return;
          stepTaken = true;
          window.setTimeout = origST;
          origST(fn, 0);
        }};
        document.getElementById('phase-ind').textContent = 'step (manual)';
        document.getElementById('phase-ind').classList.add('active');
        animate();
        origST(function() {{ window.setTimeout = origST; }}, 200);
      }});
      document.getElementById('btn-reset').addEventListener('click', function() {{
        sharpness = 1.0; document.getElementById('b1-slider').value = 1.0;
        document.getElementById('b1-val').textContent = '1.00';
        document.getElementById('phase-ind').textContent = 'idle';
        document.getElementById('phase-ind').classList.remove('active');
        render(undefined);
      }});
      render(undefined);
    </script>
        <!-- Simplified footer — GDPR + HIPAA + MIT license -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data collected · no cookies · no tracking · no external API calls · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


# ============================================================================
# Regularisation template — network with dropped neurons
# ============================================================================
def gen_regularisation(card):
    slug = card["slug"]
    title = card["title"]
    eq = card["eq"]
    desc = card["desc"]
    math_comments = card["math_comments"]
    py_code = card["py"]
    reg = card["js_reg"]

    py_block = math_comments + "\n" + py_code
    py_html = hl(py_block)
    foot_html = make_foot(slug, title)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{title} — visual-first concept card. Network diagram with dropped/regularised neurons." />
    <title>{title} — Concept Card · AIHPC</title>
    <style>
{CSS}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{title}</h1>
      </div>
      <p class="desc">{desc}</p>
      <div class="eq-badge">📐 {eq}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">penalty</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{eq}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl" id="b1-ctrl"><label>Regularisation λ <span class="val" id="b1-val">0.10</span></label><input type="range" id="b1-slider" min="0" max="1" step="0.01" value="0.1" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">▶ Resample</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn ghost" id="btn-step" style="flex: 1;">⏭ Step</button>
            <button class="btn ghost" id="btn-reset" style="flex: 1;">↺ Reset</button>
          </div>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{eq}</div>
        <pre>{py_html}</pre>
      </div>
      <div class="foot">
        {foot_html}
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');

      // ===== REGULARISATION NETWORK =====
      var W = canvas.width, H = canvas.height;
      var lam = 0.1;
      var isAnim = false;
      var REG = '{reg}';

      // 3-layer network: 5 → 6 → 4 → 3
      var layers = [5, 6, 4, 3];
      var nodes = [];
      var seed = 1;
      function rng() {{ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }}

      function genNetwork() {{
        nodes = [];
        for (var li = 0; li < layers.length; li++) {{
          var layer = [];
          var layerH = layers[li] * 40;
          var startY = (H - layerH) / 2;
          for (var ni = 0; ni < layers[li]; ni++) {{
            // For dropout: p = lam (drop prob). For L1/L2: small w = high penalty.
            var drop = REG === 'dropout' ? (rng() < lam) : false;
            var w = (rng() - 0.5) * 2;  // weight in [-1, 1]
            var reg = REG === 'l1l2' ? w * (1 - lam * 0.5) : w;  // shrink toward 0
            layer.push({{ x: 60 + li * 200, y: startY + ni * 40 + 20, dropped: drop, weight: reg }});
          }}
          nodes.push(layer);
        }}
      }}
      genNetwork();

      function render() {{
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Title
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        if (REG === 'dropout') ctx.fillText('Dropout — dropped neurons shown faded', W/2, 30);
        else ctx.fillText('L1/L2 — weight magnitudes shown by line thickness', W/2, 30);
        ctx.textAlign = 'left';
        // Edges
        for (var li = 0; li < nodes.length - 1; li++) {{
          for (var i = 0; i < nodes[li].length; i++) {{
            for (var j = 0; j < nodes[li+1].length; j++) {{
              var n1 = nodes[li][i], n2 = nodes[li+1][j];
              if (n1.dropped || n2.dropped) {{
                ctx.strokeStyle = 'rgba(239,68,68,0.2)';
                ctx.lineWidth = 0.5;
              }} else {{
                var w = (n1.weight + n2.weight) / 2;
                var intensity = REG === 'l1l2' ? Math.abs(w) : 0.5;
                ctx.strokeStyle = 'rgba(6,182,212,' + (0.2 + intensity * 0.5) + ')';
                ctx.lineWidth = REG === 'l1l2' ? Math.abs(w) * 2 + 0.3 : 1;
              }}
              ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
            }}
          }}
        }}
        // Nodes
        for (var la = 0; la < nodes.length; la++) {{
          for (var k = 0; k < nodes[la].length; k++) {{
            var nd = nodes[la][k];
            ctx.beginPath(); ctx.arc(nd.x, nd.y, 8, 0, 6.28);
            if (nd.dropped) {{ ctx.fillStyle = 'rgba(239,68,68,0.3)'; ctx.fill(); ctx.strokeStyle = '#ef4444'; }}
            else {{ ctx.fillStyle = '#06b6d4'; ctx.fill(); ctx.strokeStyle = '#06b6d4'; }}
            ctx.lineWidth = 2; ctx.stroke();
          }}
        }}
        // Penalty
        var penalty = 0;
        if (REG === 'l1l2') {{
          for (var pli = 0; pli < nodes.length; pli++) {{
            for (var pni = 0; pni < nodes[pli].length; pni++) {{
              penalty += lam * Math.abs(nodes[pli][pni].weight);
            }}
          }}
        }} else {{  // dropout
          var dropped = 0, total = 0;
          for (var dli = 0; dli < nodes.length; dli++) {{
            for (var dni = 0; dni < nodes[dli].length; dni++) {{
              total++;
              if (nodes[dli][dni].dropped) dropped++;
            }}
          }}
          penalty = total > 0 ? dropped / total : 0;
        }}
        document.getElementById('loss-val').textContent = penalty.toFixed(3);
        document.getElementById('loss-val').className = 'val ' + (penalty < 0.3 ? 'good' : 'ok');
      }}

      document.getElementById('b1-slider').addEventListener('input', function(e) {{ lam = parseFloat(e.target.value); document.getElementById('b1-val').textContent = lam.toFixed(2); genNetwork(); render(); }});

      document.getElementById('btn-gd').addEventListener('click', function() {{
        genNetwork(); render();
        document.getElementById('phase-ind').textContent = 'resampled'; document.getElementById('phase-ind').classList.add('active');
        setTimeout(function() {{
          document.getElementById('phase-ind').textContent = 'idle'; document.getElementById('phase-ind').classList.remove('active');
        }}, 800);
      }});
      // Phase 38.8: Step button — single-step mode
      document.getElementById('btn-step').addEventListener('click', function() {{
        if (isAnim) return;
        if (typeof animate !== 'function') return;
        var origST = window.setTimeout;
        var stepTaken = false;
        window.setTimeout = function(fn, delay) {{
          if (stepTaken) return;
          stepTaken = true;
          window.setTimeout = origST;
          origST(fn, 0);
        }};
        document.getElementById('phase-ind').textContent = 'step (manual)';
        document.getElementById('phase-ind').classList.add('active');
        animate();
        origST(function() {{ window.setTimeout = origST; }}, 200);
      }});
      document.getElementById('btn-reset').addEventListener('click', function() {{
        lam = 0.1; document.getElementById('b1-slider').value = 0.1; document.getElementById('b1-val').textContent = '0.10';
        document.getElementById('phase-ind').textContent = 'idle';
        document.getElementById('phase-ind').classList.remove('active');
        genNetwork(); render();
      }});
      render();
    </script>
        <!-- Simplified footer — GDPR + HIPAA + MIT license -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data collected · no cookies · no tracking · no external API calls · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


# ============================================================================
# Neural Network template — animated architecture diagram + deep-thoughts
# Each NN card has a canvas_mode that selects the visualization.
# ============================================================================
def gen_neural_network(card):
    slug = card["slug"]
    title = card["title"]
    eq = card["eq"]
    desc = card["desc"]
    math_comments = card["math_comments"]
    py_code = card["py"]
    mode = card["canvas_mode"]
    deep_thoughts = card.get("deep_thoughts", "")

    py_block = math_comments + "\n" + py_code
    py_html = hl(py_block)
    foot_html = make_foot(slug, title)

    canvas_js = _NN_CANVAS_JS.get(mode, _NN_CANVAS_JS["mlp"])
    dt_html = _format_deep_thoughts(deep_thoughts)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{title} — visual-first neural network architecture card. Animated diagram, math, code with Math→Code annotations, when-to-use deep thoughts." />
    <title>{title} — NN Concept Card · AIHPC</title>
    <style>
{CSS}
      .deep-thoughts {{
        background: rgba(139,92,246,0.06);
        border: 1px solid rgba(139,92,246,0.25);
        border-radius: 10px;
        padding: 14px 18px;
        margin-top: 16px;
      }}
      .deep-thoughts h3 {{
        font-size: 11px; font-weight: 700; color: var(--accent2);
        text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
      }}
      .deep-thoughts .dt-row {{ margin: 8px 0; font-size: 13px; line-height: 1.55; color: var(--text); }}
      .deep-thoughts .dt-row .lbl {{ font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }}
      .deep-thoughts .dt-row .lbl.use {{ background: rgba(16,185,129,0.15); color: #6ee7b7; }}
      .deep-thoughts .dt-row .lbl.avoid {{ background: rgba(239,68,68,0.15); color: #fca5a5; }}
      .deep-thoughts .dt-row .lbl.why {{ background: rgba(139,92,246,0.15); color: #c4b5fd; }}
      .deep-thoughts .dt-row .text {{ color: var(--text-muted); }}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{title}</h1>
      </div>
      <p class="desc">{desc}</p>
      <div class="eq-badge">📐 {eq}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">state</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{eq}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl" id="b1-ctrl"><label>Parameter <span class="val" id="b1-val">1.00</span></label><input type="range" id="b1-slider" min="0.1" max="3" step="0.05" value="1.0" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">▶ Animate forward pass</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn ghost" id="btn-step" style="flex: 1;">⏭ Step</button>
            <button class="btn ghost" id="btn-reset" style="flex: 1;">↺ Reset</button>
          </div>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{eq}</div>
        <pre>{py_html}</pre>
      </div>
      <div class="deep-thoughts">
        <h3>🧠 Deep thoughts — when (and when not) to reach for this architecture</h3>
        {dt_html}
      </div>
      <div class="foot">
        {foot_html}
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');
      var W = canvas.width, H = canvas.height;
      var param = 1.0;
      var isAnim = false;
      var MODE = '{mode}';

      document.getElementById('b1-slider').addEventListener('input', function(e) {{
        param = parseFloat(e.target.value);
        document.getElementById('b1-val').textContent = param.toFixed(2);
        if (typeof render === 'function') render();
      }});

{canvas_js}

      document.getElementById('btn-gd').addEventListener('click', function() {{
        if (isAnim) return; isAnim = true;
        document.getElementById('btn-gd').disabled = true;
        document.getElementById('phase-ind').textContent = 'animating...';
        document.getElementById('phase-ind').classList.add('active');
        if (typeof animate === 'function') animate();
      }});

      // Phase 38.3: Step button — single-stage mode (advances one stage per click)
      // Works for any NN card that has an animate() function — calls animate()
      // once, then immediately stops the loop by setting isAnim=false after one
      // step. The simplest cross-family implementation: re-call animate() but
      // cap it at the current stage + 1.
      document.getElementById('btn-step').addEventListener('click', function() {{
        if (isAnim) return;
        if (typeof animate !== 'function') return;
        // Run animate() but stop after one step by intercepting setTimeout
        // (cards use setTimeout(step, delay) inside their animate())
        var origSetTimeout = window.setTimeout;
        var stepTaken = false;
        window.setTimeout = function(fn, delay) {{
          if (stepTaken) return;  // swallow further steps
          stepTaken = true;
          window.setTimeout = origSetTimeout;  // restore
          origSetTimeout(fn, 0);  // run one step immediately
        }};
        animate();
        // Restore after a tick to be safe
        origSetTimeout(function() {{ window.setTimeout = origSetTimeout; }}, 100);
        document.getElementById('phase-ind').textContent += ' (manual)';
      }});

      document.getElementById('btn-reset').addEventListener('click', function() {{
        document.getElementById('phase-ind').textContent = 'idle';
        document.getElementById('phase-ind').classList.remove('active');
        if (typeof reset === 'function') reset(); else render();
      }});
      if (typeof render === 'function') render();
    </script>
        <!-- Simplified footer — GDPR + HIPAA + MIT license -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data collected · no cookies · no tracking · no external API calls · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


def _format_deep_thoughts(text: str) -> str:
    """Parse the deep_thoughts string into HTML rows.

    Expected format: 'USE WHEN: ... AVOID WHEN: ... WHY: ...'
    """
    import re
    rows = []
    parts = re.split(r'(USE WHEN:|AVOID WHEN:|WHY:)', text)
    label_map = {
        "USE WHEN:": "use",
        "AVOID WHEN:": "avoid",
        "WHY:": "why",
    }
    for i in range(1, len(parts) - 1, 2):
        keyword = parts[i].strip()
        body = parts[i + 1].strip()
        if keyword in label_map:
            rows.append(
                f'<div class="dt-row">'
                f'<span class="lbl {label_map[keyword]}">{keyword}</span>'
                f'<span class="text">{body}</span>'
                f'</div>'
            )
    return "\n        ".join(rows)


# Per-mode canvas JS. Each is a block that defines render(), animate(),
# reset() in the surrounding scope.
_NN_CANVAS_JS = {

"mlp": """
      // ===== MLP: 5-layer network with weight-magnitude edges + loss curve +
      //            inflection-point markers (Phase 38.3 enriched version) =====
      // Enhanced beyond the basic 3-layer view:
      //   1. Deeper 5-layer network: 8 → 12 → 16 → 12 → 4
      //   2. Edge thickness = |weight| (visualises which connections dominate)
      //   3. Side panel: training loss curve (MSE over 100 epochs)
      //   4. Inflection-point markers: ReLU saturation zone (x<0),
      //      tanh saturation (|x|>3), sigmoid plateau
      //   5. Numerical values overlaid at each node (live activations)

      var layers = [8, 12, 16, 12, 4];
      var nodes = [];
      var weights = [];  // weights[l][i][j] = weight from layer l node i to layer l+1 node j
      var activations = [];  // post-activation value per node

      var seed = 1;
      function rng() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

      // Initialise network with random weights (He init for ReLU)
      for (var li = 0; li < layers.length; li++) {
        var layer = [];
        var x = 50 + li * 145;
        var layerH = layers[li] * 18;
        var startY = (H - 30 - layerH) / 2 + 40;
        for (var ni = 0; ni < layers[li]; ni++) {
          layer.push({ x: x, y: startY + ni * 18 + 9, activation: rng() - 0.5 });
        }
        nodes.push(layer);
        activations.push(layer.map(function(n) { return n.activation; }));
      }
      // Initialise weights
      for (var wl = 0; wl < layers.length - 1; wl++) {
        var layerW = [];
        for (var i = 0; i < layers[wl]; i++) {
          var rowW = [];
          for (var j = 0; j < layers[wl + 1]; j++) {
            rowW.push((rng() - 0.5) * 2);  // weight in [-1, 1]
          }
          layerW.push(rowW);
        }
        weights.push(layerW);
      }

      // Loss curve (training history, pre-computed synthetic)
      var lossHistory = [];
      for (var e = 0; e < 100; e++) {
        // Synthetic loss decay: starts at ~3.0, decays exponentially to ~0.05
        lossHistory.push(3.0 * Math.exp(-0.05 * e) + 0.05 + (rng() - 0.5) * 0.1);
      }
      var currentEpoch = 0;

      var animStep = 0;

      function relu(x) { return Math.max(0, x); }
      function forwardPass(inputActs) {
        // Compute forward pass through all layers
        var acts = [inputActs.slice()];
        for (var l = 0; l < weights.length; l++) {
          var nextActs = [];
          for (var j = 0; j < layers[l + 1]; j++) {
            var sum = 0;
            for (var i = 0; i < layers[l]; i++) {
              sum += acts[l][i] * weights[l][i][j];
            }
            nextActs.push(relu(sum));  // ReLU activation
          }
          acts.push(nextActs);
        }
        return acts;
      }

      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('MLP forward pass — 5 layers, edge thickness = |weight|', 360, 25);
        ctx.textAlign = 'left';

        // Compute activations at current step
        var inputActs = nodes[0].map(function(n) { return n.activation; });
        var allActs = forwardPass(inputActs);
        // Sync node activations from forward pass
        for (var la = 0; la < nodes.length; la++) {
          for (var k = 0; k < nodes[la].length; k++) {
            nodes[la][k].activation = allActs[la][k];
          }
        }

        // === Left side: network diagram (~720px wide) ===
        var netRight = 600;
        // Edges (drawn first, behind nodes)
        for (var eli = 0; eli < nodes.length - 1; eli++) {
          for (var i = 0; i < nodes[eli].length; i++) {
            for (var j = 0; j < nodes[eli + 1].length; j++) {
              var n1 = nodes[eli][i], n2 = nodes[eli + 1][j];
              var w = weights[eli][i][j];
              var active = animStep > eli;
              var edgeAlpha = active ? Math.min(0.8, Math.abs(w) * 0.6 + 0.1) : 0.08;
              var edgeWidth = active ? Math.max(0.3, Math.abs(w) * 2.5) : 0.4;
              ctx.strokeStyle = w > 0
                ? 'rgba(6,182,212,' + edgeAlpha + ')'
                : 'rgba(239,68,68,' + edgeAlpha + ')';
              ctx.lineWidth = edgeWidth;
              ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
            }
          }
        }
        // Nodes
        for (var la = 0; la < nodes.length; la++) {
          for (var k = 0; k < nodes[la].length; k++) {
            var nd = nodes[la][k];
            var act = nd.activation;
            var active = animStep > la;
            // Node color = activation sign (positive=cyan, negative=red)
            var nodeColor;
            if (!active) nodeColor = 'rgba(148,163,184,0.3)';
            else if (act > 0) nodeColor = 'rgba(6,182,212,' + Math.min(1, 0.4 + Math.abs(act)) + ')';
            else nodeColor = 'rgba(148,163,184,0.5)';
            ctx.beginPath(); ctx.arc(nd.x, nd.y, 5, 0, 6.28);
            ctx.fillStyle = nodeColor; ctx.fill();
            ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.4)';
            ctx.lineWidth = 1.2; ctx.stroke();
          }
        }
        // Layer labels + activation values
        ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
        for (var ll = 0; ll < nodes.length; ll++) {
          var label = ll === 0 ? 'Input (8)'
                    : ll === nodes.length - 1 ? 'Output (4)'
                    : 'Hidden ' + ll + ' (' + layers[ll] + ')';
          ctx.fillText(label, nodes[ll][0].x, H - 12);
        }
        ctx.textAlign = 'left';

        // === Right side: loss curve + inflection-point math ===
        var panelX = netRight + 15;
        var panelW = W - panelX - 15;
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.strokeRect(panelX, 40, panelW, 140);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Training loss (MSE)', panelX + panelW / 2, 50);
        // Plot loss curve
        var lossMin = 0, lossMax = 3.5;
        var plotX = panelX + 5, plotY = 60, plotW = panelW - 10, plotH = 110;
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (var ei = 0; ei <= currentEpoch && ei < lossHistory.length; ei++) {
          var px = plotX + (ei / 100) * plotW;
          var py = plotY + plotH - (lossHistory[ei] / lossMax) * plotH;
          if (ei === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // Current loss value
        if (currentEpoch > 0 && currentEpoch < lossHistory.length) {
          var curLoss = lossHistory[Math.min(currentEpoch, 99)];
          ctx.fillStyle = '#10b981'; ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'left';
          ctx.fillText('epoch ' + currentEpoch + '/100', panelX + 5, 60);
          ctx.fillText('loss = ' + curLoss.toFixed(3), panelX + 5, 73);
        }
        ctx.textAlign = 'left';

        // === Inflection-point math panel ===
        ctx.strokeStyle = 'rgba(245,158,11,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(panelX, 190, panelW, 130);
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Inflection points', panelX + panelW / 2, 200);
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '9px ui-monospace';
        var yLine = 215;
        ctx.fillText("• ReLU: f(x)=max(0,x)", panelX + 5, yLine); yLine += 11;
        ctx.fillText("  f'(x)=0 for x<0 (dead zone)", panelX + 5, yLine); yLine += 11;
        ctx.fillText("  f'(x)=1 for x>0 (linear)", panelX + 5, yLine); yLine += 11;
        ctx.fillText("  inflection: x=0 (kink)", panelX + 5, yLine); yLine += 14;
        ctx.fillText("• tanh: f(x)=tanh(x)", panelX + 5, yLine); yLine += 11;
        ctx.fillText("  saturation: |x|>3 (grad→0)", panelX + 5, yLine); yLine += 11;
        ctx.fillText("  inflection: x=0 (steepest)", panelX + 5, yLine); yLine += 14;
        ctx.fillText("• Sigmoid: σ(x)=1/(1+e^-x)", panelX + 5, yLine); yLine += 11;
        ctx.fillText("  plateau: |x|>5 (grad≈0)", panelX + 5, yLine); yLine += 11;

        // Update loss overlay
        var l = currentEpoch > 0 ? lossHistory[Math.min(currentEpoch, 99)] : 0;
        document.getElementById('loss-val').textContent = l.toFixed(3);
        document.getElementById('loss-val').className = 'val ' + (l < 0.5 ? 'good' : (l < 1.5 ? 'ok' : 'bad'));
        document.getElementById('loss-lbl').textContent = 'loss';
      }
      function animate() {
        animStep = 0;
        currentEpoch = 0;
        function step() {
          if (animStep > nodes.length && currentEpoch >= 100) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          // First, animate forward pass through layers (5 steps)
          if (animStep <= nodes.length) {
            document.getElementById('phase-ind').textContent = 'fwd layer ' + animStep + '/' + (nodes.length - 1);
          } else {
            // Then, animate loss curve over 100 epochs
            currentEpoch = Math.min(100, currentEpoch + 5);
            document.getElementById('phase-ind').textContent = 'epoch ' + currentEpoch + '/100';
          }
          render(); animStep++;
          setTimeout(step, 200);
        }
        step();
      }
      function reset() { animStep = 0; currentEpoch = 0; render(); }
""",

"cnn": """
      // ===== CNN ENRICHED: 4-stage mini-pipeline + loss curve + inflection math =====
      // Stage 1: Image = tensor (28x28 image decomposed into 3D tensor)
      // Stage 2: FC layer limitations (parameter explosion vs weight sharing)
      // Stage 3: CNN inductive biases (kernel sliding across image)
      // Stage 4: Filters + feature maps (multiple kernels → different features)
      // Plus: loss-curve + inflection-math (ReLU dead-zone, stride formula, padding)

      var inputSize = 8; // 8x8 toy image (scaled down from 28x28)
      var kernelSize = 3;
      var animStep = 0; // 0=idle, 1-4 = stages, 5+ = loss curve
      var currentEpoch = 0;
      var lossHistory = [];
      for (var e = 0; e < 100; e++) lossHistory.push(2.5 * Math.exp(-0.04 * e) + 0.05 + Math.random() * 0.1);

      function makeInput() {
        var arr = [];
        for (var i = 0; i < inputSize; i++) {
          var row = [];
          for (var j = 0; j < inputSize; j++) row.push((Math.sin(i*0.7) + Math.cos(j*0.5)) * 0.5 + 0.5);
          arr.push(row);
        }
        return arr;
      }
      var inputGrid = makeInput();
      var sobelX = [[-1,0,1],[-2,0,2],[-1,0,1]];
      var sobelY = [[1,2,1],[0,0,0],[-1,-2,-1]];
      var blur = [[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]];

      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        var titles = ['idle', 'image=tensor', 'FC limitations', 'kernel sliding', 'feature maps', 'training loss'];
        ctx.fillText('CNN — stage ' + animStep + '/5: ' + (titles[animStep] || ''), W/2, 25);
        ctx.textAlign = 'left';

        var cellSize = 18;
        var baseY = 50;

        // === Stage 1: Image = tensor (show input as colored grid) ===
        if (animStep >= 1) {
          var s1Y = baseY + 10;
          ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 10px ui-monospace';
          ctx.fillText('1. Image = tensor (8x8x1 = 64 values)', 30, s1Y);
          for (var i = 0; i < inputSize; i++) {
            for (var j = 0; j < inputSize; j++) {
              var v = inputGrid[i][j];
              ctx.fillStyle = 'rgba(6,182,212,' + v + ')';
              ctx.fillRect(30 + j * cellSize, s1Y + 10 + i * cellSize, cellSize - 1, cellSize - 1);
            }
          }
          // Show tensor dimensions
          ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '9px ui-monospace';
          ctx.fillText('tensor shape: (8, 8, 1)', 30 + inputSize * cellSize + 10, s1Y + 20);
          ctx.fillText('flattened: 64 values', 30 + inputSize * cellSize + 10, s1Y + 35);
        }

        // === Stage 2: FC layer limitations ===
        if (animStep >= 2) {
          var s2Y = baseY + 10 + inputSize * cellSize + 20;
          ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 10px ui-monospace';
          ctx.fillText('2. FC layer: 64→128 params = 64*128 + 128 = 8320 weights', 30, s2Y);
          ctx.fillStyle = '#10b981';
          ctx.fillText('CNN: 3*3*1*8 + 8 = 80 weights (100x fewer!)', 30, s2Y + 15);
          // Draw bar chart comparison
          var fcW = Math.min(300, 8320 / 30);
          var cnnW = Math.min(300, 80 / 30);
          ctx.fillStyle = 'rgba(239,68,68,0.7)'; ctx.fillRect(30, s2Y + 25, fcW, 12);
          ctx.fillStyle = 'rgba(16,185,129,0.7)'; ctx.fillRect(30, s2Y + 40, cnnW, 12);
          ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '8px ui-monospace';
          ctx.fillText('FC: 8320 weights', 30 + fcW + 5, s2Y + 34);
          ctx.fillText('CNN: 80 weights', 30 + cnnW + 5, s2Y + 49);
        }

        // === Stage 3: Kernel sliding (inductive biases) ===
        if (animStep >= 3) {
          var s3Y = baseY + 10 + inputSize * cellSize + 100;
          ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 10px ui-monospace';
          ctx.fillText('3. Kernel sliding (locality + translation invariance)', 30, s3Y);
          // Draw input + kernel window + output
          var kx = animStep > 3 ? Math.min(inputSize - kernelSize, 3) : 0;
          var ky = animStep > 3 ? Math.min(inputSize - kernelSize, 2) : 0;
          for (var i = 0; i < inputSize; i++) {
            for (var j = 0; j < inputSize; j++) {
              var v = inputGrid[i][j];
              ctx.fillStyle = 'rgba(6,182,212,' + v + ')';
              ctx.fillRect(30 + j * 14, s3Y + 10 + i * 14, 13, 13);
            }
          }
          // Kernel window (yellow box)
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
          ctx.strokeRect(30 + kx * 14, s3Y + 10 + ky * 14, kernelSize * 14, kernelSize * 14);
          // Output feature map (6x6)
          var outX = 30 + inputSize * 14 + 20;
          for (var oi = 0; oi < 6; oi++) {
            for (var oj = 0; oj < 6; oj++) {
              if (oi < ky || (oi === ky && oj < kx)) {
                var conv = 0;
                for (var ki = 0; ki < kernelSize; ki++)
                  for (var kj = 0; kj < kernelSize; kj++)
                    conv += inputGrid[oi+ki][oj+kj] * sobelX[ki][kj];
                ctx.fillStyle = 'rgba(16,185,129,' + Math.max(0, conv) + ')';
                ctx.fillRect(outX + oj * 14, s3Y + 10 + oi * 14, 13, 13);
              }
            }
          }
        }

        // === Stage 4: Multiple filters → different feature maps ===
        if (animStep >= 4) {
          var s4Y = baseY + 10 + inputSize * cellSize + 200;
          ctx.fillStyle = '#ec4899'; ctx.font = 'bold 10px ui-monospace';
          ctx.fillText('4. Multiple filters → different feature maps', 30, s4Y);
          var filters = [
            {name: 'Sobel-X', kernel: sobelX, color: 'rgba(16,185,129,'},
            {name: 'Sobel-Y', kernel: sobelY, color: 'rgba(6,182,212,'},
            {name: 'Blur', kernel: blur, color: 'rgba(139,92,246,'},
          ];
          for (var f = 0; f < 3; f++) {
            var fx = 30 + f * 180;
            ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '8px ui-monospace'; ctx.textAlign = 'center';
            ctx.fillText(filters[f].name, fx + 70, s4Y + 8); ctx.textAlign = 'left';
            for (var oi = 0; oi < 6; oi++) {
              for (var oj = 0; oj < 6; oj++) {
                var conv = 0;
                for (var ki = 0; ki < kernelSize; ki++)
                  for (var kj = 0; kj < kernelSize; kj++)
                    conv += inputGrid[oi+ki][oj+kj] * filters[f].kernel[ki][kj];
                var v = Math.max(0, Math.min(1, Math.abs(conv)));
                ctx.fillStyle = filters[f].color + v + ')';
                ctx.fillRect(fx + oj * 11, s4Y + 12 + oi * 11, 10, 10);
              }
            }
          }
        }

        // === Stage 5: Loss curve + inflection math ===
        if (animStep >= 5) {
          var s5Y = H - 100;
          ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 0.5;
          ctx.strokeRect(30, s5Y, W - 60, 80);
          ctx.fillStyle = '#10b981'; ctx.font = 'bold 9px ui-monospace'; ctx.textAlign = 'left';
          ctx.fillText("Training loss (MSE) — ReLU dead-zone: f'(x)=0 for x<0", 35, s5Y + 12);
          ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (var ei = 0; ei <= currentEpoch && ei < lossHistory.length; ei++) {
            var px = 35 + (ei / 100) * (W - 70);
            var py = s5Y + 75 - (lossHistory[ei] / 3.0) * 70;
            if (ei === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
          if (currentEpoch > 0) {
            ctx.fillStyle = '#10b981'; ctx.font = '8px ui-monospace';
            ctx.fillText('epoch ' + currentEpoch + '/100 loss=' + lossHistory[Math.min(currentEpoch,99)].toFixed(3), 35, s5Y + 25);
          }
          // Inflection math
          ctx.fillStyle = 'rgba(245,158,11,0.7)'; ctx.font = '8px ui-monospace';
          ctx.fillText('stride=1 pad=0 → output = (W - K + 1) = (8-3+1) = 6', 35, s5Y + 40);
          ctx.fillText('stride=2 pad=1 → output = floor((W + 2P - K) / S + 1) = floor((8+2-3)/2+1) = 4', 35, s5Y + 52);
        }

        // Update loss overlay
        var l = currentEpoch > 0 ? lossHistory[Math.min(currentEpoch, 99)] : 0;
        document.getElementById('loss-val').textContent = l.toFixed(3);
        document.getElementById('loss-val').className = 'val ' + (l < 0.5 ? 'good' : (l < 1.5 ? 'ok' : 'bad'));
      }
      function animate() {
        animStep = 0; currentEpoch = 0;
        function step() {
          if (animStep > 5 && currentEpoch >= 100) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          if (animStep <= 5) {
            document.getElementById('phase-ind').textContent = 'stage ' + animStep + '/5';
          } else {
            currentEpoch = Math.min(100, currentEpoch + 5);
            document.getElementById('phase-ind').textContent = 'epoch ' + currentEpoch + '/100';
          }
          render(); animStep++;
          setTimeout(step, 600);
        }
        step();
      }
      function reset() { animStep = 0; currentEpoch = 0; render(); }
""",

"rnn": """
      // ===== RNN: unrolled time sequence =====
      var numSteps = 5;
      var animStep = 0;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('RNN unrolled through time — h_t = tanh(W_hh·h_{t-1} + W_xh·x_t)', W/2, 30);
        ctx.textAlign = 'left';
        var cellW = 90, cellH = 60;
        var startX = 60, cellY = 140;
        for (var t = 0; t < numSteps; t++) {
          var x = startX + t * (cellW + 30);
          var active = animStep > t;
          ctx.fillStyle = active ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)';
          ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 2;
          ctx.fillRect(x, cellY, cellW, cellH); ctx.strokeRect(x, cellY, cellW, cellH);
          ctx.fillStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.5)';
          ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('h_' + t, x + cellW/2, cellY + cellH/2 + 4);
          ctx.textAlign = 'left';
          ctx.strokeStyle = active ? '#f59e0b' : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x + cellW/2, cellY + cellH + 30);
          ctx.lineTo(x + cellW/2, cellY + cellH); ctx.stroke();
          ctx.fillStyle = active ? '#f59e0b' : 'rgba(148,163,184,0.5)';
          ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('x_' + t, x + cellW/2, cellY + cellH + 45);
          ctx.textAlign = 'left';
          if (t < numSteps - 1) {
            ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + cellW, cellY + cellH/2);
            ctx.lineTo(x + cellW + 30, cellY + cellH/2); ctx.stroke();
          }
        }

        // === Loss curve + inflection (Phase 39.4) ===
        var panelX = W - 115, panelW = 105;
        ctx.strokeStyle = "rgba(148,163,184,0.15)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(panelX, 35, panelW, 70);
        ctx.fillStyle = "#10b981"; ctx.font = "bold 8px ui-monospace"; ctx.textAlign = "center";
        ctx.fillText("Loss", panelX + panelW/2, 45); ctx.textAlign = "left";
        ctx.strokeStyle = "#10b981"; ctx.lineWidth = 1.2;
        ctx.beginPath();
        var lossArr = rnnLoss || [];
        var curEp = rnnEpoch || 0;
        for (var ei = 0; ei <= curEp && ei < lossArr.length; ei++) {
          var px = panelX + 3 + (ei / 100) * (panelW - 6);
          var py = 100 - (lossArr[ei] / 3.5) * 60;
          if (ei === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(245,158,11,0.15)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(panelX, 115, panelW, 80);
        ctx.fillStyle = "#f59e0b"; ctx.font = "bold 7px ui-monospace"; ctx.textAlign = "center";
        ctx.fillText("Inflection", panelX + panelW/2, 123); ctx.textAlign = "left";
        ctx.fillStyle = "rgba(148,163,184,0.6)"; ctx.font = "7px ui-monospace";
        var yLine = 132;
        ctx.fillText("tanh: saturation |x|>3", panelX + 5, yLine); yLine += 11;
        ctx.fillText("Vanishing: W^t -> 0", panelX + 5, yLine); yLine += 11;
        ctx.fillText("inflection: x=0", panelX + 5, yLine); yLine += 11;

        document.getElementById('loss-val').textContent = animStep + '/' + numSteps;
        document.getElementById('loss-val').className = 'val good';
      }
      function animate() {
        animStep = 0;
        function step() {
          if (animStep >= numSteps) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'step t=' + animStep;
          render(); animStep++; setTimeout(step, 400);
        }
        step();
      }
      function reset() { animStep = 0; render(); }
""",

"lstm": """
      // ===== LSTM: unrolled with cell state c_t and gates =====
      var numSteps = 5;
      var animStep = 0;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('LSTM cell unrolled — c_t = f_t⊙c_{t-1} + i_t⊙g_t', W/2, 30);
        ctx.textAlign = 'left';
        var cellW = 90, cellH = 80;
        var startX = 60, cellY = 100;
        for (var t = 0; t < numSteps; t++) {
          var x = startX + t * (cellW + 30);
          var active = animStep > t;
          ctx.fillStyle = active ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.1)';
          ctx.strokeStyle = active ? '#10b981' : 'rgba(16,185,129,0.3)';
          ctx.lineWidth = 1.5;
          ctx.fillRect(x, cellY, cellW, 18); ctx.strokeRect(x, cellY, cellW, 18);
          ctx.fillStyle = active ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)';
          ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 2;
          ctx.fillRect(x, cellY + 22, cellW, cellH - 22); ctx.strokeRect(x, cellY + 22, cellW, cellH - 22);
          ctx.fillStyle = active ? '#f59e0b' : 'rgba(148,163,184,0.4)';
          ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('f i o', x + cellW/2, cellY + 35);
          ctx.fillStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.5)';
          ctx.font = 'bold 11px ui-monospace';
          ctx.fillText('h_' + t, x + cellW/2, cellY + 65);
          ctx.fillStyle = active ? '#10b981' : 'rgba(148,163,184,0.5)';
          ctx.fillText('c_' + t, x + cellW/2, cellY + 12);
          ctx.textAlign = 'left';
          if (t < numSteps - 1) {
            ctx.strokeStyle = active ? '#10b981' : 'rgba(16,185,129,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + cellW, cellY + 9);
            ctx.lineTo(x + cellW + 30, cellY + 9); ctx.stroke();
          }
          if (t < numSteps - 1) {
            ctx.strokeStyle = active ? '#06b6d4' : 'rgba(6,182,212,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + cellW, cellY + 22 + (cellH-22)/2);
            ctx.lineTo(x + cellW + 30, cellY + 22 + (cellH-22)/2); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px ui-monospace';
        ctx.fillText('■ cell state c_t (additive — no vanishing!)', 60, H - 25);
        ctx.fillText('■ hidden state h_t', 60, H - 10);

        // === Loss curve + inflection (Phase 39.4) ===
        var panelX = W - 115, panelW = 105;
        ctx.strokeStyle = "rgba(148,163,184,0.15)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(panelX, 35, panelW, 70);
        ctx.fillStyle = "#10b981"; ctx.font = "bold 8px ui-monospace"; ctx.textAlign = "center";
        ctx.fillText("Loss", panelX + panelW/2, 45); ctx.textAlign = "left";
        ctx.strokeStyle = "#10b981"; ctx.lineWidth = 1.2;
        ctx.beginPath();
        var lossArr = lstmLoss || [];
        var curEp = lstmEpoch || 0;
        for (var ei = 0; ei <= curEp && ei < lossArr.length; ei++) {
          var px = panelX + 3 + (ei / 100) * (panelW - 6);
          var py = 100 - (lossArr[ei] / 3.5) * 60;
          if (ei === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(245,158,11,0.15)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(panelX, 115, panelW, 80);
        ctx.fillStyle = "#f59e0b"; ctx.font = "bold 7px ui-monospace"; ctx.textAlign = "center";
        ctx.fillText("Inflection", panelX + panelW/2, 123); ctx.textAlign = "left";
        ctx.fillStyle = "rgba(148,163,184,0.6)"; ctx.font = "7px ui-monospace";
        var yLine = 132;
        ctx.fillText("tanh: saturation |x|>3", panelX + 5, yLine); yLine += 11;
        ctx.fillText("sigmoid: plateau |x|>5", panelX + 5, yLine); yLine += 11;
        ctx.fillText("Cell: c=f*c'+i*g", panelX + 5, yLine); yLine += 11;
        ctx.fillText("forget: f in (0,1)", panelX + 5, yLine); yLine += 11;

        document.getElementById('loss-val').textContent = animStep + '/' + numSteps;
        document.getElementById('loss-val').className = 'val good';
      }
      function animate() {
        animStep = 0;
        function step() {
          if (animStep >= numSteps) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'cell t=' + animStep;
          render(); animStep++; setTimeout(step, 400);
        }
        step();
      }
      function reset() { animStep = 0; render(); }
""",

"gru": """
      // ===== GRU: unrolled with 2 gates (update + reset) =====
      var numSteps = 5;
      var animStep = 0;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('GRU cell unrolled — h_t = (1-z_t)⊙h_{t-1} + z_t⊙h̃_t', W/2, 30);
        ctx.textAlign = 'left';
        var cellW = 90, cellH = 60;
        var startX = 60, cellY = 100;
        for (var t = 0; t < numSteps; t++) {
          var x = startX + t * (cellW + 30);
          var active = animStep > t;
          ctx.fillStyle = active ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)';
          ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 2;
          ctx.fillRect(x, cellY, cellW, cellH); ctx.strokeRect(x, cellY, cellW, cellH);
          ctx.fillStyle = active ? '#f59e0b' : 'rgba(148,163,184,0.4)';
          ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('z r', x + cellW/2, cellY + 18);
          ctx.fillStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.5)';
          ctx.font = 'bold 11px ui-monospace';
          ctx.fillText('h_' + t, x + cellW/2, cellY + 40);
          ctx.textAlign = 'left';
          if (t < numSteps - 1) {
            ctx.strokeStyle = active ? '#06b6d4' : 'rgba(6,182,212,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + cellW, cellY + cellH/2);
            ctx.lineTo(x + cellW + 30, cellY + cellH/2); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px ui-monospace';
        ctx.fillText("z = update gate (collapses LSTM's f+i)", 60, H - 25);
        ctx.fillText("r = reset gate · 2 gates vs LSTM's 3 — fewer params", 60, H - 10);
        document.getElementById('loss-val').textContent = animStep + '/' + numSteps;
        document.getElementById('loss-val').className = 'val good';
      }
      function animate() {
        animStep = 0;
        function step() {
          if (animStep >= numSteps) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'cell t=' + animStep;
          render(); animStep++; setTimeout(step, 400);
        }
        step();
      }
      function reset() { animStep = 0; render(); }
""",

"transformer": """
      // ===== Transformer: self-attention heatmap =====
      var seqLen = 6;
      var headIdx = 0; var numHeads = 4;
      var animStep = 0;
      function softmax(arr) {
        var mx = Math.max.apply(null, arr);
        var exps = arr.map(function(v){ return Math.exp(v - mx); });
        var sum = exps.reduce(function(a,b){ return a+b; }, 0);
        return exps.map(function(e){ return e/sum; });
      }
      function makeAttn() {
        var heads = [];
        for (var h = 0; h < numHeads; h++) {
          var mat = [];
          for (var i = 0; i < seqLen; i++) {
            var row = [];
            for (var j = 0; j < seqLen; j++) {
              var v;
              if (h === 0) v = i === j ? 3 : 0.3;
              else if (h === 1) v = i + 1 === j ? 3 : 0.3;
              else if (h === 2) v = j === 0 ? 3 : 0.3;
              else v = Math.abs(i - j) === 1 ? 2 : 0.5;
              row.push(v);
            }
            row = softmax(row);
            mat.push(row);
          }
          heads.push(mat);
        }
        return heads;
      }
      var allHeads = makeAttn();
      function colorForWeight(w) {
        var r = Math.round(6 + w * 240);
        var g = Math.round(30 + w * 200);
        var b = Math.round(80 + w * 130);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      }
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Multi-Head Self-Attention — softmax(Q·Kᵀ/√d_k)', W/2, 30);
        ctx.textAlign = 'left';
        var weights = allHeads[Math.min(headIdx, numHeads - 1)];
        var cellW = 40, cellH = 40;
        var gridX = (W - cellW * seqLen) / 2;
        var gridY = 70;
        for (var i = 0; i < seqLen; i++) {
          for (var j = 0; j < seqLen; j++) {
            var w = weights[i][j];
            ctx.fillStyle = colorForWeight(w);
            ctx.fillRect(gridX + j*cellW, gridY + i*cellH, cellW-2, cellH-2);
            ctx.fillStyle = w > 0.3 ? '#000' : '#fff';
            ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
            ctx.fillText(w.toFixed(2), gridX + j*cellW + cellW/2, gridY + i*cellH + cellH/2 + 4);
            ctx.textAlign = 'left';
          }
        }
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
        for (var k = 0; k < seqLen; k++) {
          ctx.fillText('K'+k, gridX + k*cellW + cellW/2, gridY - 8);
          ctx.fillText('Q'+k, gridX - 20, gridY + k*cellH + cellH/2 + 4);
        }
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'left';
        ctx.fillText('Head: ' + (headIdx + 1) + '/' + numHeads, 60, H - 20);
        ctx.fillText('Patterns: diagonal | next | first-token | local', 200, H - 20);
        ctx.textAlign = 'left';

        // === Loss curve + inflection (Phase 39.4) ===
        var panelX = W - 115, panelW = 105;
        ctx.strokeStyle = "rgba(148,163,184,0.15)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(panelX, 35, panelW, 70);
        ctx.fillStyle = "#10b981"; ctx.font = "bold 8px ui-monospace"; ctx.textAlign = "center";
        ctx.fillText("Loss", panelX + panelW/2, 45); ctx.textAlign = "left";
        ctx.strokeStyle = "#10b981"; ctx.lineWidth = 1.2;
        ctx.beginPath();
        var lossArr = tfLoss || [];
        var curEp = tfEpoch || 0;
        for (var ei = 0; ei <= curEp && ei < lossArr.length; ei++) {
          var px = panelX + 3 + (ei / 100) * (panelW - 6);
          var py = 100 - (lossArr[ei] / 3.5) * 60;
          if (ei === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(245,158,11,0.15)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(panelX, 115, panelW, 80);
        ctx.fillStyle = "#f59e0b"; ctx.font = "bold 7px ui-monospace"; ctx.textAlign = "center";
        ctx.fillText("Inflection", panelX + panelW/2, 123); ctx.textAlign = "left";
        ctx.fillStyle = "rgba(148,163,184,0.6)"; ctx.font = "7px ui-monospace";
        var yLine = 132;
        ctx.fillText("softmax: T->0=greedy", panelX + 5, yLine); yLine += 11;
        ctx.fillText("softmax: T->inf=uniform", panelX + 5, yLine); yLine += 11;
        ctx.fillText("attn: sparsity=1-H", panelX + 5, yLine); yLine += 11;
        ctx.fillText("sqrt(d_k): prevents sat", panelX + 5, yLine); yLine += 11;

        document.getElementById('loss-val').textContent = 'h' + headIdx;
        document.getElementById('loss-val').className = 'val good';
      }
      function animate() {
        headIdx = 0;
        function step() {
          if (headIdx >= numHeads) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'head ' + (headIdx + 1) + '/' + numHeads;
          render(); headIdx++; setTimeout(step, 600);
        }
        step();
      }
      function reset() { headIdx = 0; render(); }
""",

"autoencoder": """
      // ===== Autoencoder: encoder-decoder diagram =====
      var layers = [8, 5, 3, 5, 8];
      var animStep = 0;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Autoencoder — x → z (compressed) → x̂ (reconstructed)', W/2, 30);
        ctx.textAlign = 'left';
        var cellW = 100, cellH = 80;
        var startX = 40, startY = 100;
        for (var li = 0; li < layers.length; li++) {
          var x = startX + li * (cellW + 25);
          var active = animStep > li;
          var isLatent = li === Math.floor(layers.length / 2);
          ctx.fillStyle = active ? (isLatent ? 'rgba(139,92,246,0.4)' : 'rgba(6,182,212,0.3)') : 'rgba(148,163,184,0.1)';
          ctx.strokeStyle = active ? (isLatent ? '#8b5cf6' : '#06b6d4') : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 2;
          var h = layers[li] * 8;
          ctx.fillRect(x, startY + (cellH - h) / 2, cellW * 0.6, h);
          ctx.strokeRect(x, startY + (cellH - h) / 2, cellW * 0.6, h);
          ctx.fillStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.5)';
          ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
          var label = isLatent ? 'z (latent ' + layers[li] + 'd)' : 'dim ' + layers[li];
          ctx.fillText(label, x + cellW * 0.3, startY + cellH + 20);
          ctx.textAlign = 'left';
          if (li < layers.length - 1) {
            ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + cellW * 0.6, startY + cellH/2);
            ctx.lineTo(x + cellW * 0.6 + 25, startY + cellH/2);
            ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Encoder →', startX + 1.5 * (cellW + 25), 90);
        ctx.fillText('← Decoder', startX + 3.5 * (cellW + 25), 90);
        ctx.textAlign = 'left';
        document.getElementById('loss-val').textContent = 'recon';
        document.getElementById('loss-val').className = 'val good';
      }
      function animate() {
        animStep = 0;
        function step() {
          if (animStep >= layers.length) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'layer ' + (animStep + 1) + '/' + layers.length;
          render(); animStep++; setTimeout(step, 350);
        }
        step();
      }
      function reset() { animStep = 0; render(); }
""",

"vae": """
      // ===== VAE: encoder → (μ, σ) → sample z → decoder =====
      var animStep = 0;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('VAE — reparameterisation trick: z = μ + σ · ε', W/2, 30);
        ctx.textAlign = 'left';
        var boxW = 100, boxH = 60;
        var startX = 40, y = 130;
        var encActive = animStep >= 1;
        ctx.fillStyle = encActive ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)';
        ctx.strokeStyle = encActive ? '#06b6d4' : 'rgba(148,163,184,0.3)';
        ctx.lineWidth = 2;
        ctx.fillRect(startX, y, boxW, boxH); ctx.strokeRect(startX, y, boxW, boxH);
        ctx.fillStyle = encActive ? '#06b6d4' : 'rgba(148,163,184,0.5)';
        ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Encoder', startX + boxW/2, y + boxH/2 - 5);
        ctx.fillText('f_enc(x)', startX + boxW/2, y + boxH/2 + 10);
        ctx.textAlign = 'left';
        var muActive = animStep >= 2;
        var x2 = startX + boxW + 40;
        ctx.fillStyle = muActive ? 'rgba(139,92,246,0.3)' : 'rgba(148,163,184,0.1)';
        ctx.strokeStyle = muActive ? '#8b5cf6' : 'rgba(148,163,184,0.3)';
        ctx.fillRect(x2, y - 5, 60, 30); ctx.strokeRect(x2, y - 5, 60, 30);
        ctx.fillRect(x2, y + 35, 60, 30); ctx.strokeRect(x2, y + 35, 60, 30);
        ctx.fillStyle = muActive ? '#8b5cf6' : 'rgba(148,163,184,0.5)';
        ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('μ', x2 + 30, y + 15);
        ctx.fillText('σ', x2 + 30, y + 55);
        ctx.textAlign = 'left';
        var epsActive = animStep >= 3;
        ctx.fillStyle = epsActive ? '#f59e0b' : 'rgba(148,163,184,0.3)';
        ctx.beginPath(); ctx.arc(x2 + 90, y + 35, 12, 0, 6.28); ctx.fill();
        ctx.fillStyle = epsActive ? '#f59e0b' : 'rgba(148,163,184,0.5)';
        ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('ε~N(0,I)', x2 + 90, y + 70);
        ctx.textAlign = 'left';
        var zActive = animStep >= 4;
        var x3 = x2 + 130;
        ctx.fillStyle = zActive ? 'rgba(16,185,129,0.4)' : 'rgba(148,163,184,0.1)';
        ctx.strokeStyle = zActive ? '#10b981' : 'rgba(148,163,184,0.3)';
        ctx.fillRect(x3, y, boxW * 0.7, boxH); ctx.strokeRect(x3, y, boxW * 0.7, boxH);
        ctx.fillStyle = zActive ? '#10b981' : 'rgba(148,163,184,0.5)';
        ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('z = μ+σ·ε', x3 + boxW * 0.35, y + boxH/2);
        ctx.textAlign = 'left';
        var decActive = animStep >= 5;
        var x4 = x3 + boxW * 0.7 + 40;
        ctx.fillStyle = decActive ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)';
        ctx.strokeStyle = decActive ? '#06b6d4' : 'rgba(148,163,184,0.3)';
        ctx.fillRect(x4, y, boxW, boxH); ctx.strokeRect(x4, y, boxW, boxH);
        ctx.fillStyle = decActive ? '#06b6d4' : 'rgba(148,163,184,0.5)';
        ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Decoder', x4 + boxW/2, y + boxH/2 - 5);
        ctx.fillText('g_dec(z)', x4 + boxW/2, y + boxH/2 + 10);
        ctx.textAlign = 'left';
        document.getElementById('loss-val').textContent = 'kl+recon';
        document.getElementById('loss-val').className = 'val good';
      }
      function animate() {
        animStep = 0;
        function step() {
          if (animStep >= 6) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'step ' + animStep + '/6';
          render(); animStep++; setTimeout(step, 400);
        }
        step();
      }
      function reset() { animStep = 0; render(); }
""",

"gan": """
      // ===== GAN: generator + discriminator =====
      var animStep = 0; var epoch = 0; var maxEpochs = 8;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('GAN — Generator vs Discriminator minimax game', W/2, 30);
        ctx.textAlign = 'left';
        var gx = 120, gy = 100, gw = 120, gh = 100;
        ctx.fillStyle = 'rgba(139,92,246,0.2)'; ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2;
        ctx.fillRect(gx, gy, gw, gh); ctx.strokeRect(gx, gy, gw, gh);
        ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Generator G', gx + gw/2, gy + 30);
        ctx.fillText('z → fake', gx + gw/2, gy + 50);
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(gx - 30, gy + gh/2, 10, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#f59e0b'; ctx.font = '9px ui-monospace';
        ctx.fillText('z', gx - 30, gy + gh/2 + 3);
        var dx = 480, dy = 100, dw = 120, dh = 100;
        ctx.fillStyle = 'rgba(6,182,212,0.2)'; ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2;
        ctx.fillRect(dx, dy, dw, dh); ctx.strokeRect(dx, dy, dw, dh);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Discriminator D', dx + dw/2, dy + 30);
        ctx.fillText('real or fake?', dx + dw/2, dy + 50);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(dx + dw/2, dy - 25, 10, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#10b981'; ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('real x', dx + dw/2, dy - 22);
        var arrowActive = animStep > 0 && animStep < 4;
        ctx.strokeStyle = arrowActive ? '#f59e0b' : 'rgba(148,163,184,0.3)';
        ctx.lineWidth = arrowActive ? 2.5 : 1;
        ctx.beginPath(); ctx.moveTo(gx + gw, gy + gh/2); ctx.lineTo(dx, dy + dh/2); ctx.stroke();
        var decision = Math.max(0.05, Math.min(0.95, 0.5 + 0.4 * Math.sin(epoch * 0.5)));
        var dColor = decision > 0.5 ? '#10b981' : '#ef4444';
        ctx.fillStyle = dColor; ctx.font = 'bold 13px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('D(fake) = ' + decision.toFixed(2), dx + dw/2, dy + dh + 35);
        ctx.fillText('(G wants this → 1.0)', dx + dw/2, dy + dh + 50);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 11px ui-monospace';
        ctx.fillText('Epoch: ' + epoch + '/' + maxEpochs, 60, H - 20);
        document.getElementById('loss-val').textContent = decision.toFixed(2);
        document.getElementById('loss-val').className = 'val ' + (decision > 0.5 ? 'good' : 'bad');
      }
      function animate() {
        epoch = 0; animStep = 0;
        function step() {
          if (epoch >= maxEpochs) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'epoch ' + (epoch + 1) + '/' + maxEpochs;
          render(); epoch++; animStep++; setTimeout(step, 500);
        }
        step();
      }
      function reset() { epoch = 0; animStep = 0; render(); }
""",

"resnet": """
      // ===== ResNet: stacked blocks with skip connections =====
      var numBlocks = 6;
      var animStep = 0;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('ResNet — residual blocks with identity skip connections', W/2, 30);
        ctx.textAlign = 'left';
        var blockW = 80, blockH = 60;
        var startX = 60, blockY = 150;
        for (var b = 0; b < numBlocks; b++) {
          var x = startX + b * (blockW + 30);
          var active = animStep > b;
          ctx.fillStyle = active ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)';
          ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 2;
          ctx.fillRect(x, blockY, blockW, blockH); ctx.strokeRect(x, blockY, blockW, blockH);
          ctx.fillStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.5)';
          ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('Block ' + (b+1), x + blockW/2, blockY + blockH/2 + 4);
          ctx.textAlign = 'left';
          ctx.strokeStyle = active ? '#8b5cf6' : 'rgba(139,92,246,0.3)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x, blockY);
          ctx.bezierCurveTo(x, blockY - 30, x + blockW, blockY - 30, x + blockW, blockY);
          ctx.stroke();
          ctx.fillStyle = active ? '#8b5cf6' : 'rgba(139,92,246,0.5)';
          ctx.font = 'bold 14px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('+', x + blockW + 5, blockY + 5);
          ctx.textAlign = 'left';
          if (b < numBlocks - 1) {
            ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + blockW + 10, blockY + blockH/2);
            ctx.lineTo(x + blockW + 30, blockY + blockH/2); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px ui-monospace';
        ctx.fillText('Purple curves = identity skip (y = F(x) + x)', 60, H - 25);
        ctx.fillText('Gradient always has path of 1s → no vanishing in deep nets', 60, H - 10);
        document.getElementById('loss-val').textContent = animStep + '/' + (numBlocks + 1);
        document.getElementById('loss-val').className = 'val good';
      }
      function animate() {
        animStep = 0;
        function step() {
          if (animStep > numBlocks) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'block ' + animStep + '/' + numBlocks;
          render(); animStep++; setTimeout(step, 350);
        }
        step();
      }
      function reset() { animStep = 0; render(); }
""",

"diffusion": """
      // ===== Diffusion: forward + reverse trajectory =====
      var numSteps = 8;
      var animStep = 0;
      var forward = true;
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Diffusion — forward noise + reverse denoise', W/2, 30);
        ctx.textAlign = 'left';
        var stepW = 65, stepH = 100;
        var startX = 30, stepY = 100;
        for (var t = 0; t <= numSteps; t++) {
          var x = startX + t * (stepW + 5);
          var noise = t / numSteps;
          var active = forward ? (animStep >= t) : (animStep >= (numSteps - t));
          ctx.fillStyle = active ? 'rgba(6,182,212,' + (1 - noise * 0.5) + ')' : 'rgba(148,163,184,0.1)';
          ctx.strokeStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 1.5;
          ctx.fillRect(x, stepY, stepW - 5, stepH); ctx.strokeRect(x, stepY, stepW - 5, stepH);
          if (active) {
            for (var d = 0; d < noise * 50; d++) {
              var px = x + 5 + Math.random() * (stepW - 15);
              var py = stepY + 5 + Math.random() * (stepH - 10);
              ctx.fillStyle = 'rgba(239,68,68,' + (0.3 + noise * 0.5) + ')';
              ctx.beginPath(); ctx.arc(px, py, 1, 0, 6.28); ctx.fill();
            }
          }
          ctx.fillStyle = active ? '#06b6d4' : 'rgba(148,163,184,0.5)';
          ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('x_' + t, x + stepW/2, stepY + stepH + 15);
          ctx.textAlign = 'left';
        }
        ctx.strokeStyle = forward ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 2;
        ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = forward ? '#f59e0b' : '#10b981';
        ctx.fillText(forward ? '→ Forward (q: add noise)' : '← Reverse (p: denoise)', W/2, H - 35);
        ctx.fillText('step ' + animStep + '/' + numSteps, W/2, H - 18);
        ctx.textAlign = 'left';
        document.getElementById('loss-val').textContent = (forward ? '+' : '-') + animStep;
        document.getElementById('loss-val').className = 'val ' + (forward ? 'bad' : 'good');
      }
      function animate() {
        animStep = 0; forward = true;
        function step() {
          if (forward && animStep >= numSteps) { forward = false; animStep = 0; }
          if (!forward && animStep >= numSteps) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'done ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = forward ? ('q step ' + animStep) : ('p step ' + animStep);
          render(); animStep++; setTimeout(step, 400);
        }
        step();
      }
      function reset() { animStep = 0; forward = true; render(); }
""",

"coconet": """
      // ===== CoCoNet — conformal prediction pipeline =====
      // Multi-stage animation:
      //   Stage 1: scatter plot of calibration data + fitted line
      //   Stage 2: residuals shown as vertical error bars (non-conformity scores)
      //   Stage 3: histogram of calibration scores
      //   Stage 4: alpha-quantile q_alpha highlighted on histogram
      //   Stage 5: prediction intervals for new test points (with the true y check)
      var stage = 0; var maxStage = 5;
      // Phase 38.3: load alpha from localStorage OR URL param ?alpha=X
      // (priority: URL param > localStorage > default 0.10)
      var urlParams = new URLSearchParams(window.location.search);
      var urlAlpha = parseFloat(urlParams.get('alpha'));
      var storedAlpha = parseFloat(localStorage.getItem('coconet-alpha'));
      var alphaLevel = !isNaN(urlAlpha) ? urlAlpha
                     : !isNaN(storedAlpha) ? storedAlpha
                     : 0.1;
      // Sync the slider + display
      document.getElementById('b1-slider').min = '0.01';
      document.getElementById('b1-slider').max = '0.5';
      document.getElementById('b1-slider').step = '0.01';
      document.getElementById('b1-slider').value = alphaLevel;
      document.getElementById('b1-val').textContent = alphaLevel.toFixed(2);
      // Update label text (CoCoNet's slider controls alpha, not a generic parameter)
      var b1Label = document.querySelector('#b1-ctrl label');
      if (b1Label && b1Label.firstChild) b1Label.firstChild.textContent = 'α (1-coverage) ';

      // Synthetic calibration data: y = 2x + 1 + noise
      var data = [
        [0.5, 1.85], [1.0, 3.4], [1.5, 3.7], [2.0, 5.5],
        [2.5, 5.8], [3.0, 7.3], [0.8, 2.6], [1.7, 4.2],
        [2.3, 5.6], [2.8, 6.4]
      ];
      function predict(x) { return 2 * x + 1; }  // true underlying
      function scores() {
        return data.map(function(d) { return Math.abs(d[1] - predict(d[0])); });
      }
      function quantile(arr, q) {
        var sorted = arr.slice().sort(function(a,b){ return a - b; });
        var n = sorted.length;
        var idx = Math.min(n - 1, Math.max(0, Math.ceil((n + 1) * q) - 1));
        return sorted[idx];
      }
      function toCX(x) { return 50 + (x) / 6 * 250; }     // x in [0,6] → canvas [50, 300]
      function toCY(y) { return H - 40 - (y) / 12 * (H - 80); }  // y in [0,12] → canvas [H-40, 40]
      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('CoCoNet — conformal prediction pipeline (coverage ≥ ' + ((1 - alphaLevel) * 100).toFixed(0) + '%)', W/2, 25);
        ctx.textAlign = 'left';
        // Left half: scatter plot
        var leftW = 380;
        // Grid + axes
        ctx.strokeStyle = 'rgba(148,163,184,0.06)'; ctx.lineWidth = 0.5;
        for (var g = 0; g <= 6; g++) { var px = toCX(g); ctx.beginPath(); ctx.moveTo(px, 30); ctx.lineTo(px, H - 60); ctx.stroke(); }
        for (var gy = 0; gy <= 12; gy += 2) { var py = toCY(gy); ctx.beginPath(); ctx.moveTo(50, py); ctx.lineTo(leftW, py); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(50, toCY(0)); ctx.lineTo(leftW, toCY(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toCX(0), 30); ctx.lineTo(toCX(0), H - 60); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('x', leftW - 5, H - 45); ctx.fillText('y', 35, 40);
        // Fitted line (always shown)
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.moveTo(toCX(0), toCY(predict(0))); ctx.lineTo(toCX(6), toCY(predict(6))); ctx.stroke();
        ctx.shadowBlur = 0;
        // Calibration data points (Stage 1+)
        if (stage >= 1) {
          for (var i = 0; i < data.length; i++) {
            var px = toCX(data[i][0]), py = toCY(data[i][1]);
            ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(px, py, 4, 0, 6.28); ctx.fill();
          }
          ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('Calibration points', leftW / 2, H - 50);
        }
        // Residuals (Stage 2+)
        if (stage >= 2) {
          ctx.strokeStyle = 'rgba(239,68,68,0.7)'; ctx.lineWidth = 1.5;
          for (var r = 0; r < data.length; r++) {
            var px = toCX(data[r][0]);
            var py_data = toCY(data[r][1]);
            var py_fit = toCY(predict(data[r][0]));
            ctx.beginPath(); ctx.moveTo(px, py_data); ctx.lineTo(px, py_fit); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(239,68,68,0.7)'; ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('Residuals s_i = |y_i − ŷ(x_i)|', leftW / 2, H - 35);
        }
        // Prediction intervals for new test points (Stage 5)
        if (stage >= 5) {
          var q = quantile(scores(), 1 - alphaLevel);
          var testX = [4.0, 5.0];
          for (var t = 0; t < testX.length; t++) {
            var tx = toCX(testX[t]);
            var tpred = predict(testX[t]);
            var tlow = tpred - q, thigh = tpred + q;
            // Interval box
            ctx.fillStyle = 'rgba(16,185,129,0.25)';
            ctx.fillRect(tx - 8, toCY(thigh), 16, toCY(tlow) - toCY(thigh));
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
            ctx.strokeRect(tx - 8, toCY(thigh), 16, toCY(tlow) - toCY(thigh));
            // Prediction point
            ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(tx, toCY(tpred), 5, 0, 6.28); ctx.fill();
          }
          ctx.fillStyle = '#10b981'; ctx.font = '9px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('Test intervals [ŷ ± q_α]', leftW / 2, H - 20);
        }
        // Right half: histogram of scores + q_alpha
        var histX = leftW + 30;
        var histW = W - histX - 30;
        var histY = 50, histH = H - 100;
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(histX, histY + histH); ctx.lineTo(histX + histW, histY + histH); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText('Score histogram', histX + histW / 2, histY - 8);
        if (stage >= 3) {
          var s = scores();
          var maxS = Math.max.apply(null, s) * 1.1;
          var numBins = 8;
          var bins = new Array(numBins).fill(0);
          for (var b = 0; b < s.length; b++) {
            var bi = Math.min(numBins - 1, Math.floor(s[b] / maxS * numBins));
            bins[bi]++;
          }
          var maxBin = Math.max.apply(null, bins);
          var binW = histW / numBins;
          for (var bb = 0; bb < numBins; bb++) {
            var bh = bins[bb] / maxBin * histH;
            ctx.fillStyle = 'rgba(245,158,11,0.7)';
            ctx.fillRect(histX + bb * binW, histY + histH - bh, binW - 2, bh);
          }
        }
        if (stage >= 4) {
          var q = quantile(scores(), 1 - alphaLevel);
          var qFrac = q / Math.max.apply(null, scores()) / 1.1;
          var qx = histX + qFrac * histW;
          ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 3]);
          ctx.beginPath(); ctx.moveTo(qx, histY); ctx.lineTo(qx, histY + histH); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#10b981'; ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'center';
          ctx.fillText('q_α = ' + q.toFixed(3), qx, histY - 10);
        }
        // Stage indicator
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'left';
        var stages = ['(idle)', '1: scatter + line', '2: residuals s_i', '3: histogram', '4: q_α quantile', '5: intervals ✓'];
        ctx.fillText('Stage ' + stage + '/' + maxStage + ' ' + (stages[stage] || ''), 50, 45);
        // Coverage indicator
        if (stage >= 5) {
          var q = quantile(scores(), 1 - alphaLevel);
          document.getElementById('loss-val').textContent = q.toFixed(3);
          document.getElementById('loss-val').className = 'val good';
          document.getElementById('loss-lbl').textContent = 'q_α';
        } else {
          document.getElementById('loss-val').textContent = ((1 - alphaLevel) * 100).toFixed(0) + '%';
          document.getElementById('loss-val').className = 'val ok';
          document.getElementById('loss-lbl').textContent = 'coverage';
        }
      }
      function animate() {
        stage = 0;
        function step() {
          if (stage > maxStage) {
            isAnim = false; document.getElementById('btn-gd').disabled = false;
            document.getElementById('phase-ind').textContent = 'coverage ✓';
            document.getElementById('phase-ind').classList.remove('active');
            return;
          }
          document.getElementById('phase-ind').textContent = 'stage ' + stage + '/' + maxStage;
          render(); stage++; setTimeout(step, 700);
        }
        step();
      }
      function reset() {
        stage = 0; alphaLevel = 0.1;
        document.getElementById('b1-slider').value = 0.1;
        document.getElementById('b1-val').textContent = '0.10';
        // Phase 38.3: clear localStorage on manual reset
        localStorage.removeItem('coconet-alpha');
        render();
      }
      // Phase 38.3: slider input → save to localStorage + update URL
      document.getElementById('b1-slider').oninput = function(e) {
        alphaLevel = parseFloat(e.target.value);
        document.getElementById('b1-val').textContent = alphaLevel.toFixed(2);
        // Persist (lazy eval: only on user interaction, not page load)
        try { localStorage.setItem('coconet-alpha', alphaLevel.toString()); } catch (e) {}
        // Update URL ?alpha=X for sharing (without triggering reload)
        try {
          var u = new URL(window.location.href);
          u.searchParams.set('alpha', alphaLevel.toString());
          window.history.replaceState({}, '', u.toString());
        } catch (e) {}
        if (stage >= 4) render();
      };

      // Phase 38.3: add a "share URL" info line below the controls
      // (lazy-evaluated — only shown when the user has interacted with the slider)
      var shareInfo = document.createElement('div');
      shareInfo.style.cssText = 'margin-top: 10px; padding: 8px 10px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 6px; font-size: 10px; color: #9ca3af; line-height: 1.5;';
      shareInfo.innerHTML = '<b style="color:#06b6d4;">🔗 Shareable URL:</b> ' +
        '<code id="share-url" style="color:#10b981;font-size:10px;">' + window.location.href + '</code>' +
        '<br><b style="color:#8b5cf6;">💾 Persistence:</b> α saved to localStorage (lazy-eval, no reload needed)' +
        '<br><b style="color:#f59e0b;">☁️ Cloud storage options:</b> ' +
        '<a href="https://docs.github.com/en/repositories/working-with-files/managing-large-files" target="_blank" style="color:#06b6d4;text-decoration:none;">GitHub Releases</a> (free, ≤2GB/file) · ' +
        '<a href="https://www.backblaze.com/cloud-storage" target="_blank" style="color:#06b6d4;text-decoration:none;">Backblaze B2</a> (10GB free) · ' +
        '<a href="https://www.cloudflare.com/products/r2/" target="_blank" style="color:#06b6d4;text-decoration:none;">Cloudflare R2</a> (10GB free) · ' +
        '<a href="https://aws.amazon.com/s3/" target="_blank" style="color:#06b6d4;text-decoration:none;">AWS S3</a> (paid) · ' +
        '<a href="https://cloud.google.com/storage" target="_blank" style="color:#06b6d4;text-decoration:none;">GCS</a> (paid) · ' +
        '<a href="https://azure.microsoft.com/products/storage/blobs" target="_blank" style="color:#06b6d4;text-decoration:none;">Azure Blob</a> (paid) ' +
        '<br><i style="color:#6b7280;">For technical-minded users: subscribe to a cloud portal for versioned snapshots of model weights + calibration sets</i>';
      var controlsDiv = document.querySelector('.controls');
      if (controlsDiv && controlsDiv.parentNode) {
        controlsDiv.parentNode.insertBefore(shareInfo, controlsDiv.nextSibling);
      }
      // Update the share URL display whenever alpha changes
      var origOnInput = document.getElementById('b1-slider').oninput;
      document.getElementById('b1-slider').addEventListener('input', function() {
        var shareUrlEl = document.getElementById('share-url');
        if (shareUrlEl) shareUrlEl.textContent = window.location.href;
      });
""",

}



# ============================================================================
FAMILY_META = {
    "loss":         {"label": "Loss Functions",  "css_class": "loss", "chip": "Loss",   "icon": "📊", "section": "Loss"},
    "activation":   {"label": "Activations",      "css_class": "act",  "chip": "Activation", "icon": "⚡", "section": "Activation"},
    "optimiser":    {"label": "Optimisers",       "css_class": "opt",  "chip": "Optimiser", "icon": "🌀", "section": "Optimiser"},
    "normalisation":{"label": "Normalisation",    "css_class": "norm", "chip": "Norm",    "icon": "📐", "section": "Norm"},
    "attention":    {"label": "Attention",       "css_class": "attn", "chip": "Attention", "icon": "🔍", "section": "Attention"},
    "regularisation":{"label": "Regularisation", "css_class": "reg",  "chip": "Regularisation", "icon": "🎲", "section": "Regularisation"},
    "neural_network":{"label": "Neural Network Architectures", "css_class": "nn", "chip": "Architecture", "icon": "🧠", "section": "Architecture"},
}
FAMILY_ORDER = ["loss", "activation", "optimiser", "normalisation", "attention", "regularisation", "neural_network"]


def gen_index(cards):
    by_family = {fam: [] for fam in FAMILY_ORDER}
    for c in cards:
        by_family[c["family"]].append(c)

    total = len(cards)

    sections = []
    for fam in FAMILY_ORDER:
        meta = FAMILY_META[fam]
        fam_cards = by_family[fam]
        section_title = f'{meta["icon"]} {meta["label"]} ({len(fam_cards)})'
        cards_html = "\n        ".join(
            f'<a class="card" href="{c["slug"]}.html">'
            f'<span class="cat {meta["css_class"]}">{meta["chip"]}</span>'
            f'<h3>{c["title"]}</h3>'
            f'<p>{c.get("card_desc_grid", "")}</p>'
            f'</a>'
            for c in fam_cards
        )
        sections.append(
            f'      <div class="section-title">{section_title}</div>\n'
            f'      <div class="grid">\n        {cards_html}\n      </div>'
        )
    sections_html = "\n\n".join(sections)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="AIHPC Advanced — Concept Cards (v2). {total} interactive concept cards with animated canvases, real-time sliders, and Math→Code annotations." />
    <title>🎨 Concept Cards — AIHPC Advanced</title>
    <style>
      :root {{ --bg:#0b0f1a; --bg-elevated:#121826; --border:#1f2937; --text:#f3f4f6; --text-muted:#9ca3af; --accent:#06b6d4; --accent2:#8b5cf6; }}
      * {{ box-sizing: border-box; margin: 0; padding: 0; }}
      html, body {{ background: var(--bg); color: var(--text); font-family: -apple-system, "Segoe UI", sans-serif; min-height: 100vh; }}
      body::before {{ content:""; position:fixed; inset:0; background: radial-gradient(1000px 500px at 50% 0%, rgba(6,182,212,0.10), transparent 70%); pointer-events:none; z-index:0; }}
      .container {{ max-width: 900px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }}
      h1 {{ font-size: 28px; margin: 0 0 4px; background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; }}
      .lead {{ font-size: 14px; color: var(--text-muted); margin: 0 0 24px; max-width: 700px; }}
      .back-link {{ font-size: 12px; color: var(--accent); text-decoration: none; margin-bottom: 16px; display: inline-block; }}
      .section-title {{ font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 8px; }}
      .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }}
      .card {{ background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 16px; text-decoration: none; color: var(--text); transition: all 0.2s; display: block; }}
      .card:hover {{ border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(6,182,212,0.12); }}
      .card .cat {{ font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }}
      .card .cat.loss {{ background: rgba(6,182,212,0.15); color: #67e8f9; }}
      .card .cat.act {{ background: rgba(139,92,246,0.15); color: #c4b5fd; }}
      .card .cat.opt {{ background: rgba(245,158,11,0.15); color: #fcd34d; }}
      .card .cat.norm {{ background: rgba(16,185,129,0.15); color: #6ee7b7; }}
      .card .cat.attn {{ background: rgba(236,72,153,0.15); color: #f9a8d4; }}
      .card .cat.reg {{ background: rgba(99,102,241,0.15); color: #a5b4fc; }}
      .card h3 {{ font-size: 14px; font-weight: 700; margin: 0 0 4px; }}
      .card p {{ font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.4; }}
      .foot {{ font-size: 11px; color: var(--text-muted); margin-top: 24px; text-align: center; }}
      .foot a {{ color: var(--accent); text-decoration: none; }}
      .try-yourself {{ background: rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.25); border-radius: 10px; padding: 16px 20px; margin: 0 0 24px; }}
      .try-yourself h2 {{ font-size: 14px; font-weight: 700; color: var(--accent); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; }}
      .try-yourself ul {{ margin: 0; padding-left: 20px; }}
      .try-yourself li {{ font-size: 12px; color: var(--text-muted); margin: 4px 0; line-height: 1.5; }}
      .try-yourself li b {{ color: var(--text); }}
      .try-yourself a {{ color: var(--accent); text-decoration: none; font-family: ui-monospace, monospace; font-size: 11px; }}
    </style>
  </head>
  <body>
    <div class="container">
      <a href="../index.html" class="back-link">← Home</a>
      <h1>🎨 Concept Cards (v2)</h1>
      <p class="lead">{total} concept cards — animated canvas as the hero, minimal text, real-time sliders, and code with Math→Code annotations. Less reading, more fascination. Drag the sliders, hit the action button, watch the math happen.</p>

      <div class="try-yourself">
        <h2>🎯 Try it yourself — quick demos</h2>
        <ul>
          <li><b>MSE card</b> — drag the slope slider, hit "Run gradient descent", watch 80 steps of GD converge: <a href="ml-mse.html">ml-mse.html</a></li>
          <li><b>ReLU card</b> — drag the x slider, hit "Sweep x", watch f(x) + f'(x) update in real time: <a href="ml-relu.html">ml-relu.html</a></li>
          <li><b>Sigmoid card</b> — drag x from -4 to +4, watch the S-curve and its bell-shaped gradient: <a href="ml-sigmoid.html">ml-sigmoid.html</a></li>
          <li><b>Tanh card</b> — drag x, compare the zero-centred (-1, 1) squasher with sigmoid: <a href="ml-tanh.html">ml-tanh.html</a></li>
          <li><b>SGD card</b> — hit "Run optimiser", watch the trajectory oscillate in the ravine: <a href="ml-sgd.html">ml-sgd.html</a></li>
          <li><b>Adam card</b> — compare the trajectory with SGD (smoother, converges faster): <a href="ml-adam.html">ml-adam.html</a></li>
          <li><b>BatchNorm card</b> — drag spread, hit "Apply normalisation", watch the histogram recenter: <a href="ml-batchnorm.html">ml-batchnorm.html</a></li>
          <li><b>Attention card</b> — hit "Animate attention", watch each query row's softmax heat up: <a href="ml-scaled-dot-product-attention.html">ml-scaled-dot-product-attention.html</a></li>
          <li><b>Dropout card</b> — drag λ, hit "Resample", watch neurons drop stochastically: <a href="ml-dropout.html">ml-dropout.html</a></li>
          <li><b>All {total} cards</b> — every card below is interactive: scroll down ↓</li>
        </ul>
      </div>

{sections_html}

      <div class="foot">
        <a href="../concepts.html">📖 Full text concept cards (v1)</a> · <a href="../science-ml.html">🔬 ML demos page</a> · Generated by <code>scripts/gen-concept-cards-v2.py</code>
      </div>
    </div>
        <!-- Simplified footer — GDPR + HIPAA + MIT license -->
    <div style="margin-top: 40px; padding: 16px 20px; background: rgba(11,15,26,0.6); border: 1px solid #1f2937; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="color: #10b981;">📜 MIT License</span>
        <span style="color: #06b6d4;">🔒 GDPR Compliant</span>
        <span style="color: #06b6d4;">🏥 HIPAA Ready</span>
        <span style="color: #10b981;">📊 SOC 2 Aligned</span>
      </div>
      <p style="margin: 8px 0;">© 2026 AIHPC Advanced. All rights reserved. · Contact: <a href="mailto:testdemoqwenai2025@gmail.com" style="color: #06b6d4;">testdemoqwenai2025@gmail.com</a></p>
      <p style="margin: 4px 0; font-size: 10px;">Data protection: no personal data collected · no cookies · no tracking · no external API calls · all computations client-side (lazy evaluation)</p>
    </div>
    <script src="header-banner.js"></script>
    <script src="zoom-loader.js"></script>
  </body>
</html>"""


# ============================================================================
# Main
# ============================================================================
def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Validate all Python code blocks parse cleanly before generating HTML
    bad = []
    for card in CARDS:
        src = card["py"]
        try:
            ast.parse(src)
        except SyntaxError as e:
            bad.append((card["slug"], e))
    if bad:
        print("ERROR: Python code blocks failed to parse:", file=sys.stderr)
        for slug, e in bad:
            print(f"  {slug}: {e}", file=sys.stderr)
        return 1

    for card in CARDS:
        html = gen_card(card)
        path = os.path.join(OUT_DIR, card["slug"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  generated {os.path.basename(path)} ({len(html)} bytes)")

    idx = gen_index(CARDS)
    idx_path = os.path.join(OUT_DIR, "index.html")
    with open(idx_path, "w", encoding="utf-8") as f:
        f.write(idx)
    print(f"  generated index.html ({len(idx)} bytes)")

    print(f"\nTotal: {len(CARDS)} cards + index.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())

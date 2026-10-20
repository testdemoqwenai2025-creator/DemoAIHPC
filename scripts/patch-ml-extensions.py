#!/usr/bin/env python3
"""
patch-ml-extensions.py — Phase 33 ML page extensions.

Adds 9 more demos to scripts/gen-ml-page.py:

  Activation Functions:
    10. ReLU — max(0, x)
    11. GELU — x * Phi(x)
    12. SwiGLU — Swish(x) * (xW + b)

  Optimisers:
    13. SGD — theta <- theta - eta * grad
    14. Adam — momentum + RMSProp
    15. AdamW — Adam with decoupled weight decay

  Regularisation:
    16. Dropout — randomly zero p% of activations
    17. L1/L2 — lambda * ||w||_1 + lambda * ||w||^2
    18. BatchNorm — (x - mu) / sigma * gamma + beta

Each demo has: equation + 5-step derivation + 6-language code +
math-to-code annotation + stats + report + graph + summary +
sample_data + GTS config.

Idempotent.
"""
import re

GEN_PATH = "/home/z/my-project/AETH-1-Content-Archive/scripts/gen-ml-page.py"

# The 9 new loss function entries (compact but complete)
NEW_ENTRIES = r'''    # ====================================================================
    # Activation Functions
    # ====================================================================
    {
        "id": "relu",
        "name": "ReLU (Rectified Linear Unit)",
        "category": "Activation Function",
        "equation": "f(x) = max(0, x)",
        "explanation": "ReLU is the most widely used activation function in deep learning. It outputs 0 for negative inputs and the identity for positive inputs. ReLU is computationally cheap (a single max operation), sparse-activating (many neurons output 0), and non-saturating for positive gradients (no vanishing gradient for x > 0).",
        "derivation": [
            ("Step 1: Define the function", "f(x) = max(0, x)", "For any input x, output 0 if x < 0, else output x. This is a piecewise linear function with a kink at x = 0."),
            ("Step 2: Gradient", "f'(x) = 1 if x > 0, 0 if x < 0, undefined at x = 0", "The gradient is 1 for positive inputs (no vanishing gradient) and 0 for negative inputs (dead neurons). At x = 0, the sub-gradient is used (typically 0 or 1)."),
            ("Step 3: Sparsity", "P(f(x) = 0) = P(x < 0)", "For normally-distributed inputs, ~50% of neurons output 0. This sparsity is computationally efficient and acts as implicit regularisation."),
            ("Step 4: Non-saturating", "For x > 0: f'(x) = 1 (constant gradient)", "Unlike sigmoid/tanh whose gradients vanish as x grows, ReLU's gradient is 1 for all positive x. This enables training very deep networks."),
            ("Step 5: Dead neuron problem", "If x < 0 for all training data: f'(x) = 0, neuron never recovers", "A 'dead ReLU' outputs 0 and has 0 gradient for all inputs — it never updates. Mitigated by Leaky ReLU (f(x) = max(αx, x) for small α) or careful initialisation."),
        ],
        "code": {
            "python": "# f(x) = max(0, x)\n# x -> input array  max(0,.) -> np.maximum(0, .)\nimport numpy as np\ndef relu(x):\n    return np.maximum(0, x)\ndef relu_grad(x):\n    return (x > 0).astype(float)",
            "rust": "fn relu(x: f64) -> f64 { x.max(0.0) }\nfn relu_grad(x: f64) -> f64 { if x > 0.0 { 1.0 } else { 0.0 } }",
            "go": "func ReLU(x float64) float64 { return math.Max(0, x) }\nfunc ReLUGrad(x float64) float64 { if x > 0 { return 1 }; return 0 }",
            "c": "double relu(double x) { return x > 0 ? x : 0; }\ndouble relu_grad(double x) { return x > 0 ? 1.0 : 0.0; }",
            "elixir": "defmodule ReLU do\n  def f(x), do: max(0, x)\n  def grad(x), do: if x > 0, do: 1.0, else: 0.0\nend",
            "scala": "def relu(x: Double): Double = math.max(0, x)\ndef reluGrad(x: Double): Double = if (x > 0) 1.0 else 0.0",
        },
        "stats": [
            {"label": "Type", "value": "Activation"},
            {"label": "Range", "value": "[0, +inf)"},
            {"label": "Gradient (x>0)", "value": "1 (non-vanishing)"},
            {"label": "Gradient (x<0)", "value": "0 (dead)"},
            {"label": "Sparsity", "value": "~50%"},
            {"label": "Cost", "value": "1 max op"},
        ],
        "report": "ReLU is the default activation function for hidden layers in modern deep networks. It is non-saturating for positive inputs (gradient = 1), enabling training of very deep networks. ~50% of neurons are inactive (sparse), improving computational efficiency. The main drawback is the 'dead neuron' problem: if a neuron's input is always negative, its gradient is 0 and it never updates.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 180 L 200 180 L 380 20" stroke="#8b5cf6" stroke-width="2" fill="none"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">x</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">f(x)</text></svg>',
        "summary": [
            "ReLU = max(0, x) — non-saturating for x > 0, sparse activation.",
            "Gradient = 1 for x > 0 (no vanishing gradient); 0 for x < 0 (dead neuron risk).",
            "~50% sparsity for normally-distributed inputs — implicit regularisation.",
            "Default for hidden layers; Leaky ReLU (f(x) = max(ax, x)) mitigates dead neurons.",
        ],
        "sample_data": {
            "headers": ["x", "f(x)=max(0,x)", "gradient"],
            "rows": [["-3.0", "0.0", "0"], ["-1.0", "0.0", "0"], ["-0.5", "0.0", "0"], ["0.0", "0.0", "0/1"], ["0.5", "0.5", "1"], ["1.0", "1.0", "1"], ["3.0", "3.0", "1"]],
            "caption": "ReLU sample — note the kink at x=0 and the 0-gradient for x<0",
        },
    },
    {
        "id": "gelu",
        "name": "GELU (Gaussian Error Linear Unit)",
        "category": "Activation Function",
        "equation": "f(x) = x * Phi(x) approx 0.5x(1 + tanh(sqrt(2/pi)(x + 0.044715x^3)))",
        "explanation": "GELU is a smooth approximation of ReLU that multiplies the input by its own Gaussian CDF. For large positive x, f(x) approx x (like ReLU). For large negative x, f(x) approx 0 (like ReLU). Near x=0, GELU is smooth (no kink), giving it better gradient properties than ReLU.",
        "derivation": [
            ("Step 1: Gaussian CDF", "Phi(x) = integral from -inf to x of (1/sqrt(2*pi)) * exp(-t^2/2) dt", "Phi(x) is the cumulative distribution function of the standard normal. It is 0 for very negative x, 0.5 at x=0, and 1 for very positive x."),
            ("Step 2: GELU definition", "f(x) = x * Phi(x)", "Multiply the input by its own CDF. For x >> 0: Phi approx 1, so f(x) approx x. For x << 0: Phi approx 0, so f(x) approx 0. Near x=0: smooth transition."),
            ("Step 3: Tanh approximation", "Phi(x) approx 0.5 * (1 + tanh(sqrt(2/pi) * (x + 0.044715 * x^3)))", "The exact Phi requires the error function (erf). The tanh approximation is accurate to within 0.0001 and is much faster to compute."),
            ("Step 4: Gradient", "f'(x) = Phi(x) + x * phi(x)", "where phi(x) is the Gaussian PDF. The gradient is smooth everywhere (no kink), and non-zero for x < 0 (unlike ReLU)."),
            ("Step 5: Why it works", "GELU is dropout-like (probabilistic) + ReLU-like (deterministic)", "GELU can be interpreted as 'ReLU with soft gating': instead of a hard 0/1 gate, it uses a probabilistic gate Phi(x). This smoothness improves generalisation and is the default activation in BERT, GPT, and most transformer models."),
        ],
        "code": {
            "python": "# f(x) = x * Phi(x) approx 0.5x(1 + tanh(c*(x + a*x^3)))\n# x -> input  Phi -> Gaussian CDF  tanh -> np.tanh()\n# c = sqrt(2/pi) = 0.7978  a = 0.044715\nimport numpy as np\ndef gelu(x):\n    c = np.sqrt(2 / np.pi)\n    return 0.5 * x * (1 + np.tanh(c * (x + 0.044715 * x**3)))",
            "rust": "fn gelu(x: f64) -> f64 {\n    let c = (2.0 / std::f64::consts::PI).sqrt();\n    0.5 * x * (1.0 + (c * (x + 0.044715 * x.powi(3))).tanh())\n}",
            "go": "func GELU(x float64) float64 {\n\tc := math.Sqrt(2 / math.Pi)\n\treturn 0.5 * x * (1 + math.Tanh(c * (x + 0.044715*math.Pow(x, 3))))\n}",
            "c": "double gelu(double x) {\n    double c = sqrt(2.0 / M_PI);\n    return 0.5 * x * (1.0 + tanh(c * (x + 0.044715 * x*x*x)));\n}",
            "elixir": "defmodule GELU do\n  def f(x) do\n    c = :math.sqrt(2 / :math.pi)\n    0.5 * x * (1 + :math.tanh(c * (x + 0.044715 * :math.pow(x, 3))))\n  end\nend",
            "scala": "def gelu(x: Double): Double = {\n  val c = math.sqrt(2 / math.Pi)\n  0.5 * x * (1 + math.tanh(c * (x + 0.044715 * math.pow(x, 3))))\n}",
        },
        "stats": [
            {"label": "Type", "value": "Activation"},
            {"label": "Range", "value": "(-0.17, +inf)"},
            {"label": "Smooth", "value": "Yes (C-infinity)"},
            {"label": "Gradient (x<0)", "value": "Non-zero"},
            {"label": "Used in", "value": "BERT, GPT, transformers"},
            {"label": "Approximation", "value": "tanh (err < 1e-4)"},
        ],
        "report": "GELU is the default activation in transformer models (BERT, GPT, ViT). It is a smooth approximation of ReLU that multiplies x by its Gaussian CDF Phi(x). The tanh approximation is accurate to within 1e-4 and avoids the expensive erf function. GELU's smoothness (no kink at 0) and non-zero gradient for x < 0 improve generalisation compared to ReLU.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 100 178 200 100 L 380 20" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M 20 180 L 200 180 L 380 20" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">x</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">f(x)</text><text x="300" y="30" font-size="9" fill="#06b6d4" font-family="ui-monospace">GELU (smooth)</text><text x="300" y="45" font-size="9" fill="#8b5cf6" font-family="ui-monospace">ReLU (dashed)</text></svg>',
        "summary": [
            "GELU = x * Phi(x) approx 0.5x(1 + tanh(c(x + 0.044715x^3))) — smooth ReLU.",
            "Smooth everywhere (no kink at 0) — better gradient flow than ReLU.",
            "Non-zero gradient for x < 0 — no dead neuron problem.",
            "Default in BERT, GPT, ViT — the activation of choice for transformers.",
        ],
        "sample_data": {
            "headers": ["x", "GELU(x)", "ReLU(x)", "gradient"],
            "rows": [["-3.0", "-0.0036", "0.0", "0.001"], ["-1.0", "-0.1587", "0.0", "0.366"], ["-0.5", "-0.1543", "0.0", "0.532"], ["0.0", "0.0", "0.0", "0.5"], ["0.5", "0.3457", "0.5", "0.532"], ["1.0", "0.8413", "1.0", "0.366"], ["3.0", "2.996", "3.0", "0.999"]],
            "caption": "GELU vs ReLU — note GELU is slightly negative for x<0 (smooth) vs ReLU's hard zero",
        },
    },
    {
        "id": "swiglu",
        "name": "SwiGLU (Swish-Gated Linear Unit)",
        "category": "Activation Function",
        "equation": "f(x, W) = Swish(x) * (xW + b),  where Swish(x) = x * sigmoid(x)",
        "explanation": "SwiGLU is a gated activation used in modern LLMs (LLaMA, PaLM 2). It combines the Swish activation (x * sigma(x)) with a learned linear projection (xW + b). The Swish part acts as a smooth gate that controls how much of the linear projection passes through. SwiGLU outperforms ReLU and GELU in large language models.",
        "derivation": [
            ("Step 1: Swish activation", "Swish(x) = x * sigmoid(x) = x / (1 + exp(-x))", "Swish is a smooth, non-monotonic activation. For x >> 0: Swish approx x (linear). For x << 0: Swish approx 0. Near x = 0: Swish has a slight dip (non-monotonic), which helps with feature selection."),
            ("Step 2: Gated linear unit", "GLU(x, W) = sigmoid(xW) * (xV)", "GLU gates a linear projection xV by a sigmoid gate sigma(xW). SwiGLU replaces the sigmoid gate with Swish: SwiGLU = Swish(xW) * (xV)."),
            ("Step 3: SwiGLU definition", "SwiGLU(x, W, V) = Swish(xW) * (xV)", "Two learned projections: W (gate) and V (value). The Swish gate controls how much of xV passes through. The gate is smooth (unlike GLU's hard sigmoid)."),
            ("Step 4: Gradient", "d(SwGLU)/d(xV) = Swish(xW)", "The gradient w.r.t. the value path is the Swish gate — smooth and non-zero for all x. The gradient w.r.t. the gate path involves Swish' = sigma(x) + x * sigma'(x)."),
            ("Step 5: Performance", "SwiGLU > GELU > ReLU in LLM training (LLaMA, PaLM 2)", "Empirically, SwiGLU gives better perplexity than GELU and ReLU in transformer LLMs. The non-monotonicity of Swish + the learned gate provides richer feature selection. Used in LLaMA-2/3, PaLM 2, and Mistral."),
        ],
        "code": {
            "python": "# f = Swish(xW) * (xV),  Swish(x) = x * sigmoid(x)\n# x -> input  W -> gate weights  V -> value weights\n# sigmoid -> 1/(1+exp(-x))  Swish -> x * sigmoid(x)\nimport numpy as np\ndef swiglu(x, W, V):\n    gate = x @ W\n    value = x @ V\n    swish = gate * (1 / (1 + np.exp(-gate)))\n    return swish * value",
            "rust": "fn swiglu(x: &[f64], w: &[f64], v: &[f64]) -> f64 {\n    let gate = x[0] * w[0];\n    let value = x[0] * v[0];\n    let swish = gate * (1.0 / (1.0 + (-gate).exp()));\n    swish * value\n}",
            "go": "func SwiGLU(x, w, v float64) float64 {\n\tgate := x * w\n\tvalue := x * v\n\tswish := gate * (1 / (1 + math.Exp(-gate)))\n\treturn swish * value\n}",
            "c": "double swiglu(double x, double w, double v) {\n    double gate = x * w;\n    double value = x * v;\n    double swish = gate * (1.0 / (1.0 + exp(-gate)));\n    return swish * value;\n}",
            "elixir": "defmodule SwiGLU do\n  def f(x, w, v) do\n    gate = x * w\n    value = x * v\n    swish = gate * (1 / (1 + :math.exp(-gate)))\n    swish * value\n  end\nend",
            "scala": "def swiglu(x: Double, w: Double, v: Double): Double = {\n  val gate = x * w\n  val value = x * v\n  val swish = gate * (1.0 / (1.0 + math.exp(-gate)))\n  swish * value\n}",
        },
        "stats": [
            {"label": "Type", "value": "Gated activation"},
            {"label": "Gate", "value": "Swish (smooth)"},
            {"label": "Non-monotonic", "value": "Yes (slight dip)"},
            {"label": "Used in", "value": "LLaMA-2/3, PaLM 2"},
            {"label": "vs GELU", "value": "Better perplexity"},
            {"label": "Params", "value": "2x (W + V)"},
        ],
        "report": "SwiGLU is the state-of-the-art activation for LLM feed-forward layers. It combines a Swish gate (x * sigma(x)) with a learned value projection (xV). The Swish gate is smooth and non-monotonic, providing richer feature selection. Empirically outperforms GELU and ReLU in LLaMA-2/3, PaLM 2, and Mistral.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 80 178 120 160 Q 160 120 200 100 Q 280 60 380 20" stroke="#ec4899" stroke-width="2" fill="none"/><path d="M 20 178 Q 100 178 200 100 L 380 20" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">x</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">Swish(x)</text></svg>',
        "summary": [
            "SwiGLU = Swish(xW) * (xV) — smooth gated activation for LLMs.",
            "Swish(x) = x * sigma(x) — non-monotonic, smooth, non-zero gradient for x < 0.",
            "Two learned projections (W = gate, V = value) — 2x params vs ReLU FFN.",
            "Default in LLaMA-2/3, PaLM 2, Mistral — outperforms GELU + ReLU empirically.",
        ],
        "sample_data": {
            "headers": ["x", "Swish(x)", "sigmoid(x)", "gate * value (if W=1, V=2)"],
            "rows": [["-3.0", "-0.1427", "0.0474", "-0.2854"], ["-1.0", "-0.2689", "0.2689", "-0.5378"], ["0.0", "0.0", "0.5", "0.0"], ["0.5", "0.3114", "0.6225", "0.3114"], ["1.0", "0.7311", "0.7311", "1.4621"], ["3.0", "2.8577", "0.9526", "17.146"]],
            "caption": "SwiGLU sample — Swish gate is slightly negative for x in [-3, 0] (non-monotonic dip)",
        },
    },
    # ====================================================================
    # Optimisers
    # ====================================================================
    {
        "id": "sgd",
        "name": "SGD (Stochastic Gradient Descent)",
        "category": "Optimiser",
        "equation": "theta <- theta - eta * grad_L(theta)",
        "explanation": "SGD is the simplest optimiser: update parameters by stepping against the gradient, scaled by the learning rate eta. The 'stochastic' part comes from using mini-batches (not the full dataset) to estimate the gradient, introducing noise that helps escape local minima.",
        "derivation": [
            ("Step 1: Loss gradient", "grad = dL/d(theta)", "Compute the gradient of the loss w.r.t. parameters. In practice, this is done on a mini-batch of data (not the full dataset), introducing stochastic noise."),
            ("Step 2: Update rule", "theta_new = theta - eta * grad", "Step against the gradient by a distance proportional to eta (the learning rate). eta controls the step size; too large = unstable, too small = slow convergence."),
            ("Step 3: Learning rate schedule", "eta_t = eta_0 / (1 + decay * t)", "Decay the learning rate over time to allow large steps early (fast convergence) and small steps later (fine-tuning). Common schedules: step decay, cosine annealing, warmup + constant."),
            ("Step 4: Mini-batch noise", "E[grad_batch] = grad_true, Var[grad_batch] ~ 1/batch_size", "The mini-batch gradient is an unbiased estimator of the true gradient, with variance inversely proportional to batch size. The noise helps escape saddle points and shallow local minima."),
            ("Step 5: Convergence", "For convex L: O(1/sqrt(t)) with eta = 1/sqrt(t)", "SGD converges to the global minimum for convex losses. For non-convex (deep networks), convergence is not guaranteed, but SGD reliably finds good local minima in practice."),
        ],
        "code": {
            "python": "# theta <- theta - eta * grad\n# theta -> params  eta -> learning rate  grad -> dL/dtheta\nimport numpy as np\ndef sgd_step(theta, grad, eta=0.01):\n    return theta - eta * grad",
            "rust": "fn sgd_step(theta: f64, grad: f64, eta: f64) -> f64 {\n    theta - eta * grad\n}",
            "go": "func SGDStep(theta, grad, eta float64) float64 {\n\treturn theta - eta * grad\n}",
            "c": "double sgd_step(double theta, double grad, double eta) {\n    return theta - eta * grad;\n}",
            "elixir": "defmodule SGD do\n  def step(theta, grad, eta), do: theta - eta * grad\nend",
            "scala": "def sgdStep(theta: Double, grad: Double, eta: Double): Double = theta - eta * grad",
        },
        "stats": [
            {"label": "Type", "value": "First-order"},
            {"label": "Momentum", "value": "None"},
            {"label": "Adaptive", "value": "No"},
            {"label": "Memory", "value": "O(1) per param"},
            {"label": "Convergence", "value": "O(1/sqrt(t)) convex"},
            {"label": "Default eta", "value": "0.01"},
        ],
        "report": "SGD is the simplest optimiser: theta <- theta - eta * grad. The learning rate eta controls the step size. Mini-batch noise (variance ~1/batch_size) helps escape saddle points. For convex losses, SGD converges at rate O(1/sqrt(t)) with eta = c/sqrt(t). For deep networks, SGD reliably finds good local minima but converges slowly near flat regions — momentum (SGD+Momentum) or adaptive methods (Adam) are preferred.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 170 L 50 140 L 80 100 L 110 70 L 140 50 L 170 35 L 200 25 L 230 20 L 260 18 L 290 17 L 320 16 L 380 15" stroke="#8b5cf6" stroke-width="2" fill="none"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">iteration t</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text></svg>',
        "summary": [
            "SGD = theta - eta * grad — the simplest optimiser.",
            "Mini-batch noise (var ~1/B) helps escape saddle points.",
            "O(1/sqrt(t)) convergence for convex losses with eta = c/sqrt(t).",
            "For deep networks: reliable but slow near flat regions — use Momentum or Adam.",
        ],
        "sample_data": {
            "headers": ["t", "theta", "grad", "eta", "theta_new"],
            "rows": [["0", "1.00", "-0.50", "0.10", "1.05"], ["1", "1.05", "-0.40", "0.10", "1.09"], ["2", "1.09", "-0.30", "0.10", "1.12"], ["3", "1.12", "-0.20", "0.10", "1.14"], ["4", "1.14", "-0.10", "0.10", "1.15"], ["5", "1.15", "0.00", "0.10", "1.15"]],
            "caption": "SGD trajectory — theta converges to 1.15 as the gradient -> 0",
        },
    },
    {
        "id": "adam",
        "name": "Adam (Adaptive Moment Estimation)",
        "category": "Optimiser",
        "equation": "m_t = beta1*m + (1-beta1)*g;  v_t = beta2*v + (1-beta2)*g^2;  theta <- theta - eta * m_hat / (sqrt(v_hat) + eps)",
        "explanation": "Adam combines momentum (exponential moving average of gradients, like SGD+Momentum) with RMSProp (exponential moving average of squared gradients). The ratio m/sqrt(v) gives an adaptive per-parameter learning rate: parameters with large consistent gradients get smaller steps, parameters with small or rare gradients get larger steps.",
        "derivation": [
            ("Step 1: First moment (momentum)", "m_t = beta1 * m_{t-1} + (1 - beta1) * g_t", "Exponential moving average of gradients. beta1 = 0.9 (default). Smooths noisy gradients — acts as momentum."),
            ("Step 2: Second moment (RMSProp)", "v_t = beta2 * v_{t-1} + (1 - beta2) * g_t^2", "Exponential moving average of squared gradients. beta2 = 0.999 (default). Estimates the per-parameter gradient magnitude."),
            ("Step 3: Bias correction", "m_hat = m_t / (1 - beta1^t);  v_hat = v_t / (1 - beta2^t)", "The EMA is biased toward 0 in early iterations (since m_0 = v_0 = 0). Dividing by (1 - beta^t) corrects this — important for the first few hundred steps."),
            ("Step 4: Update", "theta <- theta - eta * m_hat / (sqrt(v_hat) + eps)", "The step size is eta * (smoothed gradient) / (smoothed gradient magnitude). This gives large steps for rare-but-consistent gradients and small steps for frequent-but-noisy gradients. eps = 1e-8 prevents division by zero."),
            ("Step 5: Default hyperparameters", "eta=1e-3, beta1=0.9, beta2=0.999, eps=1e-8", "Adam's defaults work well for most problems without tuning. This is a key practical advantage over SGD (which requires careful eta tuning + schedule)."),
        ],
        "code": {
            "python": "# m = beta1*m + (1-beta1)*g;  v = beta2*v + (1-beta2)*g^2\n# theta <- theta - eta * m_hat / (sqrt(v_hat) + eps)\n# m -> first moment  v -> second moment  g -> gradient\nimport numpy as np\ndef adam_step(theta, g, m, v, t, eta=1e-3, b1=0.9, b2=0.999, eps=1e-8):\n    m = b1 * m + (1 - b1) * g\n    v = b2 * v + (1 - b2) * g**2\n    m_hat = m / (1 - b1**t)\n    v_hat = v / (1 - b2**t)\n    theta = theta - eta * m_hat / (np.sqrt(v_hat) + eps)\n    return theta, m, v",
            "rust": "fn adam_step(theta: f64, g: f64, m: f64, v: f64, t: f64, eta: f64, b1: f64, b2: f64, eps: f64) -> (f64, f64, f64) {\n    let m = b1 * m + (1.0 - b1) * g;\n    let v = b2 * v + (1.0 - b2) * g * g;\n    let m_hat = m / (1.0 - b1.powf(t));\n    let v_hat = v / (1.0 - b2.powf(t));\n    (theta - eta * m_hat / (v_hat.sqrt() + eps), m, v)\n}",
            "go": "func AdamStep(theta, g, m, v, t, eta, b1, b2, eps float64) (float64, float64, float64) {\n\tm = b1*m + (1-b1)*g\n\tv = b2*v + (1-b2)*g*g\n\tmHat := m / (1 - math.Pow(b1, t))\n\tvHat := v / (1 - math.Pow(b2, t))\n\treturn theta - eta*mHat/(math.Sqrt(vHat)+eps), m, v\n}",
            "c": "void adam_step(double* theta, double g, double* m, double* v, double t, double eta, double b1, double b2, double eps) {\n    *m = b1 * *m + (1 - b1) * g;\n    *v = b2 * *v + (1 - b2) * g * g;\n    double m_hat = *m / (1 - pow(b1, t));\n    double v_hat = *v / (1 - pow(b2, t));\n    *theta -= eta * m_hat / (sqrt(v_hat) + eps);\n}",
            "elixir": "defmodule Adam do\n  def step(theta, g, m, v, t, eta, b1, b2, eps) do\n    m = b1*m + (1-b1)*g\n    v = b2*v + (1-b2)*g*g\n    m_hat = m / (1 - :math.pow(b1, t))\n    v_hat = v / (1 - :math.pow(b2, t))\n    {theta - eta * m_hat / (:math.sqrt(v_hat) + eps), m, v}\n  end\nend",
            "scala": "def adamStep(theta: Double, g: Double, m: Double, v: Double, t: Double, eta: Double = 1e-3, b1: Double = 0.9, b2: Double = 0.999, eps: Double = 1e-8): (Double, Double, Double) = {\n  val m1 = b1 * m + (1 - b1) * g\n  val v1 = b2 * v + (1 - b2) * g * g\n  val mHat = m1 / (1 - math.pow(b1, t))\n  val vHat = v1 / (1 - math.pow(b2, t))\n  (theta - eta * mHat / (math.sqrt(vHat) + eps), m1, v1)\n}",
        },
        "stats": [
            {"label": "Type", "value": "Adaptive + momentum"},
            {"label": "beta1 (momentum)", "value": "0.9"},
            {"label": "beta2 (RMSProp)", "value": "0.999"},
            {"label": "Memory", "value": "O(2) per param (m+v)"},
            {"label": "Default eta", "value": "1e-3"},
            {"label": "Bias correction", "value": "Yes (1-beta^t)"},
        ],
        "report": "Adam combines momentum (first moment, beta1=0.9) with RMSProp (second moment, beta2=0.999). The ratio m/sqrt(v) gives adaptive per-parameter learning rates. Bias correction (1-beta^t) is critical for early iterations. Adam's defaults work well without tuning — a major practical advantage over SGD. The most popular optimiser for deep learning (2015-2024).",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 170 L 50 120 L 80 80 L 110 50 L 140 30 L 170 20 L 200 15 L 380 12" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M 20 170 L 60 150 L 100 120 L 140 80 L 180 50 L 220 30 L 260 20 L 380 15" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">iteration</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text><text x="300" y="20" font-size="9" fill="#06b6d4" font-family="ui-monospace">Adam (fast)</text><text x="300" y="35" font-size="9" fill="#8b5cf6" font-family="ui-monospace">SGD (slow)</text></svg>',
        "summary": [
            "Adam = momentum (beta1=0.9) + RMSProp (beta2=0.999) + bias correction.",
            "Adaptive per-parameter step size: eta * m_hat / sqrt(v_hat).",
            "Defaults (eta=1e-3, beta1=0.9, beta2=0.999) work without tuning.",
            "Most popular optimiser 2015-2024; AdamW (decoupled weight decay) is the successor.",
        ],
        "sample_data": {
            "headers": ["t", "g (grad)", "m (1st)", "v (2nd)", "m_hat/sqrt(v_hat)", "step"],
            "rows": [["1", "0.5", "0.050", "0.001", "1.000", "0.001"], ["10", "0.5", "0.299", "0.006", "1.213", "0.001"], ["50", "0.5", "0.500", "0.024", "1.020", "0.001"], ["100", "0.5", "0.500", "0.025", "1.000", "0.001"], ["200", "0.5", "0.500", "0.025", "1.000", "0.001"]],
            "caption": "Adam convergence — m and v stabilise after ~100 steps; step size -> eta * 1.0",
        },
    },
    {
        "id": "adamw",
        "name": "AdamW (Adam with Decoupled Weight Decay)",
        "category": "Optimiser",
        "equation": "Same as Adam + theta <- theta - eta * wd * theta (decoupled from gradient)",
        "explanation": "AdamW fixes a subtle issue in Adam's L2 regularisation: in standard Adam, weight decay is coupled with the gradient (wd * grad), which interacts with the adaptive learning rate in unintended ways. AdamW decouples weight decay from the gradient update, applying it directly to the parameters. This gives better generalisation, especially for transformers.",
        "derivation": [
            ("Step 1: Adam's L2 issue", "In Adam, L2 reg adds wd*theta to the gradient: g' = g + wd*theta", "L2 regularisation is implemented by adding wd*theta to the gradient before computing the moments. But Adam's adaptive denominator (sqrt(v)) interacts with this: the weight decay gets scaled differently for each parameter."),
            ("Step 2: Coupled vs decoupled", "Coupled: g' = g + wd*theta (Adam).  Decoupled: theta -= eta*wd*theta (AdamW)", "AdamW applies weight decay directly to theta, NOT through the gradient. This makes the weight decay equivalent across all parameters — independent of the adaptive learning rate."),
            ("Step 3: AdamW update", "1. Compute Adam moments (m, v) from g (WITHOUT wd*theta)\n2. theta <- theta - eta*wd*theta (decoupled weight decay)\n3. theta <- theta - eta * m_hat / sqrt(v_hat + eps) (Adam step)", "The weight decay is a simple multiplication (step 2), applied BEFORE the Adam gradient step (step 3). This is mathematically equivalent to L2 for SGD but different for Adam."),
            ("Step 4: Why it matters for transformers", "Transformers need large weight decay (0.1) for generalisation", "In standard Adam, the large weight decay gets distorted by the adaptive learning rate. AdamW's decoupled decay applies uniformly, enabling the large wd=0.1 that transformers need."),
            ("Step 5: Default hyperparameters", "eta=1e-3, beta1=0.9, beta2=0.999, wd=0.01 (vision) / 0.1 (NLP)", "AdamW's weight decay is typically 0.01 for CNNs (ResNet) and 0.1 for transformers (BERT, ViT). The higher wd for transformers prevents overfitting on large datasets."),
        ],
        "code": {
            "python": "# Same as Adam + theta <- theta - eta * wd * theta (decoupled)\n# wd -> weight decay (decoupled from gradient)\nimport numpy as np\ndef adamw_step(theta, g, m, v, t, eta=1e-3, b1=0.9, b2=0.999, eps=1e-8, wd=0.01):\n    m = b1 * m + (1 - b1) * g\n    v = b2 * v + (1 - b2) * g**2\n    m_hat = m / (1 - b1**t)\n    v_hat = v / (1 - b2**t)\n    theta = theta - eta * wd * theta  # decoupled weight decay\n    theta = theta - eta * m_hat / (np.sqrt(v_hat) + eps)  # Adam step\n    return theta, m, v",
            "rust": "fn adamw_step(theta: f64, g: f64, m: f64, v: f64, t: f64, eta: f64, b1: f64, b2: f64, eps: f64, wd: f64) -> (f64, f64, f64) {\n    let m = b1 * m + (1.0 - b1) * g;\n    let v = b2 * v + (1.0 - b2) * g * g;\n    let m_hat = m / (1.0 - b1.powf(t));\n    let v_hat = v / (1.0 - b2.powf(t));\n    let theta = theta - eta * wd * theta;  // decoupled weight decay\n    (theta - eta * m_hat / (v_hat.sqrt() + eps), m, v)\n}",
            "go": "func AdamWStep(theta, g, m, v, t, eta, b1, b2, eps, wd float64) (float64, float64, float64) {\n\tm = b1*m + (1-b1)*g\n\tv = b2*v + (1-b2)*g*g\n\tmHat := m / (1 - math.Pow(b1, t))\n\tvHat := v / (1 - math.Pow(b2, t))\n\ttheta -= eta * wd * theta\n\treturn theta - eta*mHat/(math.Sqrt(vHat)+eps), m, v\n}",
            "c": "void adamw_step(double* theta, double g, double* m, double* v, double t, double eta, double b1, double b2, double eps, double wd) {\n    *m = b1 * *m + (1 - b1) * g;\n    *v = b2 * *v + (1 - b2) * g * g;\n    double m_hat = *m / (1 - pow(b1, t));\n    double v_hat = *v / (1 - pow(b2, t));\n    *theta -= eta * wd * *theta;  /* decoupled weight decay */\n    *theta -= eta * m_hat / (sqrt(v_hat) + eps);\n}",
            "elixir": "defmodule AdamW do\n  def step(theta, g, m, v, t, eta, b1, b2, eps, wd) do\n    m = b1*m + (1-b1)*g\n    v = b2*v + (1-b2)*g*g\n    m_hat = m / (1 - :math.pow(b1, t))\n    v_hat = v / (1 - :math.pow(b2, t))\n    theta = theta - eta * wd * theta\n    {theta - eta * m_hat / (:math.sqrt(v_hat) + eps), m, v}\n  end\nend",
            "scala": "def adamwStep(theta: Double, g: Double, m: Double, v: Double, t: Double, eta: Double = 1e-3, b1: Double = 0.9, b2: Double = 0.999, eps: Double = 1e-8, wd: Double = 0.01): (Double, Double, Double) = {\n  val m1 = b1 * m + (1 - b1) * g\n  val v1 = b2 * v + (1 - b2) * g * g\n  val mHat = m1 / (1 - math.pow(b1, t))\n  val vHat = v1 / (1 - math.pow(b2, t))\n  val theta1 = theta - eta * wd * theta\n  (theta1 - eta * mHat / (math.sqrt(vHat) + eps), m1, v1)\n}",
        },
        "stats": [
            {"label": "Type", "value": "Adam + decoupled wd"},
            {"label": "Weight decay", "value": "Decoupled (uniform)"},
            {"label": "wd (vision)", "value": "0.01"},
            {"label": "wd (NLP/transformer)", "value": "0.1"},
            {"label": "vs Adam", "value": "Better generalisation"},
            {"label": "Used in", "value": "ViT, BERT, GPT"},
        ],
        "report": "AdamW decouples weight decay from the gradient update, applying it directly to parameters (theta -= eta*wd*theta) BEFORE the Adam step. This fixes Adam's L2 regularisation issue where the adaptive learning rate distorts the weight decay. AdamW is the default optimiser for transformers (ViT, BERT, GPT) where large weight decay (0.1) is needed for generalisation.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 170 L 60 100 L 100 60 L 140 35 L 200 20 L 380 15" stroke="#10b981" stroke-width="2" fill="none"/><path d="M 20 170 L 60 120 L 100 80 L 140 50 L 200 30 L 380 25" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">iteration</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">val loss</text><text x="250" y="20" font-size="9" fill="#10b981" font-family="ui-monospace">AdamW (lower val loss)</text><text x="250" y="35" font-size="9" fill="#8b5cf6" font-family="ui-monospace">Adam+L2 (overfits)</text></svg>',
        "summary": [
            "AdamW = Adam + decoupled weight decay (theta -= eta*wd*theta, not g += wd*theta).",
            "Decoupled wd is uniform across parameters — independent of adaptive learning rate.",
            "Default wd: 0.01 (vision/CNN), 0.1 (NLP/transformers).",
            "Successor to Adam; default for ViT, BERT, GPT, LLaMA.",
        ],
        "sample_data": {
            "headers": ["t", "theta", "theta after wd", "Adam step", "theta_new"],
            "rows": [["1", "1.000", "0.9999", "-0.001", "0.9989"], ["50", "0.950", "0.9490", "-0.005", "0.9440"], ["100", "0.900", "0.8990", "-0.003", "0.8960"], ["200", "0.850", "0.8491", "-0.001", "0.8481"], ["500", "0.800", "0.7992", "0.000", "0.7992"]],
            "caption": "AdamW trajectory — weight decay shrinks theta by eta*wd each step; Adam step -> 0 as gradient vanishes",
        },
    },
    # ====================================================================
    # Regularisation
    # ====================================================================
    {
        "id": "dropout",
        "name": "Dropout",
        "category": "Regularisation",
        "equation": "y = x * mask,  where mask[i] ~ Bernoulli(1-p) / (1-p)",
        "explanation": "Dropout randomly sets a fraction p of activations to zero during training, forcing the network to learn redundant representations. At inference, all activations are used (scaled by 1/(1-p) during training to compensate). Dropout prevents co-adaptation: no single neuron can rely on any other specific neuron being active.",
        "derivation": [
            ("Step 1: Mask generation", "mask[i] ~ Bernoulli(1 - p)", "For each neuron, draw a random binary mask: 1 with probability (1-p), 0 with probability p. p is the dropout rate (typically 0.1-0.5)."),
            ("Step 2: Apply mask", "y = x * mask", "Element-wise multiply the activations by the mask. p fraction of neurons are 'dropped' (output 0). The surviving neurons must learn to function without the dropped ones."),
            ("Step 3: Inverted dropout (scaling)", "y = x * mask / (1 - p)", "Divide by (1-p) during training so that the expected output E[y] = x. This 'inverted dropout' means no scaling is needed at inference time — just use y = x (all neurons active)."),
            ("Step 4: Preventing co-adaptation", "Each neuron must work with random subsets of others", "Since any neuron can be dropped, no two neurons can co-adapt (rely on each other). The network learns redundant, robust features — like training an ensemble of sub-networks in one pass."),
            ("Step 5: Inference", "At test time: y = x (no dropout, no scaling needed)", "Thanks to inverted dropout (step 3), inference is just the identity — all neurons active, no scaling. The network behaves as an ensemble of the 2^N sub-networks sampled during training."),
        ],
        "code": {
            "python": "# y = x * mask / (1-p),  mask ~ Bernoulli(1-p)\n# x -> activations  p -> dropout rate  mask -> random binary\nimport numpy as np\ndef dropout(x, p=0.5, training=True):\n    if not training: return x\n    mask = (np.random.rand(*x.shape) > p) / (1 - p)\n    return x * mask",
            "rust": "fn dropout(x: &[f64], p: f64) -> Vec<f64> {\n    let scale = 1.0 / (1.0 - p);\n    x.iter().map(|&v| if rand::random::<f64>() > p { v * scale } else { 0.0 }).collect()\n}",
            "go": "func Dropout(x []float64, p float64) []float64 {\n\tscale := 1 / (1 - p)\n\tfor i := range x { if rand.Float64() < p { x[i] = 0 } else { x[i] *= scale } }\n\treturn x\n}",
            "c": "void dropout(double* x, int n, double p) {\n    double scale = 1.0 / (1.0 - p);\n    for (int i = 0; i < n; i++)\n        x[i] = ((double)rand()/RAND_MAX > p) ? x[i] * scale : 0.0;\n}",
            "elixir": "defmodule Dropout do\n  def f(x, p) do\n    scale = 1 / (1 - p)\n    Enum.map(x, fn v -> if :rand.uniform() > p, do: v * scale, else: 0.0 end)\n  end\nend",
            "scala": "def dropout(x: Array[Double], p: Double): Array[Double] = {\n  val scale = 1.0 / (1 - p)\n  x.map(v => if (math.random > p) v * scale else 0.0)\n}",
        },
        "stats": [
            {"label": "Type", "value": "Stochastic regulariser"},
            {"label": "Default p", "value": "0.1 (transformers), 0.5 (CNNs)"},
            {"label": "Inference", "value": "Identity (no scaling)"},
            {"label": "Ensemble", "value": "2^N sub-networks"},
            {"label": "Memory", "value": "O(1) (mask only)"},
            {"label": "Prevents", "value": "Co-adaptation"},
        ],
        "report": "Dropout randomly zeros p fraction of activations during training, preventing neuron co-adaptation. Inverted dropout (scaling by 1/(1-p)) means no scaling is needed at inference. The network behaves as an ensemble of 2^N sub-networks. Default p=0.1 for transformers, 0.5 for CNNs. Dropout is the most widely used regulariser in deep learning (2012-present).",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><g><circle cx=\"50\" cy=\"50\" r=\"6\" fill=\"#8b5cf6\"/><circle cx=\"80\" cy=\"50\" r=\"6\" fill=\"rgba(148,163,184,0.2)\"/><circle cx=\"110\" cy=\"50\" r=\"6\" fill=\"#8b5cf6\"/><circle cx=\"140\" cy=\"50\" r=\"6\" fill=\"#8b5cf6\"/><circle cx=\"170\" cy=\"50\" r=\"6\" fill=\"rgba(148,163,184,0.2)\"/><circle cx=\"200\" cy=\"50\" r=\"6\" fill=\"#8b5cf6\"/><text x=\"100\" y=\"30\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">p=0.4: 2 of 5 dropped</text></g><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">neuron index</text></svg>',
        "summary": [
            "Dropout = x * mask / (1-p), mask ~ Bernoulli(1-p) — random zeroing during training.",
            "Inverted dropout (1/(1-p) scaling) means no scaling at inference.",
            "Prevents co-adaptation: neurons can't rely on specific others being active.",
            "Equivalent to training 2^N sub-networks — powerful ensemble effect.",
        ],
        "sample_data": {
            "headers": ["neuron", "x (input)", "mask (p=0.4)", "y = x*mask/(1-p)"],
            "rows": [["1", "0.8", "1", "1.33"], ["2", "0.5", "0 (dropped)", "0.0"], ["3", "-0.3", "1", "-0.50"], ["4", "0.6", "1", "1.00"], ["5", "0.2", "0 (dropped)", "0.0"]],
            "caption": "Dropout sample (p=0.4) — 2 of 5 neurons dropped; survivors scaled by 1/(1-0.4)=1.67",
        },
    },
    {
        "id": "l1-l2-regularisation",
        "name": "L1/L2 Regularisation (Weight Decay)",
        "category": "Regularisation",
        "equation": "L_reg = L_data + lambda1 * ||w||_1 + lambda2 * ||w||_2^2",
        "explanation": "L1 and L2 regularisation add a penalty term to the loss function: L1 (sum of |w|) encourages sparsity (many weights -> 0), L2 (sum of w^2) encourages small weights. The regularisation parameter lambda controls the strength: larger lambda = more regularisation (simpler model).",
        "derivation": [
            ("Step 1: L2 (Ridge) penalty", "L2 = lambda * sum(w^2) = lambda * ||w||_2^2", "L2 adds lambda * ||w||^2 to the loss. The gradient is 2*lambda*w — proportional to the weight. This shrinks all weights toward 0 smoothly. No weight becomes exactly 0."),
            ("Step 2: L1 (Lasso) penalty", "L1 = lambda * sum(|w|) = lambda * ||w||_1", "L1 adds lambda * sum(|w|) to the loss. The gradient is lambda * sign(w) — constant magnitude. This can drive weights to exactly 0 (sparsity), enabling feature selection."),
            ("Step 3: L1 sparsity", "L1 gradient = lambda * sign(w) — constant magnitude", "Because the L1 gradient is constant (lambda * sign(w)), weights near 0 get pushed to exactly 0. This is unlike L2 whose gradient (2*lambda*w) -> 0 as w -> 0, leaving small but non-zero weights."),
            ("Step 4: Elastic net (L1 + L2)", "L_reg = L + lambda1 * ||w||_1 + lambda2 * ||w||_2^2", "Elastic net combines L1 (sparsity) + L2 (smoothness). Useful when features are correlated — L1 alone picks one, L2 keeps all small; elastic net keeps groups."),
            ("Step 5: Weight decay vs L2", "Weight decay: theta <- theta - eta * (grad + lambda * theta) = theta * (1 - eta*lambda) - eta*grad", "Weight decay is the gradient-descent form of L2: the weight is shrunk by a factor (1 - eta*lambda) at each step. For SGD, this is equivalent to L2. For Adam, see AdamW (decoupled weight decay)."),
        ],
        "code": {
            "python": "# L_reg = L + lambda1*||w||_1 + lambda2*||w||_2^2\n# w -> weights  lambda1 -> L1 strength  lambda2 -> L2 strength\nimport numpy as np\ndef l1_l2_reg(w, lambda1=0.0, lambda2=0.01):\n    l1 = lambda1 * np.sum(np.abs(w))\n    l2 = lambda2 * np.sum(w ** 2)\n    return l1 + l2\ndef l1_l2_grad(w, lambda1=0.0, lambda2=0.01):\n    return lambda1 * np.sign(w) + 2 * lambda2 * w",
            "rust": "fn l1_l2_reg(w: &[f64], l1: f64, l2: f64) -> f64 {\n    l1 * w.iter().map(|x| x.abs()).sum::<f64>() + l2 * w.iter().map(|x| x * x).sum::<f64>()\n}",
            "go": "func L1L2Reg(w []float64, l1, l2 float64) float64 {\n\tvar s1, s2 float64\n\tfor _, v := range w { s1 += math.Abs(v); s2 += v * v }\n\treturn l1*s1 + l2*s2\n}",
            "c": "double l1_l2_reg(const double* w, int n, double l1, double l2) {\n    double s1 = 0, s2 = 0;\n    for (int i = 0; i < n; i++) { s1 += fabs(w[i]); s2 += w[i]*w[i]; }\n    return l1 * s1 + l2 * s2;\n}",
            "elixir": "defmodule Reg do\n  def l1_l2(w, l1, l2) do\n    l1 * (Enum.map(w, &abs/1) |> Enum.sum) + l2 * (Enum.map(w, &(&1*&1)) |> Enum.sum)\n  end\nend",
            "scala": "def l1L2Reg(w: Array[Double], l1: Double, l2: Double): Double = {\n  l1 * w.map(math.abs).sum + l2 * w.map(x => x*x).sum\n}",
        },
        "stats": [
            {"label": "Type", "value": "Weight penalty"},
            {"label": "L1 (Lasso)", "value": "Sparse (w->0)"},
            {"label": "L2 (Ridge)", "value": "Smooth (small w)"},
            {"label": "Elastic net", "value": "L1 + L2"},
            {"label": "Default lambda", "value": "1e-4 to 1e-2"},
            {"label": "Effect", "value": "Reduces overfitting"},
        ],
        "report": "L1 (Lasso) adds lambda*sum(|w|) to the loss, driving some weights to exactly 0 (feature selection). L2 (Ridge) adds lambda*sum(w^2), shrinking all weights smoothly. Elastic net combines both. Weight decay (theta -= eta*lambda*theta) is the gradient form of L2 for SGD. For Adam, use AdamW (decoupled weight decay). Default lambda: 1e-4 (CNNs) to 0.1 (transformers).",
        "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><path d=\"M 20 170 L 200 100 L 380 30\" stroke=\"#f59e0b\" stroke-width=\"2\" fill=\"none\"/><path d=\"M 20 170 Q 200 130 380 50\" stroke=\"#8b5cf6\" stroke-width=\"1.5\" fill=\"none\" stroke-dasharray=\"3 3\"/><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">weight value w</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">penalty</text><text x=\"300\" y=\"40\" font-size=\"9\" fill=\"#f59e0b\" font-family=\"ui-monospace\">L1: |w| (V-shape)</text><text x=\"300\" y=\"55\" font-size=\"9\" fill=\"#8b5cf6\" font-family=\"ui-monospace\">L2: w^2 (parabola)</text></svg>',
        "summary": [
            "L1 = lambda*sum(|w|) — drives weights to exactly 0 (sparsity, feature selection).",
            "L2 = lambda*sum(w^2) — shrinks all weights smoothly (no exact zeros).",
            "Elastic net = L1 + L2 — combines sparsity + smoothness.",
            "Weight decay (theta -= eta*lambda*theta) is the gradient form of L2 for SGD.",
        ],
        "sample_data": {
            "headers": ["w", "L1 = lambda*|w|", "L2 = lambda*w^2", "L1 grad = lambda*sign(w)", "L2 grad = 2*lambda*w"],
            "rows": [["-1.0", "0.01", "0.0001", "-0.01", "-0.02"], ["-0.1", "0.001", "0.0001", "-0.01", "-0.002"], ["0.0", "0.0", "0.0", "0 (kink)", "0.0"], ["0.1", "0.001", "0.0001", "0.01", "0.002"], ["1.0", "0.01", "0.0001", "0.01", "0.02"]],
            "caption": "L1 vs L2 (lambda=0.01) — L1 gradient is constant (drives w to 0); L2 gradient -> 0 as w -> 0",
        },
    },
    {
        "id": "batchnorm",
        "name": "Batch Normalisation",
        "category": "Regularisation",
        "equation": "y = gamma * (x - mu_B) / sqrt(sigma_B^2 + eps) + beta",
        "explanation": "BatchNorm normalises each layer's activations to have zero mean and unit variance (per mini-batch), then applies a learned scale (gamma) and shift (beta). This stabilises training, allows higher learning rates, and acts as mild regularisation (batch noise). BatchNorm was a key enabler of training very deep networks (ResNet).",
        "derivation": [
            ("Step 1: Batch statistics", "mu_B = (1/m) * sum(x_i);  sigma_B^2 = (1/m) * sum((x_i - mu_B)^2)", "Compute the mean and variance of the activations over the mini-batch of size m. These statistics are different for each batch — introducing stochastic noise."),
            ("Step 2: Normalise", "x_hat = (x - mu_B) / sqrt(sigma_B^2 + eps)", "Subtract the batch mean and divide by the batch std. eps = 1e-5 prevents division by zero. The result has zero mean and unit variance (per batch)."),
            ("Step 3: Learnable scale + shift", "y = gamma * x_hat + beta", "gamma and beta are learned parameters that allow the network to undo the normalisation if it's not helpful. Without gamma/beta, BatchNorm would force every layer to have unit variance — too restrictive."),
            ("Step 4: Running statistics (inference)", "mu_running = alpha * mu_running + (1-alpha) * mu_B", "During training, keep a running average of mu_B and sigma_B. At inference, use the running averages instead of batch statistics (since inference may have batch size 1)."),
            ("Step 5: Why it works", "Reduces internal covariate shift + enables higher lr + mild regularisation", "BatchNorm stabilises the distribution of activations across layers, reducing 'internal covariate shift'. This allows 10x higher learning rates and faster convergence. The batch-level noise also acts as mild regularisation (reducing the need for dropout)."),
        ],
        "code": {
            "python": "# y = gamma * (x - mu_B) / sqrt(sigma_B^2 + eps) + beta\n# x -> activations  mu_B -> batch mean  sigma_B -> batch std\n# gamma -> scale (learned)  beta -> shift (learned)\nimport numpy as np\ndef batchnorm(x, gamma=1.0, beta=0.0, eps=1e-5):\n    mu = np.mean(x, axis=0)\n    var = np.var(x, axis=0)\n    x_hat = (x - mu) / np.sqrt(var + eps)\n    return gamma * x_hat + beta",
            "rust": "fn batchnorm(x: &[f64], gamma: f64, beta: f64, eps: f64) -> Vec<f64> {\n    let n = x.len() as f64;\n    let mu: f64 = x.iter().sum::<f64>() / n;\n    let var: f64 = x.iter().map(|v| (v - mu).powi(2)).sum::<f64>() / n;\n    x.iter().map(|v| gamma * (v - mu) / (var + eps).sqrt() + beta).collect()\n}",
            "go": "func BatchNorm(x []float64, gamma, beta, eps float64) []float64 {\n\tn := float64(len(x))\n\tvar mu, v float64\n\tfor _, v := range x { mu += v }\n\tmu /= n\n\tfor _, v := range x { v += (v - mu) * (v - mu) }\n\tv /= n\n\tfor i := range x { x[i] = gamma*(x[i]-mu)/math.Sqrt(v+eps) + beta }\n\treturn x\n}",
            "c": "void batchnorm(double* x, int n, double gamma, double beta, double eps) {\n    double mu = 0; for (int i = 0; i < n; i++) mu += x[i]; mu /= n;\n    double var = 0; for (int i = 0; i < n; i++) var += (x[i]-mu)*(x[i]-mu); var /= n;\n    for (int i = 0; i < n; i++) x[i] = gamma * (x[i] - mu) / sqrt(var + eps) + beta;\n}",
            "elixir": "defmodule BatchNorm do\n  def f(x, gamma, beta, eps) do\n    n = length(x)\n    mu = Enum.sum(x) / n\n    var = Enum.map(x, fn v -> (v - mu) * (v - mu) end) |> Enum.sum() / n\n    Enum.map(x, fn v -> gamma * (v - mu) / :math.sqrt(var + eps) + beta end)\n  end\nend",
            "scala": "def batchnorm(x: Array[Double], gamma: Double = 1.0, beta: Double = 0.0, eps: Double = 1e-5): Array[Double] = {\n  val n = x.length.toDouble\n  val mu = x.sum / n\n  val v = x.map(xi => (xi - mu) * (xi - mu)).sum / n\n  x.map(xi => gamma * (xi - mu) / math.sqrt(v + eps) + beta)\n}",
        },
        "stats": [
            {"label": "Type", "value": "Normalisation"},
            {"label": "Learned params", "value": "gamma + beta"},
            {"label": "Inference", "value": "Running avg stats"},
            {"label": "Effect", "value": "10x higher lr"},
            {"label": "Regularisation", "value": "Mild (batch noise)"},
            {"label": "Used in", "value": "ResNet, CNNs"},
        ],
        "report": "BatchNorm normalises activations per mini-batch to zero mean + unit variance, then applies learned gamma (scale) + beta (shift). This stabilises training (reduces internal covariate shift), allows 10x higher learning rates, and provides mild regularisation via batch noise. At inference, running averages replace batch statistics. Key enabler of ResNet (2015) — enabled training 100+ layer networks.",
        "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><path d=\"M 20 100 Q 200 100 380 100\" stroke=\"#8b5cf6\" stroke-width=\"1\" fill=\"none\" stroke-dasharray=\"3 3\"/><path d=\"M 20 100 L 50 50 L 80 150 L 110 60 L 140 140 L 170 70 L 200 130 L 230 80 L 260 120 L 290 90 L 320 110 L 380 100\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/><path d=\"M 20 100 L 50 90 L 80 110 L 110 95 L 140 105 L 170 92 L 200 108 L 230 96 L 260 104 L 290 98 L 320 102 L 380 100\" stroke=\"#06b6d4\" stroke-width=\"2\" fill=\"none\"/><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">sample</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">activation</text><text x=\"300\" y=\"50\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">before (noisy)</text><text x=\"300\" y=\"110\" font-size=\"9\" fill=\"#06b6d4\" font-family=\"ui-monospace\">after (stable)</text></svg>',
        "summary": [
            "BatchNorm = gamma * (x - mu_B) / sqrt(sigma_B^2 + eps) + beta — normalise per batch.",
            "Learned gamma (scale) + beta (shift) allow the network to undo normalisation if unhelpful.",
            "Running averages for mu_B and sigma_B used at inference (batch size may be 1).",
            "Key enabler of ResNet (2015) — allows 10x higher lr + 100+ layer networks.",
        ],
        "sample_data": {
            "headers": ["x", "(x - mu)", "x_hat = (x-mu)/std", "y = gamma*x_hat + beta"],
            "rows": [["-1.0", "-1.5", "-1.34", "-0.34"], ["0.0", "-0.5", "-0.45", "0.55"], ["0.5", "0.0", "0.0", "1.0"], ["1.0", "0.5", "0.45", "1.45"], ["2.0", "1.5", "1.34", "2.34"]],
            "caption": "BatchNorm sample (mu=0.5, std=1.12, gamma=1.0, beta=1.0) — output has mean=1.0, std=1.0",
        },
    },
'''

# GTS configs for the 9 new entries
NEW_GTS_CONFIGS = """        'relu': { xCol: 0, yCol: 1, xLabel: 'x', yLabel: 'f(x)=max(0,x)',
          curveFn: function(x) { return Math.max(0, x); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[0]) >= 0 && i > 0 && parseFloat(rows[i-1][0]) < 0 ? {annotation: 'kink at x=0: f transitions from 0 to x'} : null; } },
        'gelu': { xCol: 0, yCol: 1, xLabel: 'x', yLabel: 'GELU(x)',
          curveFn: function(x) { var c = Math.sqrt(2/Math.PI); return 0.5*x*(1+Math.tanh(c*(x+0.044715*x*x*x))); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[0]) < 0 && parseFloat(row[1]) < 0 ? {annotation: 'GELU is slightly negative here (smooth)'} : null; } },
        'swiglu': { xCol: 0, yCol: 1, xLabel: 'x', yLabel: 'Swish(x)',
          curveFn: function(x) { return x * (1 / (1 + Math.exp(-x))); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[1]) < 0 ? {annotation: 'Swish is non-monotonic (negative dip)'} : null; } },
        'sgd': { xCol: 0, yCol: 1, xLabel: 't', yLabel: 'theta',
          curveFn: null,
          inflectionFn: function(row, i, rows) { return parseFloat(row[2]) === 0 ? {annotation: 'gradient=0: converged'} : null; } },
        'adam': { xCol: 0, yCol: 3, xLabel: 't', yLabel: 'm (1st moment)',
          curveFn: function(t) { return 0.5 * (1 - Math.pow(0.9, t)); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[0]) >= 50 ? {annotation: 'm converged to 0.5 (true gradient)'} : null; } },
        'adamw': { xCol: 0, yCol: 1, xLabel: 't', yLabel: 'theta',
          curveFn: null,
          inflectionFn: function(row, i, rows) { return parseFloat(row[2]) < 0 ? {annotation: 'weight decay shrinking theta'} : null; } },
        'dropout': { xCol: 0, yCol: 3, xLabel: 'neuron', yLabel: 'y = x*mask/(1-p)',
          curveFn: null,
          inflectionFn: function(row, i, rows) { return parseFloat(row[3]) === 0 ? {annotation: 'dropped (mask=0)'} : null; } },
        'l1-l2-regularisation': { xCol: 0, yCol: 1, yLabel: 'L1 = lambda*|w|', xLabel: 'w',
          curveFn: function(x) { return 0.01 * Math.abs(x); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[0]) === 0 ? {annotation: 'L1 kink at w=0 (drives to exactly 0)'} : null; } },
        'batchnorm': { xCol: 0, yCol: 3, xLabel: 'x', yLabel: 'y = gamma*x_hat + beta',
          curveFn: null,
          inflectionFn: function(row, i, rows) { return Math.abs(parseFloat(row[0]) - 0.5) < 0.01 ? {annotation: 'x = mu: y = beta (mean output)'} : null; } },
"""

# Math annotations for the 9 new entries
NEW_ANNOTATIONS = {
    "relu": "# f(x) = max(0, x)\\n# x -> input array  max(0,.) -> np.maximum(0, .)\\n# gradient: 1 if x>0, 0 if x<0\\n",
    "gelu": "# f(x) = x * Phi(x) approx 0.5x(1 + tanh(c*(x + a*x^3)))\\n# x -> input  Phi -> Gaussian CDF  tanh -> np.tanh()\\n# c = sqrt(2/pi) = 0.7978  a = 0.044715\\n",
    "swiglu": "# f = Swish(xW) * (xV),  Swish(x) = x * sigmoid(x)\\n# x -> input  W -> gate weights  V -> value weights\\n# sigmoid -> 1/(1+exp(-x))  Swish -> x * sigmoid(x)\\n",
    "sgd": "# theta <- theta - eta * grad\\n# theta -> params  eta -> learning rate  grad -> dL/dtheta\\n# step = -eta * grad (proportional to gradient)\\n",
    "adam": "# m = beta1*m + (1-beta1)*g;  v = beta2*v + (1-beta2)*g^2\\n# theta <- theta - eta * m_hat / (sqrt(v_hat) + eps)\\n# m -> 1st moment  v -> 2nd moment  g -> gradient\\n",
    "adamw": "# Same as Adam + theta <- theta - eta * wd * theta (decoupled)\\n# wd -> weight decay (decoupled from gradient)\\n# 1. weight decay  2. Adam step (on original grad, not grad+wd*theta)\\n",
    "dropout": "# y = x * mask / (1-p),  mask ~ Bernoulli(1-p)\\n# x -> activations  p -> dropout rate  mask -> random binary\\n# 1/(1-p) scaling = inverted dropout (no scaling at inference)\\n",
    "l1-l2-regularisation": "# L_reg = L + lambda1*||w||_1 + lambda2*||w||_2^2\\n# w -> weights  lambda1 -> L1 strength  lambda2 -> L2 strength\\n# L1 grad = lambda*sign(w)  L2 grad = 2*lambda*w\\n",
    "batchnorm": "# y = gamma * (x - mu_B) / sqrt(sigma_B^2 + eps) + beta\\n# x -> activations  mu_B -> batch mean  sigma_B -> batch std\\n# gamma -> scale (learned)  beta -> shift (learned)\\n",
}

FUNC_MARKERS = {
    "relu": "def relu(",
    "gelu": "def gelu(",
    "swiglu": "def swiglu(",
    "sgd": "def sgd_step(",
    "adam": "def adam_step(",
    "adamw": "def adamw_step(",
    "dropout": "def dropout(",
    "l1-l2-regularisation": "def l1_l2_reg(",
    "batchnorm": "def batchnorm(",
}

# ---- Apply patches ----
with open(GEN_PATH, "r", encoding="utf-8") as f:
    src = f.read()

# 1. Insert new entries before the closing ] of LOSS_FUNCTIONS
if "'relu'" not in src and '"relu"' not in src:
    # Find the last entry's closing (the last } before the closing ])
    # The list ends with:\n    },\n]\n
    idx = src.rfind("    },\n]\n")
    if idx < 0:
        idx = src.rfind("    },\n]")  # try without trailing newline
    if idx < 0:
        # Find ] that closes LOSS_FUNCTIONS
        # It's the first ] after "LOSS_FUNCTIONS = ["
        list_start = src.find("LOSS_FUNCTIONS = [")
        if list_start >= 0:
            # Find the matching ]
            idx = src.find("\n]", list_start)
            if idx >= 0:
                idx = src.rfind("\n    },", list_start, idx) + len("\n    },")
    if idx >= 0:
        src = src[:idx] + "\n" + NEW_ENTRIES + src[idx:]
        print("  [1] inserted 9 new loss function entries")
    else:
        print("  [!] could not find insertion point for new entries")

# 2. Add GTS configs for the 9 new entries
if "relu'" not in src.split("GTS_CONFIGS")[1] if "GTS_CONFIGS" in src else False:
    # Insert before the closing }; of GTS_CONFIGS
    gts_end = src.find("      };\n\n      document.querySelectorAll('.demo-card')")
    if gts_end >= 0:
        src = src[:gts_end] + "        " + NEW_GTS_CONFIGS + "\n" + src[gts_end:]
        print("  [2] added GTS configs for 9 new entries")

# 3. Add math annotations
n_annotated = 0
for lf_id, ann in NEW_ANNOTATIONS.items():
    marker = FUNC_MARKERS.get(lf_id)
    if not marker:
        continue
    idx = src.find(marker)
    if idx < 0:
        continue
    py_start = src.rfind('"python": "', 0, idx)
    if py_start < 0:
        continue
    insert_pos = py_start + len('"python": "')
    if src[insert_pos:insert_pos+4] == "# f(" or src[insert_pos:insert_pos+4] == "# L " or src[insert_pos:insert_pos+5] == "# y =" or src[insert_pos:insert_pos+5] == "# the" or src[insert_pos:insert_pos+5] == "# m =" or src[insert_pos:insert_pos+5] == "# Sam" or src[insert_pos:insert_pos+2] == "# ":
        continue  # already annotated
    src = src[:insert_pos] + ann + src[insert_pos:]
    n_annotated += 1
    print(f"  [3] annotated: {lf_id}")

with open(GEN_PATH, "w", encoding="utf-8") as f:
    f.write(src)
print(f"\nDone. 9 new entries + GTS configs + {n_annotated} math annotations applied.")

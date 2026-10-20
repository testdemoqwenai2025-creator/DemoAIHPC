#!/usr/bin/env python3
"""
gen-ml-page.py — Phase 30 Machine Learning page generator.

Emits docs/science-ml.html with 9 loss function demos, each as a
full ClickForDemo (Math→Code 5-step derivation + 6-language polyglot
+ Observe with Stats/Reports/Graphs/Summary + ETL panel + animated-
derivation canvas + data table).

Inspired by Greg Coquillo's LinkedIn post "9 Machine Learning Loss
Functions Explained!" — rendered in the AIHPC Advanced style with
all the bells and whistles.

The 9 loss functions:
  1. Mean Squared Error (MSE)        — regression
  2. Mean Absolute Error (MAE)       — regression
  3. Binary Cross-Entropy            — binary classification
  4. Categorical Cross-Entropy       — multi-class
  5. Hinge Loss                       — SVM / max-margin
  6. Log-Cosh Loss                    — regression (smooth)
  7. Huber Loss                       — robust regression
  8. KL Divergence                    — probability distributions
  9. Cosine Similarity Loss           — embeddings

Run:
    python3 scripts/gen-ml-page.py
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
OUT_PATH = os.path.join(DOCS, "science-ml.html")

# ============================================================================
# Manifest of 9 loss functions
# ============================================================================

LOSS_FUNCTIONS = [
    {
        "id": "mse",
        "name": "Mean Squared Error (MSE)",
        "category": "Regression",
        "equation": "L = (1/n) Σ_{i=1}^{n} (y_i − ŷ_i)²",
        "explanation": "MSE is the average squared difference between predicted and actual values. It penalises large errors quadratically — a 2× error gives 4× the loss. The gradient is proportional to the error magnitude, making optimisation well-behaved for convex problems.",
        "derivation": [
            ("Step 1: Define the error", "e_i = y_i − ŷ_i", "For each sample i, the error is the difference between the true value y_i and the predicted value ŷ_i. MSE aggregates these errors across all n samples."),
            ("Step 2: Square the error", "e_i² = (y_i − ŷ_i)²", "Squaring removes the sign (positive and negative errors both contribute positively) and penalises large errors quadratically. A 2× error gives 4× the loss."),
            ("Step 3: Average over all samples", "L = (1/n) Σ e_i²", "Sum the squared errors and divide by n (the number of samples). The 1/n normalises for dataset size — a larger dataset doesn't inherently have larger loss."),
            ("Step 4: Gradient w.r.t. predictions", "∂L/∂ŷ_i = −2(y_i − ŷ_i) / n = 2(ŷ_i − y_i) / n", "The gradient is proportional to the error — larger errors produce larger gradients. This makes SGD converge quickly toward the correct prediction. The factor 2 comes from the chain rule on the square."),
            ("Step 5: Update rule", "ŷ ← ŷ − η · ∂L/∂ŷ", "Gradient descent: update the prediction by stepping against the gradient, scaled by the learning rate η. For linear regression, this converges to the OLS solution."),
        ],
        "code": {
            "python": "# L = (1/n) Sum (y_i - y_hat_i)^2\n# y_i -> y_true[i]  y_hat_i -> y_pred[i]  n -> len(y_true)\n# Sum -> .sum()  ^2 -> ** 2  (1/n) -> np.mean()\nimport numpy as np\ndef mse(y_true, y_pred):\n    return np.mean((y_true - y_pred) ** 2)\ndef mse_grad(y_true, y_pred):\n    return 2 * (y_pred - y_true) / len(y_true)",
            "rust": "fn mse(y_true: &[f64], y_pred: &[f64]) -> f64 {\n    let n = y_true.len() as f64;\n    y_true.iter().zip(y_pred.iter())\n        .map(|(t, p)| (t - p).powi(2)).sum::<f64>() / n\n}",
            "go": "func MSE(yTrue, yPred []float64) float64 {\n\tn := float64(len(yTrue))\n\tvar sum float64\n\tfor i := range yTrue { sum += (yTrue[i] - yPred[i]) * (yTrue[i] - yPred[i]) }\n\treturn sum / n\n}",
            "c": "double mse(const double* y_true, const double* y_pred, int n) {\n    double sum = 0;\n    for (int i = 0; i < n; i++) sum += (y_true[i] - y_pred[i]) * (y_true[i] - y_pred[i]);\n    return sum / n;\n}",
            "elixir": "defmodule MSE do\n  def loss(y_true, y_pred) do\n    n = length(y_true)\n    Enum.zip(y_true, y_pred) |> Enum.map(fn {t, p} -> :math.pow(t - p, 2) end) |> Enum.sum() / n\n  end\nend",
            "scala": "def mse(yTrue: Array[Double], yPred: Array[Double]): Double = {\n  val n = yTrue.length\n  yTrue.indices.map(i => math.pow(yTrue(i) - yPred(i), 2)).sum / n\n}",
        },
        "stats": [
            {"label": "Type", "value": "Regression"},
            {"label": "Penalty", "value": "Quadratic"},
            {"label": "Outlier sensitivity", "value": "High"},
            {"label": "Gradient", "value": "∝ error"},
            {"label": "Convex", "value": "Yes"},
            {"label": "Differentiable", "value": "Yes (everywhere)"},
        ],
        "report": "MSE is the default loss for regression. It penalises large errors quadratically — a single outlier with 10× the error contributes 100× the loss. The gradient is proportional to the error (factor 2 from chain rule), making SGD converge well for convex problems. MSE is the maximum-likelihood estimator when residuals are Gaussian.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 100 170 200 100 T 380 20" stroke="#8b5cf6" stroke-width="2" fill="none"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">error (y−ŷ)</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text><text x="300" y="35" font-size="9" fill="#8b5cf6" font-family="ui-monospace">e² (parabola)</text></svg>',
        "summary": [
            "MSE = (1/n) Σ (y−ŷ)² — the quadratic penalty makes large errors dominate.",
            "Gradient ∝ error (factor 2 from chain rule) — fast convergence for convex problems.",
            "Maximum-likelihood estimator when residuals are Gaussian.",
            "Sensitive to outliers: a 10× outlier gives 100× the loss. Use Huber loss for robustness.",
        ],
        "sample_data": {
            "headers": ["Sample", "y_true", "y_pred", "error", "error²"],
            "rows": [
                ["1", "3.0", "2.5", "0.5", "0.25"],
                ["2", "1.0", "1.2", "-0.2", "0.04"],
                ["3", "4.5", "3.8", "0.7", "0.49"],
                ["4", "2.0", "2.1", "-0.1", "0.01"],
                ["5", "5.0", "4.0", "1.0", "1.00"],
                ["6", "1.5", "2.0", "-0.5", "0.25"],
                ["7", "3.5", "3.0", "0.5", "0.25"],
            ],
            "caption": "MSE sample — 7 data points with errors + squared errors",
        },
    },
    {
        "id": "mae",
        "name": "Mean Absolute Error (MAE)",
        "category": "Regression",
        "equation": "L = (1/n) Σ_{i=1}^{n} |y_i − ŷ_i|",
        "explanation": "MAE is the average absolute difference between predicted and actual values. Unlike MSE, it penalises errors linearly — a 2× error gives 2× the loss. MAE is more robust to outliers but has a non-differentiable point at zero.",
        "derivation": [
            ("Step 1: Define the error", "e_i = y_i − ŷ_i", "Same as MSE — the error for sample i is the difference between true and predicted values."),
            ("Step 2: Take the absolute value", "|e_i| = |y_i − ŷ_i|", "Absolute value removes the sign — both positive and negative errors contribute positively. Unlike squaring, the penalty is linear, not quadratic."),
            ("Step 3: Average over all samples", "L = (1/n) Σ |e_i|", "Sum the absolute errors and divide by n. The result is the mean absolute deviation."),
            ("Step 4: Sub-gradient (non-smooth at 0)", "∂L/∂ŷ_i = sign(ŷ_i − y_i) / n", "The gradient is ±1/n — constant magnitude regardless of error size. This makes SGD steps uniform, but the non-differentiable point at e=0 can cause oscillation near convergence."),
            ("Step 5: Robustness to outliers", "MAE outlier penalty: 10× error → 10× loss (linear)", "Unlike MSE's quadratic penalty, MAE's linear penalty means outliers don't dominate the loss. MAE is the maximum-likelihood estimator when residuals follow a Laplace distribution."),
        ],
        "code": {
            "python": "# L = (1/n) Sum |y_i - y_hat_i|\n# y_i -> y_true[i]  y_hat_i -> y_pred[i]  n -> len(y_true)\n# |.| -> np.abs()  Sum -> .sum()  (1/n) -> np.mean()\nimport numpy as np\ndef mae(y_true, y_pred):\n    return np.mean(np.abs(y_true - y_pred))\ndef mae_grad(y_true, y_pred):\n    return np.sign(y_pred - y_true) / len(y_true)",
            "rust": "fn mae(y_true: &[f64], y_pred: &[f64]) -> f64 {\n    let n = y_true.len() as f64;\n    y_true.iter().zip(y_pred.iter())\n        .map(|(t, p)| (t - p).abs()).sum::<f64>() / n\n}",
            "go": "func MAE(yTrue, yPred []float64) float64 {\n\tn := float64(len(yTrue))\n\tvar sum float64\n\tfor i := range yTrue { sum += math.Abs(yTrue[i] - yPred[i]) }\n\treturn sum / n\n}",
            "c": "double mae(const double* y_true, const double* y_pred, int n) {\n    double sum = 0;\n    for (int i = 0; i < n; i++) sum += fabs(y_true[i] - y_pred[i]);\n    return sum / n;\n}",
            "elixir": "defmodule MAE do\n  def loss(y_true, y_pred) do\n    n = length(y_true)\n    Enum.zip(y_true, y_pred) |> Enum.map(fn {t, p} -> abs(t - p) end) |> Enum.sum() / n\n  end\nend",
            "scala": "def mae(yTrue: Array[Double], yPred: Array[Double]): Double = {\n  val n = yTrue.length\n  yTrue.indices.map(i => math.abs(yTrue(i) - yPred(i))).sum / n\n}",
        },
        "stats": [
            {"label": "Type", "value": "Regression"},
            {"label": "Penalty", "value": "Linear"},
            {"label": "Outlier sensitivity", "value": "Low"},
            {"label": "Gradient", "value": "±1/n (constant)"},
            {"label": "Convex", "value": "Yes"},
            {"label": "Differentiable", "value": "No (at e=0)"},
        ],
        "report": "MAE is the robust alternative to MSE — it penalises errors linearly, making it less sensitive to outliers. The gradient is ±1/n regardless of error magnitude, which means SGD steps are uniform but can oscillate near convergence. MAE is the MLE when residuals follow a Laplace distribution.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 L 200 100 L 380 25" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M 20 175 Q 200 170 380 20" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">error (y−ŷ)</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text><text x="300" y="45" font-size="9" fill="#06b6d4" font-family="ui-monospace">MAE (linear)</text><text x="300" y="35" font-size="9" fill="#8b5cf6" font-family="ui-monospace">MSE (quadratic, dashed)</text></svg>',
        "summary": [
            "MAE = (1/n) Σ |y−ŷ| — linear penalty, robust to outliers.",
            "Gradient is ±1/n — constant magnitude regardless of error size.",
            "Non-differentiable at e=0 — sub-gradient methods handle this.",
            "MLE when residuals follow a Laplace (double-exponential) distribution.",
        ],
        "sample_data": {
            "headers": ["Sample", "y_true", "y_pred", "|error|"],
            "rows": [
                ["1", "3.0", "2.5", "0.5"],
                ["2", "1.0", "1.2", "0.2"],
                ["3", "4.5", "3.8", "0.7"],
                ["4", "2.0", "2.1", "0.1"],
                ["5", "5.0", "4.0", "1.0"],
            ],
            "caption": "MAE sample — 5 data points with absolute errors",
        },
    },
    {
        "id": "binary-cross-entropy",
        "name": "Binary Cross-Entropy (BCE)",
        "category": "Binary Classification",
        "equation": "L = −(1/n) Σ [y_i log(ŷ_i) + (1−y_i) log(1−ŷ_i)]",
        "explanation": "BCE is the standard loss for binary classification. It measures the dissimilarity between the true binary distribution (y ∈ {0,1}) and the predicted probability distribution (ŷ ∈ (0,1)). The logarithm penalises confident wrong predictions heavily — a prediction of 0.01 for a true positive gives a loss of ~4.6, while a prediction of 0.49 gives only ~0.71.",
        "derivation": [
            ("Step 1: Bernoulli likelihood", "P(y | ŷ) = ŷ^y · (1−ŷ)^(1−y)", "For a binary label y ∈ {0,1} and predicted probability ŷ ∈ (0,1), the likelihood is the Bernoulli PMF. y=1 gives P=ŷ; y=0 gives P=1−ŷ."),
            ("Step 2: Log-likelihood", "log P = y log(ŷ) + (1−y) log(1−ŷ)", "Take the log to convert the product into a sum (easier to optimise). The log-likelihood is negative because log(ŷ) < 0 when ŷ < 1."),
            ("Step 3: Negative log-likelihood (loss)", "L = −log P = −[y log(ŷ) + (1−y) log(1−ŷ)]", "Negate to convert maximisation into minimisation. This is the cross-entropy between the true distribution [y, 1−y] and the predicted [ŷ, 1−ŷ]."),
            ("Step 4: Average over all samples", "L = −(1/n) Σ [y_i log(ŷ_i) + (1−y_i) log(1−ŷ_i)]", "Sum the per-sample losses and divide by n. The 1/n normalises for batch size."),
            ("Step 5: Gradient", "∂L/∂ŷ_i = −(y_i/ŷ_i − (1−y_i)/(1−ŷ_i)) = (ŷ_i − y_i) / (ŷ_i(1−ŷ_i))", "The gradient simplifies to (ŷ−y) / (ŷ(1−ŷ)). When paired with a sigmoid output, the denominator cancels the sigmoid derivative, giving a clean gradient of (ŷ−y). This is why BCE + sigmoid is the canonical binary-classification setup."),
        ],
        "code": {
            "python": "# L = -(1/n) Sum [y log(y_hat) + (1-y) log(1-y_hat)]\n# y -> y_true[i]  y_hat -> y_pred[i] (sigmoid output)\n# log -> np.log()  clip y_hat to (1e-15, 1-1e-15)\nimport numpy as np\ndef bce(y_true, y_pred):\n    eps = 1e-15\n    y_pred = np.clip(y_pred, eps, 1 - eps)\n    return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))",
            "rust": "fn bce(y_true: &[f64], y_pred: &[f64]) -> f64 {\n    let n = y_true.len() as f64;\n    y_true.iter().zip(y_pred.iter()).map(|(t, p)| {\n        let p = p.clamp(1e-15, 1.0 - 1e-15);\n        -(t * p.ln() + (1.0 - t) * (1.0 - p).ln())\n    }).sum::<f64>() / n\n}",
            "go": "func BCE(yTrue, yPred []float64) float64 {\n\tn := float64(len(yTrue))\n\tvar sum float64\n\tfor i := range yTrue {\n\t\tp := math.Max(1e-15, math.Min(1-1e-15, yPred[i]))\n\t\tsum += -(yTrue[i]*math.Log(p) + (1-yTrue[i])*math.Log(1-p))\n\t}\n\treturn sum / n\n}",
            "c": "double bce(const double* y_true, const double* y_pred, int n) {\n    double sum = 0;\n    for (int i = 0; i < n; i++) {\n        double p = fmax(1e-15, fmin(1-1e-15, y_pred[i]));\n        sum += -(y_true[i]*log(p) + (1-y_true[i])*log(1-p));\n    }\n    return sum / n;\n}",
            "elixir": "defmodule BCE do\n  def loss(y_true, y_pred) do\n    n = length(y_true)\n    Enum.zip(y_true, y_pred) |> Enum.map(fn {t, p} ->\n      p = max(1.0e-15, min(1.0 - 1.0e-15, p))\n      -(t * :math.log(p) + (1 - t) * :math.log(1 - p))\n    end) |> Enum.sum() / n\n  end\nend",
            "scala": "def bce(yTrue: Array[Double], yPred: Array[Double]): Double = {\n  val n = yTrue.length.toDouble\n  yTrue.indices.map(i => {\n    val p = math.max(1e-15, math.min(1-1e-15, yPred(i)))\n    -(yTrue(i)*math.log(p) + (1-yTrue(i))*math.log(1-p))\n  }).sum / n\n}",
        },
        "stats": [
            {"label": "Type", "value": "Binary classification"},
            {"label": "Output activation", "value": "Sigmoid"},
            {"label": "Penalty", "value": "Logarithmic"},
            {"label": "Confident wrong", "value": "Heavy (→∞)"},
            {"label": "Convex", "value": "Yes"},
            {"label": "MLE", "value": "Bernoulli"},
        ],
        "report": "BCE is the standard loss for binary classification. Paired with a sigmoid output, the gradient simplifies to (ŷ−y) — the prediction error. The logarithm heavily penalises confident wrong predictions: predicting 0.01 for a true positive gives loss ~4.6, while predicting 0.49 gives only ~0.71. BCE is the MLE for Bernoulli-distributed labels.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 60 160 100 120 Q 140 60 200 25 L 380 22" stroke="#ec4899" stroke-width="2" fill="none"/><path d="M 20 175 Q 60 170 100 150 Q 140 120 200 100 Q 260 80 380 70" stroke="#06b6d4" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">predicted probability ŷ</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text><text x="200" y="20" text-anchor="middle" font-size="9" fill="#ec4899" font-family="ui-monospace">y=1: −log(ŷ)</text><text x="300" y="90" text-anchor="middle" font-size="9" fill="#06b6d4" font-family="ui-monospace">y=0: −log(1−ŷ)</text></svg>',
        "summary": [
            "BCE = −(1/n) Σ [y log(ŷ) + (1−y) log(1−ŷ)] — the Bernoulli negative log-likelihood.",
            "Paired with sigmoid output, the gradient simplifies to (ŷ−y) — clean and stable.",
            "Confident wrong predictions are heavily penalised: ŷ=0.01 for y=1 gives loss ~4.6.",
            "MLE for Bernoulli-distributed labels; the canonical binary-classification loss.",
        ],
        "sample_data": {
            "headers": ["Sample", "y_true", "ŷ_pred", "−log(ŷ) if y=1", "−log(1−ŷ) if y=0", "loss"],
            "rows": [
                ["1", "1", "0.9", "0.105", "—", "0.105"],
                ["2", "0", "0.1", "—", "0.105", "0.105"],
                ["3", "1", "0.5", "0.693", "—", "0.693"],
                ["4", "0", "0.8", "—", "1.609", "1.609"],
                ["5", "1", "0.01", "4.605", "—", "4.605"],
                ["6", "0", "0.99", "—", "4.605", "4.605"],
            ],
            "caption": "BCE sample — 6 data points showing how confident wrong predictions (samples 5,6) get ~4.6 loss",
        },
    },
    {
        "id": "categorical-cross-entropy",
        "name": "Categorical Cross-Entropy (CCE)",
        "category": "Multi-Class Classification",
        "equation": "L = −(1/n) Σ_{i=1}^{n} Σ_{c=1}^{C} y_{ic} log(ŷ_{ic})",
        "explanation": "CCE is the standard loss for multi-class classification. For each sample i and class c, it compares the true one-hot label y_ic with the predicted probability ŷ_ic. Only the true class contributes (since y_ic=0 for all other classes), making the loss = −log(ŷ_true_class).",
        "derivation": [
            ("Step 1: Categorical likelihood", "P(y | ŷ) = Π_c ŷ_c^{y_c}", "For a one-hot label y (one class is 1, rest are 0) and a predicted probability distribution ŷ over C classes, the likelihood is the categorical PMF. Only the true class contributes since y_c=0 for others."),
            ("Step 2: Log-likelihood", "log P = Σ_c y_c log(ŷ_c)", "Take the log. Since y is one-hot, only the true class's log-probability appears — log P = log(ŷ_true)."),
            ("Step 3: Negative log-likelihood (loss)", "L = −Σ_c y_c log(ŷ_c) = −log(ŷ_true)", "Negate to convert maximisation into minimisation. The loss is just the negative log-probability of the true class."),
            ("Step 4: Average over all samples", "L = −(1/n) Σ_i Σ_c y_{ic} log(ŷ_{ic})", "Sum over all samples and classes. The one-hot structure means only the true class per sample contributes."),
            ("Step 5: Gradient with softmax", "∂L/∂z_c = ŷ_c − y_c", "When paired with a softmax output, the gradient of the loss w.r.t. the pre-activation z_c simplifies to (ŷ_c − y_c) — the prediction error. This clean gradient is why CCE + softmax is the canonical multi-class setup."),
        ],
        "code": {
            "python": "# L = -(1/n) Sum_i Sum_c y_ic log(y_hat_ic)\n# y_ic -> y_true[i][c] (one-hot)  y_hat_ic -> y_pred[i][c] (softmax)\n# Sum_c -> sum(axis=1)  Sum_i -> sum()  (1/n) -> mean()\nimport numpy as np\ndef cce(y_true, y_pred):\n    eps = 1e-15\n    y_pred = np.clip(y_pred, eps, 1.0)\n    return -np.mean(np.sum(y_true * np.log(y_pred), axis=1))",
            "rust": "fn cce(y_true: &[Vec<f64>], y_pred: &[Vec<f64>]) -> f64 {\n    let n = y_true.len() as f64;\n    let mut sum = 0.0;\n    for i in 0..y_true.len() {\n        for c in 0..y_true[i].len() {\n            let p = y_pred[i][c].max(1e-15);\n            sum += y_true[i][c] * p.ln();\n        }\n    }\n    -sum / n\n}",
            "go": "func CCE(yTrue, yPred [][]float64) float64 {\n\tn := float64(len(yTrue))\n\tvar sum float64\n\tfor i := range yTrue {\n\t\tfor c := range yTrue[i] {\n\t\t\tp := math.Max(1e-15, yPred[i][c])\n\t\t\tsum += yTrue[i][c] * math.Log(p)\n\t\t}\n\t}\n\treturn -sum / n\n}",
            "c": "double cce(const double* y_true, const double* y_pred, int n, int C) {\n    double sum = 0;\n    for (int i = 0; i < n; i++)\n        for (int c = 0; c < C; c++) {\n            double p = fmax(1e-15, y_pred[i*C+c]);\n            sum += y_true[i*C+c] * log(p);\n        }\n    return -sum / n;\n}",
            "elixir": "defmodule CCE do\n  def loss(y_true, y_pred) do\n    n = length(y_true)\n    Enum.zip(y_true, y_pred) |> Enum.map(fn {yt, yp} ->\n      Enum.zip(yt, yp) |> Enum.map(fn {t, p} -> t * :math.log(max(p, 1.0e-15)) end) |> Enum.sum()\n    end) |> Enum.sum() |> Kernel./(-n)\n  end\nend",
            "scala": "def cce(yTrue: Array[Array[Double]], yPred: Array[Array[Double]]): Double = {\n  val n = yTrue.length.toDouble\n  -yTrue.indices.flatMap(i => yTrue(i).indices.map(c => yTrue(i)(c) * math.log(math.max(1e-15, yPred(i)(c))))).sum / n\n}",
        },
        "stats": [
            {"label": "Type", "value": "Multi-class"},
            {"label": "Output", "value": "Softmax"},
            {"label": "Label format", "value": "One-hot"},
            {"label": "Gradient", "value": "ŷ − y"},
            {"label": "Convex", "value": "Yes"},
            {"label": "MLE", "value": "Categorical"},
        ],
        "report": "CCE is the standard loss for multi-class classification. Paired with a softmax output, the gradient simplifies to (ŷ−y) — the prediction error. Only the true class contributes to the loss (since y is one-hot), making L = −log(ŷ_true). CCE is the MLE for categorical-distributed labels.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 80 140 140 80 Q 200 30 380 20" stroke="#8b5cf6" stroke-width="2" fill="none"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">ŷ_true (predicted prob of true class)</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss = −log(ŷ_true)</text></svg>',
        "summary": [
            "CCE = −(1/n) Σ Σ y_c log(ŷ_c) — only the true class contributes (one-hot y).",
            "Paired with softmax, the gradient is (ŷ−y) — clean and stable.",
            "L = −log(ŷ_true) — heavily penalises low-confidence correct predictions.",
            "MLE for categorical-distributed labels; the canonical multi-class loss.",
        ],
        "sample_data": {
            "headers": ["Sample", "True class", "ŷ_true_class", "−log(ŷ_true)", "loss"],
            "rows": [
                ["1", "cat", "0.8", "0.223", "0.223"],
                ["2", "dog", "0.3", "1.204", "1.204"],
                ["3", "bird", "0.9", "0.105", "0.105"],
                ["4", "cat", "0.01", "4.605", "4.605"],
                ["5", "dog", "0.5", "0.693", "0.693"],
            ],
            "caption": "CCE sample — 5 multi-class predictions; sample 4 is confidently wrong (ŷ=0.01 for the true class)",
        },
    },
    {
        "id": "hinge-loss",
        "name": "Hinge Loss",
        "category": "SVM / Max-Margin",
        "equation": "L = (1/n) Σ_{i=1}^{n} max(0, 1 − y_i · ŷ_i)",
        "explanation": "Hinge loss is used in Support Vector Machines (SVMs). Labels y ∈ {−1, +1}; predictions ŷ are raw scores (not probabilities). The loss is zero when y·ŷ ≥ 1 (correct with margin), and linear when y·ŷ < 1. The 'hinge' shape encourages a margin of at least 1 between classes.",
        "derivation": [
            ("Step 1: Label convention", "y ∈ {−1, +1},  ŷ ∈ ℝ (raw score)", "SVM uses ±1 labels (not 0/1) and raw scores (not probabilities). A correct prediction with margin has y·ŷ ≥ 1."),
            ("Step 2: Margin condition", "y · ŷ ≥ 1  →  correct with margin", "The product y·ŷ measures both correctness and confidence. If positive, the prediction is in the right direction. If ≥ 1, the prediction has sufficient margin."),
            ("Step 3: Hinge function", "L_i = max(0, 1 − y_i · ŷ_i)", "The loss is zero when the margin is met (y·ŷ ≥ 1), and grows linearly when the margin is violated. The 'hinge' is the kink at y·ŷ = 1."),
            ("Step 4: Average over all samples", "L = (1/n) Σ max(0, 1 − y_i · ŷ_i)", "Sum the per-sample hinge losses and divide by n. Samples with margin > 1 contribute zero — they don't affect the loss."),
            ("Step 5: Sub-gradient", "∂L/∂ŷ_i = −y_i  if y_i·ŷ_i < 1,  else 0", "The gradient is −y for margin-violating samples (constant magnitude), and 0 for samples with sufficient margin. This makes SVM training focus only on the 'support vectors' — the samples near the margin."),
        ],
        "code": {
            "python": "# L = (1/n) Sum max(0, 1 - y*y_hat)\n# y -> y_true[i] in {-1,+1}  y_hat -> y_pred[i] (raw score)\n# max(0,.) -> np.maximum(0, .)  y*y_hat -> y_true * y_pred\nimport numpy as np\ndef hinge(y_true, y_pred):\n    return np.mean(np.maximum(0, 1 - y_true * y_pred))\ndef hinge_grad(y_true, y_pred):\n    return -y_true * (y_true * y_pred < 1) / len(y_true)",
            "rust": "fn hinge(y_true: &[f64], y_pred: &[f64]) -> f64 {\n    let n = y_true.len() as f64;\n    y_true.iter().zip(y_pred.iter())\n        .map(|(t, p)| (1.0 - t * p).max(0.0)).sum::<f64>() / n\n}",
            "go": "func Hinge(yTrue, yPred []float64) float64 {\n\tn := float64(len(yTrue))\n\tvar sum float64\n\tfor i := range yTrue { sum += math.Max(0, 1-yTrue[i]*yPred[i]) }\n\treturn sum / n\n}",
            "c": "double hinge(const double* y_true, const double* y_pred, int n) {\n    double sum = 0;\n    for (int i = 0; i < n; i++) sum += fmax(0, 1 - y_true[i]*y_pred[i]);\n    return sum / n;\n}",
            "elixir": "defmodule Hinge do\n  def loss(y_true, y_pred) do\n    n = length(y_true)\n    Enum.zip(y_true, y_pred) |> Enum.map(fn {t, p} -> max(0, 1 - t * p) end) |> Enum.sum() / n\n  end\nend",
            "scala": "def hinge(yTrue: Array[Double], yPred: Array[Double]): Double = {\n  val n = yTrue.length.toDouble\n  yTrue.indices.map(i => math.max(0, 1 - yTrue(i)*yPred(i))).sum / n\n}",
        },
        "stats": [
            {"label": "Type", "value": "SVM / max-margin"},
            {"label": "Labels", "value": "±1 (not 0/1)"},
            {"label": "Output", "value": "Raw score"},
            {"label": "Margin", "value": "≥ 1 required"},
            {"label": "Convex", "value": "Yes"},
            {"label": "Differentiable", "value": "No (at margin)"},
        ],
        "report": "Hinge loss is the SVM loss function. It encourages a margin of at least 1 between classes — samples with y·ŷ ≥ 1 contribute zero loss. The sub-gradient is −y for margin-violating samples and 0 for others, making SVM training focus on 'support vectors' (samples near the decision boundary).",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 30 L 200 30 L 380 175" stroke="#f59e0b" stroke-width="2" fill="none"/><line x1="200" y1="30" x2="200" y2="180" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">y·ŷ (margin)</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text><text x="210" y="25" font-size="9" fill="#ef4444" font-family="ui-monospace">margin = 1</text></svg>',
        "summary": [
            "Hinge = (1/n) Σ max(0, 1 − y·ŷ) — zero loss when margin ≥ 1.",
            "Labels are ±1 (not 0/1); predictions are raw scores (not probabilities).",
            "Sub-gradient is −y for margin-violating samples, 0 for others — SVM focuses on support vectors.",
            "The 'hinge' at y·ŷ = 1 creates a max-margin decision boundary.",
        ],
        "sample_data": {
            "headers": ["Sample", "y (±1)", "ŷ (score)", "y·ŷ", "max(0,1−y·ŷ)"],
            "rows": [
                ["1", "+1", "2.5", "2.5", "0.0"],
                ["2", "-1", "-1.8", "1.8", "0.0"],
                ["3", "+1", "0.3", "0.3", "0.7"],
                ["4", "-1", "0.5", "-0.5", "1.5"],
                ["5", "+1", "-1.0", "-1.0", "2.0"],
            ],
            "caption": "Hinge loss sample — samples 1,2 meet the margin (loss=0); samples 3-5 violate it",
        },
    },
    {
        "id": "log-cosh",
        "name": "Log-Cosh Loss",
        "category": "Regression",
        "equation": "L = (1/n) Σ_{i=1}^{n} log(cosh(ŷ_i − y_i))",
        "explanation": "Log-Cosh is a smooth approximation to MSE that behaves like MSE for small errors and like MAE for large errors. It's twice differentiable everywhere (unlike MAE), making it suitable for Newton-style optimisation (e.g. XGBoost). The name comes from log(cosh(x)) ≈ x²/2 for small x and ≈ |x| − log(2) for large x.",
        "derivation": [
            ("Step 1: Cosh function", "cosh(x) = (e^x + e^(−x)) / 2", "The hyperbolic cosine is a smooth even function — cosh(−x) = cosh(x). It grows exponentially for large |x|."),
            ("Step 2: Log of cosh", "log(cosh(x))", "Taking the log converts exponential growth back to linear growth. For small x: log(cosh(x)) ≈ x²/2. For large x: log(cosh(x)) ≈ |x| − log(2)."),
            ("Step 3: Loss definition", "L = (1/n) Σ log(cosh(ŷ_i − y_i))", "Average the log-cosh of the errors over all samples. Small errors give quadratic loss (like MSE); large errors give linear loss (like MAE)."),
            ("Step 4: Gradient", "∂L/∂ŷ_i = tanh(ŷ_i − y_i) / n", "The gradient is tanh(error)/n — bounded by ±1/n. For small errors, tanh(e) ≈ e (MSE-like gradient). For large errors, tanh(e) → ±1 (MAE-like constant gradient)."),
            ("Step 5: Hessian (for Newton methods)", "∂²L/∂ŷ² = sech²(ŷ − y) / n = 1 / (n·cosh²(ŷ − y))", "The Hessian is always positive and bounded — it's the square of the gradient of tanh. This makes log-cosh twice-differentiable, suitable for Newton-Raphson optimisation (used in XGBoost)."),
        ],
        "code": {
            "python": "# L = (1/n) Sum log(cosh(y_hat - y))\n# y -> y_true[i]  y_hat -> y_pred[i]  cosh -> np.cosh()\n# log -> np.log()  cosh(e) ~ e^2/2 (small e) or |e| (large e)\nimport numpy as np\ndef log_cosh(y_true, y_pred):\n    return np.mean(np.log(np.cosh(y_pred - y_true)))\ndef log_cosh_grad(y_true, y_pred):\n    return np.tanh(y_pred - y_true) / len(y_true)",
            "rust": "fn log_cosh(y_true: &[f64], y_pred: &[f64]) -> f64 {\n    let n = y_true.len() as f64;\n    y_true.iter().zip(y_pred.iter())\n        .map(|(t, p)| ((p - t).cosh()).ln()).sum::<f64>() / n\n}",
            "go": "func LogCosh(yTrue, yPred []float64) float64 {\n\tn := float64(len(yTrue))\n\tvar sum float64\n\tfor i := range yTrue { sum += math.Log(math.Cosh(yPred[i] - yTrue[i])) }\n\treturn sum / n\n}",
            "c": "#include <math.h>\ndouble log_cosh(const double* y_true, const double* y_pred, int n) {\n    double sum = 0;\n    for (int i = 0; i < n; i++) sum += log(cosh(y_pred[i] - y_true[i]));\n    return sum / n;\n}",
            "elixir": "defmodule LogCosh do\n  def loss(y_true, y_pred) do\n    n = length(y_true)\n    Enum.zip(y_true, y_pred) |> Enum.map(fn {t, p} -> :math.log(:math.cosh(p - t)) end) |> Enum.sum() / n\n  end\nend",
            "scala": "def logCosh(yTrue: Array[Double], yPred: Array[Double]): Double = {\n  val n = yTrue.length.toDouble\n  yTrue.indices.map(i => math.log(math.cosh(yPred(i) - yTrue(i)))).sum / n\n}",
        },
        "stats": [
            {"label": "Type", "value": "Regression"},
            {"label": "Small errors", "value": "≈ MSE (x²/2)"},
            {"label": "Large errors", "value": "≈ MAE (|x|)"},
            {"label": "Gradient", "value": "tanh(e) ∈ [−1,1]"},
            {"label": "Differentiable", "value": "C∞ (smooth)"},
            {"label": "Hessian", "value": "sech²(e) > 0"},
        ],
        "report": "Log-Cosh combines MSE's quadratic behaviour for small errors with MAE's linear behaviour for large errors — all in a smooth (C∞) function. The gradient tanh(e) is bounded by ±1, preventing exploding gradients. The positive Hessian sech²(e) enables Newton-Raphson optimisation (used in XGBoost).",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 100 170 200 100 Q 300 35 380 25" stroke="#10b981" stroke-width="2" fill="none"/><path d="M 20 175 Q 100 165 200 110 Q 300 55 380 40" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><path d="M 20 175 L 200 100 L 380 25" stroke="#06b6d4" stroke-width="1" fill="none" stroke-dasharray="2 2"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">error</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text><text x="300" y="20" font-size="9" fill="#10b981" font-family="ui-monospace">log-cosh (smooth)</text></svg>',
        "summary": [
            "Log-Cosh = (1/n) Σ log(cosh(ŷ−y)) — smooth blend of MSE (small e) and MAE (large e).",
            "Gradient = tanh(e) — bounded by ±1, preventing exploding gradients.",
            "Twice-differentiable (C∞) — suitable for Newton-Raphson (XGBoost).",
            "For small e: log(cosh(e)) ≈ e²/2 (MSE); for large e: ≈ |e| − log(2) (MAE).",
        ],
        "sample_data": {
            "headers": ["Sample", "y_true", "y_pred", "error", "log(cosh(error))"],
            "rows": [
                ["1", "3.0", "2.5", "0.5", "0.12"],
                ["2", "1.0", "1.2", "0.2", "0.02"],
                ["3", "4.5", "3.8", "0.7", "0.23"],
                ["4", "2.0", "5.0", "3.0", "2.31"],
                ["5", "5.0", "4.0", "1.0", "0.43"],
            ],
            "caption": "Log-Cosh sample — note sample 4 (error=3.0) gets loss 2.31 (≈ MAE) not 4.5 (MSE)",
        },
    },
    {
        "id": "huber-loss",
        "name": "Huber Loss",
        "category": "Robust Regression",
        "equation": "L_δ(e) = { ½e²  if |e| ≤ δ;  δ(|e| − ½δ)  if |e| > δ }",
        "explanation": "Huber loss is quadratic (MSE-like) for small errors and linear (MAE-like) for large errors, with a configurable threshold δ. It's the canonical robust-regression loss — less sensitive to outliers than MSE, but smoother than MAE (differentiable everywhere). δ controls the transition point.",
        "derivation": [
            ("Step 1: Define the error", "e_i = y_i − ŷ_i", "Same as MSE/MAE — the error for sample i is the difference between true and predicted values."),
            ("Step 2: Quadratic region (|e| ≤ δ)", "L = ½ e²", "For small errors (within the threshold δ), the loss is quadratic — same as MSE. This gives fast convergence near the optimum."),
            ("Step 3: Linear region (|e| > δ)", "L = δ(|e| − ½δ)", "For large errors (beyond δ), the loss is linear — same as MAE. This caps the influence of outliers: a 10× outlier gives the same gradient as a 2× outlier (both are δ)."),
            ("Step 4: Piecewise definition", "L_δ(e) = { ½e²  if |e| ≤ δ;  δ(|e| − ½δ)  if |e| > δ }", "The two regions are continuous at |e| = δ: ½δ² = δ(δ − ½δ) = ½δ². The gradient transitions from e (quadratic) to δ·sign(e) (linear) at the threshold."),
            ("Step 5: Choosing δ", "δ = 1.0 (default) or σ·1.345 (Mad) ", "δ controls the transition. A common heuristic is δ = 1.345·σ (where σ is the residual standard deviation) — this gives 95% efficiency under Gaussian noise while remaining robust to outliers. Smaller δ → more robust (like MAE); larger δ → more sensitive (like MSE)."),
        ],
        "code": {
            "python": "# L_delta(e) = { 0.5*e^2  if |e|<=delta;  delta*(|e|-0.5*delta)  if |e|>delta }\n# e -> y_pred - y_true  delta -> delta (threshold, default 1.0)\n# 0.5*e^2 -> 0.5*e*e  delta*(|e|-0.5*delta) -> delta*(abs(e)-0.5*delta)\nimport numpy as np\ndef huber(y_true, y_pred, delta=1.0):\n    e = y_pred - y_true\n    abs_e = np.abs(e)\n    quad = 0.5 * e**2\n    linear = delta * (abs_e - 0.5 * delta)\n    return np.mean(np.where(abs_e <= delta, quad, linear))",
            "rust": "fn huber(y_true: &[f64], y_pred: &[f64], delta: f64) -> f64 {\n    let n = y_true.len() as f64;\n    y_true.iter().zip(y_pred.iter()).map(|(t, p)| {\n        let e = (p - t).abs();\n        if e <= delta { 0.5 * e * e } else { delta * (e - 0.5 * delta) }\n    }).sum::<f64>() / n\n}",
            "go": "func Huber(yTrue, yPred []float64, delta float64) float64 {\n\tn := float64(len(yTrue))\n\tvar sum float64\n\tfor i := range yTrue {\n\t\te := math.Abs(yPred[i] - yTrue[i])\n\t\tif e <= delta { sum += 0.5 * e * e } else { sum += delta * (e - 0.5*delta) }\n\t}\n\treturn sum / n\n}",
            "c": "double huber(const double* y_true, const double* y_pred, int n, double delta) {\n    double sum = 0;\n    for (int i = 0; i < n; i++) {\n        double e = fabs(y_pred[i] - y_true[i]);\n        sum += (e <= delta) ? 0.5*e*e : delta*(e - 0.5*delta);\n    }\n    return sum / n;\n}",
            "elixir": "defmodule Huber do\n  def loss(y_true, y_pred, delta \\\\ 1.0) do\n    n = length(y_true)\n    Enum.zip(y_true, y_pred) |> Enum.map(fn {t, p} ->\n      e = abs(p - t)\n      if e <= delta, do: 0.5 * e * e, else: delta * (e - 0.5 * delta)\n    end) |> Enum.sum() / n\n  end\nend",
            "scala": "def huber(yTrue: Array[Double], yPred: Array[Double], delta: Double = 1.0): Double = {\n  val n = yTrue.length.toDouble\n  yTrue.indices.map(i => {\n    val e = math.abs(yPred(i) - yTrue(i))\n    if (e <= delta) 0.5*e*e else delta*(e - 0.5*delta)\n  }).sum / n\n}",
        },
        "stats": [
            {"label": "Type", "value": "Robust regression"},
            {"label": "Small errors (|e|≤δ)", "value": "Quadratic (½e²)"},
            {"label": "Large errors (|e|>δ)", "value": "Linear (δ·|e|)"},
            {"label": "Default δ", "value": "1.0"},
            {"label": "Differentiable", "value": "Yes (C¹)"},
            {"label": "Outlier gradient", "value": "Capped at δ"},
        ],
        "report": "Huber loss is the canonical robust-regression loss — quadratic for small errors (fast convergence) and linear for large errors (outlier-resistant). The threshold δ controls the transition: smaller δ → more robust (MAE-like), larger δ → more sensitive (MSE-like). The gradient is capped at δ for outliers, preventing a single bad sample from dominating training.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 120 165 200 80 L 380 25" stroke="#f59e0b" stroke-width="2" fill="none"/><line x1="200" y1="80" x2="200" y2="180" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">error</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">loss</text><text x="210" y="75" font-size="9" fill="#ef4444" font-family="ui-monospace">δ threshold</text><text x="100" y="160" font-size="9" fill="#f59e0b" font-family="ui-monospace">quadratic</text><text x="300" y="35" font-size="9" fill="#f59e0b" font-family="ui-monospace">linear</text></svg>',
        "summary": [
            "Huber = quadratic (½e²) for |e|≤δ, linear (δ|e|) for |e|>δ — robust + smooth.",
            "The threshold δ controls the MSE→MAE transition. Default δ=1.0; δ=1.345σ gives 95% efficiency under Gaussian noise.",
            "Outlier gradient is capped at δ — a single bad sample can't dominate training.",
            "Differentiable everywhere (C¹) — smoother than MAE (which is C⁰).",
        ],
        "sample_data": {
            "headers": ["Sample", "y_true", "y_pred", "|error|", "Huber (δ=1.0)", "MSE", "MAE"],
            "rows": [
                ["1", "3.0", "2.5", "0.5", "0.125", "0.25", "0.5"],
                ["2", "1.0", "1.2", "0.2", "0.020", "0.04", "0.2"],
                ["3", "4.5", "3.8", "0.7", "0.245", "0.49", "0.7"],
                ["4", "2.0", "5.0", "3.0", "2.500", "9.00", "3.0"],
                ["5", "5.0", "4.0", "1.0", "0.500", "1.00", "1.0"],
            ],
            "caption": "Huber (δ=1.0) vs MSE vs MAE — note sample 4 (outlier): Huber=2.5, MSE=9.0, MAE=3.0",
        },
    },
    {
        "id": "kl-divergence",
        "name": "KL Divergence",
        "category": "Probability Distributions",
        "equation": "D_KL(P || Q) = Σ_x P(x) log(P(x) / Q(x))",
        "explanation": "KL divergence measures the dissimilarity between two probability distributions P (true) and Q (predicted). It's not symmetric (D_KL(P||Q) ≠ D_KL(Q||P)) and is always ≥ 0 (Gibbs' inequality). KL is used in VAEs (as the regularisation term), in knowledge distillation (matching teacher-student distributions), and in variational inference.",
        "derivation": [
            ("Step 1: Two distributions", "P(x) = true distribution,  Q(x) = predicted distribution", "Both P and Q are probability distributions over the same support: Σ P(x) = 1, Σ Q(x) = 1, P(x) ≥ 0, Q(x) ≥ 0."),
            ("Step 2: Log-ratio", "log(P(x) / Q(x)) = log P(x) − log Q(x)", "The log-ratio measures how much more likely x is under P than under Q. If P(x) > Q(x), the ratio is positive (P assigns more mass). If P(x) < Q(x), the ratio is negative."),
            ("Step 3: Expectation under P", "D_KL(P || Q) = E_P[log(P/Q)] = Σ P(x) log(P(x)/Q(x))", "The KL divergence is the expected log-ratio under the true distribution P. The expectation weights each x by P(x) — so only where P has mass does the divergence change."),
            ("Step 4: Non-negativity (Gibbs' inequality)", "D_KL(P || Q) ≥ 0,  with equality iff P = Q", "By Jensen's inequality applied to the convex function −log: D_KL = E_P[log(P/Q)] = −E_P[log(Q/P)] ≥ −log(E_P[Q/P]) = −log(1) = 0. Equality holds iff P = Q everywhere."),
            ("Step 5: Asymmetry + relation to cross-entropy", "D_KL(P||Q) = H(P,Q) − H(P),  H(P,Q) = −Σ P log Q", "KL = cross-entropy − entropy. Minimising cross-entropy (the standard classification loss) is equivalent to minimising KL (since H(P) is constant for fixed labels). This is why CCE is the MLE."),
        ],
        "code": {
            "python": "# D_KL(P||Q) = Sum P(x) log(P(x)/Q(x))\n# P -> p[i] (true dist)  Q -> q[i] (predicted dist)\n# log(P/Q) -> np.log(p/q)  Sum -> np.sum()  clip to 1e-15\nimport numpy as np\ndef kl_divergence(p, q):\n    eps = 1e-15\n    p = np.clip(p, eps, 1.0)\n    q = np.clip(q, eps, 1.0)\n    return np.sum(p * np.log(p / q))",
            "rust": "fn kl_divergence(p: &[f64], q: &[f64]) -> f64 {\n    p.iter().zip(q.iter()).map(|(pi, qi)| {\n        let pi = pi.max(1e-15); let qi = qi.max(1e-15);\n        pi * (pi / qi).ln()\n    }).sum()\n}",
            "go": "func KLDivergence(p, q []float64) float64 {\n\tvar sum float64\n\tfor i := range p {\n\t\tpi := math.Max(1e-15, p[i]); qi := math.Max(1e-15, q[i])\n\t\tsum += pi * math.Log(pi / qi)\n\t}\n\treturn sum\n}",
            "c": "double kl_divergence(const double* p, const double* q, int n) {\n    double sum = 0;\n    for (int i = 0; i < n; i++) {\n        double pi = fmax(1e-15, p[i]), qi = fmax(1e-15, q[i]);\n        sum += pi * log(pi / qi);\n    }\n    return sum;\n}",
            "elixir": "defmodule KL do\n  def divergence(p, q) do\n    Enum.zip(p, q) |> Enum.map(fn {pi, qi} ->\n      pi = max(1.0e-15, pi); qi = max(1.0e-15, qi)\n      pi * :math.log(pi / qi)\n    end) |> Enum.sum()\n  end\nend",
            "scala": "def klDivergence(p: Array[Double], q: Array[Double]): Double = {\n  p.indices.map(i => {\n    val pi = math.max(1e-15, p(i)); val qi = math.max(1e-15, q(i))\n    pi * math.log(pi / qi)\n  }).sum\n}",
        },
        "stats": [
            {"label": "Type", "value": "Distribution matching"},
            {"label": "Symmetric", "value": "No (P||Q ≠ Q||P)"},
            {"label": "Non-negative", "value": "D_KL ≥ 0 (Gibbs)"},
            {"label": "Equality", "value": "D_KL = 0 iff P=Q"},
            {"label": "Used in", "value": "VAE, distillation"},
            {"label": "Unit", "value": "nats (base-e)"},
        ],
        "report": "KL divergence measures the dissimilarity between two probability distributions. It's the expected log-ratio under the true distribution: D_KL(P||Q) = Σ P log(P/Q). Always ≥ 0 (Gibbs' inequality), with equality iff P=Q. Asymmetric — D_KL(P||Q) ≠ D_KL(Q||P). KL = cross-entropy − entropy, so minimising cross-entropy is equivalent to minimising KL.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 175 Q 100 150 200 90 Q 300 30 380 22" stroke="#ec4899" stroke-width="2" fill="none"/><line x1="20" y1="175" x2="380" y2="175" stroke="#10b981" stroke-width="1" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">similarity of P and Q</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">D_KL</text><text x="200" y="170" text-anchor="middle" font-size="8" fill="#10b981" font-family="ui-monospace">D_KL = 0 when P=Q</text></svg>',
        "summary": [
            "D_KL(P||Q) = Σ P(x) log(P/Q) — the expected log-ratio under P.",
            "Always ≥ 0 (Gibbs' inequality); equality iff P=Q (distributions identical).",
            "Asymmetric: D_KL(P||Q) ≠ D_KL(Q||P) — use Jensen-Shannon for a symmetric variant.",
            "KL = cross-entropy − entropy → minimising cross-entropy ≡ minimising KL.",
        ],
        "sample_data": {
            "headers": ["x", "P(x)", "Q(x)", "P/Q", "P·log(P/Q)"],
            "rows": [
                ["a", "0.5", "0.4", "1.25", "0.111"],
                ["b", "0.3", "0.3", "1.00", "0.000"],
                ["c", "0.15", "0.2", "0.75", "-0.043"],
                ["d", "0.05", "0.1", "0.50", "-0.035"],
            ],
            "caption": "KL divergence sample — D_KL(P||Q) = 0.033 nats (P and Q are close)",
        },
    },
    {
        "id": "cosine-similarity",
        "name": "Cosine Similarity Loss",
        "category": "Embeddings",
        "equation": "L = 1 − (A · B) / (||A|| · ||B||) = 1 − cos(θ)",
        "explanation": "Cosine similarity measures the angle between two vectors, ignoring their magnitude. The loss is 1 minus the cosine similarity — 0 when vectors are parallel, 1 when orthogonal, 2 when anti-parallel. Used in embedding learning (e.g. sentence-BERT, CLIP) where the direction matters more than the magnitude.",
        "derivation": [
            ("Step 1: Dot product", "A · B = Σ A_i B_i = ||A|| ||B|| cos(θ)", "The dot product of two vectors equals the product of their magnitudes times the cosine of the angle between them. This is the geometric definition."),
            ("Step 2: Normalise by magnitudes", "cos(θ) = (A · B) / (||A|| ||B||)", "Dividing by the magnitudes normalises the dot product to the range [−1, 1], independent of vector length. cos(0°)=1 (parallel), cos(90°)=0 (orthogonal), cos(180°)=−1 (anti-parallel)."),
            ("Step 3: Cosine similarity", "sim(A, B) = cos(θ) = (A · B) / (||A|| ||B||)", "Cosine similarity = the normalised dot product. High value = vectors point in the same direction (semantically similar for embeddings)."),
            ("Step 4: Loss = 1 − similarity", "L = 1 − cos(θ) = 1 − (A · B) / (||A|| ||B||)", "Convert similarity (high = good) to loss (low = good) by subtracting from 1. L=0 when parallel, L=1 when orthogonal, L=2 when anti-parallel."),
            ("Step 5: Gradient", "∂L/∂A = −B / (||A|| ||B||) + (A · B) A / (||A||³ ||B||)", "The gradient has two terms: one pushing A toward B (alignment) and one regularising A's magnitude (since cosine is scale-invariant, the gradient is perpendicular to A)."),
        ],
        "code": {
            "python": "# L = 1 - (A.B) / (||A||*||B||)\n# A.B -> np.dot(a, b)  ||A|| -> np.linalg.norm(a)\n# L -> 1.0 - dot/(na*nb + eps)  eps=1e-8\nimport numpy as np\ndef cosine_similarity_loss(a, b):\n    dot = np.dot(a, b)\n    norm_a = np.linalg.norm(a)\n    norm_b = np.linalg.norm(b)\n    return 1.0 - dot / (norm_a * norm_b + 1e-8)",
            "rust": "fn cosine_loss(a: &[f64], b: &[f64]) -> f64 {\n    let dot: f64 = a.iter().zip(b.iter()).map(|(ai, bi)| ai * bi).sum();\n    let na: f64 = a.iter().map(|x| x * x).sum::<f64>().sqrt();\n    let nb: f64 = b.iter().map(|x| x * x).sum::<f64>().sqrt();\n    1.0 - dot / (na * nb + 1e-8)\n}",
            "go": "func CosineLoss(a, b []float64) float64 {\n\tvar dot, na, nb float64\n\tfor i := range a { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }\n\treturn 1.0 - dot/(math.Sqrt(na)*math.Sqrt(nb)+1e-8)\n}",
            "c": "double cosine_loss(const double* a, const double* b, int n) {\n    double dot=0, na=0, nb=0;\n    for (int i = 0; i < n; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }\n    return 1.0 - dot / (sqrt(na)*sqrt(nb) + 1e-8);\n}",
            "elixir": "defmodule Cosine do\n  def loss(a, b) do\n    dot = Enum.zip(a, b) |> Enum.map(fn {ai, bi} -> ai * bi end) |> Enum.sum()\n    na = :math.sqrt(Enum.map(a, &(&1 * &1)) |> Enum.sum())\n    nb = :math.sqrt(Enum.map(b, &(&1 * &1)) |> Enum.sum())\n    1.0 - dot / (na * nb + 1.0e-8)\n  end\nend",
            "scala": "def cosineLoss(a: Array[Double], b: Array[Double]): Double = {\n  val dot = a.indices.map(i => a(i)*b(i)).sum\n  val na = math.sqrt(a.map(x => x*x).sum)\n  val nb = math.sqrt(b.map(x => x*x).sum)\n  1.0 - dot / (na * nb + 1e-8)\n}",
        },
        "stats": [
            {"label": "Type", "value": "Embeddings"},
            {"label": "Range", "value": "[0, 2]"},
            {"label": "Magnitude", "value": "Invariant"},
            {"label": "Parallel", "value": "L = 0"},
            {"label": "Orthogonal", "value": "L = 1"},
            {"label": "Anti-parallel", "value": "L = 2"},
        ],
        "report": "Cosine similarity loss measures the angular difference between two vectors — magnitude-invariant. It's the standard loss for embedding learning (sentence-BERT, CLIP, recommendation systems) where the direction of the embedding matters more than its scale. L = 1 − cos(θ); 0 = parallel, 1 = orthogonal, 2 = anti-parallel.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><!-- Three vectors: parallel, orthogonal, anti-parallel --><line x1="50" y1="150" x2="120" y2="100" stroke="#10b981" stroke-width="2"/><line x1="50" y1="150" x2="120" y2="150" stroke="#10b981" stroke-width="2" stroke-dasharray="3 3"/><line x1="180" y1="150" x2="250" y2="80" stroke="#f59e0b" stroke-width="2"/><line x1="180" y1="150" x2="220" y2="110" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 3"/><line x1="310" y1="150" x2="240" y2="100" stroke="#ef4444" stroke-width="2"/><line x1="310" y1="150" x2="380" y2="100" stroke="#ef4444" stroke-width="2" stroke-dasharray="3 3"/><text x="85" y="170" text-anchor="middle" font-size="8" fill="#10b981" font-family="ui-monospace">L=0 (parallel)</text><text x="215" y="170" text-anchor="middle" font-size="8" fill="#f59e0b" font-family="ui-monospace">L=1 (orthogonal)</text><text x="345" y="170" text-anchor="middle" font-size="8" fill="#ef4444" font-family="ui-monospace">L=2 (anti-par.)</text></svg>',
        "summary": [
            "Cosine loss = 1 − (A·B) / (||A||·||B||) — magnitude-invariant angular distance.",
            "L=0 when parallel, L=1 when orthogonal, L=2 when anti-parallel.",
            "Standard loss for embedding learning (sentence-BERT, CLIP, recommendations).",
            "Gradient pushes A toward B's direction while regularising A's magnitude.",
        ],
        "sample_data": {
            "headers": ["Pair", "A", "B", "cos(θ)", "Loss = 1−cos(θ)"],
            "rows": [
                ["king−queen", "[0.5, 0.8, 0.3]", "[0.4, 0.9, 0.2]", "0.97", "0.03"],
                ["cat−dog", "[0.7, 0.1, 0.5]", "[0.6, 0.2, 0.6]", "0.89", "0.11"],
                ["happy−sad", "[0.8, 0.5, 0.1]", "[-0.7, -0.5, -0.1]", "-0.98", "1.98"],
                ["apple−orange", "[0.5, 0.5, 0.5]", "[0.4, 0.3, 0.6]", "0.93", "0.07"],
                ["hot−cold", "[0.9, 0.1, 0.0]", "[-0.8, 0.1, 0.0]", "-0.88", "1.88"],
            ],
            "caption": "Cosine similarity loss sample — 5 word-pair embeddings with loss values",
        },
    },
]


# ============================================================================
# HTML emission — reuses the digest CSS + ribbon
# ============================================================================

RIBBON_HTML = '''    <header class="ribbon">
      <div class="ribbon-inner">
        <a href="index.html" class="ribbon-brand"><span class="ribbon-logo">A</span><span class="ribbon-name">AIHPC Advanced</span></a>
        <nav class="ribbon-nav">
          <details class="ribbon-dropdown"><summary>Platform</summary><div class="ribbon-menu"><a href="index.html">Home</a><a href="demos.html">Demos</a><a href="dashboard.html">Dashboard</a><a href="graph.html">Knowledge Graph</a><a href="benchmark.html">Agentic Benchmark</a><a href="subscribe.html">Subscribe</a></div></details>
          <details class="ribbon-dropdown"><summary>AETHEL Suite</summary><div class="ribbon-menu"><a href="aethel.html">AETHEL Connector</a><a href="connectors.html">Scientific Connectors Hub</a><a href="query.html">Query Executor</a><a href="graph.html">Knowledge Graph</a><a href="workflows.html">Domain Workflows</a></div></details>
          <details class="ribbon-dropdown"><summary>Science</summary><div class="ribbon-menu"><a href="science-biology.html">Biology Hub</a><a href="science-chemistry.html">Chemistry Hub</a><a href="science-physics.html">Physics Hub</a><a href="science-maths.html">Mathematics Hub</a><a href="science-ml.html">🤖 Machine Learning</a><a href="science-bioinformatics.html">Bioinformatics</a><a href="science-cheminformatics.html">Cheminformatics</a></div></details>
          <details class="ribbon-dropdown"><summary>Insights</summary><div class="ribbon-menu"><a href="digest.html">Weekly Science Digest</a><a href="audit.html">📊 Audit Dashboard</a><a href="dashboard.html">Temporal Knowledge Graph Dashboard</a><a href="concepts.html">Concept Cards</a><a href="concepts/lazy-evaluation.html">Lazy Evaluation as UX</a><a href="concepts/provenance-chain.html">Provenance Chain</a></div></details>
        </nav>
        <div class="ribbon-actions">
          <button id="ribbon-theme-toggle" class="ribbon-icon-btn" aria-label="Toggle dark / light theme" title="Toggle dark / light theme"><span id="ribbon-theme-icon">🌙</span></button>
          <a href="demos.html" class="ribbon-btn-primary">Get Started</a>
        </div>
      </div>
    </header>'''

CSS = '''      :root { --bg:#0b0f1a; --bg-elevated:#121826; --bg-elevated-2:#1a2133; --border:#1f2937; --border-strong:#2a3548; --text:#f3f4f6; --text-muted:#9ca3af; --text-muted-2:#6b7280; --accent:#8b5cf6; --accent-2:#06b6d4; --accent-3:#f59e0b; --success:#10b981; --danger:#ef4444; --warn:#fbbf24; --info:#3b82f6; --pink:#ec4899; }
      * { box-sizing: border-box; } html, body { margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: radial-gradient(1200px 600px at 20% -10%, rgba(139,92,246,0.15), transparent 60%), radial-gradient(1200px 600px at 100% 0%, rgba(6,182,212,0.1), transparent 55%), var(--bg); color: var(--text); min-height: 100vh; line-height: 1.7; }
      #particle-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.35; }
      .ribbon { position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(139,92,246,0.25); background: linear-gradient(180deg, rgba(7,9,15,0.95) 0%, rgba(11,15,26,0.85) 100%); backdrop-filter: blur(12px); box-shadow: 0 1px 0 0 rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.4); }
      .ribbon::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: linear-gradient(90deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%); opacity: 0.7; }
      .ribbon.light { background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.92) 100%); border-bottom-color: rgba(139,92,246,0.25); }
      .ribbon-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; gap: 12px; }
      .ribbon-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text); font-weight: 600; }
      .ribbon-logo { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#06b6d4,#8b5cf6,#d946ef); color: white; font-size: 12px; font-weight: 700; }
      .ribbon-name { display: none; } @media (min-width: 600px) { .ribbon-name { display: inline; } }
      .ribbon-nav { display: flex; align-items: center; gap: 4px; }
      .ribbon-dropdown { position: relative; }
      .ribbon-dropdown > summary { list-style: none; cursor: pointer; padding: 6px 12px; border-radius: 6px; font-size: 14px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; }
      .ribbon-dropdown > summary::-webkit-details-marker { display: none; }
      .ribbon-dropdown > summary::after { content: "▾"; font-size: 10px; opacity: 0.6; }
      .ribbon-dropdown[open] > summary { background: var(--bg-elevated); color: var(--text); }
      .ribbon-menu { position: absolute; top: 100%; left: 0; margin-top: 4px; min-width: 240px; background: var(--bg-elevated); border: 1px solid var(--border-strong); border-radius: 12px; padding: 6px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 2px; max-height: 70vh; overflow: auto; }
      .ribbon-menu a { text-decoration: none; color: var(--text-muted); font-size: 13px; padding: 6px 10px; border-radius: 6px; }
      .ribbon-menu a:hover { background: var(--bg); color: var(--text); }
      .ribbon-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
      .ribbon-icon-btn { background: transparent; border: 1px solid var(--border); color: var(--text); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
      .ribbon-icon-btn:hover { border-color: var(--accent); }
      .ribbon-btn-primary { display: inline-flex; align-items: center; padding: 6px 16px; border-radius: 9999px; background: linear-gradient(90deg,#8b5cf6,#06b6d4); color: white; text-decoration: none; font-size: 13px; font-weight: 600; }
      .container { max-width: 1100px; margin: 0 auto; padding: 56px 24px 96px; position: relative; z-index: 1; }
      .crumbs { font-size: 13px; color: var(--text-muted-2); margin-bottom: 8px; }
      .crumbs a { color: var(--text-muted); text-decoration: none; }
      .tag { display: inline-block; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(139,92,246,0.3); background: rgba(139,92,246,0.1); font-size: 12px; color: var(--text); margin-bottom: 12px; backdrop-filter: blur(8px); }
      h1 { font-size: 42px; line-height: 1.1; margin: 0 0 16px; letter-spacing: -0.02em; background: linear-gradient(90deg,#fff,#c4b5fd 60%,#67e8f9); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 40px rgba(196,181,253,0.2); }
      .lead { font-size: 18px; color: var(--text-muted); max-width: 800px; margin: 0 0 32px; }
      h2 { font-size: 22px; margin: 32px 0 12px; }
      .btn { background: var(--bg-elevated-2); border: 1px solid var(--border-strong); color: var(--text); padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
      .btn:hover { border-color: var(--accent); }
      .demo-card { background: rgba(18,24,38,0.6); border: 1px solid rgba(139,92,246,0.2); border-radius: 16px; margin: 16px 0; overflow: hidden; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: border-color 0.3s ease, box-shadow 0.3s ease; }
      .demo-card:hover { border-color: rgba(139,92,246,0.4); box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.15); }
      .demo-card .card-head { padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; cursor: pointer; }
      .demo-card .card-head .card-title { font-size: 17px; font-weight: 700; color: var(--text); margin: 0; }
      .demo-card .card-head .card-desc { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
      .demo-card .card-head .chevron { transition: transform 0.3s ease; color: var(--text-muted); font-size: 18px; }
      .demo-card.open .card-head .chevron { transform: rotate(180deg); }
      .demo-card .card-body { display: none; padding: 0; }
      .demo-card.open .card-body { display: block; }
      .demo-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-elevated); }
      .demo-tabs button { padding: 10px 18px; background: transparent; border: none; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; }
      .demo-tabs button.active { color: var(--text); border-bottom-color: var(--accent); }
      .demo-tab-content { display: none; padding: 18px; }
      .demo-tab-content.active { display: block; }
      .math-panel .math-eq { font-family: "Cambria Math", Georgia, serif; font-size: 17px; color: var(--accent-2); padding: 10px 14px; background: rgba(6,182,212,0.05); border-radius: 8px; border-left: 3px solid var(--accent-2); margin: 8px 0 12px; }
      .math-panel .math-plain { font-size: 13px; color: var(--text-muted); }
      .derivation-step { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
      .derivation-step .step-math { font-family: "Cambria Math", Georgia, serif; font-size: 14px; color: var(--accent-2); margin: 6px 0 4px; padding: 6px 10px; background: rgba(6,182,212,0.05); border-radius: 6px; }
      .derivation-step .step-explain { font-size: 12px; color: var(--text-muted); }
      .code-panel .lang-toggle { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
      .code-panel .lang-toggle button { padding: 4px 10px; background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-muted); font-size: 11px; font-weight: 600; border-radius: 6px; cursor: pointer; font-family: inherit; }
      .code-panel .lang-toggle button.active { background: linear-gradient(90deg,#8b5cf6,#06b6d4); color: white; border-color: transparent; }
      pre.code-block { background: #0a0e1a; border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 12px; line-height: 1.5; overflow: auto; color: #e5e7eb; font-family: "SF Mono", Menlo, Consolas, monospace; }
      .observe-subtabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid var(--border); }
      .observe-subtabs button { padding: 6px 14px; background: transparent; border: none; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; }
      .observe-subtabs button.active { color: var(--text); border-bottom-color: var(--accent); }
      .observe-content { display: none; }
      .observe-content.active { display: block; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
      .stats-grid .stat { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
      .stats-grid .stat .l { font-size: 10px; color: var(--text-muted-2); text-transform: uppercase; letter-spacing: 0.06em; }
      .stats-grid .stat .v { font-size: 16px; font-weight: 700; color: var(--accent-2); margin-top: 2px; font-family: "SF Mono", Menlo, monospace; }
      .report-block { padding: 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; color: var(--text); line-height: 1.6; }
      .graph-block { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
      .graph-block svg { width: 100%; height: auto; display: block; }
      .summary-block ul { padding-left: 22px; color: var(--text-muted); }
      .summary-block ul li { margin-bottom: 6px; font-size: 13px; }
      .summary-block ul li strong { color: var(--text); }
      .data-table-container { overflow-x: auto; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
      .data-table-container table { width: 100%; border-collapse: collapse; }
      .data-table-container th { padding: 6px 10px; text-align: left; font-size: 11px; color: var(--text-muted-2); text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border); }
      .data-table-container td { padding: 6px 10px; font-size: 12px; color: var(--text-muted); font-family: "SF Mono", Menlo, monospace; }
      .data-table-hidden { display: none; }
      .meta { margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 13px; }
      .meta a { color: var(--text); text-decoration: none; }
      .meta a:hover { text-decoration: underline; }
      body.light { background: #fafafa; color: #18181b; }
      body.light .demo-card, body.light .derivation-step, body.light .data-table-container, body.light .stats-grid .stat, body.light .report-block, body.light .graph-block { background: white; border-color: #e5e7eb; }
      body.light .ribbon-menu, body.light .ribbon-dropdown[open] > summary { background: white; border-color: #e5e7eb; }
      body.light .lead, body.light .meta, body.light .summary-block ul, body.light .crumbs { color: #4b5563; }
      body.light .ribbon-btn-primary { color: white; }'''


def emit_loss_function(lf):
    """Emit the HTML for one loss function demo card."""
    parts = []
    parts.append(f'''      <div class="demo-card" id="demo-{lf['id']}">
        <div class="card-head" onclick="toggleDemo('demo-{lf['id']}')">
          <div>
            <p class="card-title">{html.escape(lf['name'])} <span style="font-size: 11px; color: var(--text-muted-2); margin-left: 8px;">[{html.escape(lf['category'])}]</span></p>
          </div>
          <span class="chevron">▾</span>
        </div>
        <div class="card-body">
          <div class="demo-tabs">
            <button class="active" data-tab="math">Math</button>
            <button data-tab="code">Code</button>
            <button data-tab="observe">Observe</button>
            <button data-tab="data">Data</button>
          </div>
          <!-- Math tab -->
          <div class="demo-tab-content active" data-tab="math">
            <div class="math-panel">
              <div class="math-eq">{html.escape(lf['equation'])}</div>
              <p class="math-plain">{html.escape(lf['explanation'])}</p>
            </div>
            <h4 style="font-size: 13px; margin: 16px 0 8px; color: var(--text-muted);">Math &rarr; Code derivation (5 steps)</h4>''')
    for title, math_str, explain in lf['derivation']:
        parts.append(f'''            <div class="derivation-step">
              <strong>{html.escape(title)}</strong>
              <div class="step-math">{html.escape(math_str)}</div>
              <div class="step-explain">{html.escape(explain)}</div>
            </div>''')
    # Animated-derivation canvas (Phase 28 component)
    parts.append(f'''
            <div class="anim-container" style="margin-top: 16px; padding: 16px; background: rgba(18,24,38,0.6); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-2);">🎬 Animated clip</span>
                <div style="display: flex; gap: 4px;">
                  <button class="anim-play" style="background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">▶</button>
                  <button class="anim-replay" style="background: var(--bg-elevated-2); border: 1px solid var(--border-strong); color: var(--text); padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">↺</button>
                  <button class="anim-record" style="background: var(--bg-elevated-2); border: 1px solid var(--border-strong); color: var(--text); padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">⬇</button>
                  <button class="anim-share" style="background: var(--bg-elevated-2); border: 1px solid var(--border-strong); color: var(--text); padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">🔗</button>
                </div>
              </div>
              <canvas class="anim-derivation" data-derivation-id="ml-{lf['id']}" style="display: block; max-width: 100%; height: auto; border-radius: 6px; background: #0b0f1a;"></canvas>
            </div>''')
    parts.append('''          </div>
          <!-- Code tab -->
          <div class="demo-tab-content" data-tab="code">
            <div class="code-panel">
              <div class="lang-toggle">''')
    for lang in ['python', 'rust', 'go', 'c', 'elixir', 'scala']:
        active = ' class="active"' if lang == 'python' else ''
        parts.append(f'                <button data-lang="{lang}"{active}>{lang.capitalize()}</button>')
    parts.append(f'''              </div>
              <pre class="code-block" id="code-block-{lf['id']}"></pre>
            </div>
          </div>
          <!-- Observe tab -->
          <div class="demo-tab-content" data-tab="observe">
            <div class="observe-subtabs">
              <button class="active" data-sub="stats">Stats</button>
              <button data-sub="reports">Reports</button>
              <button data-sub="graphs">Graphs</button>
              <button data-sub="summary">Summary</button>
            </div>
            <div class="observe-content active" data-sub="stats">
              <div class="stats-grid">''')
    for stat in lf['stats']:
        parts.append(f'''                <div class="stat">
                  <div class="l">{html.escape(stat['label'])}</div>
                  <div class="v">{html.escape(stat['value'])}</div>
                </div>''')
    parts.append(f'''              </div>
            </div>
            <div class="observe-content" data-sub="reports">
              <div class="report-block">{html.escape(lf['report'])}</div>
            </div>
            <div class="observe-content" data-sub="graphs">
              <div class="gts-container" data-gts-id="gts-{lf['id']}" style="padding: 16px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted-2);">Press Play to animate the table values onto the graph. Math annotations appear at inflection points.</div>
            </div>
            <div class="observe-content" data-sub="summary">
              <div class="summary-block"><ul>''')
    for s in lf['summary']:
        parts.append(f'                <li>{html.escape(s)}</li>')
    parts.append('''              </ul></div>
            </div>
          </div>
          <!-- Data tab -->
          <div class="demo-tab-content" data-tab="data">''')
    sd = lf['sample_data']
    thead = ''.join(f'<th>{html.escape(str(h))}</th>' for h in sd['headers'])
    tbody_rows = []
    for i, row in enumerate(sd['rows']):
        tds = ''.join(f'<td>{html.escape(str(c))}</td>' for c in row)
        hidden = ' data-table-hidden' if i >= 5 else ''
        tbody_rows.append(f'<tr class="data-table-row{hidden}">{tds}</tr>')
    tbody = '\n'.join(tbody_rows)
    n_hidden = max(0, len(sd['rows']) - 5)
    parts.append(f'''            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">{html.escape(sd['caption'])}</p>
            <div class="data-table-container">
              <table class="data-table" data-total-rows="{len(sd['rows'])}" data-visible-rows="5">
                <thead><tr>{thead}</tr></thead>
                <tbody>{tbody}</tbody>
              </table>
              {f'<button class="data-table-show-more" style="margin-top: 12px; background: var(--bg-elevated-2); border: 1px solid var(--border-strong); color: var(--text); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" onclick="dataTableShowMore(this)">▼ Show more ({n_hidden} hidden)</button>' if n_hidden > 0 else ''}
            </div>
          </div>
        </div>
      </div>''')
    return '\n'.join(parts)


def main():
    print(f"Generating {OUT_PATH} with {len(LOSS_FUNCTIONS)} loss function demos ...")
    parts = ['<!doctype html>',
             '<html lang="en">',
             '  <head>',
             '    <meta charset="utf-8" />',
             '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
             '    <meta name="description" content="Machine Learning Loss Functions — 9 loss functions explained with Math→Code derivation, 6-language polyglot code, observability, animated clips, and data tables. AIHPC Advanced." />',
             '    <title>Machine Learning — 9 Loss Functions — AIHPC Advanced</title>',
             '    <style>',
             CSS,
             '    </style>',
             '    <script src="animated-derivation.js"></script>\n    <script src="graph-table-sync.js"></script>',
             '  </head>',
             '  <body>',
             '    <canvas id="particle-canvas"></canvas>',
             RIBBON_HTML,
             '    <div class="container">',
             '      <p class="crumbs"><a href="index.html">Home</a> / Science / Machine Learning</p>',
             '      <span class="tag">Science &middot; Machine Learning &middot; 9 loss functions</span>',
             '      <h1>Machine Learning Loss Functions</h1>',
             '      <p class="lead">Nine loss functions explained — each with a 5-step Math→Code derivation, 6-language polyglot implementation (Python / Rust / Go / C / Elixir / Scala), observability (stats + reports + graphs + summary), an animated-derivation video clip, and a data sample table. Inspired by Greg Coquillo\'s LinkedIn post on the 9 essential ML loss functions.</p>',
             '']

    for lf in LOSS_FUNCTIONS:
        parts.append(emit_loss_function(lf))
        parts.append('')

    # Footer
    parts.append('''      <div class="meta">
        <p>&copy; 2026 AIHPC Advanced. &middot; Generated by <code>scripts/gen-ml-page.py</code>. All demos are pure client-side; no external services; data residency: downloadable only. Comments to <a href="mailto:testdemoqwenai2025@gmail.com">testdemoqwenai2025@gmail.com</a>.</p>
      </div>
    </div>

    <script>
      // ---- ClickForDemo toggle ----
      function toggleDemo(id) {
        const card = document.getElementById(id);
        if (!card) return;
        card.classList.toggle('open');
      }

      // ---- Tab switching ----
      document.querySelectorAll('.demo-card').forEach(card => {
        const tabs = card.querySelectorAll('.demo-tabs button');
        const contents = card.querySelectorAll('.demo-tab-content');
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
            contents.forEach(c => c.classList.toggle('active', c.dataset.tab === target));
          });
        });
        // Sub-tabs (Observe)
        const subs = card.querySelectorAll('.observe-subtabs button');
        const subContents = card.querySelectorAll('.observe-content');
        subs.forEach(sub => {
          sub.addEventListener('click', () => {
            const target = sub.dataset.sub;
            subs.forEach(s => s.classList.toggle('active', s.dataset.sub === target));
            subContents.forEach(c => c.classList.toggle('active', c.dataset.sub === target));
          });
        });
      });

      // ---- Code language toggle ----
      const CODE_BANK = {''')
    for lf in LOSS_FUNCTIONS:
        parts.append(f"        '{lf['id']}': {{")
        for lang, code in lf['code'].items():
            parts.append(f"          {lang}: {json.dumps(code)},")
        parts.append('        },')
    parts.append('''      };

      document.querySelectorAll('.code-panel .lang-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
          const panel = btn.closest('.code-panel');
          const card = btn.closest('.demo-card');
          if (!panel || !card) return;
          panel.querySelectorAll('.lang-toggle button').forEach(b => b.classList.toggle('active', b === btn));
          const articleId = card.id.replace(/^demo-/, '');
          const lang = btn.dataset.lang;
          const code = (CODE_BANK[articleId] || {})[lang] || '// code not available for ' + lang;
          const block = panel.querySelector('pre.code-block');
          if (block) block.textContent = code;
        });
      });

      // Initial render: set Python code for every demo on page load
      document.querySelectorAll('.demo-card').forEach(card => {
        const articleId = card.id.replace(/^demo-/, '');
        const block = card.querySelector('pre.code-block');
        if (block) block.textContent = (CODE_BANK[articleId] || {}).python || '';
      });

      // ---- Data table Show-more ----
      function dataTableShowMore(btn) {
        var table = btn.closest('.data-table-container').querySelector('.data-table');
        var visible = parseInt(table.dataset.visibleRows || '5', 10);
        var total = parseInt(table.dataset.totalRows || '0', 10);
        var newVisible = Math.min(total, visible + 10);
        var rows = table.querySelectorAll('.data-table-row');
        rows.forEach(function(r, i) {
          if (i < newVisible) r.classList.remove('data-table-hidden');
        });
        table.dataset.visibleRows = newVisible;
        var remaining = total - newVisible;
        if (remaining > 0) {
          btn.textContent = '▼ Show more (' + remaining + ' hidden)';
        } else {
          btn.textContent = '✓ All ' + total + ' rows shown';
          btn.disabled = true;
          btn.style.opacity = '0.5';
        }
      }

      // ---- Animated derivations ----''')
    # Register each loss function's derivation for the animated-derivation canvas
    for lf in LOSS_FUNCTIONS:
        steps_json = json.dumps([{"title": t, "math": m, "explain": e} for t, m, e in lf['derivation']])
        title_json = json.dumps(lf['name'])
        duration = max(8, len(lf['derivation']) * 2.4)
        parts.append(f"""
      AIHPC_ANIM.register('ml-{lf['id']}', {{
        title: {title_json},
        steps: {steps_json},
        duration: {duration:.1f},
      }});""")
    parts.append('''
      
      // ---- Phase 32: Graph-table-sync ----
      var GTS_CONFIGS = {
        'mse': { xCol: 3, yCol: 4, xLabel: 'error (y-Ey)', yLabel: 'loss (e^2)',
          curveFn: function(x) { return x * x; },
          inflectionFn: function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L=e^2=' + row[4] + ' - max error, quadratic penalty'} : null; } },
        'mae': { xCol: 3, yCol: 3, xLabel: 'error (y-Ey)', yLabel: 'loss (|e|)',
          curveFn: function(x) { return Math.abs(x); },
          inflectionFn: function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L=|e|=' + Math.abs(row[3]) + ' - max error, linear penalty'} : null; } },
        'binary-cross-entropy': { xCol: 2, yCol: 5, xLabel: 'y_hat (prob)', yLabel: 'loss',
          curveFn: function(x) { x = Math.max(1e-15, Math.min(1-1e-15, x)); return -Math.log(x); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[5]) > 3 ? {annotation: 'L=' + row[5] + ' - confident wrong'} : null; } },
        'categorical-cross-entropy': { xCol: 2, yCol: 4, xLabel: 'y_hat_true', yLabel: 'loss',
          curveFn: function(x) { return -Math.log(Math.max(1e-15, x)); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) > 3 ? {annotation: 'L=' + row[4] + ' - low confidence'} : null; } },
        'hinge-loss': { xCol: 3, yCol: 4, xLabel: 'y*y_hat (margin)', yLabel: 'loss',
          curveFn: function(x) { return Math.max(0, 1 - x); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) > 1.5 ? {annotation: 'L=' + row[4] + ' - margin violation'} : null; } },
        'log-cosh': { xCol: 3, yCol: 4, xLabel: 'error', yLabel: 'loss (log-cosh)',
          curveFn: function(x) { return Math.log(Math.cosh(x)); },
          inflectionFn: function(row, i, rows) { var mx = Math.max.apply(null, rows.map(function(r){return Math.abs(r[3]);})); return Math.abs(row[3]) === mx ? {annotation: 'L=' + row[4] + ' - large error, MAE-like'} : null; } },
        'huber-loss': { xCol: 3, yCol: 4, xLabel: '|error|', yLabel: 'Huber (delta=1.0)',
          curveFn: function(x) { return x <= 1.0 ? 0.5*x*x : 1.0*(x - 0.5); },
          inflectionFn: function(row, i, rows) { return parseFloat(row[3]) > 1.0 ? {annotation: 'L=' + row[4] + ' - beyond delta=1.0, linear'} : (Math.abs(parseFloat(row[3]) - 1.0) < 0.01 ? {annotation: 'delta threshold: quadratic->linear'} : null); } },
        'kl-divergence': { xCol: 2, yCol: 4, xLabel: 'Q(x)', yLabel: 'P*log(P/Q)',
          curveFn: null,
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) < 0 ? {annotation: 'P<Q: negative contribution'} : null; } },
        'cosine-similarity': { xCol: 3, yCol: 4, xLabel: 'cos(theta)', yLabel: 'loss=1-cos(theta)',
          curveFn: function(x) { return 1 - x; },
          inflectionFn: function(row, i, rows) { return parseFloat(row[4]) > 1.5 ? {annotation: 'L=' + row[4] + ' - anti-parallel'} : null; } },
      };
      document.querySelectorAll('.demo-card').forEach(function (card) {
        var id = card.id.replace(/^demo-/, '');
        var cfg = GTS_CONFIGS[id];
        if (!cfg) return;
        var table = card.querySelector('.data-table');
        if (!table) return;
        var headers = [];
        table.querySelectorAll('thead th').forEach(function (th) { headers.push(th.textContent.trim()); });
        var rows = [];
        table.querySelectorAll('tbody tr').forEach(function (tr) {
          var row = [];
          tr.querySelectorAll('td').forEach(function (td) { row.push(td.textContent.trim()); });
          rows.push(row);
        });
        if (headers.length && rows.length && window.AIHPC_GTS) {
          AIHPC_GTS.register('gts-' + id, {
            title: id, headers: headers, rows: rows,
            xCol: cfg.xCol, yCol: cfg.yCol, xLabel: cfg.xLabel, yLabel: cfg.yLabel,
            curveFn: cfg.curveFn, inflectionFn: cfg.inflectionFn, duration: 6,
          });
        }
      });
      document.addEventListener('DOMContentLoaded', function () { if (window.AIHPC_GTS) AIHPC_GTS.init(); });

      // ---- Particle background ----
      (function () {
        var c = document.getElementById('particle-canvas');
        if (!c) return;
        var x = c.getContext('2d');
        var W, H, P = [];
        var N = 50, cols = ['#06b6d4', '#8b5cf6', '#ec4899'];
        function r() { W = c.width = innerWidth; H = c.height = innerHeight; }
        r();
        addEventListener('resize', r);
        for (var i = 0; i < N; i++) {
          P.push({ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-.5)*.2, vy: (Math.random()-.5)*.2, r: Math.random()*1.5+.5, c: cols[i%3] });
        }
        function s() {
          x.clearRect(0, 0, W, H);
          for (var i = 0; i < N; i++) {
            for (var j = i+1; j < N; j++) {
              var d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
              if (d < 100) {
                x.strokeStyle = 'rgba(139,92,246,' + (.12*(1-d/100)) + ')';
                x.lineWidth = .5;
                x.beginPath();
                x.moveTo(P[i].x, P[i].y);
                x.lineTo(P[j].x, P[j].y);
                x.stroke();
              }
            }
          }
          for (var p of P) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
            x.fillStyle = p.c; x.globalAlpha = .4;
            x.beginPath();
            x.arc(p.x, p.y, p.r, 0, 6.28);
            x.fill();
          }
          x.globalAlpha = 1;
          requestAnimationFrame(s);
        }
        s();
      })();

      // ---- Ribbon theme toggle ----
      (function () {
        var KEY = 'aihpc-theme';
        var b = document.body, r = document.querySelector('.ribbon'), i = document.getElementById('ribbon-theme-icon');
        function a(t) {
          if (t === 'light') { b.classList.add('light'); r && r.classList.add('light'); if (i) i.textContent = '☀'; }
          else { b.classList.remove('light'); r && r.classList.remove('light'); if (i) i.textContent = '🌙'; }
        }
        var d = 'dark';
        try { var s = localStorage.getItem(KEY); if (s === 'light' || s === 'dark') d = s; else if (matchMedia('(prefers-color-scheme:light)').matches) d = 'light'; } catch (e) {}
        a(d);
        var btn = document.getElementById('ribbon-theme-toggle');
        if (btn) btn.addEventListener('click', function () { var n = b.classList.contains('light') ? 'dark' : 'light'; a(n); try { localStorage.setItem(KEY, n); } catch (e) {} });
      })();
    </script>
  </body>
</html>
''')

    html_str = '\n'.join(parts)
    assert html_str.count('<div') == html_str.count('</div>'), f"div imbalance: {html_str.count('<div')} vs {html_str.count('</div>')}"
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html_str)
    print(f"  ✓ written to: {OUT_PATH} ({len(html_str):,} bytes)")
    print(f"  loss functions: {len(LOSS_FUNCTIONS)}")
    print(f"  div balance: {html_str.count('<div')} open / {html_str.count('</div>')} close")


if __name__ == '__main__':
    main()

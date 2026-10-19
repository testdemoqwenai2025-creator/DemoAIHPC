import type { DemoManifest } from '../manifest'

/**
 * Seed demo #01 — Ordinary Least Squares (closed form).
 *
 * Mirrors the embedded demo in `docs/index.html` exactly so visitors who
 * arrive at the GitHub Pages preview see the same content that the Next.js
 * app would render at `/demos/linear-regression`.
 *
 * Browser-only, no external services. Output is downloadable (CSV).
 */
export const linearRegression: DemoManifest = {
  meta: {
    id: 'linear-regression',
    title: 'Ordinary Least Squares',
    domain: 'Statistics',
    tags: ['regression', 'linear-algebra', 'closed-form', 'ordinary-least-squares'],
    difficulty: 'introductory',
    audience: ['student', 'researcher', 'executive'],
    summary:
      'Closed-form ordinary least squares (OLS) linear regression. Math → code → annotations → observable execution trace → downloadable CSV.',
  },

  math: {
    latex: String.raw`\hat{\beta} = (X^\top X)^{-1} X^\top y`,
    plainLanguage:
      'The OLS estimator finds the coefficient vector β̂ that minimises the residual sum of squares. The closed-form solution is β̂ = (XᵀX)⁻¹Xᵀy, derived by setting the gradient of the RSS to zero (the normal equations).',
  },

  code: {
    language: 'typescript',
    source: `// Ordinary Least Squares — closed-form solution
// β̂ = (XᵀX)⁻¹ Xᵀy

function ols(X: number[][], y: number[]): number[] {
  const Xt      = transpose(X);
  const XtX     = matmul(Xt, X);
  const XtX_inv = invert2(XtX);   // 2×2 closed form
  const Xty     = matvec(Xt, y);
  return matvec(XtX_inv, Xty);    // β̂
}

function predict(beta: number[], x: number): number {
  return beta[0] + beta[1] * x;   // β₀ + β₁·x
}`,
    inputs: [
      {
        id: 'data',
        label: 'Observations (x, y)',
        type: 'data-table',
        default: [
          { x: 1, y: 2.1 },
          { x: 2, y: 3.9 },
          { x: 3, y: 6.2 },
          { x: 4, y: 8.1 },
          { x: 5, y: 10.0 },
          { x: 6, y: 11.9 },
        ],
      },
    ],
  },

  annotations: {
    student: `**What is OLS?**

Ordinary Least Squares finds the line that minimises the total squared vertical distance from each point to the line. "Squared" because squaring removes the sign — points above and below the line both count positively — and penalises big errors more than small ones.

- **β₀** is the intercept — where the line crosses the y-axis.
- **β₁** is the slope — how much y changes per unit x.
- The closed form \`β̂ = (XᵀX)⁻¹ Xᵀy\` gives the exact answer in one shot — no iteration needed.

Try editing the data table and re-running. Notice how β̂ changes when you change a single point.`,
    researcher: `**Methodology notes**

- **Model.** \`y = Xβ + ε\` with \`E[ε] = 0\` and \`Var(ε) = σ²I\`. OLS is BLUE under Gauss–Markov.
- **Closed form.** For k ≤ 3 predictors the closed-form inverse is numerically stable; for larger k use QR decomposition (\`numpy.linalg.lstsq\`) instead of explicitly inverting XᵀX.
- **Standard errors.** \`σ̂² = RSS / (n − k)\`; \`Var(β̂) = σ̂² (XᵀX)⁻¹\`. Not computed in this demo — extend by adding the diagonal of \`(XᵀX)⁻¹\` times \`σ̂²\`.
- **Assumption diagnostics** (residual normality, homoscedasticity) are intentionally out of scope here; this is the canonical estimator, not a full regression suite.`,
    executive: `**Why this matters**

Linear regression is the workhorse of business analytics — forecasting demand, sizing headcount, attribution modelling. The closed-form solution is what powers every "trend line" you see in a BI dashboard.

- **Speed.** Closed-form OLS solves in one matrix inversion. For n < 10,000 it is sub-millisecond on commodity hardware.
- **Interpretability.** β₁ tells you the marginal effect of x on y — the single number a stakeholder will quote.
- **Honesty.** The popup shows every step the computer takes. No black box. This is the audit trail your risk team will ask for.`,
  },

  datasets: {
    required: [
      {
        id: 'user-data-table',
        kind: 'upload',
        tier: 'free',
        label: 'User-provided (x, y) table',
        description:
          'Edited in the browser. Never uploaded — stays in the page. Output is downloadable as CSV.',
      },
    ],
  },

  observability: {
    metrics: [
      { id: 'beta_0', label: 'β₀ (intercept)', format: 'float' },
      { id: 'beta_1', label: 'β₁ (slope)', format: 'float' },
      { id: 'rss', label: 'Residual sum of squares', format: 'float' },
      { id: 'r2', label: 'Coefficient of determination (R²)', format: 'float' },
      { id: 'n', label: 'Observations', format: 'int' },
    ],
    traces: [
      { id: 'parse', label: 'Parse input table → X, y' },
      { id: 'xtx', label: 'Compute XᵀX' },
      { id: 'xtx-inv', label: 'Invert XᵀX (2×2 closed form)' },
      { id: 'xty', label: 'Compute Xᵀy' },
      { id: 'beta', label: 'β̂ = (XᵀX)⁻¹ Xᵀy' },
      { id: 'resid', label: 'Compute residuals & RSS' },
      { id: 'plot', label: 'Render SVG plot & table predictions' },
    ],
  },

  reports: {
    formats: ['csv', 'summary'],
  },

  runtime: 'browser',

  dataResidency: 'downloadable',
}

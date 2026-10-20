#!/usr/bin/env bash
# Phase 52: Codespaces post-create script — installs scientific Python
# packages + R packages + Julia packages, and prints a welcome message.
#
# Runs automatically when a Codespace is first created (or rebuilt).
# Total install time: ~3-5 minutes (most packages are wheels, fast).
#
# Idempotent: safe to re-run if Codespace is rebuilt.

set -e

echo ""
echo "================================================================"
echo "  AIHPC Advanced — Scientific Computing Lab (Codespaces)"
echo "================================================================"
echo "  Bootstrapping scientific computing environment…"
echo "  (this takes 3-5 minutes on first Codespace creation)"
echo "================================================================"
echo ""

# ---------------------------------------------------------------------------
# Python scientific packages
# ---------------------------------------------------------------------------
echo "📦 Installing Python scientific packages…"
pip install --quiet --upgrade pip
pip install --quiet \
  numpy \
  pandas \
  matplotlib \
  scipy \
  scikit-learn \
  sympy \
  statsmodels \
  seaborn \
  plotly \
  bokeh \
  jupyterlab \
  notebook \
  ipywidgets \
  biopython \
  rdkit \
  networkx \
  pint \
  astroquery \
  qiskit \
  pennylane \
  optuna \
  xgboost \
  lightgbm \
  || echo "⚠  Some Python packages failed to install (likely platform-specific) — continuing."

# ---------------------------------------------------------------------------
# R packages (tidyverse + scientific)
# ---------------------------------------------------------------------------
echo ""
echo "📦 Installing R scientific packages…"
Rscript -e 'install.packages(c("tidyverse", "data.table", "ggplot2", "shiny", "rmarkdown", "knitr", "caret", "forecast", "lme4", "MASS"), repos="https://cloud.r-project.org/")' || echo "⚠  Some R packages failed — continuing."

# ---------------------------------------------------------------------------
# Julia packages
# ---------------------------------------------------------------------------
echo ""
echo "📦 Installing Julia scientific packages…"
julia -e 'using Pkg; Pkg.add(["DataFrames", "Plots", "PyPlot", "StatsBase", "Distributions", "LinearAlgebra", "Flux", "QuantumOptics", "DifferentialEquations", "Optim", "JuMP"])' || echo "⚠  Some Julia packages failed — continuing."

# ---------------------------------------------------------------------------
# Node.js + Next.js (the platform itself)
# ---------------------------------------------------------------------------
echo ""
echo "📦 Installing Node.js dependencies for the Next.js app…"
if [ -f package.json ]; then
  npm install --silent || echo "⚠  npm install had issues — continuing."
else
  echo "  (no package.json found in workspace root — skipping)"
fi

# ---------------------------------------------------------------------------
# Start JupyterLab in background on port 8888
# ---------------------------------------------------------------------------
echo ""
echo "🚀 Starting JupyterLab on port 8888…"
nohup jupyter lab \
  --no-browser \
  --ip=0.0.0.0 \
  --port=8888 \
  --NotebookApp.token="" \
  --NotebookApp.password="" \
  --ServerApp.allow_origin="*" \
  > /tmp/jupyter.log 2>&1 &
echo "  (JupyterLab will be available once the Codespace is fully ready)"
echo "  Logs: tail -f /tmp/jupyter.log"

# ---------------------------------------------------------------------------
# Welcome message
# ---------------------------------------------------------------------------
echo ""
echo "================================================================"
echo "  ✓ Scientific computing environment ready"
echo "================================================================"
echo ""
echo "  Languages installed:"
echo "    • Python 3.11   (with numpy, pandas, matplotlib, scipy,"
echo "                     scikit-learn, sympy, biopython, qiskit,"
echo "                     pennylane, xgboost, lightgbm, etc.)"
echo "    • R 4.4         (with tidyverse, data.table, caret, forecast)"
echo "    • Julia 1.10    (with DataFrames, Plots, Flux, DifferentialEquations)"
echo "    • Node.js 20    (for the Next.js platform app)"
echo ""
echo "  Services running:"
echo "    • JupyterLab    on port 8888 (open in browser via VS Code port-forwarding)"
echo "    • Next.js       run \`npm run dev\` to start on port 3000"
echo ""
echo "  Free-tier quota (per GitHub account):"
echo "    • 120 core-hours/month (60 hours @ 2-core Codespace)"
echo "    • 15 GB storage"
echo "    • Check usage: https://github.com/settings/billing/summary"
echo ""
echo "  Tip: hit the quota? Run locally with:"
echo "       npm install && npm run dev"
echo ""
echo "  Documentation: https://github.com/testdemoqwenai2025-creator/DemoAIHPC#readme"
echo ""

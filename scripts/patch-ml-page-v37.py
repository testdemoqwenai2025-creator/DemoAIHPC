#!/usr/bin/env python3
"""
patch-ml-page-v37.py — Phase 37

Inserts 9 new ML demos into the LOSS_FUNCTIONS list of
scripts/gen-ml-page.py, then re-runs gen-ml-page.py + gen-ml-concept-cards.py
to regenerate docs/science-ml.html + 9 new ML concept cards.

New demos (Phase 37):
  Attention mechanisms:
    1. scaled-dot-product-attention
    2. multi-head-attention
    3. flash-attention
  Normalisation alternatives (BatchNorm already exists):
    4. layernorm
    5. rmsnorm
    6. groupnorm
    7. instancenorm
  Loss landscape:
    8. loss-landscape-3d
    9. loss-landscape-cross-section

Idempotent — checks for the marker string 'patch-ml-page-v37: APPLIED'.
"""
import os
import sys
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN_ML = os.path.join(ROOT, "scripts", "gen-ml-page.py")
MARKER = "patch-ml-page-v37: APPLIED"

# ============================================================================
# 9 new demos — full ClickForDemo spec
# ============================================================================
NEW_DEMOS = [
    # ---- 1. Scaled Dot-Product Attention ----
    {
        "id": "scaled-dot-product-attention",
        "name": "Scaled Dot-Product Attention",
        "category": "Attention",
        "equation": "Attention(Q, K, V) = softmax( (Q·K^T) / sqrt(d_k) ) · V",
        "explanation": "The foundational attention mechanism behind every Transformer. We project the query Q against every key K (dot product), scale by 1/sqrt(d_k) to prevent the softmax saturating for large d_k, apply softmax to get attention weights, and use them as weights over the value vectors V. The result is a context-aware blend of V where each query element focuses on the keys most relevant to it.",
        "derivation": [
            ("Step 1: Dot-product Q against K", "scores = Q · K^T  (shape: [seq_q, seq_k])", "For each query position, compute the similarity (dot product) against every key position. A high dot product means the query and key vectors point in the same direction in the embedding space."),
            ("Step 2: Scale by 1/sqrt(d_k)", "scaled = scores / sqrt(d_k)", "If d_k is large, dot products can be huge, which pushes softmax into regions with very small gradients (saturation). Dividing by sqrt(d_k) keeps the variance of the scores ~1 regardless of dimension."),
            ("Step 3: Softmax over keys", "weights = softmax(scaled, axis=keys)", "Apply softmax along the key axis so each row of weights sums to 1. This converts raw scores into a probability distribution over keys — the query 'attends' to keys proportional to their scaled similarity."),
            ("Step 4: Weighted sum of V", "output = weights · V", "For each query, compute a weighted average of value vectors using the attention weights. The result is a length-d_v context vector per query position — a soft, learned retrieval over the (K, V) memory."),
            ("Step 5: Why this works", "Differentiable, content-based addressing", "Unlike hard retrieval (one-hot argmax), softmax is differentiable everywhere — gradients flow back to Q, K, and V. This makes attention trainable end-to-end and is the core innovation that enabled Transformers."),
        ],
        "code": {
            "python": "# Attention(Q,K,V) = softmax(Q·K^T / sqrt(d_k)) · V\n# Q -> queries  K -> keys  V -> values  d_k -> key dim\nimport numpy as np\ndef attention(Q, K, V):\n    d_k = K.shape[-1]\n    scores = Q @ K.T / np.sqrt(d_k)\n    weights = np.exp(scores - scores.max(-1, keepdims=True))\n    weights /= weights.sum(-1, keepdims=True)\n    return weights @ V",
            "rust": "fn attention(q: &[f64], k: &[Vec<f64>], v: &[Vec<f64>]) -> Vec<f64> {\n    let d_k = k[0].len() as f64;\n    let mut scores: Vec<f64> = k.iter().map(|ki| q.iter().zip(ki).map(|(a,b)| a*b).sum::<f64>()/d_k.sqrt()).collect();\n    let m = scores.iter().cloned().fold(f64::NEG_INFINITY, f64::max);\n    for s in scores.iter_mut() { *s = (*s-m).exp(); }\n    let sum: f64 = scores.iter().sum();\n    let mut out = vec![0.0; v[0].len()];\n    for (i, &w) in scores.iter().enumerate() { for j in 0..out.len() { out[j] += (w/sum) * v[i][j]; } }\n    out\n}",
            "go": "func Attention(Q, K, V [][]float64) [][]float64 {\n\tdk := float64(len(K[0]))\n\tseqQ := len(Q); seqK := len(K); dv := len(V[0])\n\tout := make([][]float64, seqQ)\n\tfor i := 0; i < seqQ; i++ {\n\t\tscores := make([]float64, seqK)\n\t\tfor j := 0; j < seqK; j++ {\n\t\t\tfor k := 0; k < len(K[j]); k++ { scores[j] += Q[i][k] * K[j][k] }\n\t\t\tscores[j] /= math.Sqrt(dk)\n\t\t}\n\t\tm := slices.Max(scores); sum := 0.0\n\t\tfor j := range scores { scores[j] = math.Exp(scores[j]-m); sum += scores[j] }\n\t\tout[i] = make([]float64, dv)\n\t\tfor j := 0; j < dv; j++ { for s := 0; s < seqK; s++ { out[i][j] += (scores[s]/sum) * V[s][j] } }\n\t}\n\treturn out\n}",
            "c": "void attention(double* out, double* Q, double* K, double* V, int seqQ, int seqK, int dk, int dv) {\n    for (int i = 0; i < seqQ; i++) {\n        double scores[256]; double m = -INFINITY;\n        for (int j = 0; j < seqK; j++) {\n            double s = 0; for (int k = 0; k < dk; k++) s += Q[i*dk+k] * K[j*dk+k];\n            scores[j] = s / sqrt(dk); if (scores[j] > m) m = scores[j];\n        }\n        double sum = 0; for (int j = 0; j < seqK; j++) { scores[j] = exp(scores[j]-m); sum += scores[j]; }\n        for (int j = 0; j < dv; j++) out[i*dv+j] = 0;\n        for (int j = 0; j < seqK; j++) for (int k = 0; k < dv; k++) out[i*dv+k] += (scores[j]/sum) * V[j*dv+k];\n    }\n}",
            "elixir": "defmodule Attn do\n  def dot(q, k, v) do\n    dk = length(hd(k)) * 1.0\n    scores = Enum.map(k, fn ki -> Enum.zip(q, ki) |> Enum.map(fn {a,b} -> a*b end) |> Enum.sum() |> Kernel./(dk |> :math.sqrt()) end)\n    m = Enum.max(scores)\n    exp = Enum.map(scores, fn s -> :math.exp(s - m) end)\n    sum = Enum.sum(exp)\n    Enum.zip(exp, v) |> Enum.map(fn {w, vi} -> Enum.map(vi, fn x -> x * w / sum end) end) |> Enum.zip() |> Enum.map(&Enum.sum/1)\n  end\nend",
            "scala": "def attention(q: Vector[Double], k: Vector[Vector[Double]], v: Vector[Vector[Double]]): Vector[Double] = {\n  val dk = k.head.length.toDouble\n  val scores = k.map(ki => q.zip(ki).map { case (a,b) => a*b }.sum / math.sqrt(dk))\n  val m = scores.max\n  val exp = scores.map(s => math.exp(s - m))\n  val sum = exp.sum\n  v.head.indices.map(j => v.indices.map(i => exp(i)/sum * v(i)(j)).sum).toVector\n}",
        },
        "stats": [
            {"label": "Type", "value": "Self-attention"},
            {"label": "Complexity", "value": "O(seq^2 * d)"},
            {"label": "Scaling", "value": "1/sqrt(d_k)"},
            {"label": "Memory", "value": "O(seq^2)"},
            {"label": "Used in", "value": "Transformer (2017)"},
            {"label": "Parallel", "value": "Yes (no recurrence)"},
        ],
        "report": "Scaled dot-product attention is the universal building block of every Transformer variant since Vaswani et al. (2017). The 1/sqrt(d_k) scaling was crucial — without it, dot products in high dimensions saturate softmax and gradients vanish. The same equation implements self-attention, cross-attention, and causal attention by varying the (Q,K,V) inputs and applying masks. Linear attention and FlashAttention are both optimisations of this exact computation.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 30 L 80 60 L 140 90 L 200 120 L 260 90 L 320 60 L 380 30" stroke="#9ca3af" stroke-width="1.5" fill="none"/><path d="M 20 170 L 80 150 L 140 130 L 200 110 L 260 80 L 320 50 L 380 20" stroke="#06b6d4" stroke-width="2" fill="none"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">query position</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">weight / score</text><text x="300" y="20" font-size="9" fill="#06b6d4" font-family="ui-monospace">softmax weight</text><text x="300" y="35" font-size="9" fill="#9ca3af" font-family="ui-monospace">raw score</text></svg>',
        "summary": [
            "Attention = softmax(Q·K^T / sqrt(d_k)) · V — differentiable retrieval.",
            "1/sqrt(d_k) prevents softmax saturation in high dim (gradients vanish otherwise).",
            "O(seq^2) memory — the cost of attention's expressiveness.",
            "Foundation of all Transformer variants since Vaswani et al. 2017.",
        ],
        "sample_data": {
            "headers": ["q·k", "scaled", "exp(s)", "weight", "v·weight"],
            "rows": [["3.5", "1.10", "3.01", "0.10", "0.50"], ["7.2", "2.27", "9.69", "0.32", "1.60"], ["5.0", "1.58", "4.85", "0.16", "0.80"], ["9.8", "3.10", "22.18", "0.74", "3.70"], ["2.0", "0.63", "1.88", "0.06", "0.30"]],
            "caption": "Scaled dot-product attention weights (d_k=10) — softmax concentrates on key with highest scaled score",
        },
    },

    # ---- 2. Multi-Head Attention ----
    {
        "id": "multi-head-attention",
        "name": "Multi-Head Attention",
        "category": "Attention",
        "equation": "MultiHead(Q,K,V) = Concat(head_1, ..., head_h) W_O;  head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V)",
        "explanation": "Instead of a single attention with d_model-dim queries/keys/values, split into h parallel heads each with d_model/h dimensions. Each head learns a different attention pattern — head 1 might attend to syntax, head 2 to coreference, head 3 to entity types, etc. The outputs are concatenated and projected back to d_model with W_O.",
        "derivation": [
            ("Step 1: Linear projections per head", "Q_i = Q · W_i^Q, K_i = K · W_i^K, V_i = V · W_i^V", "Project the d_model-dim Q, K, V to d_k = d_model/h dimensions per head. Each head has its own learned projection matrices W_i^Q, W_i^K, W_i^V — this is what allows heads to specialise."),
            ("Step 2: Independent attention per head", "head_i = Attention(Q_i, K_i, V_i)", "Each head runs the standard scaled dot-product attention in parallel. The h attention patterns are computed independently — no communication between heads during the forward pass."),
            ("Step 3: Concatenate heads", "concat = [head_1; head_2; ...; head_h]", "Stack the h outputs of shape [seq, d_v] along the feature axis to get [seq, h*d_v]. Since d_v = d_model/h, this concatenation restores the d_model dimension."),
            ("Step 4: Output projection", "output = concat · W_O", "Apply a learned projection W_O of shape [d_model, d_model] to mix the information from all heads. This projection is what lets the model combine head outputs (e.g., 'head 2 said token is a verb, head 5 says it agrees with subject')."),
            ("Step 5: Cost / benefit", "Same FLOPs as single-head (h heads * d_model/h dim = d_model)", "Multi-head has approximately the same compute cost as single-head attention with full dimension. The benefit is that heads can specialise — empirically, heads learn to track syntax, coreference, rare words, etc. Ablating individual heads often barely affects performance, suggesting redundancy."),
        ],
        "code": {
            "python": "# MultiHead = Concat(head_1..h) W_O; head_i = Attn(Q·W_iQ, K·W_iK, V·W_iV)\n# h -> num_heads  W_iQ/W_iK/W_iV -> per-head projections  W_O -> output mix\nimport numpy as np\ndef multi_head_attention(Q, K, V, Wq, Wk, Wv, Wo):\n    heads = []\n    for h in range(len(Wq)):\n        head = attention(Q @ Wq[h], K @ Wk[h], V @ Wv[h])  # reuse single-head fn\n        heads.append(head)\n    return np.concatenate(heads, axis=-1) @ Wo",
            "rust": "fn multi_head(q: &[f64], k: &[f64], v: &[f64], h: usize, d_model: usize, w: &[f64]) -> Vec<f64> {\n    let dk = d_model / h;\n    let mut out = vec![0.0; d_model];\n    for head in 0..h {\n        let qh = &q[head*dk..(head+1)*dk];\n        let kh = &k[head*dk..(head+1)*dk];\n        let vh = &v[head*dk..(head+1)*dk];\n        let head_out = attention(qh, &[kh.to_vec()], &[vh.to_vec()]);\n        for j in 0..dk { out[head*dk + j] = head_out[j]; }\n    }\n    out\n}",
            "go": "func MultiHead(Q, K, V [][]float64, h int) [][]float64 {\n\tseq := len(Q); dmodel := len(Q[0]); dk := dmodel / h\n\tout := make([][]float64, seq)\n\tfor s := 0; s < seq; s++ { out[s] = make([]float64, dmodel) }\n\tfor head := 0; head < h; head++ {\n\t\tfor s := 0; s < seq; s++ {\n\t\t\tvar score float64\n\t\t\tfor j := 0; j < dk; j++ { score += Q[s][head*dk+j] * K[s][head*dk+j] }\n\t\t\tscore /= math.Sqrt(float64(dk))\n\t\t\tw := math.Exp(score) / math.Exp(0) // simplified 1-head\n\t\t\tfor j := 0; j < dk; j++ { out[s][head*dk+j] = w * V[s][head*dk+j] }\n\t\t}\n\t}\n\treturn out\n}",
            "c": "void multi_head(double* Q, double* K, double* V, double* out, int seq, int d_model, int h) {\n    int dk = d_model / h;\n    for (int head = 0; head < h; head++) {\n        for (int s = 0; s < seq; s++) {\n            double score = 0;\n            for (int j = 0; j < dk; j++) score += Q[s*d_model + head*dk + j] * K[s*d_model + head*dk + j];\n            score /= sqrt(dk);\n            double w = exp(score);\n            for (int j = 0; j < dk; j++) out[s*d_model + head*dk + j] = w * V[s*d_model + head*dk + j];\n        }\n    }\n}",
            "elixir": "defmodule MHA do\n  def run(q, k, v, h) do\n    dmodel = length(hd(q))\n    dk = div(dmodel, h)\n    for head <- 0..(h-1) do\n      qh = Enum.map(q, fn row -> Enum.slice(row, head*dk, dk) end)\n      kh = Enum.map(k, fn row -> Enum.slice(row, head*dk, dk) end)\n      vh = Enum.map(v, fn row -> Enum.slice(row, head*dk, dk) end)\n      Attn.dot(hd(qh), kh, vh)\n    end\n  end\nend",
            "scala": "def multiHead(Q: Vector[Vector[Double]], K: Vector[Vector[Double]], V: Vector[Vector[Double]], h: Int): Vector[Vector[Double]] = {\n  val dmodel = Q.head.length; val dk = dmodel / h\n  Q.indices.map { s =>\n    (0 until h).flatMap { head =>\n      val qh = Q(s).slice(head*dk, (head+1)*dk)\n      val kh = K(s).slice(head*dk, (head+1)*dk)\n      val vh = V(s).slice(head*dk, (head+1)*dk)\n      val score = qh.zip(kh).map { case (a,b) => a*b }.sum / math.sqrt(dk)\n      val w = math.exp(score)\n      vh.map(_ * w)\n    }.toVector\n  }\n}",
        },
        "stats": [
            {"label": "Type", "value": "Multi-head"},
            {"label": "Heads (typical)", "value": "8 or 16"},
            {"label": "Per-head dim", "value": "d_model / h"},
            {"label": "Total params", "value": "4 * d_model^2"},
            {"label": "Used in", "value": "GPT, BERT, T5"},
            {"label": "Head redundancy", "value": "High (some prunable)"},
        ],
        "report": "Multi-head attention runs h parallel attention computations, each with d_model/h-dimensional projections, then concatenates and re-projects with W_O. Heads empirically learn specialised roles: syntax, coreference, entity types, long-range dependencies. Pruning literature shows many heads can be removed at inference with minimal quality loss — suggesting redundancy is by design, providing robustness against random head failure during training.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 100 L 100 80 L 180 90 L 260 110 L 340 100 L 380 100" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M 20 100 L 100 90 L 180 70 L 260 100 L 340 110 L 380 100" stroke="#8b5cf6" stroke-width="2" fill="none"/><path d="M 20 100 L 100 110 L 180 130 L 260 80 L 340 90 L 380 100" stroke="#ec4899" stroke-width="2" fill="none"/><path d="M 20 100 L 100 120 L 180 100 L 260 90 L 340 80 L 380 100" stroke="#f59e0b" stroke-width="2" fill="none"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">query position</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">head output</text><text x="320" y="20" font-size="9" fill="#06b6d4" font-family="ui-monospace">head 1 (syntax)</text><text x="320" y="35" font-size="9" fill="#8b5cf6" font-family="ui-monospace">head 2 (coref)</text><text x="320" y="50" font-size="9" fill="#ec4899" font-family="ui-monospace">head 3 (rare)</text><text x="320" y="65" font-size="9" fill="#f59e0b" font-family="ui-monospace">head 4 (entity)</text></svg>',
        "summary": [
            "Multi-head = h parallel attentions + output projection W_O.",
            "Each head learns specialised attention (syntax, coreference, entities, ...).",
            "Total cost ≈ single-head (h * d_model/h = d_model).",
            "Pruning shows many heads are redundant — robust by design.",
        ],
        "sample_data": {
            "headers": ["head", "specialisation", "argmax over keys", "loss if pruned"],
            "rows": [["1", "syntax (subject-verb)", "token 5", "0.2%"], ["2", "coreference", "token 12", "0.5%"], ["3", "rare-word lookup", "token 47", "1.8%"], ["4", "entity type", "token 3", "0.1%"], ["5", "positional fallback", "token 0", "0.4%"]],
            "caption": "Multi-head attention specialisations observed in BERT (Voita et al. 2019) — pruning one head rarely hurts",
        },
    },

    # ---- 3. Flash Attention ----
    {
        "id": "flash-attention",
        "name": "FlashAttention",
        "category": "Attention",
        "equation": "Attention(Q,K,V) computed via tiling + online-softmax — never materialises the full N×N matrix",
        "explanation": "FlashAttention (Dao et al. 2022) computes the exact same attention as scaled dot-product, but reorders the computation to avoid materialising the full N×N attention matrix in HBM. Instead, it loads tiles of Q, K, V into SRAM, computes a partial softmax that can be merged incrementally ('online softmax'), and writes only the final output back. Result: same numbers, 2-4x faster, 10x less memory.",
        "derivation": [
            ("Step 1: Tiling", "Load Q[i:i+B_q], K[j:j+B_k], V[j:j+B_k] into SRAM", "GPU SRAM (~192KB/SM) is 100x faster than HBM (~3TB/s, 80GB). Standard attention writes the full NxN score matrix to HBM then reads it back for softmax. FlashAttention instead processes Q,K,V in tiles that fit in SRAM."),
            ("Step 2: Online softmax", "m_new = max(m_old, m_tile); s_new = exp(m_old - m_new) * s_old + sum(exp(s_tile - m_new))", "Normally softmax needs the max over the full row. 'Online softmax' (Milan Puzic / Nikolay Dryden) shows we can update the running max and running sum incrementally as we see each K tile. This is the key trick that makes attention tileable."),
            ("Step 3: Partial output", "o_partial = sum(exp(s_tile - m_new)) * V_tile / s_new", "For each K tile, compute the partial weighted sum of V. Maintain the running normaliser s_new so the partial output can be correctly reweighted when new tiles arrive."),
            ("Step 4: Recompute backward", "Recompute attention in backward pass instead of storing the N×N matrix", "Standard autograd stores the N×N softmax weights for the backward pass. FlashAttention recomputes them — trades compute for memory. Since SRAM is so fast, the recompute is faster than the saved HBM I/O."),
            ("Step 5: Why it matters", "10x memory → enables 32K context GPT, training not possible otherwise", "Standard attention at seq=32K needs ~4GB just for the score matrix. FlashAttention needs ~512MB — enabling long-context LLMs (GPT-4 128K, Claude 200K, Gemini 1M). The exact same mathematics, just reordered for the memory hierarchy."),
        ],
        "code": {
            "python": "# FlashAttention: tile Q,K,V; online softmax; recompute backward\n# m -> running max  s -> running sum  o -> running output\n# B_q, B_k -> tile sizes (fit in SRAM)\nimport numpy as np\ndef flash_attention(Q, K, V, Bq=64, Bk=64):\n    N, d = Q.shape\n    O = np.zeros((N, d)); m = np.full(N, -np.inf); s = np.zeros(N)\n    for i in range(0, N, Bq):\n        for j in range(0, N, Bk):\n            q_tile = Q[i:i+Bq]                  # load to SRAM\n            k_tile = K[j:j+Bk]; v_tile = V[j:j+Bk]\n            scores = q_tile @ k_tile.T / np.sqrt(d)\n            m_tile = scores.max(-1)\n            p = np.exp(scores - m_tile[:, None])\n            s_tile = p.sum(-1)\n            # update running max + sum (online softmax)\n            m_new = np.maximum(m[i:i+Bq], m_tile)\n            s_old = s[i:i+Bq] * np.exp(m[i:i+Bq] - m_new)\n            s_new = s_tile * np.exp(m_tile - m_new)\n            s_total = s_old + s_new\n            # reweight existing O + add new partial\n            O[i:i+Bq] = (O[i:i+Bq] * s_old[:, None] + p @ v_tile) / s_total[:, None]\n            m[i:i+Bq] = m_new; s[i:i+Bq] = s_total\n    return O",
            "rust": "fn flash_attn(q: &[f64], k: &[f64], v: &[f64], n: usize, d: usize) -> Vec<f64> {\n    let mut o = vec![0.0; n*d]; let mut m = vec![f64::NEG_INFINITY; n]; let mut s = vec![0.0; n];\n    for i in 0..n {\n        for j in 0..n {\n            let mut score = 0.0; for t in 0..d { score += q[i*d+t]*k[j*d+t]; } score /= (d as f64).sqrt();\n            let m_new = m[i].max(score);\n            let p_old = if s[i] > 0.0 { (m[i]-m_new).exp() * s[i] } else { 0.0 };\n            let p_new = (score - m_new).exp();\n            let s_new = p_old + p_new;\n            for t in 0..d { o[i*d+t] = (o[i*d+t] * p_old + p_new * v[j*d+t]) / s_new; }\n            m[i] = m_new; s[i] = s_new;\n        }\n    }\n    o\n}",
            "go": "func FlashAttn(Q, K, V []float64, n, d int) []float64 {\n\tout := make([]float64, n*d); m := make([]float64, n); s := make([]float64, n)\n\tfor i := range m { m[i] = math.Inf(-1) }\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tvar score float64\n\t\t\tfor t := 0; t < d; t++ { score += Q[i*d+t] * K[j*d+t] }\n\t\t\tscore /= math.Sqrt(float64(d))\n\t\t\tmNew := math.Max(m[i], score)\n\t\t\tpOld := 0.0; if s[i] > 0 { pOld = math.Exp(m[i]-mNew) * s[i] }\n\t\t\tpNew := math.Exp(score - mNew)\n\t\t\tsNew := pOld + pNew\n\t\t\tfor t := 0; t < d; t++ { out[i*d+t] = (out[i*d+t]*pOld + pNew*V[j*d+t]) / sNew }\n\t\t\tm[i] = mNew; s[i] = sNew\n\t\t}\n\t}\n\treturn out\n}",
            "c": "void flash_attn(double* Q, double* K, double* V, double* O, int n, int d) {\n    for (int i = 0; i < n; i++) { O[i] = 0; double m = -INFINITY; double s = 0;\n        for (int j = 0; j < n; j++) {\n            double score = 0; for (int t = 0; t < d; t++) score += Q[i*d+t]*K[j*d+t];\n            score /= sqrt(d);\n            double m_new = fmax(m, score);\n            double p_old = (s > 0) ? exp(m - m_new) * s : 0;\n            double p_new = exp(score - m_new);\n            double s_new = p_old + p_new;\n            for (int t = 0; t < d; t++) O[i*d+t] = (O[i*d+t]*p_old + p_new*V[j*d+t]) / s_new;\n            m = m_new; s = s_new;\n        }\n    }\n}",
            "elixir": "defmodule Flash do\n  def attn(q, k, v, n, d) do\n    Enum.reduce(0..(n-1), {List.duplicate(0.0, d), -1.0e99, 0.0}, fn i, {o, m, s} ->\n      Enum.reduce(0..(n-1), {o, m, s}, fn j, {o_acc, m_acc, s_acc} ->\n        score = Enum.zip(q, k) |> Enum.with_index |> Enum.map(fn {{a, b}, t} -> a * b end) |> Enum.sum\n        score = score / :math.sqrt(d * 1.0)\n        m_new = max(m_acc, score)\n        p_old = if s_acc > 0, do: :math.exp(m_acc - m_new) * s_acc, else: 0.0\n        p_new = :math.exp(score - m_new)\n        s_new = p_old + p_new\n        o_new = Enum.zip(o_acc, v) |> Enum.map(fn {x, y} -> (x*p_old + p_new*y) / s_new end)\n        {o_new, m_new, s_new}\n      end)\n    end)\n  end\nend",
            "scala": "def flashAttn(q: Vector[Double], k: Vector[Double], v: Vector[Double], n: Int, d: Int): Vector[Double] = {\n  var o = Vector.fill(d)(0.0); var m = Double.NegativeInfinity; var s = 0.0\n  for (j <- 0 until n) {\n    val score = q.zip(k.slice(j*d, (j+1)*d)).map { case (a,b) => a*b }.sum / math.sqrt(d)\n    val mNew = math.max(m, score)\n    val pOld = if (s > 0) math.exp(m - mNew) * s else 0.0\n    val pNew = math.exp(score - mNew)\n    val sNew = pOld + pNew\n    o = o.zip(v.slice(j*d, (j+1)*d)).map { case (x, y) => (x*pOld + pNew*y) / sNew }\n    m = mNew; s = sNew\n  }\n  o\n}",
        },
        "stats": [
            {"label": "Type", "value": "Memory-efficient"},
            {"label": "IO complexity", "value": "O(N^2 * d / M) (M=SRAM)"},
            {"label": "Maths", "value": "Exact (not approx)"},
            {"label": "Backward", "value": "Recomputed"},
            {"label": "Speed", "value": "2-4x faster"},
            {"label": "Memory", "value": "10x less"},
        ],
        "report": "FlashAttention (Dao et al. 2022) is the algorithmic breakthrough that enabled long-context LLMs. The exact same scaled dot-product attention is computed, but the loops are reordered to keep data in GPU SRAM (192KB/SM, 100x faster than HBM). The 'online softmax' technique (incremental max + sum updates) makes tiling possible. Backward recomputes the score matrix — trading FLOPs for memory, which is faster because SRAM is so much faster than HBM. Result: 32K → 200K contexts become tractable; GPT-4, Claude, Gemini all use FlashAttention variants.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 170 L 100 160 L 180 140 L 260 100 L 320 60 L 380 30" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M 20 170 L 100 170 L 180 168 L 260 160 L 320 150 L 380 140" stroke="#f59e0b" stroke-width="2" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">seq length</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">memory / time</text><text x="280" y="30" font-size="9" fill="#06b6d4" font-family="ui-monospace">FlashAttn (flat)</text><text x="280" y="140" font-size="9" fill="#f59e0b" font-family="ui-monospace">Standard (N^2)</text></svg>',
        "summary": [
            "FlashAttention = same math, tile-Q/K/V + online softmax + recompute backward.",
            "Avoids materialising N×N matrix in HBM — 10x less memory, 2-4x faster.",
            "Online softmax: m_new = max(m_old, m_tile); s_new = s_old*exp(...) + sum(exp(...)).",
            "Enabled long-context LLMs (GPT-4 128K, Claude 200K, Gemini 1M).",
        ],
        "sample_data": {
            "headers": ["seq", "std-mem (GB)", "flash-mem (GB)", "std-time (ms)", "flash-time (ms)"],
            "rows": [["512", "0.05", "0.01", "1.2", "0.5"], ["2048", "0.83", "0.04", "19", "5.4"], ["8192", "13.1", "0.16", "302", "85"], ["32768", "209.7", "0.65", "4830", "1380"], ["131072", "3355", "2.6", "(OOM)", "22000"]],
            "caption": "FlashAttention benchmarks (d=128, A100 80GB) — same numbers, 10x less memory, ~3.5x faster",
        },
    },

    # ---- 4. LayerNorm ----
    {
        "id": "layernorm",
        "name": "Layer Normalisation",
        "category": "Normalisation",
        "equation": "y = gamma * (x - mu) / sqrt(sigma^2 + eps) + beta  where mu = mean over feature axis",
        "explanation": "LayerNorm normalises each token's feature vector independently — the mean and variance are computed across the feature axis (not the batch axis like BatchNorm). This makes LayerNorm independent of batch size and works identically at train and inference — a key advantage for transformers and RNNs where batch size varies.",
        "derivation": [
            ("Step 1: Per-token statistics", "mu = mean(x over feature axis);  sigma^2 = var(x over feature axis)", "For each token in each sample, compute the mean and variance across the d_model features. Unlike BatchNorm (statistics over batch), LayerNorm statistics are per-token — no batch dependency."),
            ("Step 2: Normalise", "x_hat = (x - mu) / sqrt(sigma^2 + eps)", "Subtract the per-token mean and divide by the per-token std. eps = 1e-5 prevents division by zero. The result has zero mean and unit variance per token — stabilises gradient flow through deep stacks."),
            ("Step 3: Affine transform", "y = gamma * x_hat + beta", "gamma and beta are learned per-feature parameters. They allow the network to undo normalisation if unhelpful (gamma = sqrt(sigma^2), beta = mu recovers x). Without the affine, every layer's output would be forced to unit variance."),
            ("Step 4: Inference (no running stats needed)", "Same as training — mu and sigma^2 computed on the fly", "Unlike BatchNorm (which needs running averages for inference), LayerNorm uses live statistics. This means batch size 1 works at inference and there's no train/test mismatch."),
            ("Step 5: Why Transformers use it", "Stable through 100+ layers + no batch dependency", "LayerNorm is the standard normaliser for Transformers because (a) it stabilises gradients through 100+ stacked attention+MLP blocks, (b) it doesn't depend on batch size — critical for inference and gradient accumulation, (c) it works in autoregressive decoding where 'batch' is one token. RMSNorm is a popular simplification (drop the mean-centering)."),
        ],
        "code": {
            "python": "# y = gamma * (x - mu) / sqrt(sigma^2 + eps) + beta\n# mu, sigma^2 -> per-token stats over feature axis  gamma, beta -> learned\nimport numpy as np\ndef layernorm(x, gamma=1.0, beta=0.0, eps=1e-5):\n    mu = x.mean(axis=-1, keepdims=True)\n    var = x.var(axis=-1, keepdims=True)\n    return gamma * (x - mu) / np.sqrt(var + eps) + beta",
            "rust": "fn layernorm(x: &[f64], gamma: f64, beta: f64, eps: f64) -> Vec<f64> {\n    let n = x.len() as f64;\n    let mu: f64 = x.iter().sum::<f64>() / n;\n    let var: f64 = x.iter().map(|v| (v - mu).powi(2)).sum::<f64>() / n;\n    x.iter().map(|v| gamma * (v - mu) / (var + eps).sqrt() + beta).collect()\n}",
            "go": "func LayerNorm(x []float64, gamma, beta, eps float64) []float64 {\n\tn := float64(len(x))\n\tvar mu, v float64\n\tfor _, xi := range x { mu += xi }\n\tmu /= n\n\tfor _, xi := range x { v += (xi - mu) * (xi - mu) }\n\tv /= n\n\tfor i, xi := range x { x[i] = gamma*(xi-mu)/math.Sqrt(v+eps) + beta }\n\treturn x\n}",
            "c": "void layernorm(double* x, int n, double gamma, double beta, double eps) {\n    double mu = 0; for (int i = 0; i < n; i++) mu += x[i]; mu /= n;\n    double var = 0; for (int i = 0; i < n; i++) var += (x[i]-mu)*(x[i]-mu); var /= n;\n    for (int i = 0; i < n; i++) x[i] = gamma * (x[i] - mu) / sqrt(var + eps) + beta;\n}",
            "elixir": "defmodule LN do\n  def f(x, gamma, beta, eps) do\n    n = length(x) * 1.0\n    mu = Enum.sum(x) / n\n    var = Enum.map(x, fn v -> (v - mu) * (v - mu) end) |> Enum.sum() / n\n    Enum.map(x, fn v -> gamma * (v - mu) / :math.sqrt(var + eps) + beta end)\n  end\nend",
            "scala": "def layernorm(x: Array[Double], gamma: Double = 1.0, beta: Double = 0.0, eps: Double = 1e-5): Array[Double] = {\n  val n = x.length.toDouble\n  val mu = x.sum / n\n  val v = x.map(xi => (xi - mu) * (xi - mu)).sum / n\n  x.map(xi => gamma * (xi - mu) / math.sqrt(v + eps) + beta)\n}",
        },
        "stats": [
            {"label": "Type", "value": "Per-token"},
            {"label": "Axis", "value": "Feature (last)"},
            {"label": "Batch dep", "value": "No"},
            {"label": "Train/inference", "value": "Same"},
            {"label": "Learned", "value": "gamma + beta"},
            {"label": "Used in", "value": "Transformer, GPT, BERT"},
        ],
        "report": "LayerNorm normalises each token's feature vector independently — the mean and variance are computed over the d_model features (not over the batch like BatchNorm). This makes LayerNorm independent of batch size and identical between train and inference. It is the standard normaliser for Transformers because it stabilises gradients through 100+ stacked layers and works for autoregressive decoding where 'batch' is just one token. RMSNorm (below) is a popular simplification.",
        "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d=\"M 20 60 L 50 50 L 80 70 L 110 40 L 140 80 L 170 30 L 200 90 L 230 50 L 260 70 L 290 40 L 320 80 L 380 50\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/><path d=\"M 20 100 L 80 95 L 140 105 L 200 95 L 260 105 L 320 95 L 380 100\" stroke=\"#06b6d4\" stroke-width=\"2\" fill=\"none\"/><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">feature index</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">activation</text><text x=\"290\" y=\"60\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">before</text><text x=\"290\" y=\"95\" font-size=\"9\" fill=\"#06b6d4\" font-family=\"ui-monospace\">after (stable)</text></svg>',
        "summary": [
            "LayerNorm = gamma * (x - mu) / sqrt(sigma^2 + eps) + beta — per-token.",
            "Statistics over the feature axis (not batch axis) — no batch dependency.",
            "Identical at train and inference — no running averages needed.",
            "Standard normaliser for Transformers (GPT, BERT, T5, Llama).",
        ],
        "sample_data": {
            "headers": ["x", "(x - mu)", "(x-mu)/std", "y = gamma*x_hat+beta"],
            "rows": [["-1.5", "-2.0", "-1.41", "-0.41"], ["-0.5", "-1.0", "-0.71", "0.29"], ["0.5", "0.0", "0.0", "1.0"], ["1.5", "1.0", "0.71", "1.71"], ["2.5", "2.0", "1.41", "2.41"]],
            "caption": "LayerNorm sample (mu=0.5, std=1.41, gamma=1.0, beta=1.0) — per-token stats identical at train + inference",
        },
    },

    # ---- 5. RMSNorm ----
    {
        "id": "rmsnorm",
        "name": "RMS Normalisation",
        "category": "Normalisation",
        "equation": "y = gamma * x / sqrt(mean(x^2) + eps)  — no mean-centering, no beta",
        "explanation": "RMSNorm (Zhang & Sennrich 2019) is a simplification of LayerNorm: drop the mean-centering (no subtraction of mu) and drop the bias term beta. Only the root-mean-square (RMS) is used to scale. Empirically works as well as LayerNorm at slightly lower compute cost (no mean computation). Used in Llama, Qwen, Mistral, Gemma.",
        "derivation": [
            ("Step 1: Compute RMS (no mean!)", "rms = sqrt( (1/d) * sum(x_i^2) )", "Root-mean-square of the feature vector. This is just the L2 norm scaled by 1/sqrt(d). Skipping the mean-centering saves one reduction — slightly less compute than LayerNorm."),
            ("Step 2: Scale", "x_hat = x / (rms + eps)", "Divide each feature by the RMS. The output has RMS = 1 (regardless of input scale). No mean-centering means the output preserves the sign of the input — the relative pattern is unchanged."),
            ("Step 3: Affine (gamma only)", "y = gamma * x_hat", "Only a learned scale gamma per feature — no beta. The intuition: mean-centering and beta are mostly redundant — gamma alone can re-scale to any desired variance; the mean shift is rarely needed."),
            ("Step 4: No beta", "Drop beta — saves params + FLOPs", "Removing beta halves the affine params and removes one addition. Empirically, models with RMSNorm match LayerNorm-trained models within noise. The slight compute saving compounds across 100+ layers and trillions of tokens."),
            ("Step 5: Why Llama uses it", "Same quality, slightly faster, simpler code", "Llama, Qwen, Mistral, Gemma, DeepSeek all use RMSNorm. The reason: LayerNorm's mean-centering adds compute without measurable quality benefit. RMSNorm is the de-facto normaliser for production LLMs since 2023."),
        ],
        "code": {
            "python": "# y = gamma * x / sqrt(mean(x^2) + eps)\n# rms -> root-mean-square (no mean!)  gamma -> learned scale (no beta)\nimport numpy as np\ndef rmsnorm(x, gamma=1.0, eps=1e-6):\n    rms = np.sqrt(np.mean(x**2) + eps)\n    return gamma * x / rms",
            "rust": "fn rmsnorm(x: &[f64], gamma: f64, eps: f64) -> Vec<f64> {\n    let n = x.len() as f64;\n    let ms: f64 = x.iter().map(|v| v * v).sum::<f64>() / n;\n    let rms = (ms + eps).sqrt();\n    x.iter().map(|v| gamma * v / rms).collect()\n}",
            "go": "func RMSNorm(x []float64, gamma, eps float64) []float64 {\n\tn := float64(len(x))\n\tvar ms float64\n\tfor _, v := range x { ms += v * v }\n\tms /= n\n\trms := math.Sqrt(ms + eps)\n\tfor i, v := range x { x[i] = gamma * v / rms }\n\treturn x\n}",
            "c": "void rmsnorm(double* x, int n, double gamma, double eps) {\n    double ms = 0; for (int i = 0; i < n; i++) ms += x[i]*x[i]; ms /= n;\n    double rms = sqrt(ms + eps);\n    for (int i = 0; i < n; i++) x[i] = gamma * x[i] / rms;\n}",
            "elixir": "defmodule RMS do\n  def f(x, gamma, eps) do\n    n = length(x) * 1.0\n    ms = Enum.map(x, fn v -> v * v end) |> Enum.sum() / n\n    rms = :math.sqrt(ms + eps)\n    Enum.map(x, fn v -> gamma * v / rms end)\n  end\nend",
            "scala": "def rmsnorm(x: Array[Double], gamma: Double = 1.0, eps: Double = 1e-6): Array[Double] = {\n  val n = x.length.toDouble\n  val ms = x.map(v => v * v).sum / n\n  val rms = math.sqrt(ms + eps)\n  x.map(v => gamma * v / rms)\n}",
        },
        "stats": [
            {"label": "Type", "value": "Per-token (no mean)"},
            {"label": "Params", "value": "gamma only"},
            {"label": "FLOPs", "value": "~7/8 of LayerNorm"},
            {"label": "Quality", "value": "Same as LayerNorm"},
            {"label": "Used in", "value": "Llama, Qwen, Mistral, Gemma"},
            {"label": "Year", "value": "2019"},
        ],
        "report": "RMSNorm (Zhang & Sennrich 2019) drops the mean-centering and beta from LayerNorm — only the root-mean-square is used to scale, with a single learned gamma per feature. Empirically matches LayerNorm quality at ~12% less compute. The de-facto normaliser for production LLMs since 2023 (Llama 2/3/4, Qwen, Mistral, Gemma, DeepSeek).",
        "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><path d=\"M 20 30 L 80 60 L 140 100 L 200 140 L 260 100 L 320 60 L 380 30\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/><path d=\"M 20 80 L 80 95 L 140 110 L 200 120 L 260 110 L 320 95 L 380 80\" stroke=\"#06b6d4\" stroke-width=\"2\" fill=\"none\"/><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">feature</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">activation</text><text x=\"290\" y=\"30\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">before (wild)</text><text x=\"290\" y=\"80\" font-size=\"9\" fill=\"#06b6d4\" font-family=\"ui-monospace\">after (RMS=1)</text></svg>',
        "summary": [
            "RMSNorm = gamma * x / sqrt(mean(x^2) + eps) — no mean, no beta.",
            "Drops mean-centering — saves ~12% FLOPs vs LayerNorm.",
            "Same quality as LayerNorm within noise.",
            "Standard for production LLMs since 2023 (Llama, Qwen, Mistral, Gemma).",
        ],
        "sample_data": {
            "headers": ["x", "x^2", "x/sqrt(mean(x^2))", "y = gamma*x_hat"],
            "rows": [["-1.5", "2.25", "-1.18", "-1.18"], ["-0.5", "0.25", "-0.39", "-0.39"], ["0.5", "0.25", "0.39", "0.39"], ["1.5", "2.25", "1.18", "1.18"], ["2.0", "4.0", "1.57", "1.57"]],
            "caption": "RMSNorm sample (mean(x^2)=1.61, gamma=1.0, eps=1e-6) — sign preserved, RMS=1 after",
        },
    },

    # ---- 6. GroupNorm ----
    {
        "id": "groupnorm",
        "name": "Group Normalisation",
        "category": "Normalisation",
        "equation": "y = gamma * (x - mu_g) / sqrt(sigma_g^2 + eps) + beta  where mu_g, sigma_g^2 over groups of channels",
        "explanation": "GroupNorm (Wu & He 2018) is the middle ground between LayerNorm (normalise all features per token) and InstanceNorm (normalise each feature independently). Features are split into G groups; statistics are computed within each group. This is the natural normaliser for CNNs with small batch sizes (e.g. detection/segmentation where batch=1-2 per GPU) where BatchNorm fails.",
        "derivation": [
            ("Step 1: Reshape features into G groups", "x reshaped to [B, G, C/G, H, W]", "Take a tensor of shape [B, C, H, W] and reshape the C channels into G groups of C/G channels each. Typical G = 32 — each group contains C/32 channels that are normalised together."),
            ("Step 2: Compute group statistics", "mu_g = mean over (C/G, H, W);  sigma_g^2 = var over (C/G, H, W)", "For each sample B and each group g, compute the mean and variance across all C/G channels and all spatial positions H,W. The statistics are independent of batch — GroupNorm works at any batch size."),
            ("Step 3: Normalise", "x_hat = (x - mu_g) / sqrt(sigma_g^2 + eps)", "Each element is normalised by its group's statistics. Channels within the same group share stats — providing cross-channel information sharing. Different groups have independent stats — providing diversity."),
            ("Step 4: Affine", "y = gamma * x_hat + beta  (per channel)", "gamma and beta are learned per-channel (not per-group). This allows each channel to re-scale and re-shift independently — critical because different channels may encode different feature types (edges, textures, colors)."),
            ("Step 5: When to use", "CNNs with small batch (detection, segmentation, video)", "BatchNorm fails when batch size is small (≤4) — batch statistics are noisy. GroupNorm is batch-independent, making it ideal for object detection (Fast/Faster R-CNN train at batch=2/GPU), segmentation (U-Net batch=1), and video (3D CNNs with tiny batches)."),
        ],
        "code": {
            "python": "# y = gamma * (x - mu_g) / sqrt(sigma_g^2 + eps) + beta\n# mu_g, sigma_g^2 -> stats within group of channels  G -> num groups\nimport numpy as np\ndef groupnorm(x, gamma=1.0, beta=0.0, G=32, eps=1e-5):\n    # x shape: [C, H, W] -> [G, C//G, H, W]\n    xg = x.reshape(G, -1)\n    mu = xg.mean(axis=-1, keepdims=True)\n    var = xg.var(axis=-1, keepdims=True)\n    xh = (xg - mu) / np.sqrt(var + eps)\n    return (gamma * xh.reshape(x.shape) + beta).astype(x.dtype)",
            "rust": "fn groupnorm(x: &mut [f64], c: usize, hw: usize, g: usize, gamma: f64, beta: f64, eps: f64) {\n    let cg = c / g;\n    for grp in 0..g {\n        let mut sum = 0.0; let mut sq_sum = 0.0; let n = (cg * hw) as f64;\n        for ci in 0..cg { for hw_i in 0..hw { let v = x[(grp*cg+ci)*hw + hw_i]; sum += v; sq_sum += v*v; } }\n        let mu = sum / n; let var = sq_sum/n - mu*mu;\n        let inv_std = 1.0 / (var + eps).sqrt();\n        for ci in 0..cg { for hw_i in 0..hw { let idx = (grp*cg+ci)*hw + hw_i; x[idx] = gamma * (x[idx] - mu) * inv_std + beta; } }\n    }\n}",
            "go": "func GroupNorm(x []float64, c, hw, g int, gamma, beta, eps float64) []float64 {\n\tcg := c / g\n\tfor grp := 0; grp < g; grp++ {\n\t\tvar sum, sq float64; n := float64(cg * hw)\n\t\tfor ci := 0; ci < cg; ci++ { for h := 0; h < hw; h++ { v := x[(grp*cg+ci)*hw+h]; sum += v; sq += v*v } }\n\t\tmu := sum / n; v := sq/n - mu*mu; invStd := 1.0 / math.Sqrt(v+eps)\n\t\tfor ci := 0; ci < cg; ci++ { for h := 0; h < hw; h++ { idx := (grp*cg+ci)*hw + h; x[idx] = gamma*(x[idx]-mu)*invStd + beta } }\n\t}\n\treturn x\n}",
            "c": "void groupnorm(double* x, int c, int hw, int g, double gamma, double beta, double eps) {\n    int cg = c / g;\n    for (int grp = 0; grp < g; grp++) {\n        double sum = 0, sq = 0; int n = cg * hw;\n        for (int ci = 0; ci < cg; ci++) for (int h = 0; h < hw; h++) { double v = x[(grp*cg+ci)*hw + h]; sum += v; sq += v*v; }\n        double mu = sum / n; double v = sq/n - mu*mu; double inv_std = 1.0 / sqrt(v + eps);\n        for (int ci = 0; ci < cg; ci++) for (int h = 0; h < hw; h++) { int idx = (grp*cg+ci)*hw + h; x[idx] = gamma*(x[idx]-mu)*inv_std + beta; }\n    }\n}",
            "elixir": "defmodule GN do\n  def f(x, g, gamma, beta, eps) do\n    per = div(length(x), g)\n    Enum.chunk_every(x, per) |> Enum.flat_map(fn group ->\n      n = per * 1.0\n      mu = Enum.sum(group) / n\n      var = Enum.map(group, fn v -> (v - mu)*(v - mu) end) |> Enum.sum() / n\n      Enum.map(group, fn v -> gamma * (v - mu) / :math.sqrt(var + eps) + beta end)\n    end)\n  end\nend",
            "scala": "def groupnorm(x: Array[Double], g: Int, gamma: Double = 1.0, beta: Double = 0.0, eps: Double = 1e-5): Array[Double] = {\n  val per = x.length / g\n  (for (grp <- 0 until g) yield {\n    val group = x.slice(grp*per, (grp+1)*per)\n    val n = per.toDouble\n    val mu = group.sum / n\n    val v = group.map(v => (v - mu) * (v - mu)).sum / n\n    group.map(v => gamma * (v - mu) / math.sqrt(v + eps) + beta)\n  }).flatten.toArray\n}",
        },
        "stats": [
            {"label": "Type", "value": "Per-group"},
            {"label": "Group size", "value": "C/G channels"},
            {"label": "Batch dep", "value": "No"},
            {"label": "Typical G", "value": "32"},
            {"label": "Used in", "value": "Detection / segmentation"},
            {"label": "Year", "value": "2018"},
        ],
        "report": "GroupNorm (Wu & He 2018) normalises groups of channels together — the middle ground between LayerNorm (all C channels together) and InstanceNorm (each channel independently). Independent of batch size, so it's the natural choice when batch sizes are tiny (object detection at batch=2, segmentation at batch=1, video 3D CNNs at batch=1). When G=1 it becomes LayerNorm; when G=C it becomes InstanceNorm — the spectrum is unified.",
        "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><rect x=\"30\" y=\"40\" width=\"80\" height=\"30\" fill=\"rgba(139,92,246,0.3)\" stroke=\"#8b5cf6\"/><rect x=\"30\" y=\"80\" width=\"80\" height=\"30\" fill=\"rgba(6,182,212,0.3)\" stroke=\"#06b6d4\"/><rect x=\"30\" y=\"120\" width=\"80\" height=\"30\" fill=\"rgba(236,72,153,0.3)\" stroke=\"#ec4899\"/><rect x=\"130\" y=\"40\" width=\"80\" height=\"30\" fill=\"rgba(139,92,246,0.3)\" stroke=\"#8b5cf6\"/><rect x=\"130\" y=\"80\" width=\"80\" height=\"30\" fill=\"rgba(6,182,212,0.3)\" stroke=\"#06b6d4\"/><rect x=\"130\" y=\"120\" width=\"80\" height=\"30\" fill=\"rgba(236,72,153,0.3)\" stroke=\"#ec4899\"/><text x=\"70\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">group 1</text><text x=\"170\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">group 2</text><text x=\"70\" y=\"35\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">channels 0-31</text></svg>',
        "summary": [
            "GroupNorm = gamma * (x - mu_g) / sqrt(sigma_g^2 + eps) + beta — per-group.",
            "Spectrum: G=1 → LayerNorm; G=C → InstanceNorm — unified.",
            "Independent of batch size — works at batch=1.",
            "Standard for detection/segmentation where batch is tiny.",
        ],
        "sample_data": {
            "headers": ["group", "channels", "mu_g", "sigma_g^2", "after-norm range"],
            "rows": [["1", "0-31", "0.42", "1.18", "[-2.1, 2.3]"], ["2", "32-63", "-0.18", "0.91", "[-1.8, 1.9]"], ["3", "64-95", "0.05", "1.02", "[-2.0, 2.1]"], ["4", "96-127", "0.61", "1.45", "[-1.6, 2.5]"]],
            "caption": "GroupNorm on a 128-channel feature map (G=4) — each group normalises 32 channels together",
        },
    },

    # ---- 7. InstanceNorm ----
    {
        "id": "instancenorm",
        "name": "Instance Normalisation",
        "category": "Normalisation",
        "equation": "y = gamma * (x - mu_c) / sqrt(sigma_c^2 + eps) + beta  where mu_c per-sample per-channel",
        "explanation": "InstanceNorm (Ulyanov et al. 2016) normalises each channel of each sample independently — like a per-channel LayerNorm but with statistics computed per-sample-per-channel (over the spatial axes only). Originally designed for style transfer — InstanceNorm normalises image contrast/style without normalising content. Now also used in GANs (BigGAN, StyleGAN) and diffusion models (DDPM).",
        "derivation": [
            ("Step 1: Per-sample per-channel stats", "mu_c = mean(x over H, W);  sigma_c^2 = var(x over H, W)", "For each sample B and each channel C, compute the mean and variance over the spatial axes (H, W). The statistics are independent of batch and independent across channels — each (B, C) pair has its own stats."),
            ("Step 2: Normalise", "x_hat = (x - mu_c) / sqrt(sigma_c^2 + eps)", "Each element is normalised by its channel's statistics. The output has zero mean and unit variance per (B, C) — image content (relative structure) is preserved, but absolute contrast (per-channel scale) is removed."),
            ("Step 3: Affine", "y = gamma * x_hat + beta  (per channel, optional)", "Unlike BatchNorm where affine is critical, InstanceNorm's affine is often dropped (e.g. in StyleGAN where gamma/beta come from style modulation). When present, gamma/beta are per-channel."),
            ("Step 4: Style transfer insight", "Normalises contrast = removes style, preserves content", "In style transfer, content is the spatial structure (edges, shapes), style is the per-channel statistics (contrast, color). InstanceNorm normalises per-channel statistics → removes style → forces the network to generate output with the target's per-channel statistics → matches target style."),
            ("Step 5: Use cases", "Style transfer, GANs (BigGAN, StyleGAN), diffusion models", "InstanceNorm is the standard normaliser for generative models where per-image statistics matter. In diffusion models (DDPM, Stable Diffusion), InstanceNorm (or a GroupNorm-with-G=...) provides per-image normalisation that helps the model handle diverse input scales."),
        ],
        "code": {
            "python": "# y = gamma * (x - mu_c) / sqrt(sigma_c^2 + eps) + beta\n# mu_c, sigma_c^2 -> per-sample per-channel stats over spatial axes\nimport numpy as np\ndef instancenorm(x, gamma=1.0, beta=0.0, eps=1e-5):\n    # x shape: [C, H, W]\n    mu = x.mean(axis=(-2, -1), keepdims=True)\n    var = x.var(axis=(-2, -1), keepdims=True)\n    return gamma * (x - mu) / np.sqrt(var + eps) + beta",
            "rust": "fn instancenorm(x: &mut [f64], c: usize, hw: usize, gamma: f64, beta: f64, eps: f64) {\n    for ci in 0..c {\n        let mut sum = 0.0; let mut sq = 0.0; let n = hw as f64;\n        for h in 0..hw { let v = x[ci*hw + h]; sum += v; sq += v*v; }\n        let mu = sum / n; let var = sq/n - mu*mu; let inv_std = 1.0 / (var + eps).sqrt();\n        for h in 0..hw { let idx = ci*hw + h; x[idx] = gamma * (x[idx] - mu) * inv_std + beta; }\n    }\n}",
            "go": "func InstanceNorm(x []float64, c, hw int, gamma, beta, eps float64) []float64 {\n\tfor ci := 0; ci < c; ci++ {\n\t\tvar sum, sq float64; n := float64(hw)\n\t\tfor h := 0; h < hw; h++ { v := x[ci*hw+h]; sum += v; sq += v*v }\n\t\tmu := sum / n; v := sq/n - mu*mu; invStd := 1.0 / math.Sqrt(v+eps)\n\t\tfor h := 0; h < hw; h++ { idx := ci*hw + h; x[idx] = gamma*(x[idx]-mu)*invStd + beta }\n\t}\n\treturn x\n}",
            "c": "void instancenorm(double* x, int c, int hw, double gamma, double beta, double eps) {\n    for (int ci = 0; ci < c; ci++) {\n        double sum = 0, sq = 0;\n        for (int h = 0; h < hw; h++) { double v = x[ci*hw + h]; sum += v; sq += v*v; }\n        double mu = sum / hw; double v = sq/hw - mu*mu; double inv_std = 1.0 / sqrt(v + eps);\n        for (int h = 0; h < hw; h++) { int idx = ci*hw + h; x[idx] = gamma * (x[idx] - mu) * inv_std + beta; }\n    }\n}",
            "elixir": "defmodule IN do\n  def f(x, gamma, beta, eps) do\n    Enum.map(x, fn row ->\n      n = length(row) * 1.0\n      mu = Enum.sum(row) / n\n      var = Enum.map(row, fn v -> (v - mu)*(v - mu) end) |> Enum.sum() / n\n      Enum.map(row, fn v -> gamma * (v - mu) / :math.sqrt(var + eps) + beta end)\n    end)\n  end\nend",
            "scala": "def instancenorm(x: Array[Array[Double]], gamma: Double = 1.0, beta: Double = 0.0, eps: Double = 1e-5): Array[Array[Double]] = {\n  x.map { row =>\n    val n = row.length.toDouble\n    val mu = row.sum / n\n    val v = row.map(v => (v - mu) * (v - mu)).sum / n\n    row.map(v => gamma * (v - mu) / math.sqrt(v + eps) + beta)\n  }\n}",
        },
        "stats": [
            {"label": "Type", "value": "Per-sample per-channel"},
            {"label": "Axes", "value": "H, W only"},
            {"label": "Batch dep", "value": "No"},
            {"label": "Style transfer", "value": "Removes style"},
            {"label": "Used in", "value": "StyleGAN, BigGAN, DDPM"},
            {"label": "Year", "value": "2016"},
        ],
        "report": "InstanceNorm (Ulyanov et al. 2016) normalises each channel of each sample independently — statistics over the spatial axes only, per (B, C) pair. Originally for style transfer: normalising per-channel statistics removes style (contrast, color) while preserving content (structure). Now standard in GANs (StyleGAN, BigGAN) and diffusion models (DDPM, Stable Diffusion) where per-image normalisation helps with diverse scales.",
        "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><rect x=\"30\" y=\"40\" width=\"100\" height=\"30\" fill=\"rgba(139,92,246,0.3)\" stroke=\"#8b5cf6\"/><rect x=\"150\" y=\"40\" width=\"100\" height=\"30\" fill=\"rgba(6,182,212,0.3)\" stroke=\"#06b6d4\"/><rect x=\"270\" y=\"40\" width=\"100\" height=\"30\" fill=\"rgba(236,72,153,0.3)\" stroke=\"#ec4899\"/><text x=\"80\" y=\"30\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">ch 0 (mu=0.42, std=1.1)</text><text x=\"200\" y=\"30\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">ch 1 (mu=-0.18, std=0.95)</text><text x=\"320\" y=\"30\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">ch 2 (mu=0.05, std=1.0)</text><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">spatial position</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">pixel</text></svg>',
        "summary": [
            "InstanceNorm = gamma * (x - mu_c) / sqrt(sigma_c^2 + eps) + beta — per (B, C).",
            "Statistics over spatial axes only — preserves content, removes contrast.",
            "Style transfer: normalising per-channel stats removes style.",
            "Standard in StyleGAN, BigGAN, DDPM, Stable Diffusion.",
        ],
        "sample_data": {
            "headers": ["channel", "H×W positions", "mu_c", "sigma_c", "after-norm range"],
            "rows": [["0 (red)", "32×32", "0.42", "1.10", "[-2.1, 2.3]"], ["1 (green)", "32×32", "-0.18", "0.95", "[-1.9, 2.1]"], ["2 (blue)", "32×32", "0.05", "1.00", "[-2.0, 2.0]"], ["3 (alpha)", "32×32", "0.78", "1.30", "[-1.6, 1.4]"]],
            "caption": "InstanceNorm on a 4-channel RGBA image (32×32) — each channel normalised independently",
        },
    },

    # ---- 8. Loss Landscape 3D ----
    {
        "id": "loss-landscape-3d",
        "name": "Loss Landscape (3D Surface)",
        "category": "Loss Landscape",
        "equation": "L(theta_1, theta_2) = a*(theta_1 - b)^2 + c*(theta_2 - d)^2 + e*sin(f*theta_1)*cos(g*theta_2)",
        "explanation": "Visualise a 2D parameter space (theta_1, theta_2) and the loss as a height field — a 3D surface plot. Real loss landscapes are high-dimensional (millions of parameters), but 2D slices reveal fundamental structure: convex bowls (MSE), saddle points (deep networks), ravines (momentum helps), and flat minima (good generalisation). Visualising trajectories of SGD/Adam/AdamW on this surface shows how each optimiser navigates differently.",
        "derivation": [
            ("Step 1: Define the 2D loss surface", "L(theta_1, theta_2) = quadratic + sinusoidal perturbation", "Mix a convex quadratic (bowl shape) with sinusoidal perturbations to create local minima. The quadratic gives a global structure (ravine, saddle, etc.); the perturbation adds multimodality — closer to real deep-net losses."),
            ("Step 2: Compute gradient", "dL/dtheta_1 = 2a*(theta_1-b) + e*f*cos(f*theta_1)*cos(g*theta_2);  dL/dtheta_2 = 2c*(theta_2-d) - e*g*sin(f*theta_1)*sin(g*theta_2)", "Analytic gradients. In practice these would be autograd-computed, but for a 2D toy loss we can write them by hand — useful for debugging optimiser implementations."),
            ("Step 3: Pick starting point", "theta_0 = random or specified", "Choose an initial parameter vector. For loss landscape visualisations, picking theta_0 far from the minimum shows the optimiser's traversal behaviour — SGD oscillates in ravines, Adam damps oscillations, etc."),
            ("Step 4: Run optimiser", "theta_t+1 = theta_t - eta * grad(theta_t)", "Apply the update rule of the chosen optimiser (SGD, Momentum, Adam, AdamW). Record the trajectory (theta_0, theta_1, ..., theta_T) for visualisation."),
            ("Step 5: Plot trajectory on surface", "3D surface (theta_1, theta_2, L) + overlay (theta_t trajectory)", "Plot the loss as a 3D surface, then overlay the optimiser's trajectory as a coloured line. Different optimisers trace different paths — this is the pedagogical payoff of the 3D loss landscape."),
        ],
        "code": {
            "python": "# L = a*(t1-b)^2 + c*(t2-d)^2 + e*sin(f*t1)*cos(g*t2)\n# t1, t2 -> parameters  L -> loss height  a..g -> landscape constants\nimport numpy as np\ndef loss_landscape(t1, t2, a=1.0, b=0.5, c=1.0, d=0.5, e=0.3, f=3.0, g=3.0):\n    return a*(t1-b)**2 + c*(t2-d)**2 + e*np.sin(f*t1)*np.cos(g*t2)\ndef grad_landscape(t1, t2, a=1.0, b=0.5, c=1.0, d=0.5, e=0.3, f=3.0, g=3.0):\n    g1 = 2*a*(t1-b) + e*f*np.cos(f*t1)*np.cos(g*t2)\n    g2 = 2*c*(t2-d) - e*g*np.sin(f*t1)*np.sin(g*t2)\n    return np.array([g1, g2])",
            "rust": "fn loss_landscape(t1: f64, t2: f64) -> f64 {\n    1.0*(t1-0.5).powi(2) + 1.0*(t2-0.5).powi(2) + 0.3*(3.0*t1).sin()*(3.0*t2).cos()\n}\nfn grad_landscape(t1: f64, t2: f64) -> (f64, f64) {\n    let g1 = 2.0*(t1-0.5) + 0.3*3.0*(3.0*t1).cos()*(3.0*t2).cos();\n    let g2 = 2.0*(t2-0.5) - 0.3*3.0*(3.0*t1).sin()*(3.0*t2).sin();\n    (g1, g2)\n}",
            "go": "func LossLandscape(t1, t2 float64) float64 {\n\treturn (t1-0.5)*(t1-0.5) + (t2-0.5)*(t2-0.5) + 0.3*math.Sin(3*t1)*math.Cos(3*t2)\n}\nfunc GradLandscape(t1, t2 float64) (float64, float64) {\n\tg1 := 2*(t1-0.5) + 0.3*3*math.Cos(3*t1)*math.Cos(3*t2)\n\tg2 := 2*(t2-0.5) - 0.3*3*math.Sin(3*t1)*math.Sin(3*t2)\n\treturn g1, g2\n}",
            "c": "double loss_landscape(double t1, double t2) {\n    return (t1-0.5)*(t1-0.5) + (t2-0.5)*(t2-0.5) + 0.3*sin(3*t1)*cos(3*t2);\n}\nvoid grad_landscape(double t1, double t2, double* g1, double* g2) {\n    *g1 = 2*(t1-0.5) + 0.3*3*cos(3*t1)*cos(3*t2);\n    *g2 = 2*(t2-0.5) - 0.3*3*sin(3*t1)*sin(3*t2);\n}",
            "elixir": "defmodule LL do\n  def loss(t1, t2) do\n    1.0*:math.pow(t1-0.5, 2) + 1.0*:math.pow(t2-0.5, 2) + 0.3*:math.sin(3*t1)*:math.cos(3*t2)\n  end\n  def grad(t1, t2) do\n    g1 = 2.0*(t1-0.5) + 0.3*3.0*:math.cos(3*t1)*:math.cos(3*t2)\n    g2 = 2.0*(t2-0.5) - 0.3*3.0*:math.sin(3*t1)*:math.sin(3*t2)\n    {g1, g2}\n  end\nend",
            "scala": "def lossLandscape(t1: Double, t2: Double): Double =\n  (t1-0.5)*(t1-0.5) + (t2-0.5)*(t2-0.5) + 0.3*math.sin(3*t1)*math.cos(3*t2)\ndef gradLandscape(t1: Double, t2: Double): (Double, Double) = {\n  val g1 = 2*(t1-0.5) + 0.3*3*math.cos(3*t1)*math.cos(3*t2)\n  val g2 = 2*(t2-0.5) - 0.3*3*math.sin(3*t1)*math.sin(3*t2)\n  (g1, g2)\n}",
        },
        "stats": [
            {"label": "Type", "value": "2D parameter slice"},
            {"label": "Surface", "value": "Quadratic + sinusoid"},
            {"label": "Minima", "value": "Global + local"},
            {"label": "Visualisation", "value": "3D surface + trajectory"},
            {"label": "Optimisers", "value": "SGD, Adam, AdamW"},
            {"label": "Use", "value": "Pedagogical"},
        ],
        "report": "A 2D loss landscape visualisation plots the loss as a height field over a 2D parameter space — the closest we can get to 'seeing' optimisation dynamics. Real deep-net losses are 100M+ dimensional, but 2D slices reveal qualitative structure: convex bowls (MSE), saddle points (deep networks), ravines (where momentum helps), flat minima (good generalisation). Overlaying SGD/Adam/AdamW trajectories shows why adaptive methods damp oscillations and converge faster.",
        "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><defs><linearGradient id=\"lava\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#fbbf24\"/><stop offset=\"50%\" stop-color=\"#ec4899\"/><stop offset=\"100%\" stop-color=\"#8b5cf6\"/></linearGradient></defs><path d=\"M 20 180 Q 80 60 140 100 Q 200 20 260 80 Q 320 30 380 100 L 380 180 Z\" fill=\"url(#lava)\" opacity=\"0.5\"/><path d=\"M 20 170 Q 80 70 140 110 Q 200 30 260 90 Q 320 40 380 110\" stroke=\"#fff\" stroke-width=\"1.5\" fill=\"none\" opacity=\"0.4\"/><path d=\"M 20 170 L 50 110 L 80 90 L 110 70 L 140 60 L 200 50 L 260 55\" stroke=\"#06b6d4\" stroke-width=\"2\" fill=\"none\"/><circle cx=\"260\" cy=\"55\" r=\"4\" fill=\"#06b6d4\"/><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">theta_1 (parameter)</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">loss height</text><text x=\"290\" y=\"50\" font-size=\"9\" fill=\"#06b6d4\" font-family=\"ui-monospace\">SGD trajectory</text></svg>',
        "summary": [
            "Loss landscape = 2D parameter slice with loss as height.",
            "Quadratic + sinusoidal perturbation — bowl + local minima.",
            "3D surface plot overlays optimiser trajectories.",
            "SGD oscillates in ravines; Adam/AdamW damp oscillations and converge faster.",
        ],
        "sample_data": {
            "headers": ["theta_1", "theta_2", "L(theta)", "grad_t1", "grad_t2"],
            "rows": [["0.10", "0.10", "0.361", "-0.615", "-0.615"], ["0.25", "0.25", "0.169", "-0.296", "-0.296"], ["0.40", "0.40", "0.030", "-0.099", "-0.099"], ["0.50", "0.50", "0.000", "0.000", "0.000"], ["0.60", "0.60", "0.030", "0.099", "0.099"]],
            "caption": "Loss landscape values (a=c=1, b=d=0.5, e=0.3, f=g=3) — global minimum at (0.5, 0.5)",
        },
    },

    # ---- 9. Loss Landscape Cross-Section ----
    {
        "id": "loss-landscape-cross-section",
        "name": "Loss Landscape (Cross-Section)",
        "category": "Loss Landscape",
        "equation": "L(alpha) = L(theta_0 + alpha * direction)  — 1D slice along a direction",
        "explanation": "A 1D cross-section of the loss landscape — fix a starting point theta_0 and a direction vector, vary a scalar alpha, plot L. Cross-sections are the standard tool for visualising sharp vs flat minima: a sharp minimum has steep walls (high curvature), a flat minimum has shallow walls. Flat minima generalise better (Keskar et al. 2017) — they're more robust to small parameter perturbations.",
        "derivation": [
            ("Step 1: Choose direction", "direction = random unit vector or Hessian eigenvector", "Pick a direction in parameter space. Random directions give a generic slice; Hessian eigenvectors (sorted by eigenvalue) give the directions of maximum/minimum curvature — most informative for sharp vs flat analysis."),
            ("Step 2: Vary alpha", "theta(alpha) = theta_0 + alpha * direction", "Move along the direction vector by step alpha. Plot L(theta(alpha)) as a function of alpha. The shape of this curve tells us about the local geometry around theta_0."),
            ("Step 3: Measure curvature", "kappa = L''(0) ≈ (L(h) - 2*L(0) + L(-h)) / h^2", "Finite-difference second derivative at theta_0. High curvature = sharp minimum; low curvature = flat minimum. The Hessian's top eigenvalue is the maximum curvature over all directions."),
            ("Step 4: Compare minima", "Sharp: deep + narrow;  Flat: shallow + wide", "Keskar et al. (2017) showed that sharp minima (high curvature) correlate with poor generalisation; flat minima (low curvature) correlate with good generalisation. Large-batch SGD finds sharp minima; small-batch SGD finds flat minima — the noise escapes sharp basins."),
            ("Step 5: Generalisation principle", "Flat = robust to perturbation = better test loss", "A flat minimum is robust to small parameter changes (e.g., the test set perturbs the loss landscape slightly). A sharp minimum is sensitive — small parameter shifts drastically change the loss. This is why SGD with small batches tends to generalise better than large-batch methods."),
        ],
        "code": {
            "python": "# L(alpha) = L(theta_0 + alpha * direction)\n# alpha -> scalar step  direction -> unit vector in parameter space\nimport numpy as np\ndef loss_cross_section(theta0, direction, alpha, L):\n    return L(theta0 + alpha * direction)\ndef curvature_at(theta0, direction, L, h=1e-3):\n    L0 = L(theta0)\n    Lp = L(theta0 + h*direction)\n    Lm = L(theta0 - h*direction)\n    return (Lp - 2*L0 + Lm) / (h*h)",
            "rust": "fn loss_cross<F: Fn(f64) -> f64>(alpha: f64, l: F) -> f64 { l(alpha) }\nfn curvature<F: Fn(f64) -> f64>(l: &F, h: f64) -> f64 {\n    let l0 = l(0.0); let lp = l(h); let lm = l(-h);\n    (lp - 2.0*l0 + lm) / (h*h)\n}",
            "go": "func Curvature(L func(float64) float64, h float64) float64 {\n\tl0 := L(0); lp := L(h); lm := L(-h)\n\treturn (lp - 2*l0 + lm) / (h * h)\n}",
            "c": "typedef double (*LossFn)(double);\ndouble curvature(LossFn L, double h) {\n    double l0 = L(0); double lp = L(h); double lm = L(-h);\n    return (lp - 2*l0 + lm) / (h*h);\n}",
            "elixir": "defmodule CS do\n  def curvature(l, h) do\n    l0 = l.(0.0); lp = l.(h); lm = l.(-h)\n    (lp - 2*l0 + lm) / (h*h)\n  end\nend",
            "scala": "def curvature(L: Double => Double, h: Double = 1e-3): Double = {\n  val l0 = L(0); val lp = L(h); val lm = L(-h)\n  (lp - 2*l0 + lm) / (h*h)\n}",
        },
        "stats": [
            {"label": "Type", "value": "1D slice"},
            {"label": "Direction", "value": "Random or Hessian eigenvec"},
            {"label": "Curvature", "value": "L''(0) via finite diff"},
            {"label": "Sharp vs Flat", "value": "Keskar 2017"},
            {"label": "Generalisation", "value": "Flat > Sharp"},
            {"label": "Batch effect", "value": "Small batch → flat"},
        ],
        "report": "A 1D cross-section of the loss landscape — fix theta_0, vary a scalar alpha along a direction, plot L(theta_0 + alpha*direction). The shape of this curve tells us about sharp vs flat minima. Keskar et al. (2017) showed that sharp minima (high curvature) generalise worse than flat minima. Small-batch SGD noise escapes sharp basins → finds flat minima → better test loss. This is why practitioners using large batches need explicit regularisation (weight decay, label smoothing) — to compensate for losing the natural noise that finds flat minima.",
        "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><path d=\"M 20 60 L 80 30 L 140 90 L 200 170 L 260 90 L 320 30 L 380 60\" stroke=\"#06b6d4\" stroke-width=\"2\" fill=\"none\"/><path d=\"M 20 100 L 80 80 L 140 90 L 200 130 L 260 90 L 320 80 L 380 100\" stroke=\"#ec4899\" stroke-width=\"2\" fill=\"none\" stroke-dasharray=\"3 3\"/><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">alpha (step along direction)</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">loss</text><text x=\"280\" y=\"30\" font-size=\"9\" fill=\"#06b6d4\" font-family=\"ui-monospace\">sharp (k=85)</text><text x=\"280\" y=\"80\" font-size=\"9\" fill=\"#ec4899\" font-family=\"ui-monospace\">flat (k=12)</text></svg>',
        "summary": [
            "Cross-section = L(theta_0 + alpha * direction) — 1D slice of high-dim loss.",
            "Curvature = L''(0) via finite differences — sharp (high) vs flat (low).",
            "Flat minima generalise better than sharp (Keskar et al. 2017).",
            "Small-batch SGD noise escapes sharp basins — finds flat minima.",
        ],
        "sample_data": {
            "headers": ["alpha", "L (sharp)", "L (flat)", "sharp k", "flat k"],
            "rows": [["-0.10", "0.85", "0.12", "85", "12"], ["-0.05", "0.21", "0.03", "85", "12"], ["0.00", "0.00", "0.00", "85", "12"], ["0.05", "0.21", "0.03", "85", "12"], ["0.10", "0.85", "0.12", "85", "12"]],
            "caption": "Sharp vs flat minimum cross-sections — flat is 7x wider, ~7x more robust to parameter perturbation",
        },
    },
]


# ============================================================================
# Patching logic
# ============================================================================

def patch_gen_ml_page() -> int:
    """Insert new demos into the LOSS_FUNCTIONS list right before its closing `]`."""
    if not os.path.exists(GEN_ML):
        print(f"ERROR: {GEN_ML} not found", file=sys.stderr)
        return 2

    src = open(GEN_ML, encoding="utf-8").read()
    if MARKER in src:
        print("patch-ml-page-v37: already applied (marker found). Skipping.")
        return 0

    # Build new demo entries (Python dict literals).
    def esc_str(s: str) -> str:
        """Escape a string for embedding in a double-quoted Python string literal."""
        # Order matters: backslash first, then quotes, then newlines/tabs.
        s = s.replace("\\", "\\\\")
        s = s.replace('"', '\\"')
        s = s.replace("\n", "\\n")
        s = s.replace("\t", "\\t")
        return s

    new_entries = []
    for demo in NEW_DEMOS:
        # Render each demo as a Python literal dict — careful with quotes
        lines = ["    {"]
        for key, value in demo.items():
            if isinstance(value, str):
                v = esc_str(value)
                lines.append(f'        "{key}": "{v}",')
            elif isinstance(value, list) and value and isinstance(value[0], tuple):
                # derivation list of tuples
                lines.append(f'        "{key}": [')
                for tup in value:
                    parts = []
                    for x in tup:
                        if isinstance(x, str):
                            parts.append(f'"{esc_str(x)}"')
                        else:
                            parts.append(repr(x))
                    lines.append("            (" + ", ".join(parts) + "),")
                lines.append("        ],")
            elif isinstance(value, list):
                lines.append(f'        "{key}": [')
                for item in value:
                    if isinstance(item, dict):
                        # dict of strings
                        sub = []
                        for k2, v2 in item.items():
                            sub.append(f'"{k2}": "{esc_str(str(v2))}"')
                        lines.append("            {" + ", ".join(sub) + "},")
                    else:
                        # raw
                        s = esc_str(str(item))
                        lines.append(f'            "{s}",')
                lines.append("        ],")
            elif isinstance(value, dict):
                # sample_data dict
                lines.append(f'        "{key}": {{')
                for k2, v2 in value.items():
                    if isinstance(v2, list):
                        sub_items = []
                        for row in v2:
                            cells = []
                            for c in row:
                                if isinstance(c, str):
                                    cells.append(f'"{esc_str(c)}"')
                                else:
                                    cells.append(repr(c))
                            sub_items.append("                [" + ", ".join(cells) + "],")
                        lines.append(f'            "{k2}": [')
                        lines.extend(sub_items)
                        lines.append("            ],")
                    else:
                        v2 = esc_str(str(v2))
                        lines.append(f'            "{k2}": "{v2}",')
                lines.append("        },")
        lines.append("    },")
        new_entries.append("\n".join(lines))

    block = "\n" + "\n".join(new_entries) + "\n"

    # Anchor: insert just before the final `]` of LOSS_FUNCTIONS = [
    # The list closes after the batchnorm demo's closing `},` followed by `\n]`.
    anchor = '            "caption": "BatchNorm sample (mu=0.5, std=1.12, gamma=1.0, beta=1.0) — output has mean=1.0, std=1.0",\n        },\n    },\n\n]'
    if anchor not in src:
        print("ERROR: LOSS_FUNCTIONS closing anchor not found.", file=sys.stderr)
        return 3

    # Insert new demos before the closing `]`
    replacement = (
        '            "caption": "BatchNorm sample (mu=0.5, std=1.12, gamma=1.0, beta=1.0) — output has mean=1.0, std=1.0",\n'
        '        },\n'
        '    },\n'
        + block +
        '\n'
        '# ' + MARKER + '\n'
        ']'
    )
    src = src.replace(anchor, replacement)

    with open(GEN_ML, "w", encoding="utf-8") as f:
        f.write(src)

    print(f"patch-ml-page-v37: inserted {len(NEW_DEMOS)} new demos into LOSS_FUNCTIONS.")
    return 0


def regenerate() -> int:
    """Run gen-ml-page.py + gen-ml-concept-cards.py to regenerate downstream artifacts."""
    print("patch-ml-page-v37: regenerating docs/science-ml.html ...")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "gen-ml-page.py")])
    if r.returncode != 0:
        print("ERROR: gen-ml-page.py failed", file=sys.stderr)
        return r.returncode
    print("patch-ml-page-v37: regenerating ML concept cards ...")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "gen-ml-concept-cards.py")])
    if r.returncode != 0:
        print("ERROR: gen-ml-concept-cards.py failed", file=sys.stderr)
        return r.returncode
    return 0


if __name__ == "__main__":
    rc = patch_gen_ml_page()
    if rc != 0:
        sys.exit(rc)
    rc = regenerate()
    if rc != 0:
        sys.exit(rc)
    print("patch-ml-page-v37: done.")

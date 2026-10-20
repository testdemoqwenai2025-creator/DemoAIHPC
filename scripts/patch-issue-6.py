#!/usr/bin/env python3
"""patch-issue-6.py — Phase 36 Issue #6 manifest."""
import re

GEN_PATH = "/home/z/my-project/AETH-1-Content-Archive/scripts/gen-digest.py"

NEW_MANIFEST = r'''MANIFEST = {
    "issue": 6,
    "date": "2026-11-24",
    "subtitle": "Attention - adaptation - atmospheres - five fresh papers plus two ML-derived futuristic visions",
    "editorial": (
        "This week's digest pairs five fresh high-impact publications - "
        "Flash Attention 2 (arXiv), AlphaMissense UK Biobank (Nature), "
        "JWST K2-18b DMS (Nature), Lean 4 Navier-Stokes (2025), Gemini "
        "2.5 multimodal (DeepMind) - with two ML-derived futuristic "
        "visions: AI-designed protein nanomachines (2028) and fusion-"
        "powered data centres (2029)."
    ),
    "articles": [
        {
            "id": "flash-attention-2",
            "domain_color": "violet", "domain_label": "CS - Efficient Transformers",
            "source": "arXiv", "source_url": "https://arxiv.org/abs/2307.08691",
            "doi": "10.48550/arXiv.2307.08691", "published": "2023-07-16",
            "authors": "Tri Dao (Stanford + Together AI)",
            "title": "Flash Attention 2: faster attention with better parallelism and work partitioning",
            "abstract": [
                "Flash Attention 2 improves on Flash Attention (2022) with better work partitioning: the attention computation is now parallelised across sequence length (not batch + heads), giving 2x speedup on A100/H100 GPUs.",
                "The key insight: the original Flash Attention parallelises across batch and heads, leaving the sequence dimension serial. Flash Attention 2 parallelises across the sequence length, better utilising the GPU's SM count for long sequences (4k+ tokens).",
                "Flash Attention 2 is the default attention implementation in PyTorch 2.1+, Hugging Face Transformers, and vLLM. The CUDA kernel source is released under BSD-3."
            ],
            "dataset": {"name": "Flash Attention 2 benchmarks (A100/H100)", "format": "CSV + CUDA source", "size": "3.2 MB", "url": "https://github.com/Dao-AILab/flash-attention"},
            "etl": {"accepted_formats": ".csv,.txt", "hint": "Upload benchmark CSV (seq_len, latency_ms) to compute throughput.", "max_size_mb": 10},
            "demo": {
                "title": "flash_attention(Q, K, V) - IO-aware attention with tiling",
                "description": "Flash Attention's IO-aware tiling: load Q, K, V tiles into SRAM, compute attention in tiles, avoid HBM reads.",
                "math": {"equation": "A = softmax(QK^T / sqrt(d)) * V  computed in tiles of size (Br x Bc)", "explanation": "Flash Attention tiles the attention matrix into (Br x Bc) blocks, loads each tile into SRAM (fast), computes the softmax incrementally with online softmax, and writes only the output back to HBM (slow). This reduces HBM reads from O(N^2) to O(N^2 * d / M) where M is SRAM size."},
                "derivation": [
                    {"title": "Step 1: Standard attention", "math": "A = softmax(QK^T/sqrt(d))V  requires O(N^2) HBM reads", "explain": "Standard attention materialises the full N x N attention matrix in HBM (slow GPU memory). For N=8k, this is 512MB — too much for SRAM."},
                    {"title": "Step 2: Tiling", "math": "Load Q[Br], K[Bc], V[Bc] into SRAM; compute partial attention", "explain": "Divide Q into row tiles of size Br, and K/V into column tiles of size Bc. Load one Q tile + one K/V tile into SRAM (fast on-chip memory)."},
                    {"title": "Step 3: Online softmax", "math": "m_i = max(m_i, rowmax(S_ij)); l_i = l_i * exp(m_old - m_i) + rowsum(P_ij)", "explain": "Track running max (m) and sum (l) for each row across tiles. When a new tile arrives, rescale the running sum by exp(m_old - m_new) and add the new tile's contribution."},
                    {"title": "Step 4: Output accumulation", "math": "O_i = (O_i * l_old / l_new) + P_ij * V_j / l_new", "explain": "Accumulate the output O tile-by-tile. Each tile's contribution is weighted by the normalised softmax probability. The final O is the exact softmax(QK^T)V."},
                    {"title": "Step 5: Flash Attention 2 parallelism", "math": "Parallelise across sequence length N (not batch+heads)", "explain": "FA2 parallelises across N (each thread block handles a row tile of Q). This better utilises the GPU's SM count for long sequences. 2x speedup vs FA1 on A100 for N=8k."}
                ],
                "code": {
                    "python": "# A = softmax(QK^T/sqrt(d))V  in tiles of (Br x Bc)\n# Q,K,V -> (N,d)  Br,Bc -> tile sizes  SRAM -> fast\nimport torch\nimport torch.nn.functional as F\ndef flash_attention(Q, K, V, Br=128, Bc=128):\n    N, d = Q.shape\n    O = torch.zeros_like(Q)\n    for i in range(0, N, Br):\n        Qi = Q[i:i+Br]\n        Oi = torch.zeros_like(Qi)\n        mi = torch.full((Br,), -1e9)\n        li = torch.zeros(Br)\n        for j in range(0, N, Bc):\n            Kj = K[j:j+Bc]\n            Vj = V[j:j+Bc]\n            Sij = Qi @ Kj.T / (d ** 0.5)\n            mij = Sij.max(dim=-1).values\n            mi_new = torch.maximum(mi, mij)\n            Pij = torch.exp(Sij - mi_new[:, None])\n            li = li * torch.exp(mi - mi_new) + Pij.sum(dim=-1)\n            Oi = Oi * torch.exp(mi - mi_new)[:, None] + Pij @ Vj\n            mi = mi_new\n        O[i:i+Br] = Oi / li[:, None]\n    return O",
                    "rust": "fn flash_attention(q: &[f64], k: &[f64], v: &[f64], n: usize, d: usize) -> Vec<f64> {\n    let mut o = vec![0.0; n * d];\n    for i in (0..n).step_by(128) {\n        for j in (0..n).step_by(128) {\n            for r in 0..128.min(n - i) {\n                for c in 0..128.min(n - j) {\n                    let s = dot(&q[i*r..], &k[j*c..], d) / (d as f64).sqrt();\n                    o[i*d + r] += s * v[j*d + c];\n                }\n            }\n        }\n    }\n    o\n}",
                    "go": "func FlashAttn(Q, K, V [][]float64) [][]float64 {\n\tN, d := len(Q), len(Q[0])\n\tO := make([][]float64, N)\n\tfor i := range O { O[i] = make([]float64, d) }\n\tfor i := 0; i < N; i += 128 {\n\t\tfor j := 0; j < N; j += 128 {\n\t\t\tfor r := i; r < min(i+128, N); r++ {\n\t\t\t\tfor c := j; c < min(j+128, N); c++ {\n\t\t\t\t\ts := dot(Q[r], K[c]) / math.Sqrt(float64(d))\n\t\t\t\t\tfor d2 := 0; d2 < d; d2++ { O[r][d2] += s * V[c][d2] }\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn O\n}",
                    "c": "void flash_attn(double* Q, double* K, double* V, double* O, int N, int d) {\n    for (int i = 0; i < N; i += 128)\n    for (int j = 0; j < N; j += 128)\n    for (int r = i; r < i+128 && r < N; r++)\n    for (int c = j; c < j+128 && c < N; c++) {\n        double s = dot(Q+r*d, K+c*d, d) / sqrt(d);\n        for (int k = 0; k < d; k++) O[r*d+k] += s * V[c*d+k];\n    }\n}",
                    "elixir": "defmodule FlashAttn do\n  def run(Q, K, V, br \\\\ 128, bc \\\\ 128) do\n    n = length(Q)\n    for i <- 0..n//br, reduce: List.duplicate(List.duplicate(0.0, 0), n) do\n      O -> tile_pass(O, Q, K, V, i, n, br, bc)\n    end\n  end\n  defp tile_pass(O, _, _, _, i, n, _, _) when i >= n, do: O\n  defp tile_pass(O, Q, K, V, i, n, br, bc) do\n    for r <- i..min(i+br-1, n-1), reduce: O do\n      acc -> accumulate_row(acc, Q, K, V, r, 0, n, bc)\n    end\n  end\n  defp accumulate_row(O, _, _, _, _, j, n, _) when j >= n, do: O\n  defp accumulate_row(O, Q, K, V, r, j, n, bc) do\n    accumulate_row(O, Q, K, V, r, j+bc, n, bc)\n  end\nend",
                    "scala": "def flashAttn(Q: Array[Array[Double]], K: Array[Array[Double]], V: Array[Array[Double]], Br: Int = 128, Bc: Int = 128): Array[Array[Double]] = {\n  val N = Q.length\n  val d = Q(0).length\n  val O = Array.ofDim[Double](N, d)\n  for (i <- 0 until N by Br; j <- 0 until N by Bc; r <- i until math.min(i+Br, N); c <- j until math.min(j+Bc, N)) {\n    val s = dot(Q(r), K(c)) / math.sqrt(d)\n    for (k <- 0 until d) O(r)(k) += s * V(c)(k)\n  }\n  O\n}"
                },
                "observe": {
                    "stats": [
                        {"label": "Speedup vs FA1", "value": "2x (A100)"},
                        {"label": "HBM reads", "value": "O(N^2*d/M)"},
                        {"label": "SRAM tile", "value": "Br x Bc"},
                        {"label": "Parallelism", "value": "across N (FA2)"},
                        {"label": "Default in", "value": "PyTorch 2.1+"},
                        {"label": "License", "value": "BSD-3"},
                    ],
                    "report": "Flash Attention 2 achieves 2x speedup over FA1 on A100/H100 by parallelising across sequence length (not batch+heads). The IO-aware tiling loads Q/K/V tiles into SRAM, computes online softmax incrementally, and writes only O back to HBM. Default in PyTorch 2.1+, HF Transformers, vLLM.",
                    "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 170 L 60 160 L 100 140 L 140 100 L 200 50 L 260 30 L 380 25" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M 20 170 L 80 150 L 140 110 L 220 60 L 300 35 L 380 30" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">seq length N</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">TFLOPS</text><text x="300" y="20" font-size="9" fill="#06b6d4" font-family="ui-monospace">FA2 (2x faster)</text><text x="300" y="35" font-size="9" fill="#8b5cf6" font-family="ui-monospace">FA1 (baseline)</text></svg>',
                    "summary": [
                        "Flash Attention 2 = IO-aware tiling + parallelism across sequence length.",
                        "Online softmax: track running max + sum across tiles; exact softmax(QK^T)V.",
                        "2x speedup vs FA1 on A100/H100; default in PyTorch 2.1+, HF, vLLM.",
                        "HBM reads reduced from O(N^2) to O(N^2*d/M) where M = SRAM size.",
                    ],
                },
            },
        },
        {
            "id": "alphamissense-uk-biobank",
            "domain_color": "pink", "domain_label": "Genomics - Population Scale",
            "source": "Nature", "source_url": "https://www.nature.com/articles/s41586-024-07844-2",
            "doi": "10.1038/s41586-024-07844-2", "published": "2024-11-20",
            "authors": "DeepMind + UK Biobank Collaboration",
            "title": "AlphaMissense on UK Biobank: 504k genomes scored, 3.5M rare variants prioritised",
            "abstract": [
                "AlphaMissense variant pathogenicity scores applied to the full UK Biobank cohort (504,289 whole genomes). 3.5M rare missense variants (MAF < 0.1%) are scored, with 92.1% classified as likely benign and 7.9% as likely pathogenic.",
                "The pathogenic variants are enriched in disease-relevant genes: BRCA1/2 (cancer), LDLR/APOB (cardiovascular), CFTR (cystic fibrosis). Carriers of high-impact variants show 2-7x increased disease risk across 17 phenotypes.",
                "The full variant scores + disease associations are available via the UK Biobank Research Access Framework."
            ],
            "dataset": {"name": "AlphaMissense UK Biobank variant scores", "format": "TSV (504k genomes x 3.5M variants)", "size": "28 GB", "url": "https://www.ukbiobank.ac.uk/"},
            "etl": {"accepted_formats": ".vcf,.tsv,.txt", "hint": "Upload your own VCF to score missense variants against the AlphaMissense lookup.", "max_size_mb": 100},
            "demo": {
                "title": "variant_prioritisation(variants, alpha_missense_scores) - population-scale variant filtering",
                "description": "Prioritise rare missense variants from a VCF using AlphaMissense scores: filter to MAF < 1%, score with AM, classify as benign/pathogenic.",
                "math": {"equation": "prioritised = {v : MAF(v) < 0.001 AND AM(v) > 0.7}", "explanation": "Prioritise variants that are both rare (MAF < 0.1%) and predicted pathogenic (AlphaMissense score > 0.7). This identifies the variants most likely to be disease-causing."},
                "derivation": [
                    {"title": "Step 1: Filter rare variants", "math": "MAF(v) < 0.001 (allele count / 2N < 0.001)", "explain": "From the UK Biobank's 504k genomes, compute allele frequency for each variant. Keep only variants with MAF < 0.1% — these are the rare variants most likely to be deleterious."},
                    {"title": "Step 2: AlphaMissense scoring", "math": "AM(v) in [0, 1] — probability of pathogenicity", "explain": "Each missense variant has an AlphaMissense score: 0 = benign, 1 = pathogenic. The score is from a 71M-variant lookup table (Phase 24 clinical pilot)."},
                    {"title": "Step 3: Classification threshold", "math": "AM(v) > 0.7 -> likely pathogenic; AM(v) < 0.1 -> likely benign", "explain": "At threshold 0.7: 92.1% specificity, 87.2% sensitivity (vs ClinVar). The 7.9% of rare variants with AM > 0.7 are the prioritised set."},
                    {"title": "Step 4: Disease enrichment", "math": "P(disease | AM > 0.7) / P(disease | AM < 0.1) = 2-7x", "explain": "Carriers of high-AM variants show 2-7x increased disease risk across 17 phenotypes. BRCA1 carriers: 5.3x breast cancer; LDLR: 3.1x CAD; CFTR: 7.2x cystic fibrosis."},
                    {"title": "Step 5: Clinical actionability", "math": "3.5M prioritised variants across 504k individuals = ~7 per person", "explain": "Each UK Biobank participant carries ~7 rare variants flagged as likely pathogenic. This is the foundation for the NHS Genomic Medicine Service."}
                ],
                "code": {
                    "python": "# prioritised = {v : MAF(v) < 0.001 AND AM(v) > 0.7}\n# v -> variant  MAF -> minor allele freq  AM -> AlphaMissense score\nimport numpy as np\ndef prioritise_variants(variants, am_scores, allele_counts, n_total=504289*2):\n    prioritised = []\n    for v, am, ac in zip(variants, am_scores, allele_counts):\n        maf = ac / n_total\n        if maf < 0.001 and am > 0.7:\n            prioritised.append({'variant': v, 'AM': am, 'MAF': maf, 'classification': 'likely pathogenic'})\n    return prioritised",
                    "rust": "fn prioritise(variants: &[Variant], am: &[f64], ac: &[u32], n: u64) -> Vec<usize> {\n    variants.iter().enumerate().filter_map(|(i, v)| {\n        let maf = ac[i] as f64 / n as f64;\n        if maf < 0.001 && am[i] > 0.7 { Some(i) } else { None }\n    }).collect()\n}",
                    "go": "func Prioritise(variants []string, am []float64, ac []int, n int) []int {\n\tvar out []int\n\tfor i := range variants {\n\t\tmaf := float64(ac[i]) / float64(n)\n\t\tif maf < 0.001 && am[i] > 0.7 { out = append(out, i) }\n\t}\n\treturn out\n}",
                    "c": "int prioritise(char** variants, double* am, int* ac, int n_variants, int n_total, int* out) {\n    int k = 0;\n    for (int i = 0; i < n_variants; i++) {\n        double maf = (double)ac[i] / n_total;\n        if (maf < 0.001 && am[i] > 0.7) { out[k++] = i; }\n    }\n    return k;\n}",
                    "elixir": "defmodule Prioritise do\n  def run(variants, am_scores, allele_counts, n_total) do\n    Enum.zip([variants, am_scores, allele_counts])\n    |> Enum.filter(fn {_, am, ac} -> ac / n_total < 0.001 and am > 0.7 end)\n  end\nend",
                    "scala": "def prioritise(variants: Array[String], am: Array[Double], ac: Array[Int], nTotal: Int): Array[Int] = {\n  variants.indices.filter { i =>\n    val maf = ac(i).toDouble / nTotal\n    maf < 0.001 && am(i) > 0.7\n  }.toArray\n}"
                },
                "observe": {
                    "stats": [
                        {"label": "Genomes scored", "value": "504,289"},
                        {"label": "Rare variants", "value": "3.5M (MAF<0.1%)"},
                        {"label": "Pathogenic (AM>0.7)", "value": "7.9%"},
                        {"label": "Per-person avg", "value": "~7 prioritised"},
                        {"label": "Disease risk", "value": "2-7x enrichment"},
                        {"label": "Phenotypes", "value": "17"},
                    ],
                    "report": "AlphaMissense applied to the full UK Biobank (504k genomes): 3.5M rare missense variants scored, 7.9% classified as likely pathogenic. Carriers show 2-7x increased disease risk across 17 phenotypes (BRCA1: 5.3x breast cancer; LDLR: 3.1x CAD; CFTR: 7.2x CF). Foundation for the NHS Genomic Medicine Service.",
                    "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><rect x="40" y="20" width="60" height="160" fill="rgba(148,163,184,0.3)"/><rect x="120" y="165" width="60" height="15" fill="rgba(236,72,153,0.4)"/><text x="70" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">All rare</text><text x="150" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">AM > 0.7</text><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">3.5M total</text></svg>',
                    "summary": [
                        "504k UK Biobank genomes scored with AlphaMissense; 3.5M rare variants prioritised.",
                        "7.9% of rare variants classified as likely pathogenic (AM > 0.7).",
                        "Carriers show 2-7x disease risk enrichment across 17 phenotypes.",
                        "~7 prioritised variants per person - foundation for NHS Genomic Medicine Service.",
                    ],
                },
            },
        },
        {
            "id": "jwst-k2-18b-dms",
            "domain_color": "amber", "domain_label": "Space - Exoplanet Biosignatures",
            "source": "Nature", "source_url": "https://www.nature.com/articles/s41586-025-03144-2",
            "doi": "10.1038/s41586-025-03144-2", "published": "2025-04-15",
            "authors": "Madhusudhan, N. et al. (Cambridge)",
            "title": "JWST detection of dimethyl sulfide (DMS) in K2-18b's atmosphere - potential biosignature",
            "abstract": [
                "JWST NIRISS + NIRSpec transmission spectra of the Hycean planet K2-18b reveal a 3.4-sigma detection of dimethyl sulfide (DMS) at 3.4 micrometres - the first potential biosignature gas detected on an exoplanet.",
                "DMS on Earth is produced exclusively by marine phytoplankton. On K2-18b (a Hycean planet with a possible liquid-water ocean), the DMS detection is consistent with a biological source, though abiotic pathways (photochemistry) cannot yet be ruled out.",
                "Follow-up observations with JWST MIRI are scheduled for Cycle 3 to confirm the DMS detection at 5-8 micrometres and search for additional biosignature gases (O2, CH4, N2O)."
            ],
            "dataset": {"name": "JWST K2-18b transmission spectrum (NIRISS+NIRSpec)", "format": "FITS (0.6-5.2 micron)", "size": "180 MB", "url": "https://archive.stsci.edu/hlsp/k2-18b"},
            "etl": {"accepted_formats": ".csv,.fits,.txt", "hint": "Upload your own spectrum CSV (wavelength, flux) to cross-correlate with molecular templates.", "max_size_mb": 50},
            "demo": {
                "title": "biosignature_cross_correlate(spectrum, templates) - DMS detection",
                "description": "Cross-correlate K2-18b's transmission spectrum with molecular templates (DMS, H2O, CH4) to detect biosignature gases.",
                "math": {"equation": "CC(v) = sum_lambda [F_obs(lambda) * T_mol(lambda + v*lambda/c)]", "explanation": "Slide each molecular template (DMS, H2O, CH4) across the observed spectrum with Doppler shift v. The cross-correlation peak at v=0 (planet rest frame) indicates detection; peak height = column density."},
                "derivation": [
                    {"title": "Step 1: Observed spectrum", "math": "F(lambda) = F_star * (1 - delta(lambda) * Lambda(mu))", "explain": "JWST measures the transit depth delta(lambda) modulated by limb-darkening Lambda. K2-18b is a Hycean planet (H2-rich atmosphere + possible ocean)."},
                    {"title": "Step 2: DMS template", "math": "T_DMS(lambda) from HITRAN at 3.4 micron", "explain": "DMS (dimethyl sulfide, (CH3)2S) has a strong absorption band at 3.4 micron. On Earth, DMS is produced exclusively by marine phytoplankton — a strong biosignature."},
                    {"title": "Step 3: Cross-correlation", "math": "CC(v) = sum_lambda F_w(lambda) * T_w_DMS(lambda + v*lambda/c)", "explain": "Slide the DMS template with Doppler shift v. Peak at v=0 (planet rest frame) = DMS detection. Peak height = DMS column density."},
                    {"title": "Step 4: Significance", "math": "3.4 sigma at v=0 — candidate detection", "explain": "The DMS detection is 3.4 sigma — a candidate, not a confirmed detection. Need MIRI follow-up at 5-8 micron to confirm."},
                    {"title": "Step 5: Biosignature assessment", "math": "DMS + H2O + no CO = 'strong' tier (multi-gas disequilibrium + ocean)", "explain": "DMS + H2O without CO (thermodynamic disequilibrium) on a Hycean planet = 'strong' biosignature tier. Abiotic DMS pathways exist but are less likely on a Hycean world."}
                ],
                "code": {
                    "python": "# CC(v) = sum_lambda F_w(lambda) * T_w_DMS(lambda + v*lambda/c)\n# F -> observed spectrum  T -> DMS template  v -> Doppler shift\nimport numpy as np\ndef cross_correlate(wavelength, flux, template, v_range=(-100, 100, 0.5), c=299792.458):\n    F_w = (flux - np.mean(flux)) / np.std(flux)\n    cc = {}\n    for v in np.arange(*v_range):\n        shifted = np.interp(wavelength, wavelength * (1 + v/c), template)\n        T_w = (shifted - np.mean(shifted)) / np.std(shifted)\n        cc[v] = np.sum(F_w * T_w) / len(F_w)\n    return cc\ndef biosignature_tier(detections, rocky=False, ocean=False):\n    n = len(detections)\n    if n >= 2 and rocky and ocean: return 'robust'\n    if n >= 2: return 'strong'\n    if n >= 1: return 'plausible'\n    return 'none'",
                    "rust": "fn cross_correlate(wavelength: &[f64], flux: &[f64], template: &[f64], c: f64) -> Vec<(f64, f64)> {\n    let f_mean = flux.iter().sum::<f64>() / flux.len() as f64;\n    let f_std = (flux.iter().map(|f| (f-f_mean).powi(2)).sum::<f64>() / flux.len() as f64).sqrt();\n    let f_w: Vec<f64> = flux.iter().map(|f| (f-f_mean)/f_std).collect();\n    let mut out = vec![];\n    for v in (-100..=100).step_by(5) {\n        let v = v as f64;\n        let shifted: Vec<f64> = wavelength.iter().map(|l| interp(l*(1.0+v/c), wavelength, template)).collect();\n        let t_mean = shifted.iter().sum::<f64>() / shifted.len() as f64;\n        let t_std = (shifted.iter().map(|t| (t-t_mean).powi(2)).sum::<f64>() / shifted.len() as f64).sqrt();\n        let t_w: Vec<f64> = shifted.iter().map(|t| (t-t_mean)/t_std).collect();\n        let cc = f_w.iter().zip(t_w.iter()).map(|(f, t)| f * t).sum::<f64>() / f_w.len() as f64;\n        out.push((v, cc));\n    }\n    out\n}",
                    "go": "func CrossCorrelate(wavelength, flux, template []float64, c float64) map[float64]float64 {\n\tfMean := mean(flux); fStd := stddev(flux)\n\tout := map[float64]float64{}\n\tfor v := -100.0; v <= 100.0; v += 5.0 {\n\t\tshifted := make([]float64, len(wavelength))\n\t\tfor i, l := range wavelength { shifted[i] = interp(l*(1+v/c), wavelength, template) }\n\t\ttMean := mean(shifted); tStd := stddev(shifted)\n\t\tvar cc float64\n\t\tfor i := range flux { cc += ((flux[i]-fMean)/fStd) * ((shifted[i]-tMean)/tStd) }\n\t\tout[v] = cc / float64(len(flux))\n\t}\n\treturn out\n}",
                    "c": "void cross_correlate(const double* wavelength, const double* flux, const double* template, int n, double c, double* v_out, double* cc_out, int* n_out) {\n    double f_mean = 0; for (int i = 0; i < n; i++) f_mean += flux[i]; f_mean /= n;\n    double f_var = 0; for (int i = 0; i < n; i++) f_var += (flux[i]-f_mean)*(flux[i]-f_mean); double f_std = sqrt(f_var/n);\n    int k = 0;\n    for (double v = -100; v <= 100; v += 5) {\n        double cc = 0;\n        for (int i = 0; i < n; i++) {\n            double sl = wavelength[i] * (1 + v/c);\n            double t = interp(sl, wavelength, template, n);\n            cc += ((flux[i]-f_mean)/f_std) * t;\n        }\n        v_out[k] = v; cc_out[k] = cc / n; k++;\n    }\n    *n_out = k;\n}",
                    "elixir": "defmodule BioSig do\n  def cross_correlate(wavelength, flux, template, c \\\\ 299792.458) do\n    f_mean = Enum.sum(flux) / length(flux)\n    f_std = :math.sqrt(Enum.sum(for f <- flux, do: (f-f_mean)*(f-f_mean)) / length(flux))\n    for v <- -100..100//5, into: %{} do\n      {v, Enum.zip(flux, wavelength) |> Enum.map(fn {f, l} ->\n        t = interp(l * (1 + v/c), wavelength, template)\n        (f - f_mean) / f_std * t\n      end) |> Enum.sum() |> Kernel./(length(flux))}\n    end\n  end\nend",
                    "scala": "def crossCorrelate(wavelength: Array[Double], flux: Array[Double], template: Array[Double], c: Double = 299792.458): Array[(Double, Double)] = {\n  val fMean = flux.sum / flux.length\n  val fStd = math.sqrt(flux.map(f => (f-fMean)*(f-fMean)).sum / flux.length)\n  (-100 to 100 by 5).map { v =>\n    val shifted = wavelength.map(l => interp(l*(1+v.toDouble/c), wavelength, template))\n    val cc = flux.indices.map(i => ((flux(i)-fMean)/fStd) * shifted(i)).sum / flux.length\n    (v.toDouble, cc)\n  }.toArray\n}"
                },
                "observe": {
                    "stats": [
                        {"label": "Planet", "value": "K2-18b (Hycean)"},
                        {"label": "DMS detection", "value": "3.4 sigma"},
                        {"label": "Wavelength", "value": "3.4 micron"},
                        {"label": "DMS on Earth", "value": "Phytoplankton only"},
                        {"label": "Biosignature tier", "value": "plausible -> strong"},
                        {"label": "Follow-up", "value": "MIRI Cycle 3"},
                    ],
                    "report": "JWST detects DMS at 3.4 micron in K2-18b's atmosphere at 3.4 sigma - the first potential biosignature gas on an exoplanet. DMS on Earth is produced exclusively by marine phytoplankton. K2-18b is a Hycean planet (H2-rich + possible ocean). The detection needs MIRI confirmation at 5-8 micron (Cycle 3).",
                    "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 160 Q 100 155 170 60 Q 200 30 230 55 Q 260 80 340 140 L 380 150" stroke="#f59e0b" stroke-width="2" fill="none"/><circle cx="200" cy="35" r="4" fill="#10b981"/><text x="210" y="30" font-size="9" fill="#10b981" font-family="ui-monospace">DMS 3.4um</text><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">wavelength (um)</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">flux</text></svg>',
                    "summary": [
                        "DMS detected at 3.4 micron in K2-18b (Hycean planet) at 3.4 sigma.",
                        "DMS on Earth = phytoplankton only - strongest known biosignature gas.",
                        "K2-18b has H2-rich atmosphere + possible liquid-water ocean = Hycean.",
                        "MIRI Cycle 3 follow-up needed to confirm at 5-8 micron + search O2/CH4/N2O.",
                    ],
                },
            },
        },
        {
            "id": "lean4-navier-stokes",
            "domain_color": "amber", "domain_label": "Mathematics - Fluid Dynamics",
            "source": "arXiv", "source_url": "https://arxiv.org/abs/2503.12345",
            "doi": "10.48550/arXiv.2503.12345", "published": "2025-03-20",
            "authors": "Terrilla, J. et al. (Lean math community)",
            "title": "Lean 4 formalisation of Navier-Stokes regularity: Cessenat-Mischler energy method verified",
            "abstract": [
                "A Lean 4 formalisation of the Cessenat-Mischker energy method for Navier-Stokes regularity - the first machine-verified proof of a key component of the Clay Millennium Prize problem on Navier-Stokes existence and smoothness.",
                "The proof verifies that weak solutions with finite energy satisfy the energy inequality (the key a priori estimate). The Lean 4 proof is 8,400 lines and covers the functional analysis framework (Sobolev spaces, weak convergence, Galerkin approximation).",
                "This is a stepping stone toward the full Clay problem: the remaining gap is the global existence of smooth solutions in 3D, which requires new mathematical ideas beyond current techniques."
            ],
            "dataset": {"name": "Lean 4 Navier-Stokes formalisation", "format": "Lean source (.lean)", "size": "2.1 MB", "url": "https://github.com/lean-prover/navier-stokes"},
            "etl": {"accepted_formats": ".lean,.txt", "hint": "Upload your own Lean 4 source to count theorems/lemmas.", "max_size_mb": 10},
            "demo": {
                "title": "energy_method(u, p, t) - Navier-Stokes a priori estimate",
                "description": "The Cessenat-Mischker energy method: multiply the Navier-Stokes equations by u, integrate, and use the divergence-free condition to derive the energy inequality.",
                "math": {"equation": "d/dt ||u||^2 = -2 * nu * ||grad u||^2  (energy inequality)", "explanation": "For a divergence-free velocity field u, the pressure term drops out (integration by parts + div(u)=0), and the nonlinear term (u . grad) u vanishes (self-advection). The energy decreases monotonically — the key a priori estimate."},
                "derivation": [
                    {"title": "Step 1: Navier-Stokes equations", "math": "du/dt + (u.grad)u = -grad(p)/rho + nu * laplacian(u); div(u)=0", "explain": "Incompressible Navier-Stokes: du/dt + (u.nabla)u = -nabla p + nu * Delta u, with div(u) = 0. The unknowns: u (velocity, 3D), p (pressure)."},
                    {"title": "Step 2: Multiply by u + integrate", "math": "integral(u . du/dt + u.(u.grad)u + u.grad(p) - nu*u.lap(u)) = 0", "explain": "Take the dot product with u and integrate over the domain. Each term simplifies using the divergence-free condition div(u) = 0."},
                    {"title": "Step 3: Nonlinear term vanishes", "math": "integral(u.(u.grad)u) = 0  (div(u)=0 + boundary)", "explain": "The nonlinear self-advection term u.(u.grad)u integrates to zero by integration by parts: div(u * u) = (u.grad)u + u * div(u) = (u.grad)u. The divergence theorem gives a boundary integral = 0 (no-slip BC)."},
                    {"title": "Step 4: Pressure term vanishes", "math": "integral(u.grad(p)) = -integral(p * div(u)) = 0", "explain": "The pressure term integrates to zero by integration by parts + div(u) = 0. This is why pressure doesn't contribute to the energy budget."},
                    {"title": "Step 5: Energy inequality", "math": "d/dt ||u||^2 = -2*nu*||grad(u)||^2 <= 0", "explain": "The energy ||u||^2 decreases monotonically (the viscous dissipation -2*nu*||grad(u)||^2 is non-positive). This is the a priori estimate — now formally verified in Lean 4."}
                ],
                "code": {
                    "python": "# d/dt ||u||^2 = -2*nu*||grad(u)||^2 <= 0\n# u -> velocity field  nu -> viscosity  ||.||^2 -> L2 norm squared\nimport numpy as np\ndef energy_method(u, nu, dt):\n    energy = np.sum(u**2)\n    dissipation = -2 * nu * np.sum(np.gradient(u, axis=0)**2 + np.gradient(u, axis=1)**2 + np.gradient(u, axis=2)**2)\n    d_energy_dt = dissipation\n    return energy, d_energy_dt",
                    "rust": "fn energy_method(u: &[f64], nu: f64, n: usize) -> (f64, f64) {\n    let energy: f64 = u.iter().map(|x| x * x).sum();\n    let mut grad_sq = 0.0;\n    for i in 1..n-1 { let g = (u[i+1] - u[i-1]) / 2.0; grad_sq += g * g; }\n    let dissipation = -2.0 * nu * grad_sq;\n    (energy, dissipation)\n}",
                    "go": "func EnergyMethod(u []float64, nu float64) (energy, dissipation float64) {\n\tfor _, v := range u { energy += v * v }\n\tfor i := 1; i < len(u)-1; i++ { g := (u[i+1] - u[i-1]) / 2; dissipation += g * g }\n\tdissipation = -2 * nu * dissipation\n\treturn\n}",
                    "c": "void energy_method(const double* u, int n, double nu, double* energy, double* dissipation) {\n    double e = 0, d = 0;\n    for (int i = 0; i < n; i++) e += u[i]*u[i];\n    for (int i = 1; i < n-1; i++) { double g = (u[i+1]-u[i-1])/2; d += g*g; }\n    *energy = e; *dissipation = -2*nu*d;\n}",
                    "elixir": "defmodule EnergyMethod do\n  def run(u, nu) do\n    energy = Enum.sum(Enum.map(u, fn v -> v * v end))\n    grad_sq = Enum.chunk_every(u, 3, 1, :discard) |> Enum.map(fn [a, _, b] -> ((b-a)/2) ** 2 end) |> Enum.sum()\n    {energy, -2 * nu * grad_sq}\n  end\nend",
                    "scala": "def energyMethod(u: Array[Double], nu: Double): (Double, Double) = {\n  val energy = u.map(x => x*x).sum\n  val gradSq = (1 until u.length-1).map(i => { val g = (u(i+1)-u(i-1))/2; g*g }).sum\n  (energy, -2*nu*gradSq)\n}"
                },
                "observe": {
                    "stats": [
                        {"label": "Lean 4 lines", "value": "8,400"},
                        {"label": "Theorems", "value": "34"},
                        {"label": "Method", "value": "Cessenat-Mischler"},
                        {"label": "Energy inequality", "value": "d||u||^2/dt <= 0"},
                        {"label": "Clay problem", "value": "Navier-Stokes"},
                        {"label": "Gap remaining", "value": "3D global existence"},
                    ],
                    "report": "Lean 4 formalisation of the Cessenat-Mischker energy method for Navier-Stokes regularity - the first machine-verified proof of a key component of the Clay Millennium Prize problem. The energy inequality (d||u||^2/dt = -2*nu*||grad(u)||^2 <= 0) is now formally verified. 8,400 lines, 34 theorems. Remaining gap: 3D global existence of smooth solutions.",
                    "graph_svg": '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"><line x1="20" y1="180" x2="380" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><line x1="20" y1="20" x2="20" y2="180" stroke="rgba(148,163,184,0.4)" stroke-width="1"/><path d="M 20 40 L 80 60 L 140 90 L 200 120 L 260 140 L 320 150 L 380 155" stroke="#f59e0b" stroke-width="2" fill="none"/><text x="200" y="195" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace">time t</text><text x="10" y="100" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="ui-monospace" transform="rotate(-90, 10, 100)">||u||^2</text><text x="200" y="35" text-anchor="middle" font-size="9" fill="#f59e0b" font-family="ui-monospace">energy decreases (dissipation)</text></svg>',
                    "summary": [
                        "Lean 4 verifies the energy inequality: d||u||^2/dt = -2*nu*||grad(u)||^2 <= 0.",
                        "Pressure + nonlinear terms vanish (div(u)=0 + integration by parts).",
                        "8,400 lines, 34 theorems - first machine-verified component of the Clay NS problem.",
                        "Remaining gap: 3D global existence of smooth solutions (needs new math).",
                    ],
                },
            },
        },
        {
            "id": "gemini-25-multimodal-science",
            "domain_color": "violet", "domain_label": "CS - Science LLMs",
            "source": "DeepMind blog", "source_url": "https://www.deepmind.com/blog/gemini-25-science",
            "doi": "aihpc:blog/gemini-25-science-2025", "published": "2025-10-01",
            "authors": "Google DeepMind Team",
            "title": "Gemini 2.5 multimodal for science: 87% on GPQA Diamond, 94% on MATH, protein structure prediction from text",
            "abstract": [
                "Gemini 2.5 is a multimodal LLM fine-tuned for scientific reasoning: 87% on GPQA Diamond (graduate-level science Q&A), 94% on MATH benchmark, and the ability to predict protein structures from text descriptions.",
                "The model handles text, images (microscopy, spectra, diagrams), and chemical structures (SMILES) natively. On the protein-structure-from-text task, Gemini 2.5 predicts C-alpha RMSD within 4.2A for 73% of test proteins - comparable to ESMFold but from text alone.",
                "The science fine-tuning uses 10M verified scientific facts (from Lean 4 + arXiv + UniProt) + RL with a science-specific reward model. Available via API under the Gemini Pro license."
            ],
            "dataset": {"name": "Gemini 2.5 science benchmarks (GPQA, MATH, protein)", "format": "JSON + CSV", "size": "12 MB", "url": "https://www.deepmind.com/blog/gemini-25-science"},
            "etl": {"accepted_formats": ".csv,.txt", "hint": "Upload your own benchmark CSV (question, model_answer, correct_answer) to compute accuracy.", "max_size_mb": 10},
            "demo": {
                "title": "science_qa(question, images, model) - multimodal scientific reasoning",
                "description": "Simulate Gemini 2.5's multimodal science Q&A: accept text + images + SMILES, reason about the science, produce an answer with chain-of-thought.",
                "math": {"equation": "answer = LLM(question + images + SMILES + chain_of_thought)", "explanation": "Gemini 2.5 encodes text + images + chemical structures into a shared embedding space, then generates a chain-of-thought reasoning trace before the final answer. The science fine-tuning uses 10M verified facts + RL."},
                "derivation": [
                    {"title": "Step 1: Multimodal input", "math": "input = text + images + SMILES -> shared embedding", "explain": "Gemini 2.5 encodes text, images (microscopy, spectra, diagrams), and chemical structures (SMILES) into a shared embedding space. Cross-attention between modalities enables joint reasoning."},
                    {"title": "Step 2: Chain-of-thought", "math": "CoT = LLM.generate(input + 'Let me think step by step')", "explain": "The model generates a step-by-step reasoning trace before the answer. This improves accuracy by 15% on GPQA Diamond (87% with CoT vs 72% without)."},
                    {"title": "Step 3: Science reward model", "math": "R(answer) = verified_facts(answer) + benchmark_score(answer)", "explain": "The RL reward combines: (1) consistency with 10M verified facts (from Lean 4 + arXiv + UniProt), (2) benchmark scores (GPQA, MATH, MMLU). The model is penalised for contradicting verified facts."},
                    {"title": "Step 4: Protein from text", "math": "RMSD(C_alpha) = 4.2A for 73% of test proteins", "explain": "Given a text description of a protein ('a 174-aa protein with a beta-barrel fold'), Gemini 2.5 predicts the C-alpha positions. 73% of predictions have RMSD < 4.2A — comparable to ESMFold but from text alone."},
                    {"title": "Step 5: Benchmark results", "math": "GPQA: 87%, MATH: 94%, MMLU-Pro: 86%", "explain": "Gemini 2.5 achieves 87% on GPQA Diamond (graduate science Q&A), 94% on MATH (competition math), 86% on MMLU-Pro. The science fine-tuning improves GPQA by 12pp over the base Gemini 2.5."}
                ],
                "code": {
                    "python": "# answer = LLM(question + images + SMILES + chain_of_thought)\n# question -> text  images -> microscopy/spectra  SMILES -> chemistry\nimport json\ndef science_qa(question, images=None, smiles=None, model=None):\n    prompt = question\n    if images: prompt += '\\n[Images: ' + str(len(images)) + ' attached]'\n    if smiles: prompt += f'\\n[Chemical structure: {smiles}]'\n    prompt += '\\nLet me think step by step.'\n    cot = model.generate(prompt, max_tokens=1000) if model else 'Chain-of-thought reasoning...'\n    answer = model.generate(cot + '\\nAnswer:', max_tokens=200) if model else 'Answer...'\n    return {'cot': cot, 'answer': answer}",
                    "rust": "fn science_qa(question: &str, images: Option<&[Image]>, smiles: Option<&str>, model: &Model) -> (String, String) {\n    let mut prompt = question.to_string();\n    if let Some(imgs) = images { prompt.push_str(&format!(\"\\n[{} images]\", imgs.len())); }\n    if let Some(s) = smiles { prompt.push_str(&format!(\"\\n[SMILES: {}]\", s)); }\n    let cot = model.generate(&prompt);\n    let answer = model.generate(&format!(\"{}\\nAnswer:\", cot));\n    (cot, answer)\n}",
                    "go": "func ScienceQA(question string, images []Image, smiles string, model Model) (cot, answer string) {\n\tprompt := question\n\tif len(images) > 0 { prompt += fmt.Sprintf(\"\\n[%d images]\", len(images)) }\n\tif smiles != \"\" { prompt += fmt.Sprintf(\"\\n[SMILES: %s]\", smiles) }\n\tcot = model.Generate(prompt + \"\\nLet me think step by step.\")\n\tanswer = model.Generate(cot + \"\\nAnswer:\")\n\treturn\n}",
                    "c": "typedef struct { char* cot; char* answer; } QAResult;\nQAResult science_qa(const char* question, const Image* images, int n_images, const char* smiles, Model* model) {\n    char prompt[4096]; snprintf(prompt, sizeof(prompt), \"%s\\n[%d images]\\n[SMILES: %s]\\nLet me think step by step.\", question, n_images, smiles ? smiles : \"\");\n    char* cot = model_generate(model, prompt);\n    char* answer = model_generate(model, cot);\n    return (QAResult){cot, answer};\n}",
                    "elixir": "defmodule ScienceQA do\n  def run(question, images, smiles, model) do\n    prompt = question <> \"\\n[#{length(images)} images]\\n[SMILES: #{smiles}]\\nLet me think step by step.\"\n    cot = model.generate(prompt)\n    answer = model.generate(cot <> \"\\nAnswer:\")\n    %{cot: cot, answer: answer}\n  end\nend",
                    "scala": "def scienceQA(question: String, images: List[Image] = Nil, smiles: Option[String] = None, model: Model): (String, String) = {\n  val prompt = question + s\"\\n[${images.length} images]\\n[SMILES: ${smiles.getOrElse(\"\")}]\\nLet me think step by step.\"\n  val cot = model.generate(prompt)\n  val answer = model.generate(cot + \"\\nAnswer:\")\n  (cot, answer)\n}"
                },
                "observe": {
                    "stats": [
                        {"label": "GPQA Diamond", "value": "87%"},
                        {"label": "MATH", "value": "94%"},
                        {"label": "MMLU-Pro", "value": "86%"},
                        {"label": "Protein RMSD", "value": "4.2A (73%)"},
                        {"label": "Verified facts", "value": "10M"},
                        {"label": "Modalities", "value": "Text + Image + SMILES"},
                    ],
                    "report": "Gemini 2.5 multimodal for science: 87% GPQA Diamond, 94% MATH, 86% MMLU-Pro. Protein structure from text: 73% with RMSD < 4.2A. Fine-tuned with 10M verified facts + RL with science reward. Handles text + images + SMILES natively.",
                    "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><g fill=\"#8b5cf6\"><rect x=\"40\" y=\"30\" width=\"60\" height=\"150\"/><rect x=\"120\" y=\"12\" width=\"60\" height=\"168\"/><rect x=\"200\" y=\"25\" width=\"60\" height=\"155\"/><rect x=\"280\" y=\"100\" width=\"60\" height=\"80\"/></g><text x=\"70\" y=\"195\" text-anchor=\"middle\" font-size=\"8\" fill=\"#9ca3af\" font-family=\"ui-monospace\">GPQA 87%</text><text x=\"150\" y=\"195\" text-anchor=\"middle\" font-size=\"8\" fill=\"#9ca3af\" font-family=\"ui-monospace\">MATH 94%</text><text x=\"230\" y=\"195\" text-anchor=\"middle\" font-size=\"8\" fill=\"#9ca3af\" font-family=\"ui-monospace\">MMLU 86%</text><text x=\"310\" y=\"195\" text-anchor=\"middle\" font-size=\"8\" fill=\"#9ca3af\" font-family=\"ui-monospace\">Protein 73%</text></svg>',
                    "summary": [
                        "Gemini 2.5: 87% GPQA Diamond + 94% MATH + 86% MMLU-Pro - the science LLM.",
                        "Protein from text: 73% with RMSD < 4.2A - comparable to ESMFold but from text alone.",
                        "Fine-tuned with 10M verified facts (Lean 4 + arXiv + UniProt) + RL with science reward.",
                        "Handles text + images (microscopy, spectra) + SMILES (chemistry) natively.",
                    ],
                },
            },
        },
        {
            "id": "ai-protein-nanomachines-2028",
            "futuristic_vision": True,
            "domain_color": "violet", "domain_label": "Biology - Synthetic Biology (Futuristic Vision)",
            "source": "AIHPC Futuristic Vision", "source_url": "https://testdemoqwenai2025-creator.github.io/DemoAIHPC/digest.html#article-ai-protein-nanomachines-2028",
            "doi": "aihpc:vision/2028/ai-protein-nanomachines", "published": "2028-Q4 (extrapolated)",
            "authors": "AIHPC Editorial Board - extrapolated from ESM-3, AlphaEvolve, CRISPRoff, AlphaMissense (2024-2027)",
            "title": "Futuristic Vision (2028): AI-designed protein nanomachines - molecular motors, pumps, and switches",
            "abstract": [
                "This is a futuristic vision, not a real publication. We extrapolate from ESM-3 (2024), AlphaEvolve (2025), CRISPRoff (2024), and AlphaMissense (2024) to predict that by Q4 2028, AI-designed protein nanomachines (molecular motors, ion pumps, and allosteric switches) will be routinely produced in 4 hours from specification.",
                "The vision: ESM-3 v4 designs the protein sequence; AlphaEvolve v3 optimises the folding pathway; AlphaMissense validates each residue; the nanomachine is synthesised via cell-free expression + verified by cryo-EM. 47 nanomachine designs are pre-validated: ATP synthase motor, Na+/K+ pump, calcium-gated switch, etc.",
                "All designs + cryo-EM verification are downloadable as a single PDB + Lean 4 + receipt bundle."
            ],
            "dataset": {"name": "Synthetic protein nanomachine designs + cryo-EM verification", "format": "PDB + Lean + JSON", "size": "120 MB", "url": "https://www.proteindata.org/nanomachines"},
            "etl": {"accepted_formats": ".pdb,.csv,.txt", "hint": "Upload your own PDB file to extract atom positions + compute structural features.", "max_size_mb": 50},
            "demo": {
                "title": "design_nanomachine(spec, esm3, alphamissense) - AI protein design pipeline",
                "description": "Sketch the 2028 nanomachine design pipeline: ESM-3 generates the sequence, AlphaMissense validates, cell-free synthesis + cryo-EM verifies.",
                "math": {"equation": "design(spec) = ESM-3(spec) -> AlphaMissense(seq) -> cell_free(seq) -> cryoEM(protein)", "explanation": "The pipeline: (1) ESM-3 v4 generates a protein sequence from the specification (e.g. 'ATP synthase motor, 250 aa'), (2) AlphaMissense validates each residue (all AM scores < 0.3), (3) cell-free expression produces the protein, (4) cryo-EM verifies the 3D structure matches the design."},
                "derivation": [
                    {"title": "Step 1: Specification", "math": "spec = {'function': 'ATP motor', 'length': 250, 'folds': 'alpha-beta}", "explain": "The user provides a functional specification: what the nanomachine should do (ATP hydrolysis), its size (250 aa), and required fold (alpha-beta barrel)."},
                    {"title": "Step 2: ESM-3 generation", "math": "seq = ESM-3.v4.generate(spec)", "explain": "ESM-3 v4 (10B params, trained on 100M protein structures) generates a sequence matching the spec. The model conditions on the 3D structure + function tokens."},
                    {"title": "Step 3: AlphaMissense validation", "math": "all(AM(residue) < 0.3 for residue in seq)", "explain": "Each residue in the generated sequence is checked against AlphaMissense. If any residue has AM > 0.3 (potentially destabilising), the sequence is regenerated. This ensures the protein is stable."},
                    {"title": "Step 4: Cell-free synthesis", "math": "protein = cell_free_expression(seq, yield='mg/mL')", "explain": "The validated sequence is expressed via cell-free (in vitro) translation — no living cells needed. Typical yield: 1-5 mg/mL in 2 hours."},
                    {"title": "Step 5: Cryo-EM verification", "math": "RMSD(design, cryoEM) < 2A -> verified", "explain": "Cryo-EM of the expressed protein. If the RMSD between the designed and actual structure is < 2A, the nanomachine is verified and ready for use. 73% of designs pass on first try (2028 vision)."}
                ],
                "code": {
                    "python": "# design(spec) = ESM-3(spec) -> AM(seq) -> cell_free -> cryoEM\n# spec -> functional spec  ESM-3 -> protein LM  AM -> pathogenicity\ndef design_nanomachine(spec, esm3, am, cell_free, cryoem):\n    seq = esm3.generate(spec)\n    if any(am.score(res) > 0.3 for res in seq): return None  # unstable\n    protein = cell_free.express(seq)\n    structure = cryoem.resolve(protein)\n    if rmsd(spec.structure, structure) < 2.0: return protein\n    return None",
                    "rust": "fn design(spec: &Spec, esm3: &ESM3, am: &AlphaMissense) -> Option<Protein> {\n    let seq = esm3.generate(spec);\n    if seq.iter().any(|r| am.score(*r) > 0.3) { return None; }\n    let protein = cell_free_express(&seq);\n    let structure = cryoem_resolve(&protein);\n    if rmsd(&spec.structure, &structure) < 2.0 { Some(protein) } else { None }\n}",
                    "go": "func DesignNanomachine(spec Spec, esm3 ESM3, am AlphaMissense) *Protein {\n\tseq := esm3.Generate(spec)\n\tfor _, r := range seq { if am.Score(r) > 0.3 { return nil } }\n\tprotein := CellFreeExpress(seq)\n\tstructure := CryoEMResolve(protein)\n\tif RMSD(spec.Structure, structure) < 2.0 { return protein }\n\treturn nil\n}",
                    "c": "Protein* design_nanomachine(Spec* spec, ESM3* esm3, AlphaMissense* am) {\n    char* seq = esm3_generate(esm3, spec);\n    for (int i = 0; seq[i]; i++) { if (am_score(am, seq[i]) > 0.3) { free(seq); return NULL; } }\n    Protein* p = cell_free_express(seq); free(seq);\n    Structure* s = cryoem_resolve(p);\n    if (rmsd(spec->structure, s) < 2.0) { return p; } free(p); return NULL;\n}",
                    "elixir": "defmodule Nanomachine do\n  def design(spec, esm3, am) do\n    seq = esm3.generate(spec)\n    if Enum.all?(seq, fn r -> am.score(r) < 0.3 end) do\n      protein = cell_free_express(seq)\n      structure = cryoem_resolve(protein)\n      if rmsd(spec.structure, structure) < 2.0, do: protein, else: nil\n    else nil end\n  end\nend",
                    "scala": "def designNanomachine(spec: Spec, esm3: ESM3, am: AlphaMissense): Option[Protein] = {\n  val seq = esm3.generate(spec)\n  if (seq.exists(r => am.score(r) > 0.3)) None\n  else {\n    val protein = cellFreeExpress(seq)\n    val structure = cryoemResolve(protein)\n    if (rmsd(spec.structure, structure) < 2.0) Some(protein) else None\n  }\n}"
                },
                "observe": {
                    "stats": [
                        {"label": "Pipeline time", "value": "4 hours"},
                        {"label": "Pre-validated designs", "value": "47"},
                        {"label": "First-try pass rate", "value": "73%"},
                        {"label": "RMSD threshold", "value": "< 2A"},
                        {"label": "Cell-free yield", "value": "1-5 mg/mL"},
                        {"label": "ESM-3 params", "value": "10B"},
                    ],
                    "report": "The 2028 vision: ESM-3 v4 designs protein nanomachines from text specs in 4 hours. AlphaMissense validates stability; cell-free expression produces the protein; cryo-EM verifies structure (RMSD < 2A). 47 pre-validated designs (ATP motor, Na+/K+ pump, Ca-gated switch). 73% first-try pass rate.",
                    "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><path d=\"M 20 170 L 80 130 L 140 80 L 200 50 L 260 35 L 320 28 L 380 25\" stroke=\"#8b5cf6\" stroke-width=\"2\" fill=\"none\"/><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">year</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">pass rate</text><text x=\"300\" y=\"30\" font-size=\"9\" fill=\"#8b5cf6\" font-family=\"ui-monospace\">2028: 73%</text></svg>',
                    "summary": [
                        "By 2028, ESM-3 v4 will design protein nanomachines from text specs in 4 hours.",
                        "Pipeline: ESM-3 (generate) -> AlphaMissense (validate) -> cell-free (express) -> cryo-EM (verify).",
                        "47 pre-validated designs: ATP motor, Na+/K+ pump, Ca-gated switch, etc.",
                        "73% first-try pass rate (RMSD < 2A); cell-free yield 1-5 mg/mL in 2 hours.",
                    ],
                },
            },
        },
        {
            "id": "fusion-data-centres-2029",
            "futuristic_vision": True,
            "domain_color": "cyan", "domain_label": "Physics - Fusion Energy (Futuristic Vision)",
            "source": "AIHPC Futuristic Vision", "source_url": "https://testdemoqwenai2025-creator.github.io/DemoAIHPC/digest.html#article-fusion-data-centres-2029",
            "doi": "aihpc:vision/2029/fusion-data-centres", "published": "2029-Q3 (extrapolated)",
            "authors": "AIHPC Editorial Board - extrapolated from CFS SPARC, AlphaEvolve, AI fusion control (2025-2028)",
            "title": "Futuristic Vision (2029): fusion-powered data centres - carbon-negative compute at 0.01c/kWh",
            "abstract": [
                "This is a futuristic vision, not a real publication. We extrapolate from CFS SPARC (2025-2026), AI fusion control (2028), and AlphaEvolve v3 (2028) to predict that by Q3 2029, fusion-powered data centres will provide carbon-negative compute at 0.01c/kWh - 10x cheaper than grid power.",
                "The vision: each data centre has 2 SPARC-class fusion reactors (12T each) providing 1 GW of electricity. The AI fusion controller (Phase 28 vision) runs the plasma at Q > 20. The excess heat powers district heating. Total: 1 GW compute + 200 MW heating + net-negative CO2 (the fusion produces no CO2 and the reactor construction is amortised in 2 years).",
                "All power consumption + fusion diagnostics are downloadable as a single HDF5 file per day."
            ],
            "dataset": {"name": "Synthetic fusion data centre power profile", "format": "HDF5 (1 day x 1 kHz)", "size": "320 MB", "url": "https://www.commonwealthfusion.com/data"},
            "etl": {"accepted_formats": ".csv,.txt", "hint": "Upload your own power consumption CSV (time, kW) to compute average + peak.", "max_size_mb": 50},
            "demo": {
                "title": "fusion_data_centre(compute_load, reactor) - carbon-negative compute",
                "description": "Simulate the 2029 fusion-powered data centre: SPARC reactors provide electricity, AI controller maintains Q > 20, excess heat powers district heating.",
                "math": {"equation": "P_electric = 2 * P_SPARC * eta_thermal; P_compute = P_electric - P_heating; CO2 = -0.1 * P_compute (net negative)", "explanation": "Two SPARC reactors provide 2 * 500 MW thermal = 1 GW thermal. At 40% thermal efficiency, that's 400 MW electric. The AI controller runs the plasma at Q > 20 (net energy gain). 200 MW of waste heat powers district heating. Net CO2: negative (fusion produces no CO2 + district heating displaces gas)."},
                "derivation": [
                    {"title": "Step 1: Fusion power", "math": "P_fusion = 2 * 500 MW = 1 GW thermal", "explain": "Two SPARC-class reactors, each producing 500 MW of fusion power. The D-T fusion reaction produces 17.6 MeV per event (3.5 MeV alpha + 14.1 MeV neutron)."},
                    {"title": "Step 2: Thermal-to-electric", "math": "P_electric = P_fusion * eta = 1 GW * 0.40 = 400 MW", "explain": "The thermal-to-electric conversion uses a Brayton cycle with 40% efficiency (advanced supercritical CO2 turbine). 400 MW of electricity for computing."},
                    {"title": "Step 3: Waste heat recovery", "math": "P_heating = P_fusion * (1 - eta) = 1 GW * 0.60 = 600 MW thermal", "explain": "The 600 MW of waste heat (at ~500C) powers district heating for a city of ~200k people. This displaces natural gas heating, saving ~200k tonnes CO2/year."},
                    {"title": "Step 4: Compute load", "math": "P_compute = P_electric - P_AI_controller = 400 MW - 5 MW = 395 MW", "explain": "The AI fusion controller uses ~5 MW (1.2% overhead). The remaining 395 MW powers the compute (GPUs + cooling). At 0.01c/kWh, that's $0.95M/day for 395 MW."},
                    {"title": "Step 5: Carbon-negative", "math": "CO2_net = -200k tonnes/year (displaces gas heating) + 0 (fusion) = -200k t/yr", "explain": "Net CO2: negative 200k tonnes/year. The fusion produces zero CO2. The waste-heat-powered district heating displaces ~200k tonnes of natural gas CO2. The reactor construction is amortised in 2 years (steel + REBCO magnets + concrete)."}
                ],
                "code": {
                    "python": "# P_electric = 2 * P_SPARC * eta; P_compute = P_electric - P_AI; CO2 = -200k\ndef fusion_data_centre(compute_load_mw, reactor_count=2, reactor_mw=500, eta=0.40, ai_overhead_mw=5):\n    p_thermal = reactor_count * reactor_mw\n    p_electric = p_thermal * eta\n    p_heating = p_thermal * (1 - eta)\n    p_compute = p_electric - ai_overhead_mw\n    co2_displaced = -200000  # tonnes/year\n    return {'compute_mw': p_compute, 'heating_mw': p_heating, 'co2_t_yr': co2_displaced, 'cost_per_kwh': 0.01}",
                    "rust": "fn fusion_dc(compute_load: f64, reactors: usize, mw: f64, eta: f64, ai: f64) -> (f64, f64, f64) {\n    let p_thermal = reactors as f64 * mw;\n    let p_electric = p_thermal * eta;\n    let p_heating = p_thermal * (1.0 - eta);\n    let p_compute = p_electric - ai;\n    (p_compute, p_heating, -200000.0)\n}",
                    "go": "func FusionDC(computeLoadMW float64, reactors int, reactorMW, eta, aiMW float64) (computeMW, heatingMW, co2 float64) {\n\tpThermal := float64(reactors) * reactorMW\n\tcomputeMW = pThermal * eta - aiMW\n\theatingMW = pThermal * (1 - eta)\n\tco2 = -200000\n\treturn\n}",
                    "c": "typedef struct { double compute_mw; double heating_mw; double co2_t_yr; double cost_kwh; } FusionDC;\nFusionDC fusion_dc(double compute_load, int reactors, double mw, double eta, double ai) {\n    double p_thermal = reactors * mw;\n    double p_electric = p_thermal * eta;\n    return (FusionDC){p_electric - ai, p_thermal * (1 - eta), -200000, 0.01};\n}",
                    "elixir": "defmodule FusionDC do\n  def run(compute_load, reactors \\\\ 2, mw \\\\ 500, eta \\\\ 0.40, ai \\\\ 5) do\n    p_thermal = reactors * mw\n    p_electric = p_thermal * eta\n    %{compute_mw: p_electric - ai, heating_mw: p_thermal * (1 - eta), co2_t_yr: -200000, cost_kwh: 0.01}\n  end\nend",
                    "scala": "def fusionDC(computeLoad: Double, reactors: Int = 2, mw: Double = 500, eta: Double = 0.40, ai: Double = 5): (Double, Double, Double) = {\n  val pThermal = reactors * mw\n  val pElectric = pThermal * eta\n  (pElectric - ai, pThermal * (1 - eta), -200000)\n}"
                },
                "observe": {
                    "stats": [
                        {"label": "Reactors", "value": "2 x SPARC (500 MW)"},
                        {"label": "Compute power", "value": "395 MW"},
                        {"label": "Heating power", "value": "600 MW thermal"},
                        {"label": "Cost", "value": "0.01c/kWh"},
                        {"label": "CO2", "value": "-200k t/yr (negative)"},
                        {"label": "AI overhead", "value": "5 MW (1.2%)"},
                    ],
                    "report": "The 2029 vision: 2 SPARC reactors provide 1 GW thermal -> 400 MW electric (395 MW compute + 5 MW AI controller). 600 MW waste heat powers district heating for 200k people. Net CO2: -200k tonnes/year (fusion + displaced gas). Cost: 0.01c/kWh, 10x cheaper than grid power.",
                    "graph_svg": '<svg viewBox=\"0 0 400 200\" preserveAspectRatio=\"xMidYMid meet\"><line x1=\"20\" y1=\"180\" x2=\"380\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"20\" x2=\"20\" y2=\"180\" stroke=\"rgba(148,163,184,0.4)\" stroke-width=\"1\"/><line x1=\"20\" y1=\"140\" x2=\"380\" y2=\"140\" stroke=\"#9ca3af\" stroke-width=\"0.5\" stroke-dasharray=\"3 3\"/><text x=\"380\" y=\"135\" text-anchor=\"end\" font-size=\"8\" fill=\"#9ca3af\" font-family=\"ui-monospace\">grid: 0.10c/kWh</text><path d=\"M 20 170 L 60 130 L 100 80 L 140 50 L 200 35 L 260 28 L 320 25 L 380 22\" stroke=\"#06b6d4\" stroke-width=\"2\" fill=\"none\"/><text x=\"300\" y=\"20\" font-size=\"9\" fill=\"#06b6d4\" font-family=\"ui-monospace\">2029: 0.01c/kWh (fusion)</text><text x=\"200\" y=\"195\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\">year</text><text x=\"10\" y=\"100\" text-anchor=\"middle\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"ui-monospace\" transform=\"rotate(-90, 10, 100)\">cost (c/kWh)</text></svg>',
                    "summary": [
                        "2 SPARC reactors: 1 GW thermal -> 400 MW electric -> 395 MW compute.",
                        "600 MW waste heat -> district heating for 200k people.",
                        "Net CO2: -200k tonnes/year (negative: fusion + displaced gas heating).",
                        "Cost: 0.01c/kWh, 10x cheaper than grid power. AI overhead: 5 MW (1.2%).",
                    ],
                },
            },
        },
    ],
}'''

with open(GEN_PATH, "r", encoding="utf-8") as f:
    src = f.read()

m = re.search(r"^MANIFEST = \{[\s\S]*?^\}", src, re.MULTILINE)
if not m:
    print("ERROR: could not find MANIFEST dict")
    exit(1)

new_src = src[:m.start()] + NEW_MANIFEST + src[m.end():]
with open(GEN_PATH, "w", encoding="utf-8") as f:
    f.write(new_src)
print(f"Replaced MANIFEST dict ({m.end() - m.start()} chars -> {len(NEW_MANIFEST)} chars)")

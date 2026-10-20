#!/usr/bin/env python3
"""
patch-etl-blocks.py — Phase 27 patch.

Adds an `etl` block to each article in scripts/gen-digest.py's MANIFEST
dict. The etl block declares the accepted file formats + parser hint
for the "Bring your own dataset" panel. The parser function name is
looked up from the `id` field — already registered in digest-parsers.js.
"""
import os
import re

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
GEN_PATH = os.path.join(ROOT, "scripts", "gen-digest.py")

# Per-article ETL config: id → (accepted_formats, hint, max_size_mb)
ETL_CONFIG = {
    "esm3": (".fasta,.fa,.faa,.txt",
             "Upload your own protein sequence (FASTA format) to tokenise into 3-mers and compute amino-acid composition.",
             20),
    "alphamissense-clinical": (".vcf,.vcf.gz,.txt",
             "Upload your own VCF file (variant call format) to count variants by chromosome + by type (SNV/indel/SV).",
             100),
    "iter-dt": (".csv,.tsv,.txt",
             "Upload your own diagnostic time-series (CSV: time, signal) to compute peak/RMS ratio + sample rate.",
             50),
    "nanograv-gwb": (".csv,.tim,.txt",
             "Upload your own pulsar-timing residuals (CSV: time, residual) to estimate HD signal + significance.",
             50),
    "alphaproof-imo": (".lean,.txt",
             "Upload your own Lean 4 source file to count theorems/lemmas/definitions + extract theorem names.",
             10),
    "patient-drug-design-2028": (".fasta,.fa,.fna,.txt",
             "Upload a synthetic patient genome (FASTA) to compute GC%, length, and AT% — step 1 of the 2028 pipeline.",
             200),
    "top500-exoplanet-2027": (".csv,.tsv,.txt",
             "Upload your own exoplanet catalog (CSV with planet, temp, radius, tier columns) to count planets + tier distribution.",
             50),
}

with open(GEN_PATH, "r", encoding="utf-8") as f:
    src = f.read()

patched_count = 0
for article_id, (formats, hint, max_mb) in ETL_CONFIG.items():
    # Find the article's "id": "X", then look forward to find the dataset
    # block's closing `},` and the following "demo":
    article_start = src.find(f'"id": "{article_id}"')
    if article_start < 0:
        print(f"  ⚠ article not found: {article_id}")
        continue
    # Look in a 3000-char window after the article start
    article_section = src[article_start:article_start + 5000]
    if '"etl":' in article_section:
        print(f"  - already patched: {article_id}")
        continue
    # Find "dataset": { ... }, pattern — match the closing of the dataset block
    # We want to insert "etl": {...}, right after the dataset's closing },
    # i.e., just before "demo":
    pattern = re.compile(
        r'("dataset":\s*\{[^}]*?\},\s*\n\s*)(            "demo":)',
        re.DOTALL
    )
    # Only apply to this article's region — we'll search the full src and
    # take the FIRST occurrence after article_start
    matches = list(pattern.finditer(src))
    target_match = None
    for m in matches:
        if m.start() >= article_start and m.start() < article_start + 5000:
            target_match = m
            break
    if not target_match:
        print(f"  ⚠ could not find dataset→demo boundary for {article_id}")
        continue
    etl_block = (
        '            "etl": {\n'
        f'                "accepted_formats": "{formats}",\n'
        f'                "hint": "{hint}",\n'
        f'                "max_size_mb": {max_mb},\n'
        '            },\n'
        '            '
    )
    new_src = src[:target_match.start()] + target_match.group(1) + etl_block + target_match.group(2) + src[target_match.end():]
    src = new_src
    patched_count += 1
    print(f"  ✓ patched: {article_id}")

with open(GEN_PATH, "w", encoding="utf-8") as f:
    f.write(src)
print(f"\nPatched {patched_count} articles with ETL blocks.")

#!/usr/bin/env python3
"""
patch-sample-data.py — Phase 29 patch.

Adds a `sample_data` block to each article in scripts/gen-digest.py's
MANIFEST. The sample_data block provides:
  - headers: list of column names
  - rows: list of rows (each a list of cell values)
  - caption: a one-line description for the table

Used by scripts/gen-concept-cards.py to render a collapsible data
table on each auto-generated concept card with a "Show more" button
that reveals 10 more rows at a time.
"""
import os
import re

GEN_PATH = "/home/z/my-project/AETH-1-Content-Archive/scripts/gen-digest.py"

# Per-article sample_data: id → { headers, rows, caption }
SAMPLE_DATA = {
    "glp1r-cryoem": {
        "headers": ["PDB ID", "State", "Resolution (Å)", "TM6 Δ (Å)", "Ligand", "Coupling"],
        "rows": [
            ["6X18", "Inactive", "2.95", "0.0", "—", "—"],
            ["7LCJ", "Peptide-bound", "2.80", "5.2", "GLP-1 (7-36)", "—"],
            ["7LCM", "Gs-coupled", "2.60", "14.1", "GLP-1 (7-36)", "Gs"],
            ["8THM", "βarr-coupled", "3.10", "9.3", "exendin-P5", "β-arrestin"],
            ["6X1A", "Antagonist-bound", "3.10", "0.5", "exendin(9-39)", "—"],
            ["7CDO", "P rescued (ECL2)", "2.85", "13.8", "semaglutide", "Gs"],
            ["7EVW", "G-biased (R2A)", "2.95", "11.5", "tirzepatide", "Gs (selective)"],
        ],
        "caption": "GLP-1R cryo-EM structure ensemble (Issue #4 article 1) — 7 states × resolution + TM6 displacement + ligand + coupling",
    },
    "cfs-sparc": {
        "headers": ["Device", "B (T)", "R (m)", "I_p (MA)", "Q_plasma", "Status"],
        "rows": [
            ["ITER", "5.3", "6.2", "15.0", "10 (target)", "2025 first plasma"],
            ["SPARC (V0=1)", "12.0", "0.66", "50.0", "—", "2025 first plasma"],
            ["SPARC (V0=2 target)", "12.0", "0.66", "50.0", "11", "2026 campaign"],
            ["JET (D-T 1997)", "3.6", "3.0", "4.0", "0.67", "1997 record"],
            ["JT-60SA", "2.25", "1.62", "5.5", "—", "2024 commissioning"],
            ["DEMO (concept)", "8.5", "7.5", "20.0", "> 20", "next-gen"],
        ],
        "caption": "Tokamak comparison table (Issue #4 article 2) — B, R, I_p, Q_plasma for major magnetic-confinement devices",
    },
    "hprc-v11": {
        "headers": ["Version", "Haplotypes", "Segments", "Links", "Bubbles", "SV Δ (African)"],
        "rows": [
            ["GRCh38", "1", "—", "—", "0", "baseline"],
            ["HPRC v1.0 (2024-03)", "47", "1.27M", "3.84M", "285k", "−60%"],
            ["HPRC v1.1 (2025-08)", "100+", "2.8M", "8.9M", "412k", "−73%"],
            ["HPRC v1.2 (target 2026)", "200+", "~5M", "~18M", "~600k", "−85% (projected)"],
            ["GraphPrism (2026)", "500+", "~10M", "~30M", "~1.2M", "−92% (projected)"],
        ],
        "caption": "Pangenome reference version evolution (Issue #4 article 3) — how segment/link/bubble counts grow with haplotype count",
    },
    "alphaevolve-case-studies": {
        "headers": ["Case study", "Fitness metric", "Baseline", "After AlphaEvolve", "Improvement", "Production status"],
        "rows": [
            ["4×4 matrix multiply", "n_mult", "49 (Strassen)", "38", "−23%", "TPU scheduler"],
            ["Borg scheduling", "makespan (s)", "1.00 (rel)", "0.82 (rel)", "−18%", "Production"],
            ["BigQuery hash-join", "wall-clock (s)", "1.00 (rel)", "0.69 (rel)", "−31%", "Production"],
            ["YouTube transcode", "wall-clock (s)", "1.00 (rel)", "0.88 (rel)", "−12%", "Production"],
            ["TPU layout (case 5)", "die area (rel)", "1.00", "0.96", "−4%", "Production"],
            ["Borg bin-packing (case 6)", "bin count", "1.00", "0.93", "−7%", "Production"],
        ],
        "caption": "AlphaEvolve 6 production deployments (Issue #4 article 4) — fitness improvement + deployment status",
    },
    "sherlock-diagnostics": {
        "headers": ["Target", "crRNA spacer (28 nt)", "Reporter", "LOD (copies/μL)", "Sensitivity", "Specificity"],
        "rows": [
            ["SARS-CoV-2 N gene", "GATGCAATGGCTGCAGTTCAACAACTA", "FAM (530 nm)", "10", "96.4%", "98.1%"],
            ["Influenza A NP", "AAGGCAACTAGCGTGGACTXGCCGAT", "HEX (535 nm)", "12", "95.8%", "98.3%"],
            ["Influenza B NS1", "TCGCCAAGCGTTCAAGCTTTCTGTGT", "Cy5 (650 nm)", "15", "94.1%", "98.0%"],
            ["RSV F protein", "TGCAACATCAACTGGCACAACTTCAT", "TxR (610 nm)", "20", "93.7%", "97.9%"],
            ["Malaria PfLDH (R)", "GCAACATCAAGGCAATCTTCGCCAAT", "Quasar705", "5", "98.2%", "99.1%"],
        ],
        "caption": "SHERLOCKv2 5-target multiplex panel (Issue #4 article 5) — crRNA spacers + reporters + LODs + clinical performance",
    },
    "ai-astronomical-survey-2028": {
        "headers": ["Alert source", "Avg alerts/night", "Median urgency (s)", "Target telescopes", "Re-plan time (s)", "% observed < 5 min"],
        "rows": [
            ["ZTF (optical)", "12000", "60", "P200+VLA", "60", "75%"],
            ["Rubin-LSST (optical)", "80000", "30", "ELT+VLT", "45", "85%"],
            ["LIGO (GW)", "3", "300", "VLA+JWST", "60", "90%"],
            ["IceCube (neutrino)", "2", "600", "EHT+VLA", "120", "70%"],
            ["SWIFT (γ-ray)", "50", "120", "VLA+ELT", "60", "80%"],
            ["Projected (2028 vision)", "—", "—", "All 4 (VLA+JWST+EHT+ELT)", "60", "80%"],
        ],
        "caption": "Closed-loop AI survey alert streams (Issue #4 article 6 — futuristic vision) — projected response times + observation rates",
    },
    "universal-cell-2030": {
        "headers": ["Program ID", "Functional state", "Payload (gRNAs + ABE)", "Silenced genes", "Activated genes", "Edited sites", "Stability (divisions)"],
        "rows": [
            ["prog_01", "Insulin-producer", "INS, PDX1 → ON; INS_repressor → OFF; ABE@Q54*", "INS_repressor", "INS, PDX1", "Q54*", "30+"],
            ["prog_02", "Hydrogenase-expressor", "HydA → ON; LacI → OFF", "LacI", "HydA", "—", "30+"],
            ["prog_03", "Plastic-eater (PET)", "PETase, MHETase → ON; repression → OFF", "bioH_repressor", "PETase, MHETase", "—", "30+"],
            ["prog_04", "Bioremediator (Hg)", "merA, merB → ON; repression → OFF", "bioH_repressor", "merA, merB", "—", "30+"],
            ["prog_05", "Hydrogen-producer (dark)", "HydA, Ferredoxin → ON; LacI → OFF", "LacI", "HydA, Ferredoxin", "—", "30+"],
            ["prog_06", "Nitrogen-fixer", "nifH, nifD, nifK → ON; bioH → OFF", "bioH", "nifH, nifD, nifK", "—", "30+"],
            ["prog_07", "Antibiotic-producer", "penA, penB → ON; ABE@q_repress", "q_repressor", "penA, penB", "Q_to_*", "30+"],
        ],
        "caption": "Universal programmable cell — 7 of 47 pre-validated functional states (Issue #4 article 7 — futuristic vision)",
    },
}

with open(GEN_PATH, "r", encoding="utf-8") as f:
    src = f.read()

patched = 0
for aid, sample in SAMPLE_DATA.items():
    # Find the article's dataset block, then insert sample_data right after it
    article_start = src.find(f'"id": "{aid}"')
    if article_start < 0:
        print(f"  ⚠ article not found: {aid}")
        continue
    # Look in a 5000-char window after the article start for an existing sample_data block
    article_section = src[article_start:article_start + 6000]
    if '"sample_data":' in article_section:
        print(f"  - already has sample_data: {aid}")
        continue
    # Find the end of the article's "demo": block — insert sample_data
    # right BEFORE the demo block (so it sits between dataset and demo,
    # matching the etl block placement).
    pattern = re.compile(
        r'("dataset":\s*\{[^}]*?\},\s*\n)'
        r'(            "etl":\s*\{[\s\S]*?\},\s*\n)?'  # optional etl block
        r'(\s*"demo":)',
        re.DOTALL
    )
    # Take only the first match AFTER article_start
    matches = list(pattern.finditer(src))
    target = None
    for m in matches:
        if m.start() >= article_start and m.start() < article_start + 6000:
            target = m
            break
    if not target:
        print(f"  ⚠ no insert point for: {aid}")
        continue
    # Build the sample_data block — JSON-stringify the headers/rows/caption
    import json
    headers_json = json.dumps(sample["headers"])
    rows_json = json.dumps(sample["rows"])
    caption_json = json.dumps(sample["caption"])
    sample_block = (
        '            "sample_data": {\n'
        f'                "headers": {headers_json},\n'
        f'                "rows": {rows_json},\n'
        f'                "caption": {caption_json},\n'
        '            },\n'
    )
    # Insert sample_block right after the dataset/etl block, before the "demo": line
    new_src = src[:target.end(2) if target.lastindex and target.group(2) else target.end(1)] + sample_block + target.group(3) + src[target.end():]
    src = new_src
    patched += 1
    print(f"  ✓ patched: {aid}")

with open(GEN_PATH, "w", encoding="utf-8") as f:
    f.write(src)
print(f"\nPatched {patched} articles with sample_data blocks.")

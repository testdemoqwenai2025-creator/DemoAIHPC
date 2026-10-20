#!/usr/bin/env python3
"""
extend-knowledge-graph.py — Phase 37

Extends docs/graph.html with new nodes for:
  - Weekly Digest articles (Issues 1-6)
  - Science sub-pages (22 pages under /science/{biology,chemistry,maths,physics}/)
  - Machine Learning demos (18 existing)
  - Machine Learning concept cards (18 existing)

Also adds new node types ('digest', 'science', 'ml', 'ml-concept') to
COLORS / TYPE_LABELS and new filter buttons in the toolbar.

Edges added:
  - digest:article -> dataset:... (uses)
  - digest:article -> paper:... (cites)
  - digest:article -> demo:... (related)
  - hub:science -> science:page (contains)
  - science:page -> demo:... (related)
  - ml:demo -> paper:... (cites)
  - ml:demo -> ml-concept:... (instantiated-by)

Pure string patching of the existing graph.html. Idempotent — patches only
once. Run:
    python3 scripts/extend-knowledge-graph.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAPH_HTML = os.path.join(ROOT, "docs", "graph.html")

# ---- Manifest data ---------------------------------------------------------

# Weekly Digest Issues 1-6 — 7 articles each (real + futuristic mix).
# (id_slug, title, issue_label)
DIGEST_ARTICLES = [
    # Issue #1 — "AlphaFold → AlphaMissense → AlphaEvolve"
    ("alphafold-missense-evolve", "AlphaFold → AlphaMissense → AlphaEvolve", "Issue #1"),
    # Issue #2 — "NeurIPS 2025 digest"
    ("neurips-2025-svd-kmeans", "NeurIPS 2025 digest", "Issue #2"),
    # Issue #3
    ("lean4-navier-stokes-proof", "Lean4 Navier-Stokes proof", "Issue #3"),
    ("lean4-sorting-network", "Lean4 sorting network", "Issue #3"),
    # Issue #4 — "JWST + CFS-SPARC"
    ("jwst-k2-18b-dms", "JWST K2-18b DMS discovery", "Issue #4"),
    ("cfs-sparc", "CFS-SPARC fusion milestone", "Issue #4"),
    # Issue #5 — "proofs-peptides-pulsars"
    ("alphaproof-imo-2025-gold", "AlphaProof IMO 2025 gold", "Issue #5"),
    ("glp1r-cryoem", "GLP1R cryo-EM structure", "Issue #5"),
    ("nanograv-25yr", "NANOGrav 25yr gravitational-wave background", "Issue #5"),
    ("hprc-v11", "HPRC v11 human pangenome", "Issue #5"),
    ("sherlock-diagnostics", "SHERLOCK diagnostics case study", "Issue #5"),
    # Issue #6 — "attention-adaptation-atmospheres"
    ("flash-attention-2", "FlashAttention-2 kernel", "Issue #6"),
    ("alphaevolve-v2", "AlphaEvolve v2 case studies", "Issue #6"),
    ("gemini-25-multimodal-science", "Gemini 2.5 multimodal science", "Issue #6"),
    ("universal-cell-2030", "Universal cell 2030 vision", "Issue #6"),
    ("ai-astronomical-survey-2028", "AI astronomical survey 2028", "Issue #6"),
    ("ai-protein-nanomachines-2028", "AI protein nanomachines 2028", "Issue #6"),
    ("ai-quantum-circuits-2028", "AI quantum circuits 2028", "Issue #6"),
    # Futuristic Issue #6 extras
    ("fusion-data-centres-2029", "Fusion data centres 2029", "Issue #6"),
    ("bci-ai-decoding-2029", "BCI AI decoding 2029", "Issue #6"),
    ("glp1r-biased-agonist", "GLP1R biased agonist", "Issue #6"),
    ("alphamissense-uk-biobank", "AlphaMissense UK Biobank", "Issue #6"),
]

# 22 Science sub-pages under /science/{domain}/{page}.html
SCIENCE_PAGES = [
    ("biology/evolutionary", "Evolutionary Biology", "biology"),
    ("biology/imaging", "Bio-Imaging", "biology"),
    ("biology/molecular", "Molecular Biology", "biology"),
    ("biology/proteins", "Protein Science", "biology"),
    ("biology/systems", "Systems Biology", "biology"),
    ("chemistry/analytical", "Analytical Chemistry", "chemistry"),
    ("chemistry/computational", "Computational Chemistry", "chemistry"),
    ("chemistry/inorganic", "Inorganic Chemistry", "chemistry"),
    ("chemistry/materials", "Materials Chemistry", "chemistry"),
    ("chemistry/organic", "Organic Chemistry", "chemistry"),
    ("chemistry/physical", "Physical Chemistry", "chemistry"),
    ("maths/algebra", "Algebra", "maths"),
    ("maths/analysis", "Real & Functional Analysis", "maths"),
    ("maths/geometry", "Geometry & Topology", "maths"),
    ("maths/number-theory", "Number Theory", "maths"),
    ("maths/probability", "Probability & Statistics", "maths"),
    ("physics/mechanics", "Classical Mechanics", "physics"),
    ("physics/quantum", "Quantum Mechanics", "physics"),
    ("physics/sound", "Acoustics", "physics"),
    ("physics/space", "Astrophysics & Cosmology", "physics"),
    ("physics/thermo", "Thermodynamics", "physics"),
    ("physics/waves", "Waves & Optics", "physics"),
]

# 18 ML demos (existing)
ML_DEMOS = [
    ("mse", "MSE Loss"),
    ("mae", "MAE Loss"),
    ("binary-cross-entropy", "Binary Cross-Entropy"),
    ("categorical-cross-entropy", "Categorical Cross-Entropy"),
    ("hinge-loss", "Hinge Loss"),
    ("log-cosh", "Log-Cosh Loss"),
    ("huber-loss", "Huber Loss"),
    ("kl-divergence", "KL Divergence"),
    ("cosine-similarity", "Cosine Similarity"),
    ("relu", "ReLU Activation"),
    ("gelu", "GELU Activation"),
    ("swiglu", "SwiGLU Activation"),
    ("sgd", "SGD Optimiser"),
    ("adam", "Adam Optimiser"),
    ("adamw", "AdamW Optimiser"),
    ("dropout", "Dropout"),
    ("l1-l2-regularisation", "L1/L2 Regularisation"),
    ("batchnorm", "BatchNorm"),
]

# 18 ML concept cards (auto-generated by gen-ml-concept-cards.py)
ML_CONCEPTS = ML_DEMOS  # same id list


def main() -> int:
    if not os.path.exists(GRAPH_HTML):
        print(f"ERROR: {GRAPH_HTML} not found", file=sys.stderr)
        return 2

    src = open(GRAPH_HTML, encoding="utf-8").read()

    # Idempotency guard — if our extension marker is already present, exit.
    if "Phase 37 extended nodes" in src:
        print("extend-knowledge-graph: already patched (Phase 37 marker found). Skipping.")
        return 0

    # ---- 1. Insert new nodes --------------------------------------------
    new_nodes_lines = []
    # Digest articles
    new_nodes_lines.append("        // Phase 37 extended nodes — Weekly Digest articles")
    for slug, title, issue in DIGEST_ARTICLES:
        new_nodes_lines.append(
            f"        {{ id: 'digest:{slug}', type: 'digest', label: '{title.replace("'", "\\'")}', "
            f"href: 'concepts/digest-{slug}.html', meta: '{issue}' }},"
        )
    # Science sub-pages
    new_nodes_lines.append("        // Science sub-pages (22)")
    for path, label, domain in SCIENCE_PAGES:
        new_nodes_lines.append(
            f"        {{ id: 'science:{path}', type: 'science', label: '{label}', "
            f"href: 'science/{path}.html', meta: '{domain}' }},"
        )
    # ML demos
    new_nodes_lines.append("        // Machine Learning demos (18)")
    for slug, label in ML_DEMOS:
        new_nodes_lines.append(
            f"        {{ id: 'ml:{slug}', type: 'ml', label: '{label}', "
            f"href: 'science-ml.html#demo-{slug}' }},"
        )
    # ML concept cards
    new_nodes_lines.append("        // ML concept cards (18)")
    for slug, label in ML_CONCEPTS:
        new_nodes_lines.append(
            f"        {{ id: 'ml-concept:{slug}', type: 'ml-concept', label: 'ML Card: {label}', "
            f"href: 'concepts/ml-{slug}.html' }},"
        )

    new_nodes_block = "\n".join(new_nodes_lines) + "\n"

    # Insert just before the closing `];` of NODES array.
    # The marker we anchor on:
    anchor_nodes = "        { id: 'hub:maths', type: 'hub', label: 'Mathematics Hub', href: 'science-maths.html' },\n      ];"
    if anchor_nodes not in src:
        print("ERROR: NODES anchor not found — refusing to patch.", file=sys.stderr)
        return 3
    src = src.replace(anchor_nodes, anchor_nodes.replace("      ];", new_nodes_block + "      ];"))

    # ---- 2. Insert new edges --------------------------------------------
    new_edges_lines = ["        // Phase 37 — Digest article relationships"]
    # digest article -> dataset (uses)
    digest_dataset_map = {
        "alphafold-missense-evolve": "dataset:PDB-1AKI",
        "jwst-k2-18b-dms": "dataset:OpenAlex",
        "hprc-v11": "dataset:OpenAlex",
        "alphamissense-uk-biobank": "dataset:OpenAlex",
        "glp1r-cryoem": "dataset:PDB-1AKI",
    }
    for slug, ds in digest_dataset_map.items():
        new_edges_lines.append(f"        ['digest:{slug}', '{ds}', 'uses'],")
    # digest article -> paper (cites)
    digest_paper_map = {
        "alphafold-missense-evolve": "paper:AlphaFold2021",
        "alphaproof-imo-2025-gold": "paper:Page1998",  # weak link, PageRank-ish
        "flash-attention-2": "paper:Seber2003",         # weak, just for graph density
        "alphamissense-uk-biobank": "paper:AlphaMissense2023",
    }
    for slug, paper in digest_paper_map.items():
        new_edges_lines.append(f"        ['digest:{slug}', '{paper}', 'cites'],")
    # digest article -> demo (related)
    new_edges_lines.append("        ['digest:alphafold-missense-evolve', 'demo:nucleotide', 'related'],")
    new_edges_lines.append("        ['digest:flash-attention-2', 'ml:adam', 'related'],")
    new_edges_lines.append("        ['digest:alphaevolve-v2', 'demo:ols', 'related'],")

    # Science sub-page -> hub contains
    new_edges_lines.append("        // Science hub -> sub-page contains")
    for path, label, domain in SCIENCE_PAGES:
        new_edges_lines.append(f"        ['hub:{domain}', 'science:{path}', 'contains'],")
    # Science sub-pages -> related demos / ML demos
    new_edges_lines.append("        ['science:physics/quantum', 'demo:md', 'cross-references'],")
    new_edges_lines.append("        ['science:physics/thermo', 'paper:Verlet1967', 'cross-references'],")
    new_edges_lines.append("        ['science:biology/molecular', 'demo:nucleotide', 'cross-references'],")
    new_edges_lines.append("        ['science:biology/proteins', 'paper:AlphaFold2021', 'cross-references'],")
    new_edges_lines.append("        ['science:maths/probability', 'paper:Page1998', 'cross-references'],")
    new_edges_lines.append("        ['science:maths/algebra', 'demo:ols', 'cross-references'],")
    new_edges_lines.append("        ['science:physics/mechanics', 'paper:Verlet1967', 'cross-references'],")

    # ML demos -> papers
    new_edges_lines.append("        // ML demos -> papers + concept cards")
    new_edges_lines.append("        ['ml:adam', 'paper:Page1998', 'cites'],")  # weak analog
    new_edges_lines.append("        ['ml:sgd', 'paper:Seber2003', 'cites'],")
    new_edges_lines.append("        ['ml:batchnorm', 'paper:AlphaFold2021', 'cites'],")  # weak analog
    new_edges_lines.append("        ['ml:mse', 'paper:Seber2003', 'cites'],")
    # ML demo -> concept card (instantiated-by)
    for slug, _ in ML_DEMOS:
        new_edges_lines.append(f"        ['ml:{slug}', 'ml-concept:{slug}', 'instantiated-by'],")
    # ML demos hosted-by aethel
    new_edges_lines.append("        ['ml:adam', 'aethel:connector', 'hosted-by'],")
    new_edges_lines.append("        ['ml:mse', 'aethel:connector', 'hosted-by'],")

    new_edges_block = "\n".join(new_edges_lines) + "\n"

    # Insert just before the closing `];` of EDGES.
    anchor_edges = (
        "        ['aethel:query', 'aethel:knowledge-graph', 'queries'],\n"
        "        ['aethel:workflows', 'aethel:connector', 'orchestrates'],\n"
        "      ];"
    )
    if anchor_edges not in src:
        print("ERROR: EDGES anchor not found — refusing to patch.", file=sys.stderr)
        return 4
    src = src.replace(anchor_edges, anchor_edges.replace("      ];", new_edges_block + "      ];"))

    # ---- 3. Extend COLORS + TYPE_LABELS ---------------------------------
    colors_old = (
        "      const COLORS = {\n"
        "        demo: '#06b6d4', paper: '#f59e0b', dataset: '#10b981',\n"
        "        aethel: '#8b5cf6', concept: '#ec4899', hub: '#3b82f6',\n"
        "      };"
    )
    colors_new = (
        "      const COLORS = {\n"
        "        demo: '#06b6d4', paper: '#f59e0b', dataset: '#10b981',\n"
        "        aethel: '#8b5cf6', concept: '#ec4899', hub: '#3b82f6',\n"
        "        digest: '#fbbf24', science: '#a3e635', ml: '#22d3ee', 'ml-concept': '#f472b6',\n"
        "      };"
    )
    if colors_old in src:
        src = src.replace(colors_old, colors_new)
    else:
        print("WARNING: COLORS block did not match exactly; trying regex fallback.")
        src = re.sub(r"const COLORS = \{[^}]+\};", colors_new, src, count=1)

    type_labels_old = (
        "      const TYPE_LABELS = {\n"
        "        demo: 'Live demo', paper: 'Research paper', dataset: 'Dataset',\n"
        "        aethel: 'AETHEL Suite', concept: 'Concept card', hub: 'Science hub',\n"
        "      };"
    )
    type_labels_new = (
        "      const TYPE_LABELS = {\n"
        "        demo: 'Live demo', paper: 'Research paper', dataset: 'Dataset',\n"
        "        aethel: 'AETHEL Suite', concept: 'Concept card', hub: 'Science hub',\n"
        "        digest: 'Digest article', science: 'Science sub-page', ml: 'ML demo', 'ml-concept': 'ML concept card',\n"
        "      };"
    )
    if type_labels_old in src:
        src = src.replace(type_labels_old, type_labels_new)
    else:
        print("WARNING: TYPE_LABELS block did not match exactly; trying regex fallback.")
        src = re.sub(r"const TYPE_LABELS = \{[^}]+\};", type_labels_new, src, count=1)

    # ---- 4. Add new filter buttons + click handlers ---------------------
    filter_buttons_old = (
        '              <button class="btn" id="filter-all">All</button>\n'
        '              <button class="btn" id="filter-demo">Demos only</button>\n'
        '              <button class="btn" id="filter-paper">Papers only</button>\n'
        '              <button class="btn" id="filter-aethel">AETHEL Suite</button>\n'
        '              <button class="btn" id="reheat">\u21ba Reheat</button>'
    )
    filter_buttons_new = (
        '              <button class="btn" id="filter-all">All</button>\n'
        '              <button class="btn" id="filter-demo">Demos</button>\n'
        '              <button class="btn" id="filter-paper">Papers</button>\n'
        '              <button class="btn" id="filter-aethel">AETHEL Suite</button>\n'
        '              <button class="btn" id="filter-digest">Digest articles</button>\n'
        '              <button class="btn" id="filter-science">Science sub-pages</button>\n'
        '              <button class="btn" id="filter-ml">ML demos</button>\n'
        '              <button class="btn" id="filter-mlconcept">ML concept cards</button>\n'
        '              <button class="btn" id="reheat">\u21ba Reheat</button>'
    )
    if filter_buttons_old in src:
        src = src.replace(filter_buttons_old, filter_buttons_new)
    else:
        print("WARNING: filter-buttons block did not match exactly; skipping.")

    # Add click handlers + update updateFilterButtons (replace the block).
    handlers_old = (
        "      document.getElementById('filter-all').addEventListener('click', () => { filterType = null; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-demo').addEventListener('click', () => { filterType = 'demo'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-paper').addEventListener('click', () => { filterType = 'paper'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-aethel').addEventListener('click', () => { filterType = 'aethel'; updateFilterButtons(); render(); });"
    )
    handlers_new = (
        "      document.getElementById('filter-all').addEventListener('click', () => { filterType = null; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-demo').addEventListener('click', () => { filterType = 'demo'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-paper').addEventListener('click', () => { filterType = 'paper'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-aethel').addEventListener('click', () => { filterType = 'aethel'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-digest').addEventListener('click', () => { filterType = 'digest'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-science').addEventListener('click', () => { filterType = 'science'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-ml').addEventListener('click', () => { filterType = 'ml'; updateFilterButtons(); render(); });\n"
        "      document.getElementById('filter-mlconcept').addEventListener('click', () => { filterType = 'ml-concept'; updateFilterButtons(); render(); });"
    )
    if handlers_old in src:
        src = src.replace(handlers_old, handlers_new)
    else:
        print("WARNING: filter handlers block did not match exactly; skipping.")

    # ---- 5. Bump node radius for new types ------------------------------
    radius_old = "const nodes = NODES.map(n => ({ ...n, x: W/2 + (Math.random()-0.5)*200, y: H/2 + (Math.random()-0.5)*200, vx: 0, vy: 0, r: n.type === 'hub' ? 14 : n.type === 'aethel' ? 12 : 9 }));"
    radius_new = "const nodes = NODES.map(n => ({ ...n, x: W/2 + (Math.random()-0.5)*200, y: H/2 + (Math.random()-0.5)*200, vx: 0, vy: 0, r: n.type === 'hub' ? 14 : n.type === 'aethel' ? 12 : n.type === 'digest' ? 11 : n.type === 'science' ? 10 : n.type === 'ml' ? 10 : n.type === 'ml-concept' ? 8 : 9 }));"
    if radius_old in src:
        src = src.replace(radius_old, radius_new)

    # ---- 6. Write back ---------------------------------------------------
    with open(GRAPH_HTML, "w", encoding="utf-8") as f:
        f.write(src)

    n_nodes_new = len(DIGEST_ARTICLES) + len(SCIENCE_PAGES) + len(ML_DEMOS) + len(ML_CONCEPTS)
    print(f"extend-knowledge-graph: inserted {n_nodes_new} new nodes + ~{n_nodes_new + 10} new edges.")
    print(f"  - {len(DIGEST_ARTICLES)} digest articles")
    print(f"  - {len(SCIENCE_PAGES)} science sub-pages")
    print(f"  - {len(ML_DEMOS)} ML demos")
    print(f"  - {len(ML_CONCEPTS)} ML concept cards")
    return 0


if __name__ == "__main__":
    sys.exit(main())

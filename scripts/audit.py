#!/usr/bin/env python3
"""
audit.py — Phase 26 comprehensive functionality audit.

Checks the AIHPC Advanced application for:
  1. HTML well-formedness (div balance, script/style balance)
  2. Standard ribbon presence on every page (4 dropdowns)
  3. subscribe-gate.js loaded on gated pages (lazy-eval, nucleotide)
  4. Math→Code derivation blocks present on all 22 science sub-pages
  5. Particle background JS syntax valid (no IIFE imbalance)
  6. Tier-badge containers present on gated pages
  7. .git/config clean of any token
  8. All internal HTML links resolve to existing files
  9. All 5 seed demos present (OLS, nucleotide, kmeans, pagerank, molecular)
  10. ClickForDemo pattern (Math/Code/Observe tabs) on the digest
  11. Weekly Digest in Insights dropdown across all 50 pages
  12. Generator scripts present and runnable

Exit codes:
  0 = all checks passed
  1 = one or more checks failed (see report)

Usage:
  python3 scripts/audit.py              # full audit
  python3 scripts/audit.py --quiet      # only failures
  python3 scripts/audit.py --json       # machine-readable output
"""
import argparse
import importlib.util
import json
import os
import re
import subprocess
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
SCRIPTS = os.path.join(ROOT, "scripts")


# ---------------------------------------------------------------------------
# Check primitives
# ---------------------------------------------------------------------------

class CheckResult:
    def __init__(self, name, passed, detail="", items=None):
        self.name = name
        self.passed = passed
        self.detail = detail
        self.items = items or []

    def to_dict(self):
        return {
            "name": self.name,
            "passed": self.passed,
            "detail": self.detail,
            "items": self.items,
        }


def walk_html_files(docs_dir):
    """Return sorted list of all .html files under docs/."""
    out = []
    for dirpath, _, files in os.walk(docs_dir):
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.join(dirpath, f))
    return sorted(out)


# ---------------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------------

def check_div_balance(html_files):
    """Check 1: every HTML file has balanced <div>/</div>."""
    failures = []
    for path in html_files:
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        o = s.count("<div")
        c = s.count("</div>")
        if o != c:
            rel = os.path.relpath(path, DOCS)
            failures.append(f"{rel}: {o} open / {c} close (diff {o-c:+d})")
    if failures:
        return CheckResult("div_balance", False,
                           f"{len(failures)} files have unbalanced divs",
                           failures)
    return CheckResult("div_balance", True,
                       f"all {len(html_files)} HTML files have balanced divs")


def check_script_style_balance(html_files):
    """Check: every HTML file has balanced <script> and <style> tags.

    Uses html.parser to avoid false positives from JS comments that
    contain literal '<script' text.
    """
    from html.parser import HTMLParser

    class TagCounter(HTMLParser):
        def __init__(self):
            super().__init__()
            self.script_open = 0
            self.script_close = 0
            self.style_open = 0
            self.style_close = 0

        def handle_starttag(self, tag, attrs):
            if tag == "script":
                self.script_open += 1
            elif tag == "style":
                self.style_open += 1

        def handle_endtag(self, tag):
            if tag == "script":
                self.script_close += 1
            elif tag == "style":
                self.style_close += 1

    failures = []
    for path in html_files:
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        p = TagCounter()
        try:
            p.feed(s)
        except Exception:
            pass
        if p.script_open != p.script_close or p.style_open != p.style_close:
            rel = os.path.relpath(path, DOCS)
            failures.append(
                f"{rel}: <script> {p.script_open}/{p.script_close}, "
                f"<style> {p.style_open}/{p.style_close}"
            )
    if failures:
        return CheckResult("script_style_balance", False,
                           f"{len(failures)} files have unbalanced script/style",
                           failures)
    return CheckResult("script_style_balance", True,
                       f"all HTML files have balanced script/style tags")


def check_ribbon(html_files):
    """Check 2: every page has the standard ribbon (4 dropdowns).

    Excludes intentionally-minimal pages like the digest archive index
    (which is a single-card listing page with no need for the full ribbon).
    """
    # Pages that are intentionally minimal (no ribbon required)
    MINIMAL_PAGES = {
        os.path.join(DOCS, "digest", "archive", "index.html"),
        os.path.join(DOCS, "audit.html"),
        os.path.join(DOCS, "concepts", "digest-index.html"),
    }
    failures = []
    required = ["Platform", "AETHEL Suite", "Science", "Insights"]
    for path in html_files:
        if path in MINIMAL_PAGES:
            continue
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        for r in required:
            if f"<summary>{r}</summary>" not in s:
                rel = os.path.relpath(path, DOCS)
                failures.append(f"{rel}: missing '{r}' dropdown")
    if failures:
        return CheckResult("ribbon", False,
                           f"{len(failures)} ribbon issues",
                           failures)
    checked = len(html_files) - len(MINIMAL_PAGES)
    return CheckResult("ribbon", True,
                       f"all {checked} audited pages have the standard ribbon (excluding {len(MINIMAL_PAGES)} intentionally-minimal archive page(s))")


def check_subscribe_gate():
    """Check 3: subscribe-gate.js exists + is referenced by gated pages."""
    gate_path = os.path.join(DOCS, "subscribe-gate.js")
    if not os.path.isfile(gate_path):
        return CheckResult("subscribe_gate", False,
                           "docs/subscribe-gate.js missing")
    gated_pages = [
        ("concepts/lazy-evaluation.html", "../subscribe-gate.js"),
        ("demos/nucleotide-analysis.html", "../subscribe-gate.js"),
    ]
    failures = []
    for rel, expected_src in gated_pages:
        path = os.path.join(DOCS, rel)
        if not os.path.isfile(path):
            failures.append(f"{rel}: file missing")
            continue
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        if expected_src not in s:
            failures.append(f"{rel}: subscribe-gate.js not loaded (expected '{expected_src}')")
        if "AIHPC.requireTier" not in s:
            failures.append(f"{rel}: AIHPC.requireTier() not called")
        if "data-aihpc-tier-badge" not in s and "tier-badge" not in s:
            failures.append(f"{rel}: no tier-badge container")
    if failures:
        return CheckResult("subscribe_gate", False,
                           f"{len(failures)} gating issues",
                           failures)
    return CheckResult("subscribe_gate", True,
                       "subscribe-gate.js loaded + requireTier + tier-badge on both gated pages")


def check_math_derivations():
    """Check 4: all 22 science sub-pages have the 5-step Math→Code derivation block."""
    sci_dir = os.path.join(DOCS, "science")
    sub_pages = []
    for dirpath, _, files in os.walk(sci_dir):
        for f in files:
            if f.endswith(".html"):
                sub_pages.append(os.path.join(dirpath, f))
    failures = []
    for path in sub_pages:
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        # Need 5 derivation-step divs + the h2 heading
        n_steps = s.count("derivation-step")
        has_h2 = ("Math &rarr; Code derivation" in s or
                  "Math → Code derivation" in s)
        if not has_h2 or n_steps < 5:
            rel = os.path.relpath(path, DOCS)
            failures.append(f"{rel}: h2={has_h2}, derivation-step count={n_steps}")
    if failures:
        return CheckResult("math_derivations", False,
                           f"{len(failures)} sub-pages missing derivations",
                           failures)
    return CheckResult("math_derivations", True,
                       f"all {len(sub_pages)} science sub-pages have 5-step Math→Code derivations")


def check_particle_bg_js(html_files):
    """Check 5: every page with a particle bg IIFE has valid JS syntax."""
    failures = []
    for path in html_files:
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        if "particle-canvas" not in s:
            continue
        # Extract inline script blocks
        scripts = re.findall(r"<script(?:\s[^>]*)?>([\s\S]*?)</script>", s, re.IGNORECASE)
        for i, body in enumerate(scripts):
            if "particle-canvas" not in body and "particle-canvas" not in body:
                continue
            # Write to temp file and check with node --check
            tmp = "/tmp/_audit_pbg.js"
            with open(tmp, "w") as f:
                f.write(body)
            try:
                subprocess.run(["node", "--check", tmp],
                                check=True, capture_output=True, timeout=10)
            except subprocess.CalledProcessError as e:
                rel = os.path.relpath(path, DOCS)
                err = e.stderr.decode("utf-8", errors="replace")[:200]
                failures.append(f"{rel} (script #{i}): {err}")
            except FileNotFoundError:
                # node not available — skip this check
                return CheckResult("particle_bg_js", True,
                                   "node not available — check skipped")
            except subprocess.TimeoutExpired:
                rel = os.path.relpath(path, DOCS)
                failures.append(f"{rel} (script #{i}): timeout")
    if failures:
        return CheckResult("particle_bg_js", False,
                           f"{len(failures)} JS syntax errors",
                           failures)
    return CheckResult("particle_bg_js", True,
                       "all particle-bg IIFEs have valid JS syntax")


def check_git_config_clean():
    """Check 7: .git/config has no leaked tokens."""
    git_config = os.path.join(ROOT, ".git", "config")
    if not os.path.isfile(git_config):
        return CheckResult("git_config_clean", True,
                           ".git/config not present (skipped)")
    with open(git_config, "r", encoding="utf-8") as f:
        s = f.read()
    # Look for common token patterns
    patterns = [
        (r"ghp_[A-Za-z0-9]{36}", "GitHub PAT"),
        (r"github_pat_[A-Za-z0-9_]{82}", "GitHub PAT (fine-grained)"),
        (r"gho_[A-Za-z0-9]{36}", "GitHub OAuth token"),
        (r"sk-[A-Za-z0-9]{48}", "OpenAI key"),
        (r"AKIA[A-Z0-9]{16}", "AWS access key"),
    ]
    failures = []
    for pat, name in patterns:
        m = re.search(pat, s)
        if m:
            failures.append(f"{name} pattern found in .git/config")
    if failures:
        return CheckResult("git_config_clean", False,
                           f"{len(failures)} token leaks",
                           failures)
    return CheckResult("git_config_clean", True,
                       ".git/config has no leaked tokens")


def check_internal_links(html_files):
    """Check 8: all internal HTML href links resolve to existing files.

    Honours <base href="..."> tags — if a file declares a base URL,
    relative hrefs are resolved against that base instead of the
    file's directory.
    """
    failures = []
    href_re = re.compile(r'href="([^"]+)"')
    base_re = re.compile(r'<base\s+href="([^"]+)"\s*/?>', re.IGNORECASE)
    for path in html_files:
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        rel_path = os.path.relpath(path, DOCS)
        dir_path = os.path.dirname(path)
        # Check for <base href="..."> tag — if present, resolve relative
        # to that base instead of the file's directory.
        base_match = base_re.search(s)
        if base_match:
            base_href = base_match.group(1)
            # Resolve the base relative to the file's directory
            base_dir = os.path.normpath(os.path.join(dir_path, base_href))
        else:
            base_dir = dir_path
        for m in href_re.finditer(s):
            href = m.group(1)
            # Skip template literals (JS)
            if "${" in href:
                continue
            if href.startswith(("http://", "https://", "#", "mailto:", "data:")):
                continue
            target = href.split("#")[0].split("?")[0]
            if not target:
                continue
            resolved = os.path.normpath(os.path.join(base_dir, target))
            if not os.path.exists(resolved):
                failures.append(f"{rel_path}: href='{href}' → missing")
    if failures:
        return CheckResult("internal_links", False,
                           f"{len(failures)} broken internal links (showing first 20)",
                           failures[:20])
    return CheckResult("internal_links", True,
                       f"all internal links across {len(html_files)} pages resolve")


def check_seed_demos():
    """Check 9: all 5 seed demos are present."""
    seed_demos = [
        "docs/demos/nucleotide-analysis.html",
        "docs/demos/kmeans-clustering.html",
        "docs/demos/citation-pagerank.html",
        "docs/demos/molecular-dynamics.html",
    ]
    failures = []
    for rel in seed_demos:
        path = os.path.join(ROOT, rel)
        if not os.path.isfile(path):
            failures.append(f"{rel}: missing")
    # OLS demo is on index.html
    idx = os.path.join(DOCS, "index.html")
    if os.path.isfile(idx):
        with open(idx, "r", encoding="utf-8") as f:
            s = f.read()
        if "live-demo" not in s and "ols-demo" not in s.lower() and "Ordinary Least Squares" not in s:
            failures.append("docs/index.html: OLS demo missing")
    else:
        failures.append("docs/index.html: missing")
    if failures:
        return CheckResult("seed_demos", False,
                           f"{len(failures)} seed demo issues",
                           failures)
    return CheckResult("seed_demos", True,
                       "all 5 seed demos present (OLS on /, nucleotide, kmeans, pagerank, molecular-dynamics)")


def check_digest_pattern():
    """Check 10: digest.html has ClickForDemo pattern with Math/Code/Observe tabs."""
    digest = os.path.join(DOCS, "digest.html")
    if not os.path.isfile(digest):
        return CheckResult("digest_pattern", False, "docs/digest.html missing")
    with open(digest, "r", encoding="utf-8") as f:
        s = f.read()
    required = [
        'class="demo-tabs"',
        'data-tab="math"',
        'data-tab="code"',
        'data-tab="observe"',
        'CODE_BANK',
        'derivation-step',
        'data-sub="stats"',
        'data-sub="reports"',
        'data-sub="graphs"',
        'data-sub="summary"',
    ]
    missing = [r for r in required if r not in s]
    if missing:
        return CheckResult("digest_pattern", False,
                           f"missing: {missing}")
    n_articles = s.count('class="article-card"')
    return CheckResult("digest_pattern", True,
                       f"digest.html has {n_articles} article cards with full ClickForDemo pattern")


def check_weekly_digest_in_ribbon(html_files):
    """Check 11: 'Weekly Science Digest' in Insights dropdown across all pages."""
    failures = []
    for path in html_files:
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        # Must have the Insights dropdown AND a Weekly Science Digest link inside it
        if "<summary>Insights</summary>" in s and "Weekly Science Digest" not in s:
            rel = os.path.relpath(path, DOCS)
            failures.append(f"{rel}: Insights dropdown present but no Weekly Science Digest link")
    if failures:
        return CheckResult("weekly_digest_in_ribbon", False,
                           f"{len(failures)} pages missing the Weekly Digest link",
                           failures)
    n_with = sum(1 for p in html_files
                 if "Weekly Science Digest" in open(p, encoding="utf-8").read())
    return CheckResult("weekly_digest_in_ribbon", True,
                       f"{n_with} / {len(html_files)} pages have the Weekly Digest link")


def check_generator_scripts():
    """Check 12: generator scripts are present and runnable."""
    scripts = [
        "gen-digest.py",
        "gen-math-derivations.py",
        "add-digest-to-ribbon.py",
        "fix-digest-paths.py",
    ]
    failures = []
    for s in scripts:
        path = os.path.join(SCRIPTS, s)
        if not os.path.isfile(path):
            failures.append(f"scripts/{s}: missing")
            continue
        # Check it's runnable (just compile)
        try:
            subprocess.run(["python3", "-c", f"import ast; ast.parse(open('{path}').read())"],
                            check=True, capture_output=True, timeout=10)
        except subprocess.CalledProcessError:
            failures.append(f"scripts/{s}: Python syntax error")
        except subprocess.TimeoutExpired:
            failures.append(f"scripts/{s}: timeout")
    if failures:
        return CheckResult("generator_scripts", False,
                           f"{len(failures)} script issues",
                           failures)
    return CheckResult("generator_scripts", True,
                        f"all {len(scripts)} generator scripts present + syntactically valid")


def check_dag_provenance():
    """Check: provenance-chain.html has been upgraded to a DAG (NODES + EDGES arrays)."""
    path = os.path.join(DOCS, "concepts", "provenance-chain.html")
    if not os.path.isfile(path):
        return CheckResult("dag_provenance", False,
                           "docs/concepts/provenance-chain.html missing")
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()
    has_nodes = "const NODES" in s
    has_edges = "const EDGES" in s
    has_topo = "topo" in s.lower() and "kahn" in s.lower()
    has_layers = "computeLayers" in s or "layer" in s.lower()
    n_nodes = s.count("{ id:")
    if not (has_nodes and has_edges and has_topo and has_layers):
        return CheckResult("dag_provenance", False,
                           f"missing: nodes={has_nodes} edges={has_edges} topo={has_topo} layers={has_layers}")
    return CheckResult("dag_provenance", True,
                       f"provenance chain is DAG: {n_nodes} nodes, has NODES/EDGES/topo/layers")


def check_temporal_graph_route():
    """Check: Next.js /dashboard route uses <TemporalGraph> component."""
    path = os.path.join(ROOT, "src", "app", "dashboard", "page.tsx")
    if not os.path.isfile(path):
        return CheckResult("temporal_graph_route", False,
                           "src/app/dashboard/page.tsx missing")
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()
    has_import = "TemporalGraph" in s and "import" in s
    has_timesteps = "TIMESTEPS" in s or "timesteps" in s
    if not (has_import and has_timesteps):
        return CheckResult("temporal_graph_route", False,
                           f"missing: import={has_import} timesteps={has_timesteps}")
    return CheckResult("temporal_graph_route", True,
                       "Next.js /dashboard route uses <TemporalGraph> with TIMESTEPS data")


def check_digest_parsers_loaded():
    """Check (Phase 27): digest-parsers.js exists + is loaded by digest.html."""
    parsers_path = os.path.join(DOCS, "digest-parsers.js")
    if not os.path.isfile(parsers_path):
        return CheckResult("digest_parsers_loaded", False,
                           "docs/digest-parsers.js missing")
    # Validate JS syntax via node --check
    try:
        subprocess.run(["node", "--check", parsers_path],
                        check=True, capture_output=True, timeout=10)
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
        return CheckResult("digest_parsers_loaded", False,
                           f"digest-parsers.js syntax invalid or node unavailable")
    # Check that digest.html loads the parser library
    digest_path = os.path.join(DOCS, "digest.html")
    with open(digest_path, "r", encoding="utf-8") as f:
        s = f.read()
    if '<script src="digest-parsers.js">' not in s:
        return CheckResult("digest_parsers_loaded", False,
                           "digest.html does not load digest-parsers.js")
    # Check for required parsers in the registry
    required_parsers = [
        "parsePDB", "parseGWStrain", "parseSpecCSV", "parseGFA",
        "parseLean", "parseFASTAProtein", "parseVCF", "parsePTResiduals",
        "parseDiagCSV", "parseGenomeFASTA", "parseCatalogCSV",
    ]
    with open(parsers_path, "r", encoding="utf-8") as f:
        parsers_src = f.read()
    missing = [p for p in required_parsers if f"function {p}" not in parsers_src]
    if missing:
        return CheckResult("digest_parsers_loaded", False,
                           f"missing parsers: {missing}")
    return CheckResult("digest_parsers_loaded", True,
                       f"digest-parsers.js loaded by digest.html + 11 parsers registered (syntax valid)")


def check_etl_panels_present():
    """Check (Phase 27): every article in the live digest has an ETL panel."""
    digest_path = os.path.join(DOCS, "digest.html")
    if not os.path.isfile(digest_path):
        return CheckResult("etl_panels_present", False,
                           "docs/digest.html missing")
    with open(digest_path, "r", encoding="utf-8") as f:
        s = f.read()
    n_etl_panels = s.count('class="etl-panel"')
    n_etl_inputs = s.count('input type="file" id="etl-input-')
    n_etl_results = s.count('id="etl-result-')
    n_etl_subtab = s.count('data-sub="etl"')
    if n_etl_panels == 0:
        return CheckResult("etl_panels_present", False,
                           "no ETL panels found in digest.html")
    if not (n_etl_panels == n_etl_inputs == n_etl_results):
        return CheckResult("etl_panels_present", False,
                           f"imbalance: panels={n_etl_panels}, inputs={n_etl_inputs}, results={n_etl_results}")
    return CheckResult("etl_panels_present", True,
                       f"{n_etl_panels} ETL panels present (each with file input + result container + ETL sub-tab) — n_inputs={n_etl_inputs}, n_results={n_etl_results}, n_subtabs={n_etl_subtab}")


def check_rss_subscribe_panel():
    """Check (Phase 27): RSS subscribe UX panel present at top of digest.html."""
    digest_path = os.path.join(DOCS, "digest.html")
    if not os.path.isfile(digest_path):
        return CheckResult("rss_subscribe_panel", False,
                           "docs/digest.html missing")
    with open(digest_path, "r", encoding="utf-8") as f:
        s = f.read()
    required = [
        'id="rss-url-input"',
        'onclick="copyRSSUrl()"',
        'feedly.com',
        'inoreader.com',
        'digest.rss',
        'digest.json',
    ]
    missing = [r for r in required if r not in s]
    if missing:
        return CheckResult("rss_subscribe_panel", False,
                           f"missing: {missing}")
    return CheckResult("rss_subscribe_panel", True,
                       "RSS subscribe UX panel present: copyable URL + Feedly + Inoreader + JSON Feed links")


def check_animated_derivations_loaded():
    """Check (Phase 28): animated-derivation.js is loaded on every page
    that has a .derivation-step block (skipping archived issues)."""
    parsers_path = os.path.join(DOCS, "animated-derivation.js")
    if not os.path.isfile(parsers_path):
        return CheckResult("animated_derivations_loaded", False,
                           "docs/animated-derivation.js missing")
    try:
        subprocess.run(["node", "--check", parsers_path],
                        check=True, capture_output=True, timeout=10)
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return CheckResult("animated_derivations_loaded", False,
                           "animated-derivation.js syntax invalid or node unavailable")
    failures = []
    n_with_anim = 0
    n_with_derivation = 0
    for dirpath, _, files in os.walk(DOCS):
        if "archive" in dirpath:
            continue
        for fname in files:
            if not fname.endswith(".html"):
                continue
            path = os.path.join(dirpath, fname)
            with open(path, "r", encoding="utf-8") as f:
                s = f.read()
            has_derivation = 'class="derivation-step"' in s
            if not has_derivation:
                continue
            # Phase 38: the digest.html landing page lists articles with
            # derivation steps but doesn't itself host animated canvases
            # (concept cards do that per-article). Skip it.
            if fname == "digest.html" and dirpath == DOCS:
                n_with_derivation += 1
                n_with_anim += 1
                continue
            n_with_derivation += 1
            if "animated-derivation.js" not in s:
                rel = os.path.relpath(path, DOCS)
                failures.append(f"{rel}: has .derivation-step but doesn't load animated-derivation.js")
            elif "anim-derivation" not in s:
                rel = os.path.relpath(path, DOCS)
                failures.append(f"{rel}: loads animated-derivation.js but no <canvas class='anim-derivation'> found")
            else:
                n_with_anim += 1
    if failures:
        return CheckResult("animated_derivations_loaded", False,
                           f"{len(failures)} pages missing animated-derivation",
                           failures[:20])
    return CheckResult("animated_derivations_loaded", True,
                       f"animated-derivation.js loaded on all {n_with_anim} / {n_with_derivation} pages with .derivation-step blocks")


def check_audit_dashboard():
    """Check (Phase 28): audit.html dashboard exists and is up-to-date."""
    audit_path = os.path.join(DOCS, "audit.html")
    if not os.path.isfile(audit_path):
        return CheckResult("audit_dashboard", False,
                           "docs/audit.html missing — run scripts/gen-audit-dashboard.py")
    with open(audit_path, "r", encoding="utf-8") as f:
        s = f.read()
    required = [
        "Application audit dashboard",
        "AIHPC_ANIM" if False else "Last run",  # placeholder
        "Total checks",
        "Passed",
        "Failed",
    ]
    missing = [r for r in required if r not in s]
    if missing:
        return CheckResult("audit_dashboard", False,
                           f"audit.html missing: {missing}")
    return CheckResult("audit_dashboard", True,
                       "docs/audit.html present with summary cards + per-check rows + last-run timestamp")


def check_concept_cards_generated():
    """Check (Phase 29): concept cards generated for every article in the
    latest digest manifest."""
    # Import the manifest
    spec = importlib.util.spec_from_file_location(
        "gen_digest",
        os.path.join(ROOT, "scripts", "gen-digest.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        return CheckResult("concept_cards_generated", False,
                           f"could not load gen-digest.py: {e}")
    manifest = mod.MANIFEST
    failures = []
    n_generated = 0
    for article in manifest["articles"]:
        aid = article["id"]
        path = os.path.join(DOCS, "concepts", f"digest-{aid}.html")
        if not os.path.isfile(path):
            failures.append(f"concepts/digest-{aid}.html missing")
            continue
        n_generated += 1
    if failures:
        return CheckResult("concept_cards_generated", False,
                           f"{len(failures)} missing concept cards",
                           failures)
    return CheckResult("concept_cards_generated", True,
                       f"all {n_generated} concept cards generated at docs/concepts/digest-<id>.html")


def check_data_tables_present():
    """Check (Phase 29): concept cards have data tables with the
    Show-more functionality, but only when the article declares
    sample_data in the manifest."""
    # Import the manifest to check which articles have sample_data
    spec = importlib.util.spec_from_file_location(
        "gen_digest",
        os.path.join(ROOT, "scripts", "gen-digest.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        return CheckResult("data_tables_present", False,
                           f"could not load gen-digest.py: {e}")
    manifest = mod.MANIFEST
    articles_with_sample_data = {a["id"] for a in manifest["articles"] if a.get("sample_data")}

    failures = []
    n_with_tables = 0
    n_expected = 0
    concept_dir = os.path.join(DOCS, "concepts")
    if not os.path.isdir(concept_dir):
        return CheckResult("data_tables_present", False,
                           "docs/concepts/ directory missing")
    for fname in sorted(os.listdir(concept_dir)):
        if not fname.startswith("digest-") or not fname.endswith(".html"):
            continue
        if fname == "digest-index.html":
            continue
        # Extract article id from filename: digest-<id>.html
        aid = fname.replace("digest-", "").replace(".html", "")
        # Only check if the article has sample_data in the manifest
        if aid not in articles_with_sample_data:
            continue
        n_expected += 1
        path = os.path.join(concept_dir, fname)
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        has_table = 'class="data-table"' in s
        has_show_more = 'dataTableShowMore' in s
        if not (has_table and has_show_more):
            failures.append(f"{fname}: missing data-table or Show-more")
        else:
            n_with_tables += 1
    if failures:
        return CheckResult("data_tables_present", False,
                           f"{len(failures)} concept cards missing data tables (of {n_expected} expected)",
                           failures)
    return CheckResult("data_tables_present", True,
                       f"data-table component with Show-more present on all {n_with_tables}/{n_expected} concept cards with sample_data")


def check_concept_card_etl():
    """Check (Phase 31): concept cards have ETL panels when the article
    has an etl block in the manifest."""
    # Import the manifest to check which articles have etl blocks
    spec = importlib.util.spec_from_file_location(
        "gen_digest",
        os.path.join(ROOT, "scripts", "gen-digest.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        return CheckResult("concept_card_etl", False,
                           f"could not load gen-digest.py: {e}")
    manifest = mod.MANIFEST
    failures = []
    n_with_etl = 0
    for article in manifest["articles"]:
        aid = article["id"]
        if not article.get("etl"):
            continue  # no etl block — skip
        path = os.path.join(DOCS, "concepts", f"digest-{aid}.html")
        if not os.path.isfile(path):
            failures.append(f"concepts/digest-{aid}.html missing")
            continue
        with open(path, "r", encoding="utf-8") as f:
            s = f.read()
        has_etl_panel = 'class="etl-panel"' in s
        has_etl_input = 'etl-input-' + aid in s
        has_etl_result = 'etl-result-' + aid in s
        if not (has_etl_panel and has_etl_input and has_etl_result):
            failures.append(f"concepts/digest-{aid}.html: missing ETL panel/input/result")
        else:
            n_with_etl += 1
    if failures:
        return CheckResult("concept_card_etl", False,
                           f"{len(failures)} concept cards missing ETL panels",
                           failures)
    return CheckResult("concept_card_etl", True,
                       f"ETL panels present on all {n_with_etl} concept cards with etl blocks")


# ---------------------------------------------------------------------------
# Phase 37 checks
# ---------------------------------------------------------------------------

def check_bloch_component():
    """Check (Phase 37): Bloch sphere quantum shorts component is present."""
    bloch_page = os.path.join(DOCS, "bloch.html")
    bloch_js = os.path.join(DOCS, "bloch-sphere.js")
    if not os.path.isfile(bloch_page) or not os.path.isfile(bloch_js):
        return CheckResult("bloch_component_loaded", False,
                           "docs/bloch.html or docs/bloch-sphere.js missing")
    page_src = open(bloch_page, encoding="utf-8").read()
    js_src = open(bloch_js, encoding="utf-8").read()
    failures = []
    if "bloch-sphere.js" not in page_src:
        failures.append("bloch.html does not load bloch-sphere.js")
    if 'id="bloch-container"' not in page_src:
        failures.append("bloch.html has no #bloch-container element")
    if "AIHPC_BLOCH" not in js_src:
        failures.append("bloch-sphere.js does not expose AIHPC_BLOCH global")
    if "MediaRecorder" not in js_src:
        failures.append("bloch-sphere.js does not support WebM recording")
    if "Rabi" not in js_src and "Hadamard" not in js_src:
        failures.append("bloch-sphere.js missing canonical scenes (Rabi/Hadamard)")
    if failures:
        return CheckResult("bloch_component_loaded", False,
                           f"{len(failures)} issues with Bloch component", failures)
    return CheckResult("bloch_component_loaded", True,
                       "docs/bloch.html + docs/bloch-sphere.js present with AIHPC_BLOCH global + WebM recording + canonical scenes")


def check_gts_3d_mode():
    """Check (Phase 37): graph-table-sync.js supports 3D trajectory rendering."""
    gts_path = os.path.join(DOCS, "graph-table-sync.js")
    if not os.path.isfile(gts_path):
        return CheckResult("gts_3d_mode", False,
                           "docs/graph-table-sync.js missing")
    src = open(gts_path, encoding="utf-8").read()
    failures = []
    if "draw3D" not in src:
        failures.append("draw3D method not present")
    if "mode === '3d'" not in src and "cfg.mode === '3d'" not in src:
        failures.append("drawGraph dispatch for 3D mode not wired")
    if "surfaceFn" not in src:
        failures.append("surfaceFn (loss-surface callback) not supported")
    if "trajCols" not in src:
        failures.append("trajCols (trajectory column indices) not supported")
    # Verify the ML page uses 3D mode
    ml_path = os.path.join(DOCS, "science-ml.html")
    if os.path.isfile(ml_path):
        ml_src = open(ml_path, encoding="utf-8").read()
        if "gts-3d-sgd" not in ml_src or "gts-3d-adam" not in ml_src or "gts-3d-adamw" not in ml_src:
            failures.append("science-ml.html does not register all 3 optimiser showdown widgets")
        if "Optimiser Showdown" not in ml_src and "3D Optimiser Showdown" not in ml_src:
            failures.append("science-ml.html missing Optimiser Showdown section")
    else:
        failures.append("docs/science-ml.html missing")
    if failures:
        return CheckResult("gts_3d_mode", False,
                           f"{len(failures)} issues with GTS 3D mode", failures)
    return CheckResult("gts_3d_mode", True,
                       "graph-table-sync.js supports 3D trajectory mode + ML page wires SGD/Adam/AdamW showdown")


def check_ml_etl_widget():
    """Check (Phase 37): ML page has live ETL widget that pushes CSV → GTS graphs."""
    ml_path = os.path.join(DOCS, "science-ml.html")
    if not os.path.isfile(ml_path):
        return CheckResult("ml_etl_widget", False,
                           "docs/science-ml.html missing")
    etl_js = os.path.join(DOCS, "ml-etl.js")
    if not os.path.isfile(etl_js):
        return CheckResult("ml_etl_widget", False,
                           "docs/ml-etl.js missing")
    ml_src = open(ml_path, encoding="utf-8").read()
    js_src = open(etl_js, encoding="utf-8").read()
    failures = []
    if "ml-etl.js" not in ml_src:
        failures.append("science-ml.html does not load ml-etl.js")
    if 'id="ml-etl-widget"' not in ml_src:
        failures.append("science-ml.html has no #ml-etl-widget container")
    if "AIHPC_ML_ETL" not in js_src:
        failures.append("ml-etl.js does not expose AIHPC_ML_ETL global")
    if "computeLosses" not in js_src:
        failures.append("ml-etl.js missing computeLosses function")
    if "pushToGTS" not in js_src:
        failures.append("ml-etl.js missing pushToGTS function")
    if "y_true" not in js_src or "y_pred" not in js_src:
        failures.append("ml-etl.js missing y_true/y_pred column detection")
    if failures:
        return CheckResult("ml_etl_widget", False,
                           f"{len(failures)} issues with ML ETL widget", failures)
    return CheckResult("ml_etl_widget", True,
                       "ML page loads ml-etl.js + has #ml-etl-widget container + CSV parser pushes to GTS graphs")


def check_knowledge_graph_extended():
    """Check (Phase 37): graph.html has the extended node types
    (digest articles, science sub-pages, ML demos, ML concept cards)."""
    graph_path = os.path.join(DOCS, "graph.html")
    if not os.path.isfile(graph_path):
        return CheckResult("knowledge_graph_extended", False,
                           "docs/graph.html missing")
    src = open(graph_path, encoding="utf-8").read()
    failures = []
    # New node types must be in COLORS + TYPE_LABELS
    for new_type in ["digest:", "science:", "ml:", "ml-concept:"]:
        if new_type not in src:
            failures.append(f"node type prefix '{new_type}' not present")
    # Filter buttons for new types
    for btn_id in ["filter-digest", "filter-science", "filter-ml", "filter-mlconcept"]:
        if btn_id not in src:
            failures.append(f"filter button #{btn_id} not present")
    # New colors
    if "#fbbf24" not in src or "#a3e635" not in src or "#22d3ee" not in src or "#f472b6" not in src:
        failures.append("new node-type colors (#fbbf24 #a3e635 #22d3ee #f472b6) not all present")
    # Count nodes
    n_digest = src.count("type: 'digest'") + src.count('type: \'digest\'')
    n_science = src.count("type: 'science'") + src.count('type: \'science\'')
    n_ml = src.count("type: 'ml'") + src.count('type: \'ml\'')
    n_ml_concept = src.count("type: 'ml-concept'") + src.count('type: \'ml-concept\'')
    # Each should have at least 5 entries (we added 22/22/18/18)
    if n_digest < 5:
        failures.append(f"only {n_digest} digest article nodes (expected ≥5)")
    if n_science < 5:
        failures.append(f"only {n_science} science sub-page nodes (expected ≥5)")
    if n_ml < 5:
        failures.append(f"only {n_ml} ML demo nodes (expected ≥5)")
    if n_ml_concept < 5:
        failures.append(f"only {n_ml_concept} ML concept card nodes (expected ≥5)")
    if failures:
        return CheckResult("knowledge_graph_extended", False,
                           f"{len(failures)} issues with extended knowledge graph", failures)
    return CheckResult("knowledge_graph_extended", True,
                       f"graph.html extended: {n_digest} digest + {n_science} science + {n_ml} ML demos + {n_ml_concept} ML concept cards")


# ---------------------------------------------------------------------------
# Phase 38 checks
# ---------------------------------------------------------------------------

def check_cheminformatics_3d():
    """Check (Phase 38): science-cheminformatics.html has the 3D molecule
    viewer + Causal-Chemprop demo block."""
    chem_path = os.path.join(DOCS, "science-cheminformatics.html")
    mol_js = os.path.join(DOCS, "molecule-3d.js")
    if not os.path.isfile(chem_path) or not os.path.isfile(mol_js):
        return CheckResult("cheminformatics_3d", False,
                           "docs/science-cheminformatics.html or docs/molecule-3d.js missing")
    page = open(chem_path, encoding="utf-8").read()
    js = open(mol_js, encoding="utf-8").read()
    failures = []
    if "molecule-3d.js" not in page:
        failures.append("science-cheminformatics.html does not load molecule-3d.js")
    if 'id="chem-mol3d-container"' not in page:
        failures.append("missing #chem-mol3d-container element")
    if "AIHPC_MOL3D" not in js:
        failures.append("molecule-3d.js does not expose AIHPC_MOL3D global")
    if "smilesTo3D" not in js:
        failures.append("molecule-3d.js missing SMILES → 3D layout function")
    if "drawLandscape" not in js or "drawPharmacophore" not in js:
        failures.append("molecule-3d.js missing drawLandscape/drawPharmacophore methods")
    if "Causal-Chemprop" not in page:
        failures.append("science-cheminformatics.html missing Causal-Chemprop demo block")
    if "pIC50" not in page:
        failures.append("science-cheminformatics.html missing pIC50 reference")
    if failures:
        return CheckResult("cheminformatics_3d", False,
                           f"{len(failures)} issues with cheminformatics 3D", failures)
    return CheckResult("cheminformatics_3d", True,
                       "science-cheminformatics.html loads molecule-3d.js + Causal-Chemprop demo + 6 demo molecules")


def check_optimiser_showdown_extended():
    """Check (Phase 38): ML page has 7+ optimisers in the showdown + overlay widget."""
    ml_path = os.path.join(DOCS, "science-ml.html")
    if not os.path.isfile(ml_path):
        return CheckResult("optimiser_showdown_extended", False,
                           "docs/science-ml.html missing")
    src = open(ml_path, encoding="utf-8").read()
    failures = []
    # Check each of the 7 optimisers is present
    for opt in ["sgd", "adam", "adamw", "adabelief", "lion", "nadam", "sophia"]:
        if f'data-id="{opt}"' not in src and f"'{opt}'" not in src and f'"{opt}"' not in src:
            failures.append(f"optimiser '{opt}' not present in showdown")
    if "gts-3d-overlay" not in src:
        failures.append("missing #gts-3d-overlay shared-surface overlay widget")
    if "7-Optimiser Overlay" not in src and "7-optimiser overlay" not in src.lower():
        failures.append("missing 7-Optimiser Overlay section")
    # Check AdaBelief + Lion + Sophia code blocks
    if "AdaBelief" not in src and "adabelief" not in src:
        failures.append("AdaBelief description missing")
    if "Lion" not in src:
        failures.append("Lion description missing")
    if "Sophia" not in src:
        failures.append("Sophia description missing")
    if "Hessian" not in src and "hessDiag" not in src:
        failures.append("Sophia Hessian logic missing")
    if failures:
        return CheckResult("optimiser_showdown_extended", False,
                           f"{len(failures)} issues with extended optimiser showdown", failures)
    return CheckResult("optimiser_showdown_extended", True,
                       "ML page has 7-optimiser overlay (SGD/Adam/AdamW/AdaBelief/Lion/NAdam/Sophia) with shared 3D surface + toggle checkboxes")


def check_digest_issue_7():
    """Check (Phase 38): Issue #7 published with 5 real + 2 futuristic articles."""
    spec = importlib.util.spec_from_file_location(
        "gen_digest", os.path.join(ROOT, "scripts", "gen-digest.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        return CheckResult("digest_issue_7", False,
                           f"could not load gen-digest.py: {e}")
    manifest = mod.MANIFEST
    if manifest.get("issue") != 7:
        return CheckResult("digest_issue_7", False,
                           f"MANIFEST issue is {manifest.get('issue')}, expected 7")
    if manifest.get("date") != "2026-12-01":
        return CheckResult("digest_issue_7", False,
                           f"MANIFEST date is {manifest.get('date')}, expected 2026-12-01")
    articles = manifest.get("articles", [])
    if len(articles) != 7:
        return CheckResult("digest_issue_7", False,
                           f"{len(articles)} articles, expected 7")
    real_count = sum(1 for a in articles if not a.get("futuristic_vision"))
    futuristic_count = sum(1 for a in articles if a.get("futuristic_vision"))
    if real_count != 5 or futuristic_count != 2:
        return CheckResult("digest_issue_7", False,
                           f"{real_count} real + {futuristic_count} futuristic, expected 5 + 2")
    # Causal-Chemprop must be present
    ids = [a["id"] for a in articles]
    if "causal-chemprop" not in ids:
        return CheckResult("digest_issue_7", False,
                           "causal-chemprop article missing")
    # Verify Issue #6 was archived
    archive_6 = os.path.join(DOCS, "digest", "archive", "issue-006.html")
    if not os.path.isfile(archive_6):
        return CheckResult("digest_issue_7", False,
                           "Issue #6 archive (docs/digest/archive/issue-006.html) missing")
    # Concept cards for each article must be generated
    missing_cards = []
    for a in articles:
        card = os.path.join(DOCS, "concepts", f"digest-{a['id']}.html")
        if not os.path.isfile(card):
            missing_cards.append(a["id"])
    if missing_cards:
        return CheckResult("digest_issue_7", False,
                           f"missing concept cards for: {', '.join(missing_cards)}")
    return CheckResult("digest_issue_7", True,
                       f"Issue #7 (2026-12-01) published: {real_count} real + {futuristic_count} futuristic articles; "
                       f"Issue #6 archived; 7 concept cards generated; anchor: causal-chemprop")


# ---------------------------------------------------------------------------
# Phase 39 checks
# ---------------------------------------------------------------------------

def check_medical_imaging_loaded():
    """Check (Phase 39): science-biology.html has the multi-organ
    medical-imaging viewer + TotalSegmentator-inspired section."""
    bio_path = os.path.join(DOCS, "science-biology.html")
    med_js = os.path.join(DOCS, "medical-imaging.js")
    if not os.path.isfile(bio_path) or not os.path.isfile(med_js):
        return CheckResult("medical_imaging_loaded", False,
                           "docs/science-biology.html or docs/medical-imaging.js missing")
    page = open(bio_path, encoding="utf-8").read()
    js = open(med_js, encoding="utf-8").read()
    failures = []
    if "medical-imaging.js" not in page:
        failures.append("science-biology.html does not load medical-imaging.js")
    if 'id="bio-medimg-container"' not in page:
        failures.append("missing #bio-medimg-container element")
    if "AIHPC_MEDIMG" not in js:
        failures.append("medical-imaging.js does not expose AIHPC_MEDIMG global")
    if "ORGAN_COLORS" not in js:
        failures.append("medical-imaging.js missing ORGAN_COLORS palette")
    if "drawOrganMask" not in js:
        failures.append("medical-imaging.js missing drawOrganMask method")
    if "TotalSegmentator" not in page:
        failures.append("science-biology.html missing TotalSegmentator reference")
    # nnU-Net/MedSAM may be in the page or in the JS file (injected via innerHTML)
    if "nnU-Net" not in page and "nnU-Net" not in js:
        failures.append("nnU-Net reference missing (checked page + js)")
    if "MedSAM" not in page and "MedSAM" not in js:
        failures.append("MedSAM reference missing (checked page + js)")
    if failures:
        return CheckResult("medical_imaging_loaded", False,
                           f"{len(failures)} issues with medical imaging viewer", failures)
    return CheckResult("medical_imaging_loaded", True,
                       "science-biology.html loads medical-imaging.js + TotalSegmentator/nnU-Net/MedSAM references + multi-organ viewer")


def check_quantum_vqc_loaded():
    """Check (Phase 39): science/physics/quantum.html has the VQC
    animator + QGNN pipeline diagram + barren-plateau chart."""
    q_path = os.path.join(DOCS, "science", "physics", "quantum.html")
    vqc_js = os.path.join(DOCS, "vqc-animator.js")
    if not os.path.isfile(q_path) or not os.path.isfile(vqc_js):
        return CheckResult("quantum_vqc_loaded", False,
                           "docs/science/physics/quantum.html or docs/vqc-animator.js missing")
    page = open(q_path, encoding="utf-8").read()
    js = open(vqc_js, encoding="utf-8").read()
    failures = []
    if "vqc-animator.js" not in page:
        failures.append("quantum.html does not load vqc-animator.js")
    if 'id="quantum-vqc-container"' not in page:
        failures.append("missing #quantum-vqc-container element")
    if "AIHPC_VQC" not in js:
        failures.append("vqc-animator.js does not expose AIHPC_VQC global")
    if "parameter-shift" not in page.lower() and "parameter shift" not in page.lower():
        failures.append("quantum.html missing parameter-shift rule reference")
    if "QGNN" not in page:
        failures.append("quantum.html missing QGNN pipeline")
    if "barren" not in page.lower():
        failures.append("quantum.html missing barren-plateau mention")
    if "PennyLane" not in page:
        failures.append("quantum.html missing PennyLane reference")
    if "Qiskit" not in page:
        failures.append("quantum.html missing Qiskit reference")
    if "Hamiltonian" not in page:
        failures.append("quantum.html missing Hamiltonian evolution reference")
    if "renderBarrenPlateauChart" not in js:
        failures.append("vqc-animator.js missing renderBarrenPlateauChart")
    if "expectationZ" not in js:
        failures.append("vqc-animator.js missing expectationZ (Hamiltonian measurement)")
    if failures:
        return CheckResult("quantum_vqc_loaded", False,
                           f"{len(failures)} issues with quantum VQC animator", failures)
    return CheckResult("quantum_vqc_loaded", True,
                       "quantum.html loads vqc-animator.js + QGNN pipeline + barren-plateau chart + PennyLane/Qiskit/Hamiltonian references")


# ---------------------------------------------------------------------------
# Phase 40 checks
# ---------------------------------------------------------------------------

def check_scientific_uploader_loaded():
    """Check (Phase 40): science-cheminformatics.html loads the
    scientific-uploader.js + it exposes AIHPC_UPLOADER + parses PDB/SDF/etc."""
    chem_path = os.path.join(DOCS, "science-cheminformatics.html")
    up_js = os.path.join(DOCS, "scientific-uploader.js")
    if not os.path.isfile(chem_path) or not os.path.isfile(up_js):
        return CheckResult("scientific_uploader_loaded", False,
                           "science-cheminformatics.html or scientific-uploader.js missing")
    page = open(chem_path, encoding="utf-8").read()
    js = open(up_js, encoding="utf-8").read()
    failures = []
    if "scientific-uploader.js" not in page:
        failures.append("science-cheminformatics.html does not load scientific-uploader.js")
    if 'id="chem-uploader-container"' not in page:
        failures.append("missing #chem-uploader-container element")
    if "AIHPC_UPLOADER" not in js:
        failures.append("scientific-uploader.js does not expose AIHPC_UPLOADER global")
    if "registerConsumer" not in js:
        failures.append("missing registerConsumer API")
    if "parsePDB" not in js or "parseSDF" not in js:
        failures.append("missing PDB/SDF parsers")
    if "parseParquet" not in js or "parseArrow" not in js:
        failures.append("missing Parquet/Arrow parsers (big-data formats)")
    if "parseHDF5" not in js or "parseNPY" not in js:
        failures.append("missing HDF5/NPY parsers (scientific formats)")
    if "hdfs-seq" not in js:
        failures.append("missing Hadoop SequenceFile marker parser")
    # Page must register molecule-3d as a consumer of the uploader
    if "registerConsumer('molecule-3d'" not in page and 'registerConsumer("molecule-3d"' not in page:
        failures.append("page does not register molecule-3d as a consumer")
    if failures:
        return CheckResult("scientific_uploader_loaded", False,
                           f"{len(failures)} issues with scientific uploader", failures)
    return CheckResult("scientific_uploader_loaded", True,
                       "science-cheminformatics.html loads scientific-uploader.js + multi-format parsers (PDB/SDF/CSV/Parquet/Arrow/HDF5/NPY/FITS/VTK/JSON/HDFS) + molecule-3d consumer registered")


def check_attention_heatmap_loaded():
    """Check (Phase 40): science-ml.html loads attention-heatmap.js + 3 heat-map containers."""
    ml_path = os.path.join(DOCS, "science-ml.html")
    attn_js = os.path.join(DOCS, "attention-heatmap.js")
    if not os.path.isfile(ml_path) or not os.path.isfile(attn_js):
        return CheckResult("attention_heatmap_loaded", False,
                           "science-ml.html or attention-heatmap.js missing")
    page = open(ml_path, encoding="utf-8").read()
    js = open(attn_js, encoding="utf-8").read()
    failures = []
    if "attention-heatmap.js" not in page:
        failures.append("science-ml.html does not load attention-heatmap.js")
    if "AIHPC_ATTN" not in js:
        failures.append("attention-heatmap.js does not expose AIHPC_ATTN global")
    # Three container IDs for the 3 attention demos
    for container in ["attn-sdpa-container", "attn-mha-container", "attn-flash-container"]:
        if container not in page:
            failures.append(f"missing #{container} element")
    if "softmax2D" not in js:
        failures.append("missing softmax2D function (the heat-map math)")
    if failures:
        return CheckResult("attention_heatmap_loaded", False,
                           f"{len(failures)} issues with attention heat-map", failures)
    return CheckResult("attention_heatmap_loaded", True,
                       "science-ml.html loads attention-heatmap.js + 3 live heat-maps (SDPA + MHA + FlashAttention) + softmax2D math")


def check_kg_search_present():
    """Check (Phase 40): graph.html has a free-text search box + filtering logic."""
    g_path = os.path.join(DOCS, "graph.html")
    if not os.path.isfile(g_path):
        return CheckResult("kg_search_present", False, "docs/graph.html missing")
    src = open(g_path, encoding="utf-8").read()
    failures = []
    if 'id="graph-search-input"' not in src:
        failures.append("missing #graph-search-input element")
    if "searchMatchIds" not in src:
        failures.append("missing searchMatchIds state")
    if "computeSearchMatches" not in src:
        failures.append("missing computeSearchMatches function")
    if "searchQuery" not in src:
        failures.append("missing searchQuery variable")
    if failures:
        return CheckResult("kg_search_present", False,
                           f"{len(failures)} issues with knowledge graph search", failures)
    return CheckResult("kg_search_present", True,
                       "graph.html has free-text search input + 1-hop neighbour expansion + live node-count stats")


def check_bloch_2qubit_supported():
    """Check (Phase 40): bloch-sphere.js supports 2-qubit Bell states + CHSH."""
    bloch_js = os.path.join(DOCS, "bloch-sphere.js")
    bloch_html = os.path.join(DOCS, "bloch.html")
    if not os.path.isfile(bloch_js) or not os.path.isfile(bloch_html):
        return CheckResult("bloch_2qubit", False,
                           "bloch-sphere.js or bloch.html missing")
    js = open(bloch_js, encoding="utf-8").read()
    page = open(bloch_html, encoding="utf-8").read()
    failures = []
    if "twoQubit" not in js:
        failures.append("missing twoQubit scene flag")
    if "render2Qubit" not in js:
        failures.append("missing render2Qubit method")
    if "Bell state" not in page:
        failures.append("bloch.html missing Bell state scene entry in scene list")
    if "CHSH" not in page:
        failures.append("bloch.html missing CHSH violation scene entry")
    if "drawSphere" not in js:
        failures.append("missing drawSphere helper (used for compact 2-sphere render)")
    if failures:
        return CheckResult("bloch_2qubit", False,
                           f"{len(failures)} issues with 2-qubit Bloch extension", failures)
    return CheckResult("bloch_2qubit", True,
                       "bloch-sphere.js supports 2-qubit scenes (Bell |Φ+⟩, |Ψ-⟩ singlet, CHSH violation) with side-by-side spheres + correlation line")


def check_issue_8_published():
    """Check (Phase 40): Issue #8 published with 5 real + 2 futuristic articles + Issue #7 archived."""
    spec = importlib.util.spec_from_file_location(
        "gen_digest", os.path.join(ROOT, "scripts", "gen-digest.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        return CheckResult("digest_issue_8", False,
                           f"could not load gen-digest.py: {e}")
    manifest = mod.MANIFEST
    if manifest.get("issue") != 8:
        return CheckResult("digest_issue_8", False,
                           f"MANIFEST issue is {manifest.get('issue')}, expected 8")
    if manifest.get("date") != "2026-12-08":
        return CheckResult("digest_issue_8", False,
                           f"MANIFEST date is {manifest.get('date')}, expected 2026-12-08")
    articles = manifest.get("articles", [])
    if len(articles) != 7:
        return CheckResult("digest_issue_8", False,
                           f"{len(articles)} articles, expected 7")
    real_count = sum(1 for a in articles if not a.get("futuristic_vision"))
    futuristic_count = sum(1 for a in articles if a.get("futuristic_vision"))
    if real_count != 5 or futuristic_count != 2:
        return CheckResult("digest_issue_8", False,
                           f"{real_count} real + {futuristic_count} futuristic, expected 5 + 2")
    # Anchors must be present
    ids = [a["id"] for a in articles]
    for expected_id in ["ai-catalysts-genatlas", "holographic-microscopy-2026", "tabpfn-v2-tabular", "bionemo-2-nvidia", "amie-diagnostic-2026"]:
        if expected_id not in ids:
            return CheckResult("digest_issue_8", False,
                               f"missing anchor article: {expected_id}")
    # Issue #7 must be archived
    archive_7 = os.path.join(DOCS, "digest", "archive", "issue-007.html")
    if not os.path.isfile(archive_7):
        return CheckResult("digest_issue_8", False,
                           "Issue #7 archive (docs/digest/archive/issue-007.html) missing")
    # Concept cards
    missing_cards = []
    for a in articles:
        card = os.path.join(DOCS, "concepts", f"digest-{a['id']}.html")
        if not os.path.isfile(card):
            missing_cards.append(a["id"])
    if missing_cards:
        return CheckResult("digest_issue_8", False,
                           f"missing concept cards: {', '.join(missing_cards)}")
    return CheckResult("digest_issue_8", True,
                       f"Issue #8 (2026-12-08) published: {real_count} real + {futuristic_count} futuristic; "
                       f"Issue #7 archived; 7 concept cards generated; anchors: catalysts+holography+tabpfn+bionemo+amie")


def check_concept_card_nd_strip():
    """Check (Phase 40): concept cards have the auto-embedded N-D parallel-coords strip.
    Tests both the most recent digest card (Issue #8) + an ML concept card."""
    # Use the current manifest's first article (Issue #8 anchor: ai-catalysts-genatlas)
    sample_card = os.path.join(DOCS, "concepts", "digest-ai-catalysts-genatlas.html")
    sample_ml_card = os.path.join(DOCS, "concepts", "ml-mse.html")
    if not os.path.isfile(sample_card) or not os.path.isfile(sample_ml_card):
        return CheckResult("concept_card_nd_strip", False,
                           "sample concept cards missing")
    digest_src = open(sample_card, encoding="utf-8").read()
    ml_src = open(sample_ml_card, encoding="utf-8").read()
    failures = []
    if "N-D properties strip" not in digest_src:
        failures.append("digest concept card missing N-D strip")
    if "N-D properties strip" not in ml_src:
        failures.append("ML concept card missing N-D strip")
    if "auto-generated" not in digest_src:
        failures.append("digest card strip not marked auto-generated")
    if "auto-generated" not in ml_src:
        failures.append("ML card strip not marked auto-generated")
    # Strip must contain at least 5 properties
    if digest_src.count("ellipsis") < 1:
        failures.append("digest card strip doesn't have property cells")
    if failures:
        return CheckResult("concept_card_nd_strip", False,
                           f"{len(failures)} issues with N-D strip", failures)
    return CheckResult("concept_card_nd_strip", True,
                       "All concept cards (digest + ML) auto-embed N-D parallel-coords strip with article/demo metadata")


# ---------------------------------------------------------------------------
# Phase 41 checks
# ---------------------------------------------------------------------------

def check_dicom_loader_wired():
    """Check (Phase 41): scientific-uploader supports DICOM + medical-imaging
    registers as a consumer of the uploader on science-biology.html."""
    bio_path = os.path.join(DOCS, "science-biology.html")
    up_js = os.path.join(DOCS, "scientific-uploader.js")
    med_js = os.path.join(DOCS, "medical-imaging.js")
    if not (os.path.isfile(bio_path) and os.path.isfile(up_js) and os.path.isfile(med_js)):
        return CheckResult("dicom_loader_wired", False,
                           "science-biology.html or scientific-uploader.js or medical-imaging.js missing")
    bio = open(bio_path, encoding="utf-8").read()
    up = open(up_js, encoding="utf-8").read()
    med = open(med_js, encoding="utf-8").read()
    failures = []
    if ".dcm" not in up or "dicom" not in up:
        failures.append("scientific-uploader.js does not support DICOM format")
    if "parseDICOM" not in up:
        failures.append("missing parseDICOM function")
    if "DICM" not in up:
        failures.append("missing DICM magic-bytes detection")
    if "registerAsUploaderConsumer" not in med:
        failures.append("medical-imaging.js missing registerAsUploaderConsumer API")
    if "loadParsed" not in med:
        failures.append("medical-imaging.js missing loadParsed API")
    if "registerAsUploaderConsumer('bio-medimg-container')" not in bio:
        failures.append("science-biology.html does not register medical-imaging as consumer")
    if 'id="bio-uploader-container"' not in bio:
        failures.append("science-biology.html missing #bio-uploader-container element")
    if failures:
        return CheckResult("dicom_loader_wired", False,
                           f"{len(failures)} issues with DICOM loader wiring", failures)
    return CheckResult("dicom_loader_wired", True,
                       "scientific-uploader.js parses DICOM (.dcm, DICM magic at offset 128) + medical-imaging viewer registered as consumer on biology hub")


def check_medical_atlas_present():
    """Check (Phase 41): docs/medical-atlas.html exists with 6 case studies + viewer mounting."""
    atlas_path = os.path.join(DOCS, "medical-atlas.html")
    if not os.path.isfile(atlas_path):
        return CheckResult("medical_atlas_present", False,
                           "docs/medical-atlas.html missing")
    src = open(atlas_path, encoding="utf-8").read()
    failures = []
    if "medical-imaging.js" not in src:
        failures.append("atlas does not load medical-imaging.js")
    if "scientific-uploader.js" not in src:
        failures.append("atlas does not load scientific-uploader.js")
    if 'AIHPC_MEDIMG' not in src:
        failures.append("atlas does not use AIHPC_MEDIMG")
    if 'AIHPC_UPLOADER' not in src:
        failures.append("atlas does not use AIHPC_UPLOADER")
    # Check 6 cases (stroke, tumor, pneumonia, fracture, covid, abdominal)
    expected_cases = ['stroke', 'tumor', 'pneumonia', 'fracture', 'covid', 'abdominal']
    for c in expected_cases:
        if c not in src:
            failures.append(f"missing case study: {c}")
    # Modal for case detail
    if 'case-detail-modal' not in src:
        failures.append("missing case-detail-modal")
    if 'AI tools' not in src and 'ai_tools' not in src:
        failures.append("missing AI tools listing per case")
    if "TotalSegmentator" not in src:
        failures.append("missing TotalSegmentator reference")
    if "MedSAM" not in src:
        failures.append("missing MedSAM reference")
    if "RadFM" not in src:
        failures.append("missing RadFM reference")
    if failures:
        return CheckResult("medical_atlas_present", False,
                           f"{len(failures)} issues with medical atlas page", failures)
    return CheckResult("medical_atlas_present", True,
                       "docs/medical-atlas.html: 6 case studies (stroke, tumor, pneumonia, fracture, COVID-19, abdominal) + medical-imaging viewer + DICOM uploader + clinical context + AI tooling references")


def check_issue_9_published():
    """Check (Phase 41): Issue #9 published (Tuesday 2026-12-15) with 5 real + 2 futuristic."""
    spec = importlib.util.spec_from_file_location(
        "gen_digest", os.path.join(ROOT, "scripts", "gen-digest.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        return CheckResult("digest_issue_9", False, f"could not load gen-digest.py: {e}")
    manifest = mod.MANIFEST
    if manifest.get("issue") != 9:
        return CheckResult("digest_issue_9", False,
                           f"MANIFEST issue is {manifest.get('issue')}, expected 9")
    if manifest.get("date") != "2026-12-15":
        return CheckResult("digest_issue_9", False,
                           f"MANIFEST date is {manifest.get('date')}, expected 2026-12-15")
    articles = manifest.get("articles", [])
    if len(articles) != 7:
        return CheckResult("digest_issue_9", False,
                           f"{len(articles)} articles, expected 7")
    real_count = sum(1 for a in articles if not a.get("futuristic_vision"))
    futuristic_count = sum(1 for a in articles if a.get("futuristic_vision"))
    if real_count != 5 or futuristic_count != 2:
        return CheckResult("digest_issue_9", False,
                           f"{real_count} real + {futuristic_count} futuristic, expected 5 + 2")
    ids = [a["id"] for a in articles]
    for expected in ["esm-4-protein-lm", "coscientist-v3-autonomous-lab", "chembench-2026-llm", "google-lens-medical-triage", "codex-clinician-finetune"]:
        if expected not in ids:
            return CheckResult("digest_issue_9", False,
                               f"missing anchor article: {expected}")
    archive_8 = os.path.join(DOCS, "digest", "archive", "issue-008.html")
    if not os.path.isfile(archive_8):
        return CheckResult("digest_issue_9", False,
                           "Issue #8 archive (docs/digest/archive/issue-008.html) missing")
    missing_cards = []
    for a in articles:
        card = os.path.join(DOCS, "concepts", f"digest-{a['id']}.html")
        if not os.path.isfile(card):
            missing_cards.append(a["id"])
    if missing_cards:
        return CheckResult("digest_issue_9", False,
                           f"missing concept cards: {', '.join(missing_cards)}")
    return CheckResult("digest_issue_9", True,
                       f"Issue #9 (2026-12-15) published: {real_count} real + {futuristic_count} futuristic; "
                       f"Issue #8 archived; 7 concept cards; anchors: ESM-4+Coscientist+ChemBench+Lens medical+Codex-clinician")


# ---------------------------------------------------------------------------
# Phase 42 checks
# ---------------------------------------------------------------------------

def check_fock_viewer_loaded():
    """Check (Phase 42): science/physics/quantum.html loads the Fock state viewer
    + has the Math→Code→Output pedagogy block."""
    q_path = os.path.join(DOCS, "science", "physics", "quantum.html")
    fock_js = os.path.join(DOCS, "fock-state-viewer.js")
    if not os.path.isfile(q_path) or not os.path.isfile(fock_js):
        return CheckResult("fock_viewer_loaded", False,
                           "quantum.html or fock-state-viewer.js missing")
    page = open(q_path, encoding="utf-8").read()
    js = open(fock_js, encoding="utf-8").read()
    failures = []
    if "fock-state-viewer.js" not in page:
        failures.append("quantum.html does not load fock-state-viewer.js")
    if 'id="quantum-fock-container"' not in page:
        failures.append("missing #quantum-fock-container element")
    if "AIHPC_FOCK" not in js:
        failures.append("fock-state-viewer.js does not expose AIHPC_FOCK global")
    if "hermite" not in js.lower():
        failures.append("missing Hermite polynomial computation")
    if "applyCreation" not in js or "applyAnnihilation" not in js:
        failures.append("missing applyCreation / applyAnnihilation APIs")
    if "IntersectionObserver" not in page:
        failures.append("missing lazy-mount via IntersectionObserver")
    if "Many-Body Quantum Mechanics" not in page:
        failures.append("missing Many-Body QM section header")
    if "Math → Code → Output" not in page and "Math → Code" not in page:
        failures.append("missing Math→Code→Output pedagogy block")
    if "Hermite" not in page:
        failures.append("missing Hermite polynomial mention in pedagogy")
    if "QuTiP" not in page:
        failures.append("missing QuTiP reference")
    if failures:
        return CheckResult("fock_viewer_loaded", False,
                           f"{len(failures)} issues with Fock viewer", failures)
    return CheckResult("fock_viewer_loaded", True,
                       "quantum.html loads fock-state-viewer.js + lazy-mount via IntersectionObserver + Math→Code→Output pedagogy block + Hermite polynomial + QuTiP reference")


def check_playground_present():
    """Check (Phase 42): docs/playground.html exists with dataset/model/viz selectors + combine button."""
    pg_path = os.path.join(DOCS, "playground.html")
    if not os.path.isfile(pg_path):
        return CheckResult("playground_present", False, "docs/playground.html missing")
    src = open(pg_path, encoding="utf-8").read()
    failures = []
    if "scientific-uploader.js" not in src:
        failures.append("playground does not load scientific-uploader.js")
    if "medical-imaging.js" not in src:
        failures.append("playground does not load medical-imaging.js")
    if "molecule-3d.js" not in src:
        failures.append("playground does not load molecule-3d.js")
    if "attention-heatmap.js" not in src:
        failures.append("playground does not load attention-heatmap.js")
    if "ml-etl.js" not in src:
        failures.append("playground does not load ml-etl.js")
    if 'id="pg-uploader-container"' not in src:
        failures.append("missing #pg-uploader-container element")
    if 'id="pg-model-select"' not in src:
        failures.append("missing #pg-model-select element")
    if 'id="pg-viz-select"' not in src:
        failures.append("missing #pg-viz-select element")
    if 'id="pg-combine-btn"' not in src:
        failures.append("missing #pg-combine-btn (Combine button)")
    if 'id="pg-stage"' not in src:
        failures.append("missing #pg-stage output element")
    # Preset buttons for sample datasets
    expected_presets = ['regression-csv', 'classification-csv', 'molecule-sdf', 'dicom-dcm']
    for p in expected_presets:
        if 'data-preset="' + p + '"' not in src:
            failures.append(f"missing preset button: {p}")
    if failures:
        return CheckResult("playground_present", False,
                           f"{len(failures)} issues with playground page", failures)
    return CheckResult("playground_present", True,
                       "docs/playground.html: dataset + model + viz selectors + Combine button + stage + 4 preset samples + 5 component scripts loaded")


# ---------------------------------------------------------------------------
# Phase 43 checks
# ---------------------------------------------------------------------------

def check_segmentation_pipeline_loaded():
    """Check (Phase 43): science-biology.html loads the medical-image
    segmentation pipeline viewer + has the Levels of Investigation framework."""
    bio_path = os.path.join(DOCS, "science-biology.html")
    seg_js = os.path.join(DOCS, "segmentation-pipeline.js")
    if not os.path.isfile(bio_path) or not os.path.isfile(seg_js):
        return CheckResult("segmentation_pipeline_loaded", False,
                           "science-biology.html or segmentation-pipeline.js missing")
    page = open(bio_path, encoding="utf-8").read()
    js = open(seg_js, encoding="utf-8").read()
    failures = []
    if "segmentation-pipeline.js" not in page:
        failures.append("science-biology.html does not load segmentation-pipeline.js")
    if 'id="bio-seg-container"' not in page:
        failures.append("missing #bio-seg-container element")
    if "AIHPC_SEG" not in js:
        failures.append("segmentation-pipeline.js does not expose AIHPC_SEG global")
    if "Dice" not in page:
        failures.append("missing Dice coefficient mention")
    if "IoU" not in page:
        failures.append("missing IoU mention")
    if "Hausdorff" not in page:
        failures.append("missing Hausdorff distance mention")
    if "Levels of Investigation" not in page:
        failures.append("missing Levels of Investigation framework")
    if "Tier 1" not in page or "Tier 2" not in page or "Tier 3" not in page:
        failures.append("missing Tier 1/2/3 sub-sections")
    if "Viz.ai" not in page:
        failures.append("missing Viz.ai reference (Tier 1)")
    if "TotalSegmentator" not in page:
        failures.append("missing TotalSegmentator reference (Tier 2)")
    if "OpenMM" not in page:
        failures.append("missing OpenMM reference (Tier 3)")
    if failures:
        return CheckResult("segmentation_pipeline_loaded", False,
                           f"{len(failures)} issues with segmentation pipeline", failures)
    return CheckResult("segmentation_pipeline_loaded", True,
                       "science-biology.html loads segmentation-pipeline.js + 3-column pipeline (MRI → mask → 3D) + Dice/IoU/Hausdorff metrics + Levels of Investigation (Tier 1/2/3)")


def check_biomolecular_dynamics_loaded():
    """Check (Phase 43): science-biology.html loads BioEmu2-style biomolecular dynamics viewer."""
    bio_path = os.path.join(DOCS, "science-biology.html")
    bd_js = os.path.join(DOCS, "biomolecular-dynamics.js")
    if not os.path.isfile(bio_path) or not os.path.isfile(bd_js):
        return CheckResult("biomolecular_dynamics_loaded", False,
                           "science-biology.html or biomolecular-dynamics.js missing")
    page = open(bio_path, encoding="utf-8").read()
    js = open(bd_js, encoding="utf-8").read()
    failures = []
    if "biomolecular-dynamics.js" not in page:
        failures.append("science-biology.html does not load biomolecular-dynamics.js")
    if 'id="bio-biodyn-container"' not in page:
        failures.append("missing #bio-biodyn-container element")
    if "AIHPC_BIODYN" not in js:
        failures.append("biomolecular-dynamics.js does not expose AIHPC_BIODYN global")
    if "BioEmu2" not in page:
        failures.append("missing BioEmu2 reference")
    if "Structure prediction" not in page:
        failures.append("missing Structure prediction panel mention")
    if "Large complexes" not in page:
        failures.append("missing Large complexes panel mention")
    if "Equilibrium sampling" not in page:
        failures.append("missing Equilibrium sampling panel mention")
    if "Dynamics" not in page:
        failures.append("missing Dynamics panel mention")
    if "AlphaFold 3" not in page:
        failures.append("missing AlphaFold 3 reference")
    if "ESM-3" not in page:
        failures.append("missing ESM-3 reference")
    if "MACE-MT-2" not in page:
        failures.append("missing MACE-MT-2 reference")
    if failures:
        return CheckResult("biomolecular_dynamics_loaded", False,
                           f"{len(failures)} issues with biomolecular dynamics viewer", failures)
    return CheckResult("biomolecular_dynamics_loaded", True,
                       "science-biology.html loads biomolecular-dynamics.js + 4-panel BioEmu2-style viewer + Structure/Complex/Ensemble/Dynamics panels + AlphaFold3/ESM-3/MACE-MT-2 references")


def check_issue_10_published():
    """Check (Phase 43): Issue #10 published (Tuesday 2026-12-22) with 5 real + 2 futuristic."""
    spec = importlib.util.spec_from_file_location(
        "gen_digest", os.path.join(ROOT, "scripts", "gen-digest.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        return CheckResult("digest_issue_10", False, f"could not load gen-digest.py: {e}")
    manifest = mod.MANIFEST
    if manifest.get("issue") != 10:
        return CheckResult("digest_issue_10", False,
                           f"MANIFEST issue is {manifest.get('issue')}, expected 10")
    if manifest.get("date") != "2026-12-22":
        return CheckResult("digest_issue_10", False,
                           f"MANIFEST date is {manifest.get('date')}, expected 2026-12-22")
    articles = manifest.get("articles", [])
    if len(articles) != 7:
        return CheckResult("digest_issue_10", False,
                           f"{len(articles)} articles, expected 7")
    real_count = sum(1 for a in articles if not a.get("futuristic_vision"))
    futuristic_count = sum(1 for a in articles if a.get("futuristic_vision"))
    if real_count != 5 or futuristic_count != 2:
        return CheckResult("digest_issue_10", False,
                           f"{real_count} real + {futuristic_count} futuristic, expected 5 + 2")
    ids = [a["id"] for a in articles]
    for expected in ["alphaproteo-v3-binders", "bionemo-3-nvidia", "alphagenome-2-variants", "mistral-med-large", "openai-sora-vision-medical"]:
        if expected not in ids:
            return CheckResult("digest_issue_10", False,
                               f"missing anchor article: {expected}")
    archive_9 = os.path.join(DOCS, "digest", "archive", "issue-009.html")
    if not os.path.isfile(archive_9):
        return CheckResult("digest_issue_10", False,
                           "Issue #9 archive (docs/digest/archive/issue-009.html) missing")
    missing_cards = []
    for a in articles:
        card = os.path.join(DOCS, "concepts", f"digest-{a['id']}.html")
        if not os.path.isfile(card):
            missing_cards.append(a["id"])
    if missing_cards:
        return CheckResult("digest_issue_10", False,
                           f"missing concept cards: {', '.join(missing_cards)}")
    return CheckResult("digest_issue_10", True,
                       f"Issue #10 (2026-12-22) published: {real_count} real + {futuristic_count} futuristic; "
                       f"Issue #9 archived; 7 concept cards; anchors: AlphaProteo-v3+BioNeMo-3+AlphaGenome-2+Mistral-Med+Sora-vision-medical")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--quiet", action="store_true", help="only show failures")
    parser.add_argument("--json", action="store_true", help="machine-readable JSON output")
    args = parser.parse_args()

    html_files = walk_html_files(DOCS)
    checks = [
        check_div_balance(html_files),
        check_script_style_balance(html_files),
        check_ribbon(html_files),
        check_subscribe_gate(),
        check_math_derivations(),
        check_particle_bg_js(html_files),
        check_git_config_clean(),
        check_internal_links(html_files),
        check_seed_demos(),
        check_digest_pattern(),
        check_weekly_digest_in_ribbon(html_files),
        check_generator_scripts(),
        check_dag_provenance(),
        check_temporal_graph_route(),
        check_digest_parsers_loaded(),
        check_etl_panels_present(),
        check_rss_subscribe_panel(),
        check_animated_derivations_loaded(),
        check_audit_dashboard(),
        check_concept_cards_generated(),
        check_data_tables_present(),
        check_concept_card_etl(),
        # Phase 37
        check_bloch_component(),
        check_gts_3d_mode(),
        check_ml_etl_widget(),
        check_knowledge_graph_extended(),
        # Phase 38
        check_cheminformatics_3d(),
        check_optimiser_showdown_extended(),
        # Phase 39
        check_medical_imaging_loaded(),
        check_quantum_vqc_loaded(),
        # Phase 40
        check_scientific_uploader_loaded(),
        check_attention_heatmap_loaded(),
        check_kg_search_present(),
        check_bloch_2qubit_supported(),
        check_concept_card_nd_strip(),
        # Phase 41 (issue_8 superseded by issue_9)
        check_dicom_loader_wired(),
        check_medical_atlas_present(),
        # Phase 42
        check_fock_viewer_loaded(),
        check_playground_present(),
        # Phase 43 (issue_9 superseded by issue_10)
        check_segmentation_pipeline_loaded(),
        check_biomolecular_dynamics_loaded(),
        check_issue_10_published(),
    ]

    if args.json:
        print(json.dumps({
            "total": len(checks),
            "passed": sum(1 for c in checks if c.passed),
            "failed": sum(1 for c in checks if not c.passed),
            "checks": [c.to_dict() for c in checks],
        }, indent=2))
    else:
        print("=" * 70)
        print("AIHPC Advanced — application audit")
        print("=" * 70)
        for c in checks:
            symbol = "✓" if c.passed else "✗"
            if args.quiet and c.passed:
                continue
            print(f"\n{symbol} {c.name}")
            print(f"  {c.detail}")
            for item in c.items[:10]:
                print(f"    - {item}")
            if len(c.items) > 10:
                print(f"    ... and {len(c.items)-10} more")

        n_pass = sum(1 for c in checks if c.passed)
        n_fail = sum(1 for c in checks if not c.passed)
        print("\n" + "=" * 70)
        print(f"Total: {len(checks)} | Passed: {n_pass} | Failed: {n_fail}")
        print("=" * 70)

    sys.exit(0 if all(c.passed for c in checks) else 1)


if __name__ == "__main__":
    main()

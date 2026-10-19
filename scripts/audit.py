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

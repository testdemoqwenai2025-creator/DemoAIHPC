#!/usr/bin/env python3
"""gen-component-registry.py — Phase 47

Reads docs/component-manifest.json and verifies every component:
  1. The script file exists at the declared path
  2. The declared global variable appears in the script file
  3. For each declared mount page, the script is loaded (script tag present)

Outputs a report + exit code (0 = all verified, 1 = failures).

Usage:
    python3 scripts/gen-component-registry.py [--json]
"""
import os
import re
import sys
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
MANIFEST_PATH = os.path.join(DOCS, "component-manifest.json")

def main():
    if not os.path.isfile(MANIFEST_PATH):
        print("ERROR: component-manifest.json not found", file=sys.stderr)
        sys.exit(2)

    manifest = json.loads(open(MANIFEST_PATH, encoding="utf-8").read())
    components = manifest.get("components", [])
    print(f"Component manifest: {len(components)} components, version {manifest.get('version', '?')}")
    print(f"Phases covered: {manifest.get('phases_covered', '?')}")
    print(f"Lazy-loaded: {manifest.get('lazy_loaded_components', '?')} / {manifest.get('total_components', '?')}")
    print()

    all_ok = True
    total_checks = 0
    passed_checks = 0
    failures = []

    for comp in components:
        name = comp.get("name", "?")
        global_var = comp.get("global", "")
        script_rel = comp.get("script", "")
        mount_pages = comp.get("mount_pages", [])
        lazy = comp.get("lazy_load", False)
        concept = comp.get("concept_card")
        phase = comp.get("phase", "?")
        desc = comp.get("description", "")[:60]

        print(f"  [{phase}] {name}")
        print(f"    global: {global_var} | lazy: {lazy} | desc: {desc}...")

        # Check 1: script file exists
        script_path = os.path.join(ROOT, script_rel) if script_rel else ""
        total_checks += 1
        if script_path and os.path.isfile(script_path):
            passed_checks += 1
            # Check 2: global var in script
            if global_var:
                total_checks += 1
                js_src = open(script_path, encoding="utf-8").read()
                if global_var in js_src:
                    passed_checks += 1
                else:
                    failures.append(f"{name}: global '{global_var}' not found in {script_rel}")
                    all_ok = False
        else:
            failures.append(f"{name}: script file not found at {script_rel}")
            all_ok = False

        # Check 3: mount pages load the script
        for page_desc in mount_pages:
            if page_desc.startswith("all "):
                # Skip "all pages with..." entries
                continue
            total_checks += 1
            page_path = os.path.join(DOCS, page_desc)
            if os.path.isfile(page_path):
                page_src = open(page_path, encoding="utf-8").read()
                # The script filename should appear in a <script src> tag
                script_filename = os.path.basename(script_rel) if script_rel else ""
                if script_filename and script_filename in page_src:
                    passed_checks += 1
                else:
                    failures.append(f"{name}: script '{script_filename}' not loaded on {page_desc}")
                    all_ok = False
            else:
                # Page might not exist yet (e.g. playground.html was renamed)
                failures.append(f"{name}: mount page '{page_desc}' not found")
                all_ok = False

        # Check 4: concept card exists (if declared)
        if concept:
            total_checks += 1
            concept_path = os.path.join(DOCS, concept)
            if os.path.isfile(concept_path):
                passed_checks += 1
            else:
                failures.append(f"{name}: concept card '{concept}' not found")
                all_ok = False

        print(f"    → {'✓ verified' if all_ok else '✗ has issues'}")
        print()

    print("=" * 60)
    print(f"Total checks: {total_checks} | Passed: {passed_checks} | Failed: {total_checks - passed_checks}")
    if failures:
        print(f"\n{'FAILURES:'}")
        for f in failures:
            print(f"  ✗ {f}")
        sys.exit(1)
    else:
        print(f"\n✓ All {total_checks} component-registry checks passed.")
        print(f"  {len(components)} components verified.")
        print(f"  {manifest.get('total_components', '?')} total components in manifest.")
        print(f"  {manifest.get('lazy_loaded_components', '?')} lazy-loaded.")
        print(f"  {manifest.get('concept_cards_with_components', '?')} with concept cards.")
        sys.exit(0)

if __name__ == "__main__":
    main()

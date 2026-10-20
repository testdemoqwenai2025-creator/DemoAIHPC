#!/usr/bin/env python3
"""
gen-audit-dashboard.py — Phase 28 + 29 audit dashboard generator.

Runs scripts/audit.py --json and emits docs/audit.html — a live
status board rendering the audit results.

Phase 29 additions:
  - Stores each run's results to docs/audit-history/audit-<timestamp>.json
  - Loads the last 10 historical runs when generating the dashboard
  - Shows a timeline of recent runs at the bottom

The dashboard:
  - Shows total / passed / failed summary at the top
  - Lists each check with a green ✓ or red ✗ symbol
  - Shows the check name + detail + items (for failures)
  - Shows the last-run timestamp + commit SHA
  - Shows a history timeline of the last 10 runs (Phase 29)
  - Auto-regenerates with each release via this script

Run:
    python3 scripts/gen-audit-dashboard.py
"""
import json
import os
import subprocess
import sys
import re
from datetime import datetime, timezone

# ROOT is the repo root, computed relative to this script's location so
# the script works on developer machines AND inside CI runners (where the
# checkout lives under /home/runner/work/...). The previous hardcoded
# /home/z/my-project/AETH-1-Content-Archive only worked locally and broke
# the CI mirror step (Phase 50 follow-up fix).
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_PATH = os.path.join(ROOT, "scripts", "audit.py")
OUT_PATH = os.path.join(ROOT, "docs", "audit.html")
HISTORY_DIR = os.path.join(ROOT, "docs", "audit-history")
HISTORY_MAX = 10  # keep the last 10 runs


def get_commit_sha():
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, timeout=5, cwd=ROOT,
        )
        return result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def run_audit():
    """Run audit.py --json and return the parsed results."""
    try:
        result = subprocess.run(
            ["python3", AUDIT_PATH, "--json"],
            capture_output=True, text=True, timeout=120, cwd=ROOT,
        )
        if result.returncode != 0:
            return None, f"audit.py exited with code {result.returncode}"
        return json.loads(result.stdout), None
    except subprocess.TimeoutExpired:
        return None, "audit timed out after 120 seconds"
    except json.JSONDecodeError as e:
        return None, f"audit output not valid JSON: {e}"
    except Exception as e:
        return None, f"unexpected error: {e}"


def save_history_run(audit_result, commit_sha):
    """Save the current run to docs/audit-history/audit-<timestamp>.json."""
    if not audit_result:
        return
    os.makedirs(HISTORY_DIR, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "commit": commit_sha,
        "total": audit_result.get("total", 0),
        "passed": audit_result.get("passed", 0),
        "failed": audit_result.get("failed", 0),
        "checks": [{"name": c.get("name"), "passed": c.get("passed")} for c in audit_result.get("checks", [])],
    }
    path = os.path.join(HISTORY_DIR, f"audit-{timestamp}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)
    return path


def load_history_runs():
    """Load the last N historical runs (newest first)."""
    if not os.path.isdir(HISTORY_DIR):
        return []
    files = sorted([f for f in os.listdir(HISTORY_DIR) if f.startswith("audit-") and f.endswith(".json")], reverse=True)
    runs = []
    for fname in files[:HISTORY_MAX]:
        path = os.path.join(HISTORY_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                runs.append(json.load(f))
        except Exception:
            pass
    return runs


def emit_dashboard(audit_result, error, commit_sha, history_runs):
    """Emit the audit dashboard HTML."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    if error:
        status_color = "#ef4444"
        status_text = "Audit failed to run"
        summary_html = f'<div style="padding: 20px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; color: #fca5a5;">⚠ {error}</div>'
        total = passed = failed = 0
        checks = []
    else:
        total = audit_result.get("total", 0)
        passed = audit_result.get("passed", 0)
        failed = audit_result.get("failed", 0)
        checks = audit_result.get("checks", [])
        status_color = "#10b981" if failed == 0 else "#ef4444"
        status_text = "All checks passed" if failed == 0 else f"{failed} check(s) failed"
        summary_html = ""

    # Render each check
    check_rows = []
    for c in checks:
        passed_flag = c.get("passed", False)
        symbol = "✓" if passed_flag else "✗"
        row_color = "rgba(16,185,129,0.08)" if passed_flag else "rgba(239,68,68,0.08)"
        border_color = "rgba(16,185,129,0.3)" if passed_flag else "rgba(239,68,68,0.3)"
        symbol_color = "#10b981" if passed_flag else "#ef4444"
        name = c.get("name", "")
        detail = c.get("detail", "")
        items = c.get("items", [])
        items_html = ""
        if items and not passed_flag:
            items_html = '<ul style="margin: 8px 0 0; padding-left: 20px; color: #9ca3af; font-size: 11px;">'
            for item in items[:10]:
                items_html += f"<li>{item}</li>"
            if len(items) > 10:
                items_html += f"<li>… and {len(items) - 10} more</li>"
            items_html += "</ul>"
        check_rows.append(f"""
        <div style="background: {row_color}; border: 1px solid {border_color}; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px;">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 20px; color: {symbol_color}; font-weight: 700; line-height: 1.2;">{symbol}</span>
            <div style="flex: 1;">
              <div style="font-weight: 700; color: #f3f4f6; font-size: 14px;">{name}</div>
              <div style="color: #9ca3af; font-size: 12px; margin-top: 2px;">{detail}</div>
              {items_html}
            </div>
          </div>
        </div>""")

    checks_html = "\n".join(check_rows)

    # Phase 29: history timeline
    history_html = ""
    if history_runs:
        history_rows = []
        for run in history_runs:
            run_ts = run.get("timestamp", "")[:19].replace("T", " ")
            run_pass = run.get("passed", 0)
            run_fail = run.get("failed", 0)
            run_total = run.get("total", 0)
            run_commit = run.get("commit", "?")[:8]
            run_status_color = "#10b981" if run_fail == 0 else "#ef4444"
            run_status_text = "✓ pass" if run_fail == 0 else f"✗ {run_fail} fail"
            # Build per-check dot row (mini visualisation)
            dots_html = ""
            for c in run.get("checks", []):
                color = "#10b981" if c.get("passed") else "#ef4444"
                dots_html += f'<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:{color}; margin-right:2px; vertical-align:middle;"></span>'
            history_rows.append(f"""
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 8px 12px; font-family: 'SF Mono', Menlo, monospace; font-size: 11px; color: #9ca3af;">{run_ts}</td>
            <td style="padding: 8px 12px; font-family: 'SF Mono', Menlo, monospace; font-size: 11px; color: #9ca3af;">{run_commit}</td>
            <td style="padding: 8px 12px; font-size: 11px;">{dots_html}</td>
            <td style="padding: 8px 12px; font-family: 'SF Mono', Menlo, monospace; font-size: 11px; color: #9ca3af;">{run_pass}/{run_total}</td>
            <td style="padding: 8px 12px; color: {run_status_color}; font-size: 11px; font-weight: 700;">{run_status_text}</td>
          </tr>""")
        history_rows_html = "\n".join(history_rows)
        history_html = f"""
      <div class="checks">
        <h2>Audit history (last {len(history_runs)} runs)</h2>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
          Each row is one audit run (newest first). Green dots = checks that passed; red = failed.
          Historical runs are stored at <code>docs/audit-history/audit-YYYY-MM-DDTHH-MM-SSZ.json</code>.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #1f2937;">
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em;">Timestamp</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em;">Commit</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em;">Checks</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em;">Score</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em;">Status</th>
            </tr>
          </thead>
          <tbody>{history_rows_html}
          </tbody>
        </table>
      </div>"""

    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="AIHPC Advanced — application audit dashboard. Live status board for {total} functional checks across the platform, with {len(history_runs)} historical runs." />
    <title>Application Audit — AIHPC Advanced</title>
    <style>
      :root {{
        --bg: #0b0f1a;
        --bg-elevated: #121826;
        --border: #1f2937;
        --text: #f3f4f6;
        --text-muted: #9ca3af;
        --accent: #8b5cf6;
        --accent-2: #06b6d4;
        --success: #10b981;
        --danger: #ef4444;
      }}
      * {{ box-sizing: border-box; }}
      html, body {{ margin: 0; padding: 0; }}
      body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: radial-gradient(1200px 600px at 20% -10%, rgba(139,92,246,0.12), transparent 60%), radial-gradient(1200px 600px at 100% 0%, rgba(6,182,212,0.08), transparent 55%), var(--bg);
        color: var(--text);
        min-height: 100vh;
        line-height: 1.7;
      }}
      .container {{ max-width: 900px; margin: 0 auto; padding: 56px 24px 96px; }}
      h1 {{
        font-size: 38px;
        margin: 0 0 8px;
        letter-spacing: -0.02em;
        background: linear-gradient(90deg, #fff, #c4b5fd 60%, #67e8f9);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }}
      .lead {{ color: var(--text-muted); font-size: 16px; margin-bottom: 32px; }}
      .meta-row {{
        display: flex; gap: 16px; flex-wrap: wrap;
        font-size: 12px; color: var(--text-muted);
        padding: 12px 16px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 10px;
        margin-bottom: 24px;
      }}
      .meta-row strong {{ color: var(--text); }}
      .summary {{
        display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px; margin-bottom: 32px;
      }}
      .summary-card {{
        padding: 24px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 16px;
        text-align: center;
      }}
      .summary-card .n {{ font-size: 48px; font-weight: 800; line-height: 1; }}
      .summary-card .l {{ font-size: 12px; color: var(--text-muted); margin-top: 8px; text-transform: uppercase; letter-spacing: 0.08em; }}
      .summary-card.total .n {{ color: var(--accent); }}
      .summary-card.passed .n {{ color: var(--success); }}
      .summary-card.failed .n {{ color: var(--danger); }}
      .summary-card.status .n {{ color: {status_color}; font-size: 24px; line-height: 2; }}
      .legend {{
        font-size: 13px; color: var(--text-muted);
        padding: 14px 18px;
        background: rgba(139,92,246,0.06);
        border-left: 3px solid var(--accent);
        border-radius: 8px;
        margin-bottom: 24px;
      }}
      .checks h2 {{ font-size: 18px; margin: 24px 0 12px; color: var(--text); }}
      a {{ color: var(--accent-2); text-decoration: none; }}
      a:hover {{ text-decoration: underline; }}
      .footer {{
        margin-top: 64px;
        padding-top: 24px;
        border-top: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 13px;
      }}
      body.light {{
        background: #fafafa; color: #18181b;
      }}
      body.light .meta-row, body.light .summary-card, body.light .legend {{
        background: white; border-color: #e5e7eb;
      }}
    </style>
  </head>
  <body>
    <div class="container">
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
        <a href="index.html">Home</a> / Application audit
      </p>
      <h1>Application audit dashboard</h1>
      <p class="lead">
        Live status board for {total} functional checks across the AIHPC Advanced platform.
        The audit script (<code>scripts/audit.py</code>) runs on every <code>v*</code> tag
        push via the <code>application-audit</code> CI job. This page is regenerated by
        <code>scripts/gen-audit-dashboard.py</code> as part of each release.
        Phase 29: each run is archived to <code>docs/audit-history/</code> — {len(history_runs)} historical runs shown below.
      </p>

      <div class="meta-row">
        <span><strong>Last run:</strong> {timestamp}</span>
        <span><strong>Commit:</strong> <code>{commit_sha}</code></span>
        <span><strong>Status:</strong> <span style="color: {status_color}; font-weight: 700;">{status_text}</span></span>
        <span><strong>Total:</strong> {total} · <strong style="color: var(--success);">Passed:</strong> {passed} · <strong style="color: var(--danger);">Failed:</strong> {failed}</span>
      </div>

      <div class="summary">
        <div class="summary-card total"><div class="n">{total}</div><div class="l">Total checks</div></div>
        <div class="summary-card passed"><div class="n">{passed}</div><div class="l">Passed</div></div>
        <div class="summary-card failed"><div class="n">{failed}</div><div class="l">Failed</div></div>
        <div class="summary-card status"><div class="n">{status_text}</div><div class="l">Overall</div></div>
      </div>

      {summary_html}

      <div class="legend">
        ✓ = check passed · ✗ = check failed (click on the failing check for details).
        Failures block the CI workflow's <code>application-audit</code> job — the mirror
        push to DemoAIHPC will not proceed until all checks pass.
      </div>

      <div class="quick-links" style="margin-top: 16px; padding: 14px 16px; background: rgba(18,24,38,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">Platform self-tests · verify these pages work</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a href="404.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: linear-gradient(90deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15)); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; text-decoration: none; font-size: 12px; font-weight: 600;">🚧 404 page</a>
          <a href="lab.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: linear-gradient(90deg, rgba(6,182,212,0.15), rgba(16,185,129,0.15)); border: 1px solid rgba(6,182,212,0.4); color: #67e8f9; text-decoration: none; font-size: 12px; font-weight: 600;">🔬 Lab (Pyodide)</a>
          <a href="feeds.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: linear-gradient(90deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15)); border: 1px solid rgba(6,182,212,0.4); color: #67e8f9; text-decoration: none; font-size: 12px; font-weight: 600;">📡 Live feeds</a>
          <a href="concepts.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: linear-gradient(90deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15)); border: 1px solid rgba(139,92,246,0.4); color: #c4b5fd; text-decoration: none; font-size: 12px; font-weight: 600;">🗂 Concepts index</a>
          <a href="index.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: rgba(18,24,38,0.6); border: 1px solid var(--border-strong); color: #f3f4f6; text-decoration: none; font-size: 12px; font-weight: 600;">🏠 Home</a>
          <a href="timeline.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: rgba(18,24,38,0.6); border: 1px solid var(--border-strong); color: #f3f4f6; text-decoration: none; font-size: 12px; font-weight: 600;">📅 Timeline</a>
          <a href="retrospective.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: rgba(18,24,38,0.6); border: 1px solid var(--border-strong); color: #f3f4f6; text-decoration: none; font-size: 12px; font-weight: 600;">📜 Retrospective</a>
          <a href="component-registry.html" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 9999px; background: rgba(18,24,38,0.6); border: 1px solid var(--border-strong); color: #f3f4f6; text-decoration: none; font-size: 12px; font-weight: 600;">🧩 Component Registry</a>
        </div>
      </div>

      <div class="checks">
        <h2>Current run ({len(checks)} checks)</h2>
        {checks_html}
      </div>

      {history_html}

      <div class="footer">
        <p>&copy; 2026 AIHPC Advanced. &middot; Generated by <code>scripts/gen-audit-dashboard.py</code>. The underlying audit is in <code>scripts/audit.py</code> ({total} checks). The CI workflow is at <code>.github/workflows/mirror-to-public.yml</code>. Comments to <a href="mailto:testdemoqwenai2025@gmail.com">testdemoqwenai2025@gmail.com</a>.</p>
      </div>
    </div>
  </body>
</html>
"""
    return html


def main():
    print("Running audit.py --json ...")
    audit_result, error = run_audit()
    if error:
        print(f"  ⚠ audit failed: {error}")
    else:
        total = audit_result.get("total", 0)
        passed = audit_result.get("passed", 0)
        failed = audit_result.get("failed", 0)
        print(f"  ✓ audit ran: {passed}/{total} passed, {failed} failed")

    commit_sha = get_commit_sha()
    print(f"  commit: {commit_sha}")

    # Phase 29: save the current run to history
    if audit_result:
        hist_path = save_history_run(audit_result, commit_sha)
        if hist_path:
            print(f"  history saved: {hist_path}")

    # Load history (including the run we just saved)
    history_runs = load_history_runs()
    print(f"  history loaded: {len(history_runs)} runs")

    html = emit_dashboard(audit_result, error, commit_sha, history_runs)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  written to: {OUT_PATH} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()

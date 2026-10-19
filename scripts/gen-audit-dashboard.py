#!/usr/bin/env python3
"""
gen-audit-dashboard.py — Phase 28 audit dashboard generator.

Runs scripts/audit.py --json and emits docs/audit.html — a live
status board rendering the audit results.

The dashboard:
  - Shows total / passed / failed summary at the top
  - Lists each check with a green ✓ or red ✗ symbol
  - Shows the check name + detail + items (for failures)
  - Shows the last-run timestamp + commit SHA
  - Auto-regenerates with each release via this script

Run:
    python3 scripts/gen-audit-dashboard.py
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

ROOT = "/home/z/my-project/AETH-1-Content-Archive"
AUDIT_PATH = os.path.join(ROOT, "scripts", "audit.py")
OUT_PATH = os.path.join(ROOT, "docs", "audit.html")


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


def emit_dashboard(audit_result, error, commit_sha):
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

    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="AIHPC Advanced — application audit dashboard. Live status board for {total} functional checks across the platform." />
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

      <div class="checks">
        <h2>Checks ({len(checks)})</h2>
        {checks_html}
      </div>

      <div class="footer">
        <p>&copy; 2026 AIHPC Advanced. &middot; Generated by <code>scripts/gen-audit-dashboard.py</code>. The underlying audit is in <code>scripts/audit.py</code> (17 checks). The CI workflow is at <code>.github/workflows/mirror-to-public.yml</code>. Comments to <a href="mailto:testdemoqwenai2025@gmail.com">testdemoqwenai2025@gmail.com</a>.</p>
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

    html = emit_dashboard(audit_result, error, commit_sha)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  written to: {OUT_PATH} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()

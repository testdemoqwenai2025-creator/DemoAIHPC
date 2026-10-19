/**
 * AIHPC Advanced — subscription gate (shared client-side library).
 *
 * Phase 24: makes the tier-gating directive actually functional.
 *
 * Reads the session stored by /docs/subscribe.html under the
 * localStorage key `aihpc-session`. The session is JSON-encoded:
 *   { email: string, tier: 'free'|'pro'|'team', since: ISO,
 *     upgradedAt?: ISO }
 *
 * Tier hierarchy:
 *   free (0)  < pro (1)  < team (2)
 *
 * Capabilities:
 *   Free: CSV/FASTA/GenBank downloads; receipts blocked.
 *   Pro:  + provenance receipt (no trace).
 *   Team: + receipt with full audit trace.
 *
 * Public API:
 *   AIHPC.getTier()                  → 'free'|'pro'|'team'
 *   AIHPC.getSession()               → session object or null
 *   AIHPC.getTierRank(tier?)         → 0|1|2
 *   AIHPC.requireTier(minTier, opts) → boolean  (and shows banner if not met)
 *   AIHPC.mountTierBadge(el)         → renders a tier pill in `el`
 *   AIHPC.onChange(cb)               → fires on cross-tab session changes
 *   AIHPC.dismissBanner()           → hides the current banner (if any)
 *
 * The banner is auto-injected as a fixed-position element at the
 * bottom-right of the viewport. It contains a one-line message, a
 * link to /subscribe.html (relative-resolved), and a dismiss ×.
 *
 * Author: AIHPC Build <testdemoqwenai2025@gmail.com>
 */
(function (global) {
  'use strict';

  var SESSION_KEY = 'aihpc-session';
  var TIER_RANK = { free: 0, pro: 1, team: 2 };
  var TIER_LABEL = { free: 'Free', pro: 'Pro', team: 'Team' };
  var TIER_COLOR = {
    free: { bg: 'rgba(148,163,184,0.2)', fg: '#9ca3af' },
    pro:  { bg: 'rgba(139,92,246,0.25)', fg: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)' },
    team: { bg: 'rgba(6,182,212,0.25)',  fg: '#67e8f9', border: '1px solid rgba(6,182,212,0.4)' },
  };

  // ---- Session accessors ----
  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.tier) return null;
      if (TIER_RANK[s.tier] == null) return null; // unknown tier → no session
      return s;
    } catch (e) { return null; }
  }
  function getTier() {
    var s = getSession();
    return s ? s.tier : 'free';
  }
  function getTierRank(tier) {
    tier = tier || getTier();
    return TIER_RANK[tier] != null ? TIER_RANK[tier] : 0;
  }

  // ---- Banner (auto-injected, dismissible) ----
  var BANNER_ID = 'aihpc-gate-banner';
  function ensureBannerContainer() {
    var el = document.getElementById(BANNER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = BANNER_ID;
    el.style.cssText = [
      'position:fixed', 'right:24px', 'bottom:24px',
      'max-width:380px', 'z-index:10000',
      'background:#0b0f1a', 'color:#f3f4f6',
      'border:1px solid #2a3548',
      'border-left:4px solid #f59e0b',
      'border-radius:12px',
      'padding:14px 16px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(245,158,11,0.15)',
      'backdrop-filter:blur(12px)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'font-size:13px', 'line-height:1.5',
      'display:none',
      'animation:aihpcBannerIn 0.3s ease',
    ].join(';');
    document.body.appendChild(el);
    // Inject keyframes once
    if (!document.getElementById('aihpc-gate-style')) {
      var style = document.createElement('style');
      style.id = 'aihpc-gate-style';
      style.textContent = [
        '@keyframes aihpcBannerIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }',
        '#' + BANNER_ID + ' a.upgrade-btn { background:linear-gradient(90deg,#8b5cf6,#06b6d4); color:white; padding:6px 14px; border-radius:9999px; text-decoration:none; font-weight:600; font-size:12px; display:inline-flex; align-items:center; gap:4px; }',
        '#' + BANNER_ID + ' a.upgrade-btn:hover { filter:brightness(1.1); }',
        '#' + BANNER_ID + ' .dismiss { position:absolute; top:8px; right:10px; cursor:pointer; color:#9ca3af; font-size:14px; line-height:1; background:transparent; border:none; padding:4px; }',
        '#' + BANNER_ID + ' .dismiss:hover { color:#f3f4f6; }',
        '#' + BANNER_ID + ' .gate-icon { font-size:18px; margin-right:6px; vertical-align:middle; }',
        '#' + BANNER_ID + ' .gate-msg { font-weight:600; color:#fbbf24; margin-bottom:6px; }',
        '#' + BANNER_ID + ' .gate-detail { color:#9ca3af; font-size:11px; margin-bottom:10px; line-height:1.5; }',
        'body.light #' + BANNER_ID + ' { background:white; color:#18181b; border-color:#e5e7eb; box-shadow:0 8px 24px rgba(0,0,0,0.15); }',
        'body.light #' + BANNER_ID + ' .gate-detail, body.light #' + BANNER_ID + ' .dismiss { color:#6b7280; }',
      ].join('\n');
      document.head.appendChild(style);
    }
    return el;
  }

  function showBanner(opts) {
    opts = opts || {};
    var el = ensureBannerContainer();
    var subscribeUrl = opts.subscribeUrl || (resolveBasePath() + 'subscribe.html');
    var message = opts.message || '🔒 Pro tier required';
    var detail = opts.detail || 'This feature is gated to Pro and Team tiers. Sign in at /subscribe.html and upgrade to unlock.';
    el.innerHTML = ''
      + '<button class="dismiss" title="Dismiss" aria-label="Dismiss">×</button>'
      + '<div><span class="gate-icon">' + (opts.icon || '🔒') + '</span>'
      + '<span class="gate-msg">' + escapeHtml(message) + '</span></div>'
      + '<div class="gate-detail">' + escapeHtml(detail) + '</div>'
      + '<a href="' + subscribeUrl + '" target="_blank" rel="noopener" class="upgrade-btn">→ Upgrade at /subscribe</a>';
    el.style.display = 'block';
    // Wire dismiss
    var d = el.querySelector('.dismiss');
    if (d) d.onclick = function () { el.style.display = 'none'; };
    // Auto-hide after 12s if not interacted with
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () { el.style.display = 'none'; }, 12000);
  }
  function dismissBanner() {
    var el = document.getElementById(BANNER_ID);
    if (el) el.style.display = 'none';
  }

  // ---- Tier check ----
  function requireTier(minTier, opts) {
    opts = opts || {};
    var current = getTier();
    var currentRank = getTierRank(current);
    var minRank = getTierRank(minTier);
    if (currentRank >= minRank) return true;
    // Tier not met — show banner
    var minLabel = TIER_LABEL[minTier] || minTier;
    var session = getSession();
    var detail;
    if (!session) {
      detail = 'You are not signed in. Sign in at /subscribe.html (localStorage session, no external service) and switch to ' + minLabel + ' to unlock: ' + (opts.feature || 'this feature') + '.';
    } else {
      detail = 'You are on the ' + TIER_LABEL[current] + ' tier. Switch to ' + minLabel + ' at /subscribe.html to unlock: ' + (opts.feature || 'this feature') + '.';
    }
    showBanner({
      message: '🔒 ' + (opts.feature || 'This feature') + ' requires ' + minLabel,
      detail: detail,
      feature: opts.feature,
    });
    return false;
  }

  // ---- Tier badge widget (mountable anywhere) ----
  function mountTierBadge(containerEl, opts) {
    opts = opts || {};
    if (!containerEl) return;
    containerEl.innerHTML = '';
    var pill = document.createElement('a');
    pill.href = (opts.subscribeUrl || (resolveBasePath() + 'subscribe.html'));
    pill.target = '_blank';
    pill.rel = 'noopener';
    var tier = getTier();
    var session = getSession();
    var label = session ? (TIER_LABEL[tier] || tier) : 'Sign in';
    pill.textContent = '◆ ' + label;
    var colors = TIER_COLOR[tier] || TIER_COLOR.free;
    pill.style.cssText = [
      'display:inline-flex', 'align-items:center', 'gap:4px',
      'padding:4px 12px', 'border-radius:9999px',
      'font-size:11px', 'font-weight:700', 'text-transform:uppercase',
      'letter-spacing:0.04em', 'text-decoration:none',
      'background:' + colors.bg, 'color:' + colors.fg,
      colors.border ? ('border:' + colors.border) : 'border:1px solid transparent',
      'cursor:pointer',
      'transition:filter 0.2s ease',
    ].join(';');
    pill.title = session
      ? ('Signed in as ' + session.email + ' · ' + TIER_LABEL[tier] + ' tier · click to manage at /subscribe.html')
      : 'Not signed in · click to sign in at /subscribe.html';
    pill.onmouseenter = function () { pill.style.filter = 'brightness(1.15)'; };
    pill.onmouseleave = function () { pill.style.filter = 'none'; };
    containerEl.appendChild(pill);
    return pill;
  }

  // ---- Cross-tab session updates ----
  var listeners = [];
  function onChange(cb) {
    if (typeof cb === 'function') listeners.push(cb);
  }
  function fireChange() {
    var tier = getTier();
    listeners.forEach(function (cb) { try { cb(tier); } catch (e) {} });
    // Also re-render any tier badges
    document.querySelectorAll('[data-aihpc-tier-badge]').forEach(function (el) {
      mountTierBadge(el);
    });
  }
  if (global.addEventListener) {
    global.addEventListener('storage', function (e) {
      if (e.key === SESSION_KEY) fireChange();
    });
  }

  // ---- Helpers ----
  function resolveBasePath() {
    // ../ from /concepts/* or /demos/* → root; / from root pages
    var p = location.pathname;
    // Strip filename
    var dir = p.substring(0, p.lastIndexOf('/') + 1);
    // If under /concepts/ or /demos/ or /science/.../, go up one level
    if (/\/(concepts|demos|science)\/[^/]+\//.test(dir) || /\/concepts\/$/.test(dir) || /\/demos\/$/.test(dir)) {
      // We're one level deep — go up one
      dir = dir.replace(/[^/]+\/$/, '');
    } else if (/\/science\/[^/]+\/[^/]+\//.test(dir)) {
      // We're two levels deep (e.g. /science/biology/molecular.html)
      dir = dir.replace(/[^/]+\/$/, '').replace(/[^/]+\/$/, '').replace(/[^/]+\/$/, '');
    }
    return dir;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- Public API ----
  global.AIHPC = global.AIHPC || {};
  Object.assign(global.AIHPC, {
    SESSION_KEY: SESSION_KEY,
    TIER_RANK: TIER_RANK,
    TIER_LABEL: TIER_LABEL,
    getSession: getSession,
    getTier: getTier,
    getTierRank: getTierRank,
    requireTier: requireTier,
    mountTierBadge: mountTierBadge,
    showBanner: showBanner,
    dismissBanner: dismissBanner,
    onChange: onChange,
    _resolveBasePath: resolveBasePath,
  });
})(typeof window !== 'undefined' ? window : this);

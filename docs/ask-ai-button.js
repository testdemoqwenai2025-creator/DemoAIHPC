/**
 * ask-ai-button.js — Phase 56
 *
 * Injects an "🤖 Ask AI about this concept" button on every concept card
 * page. When clicked, it navigates to ai-lab.html with the card's title +
 * description as URL-encoded context. The AI Lab pre-loads this as the
 * first system message so the user can immediately ask follow-up questions.
 *
 * Auto-runs on DOMContentLoaded. Safe to include on any page — it only
 * injects the button if the page has a <title> and <meta name="description">.
 */
(function () {
  'use strict';
  function init() {
    // Only inject on pages under docs/concepts/ (the concept cards)
    var path = window.location.pathname;
    if (path.indexOf('/concepts/') < 0 && path.indexOf('/demos/') < 0) return;

    // Extract page metadata
    var title = document.title || '';
    var desc = '';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) desc = metaDesc.getAttribute('content') || '';

    // Also grab the first paragraph of body text for richer context
    var firstP = document.querySelector('p');
    if (firstP && firstP.textContent.trim().length > 20) {
      desc += (desc ? ' ' : '') + firstP.textContent.trim().slice(0, 500);
    }

    if (!title) return;

    // Build the context string
    var context = 'You are viewing the concept card: "' + title + '". ' + desc;

    // Build the AI Lab URL with context param
    var aiLabUrl = '../ai-lab.html?context=' + encodeURIComponent(context);

    // Inject the button — place it right after the first <h1> or at the top of the body
    var target = document.querySelector('h1') || document.querySelector('.container') || document.body;
    if (!target) return;

    var btn = document.createElement('a');
    btn.href = aiLabUrl;
    btn.innerHTML = '🤖 Ask AI about this concept';
    btn.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; margin-left: 12px; padding: 6px 14px; border-radius: 9999px; background: linear-gradient(90deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15)); border: 1px solid rgba(139,92,246,0.4); color: #c4b5fd; text-decoration: none; font-size: 12px; font-weight: 600; vertical-align: middle; transition: all 0.2s;';
    btn.title = 'Open the AI Lab with this card as context — ask follow-up questions about the concept';
    btn.addEventListener('mouseenter', function () { btn.style.borderColor = '#8b5cf6'; btn.style.transform = 'translateY(-1px)'; });
    btn.addEventListener('mouseleave', function () { btn.style.borderColor = 'rgba(139,92,246,0.4)'; btn.style.transform = ''; });

    // Insert after the target element
    if (target.parentNode) {
      target.parentNode.insertBefore(btn, target.nextSibling);
    } else {
      target.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

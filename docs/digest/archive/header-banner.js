/**
 * header-banner.js — Auto-injects a v2-concept-card-style visual header
 * on every page. Reads the page's <title> and <meta description>, creates
 * a gradient banner with an animated particle canvas that's contextual
 * to the page's topic (DNA, quantum, neural network, waves, etc.).
 *
 * Loaded via <script src="header-banner.js"></script> on all pages.
 * Uses lazy evaluation — only runs when DOM is ready.
 */
(function () {
  function init() {
    var h1 = document.querySelector('h1');
    if (!h1 || h1._bannerEnhanced) return;
    h1._bannerEnhanced = true;

    // Get page metadata
    var title = h1.textContent.trim();
    var desc = '';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) desc = metaDesc.getAttribute('content') || '';
    if (!desc) {
      var firstP = document.querySelector('.lead, p');
      if (firstP) desc = firstP.textContent.trim().slice(0, 200);
    }

    // Detect page topic for contextual coloring
    var topic = 'default';
    var topicColors = {
      'quantum': ['#8b5cf6', '#06b6d4', '#ec4899'],
      'dna': ['#10b981', '#06b6d4', '#8b5cf6'],
      'neural': ['#06b6d4', '#8b5cf6', '#ec4899'],
      'physics': ['#06b6d4', '#8b5cf6', '#f59e0b'],
      'chemistry': ['#f59e0b', '#06b6d4', '#10b981'],
      'biology': ['#10b981', '#06b6d4', '#8b5cf6'],
      'math': ['#8b5cf6', '#06b6d4', '#f59e0b'],
      'ml': ['#06b6d4', '#8b5cf6', '#ec4899'],
      'default': ['#06b6d4', '#8b5cf6', '#ec4899'],
    };

    var titleLower = (title + ' ' + desc).toLowerCase();
    if (titleLower.indexOf('quantum') >= 0 || titleLower.indexOf('bloch') >= 0) topic = 'quantum';
    else if (titleLower.indexOf('dna') >= 0 || titleLower.indexOf('bolero') >= 0 || titleLower.indexOf('gene') >= 0) topic = 'dna';
    else if (titleLower.indexOf('neural') >= 0 || titleLower.indexOf('transformer') >= 0 || titleLower.indexOf('attention') >= 0) topic = 'neural';
    else if (titleLower.indexOf('physics') >= 0 || titleLower.indexOf('wave') >= 0 || titleLower.indexOf('mechanic') >= 0) topic = 'physics';
    else if (titleLower.indexOf('chem') >= 0 || titleLower.indexOf('molecular') >= 0) topic = 'chemistry';
    else if (titleLower.indexOf('bio') >= 0 || titleLower.indexOf('cell') >= 0) topic = 'biology';
    else if (titleLower.indexOf('math') >= 0 || titleLower.indexOf('algebra') >= 0 || titleLower.indexOf('calculus') >= 0) topic = 'math';
    else if (titleLower.indexOf('machine') >= 0 || titleLower.indexOf('learning') >= 0 || titleLower.indexOf('loss') >= 0) topic = 'ml';

    var colors = topicColors[topic] || topicColors['default'];

    // Create the banner wrapper
    var banner = document.createElement('div');
    banner.style.cssText = [
      'position: relative',
      'overflow: hidden',
      'border-radius: 12px',
      'padding: 24px 28px',
      'margin-bottom: 20px',
      'background: linear-gradient(135deg, ' + colors[0] + '15, ' + colors[1] + '10, ' + colors[2] + '08)',
      'border: 1px solid ' + colors[0] + '30',
      'backdrop-filter: blur(8px)',
    ].join('; ');

    // Add a small particle canvas inside the banner
    var canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 60;
    canvas.style.cssText = 'position: absolute; top: 10px; right: 16px; opacity: 0.5; z-index: 0; pointer-events: none;';
    banner.appendChild(canvas);

    // Move the h1 into the banner
    var h1Parent = h1.parentNode;
    h1.parentNode.insertBefore(banner, h1);
    banner.appendChild(h1);
    h1.style.cssText = 'position: relative; z-index: 1; font-size: 32px; margin: 0 0 8px; background: linear-gradient(90deg, #fff, ' + colors[0] + ' 60%, ' + colors[1] + '); -webkit-background-clip: text; background-clip: text; color: transparent;';

    // Add description subtitle
    if (desc) {
      var subtitle = document.createElement('p');
      subtitle.textContent = desc;
      subtitle.style.cssText = 'position: relative; z-index: 1; font-size: 13px; color: #9ca3af; margin: 4px 0 0; max-width: 700px; line-height: 1.5;';
      banner.appendChild(subtitle);
    }

    // Add a topic tag
    var tag = document.createElement('span');
    tag.textContent = topic.toUpperCase();
    tag.style.cssText = 'position: relative; z-index: 1; display: inline-block; padding: 3px 10px; border-radius: 9999px; background: ' + colors[0] + '20; border: 1px solid ' + colors[0] + '40; color: ' + colors[0] + '; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;';
    banner.insertBefore(tag, h1);

    // Animate the particle canvas
    var ctx = canvas.getContext('2d');
    var particles = [];
    for (var i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        c: colors[i % 3],
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw connections
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (d < 50) {
            ctx.strokeStyle = 'rgba(139,92,246,' + (0.15 * (1 - d / 50)) + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw + update particles
      for (var p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

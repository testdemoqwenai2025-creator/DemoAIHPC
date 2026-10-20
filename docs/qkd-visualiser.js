/**
 * qkd-visualiser.js — Phase 50 BB84 quantum key distribution visualiser.
 *
 * Animates the BB84 protocol: Alice sends polarised photons → Bob
 * measures → public comparison → eavesdropper detection. Extends the
 * teleportation visualiser into quantum cryptography.
 *
 * Scenes: Alice sends → Bob measures → public comparison →
 * eavesdropper detection → key extraction
 *
 * Public API (window.AIHPC_QKD):
 *   mount(containerId, opts)   play(id) / pause(id)
 */
(function (global) {
  'use strict';

  var SCENES = [
    { title: '1. Alice sends polarised photons', desc: 'Alice sends photons polarised in 1 of 4 bases: ↕ (0°), ↗↘ (45°), ↔ (90°), ↖↗ (135°). Each photon encodes 1 bit (0 or 1).', color: '#06b6d4', stage: 0 },
    { title: '2. Bob measures in random bases', desc: 'Bob measures each photon in a random basis (rectilinear ↕↔ or diagonal ↗↖). ~50% chance of matching Alice\'s basis.', color: '#8b5cf6', stage: 1 },
    { title: '3. Public basis comparison', desc: 'Alice + Bob publicly announce their bases (not the bits!). They keep only the bits where bases matched (~50%). These form the raw key.', color: '#f59e0b', stage: 2 },
    { title: '4. Eavesdropper detection', desc: 'If Eve intercepted, her random bases would disturb ~25% of the matched bits. Alice + Bob compare a random subset — if error rate > threshold, Eve is detected!', color: '#ef4444', stage: 3 },
    { title: '5. Key extraction + privacy amplification', desc: 'After eavesdropper check, Alice + Bob apply privacy amplification (hashing) to extract a shorter but perfectly secure key. The final key is unbreakable — guaranteed by quantum mechanics.', color: '#10b981', stage: 4 },
  ];

  function QKDVisualiser(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.currentScene = 0;
    this.playing = false;
    this.rafId = null;
    this.lastSceneTime = 0;
    this.t = 0;
    // Generate random Alice/Bob bases + bits for the demo
    this.nPhotons = 8;
    this.aliceBases = []; this.aliceBits = [];
    this.bobBases = []; this.bobBits = [];
    this.evePresent = false;
    this.build();
    this.generateData();
    this.render();
  }

  QKDVisualiser.prototype.build = function () {
    var self = this;
    var c = this.container;
    c.innerHTML = '';
    var card = document.createElement('div');
    card.style.cssText = 'background: rgba(11,15,26,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 16px; backdrop-filter: blur(12px);';
    var header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;';
    header.innerHTML = '<div><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">🔐 BB84 QKD</span><span style="font-size: 13px; color: #f3f4f6; margin-left: 8px;">— Phase 50</span></div>'
      + '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
      + '<button class="qkd-play" style="background: linear-gradient(90deg,#06b6d4,#8b5cf6); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">▶ Play</button>'
      + '<button class="qkd-eve" style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">Toggle Eve</button>'
      + '<button class="qkd-next" style="background: #1a2133; border: 1px solid #2a3548; color: #f3f4f6; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">Next ▶</button>'
      + '</div>';
    card.appendChild(header);

    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'aspect-ratio: 16/9; background: #0a0e1a; border: 1px solid var(--border, #1f2937); border-radius: 8px; overflow: hidden;';
    var canvas = document.createElement('canvas');
    canvas.width = 540; canvas.height = 304;
    canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    canvasWrap.appendChild(canvas);
    card.appendChild(canvasWrap);

    var status = document.createElement('div');
    status.className = 'qkd-status';
    status.style.cssText = 'font-size: 12px; color: #9ca3af; margin-top: 12px; font-family: ui-monospace;';
    card.appendChild(status);

    c.appendChild(card);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.statusEl = status;

    header.querySelector('.qkd-play').addEventListener('click', function () { self.play(); });
    header.querySelector('.qkd-eve').addEventListener('click', function () { self.evePresent = !self.evePresent; self.generateData(); self.render(); });
    header.querySelector('.qkd-next').addEventListener('click', function () { self.nextScene(); });
  };

  QKDVisualiser.prototype.generateData = function () {
    this.aliceBases = []; this.aliceBits = [];
    this.bobBases = []; this.bobBits = [];
    for (var i = 0; i < this.nPhotons; i++) {
      this.aliceBases.push(Math.random() < 0.5 ? 'R' : 'D'); // R=rectilinear, D=diagonal
      this.aliceBits.push(Math.random() < 0.5 ? 0 : 1);
      this.bobBases.push(Math.random() < 0.5 ? 'R' : 'D');
      // Bob's bit depends on whether his basis matches Alice's
      if (this.bobBases[i] === this.aliceBases[i]) {
        this.bobBits.push(this.aliceBits[i]); // matching → correct
        if (this.evePresent && Math.random() < 0.25) {
          this.bobBits[i] = 1 - this.bobBits[i]; // Eve introduces 25% error
        }
      } else {
        this.bobBits.push(Math.random() < 0.5 ? 0 : 1); // non-matching → random
      }
    }
  };

  QKDVisualiser.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.lastSceneTime = performance.now();
    var self = this;
    function loop() {
      if (!self.playing) return;
      var now = performance.now();
      self.t = (now - self.lastSceneTime) / 1000;
      if (self.t > 5) { self.nextScene(); self.lastSceneTime = now; }
      self.render();
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };
  QKDVisualiser.prototype.pause = function () { this.playing = false; if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null; };
  QKDVisualiser.prototype.nextScene = function () { this.currentScene = (this.currentScene + 1) % SCENES.length; this.t = 0; this.render(); };

  QKDVisualiser.prototype.render = function () {
    var ctx = this.ctx, W = 540, H = 304;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
    var scene = SCENES[this.currentScene];
    var n = this.nPhotons;
    var photonW = (W - 80) / n;
    var startX = 40;
    var aliceY = 60, bobY = 200, eveY = 130;

    // Title
    ctx.fillStyle = scene.color; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'left';
    ctx.fillText(scene.title, 10, 16);

    // Alice + Bob labels
    ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'left';
    ctx.fillText('Alice →', 8, aliceY - 8);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('Bob →', 8, bobY + 16);

    // Draw photon table
    for (var i = 0; i < n; i++) {
      var x = startX + i * photonW + photonW / 2;
      // Alice's photon
      var aBase = this.aliceBases[i]; var aBit = this.aliceBits[i];
      var aColor = aBase === 'R' ? '#06b6d4' : '#8b5cf6';
      ctx.fillStyle = aColor;
      ctx.beginPath(); ctx.arc(x, aliceY, 8, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px ui-monospace'; ctx.textAlign = 'center';
      ctx.fillText(aBit, x, aliceY + 3);
      // Basis symbol
      ctx.fillStyle = aColor; ctx.font = '8px ui-monospace';
      ctx.fillText(aBase === 'R' ? '↕↔' : '↗↖', x, aliceY - 16);

      // Photon path (Alice → Bob)
      if (scene.stage >= 0) {
        ctx.strokeStyle = this.evePresent ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.2)';
        ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(x, aliceY + 10); ctx.lineTo(x, bobY - 10); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Eve (if present)
      if (this.evePresent && scene.stage >= 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(x, eveY, 5, 0, 2 * Math.PI); ctx.fill();
      }

      // Bob's measurement
      if (scene.stage >= 1) {
        var bBase = this.bobBases[i]; var bBit = this.bobBits[i];
        var bColor = bBase === 'R' ? '#06b6d4' : '#8b5cf6';
        var matchColor = (scene.stage >= 2 && bBase === aBase) ? '#10b981' : bColor;
        ctx.fillStyle = matchColor;
        ctx.beginPath(); ctx.arc(x, bobY, 8, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px ui-monospace';
        ctx.fillText(bBit, x, bobY + 3);
        ctx.fillStyle = matchColor; ctx.font = '8px ui-monospace';
        ctx.fillText(bBase === 'R' ? '↕↔' : '↗↖', x, bobY + 22);
      }

      // Match indicator (stage 2+)
      if (scene.stage >= 2 && this.bobBases[i] === this.aliceBases[i]) {
        ctx.fillStyle = '#10b981'; ctx.font = 'bold 8px ui-monospace';
        ctx.fillText('✓', x, (aliceY + bobY) / 2);
      }
    }

    // Eve label
    if (this.evePresent) {
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'left';
      ctx.fillText('Eve 🕵', 8, eveY + 4);
    }

    // Error rate (stage 3+)
    if (scene.stage >= 3) {
      var errors = 0, matched = 0;
      for (var j = 0; j < n; j++) {
        if (this.bobBases[j] === this.aliceBases[j]) {
          matched++;
          if (this.bobBits[j] !== this.aliceBits[j]) errors++;
        }
      }
      var errorRate = matched > 0 ? (errors / matched * 100).toFixed(1) : '0';
      ctx.fillStyle = errors > 0 ? '#ef4444' : '#10b981';
      ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'right';
      ctx.fillText('Error rate: ' + errorRate + '% ' + (errors > 0 ? '⚠ EVE DETECTED!' : '✓ Secure'), W - 10, H - 10);
    }

    // Key extraction (stage 4)
    if (scene.stage >= 4) {
      var keyBits = [];
      for (var k = 0; k < n; k++) {
        if (this.bobBases[k] === this.aliceBases[k]) keyBits.push(this.aliceBits[k]);
      }
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 10px ui-monospace'; ctx.textAlign = 'left';
      ctx.fillText('Final key: ' + keyBits.join(''), 10, H - 10);
    }

    ctx.textAlign = 'left';

    // Status
    if (this.statusEl) {
      this.statusEl.innerHTML = '<span style="color:' + scene.color + '; font-weight: 700;">' + scene.title + '</span> &nbsp; ' + scene.desc + (this.evePresent ? ' &nbsp; <span style="color:#ef4444;">Eve is present!</span>' : '');
    }
  };

  var INSTANCES = {};
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    if (INSTANCES[containerId]) return INSTANCES[containerId];
    var c = new QKDVisualiser(el, opts);
    INSTANCES[containerId] = c;
    return c;
  }
  global.AIHPC_QKD = { mount: mount, play: function(id){var c=INSTANCES[id];if(c)c.play();}, pause: function(id){var c=INSTANCES[id];if(c)c.pause();}, next: function(id){var c=INSTANCES[id];if(c)c.nextScene();}, _instances: INSTANCES, _scenes: SCENES };
})(typeof window !== 'undefined' ? window : this);

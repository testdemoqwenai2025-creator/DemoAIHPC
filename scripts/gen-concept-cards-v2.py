#!/usr/bin/env python3
"""Phase 60: Generate visual-first concept cards (v2) for all ML demos.

Each card replaces the old text-heavy 500+ word format with a visual-first
design: animated canvas as the hero, minimal text, real-time sliders,
gradient descent animation, and code with Math→Code annotations showing
how symbols map to variables.

Card families (each has a custom canvas visualization):
  1. Loss functions (MSE, MAE, Huber, Log-Cosh, KL, Cosine)
     → scatter plot + fitted line + error lines + loss value + GD animation
  2. Activations (ReLU, GELU, SwiGLU)
     → function curve + gradient curve + real-time input slider
  3. Optimisers (SGD, Adam, AdamW)
     → 2D loss landscape + trajectory animation (3 optimisers side-by-side)

The generator produces one .html file per card under docs/concepts-v2/.
"""
import html as html_mod
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO, "docs", "concepts-v2")

# ──────────────────────────────────────────────────────────────────────
# CARD DEFINITIONS
# Each card has: id, title, tag, desc, eq, code, canvas_type, canvas_config
# ──────────────────────────────────────────────────────────────────────

CARDS = [
    # ── LOSS FUNCTIONS ──
    {
        "id": "ml-mse",
        "title": "Mean Squared Error",
        "tag": "ML · Regression Loss",
        "desc": "The default regression loss — penalises large errors <b>quadratically</b>. A 2× error gives 4× the loss.",
        "eq": "L = (1/n) Σ (yᵢ − ŷᵢ)²",
        "code": '''<span class="cm"># L = (1/n) Σ (y_i − ŷ_i)²</span>
<span class="cm"># y_i → y_true[i]  ŷ_i → y_pred[i]  n → len(y_true)</span>
<span class="cm"># Σ → .sum()  ² → ** 2  (1/n) → np.mean()</span>
<span class="kw">import</span> numpy <span class="kw">as</span> np

<span class="kw">def</span> <span class="fn">mse</span>(y_true, y_pred):
    <span class="kw">return</span> np.mean((y_true - y_pred) ** <span class="num">2</span>)

<span class="kw">def</span> <span class="fn">mse_grad</span>(y_true, y_pred):
    <span class="cm"># ∂L/∂ŷ = 2(ŷ - y) / n</span>
    <span class="kw">return</span> <span class="num">2</span> * (y_pred - y_true) / len(y_true)''',
        "canvas_type": "loss",
        "canvas_config": {"loss_fn": "mse", "loss_label": "MSE"},
    },
    {
        "id": "ml-mae",
        "title": "Mean Absolute Error",
        "tag": "ML · Regression Loss",
        "desc": "Linear in error magnitude — <b>robust to outliers</b>. Unlike MSE, a 2× error gives 2× the loss (not 4×).",
        "eq": "L = (1/n) Σ |yᵢ − ŷᵢ|",
        "code": '''<span class="cm"># L = (1/n) Σ |y_i − ŷ_i|</span>
<span class="cm"># |·| → np.abs()  Σ → .sum()  (1/n) → np.mean()</span>
<span class="kw">import</span> numpy <span class="kw">as</span> np

<span class="kw">def</span> <span class="fn">mae</span>(y_true, y_pred):
    <span class="kw">return</span> np.mean(np.abs(y_true - y_pred))

<span class="kw">def</span> <span class="fn">mae_grad</span>(y_true, y_pred):
    <span class="cm"># ∂L/∂ŷ = sign(ŷ - y) / n</span>
    <span class="kw">return</span> np.sign(y_pred - y_true) / len(y_true)''',
        "canvas_type": "loss",
        "canvas_config": {"loss_fn": "mae", "loss_label": "MAE"},
    },
    {
        "id": "ml-huber-loss",
        "title": "Huber Loss",
        "tag": "ML · Regression Loss",
        "desc": "Quadratic for small errors, linear beyond δ. <b>Combines MSE's smoothness with MAE's robustness</b>.",
        "eq": "L = { ½e² if |e| ≤ δ,  δ(|e| − ½δ) otherwise }",
        "code": '''<span class="cm"># L = ½e² if |e| ≤ δ, else δ(|e| − ½δ)</span>
<span class="cm"># δ → delta (threshold, typically 1.0)</span>
<span class="kw">import</span> numpy <span class="kw">as</span> np

<span class="kw">def</span> <span class="fn">huber</span>(y_true, y_pred, delta=<span class="num">1.0</span>):
    e = np.abs(y_true - y_pred)
    <span class="kw">return</span> np.mean(np.where(e <= delta,
                           <span class="num">0.5</span> * e ** <span class="num">2</span>,
                           delta * (e - <span class="num">0.5</span> * delta)))''',
        "canvas_type": "loss",
        "canvas_config": {"loss_fn": "huber", "loss_label": "Huber", "delta": 1.0},
    },
    {
        "id": "ml-log-cosh",
        "title": "Log-Cosh Loss",
        "tag": "ML · Regression Loss",
        "desc": "log(cosh(e)) — smooth + differentiable everywhere. <b>Like MSE near 0, like MAE far away</b>.",
        "eq": "L = (1/n) Σ log(cosh(ŷᵢ − yᵢ))",
        "code": '''<span class="cm"># L = (1/n) Σ log(cosh(ŷ_i − y_i))</span>
<span class="cm"># log(cosh(e)) ≈ e²/2 for small e, ≈ |e| − log(2) for large e</span>
<span class="kw">import</span> numpy <span class="kw">as</span> np

<span class="kw">def</span> <span class="fn">log_cosh</span>(y_true, y_pred):
    e = y_pred - y_true
    <span class="kw">return</span> np.mean(np.log(np.cosh(e)))''',
        "canvas_type": "loss",
        "canvas_config": {"loss_fn": "logcosh", "loss_label": "Log-Cosh"},
    },
    # ── ACTIVATIONS ──
    {
        "id": "ml-relu",
        "title": "ReLU Activation",
        "tag": "ML · Activation",
        "desc": "max(0, x) — the workhorse activation. <b>Simple, fast, but can die</b> (gradient = 0 for x < 0).",
        "eq": "f(x) = max(0, x)   f'(x) = { 1 if x > 0, 0 otherwise }",
        "code": '''<span class="cm"># f(x) = max(0, x)   f'(x) = 1 if x > 0 else 0</span>
<span class="kw">import</span> numpy <span class="kw">as</span> np

<span class="kw">def</span> <span class="fn">relu</span>(x):
    <span class="kw">return</span> np.maximum(<span class="num">0</span>, x)

<span class="kw">def</span> <span class="fn">relu_grad</span>(x):
    <span class="kw">return</span> (x > <span class="num">0</span>).astype(float)''',
        "canvas_type": "activation",
        "canvas_config": {"fn": "relu"},
    },
    {
        "id": "ml-gelu",
        "title": "GELU Activation",
        "tag": "ML · Activation",
        "desc": "x · Φ(x) — smoother than ReLU. <b>Used in GPT, BERT, and most transformers</b>. Non-zero gradient for x < 0.",
        "eq": "f(x) = x · Φ(x) ≈ 0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))",
        "code": '''<span class="cm"># f(x) = x · Φ(x)  where Φ = standard normal CDF</span>
<span class="cm"># ≈ 0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))</span>
<span class="kw">import</span> numpy <span class="kw">as</span> np

<span class="kw">def</span> <span class="fn">gelu</span>(x):
    <span class="kw">return</span> <span class="num">0.5</span> * x * (<span class="num">1</span> + np.tanh(
        np.sqrt(<span class="num">2</span>/np.pi) * (x + <span class="num">0.044715</span> * x**<span class="num">3</span>)
    ))''',
        "canvas_type": "activation",
        "canvas_config": {"fn": "gelu"},
    },
    # ── OPTIMISERS ──
    {
        "id": "ml-sgd",
        "title": "SGD Optimiser",
        "tag": "ML · Optimiser",
        "desc": "θ ← θ − η · ∇L — vanilla gradient descent. <b>Simple but oscillates in ravines</b>.",
        "eq": "θₜ₊₁ = θₜ − η · ∂L/∂θ",
        "code": '''<span class="cm"># θ_{t+1} = θ_t − η · ∂L/∂θ</span>
<span class="cm"># θ → params  η → lr (learning rate)</span>
<span class="kw">def</span> <span class="fn">sgd_step</span>(params, grads, lr=<span class="num">0.01</span>):
    <span class="kw">for</span> i <span class="kw">in range</span>(len(params)):
        params[i] -= lr * grads[i]
    <span class="kw">return</span> params''',
        "canvas_type": "optimiser",
        "canvas_config": {"optimiser": "sgd"},
    },
    {
        "id": "ml-adam",
        "title": "Adam Optimiser",
        "tag": "ML · Optimiser",
        "desc": "Adaptive Moment Estimation — per-parameter learning rates via running mean + variance of gradients. <b>Converges faster than SGD</b>.",
        "eq": "mₜ = β₁mₜ₋₁ + (1−β₁)gₜ   vₜ = β₂vₜ₋₁ + (1−β₂)gₜ²   θ ← θ − η·m̂/(√v̂+ε)",
        "code": '''<span class="cm"># m_t = β₁m_{t-1} + (1−β₁)g_t    (1st moment)</span>
<span class="cm"># v_t = β₂v_{t-1} + (1−β₂)g_t²   (2nd moment)</span>
<span class="cm"># θ ← θ − η · m̂/(√v̂ + ε)        (bias-corrected)</span>
<span class="kw">def</span> <span class="fn">adam_step</span>(params, grads, m, v, t,
               lr=<span class="num">0.001</span>, b1=<span class="num">0.9</span>, b2=<span class="num">0.999</span>, eps=<span class="num">1e-8</span>):
    <span class="kw">for</span> i <span class="kw">in range</span>(len(params)):
        m[i] = b1*m[i] + (<span class="num">1</span>-b1)*grads[i]
        v[i] = b2*v[i] + (<span class="num">1</span>-b2)*grads[i]**<span class="num">2</span>
        m_hat = m[i] / (<span class="num">1</span> - b1**t)
        v_hat = v[i] / (<span class="num">1</span> - b2**t)
        params[i] -= lr * m_hat / (np.sqrt(v_hat) + eps)
    <span class="kw">return</span> params, m, v''',
        "canvas_type": "optimiser",
        "canvas_config": {"optimiser": "adam"},
    },
    {
        "id": "ml-adamw",
        "title": "AdamW Optimiser",
        "tag": "ML · Optimiser",
        "desc": "Adam with <b>decoupled weight decay</b> — fixes the L2-regularisation interaction in Adam. Used in transformer training.",
        "eq": "θ ← θ − η·m̂/(√v̂+ε) − η·wd·θ",
        "code": '''<span class="cm"># Same as Adam, but weight decay applied directly:</span>
<span class="cm"># θ ← θ − η·m̂/(√v̂+ε) − η·wd·θ</span>
<span class="cm"># wd → weight_decay (typically 0.01)</span>
<span class="kw">def</span> <span class="fn">adamw_step</span>(params, grads, m, v, t,
                lr=<span class="num">0.001</span>, wd=<span class="num">0.01</span>,
                b1=<span class="num">0.9</span>, b2=<span class="num">0.999</span>, eps=<span class="num">1e-8</span>):
    <span class="kw">for</span> i <span class="kw">in range</span>(len(params)):
        m[i] = b1*m[i] + (<span class="num">1</span>-b1)*grads[i]
        v[i] = b2*v[i] + (<span class="num">1</span>-b2)*grads[i]**<span class="num">2</span>
        m_hat = m[i] / (<span class="num">1</span> - b1**t)
        v_hat = v[i] / (<span class="num">1</span> - b2**t)
        params[i] -= lr * m_hat / (np.sqrt(v_hat) + eps) + lr * wd * params[i]
    <span class="kw">return</span> params, m, v''',
        "canvas_type": "optimiser",
        "canvas_config": {"optimiser": "adamw"},
    },
]


# ──────────────────────────────────────────────────────────────────────
# CANVAS JS TEMPLATES
# ──────────────────────────────────────────────────────────────────────

LOSS_CANVAS_JS = '''
      // ===== LOSS FUNCTION VISUAL =====
      var DATA = [];
      var rng = { s: 42, next: function() { this.s = (this.s*9301+49297)%233280; return this.s/233280; } };
      for (var i = 0; i < 20; i++) { var x = i*0.5; var y = 2*x + 3 + (rng.next()-0.5)*4; DATA.push({x:x, y:y}); }
      var b0 = 0, b1 = 1, isAnim = false;
      var W = canvas.width, H = canvas.height;

      function predict(x) { return b0 + b1*x; }
      function toCX(x) { return 60 + (x/10) * (W-120); }
      function toCY(y) { return H-40 - (y+5)/25 * (H-60); }

      var LOSS_FN = {loss_fn};
      function computeLoss() {
        var s = 0;
        for (var i = 0; i < DATA.length; i++) {
          var e = DATA[i].y - predict(DATA[i].x);
          if (LOSS_FN === 'mse') s += e*e;
          else if (LOSS_FN === 'mae') s += Math.abs(e);
          else if (LOSS_FN === 'huber') { var d = 1.0; var a = Math.abs(e); s += a <= d ? 0.5*a*a : d*(a-0.5*d); }
          else if (LOSS_FN === 'logcosh') s += Math.log(Math.cosh(e));
        }
        return s / DATA.length;
      }

      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Grid
        ctx.strokeStyle = 'rgba(148,163,184,0.06)'; ctx.lineWidth = 0.5;
        for (var g = 0; g <= 10; g++) { var px = 60+g*(W-120)/10; ctx.beginPath(); ctx.moveTo(px,20); ctx.lineTo(px,H-40); ctx.stroke(); }
        for (var g2 = 0; g2 <= 5; g2++) { var py = 20+g2*(H-60)/5; ctx.beginPath(); ctx.moveTo(60,py); ctx.lineTo(W-60,py); ctx.stroke(); }
        // Axes
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(60,20); ctx.lineTo(60,H-40); ctx.lineTo(W-60,H-40); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '10px ui-monospace';
        ctx.fillText('x', W-50, H-25); ctx.fillText('y', 45, 30);
        // Error lines + data points
        for (var i = 0; i < DATA.length; i++) {
          var d = DATA[i], px = toCX(d.x), py = toCY(d.y), pp = toCY(predict(d.x));
          var em = Math.abs(d.y - predict(d.x));
          ctx.strokeStyle = 'rgba(239,68,68,' + Math.min(0.7, em/8).toFixed(2) + ')'; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
          ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,pp); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = em < 2 ? '#10b981' : (em < 5 ? '#f59e0b' : '#ef4444');
          ctx.beginPath(); ctx.arc(px,py,4,0,6.28); ctx.fill();
        }
        // Fitted line
        var lc = isAnim ? '#8b5cf6' : '#06b6d4';
        ctx.strokeStyle = lc; ctx.lineWidth = 2.5; ctx.shadowColor = lc; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(toCX(0), toCY(predict(0))); ctx.lineTo(toCX(10), toCY(predict(10))); ctx.stroke(); ctx.shadowBlur = 0;
        // Predicted dots
        for (var i = 0; i < DATA.length; i++) { var px = toCX(DATA[i].x), pp = toCY(predict(DATA[i].x)); ctx.fillStyle = lc+'88'; ctx.beginPath(); ctx.arc(px,pp,2.5,0,6.28); ctx.fill(); }
        // Loss value
        var loss = computeLoss();
        document.getElementById('loss-val').textContent = loss.toFixed(4);
        document.getElementById('loss-val').className = 'val ' + (loss < 2 ? 'good' : (loss < 8 ? 'ok' : 'bad'));
      }

      function runGD() {
        if (isAnim) return; isAnim = true;
        document.getElementById('phase-ind').textContent = 'running'; document.getElementById('phase-ind').classList.add('active');
        document.getElementById('btn-gd').disabled = true;
        b0 = 8; b1 = -0.5; var lr = 0.02, step = 0, steps = 80;
        function loop() {
          if (step >= steps) { isAnim = false; document.getElementById('phase-ind').textContent = 'converged ✓'; document.getElementById('btn-gd').disabled = false; document.getElementById('b0-slider').value = b0; document.getElementById('b1-slider').value = b1; document.getElementById('b0-val').textContent = b0.toFixed(2); document.getElementById('b1-val').textContent = b1.toFixed(2); return; }
          var g0 = 0, g1 = 0;
          for (var i = 0; i < DATA.length; i++) { var err = predict(DATA[i].x) - DATA[i].y; g0 += err; g1 += err * DATA[i].x; }
          g0 = 2*g0/DATA.length; g1 = 2*g1/DATA.length;
          b0 -= lr*g0; b1 -= lr*g1;
          document.getElementById('b0-val').textContent = b0.toFixed(2); document.getElementById('b1-val').textContent = b1.toFixed(2);
          document.getElementById('phase-ind').textContent = 'step '+(step+1)+'/'+steps;
          render(); step++; requestAnimationFrame(loop);
        }
        loop();
      }

      document.getElementById('b1-slider').addEventListener('input', function(e) { b1 = parseFloat(e.target.value); document.getElementById('b1-val').textContent = b1.toFixed(2); render(); });
      document.getElementById('b0-slider').addEventListener('input', function(e) { b0 = parseFloat(e.target.value); document.getElementById('b0-val').textContent = b0.toFixed(2); render(); });
      document.getElementById('btn-gd').addEventListener('click', runGD);
      document.getElementById('btn-reset').addEventListener('click', function() { b0=0; b1=1; document.getElementById('b0-slider').value=0; document.getElementById('b1-slider').value=1; document.getElementById('b0-val').textContent='0.00'; document.getElementById('b1-val').textContent='1.00'; document.getElementById('phase-ind').textContent='idle'; document.getElementById('phase-ind').classList.remove('active'); render(); });
      render();
'''

ACTIVATION_CANVAS_JS = '''
      // ===== ACTIVATION FUNCTION VISUAL =====
      var W = canvas.width, H = canvas.height;
      var xInput = 0.5;

      function actFn(x) {
        if ('{fn}' === 'relu') return Math.max(0, x);
        if ('{fn}' === 'gelu') return 0.5 * x * (1 + Math.tanh(Math.sqrt(2/Math.PI) * (x + 0.044715 * x*x*x)));
        return x;
      }
      function actGrad(x) {
        if ('{fn}' === 'relu') return x > 0 ? 1 : 0;
        if ('{fn}' === 'gelu') {
          var s = Math.tanh(Math.sqrt(2/Math.PI) * (x + 0.044715*x*x*x));
          return 0.5 * (1 + s) + 0.5 * x * (1 - s*s) * Math.sqrt(2/Math.PI) * (1 + 3*0.044715*x*x);
        }
        return 1;
      }
      function toCX(x) { return 60 + (x+4)/8 * (W-120); }
      function toCY(y) { return H-40 - (y+1)/5 * (H-60); }

      function render() {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Grid + axes
        ctx.strokeStyle = 'rgba(148,163,184,0.06)'; ctx.lineWidth = 0.5;
        for (var g = -4; g <= 4; g++) { var px = toCX(g); ctx.beginPath(); ctx.moveTo(px,20); ctx.lineTo(px,H-40); ctx.stroke(); }
        for (var g2 = -1; g2 <= 4; g2++) { var py = toCY(g2); ctx.beginPath(); ctx.moveTo(60,py); ctx.lineTo(W-60,py); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(60,toCY(0)); ctx.lineTo(W-60,toCY(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toCX(0),20); ctx.lineTo(toCX(0),H-40); ctx.stroke();
        // Function curve
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 6;
        ctx.beginPath();
        for (var x = -4; x <= 4; x += 0.05) { var px = toCX(x), py = toCY(actFn(x)); if (x === -4) ctx.moveTo(px,py); else ctx.lineTo(px,py); }
        ctx.stroke(); ctx.shadowBlur = 0;
        // Gradient curve (lighter)
        ctx.strokeStyle = '#8b5cf688'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
        ctx.beginPath();
        for (var x = -4; x <= 4; x += 0.05) { var px = toCX(x), py = toCY(actGrad(x)); if (x === -4) ctx.moveTo(px,py); else ctx.lineTo(px,py); }
        ctx.stroke(); ctx.setLineDash([]);
        // Current input point
        var cv = actFn(xInput), gv = actGrad(xInput);
        var ipx = toCX(xInput), ipy = toCY(cv);
        // Vertical line from x-axis to function
        ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([2,4]);
        ctx.beginPath(); ctx.moveTo(ipx, toCY(0)); ctx.lineTo(ipx, ipy); ctx.stroke(); ctx.setLineDash([]);
        // Point on function
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(ipx, ipy, 5, 0, 6.28); ctx.fill();
        // Point on x-axis
        ctx.fillStyle = '#f59e0baa'; ctx.beginPath(); ctx.arc(ipx, toCY(0), 3, 0, 6.28); ctx.fill();
        // Labels
        ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'right';
        ctx.fillText('f(x)', W-65, 35);
        ctx.fillStyle = '#8b5cf688'; ctx.fillText("f'(x)", W-65, 50);
        ctx.fillStyle = '#f59e0b'; ctx.fillText('x=' + xInput.toFixed(2), W-65, 65);
        ctx.fillStyle = '#10b981'; ctx.fillText('f=' + cv.toFixed(3), W-65, 80);
        ctx.fillStyle = '#ec4899'; ctx.fillText("f'=" + gv.toFixed(3), W-65, 95);
        ctx.textAlign = 'left';
        // Loss value overlay
        document.getElementById('loss-val').textContent = cv.toFixed(3);
        document.getElementById('loss-val').className = 'val good';
        document.getElementById('loss-val').previousElementSibling.textContent = 'f(' + xInput.toFixed(2) + ')';
      }

      document.getElementById('b1-slider').addEventListener('input', function(e) { xInput = parseFloat(e.target.value); document.getElementById('b1-val').textContent = xInput.toFixed(2); render(); });
      document.getElementById('b0-slider').style.display = 'none';
      document.getElementById('b0-val').parentElement.style.display = 'none';
      document.getElementById('btn-gd').addEventListener('click', function() {
        // Animate x sweeping from -4 to 4
        if (isAnim) return; isAnim = true; document.getElementById('btn-gd').disabled = true;
        var x = -4;
        function sweep() {
          if (x >= 4) { isAnim = false; document.getElementById('btn-gd').disabled = false; return; }
          xInput = x; document.getElementById('b1-slider').value = x; document.getElementById('b1-val').textContent = x.toFixed(2);
          render(); x += 0.08; requestAnimationFrame(sweep);
        }
        sweep();
      });
      document.getElementById('btn-reset').addEventListener('click', function() { xInput = 0.5; document.getElementById('b1-slider').value = 0.5; document.getElementById('b1-val').textContent = '0.50'; render(); });
      var isAnim = false;
      render();
'''

OPTIMISER_CANVAS_JS = '''
      // ===== OPTIMISER TRAJECTORY VISUAL =====
      var W = canvas.width, H = canvas.height;
      var isAnim = false;
      var OPT = '{optimiser}';

      function lossSurface(x, y) {
        // Perturbed quadratic with a ravine
        return 0.5*(x-1)*(x-1) + 5*(y-1)*(y-1) + 0.3*Math.sin(3*x)*Math.cos(3*y);
      }
      function gradX(x, y) { return (x-1) + 0.9*Math.cos(3*x)*Math.cos(3*y); }
      function gradY(x, y) { return 10*(y-1) - 0.9*Math.sin(3*x)*Math.sin(3*y); }

      function toCX(x) { return 40 + (x+2)/6 * (W-80); }
      function toCY(y) { return H-40 - (y+2)/6 * (H-60); }

      function render(traj) {
        var bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0e1a'); bg.addColorStop(1,'#0f1422');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        // Contour lines
        ctx.strokeStyle = 'rgba(6,182,212,0.08)'; ctx.lineWidth = 0.5;
        for (var cx = -2; cx <= 4; cx += 0.15) { for (var cy = -2; cy <= 4; cy += 0.15) {
          var lv = lossSurface(cx, cy);
          if (lv < 0.5) { ctx.fillStyle = 'rgba(16,185,129,0.04)'; ctx.fillRect(toCX(cx)-2, toCY(cy)-2, 4, 4); }
          else if (lv < 2) { ctx.fillStyle = 'rgba(6,182,212,0.03)'; ctx.fillRect(toCX(cx)-2, toCY(cy)-2, 4, 4); }
          else if (lv < 8) { ctx.fillStyle = 'rgba(139,92,246,0.02)'; ctx.fillRect(toCX(cx)-2, toCY(cy)-2, 4, 4); }
        }}
        // Contour outlines
        ctx.strokeStyle = 'rgba(148,163,184,0.08)';
        for (var level = 0.5; level <= 20; level += 1.5) {
          ctx.beginPath();
          var first = true;
          for (var cx = -2; cx <= 4; cx += 0.1) {
            for (var cy = -2; cy <= 4; cy += 0.1) {
              if (Math.abs(lossSurface(cx, cy) - level) < 0.3) {
                var px = toCX(cx), py = toCY(cy);
                if (first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
              }
            }
          }
          ctx.stroke();
        }
        // Minimum marker
        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(toCX(1), toCY(1), 6, 0, 6.28); ctx.fill();
        ctx.fillStyle = 'rgba(16,185,129,0.3)'; ctx.beginPath(); ctx.arc(toCX(1), toCY(1), 12, 0, 6.28); ctx.fill();
        // Trajectory
        if (traj && traj.length > 1) {
          var colors = {sgd: '#ef4444', adam: '#06b6d4', adamw: '#8b5cf6'};
          ctx.strokeStyle = colors[OPT] || '#06b6d4'; ctx.lineWidth = 2; ctx.shadowColor = colors[OPT] || '#06b6d4'; ctx.shadowBlur = 4;
          ctx.beginPath();
          for (var i = 0; i < traj.length; i++) {
            var px = toCX(traj[i][0]), py = toCY(traj[i][1]);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke(); ctx.shadowBlur = 0;
          // Current position
          var last = traj[traj.length-1];
          ctx.fillStyle = colors[OPT] || '#06b6d4'; ctx.beginPath(); ctx.arc(toCX(last[0]), toCY(last[1]), 4, 0, 6.28); ctx.fill();
        }
        // Labels
        ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '10px ui-monospace'; ctx.textAlign = 'right';
        var names = {sgd: 'SGD', adam: 'Adam', adamw: 'AdamW'};
        ctx.fillStyle = ({sgd:'#ef4444', adam:'#06b6d4', adamw:'#8b5cf6'})[OPT];
        ctx.fillText(names[OPT], W-65, 35);
        ctx.textAlign = 'left';
        var loss = traj && traj.length > 0 ? lossSurface(traj[traj.length-1][0], traj[traj.length-1][1]) : 0;
        document.getElementById('loss-val').textContent = loss.toFixed(3);
        document.getElementById('loss-val').className = 'val ' + (loss < 1 ? 'good' : (loss < 5 ? 'ok' : 'bad'));
      }

      function runOpt() {
        if (isAnim) return; isAnim = true;
        document.getElementById('btn-gd').disabled = true;
        document.getElementById('phase-ind').textContent = 'running'; document.getElementById('phase-ind').classList.add('active');
        var x = -1.5, y = 3.5; // bad start
        var mx = 0, my = 0, vx = 0, vy = 0; // Adam moments
        var lr = OPT === 'sgd' ? 0.03 : 0.05;
        var wd = OPT === 'adamw' ? 0.01 : 0;
        var b1 = 0.9, b2 = 0.999, eps = 1e-8;
        var traj = [[x, y]];
        var step = 0, steps = 100;

        function loop() {
          if (step >= steps) { isAnim = false; document.getElementById('phase-ind').textContent = 'converged ✓'; document.getElementById('btn-gd').disabled = false; return; }
          var gx = gradX(x, y), gy = gradY(x, y);
          if (OPT === 'sgd') {
            x -= lr * gx; y -= lr * gy;
          } else {
            mx = b1*mx + (1-b1)*gx; my = b1*my + (1-b1)*gy;
            vx = b2*vx + (1-b2)*gx*gx; vy = b2*vy + (1-b2)*gy*gy;
            var mhx = mx/(1-Math.pow(b1, step+1)), mhy = my/(1-Math.pow(b1, step+1));
            var vhx = vx/(1-Math.pow(b2, step+1)), vhy = vy/(1-Math.pow(b2, step+1));
            x -= lr * mhx/(Math.sqrt(vhx)+eps) + (wd ? lr*wd*x : 0);
            y -= lr * mhy/(Math.sqrt(vhy)+eps) + (wd ? lr*wd*y : 0);
          }
          traj.push([x, y]);
          if (traj.length > 100) traj.shift();
          document.getElementById('phase-ind').textContent = 'step '+(step+1)+'/'+steps;
          render(traj); step++; requestAnimationFrame(loop);
        }
        render(traj);
        loop();
      }

      document.getElementById('b1-slider').parentElement.style.display = 'none';
      document.getElementById('b0-slider').parentElement.style.display = 'none';
      document.getElementById('btn-gd').addEventListener('click', runOpt);
      document.getElementById('btn-reset').addEventListener('click', function() { document.getElementById('phase-ind').textContent='idle'; document.getElementById('phase-ind').classList.remove('active'); render([]); });
      render([]);
'''


# ──────────────────────────────────────────────────────────────────────
# HTML TEMPLATE
# ──────────────────────────────────────────────────────────────────────

def get_canvas_js(card):
    ct = card["canvas_type"]
    cc = card["canvas_config"]
    if ct == "loss":
        return LOSS_CANVAS_JS.replace("{loss_fn}", cc.get("loss_fn", "mse"))
    elif ct == "activation":
        fn = cc.get("fn", "relu")
        return ACTIVATION_CANVAS_JS.replace("{fn}", fn)
    elif ct == "optimiser":
        return OPTIMISER_CANVAS_JS.replace("{optimiser}", cc.get("optimiser", "sgd"))
    return ""

def get_slider_labels(card):
    ct = card["canvas_type"]
    if ct == "loss":
        return '<label>Slope β₁ <span class="val" id="b1-val">1.00</span></label>'
    elif ct == "activation":
        return '<label>Input x <span class="val" id="b1-val">0.50</span></label>'
    elif ct == "optimiser":
        return '<label>Optimiser: ' + card["canvas_config"]["optimiser"].upper() + '</label>'
    return ""

def generate_card(card):
    canvas_js = get_canvas_js(card)
    slider_label = get_slider_labels(card)
    gd_btn_label = "▶ Run gradient descent" if card["canvas_type"] == "loss" else ("▶ Sweep x" if card["canvas_type"] == "activation" else "▶ Run optimiser")

    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{card['title']} — visual-first concept card. Interactive canvas, real-time sliders, code with Math→Code annotations." />
    <title>{card['title']} — Visual Concept Card · AIHPC</title>
    <style>
      :root {{ --bg:#0b0f1a; --bg-elevated:#121826; --border:#1f2937; --text:#f3f4f6; --text-muted:#9ca3af; --accent:#06b6d4; --accent2:#8b5cf6; --danger:#ef4444; --success:#10b981; --warn:#f59e0b; }}
      * {{ box-sizing: border-box; margin: 0; padding: 0; }}
      html, body {{ background: var(--bg); color: var(--text); font-family: -apple-system, "Segoe UI", sans-serif; min-height: 100vh; overflow-x: hidden; }}
      body::before {{ content:""; position:fixed; inset:0; background: radial-gradient(1000px 500px at 50% 0%, rgba(6,182,212,0.10), transparent 70%); pointer-events:none; z-index:0; }}
      .wrap {{ max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; position: relative; z-index: 1; }}
      .head {{ display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }}
      .head .tag {{ font-size: 10px; padding: 3px 10px; border-radius: 9999px; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.4); color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }}
      .head h1 {{ font-size: 24px; font-weight: 800; }}
      .back {{ font-size: 12px; color: var(--accent); text-decoration: none; margin-bottom: 12px; display: inline-block; }}
      .eq-badge {{ display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; background: rgba(11,15,26,0.85); border: 1px solid rgba(6,182,212,0.3); font-family: "Cambria Math", Georgia, serif; font-size: 15px; color: var(--accent); margin-bottom: 12px; }}
      .desc {{ font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px; max-width: 600px; }}
      .canvas-wrap {{ position: relative; background: rgba(11,15,26,0.6); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }}
      canvas {{ display: block; width: 100%; height: auto; }}
      .loss-overlay {{ position: absolute; top: 12px; right: 12px; background: rgba(11,15,26,0.9); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; text-align: right; }}
      .loss-overlay .lbl {{ font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }}
      .loss-overlay .val {{ font-size: 28px; font-weight: 800; font-family: ui-monospace, monospace; color: var(--accent); }}
      .loss-overlay .val.bad {{ color: var(--danger); }} .loss-overlay .val.ok {{ color: var(--warn); }} .loss-overlay .val.good {{ color: var(--success); }}
      .eq-overlay {{ position: absolute; bottom: 12px; left: 12px; background: rgba(11,15,26,0.9); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 4px 12px; font-family: "Cambria Math", Georgia, serif; font-size: 13px; color: var(--accent); pointer-events: none; }}
      .phase-indicator {{ position: absolute; bottom: 12px; right: 12px; background: rgba(11,15,26,0.9); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 10px; color: var(--text-muted); font-family: ui-monospace, monospace; }}
      .phase-indicator.active {{ color: var(--accent); border-color: rgba(6,182,212,0.4); }}
      .controls {{ display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; align-items: flex-end; }}
      .ctrl {{ flex: 1; min-width: 180px; background: rgba(18,24,38,0.7); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; }}
      .ctrl label {{ font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }}
      .ctrl .val {{ font-size: 14px; font-weight: 700; font-family: ui-monospace, monospace; color: var(--accent); }}
      .ctrl input[type=range] {{ width: 100%; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: var(--border); outline: none; }}
      .ctrl input[type=range]::-webkit-slider-thumb {{ -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; border: 2px solid var(--bg); }}
      .btn {{ padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; }}
      .btn.primary {{ background: linear-gradient(90deg, var(--accent), var(--accent2)); color: white; }} .btn.primary:hover {{ transform: translateY(-1px); box-shadow: 0 4px 16px rgba(6,182,212,0.3); }}
      .btn.ghost {{ background: rgba(18,24,38,0.7); border: 1px solid var(--border); color: var(--text-muted); }} .btn.ghost:hover {{ border-color: var(--accent); color: var(--text); }}
      .btn:disabled {{ opacity: 0.5; cursor: not-allowed; }}
      /* Code panel — always visible with Math→Code annotations */
      .code-section {{ background: rgba(18,24,38,0.5); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; margin-top: 16px; }}
      .code-section h3 {{ font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }}
      .code-section .eq-line {{ font-family: "Cambria Math", Georgia, serif; font-size: 14px; color: var(--accent); padding: 6px 10px; background: rgba(6,182,212,0.05); border-radius: 6px; border-left: 3px solid var(--accent); margin-bottom: 10px; }}
      .code-section pre {{ background: #06080f; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; font-family: "SF Mono", Menlo, monospace; font-size: 12px; line-height: 1.6; color: #e5e7eb; overflow-x: auto; }}
      .kw {{ color: #c4b5fd; }} .fn {{ color: #06b6d4; }} .num {{ color: #f59e0b; }} .cm {{ color: #6b7280; font-style: italic; }}
      .foot {{ font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 24px; font-family: ui-monospace, monospace; }}
      .foot a {{ color: var(--accent); text-decoration: none; }}
    </style>
  </head>
  <body>
    <div class="wrap">
      <a href="../index.html" class="back">← Home</a>
      <div class="head">
        <span class="tag">{card['tag']}</span>
        <h1>{card['title']}</h1>
      </div>
      <p class="desc">{card['desc']}</p>
      <div class="eq-badge">📐 {card['eq']}</div>
      <div class="canvas-wrap">
        <canvas id="main-canvas" width="728" height="360"></canvas>
        <div class="loss-overlay"><div class="lbl" id="loss-lbl">Loss</div><div class="val" id="loss-val">0.0000</div></div>
        <div class="eq-overlay">{card['eq']}</div>
        <div class="phase-indicator" id="phase-ind">idle</div>
      </div>
      <div class="controls">
        <div class="ctrl" id="b1-ctrl">{slider_label}<input type="range" id="b1-slider" min="-4" max="4" step="0.01" value="1.0" /></div>
        <div class="ctrl" id="b0-ctrl"><label>Intercept β₀ <span class="val" id="b0-val">0.00</span></label><input type="range" id="b0-slider" min="-5" max="10" step="0.01" value="0.0" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: flex-end;">
          <button class="btn primary" id="btn-gd">{gd_btn_label}</button>
          <button class="btn ghost" id="btn-reset">↺ Reset</button>
        </div>
      </div>
      <div class="code-section">
        <h3>💻 Math → Code — how symbols become variables</h3>
        <div class="eq-line">{card['eq']}</div>
        <pre>{card['code']}</pre>
      </div>
      <div class="foot">
        <a href="../ai-lab.html?context={card['title']}">🤖 Ask AI</a> · <a href="../concepts/{card['id']}.html">📖 Full text version</a> · Visual concept card v2
      </div>
    </div>
    <script>
      var canvas = document.getElementById('main-canvas');
      var ctx = canvas.getContext('2d');
      {canvas_js}
    </script>
  </body>
</html>'''


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for card in CARDS:
        html = generate_card(card)
        path = os.path.join(OUT_DIR, card["id"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  ✓ {path} ({len(html):,} bytes)")
    print(f"\nGenerated {len(CARDS)} visual-first concept cards in {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

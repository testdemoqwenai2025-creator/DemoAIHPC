/**
 * ml-etl.js — Phase 37 ETL panel for the ML page.
 *
 * Lets the user paste a CSV with columns `y_true, y_pred` (or upload a
 * .csv file) and immediately see live loss values for the regression
 * demos (MSE, MAE, log-cosh, Huber, KL, cosine) — feeding the parsed
 * rows into the GTS components registered on the page.
 *
 * Pure client-side. No external services. Honours the AIHPC data-
 * residency principle: parsed data stays in the browser; no upload.
 *
 * Public API (window.AIHPC_ML_ETL):
 *   register(container_id)         — mount the widget
 *   parseCSV(text)                 — returns { headers, rows, errors }
 *   computeLosses(rows, yTrueCol, yPredCol) — returns per-loss values
 *   pushToGTS(rows, yTrueCol, yPredCol)     — update all live GTS graphs
 */
(function (global) {
  'use strict';

  function parseCSV(text) {
    // Strip BOM, normalize newlines
    text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    var lines = text.split('\n').filter(function (l) { return l.trim() && !l.trim().startsWith('#'); });
    if (lines.length === 0) return { headers: [], rows: [], errors: ['Empty input'] };
    function splitLine(line) {
      var out = [], cur = '', inQuote = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (inQuote) {
          if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (c === '"') { inQuote = false; }
          else cur += c;
        } else {
          if (c === '"') inQuote = true;
          else if (c === ',') { out.push(cur); cur = ''; }
          else cur += c;
        }
      }
      out.push(cur);
      return out.map(function (s) { return s.trim(); });
    }
    var headers = splitLine(lines[0]).map(function (h) { return h.toLowerCase(); });
    var rows = lines.slice(1).map(splitLine);
    return { headers: headers, rows: rows, errors: [] };
  }

  function findCols(headers) {
    var yt = -1, yp = -1;
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toLowerCase();
      if (h === 'y_true' || h === 'ytrue' || h === 'y' || h === 'target' || h === 'label') {
        if (yt < 0) yt = i;
      }
      if (h === 'y_pred' || h === 'ypred' || h === 'prediction' || h === 'pred' || h === 'yhat') {
        if (yp < 0) yp = i;
      }
    }
    return { yTrueCol: yt, yPredCol: yp };
  }

  function computeLosses(rows, ytCol, ypCol) {
    var n = 0, sumSqErr = 0, sumAbsErr = 0, sumLogCosh = 0, sumHuber = 0;
    var sumP = 0, sumQ = 0, sumPQ = 0, sumP2 = 0, sumQ2 = 0;
    var huberDelta = 1.0;
    var errors = [];
    for (var i = 0; i < rows.length; i++) {
      var y = parseFloat(rows[i][ytCol]);
      var yhat = parseFloat(rows[i][ypCol]);
      if (isNaN(y) || isNaN(yhat)) { errors.push('Row ' + (i + 1) + ': non-numeric value'); continue; }
      var e = y - yhat;
      sumSqErr += e * e;
      sumAbsErr += Math.abs(e);
      sumLogCosh += Math.log(Math.cosh(e));
      sumHuber += (Math.abs(e) <= huberDelta) ? 0.5 * e * e : huberDelta * (Math.abs(e) - 0.5 * huberDelta);
      sumP += y; sumQ += yhat;
      sumPQ += y * yhat; sumP2 += y * y; sumQ2 += yhat * yhat;
      n++;
    }
    if (n === 0) return { errors: ['No valid rows'], n: 0 };
    var mse = sumSqErr / n;
    var mae = sumAbsErr / n;
    var logCosh = sumLogCosh / n;
    var huber = sumHuber / n;
    var meanErr = sumAbsErr / n;
    var sigmaSq = (sumSqErr / n) - meanErr * meanErr;
    if (sigmaSq < 0) sigmaSq = 0;
    var kl = sigmaSq > 0 ? 0.5 * (sigmaSq + meanErr * meanErr - 1 - Math.log(Math.max(sigmaSq, 1e-12))) : 0;
    var cosineSim = sumPQ / (Math.sqrt(sumP2) * Math.sqrt(sumQ2) + 1e-12);
    return {
      n: n,
      mse: mse, mae: mae, logCosh: logCosh, huber: huber, kl: kl, cosine: cosineSim,
      sumSqErr: sumSqErr, sumAbsErr: sumAbsErr,
      errors: errors,
    };
  }

  function buildTableRows(rows, ytCol, ypCol) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var y = parseFloat(rows[i][ytCol]);
      var yhat = parseFloat(rows[i][ypCol]);
      if (isNaN(y) || isNaN(yhat)) continue;
      var e = y - yhat;
      out.push([i + 1, y, yhat, +e.toFixed(4), +(e * e).toFixed(4), +Math.abs(e).toFixed(4)]);
    }
    return out;
  }

  function pushToGTS(rows, ytCol, ypCol) {
    if (!global.AIHPC_GTS) return { updated: 0, instances: [] };
    var dataRows = buildTableRows(rows, ytCol, ypCol);
    if (dataRows.length === 0) return { updated: 0, instances: [] };
    var reg = global.AIHPC_GTS._registry || {};
    var updated = [];
    for (var id in reg) {
      var cfg = reg[id];
      if (cfg.mode === '3d') continue;
      cfg.rows = dataRows;
      cfg.headers = ['Sample', 'y_true', 'y_pred', 'error (y-y_hat)', 'error^2', '|error|'];
      cfg.xCol = 3;
      cfg.yCol = 4;
      cfg.xLabel = 'error (y-y_hat)';
      cfg.yLabel = 'loss (e^2)';
      var inst = (global.AIHPC_GTS._instances || {})[id];
      if (inst) {
        inst.config = cfg;
        inst.currentRow = -1;
        inst.render();
        updated.push(id);
      }
    }
    return { updated: updated.length, instances: updated };
  }

  function mount(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = ''
      + '<div style="background: rgba(18,24,38,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 16px; margin: 24px 0; backdrop-filter: blur(12px);">'
      + '  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">'
      + '    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">Live ETL - Upload your CSV</span>'
      + '    <span style="font-size: 11px; color: #9ca3af;">Pure client-side - No upload - Data residency respected</span>'
      + '  </div>'
      + '  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">'
      + '    <div>'
      + '      <label style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 6px;">CSV file (y_true, y_pred columns)</label>'
      + '      <input type="file" id="ml-etl-file" accept=".csv,.tsv,.txt" style="font-size: 11px; width: 100%; padding: 6px; background: #0a0e1a; border: 1px solid #1f2937; border-radius: 6px; color: #f3f4f6;" />'
      + '      <details style="margin-top: 8px;">'
      + '        <summary style="font-size: 11px; color: #06b6d4; cursor: pointer;">Or paste CSV manually</summary>'
      + '        <textarea id="ml-etl-text" placeholder="y_true,y_pred\n3.0,2.5\n4.1,3.8\n2.7,3.0" style="font-family: SF Mono, Menlo, monospace; font-size: 11px; width: 100%; height: 100px; padding: 8px; background: #0a0e1a; border: 1px solid #1f2937; border-radius: 6px; color: #f3f4f6; margin-top: 6px;"></textarea>'
      + '        <button id="ml-etl-parse-btn" style="margin-top: 6px; background: linear-gradient(90deg,#8b5cf6,#06b6d4); color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">Parse + push to GTS graphs</button>'
      + '      </details>'
      + '    </div>'
      + '    <div id="ml-etl-stats" style="background: #0a0e1a; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; font-family: SF Mono, Menlo, monospace; font-size: 11px; color: #9ca3af;">'
      + '      Waiting for CSV input...'
      + '    </div>'
      + '  </div>'
      + '</div>';

    var fileInput = el.querySelector('#ml-etl-file');
    var parseBtn = el.querySelector('#ml-etl-parse-btn');
    var textArea = el.querySelector('#ml-etl-text');
    var statsEl = el.querySelector('#ml-etl-stats');

    function handle(text) {
      var parsed = parseCSV(text);
      if (parsed.errors.length > 0 && parsed.rows.length === 0) {
        statsEl.innerHTML = '<span style="color:#ef4444;">Parse error: ' + parsed.errors.join('; ') + '</span>';
        return;
      }
      var cols = findCols(parsed.headers);
      if (cols.yTrueCol < 0 || cols.yPredCol < 0) {
        statsEl.innerHTML = '<span style="color:#fbbf24;">Could not find y_true / y_pred columns. Headers detected: ' + parsed.headers.join(', ') + '</span>';
        return;
      }
      var losses = computeLosses(parsed.rows, cols.yTrueCol, cols.yPredCol);
      var pushed = pushToGTS(parsed.rows, cols.yTrueCol, cols.yPredCol);

      var html = '<div style="color:#06b6d4; font-weight: 600; margin-bottom: 8px;">Live losses (n=' + losses.n + ')</div>';
      html += '<table style="width: 100%; border-collapse: collapse;">';
      function row(label, value, color) {
        html += '<tr><td style="padding: 2px 8px; color: #9ca3af;">' + label + '</td><td style="padding: 2px 8px; text-align: right; color: ' + (color || '#f3f4f6') + ';">' + value + '</td></tr>';
      }
      row('MSE', losses.mse.toFixed(4), '#06b6d4');
      row('MAE', losses.mae.toFixed(4), '#10b981');
      row('Log-Cosh', losses.logCosh.toFixed(4), '#8b5cf6');
      row('Huber (delta=1)', losses.huber.toFixed(4), '#f59e0b');
      row('KL divergence', losses.kl.toFixed(4), '#ec4899');
      row('Cosine similarity', losses.cosine.toFixed(4), '#22d3ee');
      html += '</table>';
      html += '<div style="margin-top: 8px; color: #9ca3af; font-size: 10px;">';
      html += 'Updated ' + pushed.updated + ' GTS graphs: ' + (pushed.instances.join(', ') || 'none');
      html += '</div>';
      statsEl.innerHTML = html;
    }

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) { handle(ev.target.result); };
      reader.readAsText(file);
    });
    if (parseBtn) parseBtn.addEventListener('click', function () {
      var t = textArea.value;
      if (t.trim()) handle(t);
    });
  }

  global.AIHPC_ML_ETL = {
    parseCSV: parseCSV,
    findCols: findCols,
    computeLosses: computeLosses,
    pushToGTS: pushToGTS,
    mount: mount,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mount('ml-etl-widget');
    });
  } else {
    mount('ml-etl-widget');
  }
})(typeof window !== 'undefined' ? window : this);

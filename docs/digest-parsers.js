/**
 * digest-parsers.js — Phase 27 ETL/ELT parser registry.
 *
 * Each parser takes a text string (the file contents read by
 * FileReader) and returns a result object:
 *   { ok: bool, stats: [{label, value}], preview: string, error?: string }
 *
 * Parsers are pure client-side — no data leaves the browser.
 *
 * Parsers implemented:
 *   parsePDB          — PDB ATOM records (AlphaFold 3, AlphaProof structural)
 *   parseGWStrain     — CSV (timestamp, strain) for LIGO O4
 *   parseSpecCSV      — CSV (wavelength, flux) for JWST WASP-39b
 *   parseGFA          — GFA 2.0 (segments + links) for pangenome
 *   parseLean         — Lean source code (count theorems)
 *   parseFASTAProtein — FASTA protein (k-mer stats) for ESM-3
 *   parseVCF          — VCF (variant call format) for AlphaMissense
 *   parsePTResiduals  — CSV pulsar-timing residuals for NANOGrav
 *   parseDiagCSV      — CSV (time, signal) for ITER D-T
 *   parseGenomeFASTA  — FASTA genome (GC%, length) for futuristic visions
 *   parseCatalogCSV   — CSV exoplanet catalog for futuristic visions
 *
 * The PARSERS object maps article_id → parser function. The
 * handleETLUpload() function in digest.html reads the file via
 * FileReader, looks up the parser, calls it, and injects the result
 * into the article's "ETL Report" sub-tab in the Observe panel.
 */
(function (global) {
  'use strict';

  // ---- Helpers ----
  function fmt(n, digits) {
    if (digits === undefined) digits = 2;
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(digits) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(digits) + 'k';
    return n.toFixed(digits);
  }

  function parseCSV(text) {
    // Simple CSV parser: returns array of rows (each row is array of strings)
    // Handles quoted fields minimally. Strips comments (#) and empty lines.
    return text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#')).map(l => {
      // Naive split — handles unquoted commas
      return l.split(',');
    });
  }

  // ---- Parsers ----

  function parsePDB(text) {
    const lines = text.split(/\r?\n/);
    let atoms = 0;
    const residueSet = new Set();
    const chainSet = new Set();
    let firstAtom = null;
    let centroidX = 0, centroidY = 0, centroidZ = 0;
    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        atoms++;
        const chain = (line[21] || ' ').trim();
        const resSeq = line.substring(22, 27).trim();
        chainSet.add(chain);
        residueSet.add(chain + ':' + resSeq);
        const x = parseFloat(line.substring(30, 38));
        const y = parseFloat(line.substring(38, 46));
        const z = parseFloat(line.substring(46, 54));
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          centroidX += x; centroidY += y; centroidZ += z;
          if (!firstAtom) firstAtom = { name: line.substring(12, 16).trim(), x: x, y: y, z: z };
        }
      }
    }
    if (atoms === 0) {
      return { ok: false, error: 'No ATOM or HETATM records found in PDB file.' };
    }
    centroidX /= atoms; centroidY /= atoms; centroidZ /= atoms;
    return {
      ok: true,
      stats: [
        { label: 'Atoms', value: atoms },
        { label: 'Residues', value: residueSet.size },
        { label: 'Chains', value: chainSet.size },
        { label: 'Centroid X', value: centroidX.toFixed(2) },
        { label: 'Centroid Y', value: centroidY.toFixed(2) },
        { label: 'Centroid Z', value: centroidZ.toFixed(2) },
      ],
      preview: 'Structure parsed: ' + atoms + ' atoms across ' + chainSet.size + ' chain(s) and ' + residueSet.size + ' residues. First atom: ' + (firstAtom ? firstAtom.name + ' at (' + firstAtom.x.toFixed(2) + ', ' + firstAtom.y.toFixed(2) + ', ' + firstAtom.z.toFixed(2) + ')' : '—') + '. The LJ + Verlet demo can now run against this structure — use the centroid as the simulation origin.',
    };
  }

  function parseGWStrain(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return { ok: false, error: 'CSV needs a header row + at least 1 data row.' };
    }
    // Detect columns: try to find numeric columns
    let tCol = 0, hCol = 1;
    const header = rows[0].map(s => s.trim().toLowerCase());
    for (let i = 0; i < header.length; i++) {
      if (header[i].includes('time') || header[i] === 't') tCol = i;
      if (header[i].includes('strain') || header[i].includes('h') || header[i] === 'h1') hCol = i;
    }
    let samples = 0;
    let maxStrain = 0;
    let minT = Infinity, maxT = -Infinity;
    let sumSq = 0;
    for (let i = 1; i < rows.length; i++) {
      const t = parseFloat(rows[i][tCol]);
      const h = parseFloat(rows[i][hCol]);
      if (isNaN(t) || isNaN(h)) continue;
      samples++;
      if (Math.abs(h) > Math.abs(maxStrain)) maxStrain = h;
      if (t < minT) minT = t;
      if (t > maxT) maxT = t;
      sumSq += h * h;
    }
    if (samples === 0) {
      return { ok: false, error: 'No valid (time, strain) rows found.' };
    }
    const rms = Math.sqrt(sumSq / samples);
    // Heuristic SNR: peak / RMS — LIGO thresholds typically at SNR > 5.5
    const snr = Math.abs(maxStrain) / rms;
    return {
      ok: true,
      stats: [
        { label: 'Samples', value: samples },
        { label: 'Time span', value: (maxT - minT).toFixed(2) + ' s' },
        { label: 'Max strain', value: maxStrain.toExponential(2) },
        { label: 'RMS strain', value: rms.toExponential(2) },
        { label: 'Heuristic SNR', value: snr.toFixed(2) },
        { label: 'Detection', value: snr > 5.5 ? 'above 5.5 threshold' : 'below 5.5 threshold' },
      ],
      preview: 'Strain time-series parsed: ' + samples + ' samples over ' + (maxT - minT).toFixed(2) + ' s. Peak strain ' + maxStrain.toExponential(2) + ' (RMS ' + rms.toExponential(2) + '). Heuristic SNR = ' + snr.toFixed(2) + ' — ' + (snr > 5.5 ? 'would trigger a candidate event after coincidence + chi-squared.' : 'would not trigger the online search.'),
    };
  }

  function parseSpecCSV(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return { ok: false, error: 'CSV needs a header row + at least 1 data row.' };
    }
    let lamCol = 0, fluxCol = 1;
    const header = rows[0].map(s => s.trim().toLowerCase());
    for (let i = 0; i < header.length; i++) {
      if (header[i].includes('wave') || header[i].includes('lam')) lamCol = i;
      if (header[i].includes('flux')) fluxCol = i;
    }
    let samples = 0;
    let minFlux = Infinity, maxFlux = -Infinity;
    let minLam = Infinity, maxLam = -Infinity;
    let sumFlux = 0;
    const fluxes = [];
    for (let i = 1; i < rows.length; i++) {
      const lam = parseFloat(rows[i][lamCol]);
      const flux = parseFloat(rows[i][fluxCol]);
      if (isNaN(lam) || isNaN(flux)) continue;
      samples++;
      if (flux < minFlux) minFlux = flux;
      if (flux > maxFlux) maxFlux = flux;
      if (lam < minLam) minLam = lam;
      if (lam > maxLam) maxLam = lam;
      sumFlux += flux;
      fluxes.push({ lam: lam, flux: flux });
    }
    if (samples === 0) {
      return { ok: false, error: 'No valid (wavelength, flux) rows found.' };
    }
    // Detect absorption features: local minima below continuum (mean - 2*std)
    const mean = sumFlux / samples;
    let varSum = 0;
    for (const f of fluxes) varSum += (f.flux - mean) * (f.flux - mean);
    const std = Math.sqrt(varSum / samples);
    const threshold = mean - 2 * std;
    let nFeatures = 0;
    for (let i = 1; i < fluxes.length - 1; i++) {
      if (fluxes[i].flux < threshold && fluxes[i].flux < fluxes[i-1].flux && fluxes[i].flux < fluxes[i+1].flux) {
        nFeatures++;
      }
    }
    return {
      ok: true,
      stats: [
        { label: 'Spectral points', value: samples },
        { label: 'λ range', value: minLam.toFixed(2) + '–' + maxLam.toFixed(2) + ' μm' },
        { label: 'Min flux', value: minFlux.toExponential(2) },
        { label: 'Max flux', value: maxFlux.toExponential(2) },
        { label: 'Mean flux', value: mean.toExponential(2) },
        { label: 'Absorption features', value: nFeatures + ' (>2σ)' },
      ],
      preview: 'Transmission spectrum parsed: ' + samples + ' points spanning ' + minLam.toFixed(2) + '–' + maxLam.toFixed(2) + ' μm. Detected ' + nFeatures + ' absorption feature(s) >2σ below the continuum. The transit-depth + limb-darkening demo can fit these features with molecular templates.',
    };
  }

  function parseGFA(text) {
    const lines = text.split(/\r?\n/);
    let segments = 0, links = 0, paths = 0, walks = 0;
    let totalSeqLen = 0;
    for (const line of lines) {
      if (!line.length) continue;
      const fields = line.split('\t');
      const tag = fields[0];
      if (tag === 'S') {
        segments++;
        if (fields[3] && fields[3].startsWith('LN:i:')) {
          totalSeqLen += parseInt(fields[3].substring(5), 10);
        }
      } else if (tag === 'L') {
        links++;
      } else if (tag === 'P') {
        paths++;
      } else if (tag === 'W') {
        walks++;
      }
    }
    if (segments === 0) {
      return { ok: false, error: 'No S (segment) records found in GFA file.' };
    }
    return {
      ok: true,
      stats: [
        { label: 'Segments', value: segments },
        { label: 'Links', value: links },
        { label: 'Paths', value: paths },
        { label: 'Walks', value: walks },
        { label: 'Total seq len', value: fmt(totalSeqLen, 1) + ' bp' },
        { label: 'Avg seg len', value: (totalSeqLen / segments).toFixed(0) + ' bp' },
      ],
      preview: 'GFA graph parsed: ' + segments + ' segments, ' + links + ' links, ' + paths + ' paths. Total sequence length ' + fmt(totalSeqLen, 1) + ' bp. The bubble-detection demo can run on this graph.',
    };
  }

  function parseLean(text) {
    const lines = text.split(/\r?\n/);
    let lineCount = lines.length;
    let theoremCount = 0;
    let lemmaCount = 0;
    let defCount = 0;
    const theoremNames = [];
    for (const line of lines) {
      const trimmed = line.trim();
      // Match: theorem name : ...
      let m = trimmed.match(/^(theorem|theorem!|lemma|def|lemma!)\s+(\w+)/);
      if (m) {
        const kind = m[1].toLowerCase().replace('!', '');
        const name = m[2];
        if (kind === 'theorem' || kind === 'theorem!') {
          theoremCount++;
          if (theoremNames.length < 5) theoremNames.push(name);
        } else if (kind === 'lemma') {
          lemmaCount++;
        } else if (kind === 'def') {
          defCount++;
        }
      }
    }
    if (lineCount === 0) {
      return { ok: false, error: 'Empty Lean source file.' };
    }
    return {
      ok: true,
      stats: [
        { label: 'Lines', value: lineCount },
        { label: 'Theorems', value: theoremCount },
        { label: 'Lemmas', value: lemmaCount },
        { label: 'Definitions', value: defCount },
        { label: 'Total decls', value: theoremCount + lemmaCount + defCount },
        { label: 'Sample theorems', value: theoremNames.join(', ') || '—' },
      ],
      preview: 'Lean source parsed: ' + lineCount + ' lines, ' + theoremCount + ' theorems + ' + lemmaCount + ' lemmas + ' + defCount + ' definitions. The entropy + sumset demo can run against the theorem statements.',
    };
  }

  function parseFASTAProtein(text) {
    const lines = text.split(/\r?\n/);
    let seq = '';
    let header = '';
    let inSeq = false;
    for (const line of lines) {
      if (line.startsWith('>')) {
        header = line.substring(1).trim();
        inSeq = true;
      } else if (inSeq) {
        seq += line.trim();
      }
    }
    if (seq.length === 0) {
      return { ok: false, error: 'No FASTA sequence found (expected ">header" then sequence lines).' };
    }
    // k-mer tokenisation (k=3)
    const k = 3;
    const kmers = new Set();
    for (let i = 0; i <= seq.length - k; i++) kmers.add(seq.substring(i, i + k));
    // Amino-acid composition
    const comp = {};
    for (const c of seq) comp[c] = (comp[c] || 0) + 1;
    const nResidues = seq.length;
    const nUnique = Object.keys(comp).length;
    const alphabet = 'ACDEFGHIKLMNPQRSTVWY';
    const canonical = Object.keys(comp).filter(c => alphabet.includes(c)).length;
    return {
      ok: true,
      stats: [
        { label: 'Header', value: header.substring(0, 30) + (header.length > 30 ? '…' : '') },
        { label: 'Residues', value: nResidues },
        { label: 'Distinct AA', value: nUnique },
        { label: 'Canonical AA', value: canonical + '/20' },
        { label: 'k-mers (k=3)', value: kmers.size + ' distinct' },
        { label: 'Vocab coverage', value: (kmers.size / Math.min(Math.pow(20, k), Math.pow(20, 3) * 0.1)).toFixed(2) + '%' },
      ],
      preview: 'Protein FASTA parsed: ' + nResidues + ' residues, ' + nUnique + ' distinct amino acids. Tokenised into ' + kmers.size + ' distinct 3-mers. The ESM-3-style k-mer transformer demo can run against this sequence.',
    };
  }

  function parseVCF(text) {
    const lines = text.split(/\r?\n/);
    let variantCount = 0;
    const byChrom = {};
    const byType = { SNV: 0, INDEL: 0, OTHER: 0 };
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const fields = line.split('\t');
      if (fields.length < 5) continue;
      const chrom = fields[0];
      const ref = fields[3];
      const alt = fields[4];
      variantCount++;
      byChrom[chrom] = (byChrom[chrom] || 0) + 1;
      if (ref.length === 1 && alt.length === 1) byType.SNV++;
      else if (ref.length <= 5 && alt.length <= 5) byType.INDEL++;
      else byType.OTHER++;
    }
    if (variantCount === 0) {
      return { ok: false, error: 'No variant records found in VCF (expected non-# lines with CHROM, POS, ID, REF, ALT).' };
    }
    const topChrom = Object.entries(byChrom).sort((a, b) => b[1] - a[1])[0];
    return {
      ok: true,
      stats: [
        { label: 'Total variants', value: variantCount },
        { label: 'Distinct chroms', value: Object.keys(byChrom).length },
        { label: 'Top chrom', value: topChrom ? topChrom[0] + ' (' + topChrom[1] + ')' : '—' },
        { label: 'SNVs', value: byType.SNV },
        { label: 'Indels', value: byType.INDEL },
        { label: 'Other (SVs)', value: byType.OTHER },
      ],
      preview: 'VCF parsed: ' + variantCount + ' variants across ' + Object.keys(byChrom).length + ' chromosome(s). ' + byType.SNV + ' SNVs, ' + byType.INDEL + ' indels, ' + byType.OTHER + ' other. The AlphaMissense demo can score each missense variant against the 71M-variant lookup table.',
    };
  }

  function parsePTResiduals(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return { ok: false, error: 'CSV needs a header row + at least 1 data row.' };
    }
    // Try to find a residual column
    let resCol = 1;
    const header = rows[0].map(s => s.trim().toLowerCase());
    for (let i = 0; i < header.length; i++) {
      if (header[i].includes('resid') || header[i].includes('toaresid')) { resCol = i; break; }
    }
    let n = 0;
    let sum = 0, sumSq = 0;
    let maxAbs = 0;
    for (let i = 1; i < rows.length; i++) {
      const v = parseFloat(rows[i][resCol]);
      if (isNaN(v)) continue;
      n++;
      sum += v;
      sumSq += v * v;
      if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
    }
    if (n === 0) {
      return { ok: false, error: 'No valid residual rows found.' };
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const std = Math.sqrt(Math.max(0, variance));
    // Hellings-Downs signal estimate (very rough): |mean| / std * sqrt(n)
    const hdSignal = Math.abs(mean) / std * Math.sqrt(n);
    return {
      ok: true,
      stats: [
        { label: 'Residuals', value: n },
        { label: 'Mean', value: mean.toExponential(2) },
        { label: 'Std', value: std.toExponential(2) },
        { label: 'Max |residual|', value: maxAbs.toExponential(2) },
        { label: 'HD signal', value: hdSignal.toFixed(2) },
        { label: 'Significance', value: hdSignal > 3 ? '> 3σ (candidate GW)' : '< 3σ (consistent with noise)' },
      ],
      preview: 'Pulsar-timing residuals parsed: ' + n + ' points. Mean = ' + mean.toExponential(2) + ', std = ' + std.toExponential(2) + '. HD signal estimate = ' + hdSignal.toFixed(2) + 'σ — ' + (hdSignal > 3 ? 'above the 3σ GW detection threshold' : 'consistent with noise-only hypothesis') + '.',
    };
  }

  function parseDiagCSV(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return { ok: false, error: 'CSV needs a header row + at least 1 data row.' };
    }
    let tCol = 0, sCol = 1;
    const header = rows[0].map(s => s.trim().toLowerCase());
    for (let i = 0; i < header.length; i++) {
      if (header[i].includes('time') || header[i] === 't') tCol = i;
      if (header[i].includes('signal') || header[i].includes('neutron') || header[i].includes('alpha')) sCol = i;
    }
    let n = 0;
    let maxAbs = 0;
    let tMin = Infinity, tMax = -Infinity;
    let sumSq = 0;
    for (let i = 1; i < rows.length; i++) {
      const t = parseFloat(rows[i][tCol]);
      const s = parseFloat(rows[i][sCol]);
      if (isNaN(t) || isNaN(s)) continue;
      n++;
      if (Math.abs(s) > maxAbs) maxAbs = Math.abs(s);
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
      sumSq += s * s;
    }
    if (n === 0) {
      return { ok: false, error: 'No valid (time, signal) rows found.' };
    }
    const rms = Math.sqrt(sumSq / n);
    const pulseDuration = tMax - tMin;
    return {
      ok: true,
      stats: [
        { label: 'Samples', value: n },
        { label: 'Pulse duration', value: pulseDuration.toFixed(3) + ' s' },
        { label: 'Max |signal|', value: maxAbs.toExponential(2) },
        { label: 'RMS', value: rms.toExponential(2) },
        { label: 'Peak/RMS', value: (maxAbs / rms).toFixed(2) + '×' },
        { label: 'Sample rate', value: (n / Math.max(pulseDuration, 0.001)).toFixed(0) + ' Hz' },
      ],
      preview: 'Diagnostic time-series parsed: ' + n + ' samples over ' + pulseDuration.toFixed(3) + ' s. Peak signal ' + maxAbs.toExponential(2) + ' (RMS ' + rms.toExponential(2) + '). Peak/RMS ratio ' + (maxAbs / rms).toFixed(2) + '× — the Lawson triple-product demo can run against this pulse.',
    };
  }

  function parseGenomeFASTA(text) {
    const lines = text.split(/\r?\n/);
    let seq = '';
    let header = '';
    let inSeq = false;
    for (const line of lines) {
      if (line.startsWith('>')) {
        header = line.substring(1).trim();
        inSeq = true;
      } else if (inSeq) {
        seq += line.trim().toUpperCase();
      }
    }
    if (seq.length === 0) {
      return { ok: false, error: 'No FASTA sequence found.' };
    }
    const n = seq.length;
    let gc = 0;
    let at = 0;
    let n_count = 0;
    let other = 0;
    for (const c of seq) {
      if (c === 'G' || c === 'C') gc++;
      else if (c === 'A' || c === 'T') at++;
      else if (c === 'N') n_count++;
      else other++;
    }
    const gcPct = (gc / n * 100);
    return {
      ok: true,
      stats: [
        { label: 'Header', value: header.substring(0, 30) + (header.length > 30 ? '…' : '') },
        { label: 'Length (bp)', value: fmt(n, 1) },
        { label: 'GC%', value: gcPct.toFixed(2) + '%' },
        { label: 'AT%', value: (at / n * 100).toFixed(2) + '%' },
        { label: 'N bases', value: fmt(n_count, 0) + ' (' + (n_count / n * 100).toFixed(2) + '%)' },
        { label: 'Other', value: other + ' (non-ACGTN)' },
      ],
      preview: 'Genome FASTA parsed: ' + fmt(n, 1) + ' bp. GC% = ' + gcPct.toFixed(2) + '%, AT% = ' + (at / n * 100).toFixed(2) + '%. The patient-specific drug-design demo can run against this genome — pangenome-graph calling would follow in step 1 of the pipeline.',
    };
  }

  function parseCatalogCSV(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return { ok: false, error: 'CSV needs a header row + at least 1 data row.' };
    }
    // Find the tier column if present
    const header = rows[0].map(s => s.trim().toLowerCase());
    let tierCol = -1;
    let tempCol = -1, radCol = -1;
    for (let i = 0; i < header.length; i++) {
      if (header[i].includes('tier')) tierCol = i;
      if (header[i].includes('temp') || header[i].includes('teq')) tempCol = i;
      if (header[i].includes('rad') || header[i].includes('r_')) radCol = i;
    }
    let n = 0;
    const tierCounts = { plausible: 0, strong: 0, robust: 0, none: 0 };
    let tempSum = 0, tempN = 0;
    let radSum = 0, radN = 0;
    for (let i = 1; i < rows.length; i++) {
      n++;
      if (tierCol >= 0) {
        const t = (rows[i][tierCol] || '').toLowerCase().trim();
        if (t in tierCounts) tierCounts[t]++;
        else tierCounts.none++;
      }
      if (tempCol >= 0) {
        const t = parseFloat(rows[i][tempCol]);
        if (!isNaN(t)) { tempSum += t; tempN++; }
      }
      if (radCol >= 0) {
        const r = parseFloat(rows[i][radCol]);
        if (!isNaN(r)) { radSum += r; radN++; }
      }
    }
    if (n === 0) {
      return { ok: false, error: 'No planet rows found.' };
    }
    return {
      ok: true,
      stats: [
        { label: 'Planets', value: n },
        { label: 'Robust', value: tierCounts.robust },
        { label: 'Strong', value: tierCounts.strong },
        { label: 'Plausible', value: tierCounts.plausible },
        { label: 'Mean Teq', value: tempN ? (tempSum / tempN).toFixed(0) + ' K' : '—' },
        { label: 'Mean R⊕', value: radN ? (radSum / radN).toFixed(2) : '—' },
      ],
      preview: 'Exoplanet catalog parsed: ' + n + ' planets. Tier distribution: ' + tierCounts.robust + ' robust, ' + tierCounts.strong + ' strong, ' + tierCounts.plausible + ' plausible. The biosignature cross-correlation demo can run against any planet\'s spectrum.',
    };
  }

  // ---- PARSERS registry — maps article_id → parser function ----
  // The article_id matches the `id` field in the MANIFEST.
  // For each article in Issue #2 + Issue #3, we declare which parser
  // applies. Articles can share a parser if their datasets have the
  // same format.
  global.DIGEST_PARSERS = {
    // ---- Issue #2 articles ----
    'alphafold3': parsePDB,
    'esm3': parseFASTAProtein,
    'alphamissense-clinical': parseVCF,
    'iter-dt': parseDiagCSV,
    'nanograv-gwb': parsePTResiduals,
    'ligo-o4': parseGWStrain,
    'jwst-wasp39b': parseSpecCSV,
    'pangenome-gfa': parseGFA,
    'pfr-lean': parseLean,
    'alphaproof-imo': parseLean,
    'patient-drug-design-2028': parseGenomeFASTA,
    'top500-exoplanet-2027': parseCatalogCSV,
  };

  // ---- handleETLUpload — main entry point called by the file input ----
  // Reads the file as text, looks up the parser, calls it, and
  // injects the result into the article's ETL Report sub-tab + the
  // inline ETL panel.
  global.handleETLUpload = function (articleId, file, opts) {
    opts = opts || {};
    var maxBytes = (opts.max_mb || 50) * 1024 * 1024;
    if (file.size > maxBytes) {
      var errEl = document.getElementById('etl-report-' + articleId);
      if (errEl) {
        errEl.style.display = 'block';
        errEl.innerHTML = '<span style="color: var(--danger);">✗ File too large: ' + (file.size / 1024 / 1024).toFixed(1) + ' MB > ' + (maxBytes / 1024 / 1024) + ' MB limit.</span>';
      }
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var text = e.target.result;
      var parser = global.DIGEST_PARSERS[articleId];
      var statusEl = document.getElementById('etl-report-' + articleId);
      var resultEl = document.getElementById('etl-result-' + articleId);
      if (!parser) {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = '<span style="color: var(--warn);">⚠ No parser registered for article "' + articleId + '". Open an issue at /subscribe.html.</span>';
        }
        return;
      }
      var result;
      try {
        result = parser(text);
      } catch (err) {
        result = { ok: false, error: 'Parser error: ' + err.message };
      }
      // Render status (inline panel)
      if (statusEl) {
        statusEl.style.display = 'block';
        if (result.ok) {
          var html_parts = ['<strong style="color: var(--success);">✓ Parsed: ' + file.name + '</strong> (' + (file.size / 1024).toFixed(1) + ' KB)'];
          if (result.preview) html_parts.push('<div style="margin-top: 6px; color: var(--text-muted);">' + escapeHTML(result.preview) + '</div>');
          html_parts.push('<div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 6px;">');
          for (var i = 0; i < result.stats.length; i++) {
            var s = result.stats[i];
            html_parts.push('<div style="padding: 4px 8px; background: var(--bg-elevated-2); border: 1px solid var(--border); border-radius: 6px;"><div style="font-size: 9px; color: var(--text-muted-2); text-transform: uppercase; letter-spacing: 0.04em;">' + escapeHTML(s.label) + '</div><div style="font-size: 13px; font-weight: 700; color: var(--accent-2); font-family: \'SF Mono\', Menlo, monospace;">' + escapeHTML(String(s.value)) + '</div></div>');
          }
          html_parts.push('</div>');
          statusEl.innerHTML = html_parts.join('');
        } else {
          statusEl.innerHTML = '<span style="color: var(--danger);">✗ ' + escapeHTML(result.error || 'Parse failed') + '</span>';
        }
      }
      // Render result (ETL Report sub-tab)
      if (resultEl) {
        if (result.ok) {
          var r_parts = ['<div style="color: var(--text);">'];
          r_parts.push('<strong>📂 ' + escapeHTML(file.name) + '</strong> · ' + (file.size / 1024).toFixed(1) + ' KB');
          r_parts.push('<p style="margin: 8px 0 12px; color: var(--text-muted);">' + escapeHTML(result.preview || '') + '</p>');
          r_parts.push('<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px;">');
          for (var j = 0; j < result.stats.length; j++) {
            var st = result.stats[j];
            r_parts.push('<div style="padding: 8px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px;"><div style="font-size: 10px; color: var(--text-muted-2); text-transform: uppercase; letter-spacing: 0.06em;">' + escapeHTML(st.label) + '</div><div style="font-size: 15px; font-weight: 700; color: var(--accent-2); font-family: \'SF Mono\', Menlo, monospace; margin-top: 2px;">' + escapeHTML(String(st.value)) + '</div></div>');
          }
          r_parts.push('</div>');
          r_parts.push('<p style="font-size: 11px; color: var(--text-muted-2);">The parsed data has been validated client-side. Data residency: downloadable only, nothing was uploaded to any server.</p>');
          r_parts.push('</div>');
          resultEl.innerHTML = r_parts.join('');
          // Phase 29: store the result + render the gated download button
          if (global.AIHPC_ETL_GATE) {
            global.AIHPC_ETL_GATE.storeResult(articleId, file.name, file.size, result);
            global.AIHPC_ETL_GATE.renderDownloadButton(articleId);
          }
        } else {
          resultEl.innerHTML = '<span style="color: var(--danger);">✗ ' + escapeHTML(result.error || 'Parse failed') + '</span>';
        }
      }
    };
    reader.onerror = function () {
      var statusEl = document.getElementById('etl-report-' + articleId);
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = '<span style="color: var(--danger);">✗ Failed to read file.</span>';
      }
    };
    reader.readAsText(file);
  };

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- Live subscription gating (Phase 29) ----
  // Wire the ETL Report download through the Phase 24 subscription gate.
  // Free tier: banner; Pro tier: JSON without trace; Team tier: JSON with
  // the full per-row parsed data + parse metadata (audit trail).
  //
  // The parsed results are stored per-article-id in LAST_RESULTS so the
  // download function can serialise them after the user has uploaded.
  var LAST_RESULTS = {};

  // Store the latest parsed result for an article (called from
  // handleETLUpload after the parser runs).
  function storeResult(articleId, fileName, fileSize, result) {
    LAST_RESULTS[articleId] = {
      articleId: articleId,
      fileName: fileName,
      fileSize: fileSize,
      parsedAt: new Date().toISOString(),
      result: result,
    };
  }

  // Render the download button in the ETL Report sub-tab AFTER a successful
  // upload. Reads the session via the shared subscribe-gate.js library
  // (AIHPC.requireTier).
  function renderDownloadButton(articleId) {
    var el = document.getElementById('etl-result-' + articleId);
    if (!el) return;
    // Append the download button if not already there
    if (el.querySelector('.etl-download-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'etl-download-btn';
    btn.style.cssText = 'margin-top: 10px; background: linear-gradient(90deg,#8b5cf6,#06b6d4); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;';
    btn.textContent = '⬇ Download parsed JSON';
    btn.onclick = function () { downloadParsedJSON(articleId); };
    // Insert at the end of the result block
    el.appendChild(btn);
    // Also insert a tier badge if the gate library is available
    if (global.AIHPC && global.AIHPC.mountTierBadge && !el.querySelector('[data-aihpc-tier-badge]')) {
      var badgeContainer = document.createElement('div');
      badgeContainer.setAttribute('data-aihpc-tier-badge', '1');
      badgeContainer.style.cssText = 'margin-top: 8px; display: inline-block;';
      el.appendChild(badgeContainer);
      global.AIHPC.mountTierBadge(badgeContainer);
    }
  }

  // Download the parsed JSON for an article, gated by subscription tier.
  function downloadParsedJSON(articleId) {
    var stored = LAST_RESULTS[articleId];
    if (!stored) {
      alert('No parsed data available. Upload a dataset first.');
      return;
    }
    // Phase 24 gate: require Pro+ tier
    if (!global.AIHPC || !global.AIHPC.requireTier) {
      // Gate library not loaded — fall through to basic download
    } else if (!global.AIHPC.requireTier('pro', { feature: 'Parsed JSON download (ETL Report)' })) {
      return;  // banner auto-shown by requireTier
    }
    var tier = (global.AIHPC && global.AIHPC.getTier) ? global.AIHPC.getTier() : 'unknown';
    var session = (global.AIHPC && global.AIHPC.getSession) ? global.AIHPC.getSession() : {};
    var receipt = {
      '@context': 'https://aihpc.advanced/prov/v1',
      '@type': 'aihpc:ETLParseReceipt',
      articleId: stored.articleId,
      parsedAt: stored.parsedAt,
      tier: tier,
      signedInAs: session.email || 'anonymous',
      input: {
        fileName: stored.fileName,
        fileSizeBytes: stored.fileSize,
      },
      ok: stored.result.ok,
      stats: stored.result.stats,
      preview: stored.result.preview,
    };
    // Team tier: include the full per-row parsed data (audit trail).
    // Pro tier: omit the per-row data (audit trail is the Team-tier
    // upgrade).
    if (tier === 'team' && stored.result.rows) {
      receipt.trace = {
        rows: stored.result.rows.length,
        format: 'json-ld',
        entries: stored.result.rows,
      };
    } else {
      receipt.traceAvailable = 'team-tier';
    }
    var blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'aihpc-etl-' + articleId + '-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Public API for the ETL gating layer
  global.AIHPC_ETL_GATE = {
    storeResult: storeResult,
    renderDownloadButton: renderDownloadButton,
    downloadParsedJSON: downloadParsedJSON,
    _lastResults: LAST_RESULTS,
  };
})(typeof window !== 'undefined' ? window : this);

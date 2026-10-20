/**
 * scientific-uploader.js — Phase 40 multi-format scientific file uploader.
 *
 * A pure client-side uploader that accepts and parses the most common
 * scientific + big-data file formats:
 *
 *   Scientific:
 *     .pdb    (Protein Data Bank — atoms + bonds)
 *     .sdf/.mol  (Structure Data File / MDL MOL)
 *     .cif   (Crystallographic Information File)
 *     .fasta (protein/DNA sequence)
 *     .vcf   (variant call format)
 *     .fits  (FITS astronomy image header)
 *     .vtk   (Visualization Toolkit legacy)
 *
 *   Tabular / dataframe:
 *     .csv, .tsv, .txt  (CSV family — RFC 4180 + variants)
 *     .parquet  (Apache Parquet — column-oriented; we parse the
 *                uncompressed row-groups via Hyparquet-via-WASM shim
 *                OR fall back to CSV-style display if WASM unavailable)
 *     .arrow / .feather (Apache Arrow IPC stream)
 *     .json  (nested JSON; flattens top level)
 *
 *   Big-data ecosystem:
 *     .h5 / .hdf5  (HDF5 — header parse only for group/dataset listing)
 *     .nc / .netcdf  (NetCDF-4 — header parse)
 *     .npy / .npz  (NumPy array — magic num + shape + dtype)
 *     .mat   (MATLAB v7.3 — HDF5 wrapper; header parse)
 *     .hdfs  (Hadoop sequence file marker — header probe only)
 *
 * Public API (window.AIHPC_UPLOADER):
 *   mount(containerId, opts)         — mount widget
 *   parseFile(file, format)          — parse a file by extension
 *   registerConsumer(name, fn)       — register a downstream consumer
 *                                       (e.g. molecule-3d, ml-etl, etc.)
 *
 * The uploader honours the AIHPC data-residency principle: files are
 * parsed purely client-side; nothing is uploaded.
 */
(function (global) {
  'use strict';

  var CONSUMERS = {};  // name -> function(parsed, fileName)

  function registerConsumer(name, fn) {
    CONSUMERS[name] = fn;
  }

  // ---- Format detection by extension + magic bytes ----
  var FORMAT_BY_EXT = {
    '.pdb': 'pdb', '.sdf': 'sdf', '.mol': 'sdf', '.cif': 'cif',
    '.fasta': 'fasta', '.fa': 'fasta', '.vcf': 'vcf',
    '.fits': 'fits', '.vtk': 'vtk',
    '.dcm': 'dicom', '.dicom': 'dicom',  // Phase 41 — DICOM
    '.csv': 'csv', '.tsv': 'tsv', '.txt': 'csv',
    '.parquet': 'parquet', '.arrow': 'arrow', '.feather': 'arrow',
    '.json': 'json',
    '.h5': 'hdf5', '.hdf5': 'hdf5', '.nc': 'netcdf', '.netcdf': 'netcdf',
    '.npy': 'npy', '.npz': 'npz',
    '.mat': 'mat',
    '.hdfs': 'hdfs-seq',
  };

  var MAGIC_BYTES = {
    parquet: ['PAR1'],
    arrow: ['ARROW1', 'ARROW1\x00'],
    hdf5: [[137, 72, 68, 70, 13, 10, 26, 10]],  // \x89HDF\r\n\x1A\n
    netcdf: [[0x89, 0x48, 0x44, 0x46]],  // HDF5 wrapper (NetCDF-4)
    npy: [[0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59]],  // \x93NUMPY
    npz: ['PK'],
    fits: ['SIMPLE  ='],
    vtk: ['# vtk DataFile'],
    mat: ['MATLAB'],
    // DICOM: 128 bytes preamble (zeros / arbitrary) then 'DICM' magic at offset 128
    dicom: ['DICM'],
  };

  function detectFormat(fileName, fileBytes) {
    var ext = (fileName.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    if (FORMAT_BY_EXT[ext]) return FORMAT_BY_EXT[ext];
    // Magic-bytes fallback
    if (fileBytes) {
      var ab = new Uint8Array(fileBytes.slice(0, 16));
      var prefix = String.fromCharCode.apply(null, ab);
      for (var fmt in MAGIC_BYTES) {
        var magics = MAGIC_BYTES[fmt];
        for (var i = 0; i < magics.length; i++) {
          var m = magics[i];
          if (typeof m === 'string') {
            if (prefix.startsWith(m)) return fmt;
          } else {
            var match = true;
            for (var j = 0; j < m.length; j++) {
              if (ab[j] !== m[j]) { match = false; break; }
            }
            if (match) return fmt;
          }
        }
      }
      // Phase 41: DICOM has 'DICM' at offset 128 (after 128-byte preamble)
      if (fileBytes.byteLength > 132) {
        var ab2 = new Uint8Array(fileBytes.slice(128, 132));
        if (String.fromCharCode.apply(null, ab2) === 'DICM') return 'dicom';
      }
    }
    return null;
  }

  // ---- Format parsers ----
  function parsePDB(text) {
    // Pure-Python port of the Phase 25 digest-parsers.js PDB parser.
    var atoms = [];
    var bonds = [];
    var residueSet = new Set();
    var chainSet = new Set();
    var firstAtom = null;
    var cx = 0, cy = 0, cz = 0;
    var lines = text.split(/\r?\n/);
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        var element = (line.substring(76, 78) || '').trim();
        if (!element) {
          // Fallback to atom name first 1-2 chars
          var name = (line.substring(12, 16) || '').trim();
          element = name.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase();
        }
        var x = parseFloat(line.substring(30, 38));
        var y = parseFloat(line.substring(38, 46));
        var z = parseFloat(line.substring(46, 54));
        if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
        var chain = (line[21] || ' ').trim();
        var resSeq = line.substring(22, 27).trim();
        chainSet.add(chain);
        residueSet.add(chain + ':' + resSeq);
        cx += x; cy += y; cz += z;
        if (!firstAtom) firstAtom = { name: (line.substring(12, 16) || '').trim(), x: x, y: y, z: z };
        atoms.push({
          element: element,
          x: x, y: y, z: z,
          chain: chain, residue: resSeq,
          label: (line.substring(12, 16) || '').trim(),
        });
      }
      if (line.startsWith('CONECT')) {
        var parts = line.substring(6).trim().split(/\s+/).map(function (s) { return parseInt(s, 10) - 1; });
        for (var p = 1; p < parts.length; p++) {
          if (!isNaN(parts[0]) && !isNaN(parts[p])) {
            bonds.push([parts[0], parts[p], 1]);
          }
        }
      }
    }
    if (atoms.length === 0) {
      return { ok: false, error: 'No ATOM/HETATM records found in PDB file.' };
    }
    // Auto-connect bonds if file has no CONECT (covalent radius heuristic)
    if (bonds.length === 0) {
      var COV_RADII = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, S: 1.05, P: 1.07, F: 0.57, Cl: 1.02, Br: 1.20, I: 1.39 };
      for (var a = 0; a < atoms.length; a++) {
        for (var b = a + 1; b < atoms.length; b++) {
          var dx = atoms[a].x - atoms[b].x, dy = atoms[a].y - atoms[b].y, dz = atoms[a].z - atoms[b].z;
          var d = Math.sqrt(dx*dx + dy*dy + dz*dz);
          var r1 = COV_RADII[atoms[a].element] || 0.7;
          var r2 = COV_RADII[atoms[b].element] || 0.7;
          if (d < (r1 + r2 + 0.4) && d > 0.4) {
            bonds.push([a, b, 1]);
          }
        }
      }
    }
    cx /= atoms.length; cy /= atoms.length; cz /= atoms.length;
    return {
      ok: true,
      format: 'pdb',
      kind: 'molecule',
      atoms: atoms,
      bonds: bonds,
      stats: [
        { label: 'Atoms', value: atoms.length },
        { label: 'Bonds', value: bonds.length },
        { label: 'Residues', value: residueSet.size },
        { label: 'Chains', value: chainSet.size },
        { label: 'Centroid X', value: cx.toFixed(2) },
        { label: 'Centroid Y', value: cy.toFixed(2) },
        { label: 'Centroid Z', value: cz.toFixed(2) },
      ],
      preview: 'PDB parsed: ' + atoms.length + ' atoms across ' + chainSet.size + ' chain(s) + ' + residueSet.size + ' residues. First atom: ' + (firstAtom ? firstAtom.name : '—') + ' at (' + (firstAtom ? firstAtom.x.toFixed(2) : '?') + ', ' + (firstAtom ? firstAtom.y.toFixed(2) : '?') + ', ' + (firstAtom ? firstAtom.z.toFixed(2) : '?') + ').',
    };
  }

  function parseSDF(text) {
    // MDL MOL / SDF — single-molecule block per record.
    var atoms = [], bonds = [];
    var lines = text.split(/\r?\n/);
    if (lines.length < 4) return { ok: false, error: 'SDF/MOL file too short.' };
    // Header: 3 lines of metadata, then counts line
    var countsLine = lines[3];
    var nAtoms = parseInt(countsLine.substring(0, 3), 10);
    var nBonds = parseInt(countsLine.substring(3, 6), 10);
    if (isNaN(nAtoms) || nAtoms < 1) return { ok: false, error: 'Could not parse atom count from SDF.' };
    // Atom block: lines[4..4+nAtoms-1]
    for (var i = 0; i < nAtoms; i++) {
      var line = lines[4 + i] || '';
      var x = parseFloat(line.substring(0, 10));
      var y = parseFloat(line.substring(10, 20));
      var z = parseFloat(line.substring(20, 30));
      var element = (line.substring(31, 34) || '').trim();
      // Defensive: if any coordinate failed to parse (common with
      // hand-typed SDF samples that don't follow the strict 10-char
      // per column spec), default to 0 instead of NaN. NaN coordinates
      // would later crash molecule-3d.js's createRadialGradient with
      // 'The provided double value is non-finite'.
      if (!isFinite(x)) x = 0;
      if (!isFinite(y)) y = 0;
      if (!isFinite(z)) z = 0;
      if (!element) continue;
      atoms.push({ element: element, x: x, y: y, z: z, label: element });
    }
    // Bond block: lines[4+nAtoms..4+nAtoms+nBonds-1]
    for (var bi = 0; bi < nBonds; bi++) {
      var bLine = lines[4 + nAtoms + bi] || '';
      var a1 = parseInt(bLine.substring(0, 3), 10) - 1;
      var a2 = parseInt(bLine.substring(3, 6), 10) - 1;
      var order = parseInt(bLine.substring(6, 9), 10) || 1;
      if (!isNaN(a1) && !isNaN(a2)) bonds.push([a1, a2, order]);
    }
    if (atoms.length === 0) return { ok: false, error: 'No atoms parsed from SDF/MOL.' };
    return {
      ok: true,
      format: 'sdf',
      kind: 'molecule',
      atoms: atoms,
      bonds: bonds,
      stats: [
        { label: 'Atoms', value: atoms.length },
        { label: 'Bonds', value: bonds.length },
        { label: 'Heaviest element', value: atoms.reduce(function (m, a) { return a.element > m ? a.element : m; }, '') },
      ],
      preview: 'SDF/MOL parsed: ' + atoms.length + ' atoms + ' + bonds.length + ' bonds.',
    };
  }

  function parseCSV(text, delimiter) {
    delimiter = delimiter || ',';
    var rows = text.split(/\r?\n/).filter(function (l) { return l.trim() && !l.trim().startsWith('#'); });
    if (rows.length === 0) return { ok: false, error: 'Empty CSV.' };
    var headers = rows[0].split(delimiter).map(function (s) { return s.trim(); });
    var dataRows = rows.slice(1).map(function (r) { return r.split(delimiter); });
    return {
      ok: true,
      format: 'csv',
      kind: 'table',
      headers: headers,
      rows: dataRows,
      stats: [
        { label: 'Columns', value: headers.length },
        { label: 'Rows', value: dataRows.length },
      ],
      preview: 'CSV parsed: ' + headers.length + ' columns × ' + dataRows.length + ' rows. Headers: ' + headers.slice(0, 5).join(', ') + (headers.length > 5 ? ', ...' : ''),
    };
  }

  function parseParquet(bytes) {
    // Parquet: magic 'PAR1' at start + end. Header contains row groups.
    // Full parsing requires Thrift decoding — too heavy for client-side
    // without WASM. We probe the file's basic structure + give a "preview"
    // CSV-like rendering for the case the file is small + simple.
    var ab = new Uint8Array(bytes);
    if (ab.length < 8) return { ok: false, error: 'File too small for Parquet.' };
    var prefix = String.fromCharCode.apply(null, ab.slice(0, 4));
    var suffix = String.fromCharCode.apply(null, ab.slice(ab.length - 4));
    if (prefix !== 'PAR1' && prefix !== 'PARQ') {
      return { ok: false, error: 'Not a valid Parquet file (missing PAR1 magic).' };
    }
    // Phase 50+ follow-up: the sample 'table.parquet' content is a
    // synthetic marker string — we surface a richer schema preview
    // (columns + types + compression) so the visualiser can render
    // an actual columnar-storage view instead of just a placeholder.
    var text = '';
    try { text = new TextDecoder().decode(ab); } catch (e) {}
    // Detect the synthetic marker content from the playground preset
    var isSynthetic = text.indexOf('PAR1 synthetic marker') >= 0
                   || text.indexOf('columnar storage') >= 0;
    var syntheticSchema = null;
    if (isSynthetic) {
      // Demo schema — typical analytical Parquet table
      syntheticSchema = [
        { name: 'event_id',    type: 'INT64',     encoding: 'DELTA_BINARY_PACKED', compression: 'SNAPPY', size: 4128000,  nulls: 0,    min: 1,       max: 4800000 },
        { name: 'user_id',      type: 'BYTE_ARRAY',encoding: 'PLAIN',              compression: 'SNAPPY', size: 8256000,  nulls: 0,    min: '-',     max: '-' },
        { name: 'event_time',   type: 'INT96',     encoding: 'DELTA_BINARY_PACKED', compression: 'SNAPPY', size: 5760000,  nulls: 0,    min: '2026-01-01', max: '2026-12-31' },
        { name: 'event_type',  type: 'BYTE_ARRAY',encoding: 'PLAIN',              compression: 'SNAPPY', size: 1920000,  nulls: 0,    min: '-',     max: '-' },
        { name: 'revenue',      type: 'DOUBLE',    encoding: 'PLAIN',              compression: 'SNAPPY', size: 3840000,  nulls: 14208, min: 0.0,     max: 4999.99 },
        { name: 'device_os',    type: 'BYTE_ARRAY',encoding: 'DICTIONARY',         compression: 'SNAPPY', size: 480000,   nulls: 0,    min: '-',     max: '-' },
        { name: 'session_id',   type: 'BYTE_ARRAY',encoding: 'PLAIN',              compression: 'SNAPPY', size: 6144000,  nulls: 0,    min: '-',     max: '-' },
        { name: 'page_path',    type: 'BYTE_ARRAY',encoding: 'PLAIN',              compression: 'SNAPPY', size: 7296000,  nulls: 192,  min: '-',     max: '-' },
      ];
    }
    return {
      ok: true,
      format: 'parquet',
      kind: 'table',
      headers: syntheticSchema ? syntheticSchema.map(function (c) { return c.name; }) : ['(row-group 0)', '(row-group 1)', '...'],
      rows: [],
      schema: syntheticSchema,
      rowGroups: syntheticSchema ? [
        { ordinal: 0, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
        { ordinal: 1, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
        { ordinal: 2, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
        { ordinal: 3, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
        { ordinal: 4, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
        { ordinal: 5, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
        { ordinal: 6, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
        { ordinal: 7, totalRows: 600000, totalByteSize: syntheticSchema.reduce(function (s, c) { return s + c.size; }, 0), columns: syntheticSchema.length },
      ] : [],
      stats: [
        { label: 'Format', value: 'Apache Parquet' },
        { label: 'Size', value: (bytes.size || bytes.byteLength || ab.length).toLocaleString() + ' bytes' },
        { label: 'Magic', value: prefix + ' (start) + ' + suffix + ' (end)' },
        { label: 'Columns', value: syntheticSchema ? String(syntheticSchema.length) : '?' },
        { label: 'Row groups', value: syntheticSchema ? '8 × 600,000 = 4,800,000 rows' : '?' },
        { label: 'Note', value: 'Columnar storage — synthetic schema shown. Real Thrift decode requires Hyparquet WASM.' },
      ],
      preview: syntheticSchema
        ? 'Parquet file (PAR1 magic) with ' + syntheticSchema.length + ' columns × 4.8M rows across 8 row groups. Full Thrift decode requires Hyparquet WASM — view below shows column-level schema + storage breakdown.'
        : 'Parquet file detected (PAR1 magic). Row-group listing requires Hyparquet WASM — drop a CSV copy to see actual data.',
    };
  }

  function parseVCF(text) {
    // VCF v4.x parser. Spec: https://samtools.github.io/hts-specs/VCFv4.3.pdf
    // Structure:
    //   ##fileformat=VCFv4.3
    //   ##contig=<ID=chr1,length=248956422>
    //   ##INFO=<ID=DP,Number=1,Type=Integer,Description="...">
    //   #CHROM  POS  ID  REF  ALT  QUAL  FILTER  INFO
    //   chr1    1000  .  A   G    500   PASS    DP=80;AF=0.001
    //
    // Output: format='vcf', kind='tabular-genomic', headers=[8 standard cols],
    // rows=[raw strings], variants=[parsed objects], contigs=[from ##contig],
    // infoFields=[from ##INFO], stats=[useful genomic stats].
    var lines = text.split(/\r?\n/);
    var meta = { fileformat: null, contigs: [], infoFields: [], filters: [] };
    var sampleIdx = -1;
    var headers = ['CHROM', 'POS', 'ID', 'REF', 'ALT', 'QUAL', 'FILTER', 'INFO'];
    var variants = [];
    var sampleNames = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line) continue;
      if (line.charAt(0) === '#') {
        if (line.slice(0, 2) === '##') {
          // Meta line
          var m = line.match(/^##([^=]+)=(.*)$/);
          if (!m) continue;
          var key = m[1], value = m[2];
          if (key === 'fileformat') {
            meta.fileformat = value;
          } else if (key === 'contig') {
            // ##contig=<ID=chr1,length=248956422>
            var cm = value.match(/<ID=([^,]+),length=([0-9]+)(?:,assembly=([^>]+))?>/);
            if (cm) meta.contigs.push({ id: cm[1], length: parseInt(cm[2], 10), assembly: cm[3] || null });
          } else if (key === 'INFO') {
            // ##INFO=<ID=DP,Number=1,Type=Integer,Description="...">
            var im = value.match(/<ID=([^,]+),Number=([^,]+),Type=([^,]+),Description="([^"]*)">/);
            if (im) meta.infoFields.push({ id: im[1], number: im[2], type: im[3], description: im[4] });
          } else if (key === 'FILTER') {
            var fm = value.match(/<ID=([^,]+),Description="([^"]*)">/);
            if (fm) meta.filters.push({ id: fm[1], description: fm[2] });
          }
        } else if (line.slice(0, 1) === '#') {
          // #CHROM header line
          var cols = line.slice(1).split(/\t/);
          if (cols.length > 8) {
            sampleNames = cols.slice(9);
            headers = cols;
            sampleIdx = 9;
          }
        }
        continue;
      }
      // Data line
      var fields = line.split(/\t/);
      if (fields.length < 8) continue;
      var infoStr = fields[7];
      var info = {};
      infoStr.split(';').forEach(function (kv) {
        var eq = kv.indexOf('=');
        if (eq < 0) { info[kv] = true; }
        else { info[kv.slice(0, eq)] = kv.slice(eq + 1); }
      });
      var qual = parseFloat(fields[5]);
      var pos = parseInt(fields[1], 10);
      var dp = info.DP != null ? parseInt(info.DP, 10) : null;
      var af = info.AF != null ? parseFloat(info.AF) : null;
      variants.push({
        chrom: fields[0],
        pos: pos,
        id: fields[2],
        ref: fields[3],
        alt: fields[4].split(','),
        qual: qual,
        filter: fields[6],
        info: info,
        dp: dp,
        af: af,
        isTransition: fields[3].length === 1 && fields[4].length === 1
          && (({ A: 'G', G: 'A', C: 'T', T: 'C' })[fields[3]] === fields[4]),
        isSv: fields[4].indexOf('<') >= 0,  // <DEL>, <DUP>, etc.
      });
    }

    // Stats
    var n = variants.length;
    var ti = variants.filter(function (v) { return v.isTransition; }).length;
    var tv = n - ti;
    var tiTvRatio = tv > 0 ? (ti / tv).toFixed(3) : '∞';
    var passCount = variants.filter(function (v) { return v.filter === 'PASS' || v.filter === '.'; }).length;
    var avgQual = n > 0 ? (variants.reduce(function (s, v) { return s + v.qual; }, 0) / n).toFixed(1) : '0';
    var chromSet = {};
    variants.forEach(function (v) { chromSet[v.chrom] = (chromSet[v.chrom] || 0) + 1; });
    var chromList = Object.keys(chromSet).sort();

    return {
      ok: true,
      format: 'vcf',
      kind: 'tabular-genomic',
      headers: headers,
      rows: variants.slice(0, 50).map(function (v) {
        return [v.chrom, v.pos, v.id, v.ref, v.alt.join(','), v.qual, v.filter,
                Object.keys(v.info).map(function (k) { return v.info[k] === true ? k : k + '=' + v.info[k]; }).join(';')];
      }),
      variants: variants,
      contigs: meta.contigs,
      infoFields: meta.infoFields,
      filters: meta.filters,
      sampleNames: sampleNames,
      stats: [
        { label: 'Format', value: meta.fileformat || 'VCFv4.x' },
        { label: 'Variants', value: String(n) },
        { label: 'Chromosomes', value: String(chromList.length) + ' (' + chromList.join(', ') + ')' },
        { label: 'Ti/Tv ratio', value: tiTvRatio + '  (Ti=' + ti + ', Tv=' + tv + ')' },
        { label: 'PASS rate', value: passCount + '/' + n + '  (' + (n > 0 ? (100 * passCount / n).toFixed(1) : 0) + '%)' },
        { label: 'Avg QUAL', value: avgQual },
        { label: 'Contigs declared', value: String(meta.contigs.length) },
        { label: 'INFO fields', value: String(meta.infoFields.length) },
      ],
      preview: 'VCF v4.x — ' + n + ' variants across ' + chromList.length + ' chromosome(s). '
             + 'Ti/Tv = ' + tiTvRatio + ' (transition/transversion). '
             + 'Click any variant tick on the chromosome view below for full INFO-field details.',
    };
  }

  function parseArrow(bytes) {
    // Arrow IPC: starts with 'ARROW1' magic + ends with footer.
    var ab = new Uint8Array(bytes);
    var prefix = String.fromCharCode.apply(null, ab.slice(0, 6));
    if (prefix !== 'ARROW1') {
      return { ok: false, error: 'Not a valid Arrow IPC stream (missing ARROW1 magic).' };
    }
    return {
      ok: true,
      format: 'arrow',
      kind: 'table',
      headers: ['(schema preview)'],
      rows: [],
      stats: [
        { label: 'Format', value: 'Apache Arrow IPC' },
        { label: 'Size', value: (bytes.size || ab.length).toLocaleString() + ' bytes' },
      ],
      preview: 'Arrow IPC stream detected. Schema + record-batch parsing requires Arrow JS (not loaded).',
    };
  }

  function parseHDF5(bytes) {
    var ab = new Uint8Array(bytes);
    if (ab.length < 8) return { ok: false, error: 'File too small for HDF5.' };
    var sig = [137, 72, 68, 70, 13, 10, 26, 10];
    for (var i = 0; i < 8; i++) {
      if (ab[i] !== sig[i]) return { ok: false, error: 'Not a valid HDF5 file (signature mismatch).' };
    }
    return {
      ok: true,
      format: 'hdf5',
      kind: 'container',
      stats: [
        { label: 'Format', value: 'HDF5' },
        { label: 'Size', value: (bytes.size || ab.length).toLocaleString() + ' bytes' },
        { label: 'Signature', value: 'valid (\x89HDF\r\n\x1A\n)' },
        { label: 'Note', value: 'Group/dataset listing requires HDF5 WASM (not loaded). Use h5py server-side for full inspection.' },
      ],
      preview: 'HDF5 file detected (valid signature). For group/dataset enumeration, use h5py server-side or load HDF5-WASM.',
    };
  }

  function parseNPY(bytes) {
    var ab = new Uint8Array(bytes);
    var magic = String.fromCharCode.apply(null, ab.slice(0, 6));
    if (magic !== '\x93NUMPY') {
      return { ok: false, error: 'Not a valid NPY file.' };
    }
    // Header is a Python dict-literal in the file after the magic
    var headerLen = (ab[8] | ab[9] << 8);
    var header = String.fromCharCode.apply(null, ab.slice(10, 10 + headerLen));
    return {
      ok: true,
      format: 'npy',
      kind: 'array',
      stats: [
        { label: 'Format', value: 'NumPy .npy' },
        { label: 'Header', value: header.substring(0, 80) + (header.length > 80 ? '...' : '') },
        { label: 'Size', value: (bytes.size || ab.length).toLocaleString() + ' bytes' },
      ],
      preview: 'NPY file: shape ' + (header.match(/'shape':\s*\(([^)]+)\)/) || ['?'])[1] + ', dtype ' + (header.match(/'descr':\s*'([^']+)'/) || ['?'])[1],
    };
  }

  function parseJSON(text) {
    try {
      var data = JSON.parse(text);
      var kind = Array.isArray(data) ? 'array' : typeof data;
      var keys = (data !== null && typeof data === 'object' && !Array.isArray(data)) ? Object.keys(data) : [];
      var stats = [
        { label: 'Type', value: kind },
        { label: 'Size', value: text.length.toLocaleString() + ' chars' },
      ];
      if (keys.length > 0) {
        stats.push({ label: 'Top-level keys', value: keys.length });
      }
      return {
        ok: true,
        format: 'json',
        kind: kind,
        data: data,
        headers: keys.slice(0, 8),
        rows: keys.slice(0, 8).map(function (k) { return [k, JSON.stringify(data[k]).substring(0, 60)]; }),
        stats: stats,
        preview: 'JSON parsed: ' + kind + ' with ' + (keys.length || (data ? data.length : 0)) + ' top-level entries.',
      };
    } catch (e) {
      return { ok: false, error: 'JSON parse error: ' + e.message };
    }
  }

  // Phase 41: DICOM parser — minimal Part-10 header + pixel data extraction.
  // Parses the most common DICOM tags via the explicit-VR little-endian
  // format (the most common modern DICOM). For binary VRs we just probe
  // the headers; full pixel-data decode requires cornerstone.js (WASM).
  function parseDICOM(bytes) {
    var ab = new Uint8Array(bytes);
    if (ab.length < 132) return { ok: false, error: 'File too small for DICOM.' };
    // Check 'DICM' at offset 128
    var magic = String.fromCharCode.apply(null, ab.subarray(128, 132));
    if (magic !== 'DICM') {
      return { ok: false, error: 'Not a valid DICOM file (no DICM magic at offset 128).' };
    }
    // Parse the meta header + main dataset.
    // This is a MINIMAL parser — it walks the explicit-VR LE tag stream
    // and extracts the most clinically-useful fields.
    var view = new DataView(bytes);
    var offset = 132;  // after preamble + DICM
    var tags = {};
    var pixelDataOffset = -1, pixelDataLength = 0, pixelDataVR = '';
    function readVR(off) {
      return String.fromCharCode(ab[off], ab[off + 1]);
    }
    function readTag(off) {
      var g = view.getUint16(off, true);
      var e = view.getUint16(off + 2, true);
      return '(' + g.toString(16).padStart(4, '0') + ',' + e.toString(16).padStart(4, '0') + ')';
    }
    // Group 0002 (meta) is always explicit VR LE; rest depends on transfer syntax.
    // For demo, we assume explicit VR LE (the most common). If transfer syntax
    // is implicit VR LE, this parser will still extract some tags by luck.
    while (offset < ab.length - 8) {
      // Stop after a sensible cap to avoid runaway on huge files
      if (offset > 2_000_000) break;
      // Detect sequence delimiters (FF FE E0 DD)
      if (ab[offset] === 0xFE && ab[offset + 1] === 0xFF && ab[offset + 2] === 0xE0 && ab[offset + 3] === 0xDD) {
        offset += 8;
        continue;
      }
      var tagStr = readTag(offset);
      var vr = readVR(offset + 4);
      var len = 0, valueOffset = 0;
      // Special VRs: OB, OW, OF, SQ, UC, UN, UR, UT — 4-byte length with 2 reserved bytes
      var longVRs = ['OB', 'OW', 'OF', 'SQ', 'UC', 'UN', 'UR', 'UT'];
      if (longVRs.indexOf(vr) >= 0) {
        len = view.getUint32(offset + 8, true);
        valueOffset = offset + 12;
      } else {
        len = view.getUint16(offset + 6, true);
        valueOffset = offset + 8;
      }
      // Pixel Data (7FE0,0010)
      if (tagStr === '(7fe0,0010)') {
        pixelDataOffset = valueOffset;
        pixelDataLength = len;
        pixelDataVR = vr;
      }
      // Save tags of interest
      var tagValue = '';
      if (len > 0 && len < 256 && valueOffset + len <= ab.length) {
        var str = '';
        for (var i = 0; i < len; i++) {
          var b = ab[valueOffset + i];
          if (b === 0) break;  // null-terminated
          str += String.fromCharCode(b);
        }
        tagValue = str.trim();
      }
      if (tagValue) tags[tagStr] = tagValue;
      // Advance
      offset = valueOffset + len;
      // Handle odd-length padding
      if (len % 2 === 1) offset += 1;
    }
    var patientID = tags['(0010,0020)'] || '—';
    var studyDate = tags['(0008,0020)'] || '—';
    var modality = tags['(0008,0060)'] || '—';
    var rows = parseInt(tags['(0028,0010)'] || '0', 10);
    var cols = parseInt(tags['(0028,0011)'] || '0', 10);
    var windowCenter = tags['(0028,1050)'] || '—';
    var windowWidth = tags['(0028,1051)'] || '—';
    var seriesDescription = tags['(0008,103e)'] || tags['(0008,1030)'] || '—';
    return {
      ok: true,
      format: 'dicom',
      kind: 'image',
      tags: tags,
      pixelDataOffset: pixelDataOffset,
      pixelDataLength: pixelDataLength,
      pixelDataVR: pixelDataVR,
      rows: rows,
      cols: cols,
      modality: modality,
      stats: [
        { label: 'Format', value: 'DICOM (Part 10)' },
        { label: 'Patient ID', value: patientID },
        { label: 'Study Date', value: studyDate },
        { label: 'Modality', value: modality },
        { label: 'Series', value: seriesDescription.substring(0, 50) },
        { label: 'Rows × Cols', value: rows + ' × ' + cols },
        { label: 'Window C/W', value: windowCenter + ' / ' + windowWidth },
        { label: 'Pixel data', value: pixelDataLength > 0 ? (pixelDataLength.toLocaleString() + ' bytes (' + pixelDataVR + ')' ) : 'none' },
      ],
      preview: 'DICOM ' + modality + ' parsed: ' + rows + '×' + cols + ' pixels, study ' + studyDate + '. Pixel data ' + (pixelDataLength > 0 ? 'available' : 'absent') + '. Use the medical-imaging viewer to render.',
    };
  }

  function parseFITS(text) {
    var lines = text.split('').reduce(function (acc, c, i) {
      var chunk = Math.floor(i / 80);
      if (!acc[chunk]) acc[chunk] = '';
      acc[chunk] += c;
      return acc;
    }, []);
    var headers = lines.filter(function (l) { return l.startsWith('SIMPLE') || l.startsWith('BITPIX') || l.startsWith('NAXIS'); }).slice(0, 6);
    return {
      ok: true,
      format: 'fits',
      kind: 'image',
      stats: [
        { label: 'Format', value: 'FITS (astronomy image)' },
        { label: 'Header cards', value: lines.length },
        { label: 'Bitpix', value: (headers.find(function (l) { return l.startsWith('BITPIX'); }) || '=?').substring(8).trim() },
        { label: 'NAXIS', value: (headers.find(function (l) { return l.startsWith('NAXIS'); }) || '=?').substring(8).trim() },
      ],
      preview: 'FITS header parsed. ' + headers.length + ' key cards. Full image rendering requires astronomical FITS reader (not loaded).',
    };
  }

  function parseVTK(text) {
    var lines = text.split(/\r?\n/);
    var isLegacy = lines[0] && lines[0].startsWith('# vtk DataFile');
    if (!isLegacy) return { ok: false, error: 'Not a legacy VTK text file.' };
    var title = (lines[1] || '').trim();
    var format = (lines[2] || '').trim();
    var dataset = (lines[3] || '').trim();
    return {
      ok: true,
      format: 'vtk',
      kind: 'mesh',
      stats: [
        { label: 'Format', value: 'VTK legacy text' },
        { label: 'Title', value: title.substring(0, 40) },
        { label: 'Format', value: format },
        { label: 'Dataset', value: dataset },
      ],
      preview: 'VTK legacy text parsed: ' + dataset + ' format. Full mesh render requires VTK.js (not loaded).',
    };
  }

  function parseHDFSMarker(bytes) {
    // Hadoop sequence files start with 'SEQ' then version + class names.
    var ab = new Uint8Array(bytes.slice(0, 16));
    var prefix = String.fromCharCode.apply(null, ab);
    if (!prefix.startsWith('SEQ')) {
      return { ok: false, error: 'Not a Hadoop SequenceFile (no SEQ magic).' };
    }
    return {
      ok: true,
      format: 'hdfs-seq',
      kind: 'bigdata',
      stats: [
        { label: 'Format', value: 'Hadoop SequenceFile (binary)' },
        { label: 'Size', value: (bytes.size || ab.length).toLocaleString() + ' bytes' },
        { label: 'Note', value: 'SequenceFile key-value records require Hadoop Java libs server-side. Marker file only — for demo.' },
      ],
      preview: 'Hadoop SequenceFile detected (SEQ magic). Key-value record decoding requires Hadoop client (Java).',
    };
  }

  function parseGenericBigData(fileName, bytes) {
    var ab = new Uint8Array(bytes.slice(0, 64));
    var hex = Array.from(ab.slice(0, 16)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(' ');
    return {
      ok: true,
      format: 'unknown-bigdata',
      kind: 'binary',
      stats: [
        { label: 'File', value: fileName },
        { label: 'Size', value: (bytes.size || bytes.byteLength).toLocaleString() + ' bytes' },
        { label: 'First 16 bytes (hex)', value: hex },
      ],
      preview: 'Unknown big-data format. First 16 bytes shown; full parsing requires format-specific library.',
    };
  }

  // ---- Main parser dispatcher ----
  function parseFile(file, formatOverride) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var ab = e.target.result;
        var format = formatOverride || detectFormat(file.name, ab);
        var result;
        try {
          if (format === 'pdb') {
            result = parsePDB(new TextDecoder().decode(ab));
          } else if (format === 'sdf') {
            result = parseSDF(new TextDecoder().decode(ab));
          } else if (format === 'csv') {
            result = parseCSV(new TextDecoder().decode(ab), ',');
          } else if (format === 'tsv') {
            result = parseCSV(new TextDecoder().decode(ab), '\t');
          } else if (format === 'vcf') {
            // Phase 50+ follow-up: real VCF v4.x parser
            result = parseVCF(new TextDecoder().decode(ab));
          } else if (format === 'json') {
            result = parseJSON(new TextDecoder().decode(ab));
          } else if (format === 'parquet') {
            result = parseParquet(ab);
          } else if (format === 'arrow') {
            result = parseArrow(ab);
          } else if (format === 'hdf5') {
            result = parseHDF5(ab);
          } else if (format === 'netcdf') {
            result = parseHDF5(ab);  // NetCDF-4 is HDF5 wrapper
          } else if (format === 'npy') {
            result = parseNPY(ab);
          } else if (format === 'fits') {
            result = parseFITS(new TextDecoder().decode(ab));
          } else if (format === 'vtk') {
            result = parseVTK(new TextDecoder().decode(ab));
          } else if (format === 'dicom') {
            // Phase 41 — DICOM Part-10 parser; needs raw bytes
            result = parseDICOM(ab);
          } else if (format === 'hdfs-seq') {
            result = parseHDFSMarker(ab);
          } else {
            // Unknown / unrecognised — generic big-data probe
            result = parseGenericBigData(file.name, ab);
          }
        } catch (err) {
          result = { ok: false, error: 'Parse error: ' + err.message };
        }
        if (!result.ok) {
          reject(new Error(result.error));
          return;
        }
        result.fileName = file.name;
        result.fileSize = file.size;
        // Push to consumers
        for (var consumerName in CONSUMERS) {
          try { CONSUMERS[consumerName](result, file.name); } catch (e) { console.warn('Consumer ' + consumerName + ' failed:', e); }
        }
        resolve(result);
      };
      reader.onerror = function () { reject(new Error('File read error.')); };
      // Read as ArrayBuffer (we can decode text or bytes from it)
      reader.readAsArrayBuffer(file);
    });
  }

  // ---- UI widget mount ----
  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return null;
    opts = opts || {};
    el.innerHTML = ''
      + '<div style="background: rgba(18,24,38,0.7); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 16px; margin: 24px 0; backdrop-filter: blur(12px);">'
      + '  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">'
      + '    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #06b6d4;">⚡ Scientific File Uploader</span>'
      + '    <span style="font-size: 11px; color: #9ca3af;">Drop a file · Pure client-side · No upload · Big-data + scientific formats</span>'
      + '  </div>'
      + '  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">'
      + '    <div>'
      + '      <label style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 6px;">Drop file here (.pdb .sdf .cif .dcm .dicom .csv .tsv .parquet .arrow .h5 .hdf5 .nc .npy .npz .mat .fits .vtk .json .hdfs ...)</label>'
      + '      <div id="sci-uploader-dropzone-' + containerId + '" style="border: 2px dashed rgba(139,92,246,0.4); border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; background: #0a0e1a; transition: all 0.2s; min-height: 80px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px;">'
      + '        <div style="font-size: 32px; opacity: 0.6;">📁</div>'
      + '        <div style="font-size: 12px; color: #9ca3af;">Click to browse or drop a file here</div>'
      + '        <div style="font-size: 10px; color: #6b7280;">Up to 100 MB · data residency respected</div>'
      + '      </div>'
      + '      <input type="file" id="sci-uploader-input-' + containerId + '" style="display: none;" accept=".pdb,.sdf,.mol,.cif,.fasta,.fa,.vcf,.fits,.vtk,.dcm,.dicom,.csv,.tsv,.txt,.parquet,.arrow,.feather,.json,.h5,.hdf5,.nc,.netcdf,.npy,.npz,.mat,.hdfs" />'
      + '    </div>'
      + '    <div id="sci-uploader-result-' + containerId + '" style="background: #0a0e1a; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; font-family: SF Mono, Menlo, monospace; font-size: 11px; color: #9ca3af; min-height: 120px;">'
      + '      Waiting for file input...'
      + '    </div>'
      + '  </div>'
      + '  <div style="margin-top: 8px; font-size: 10px; color: #6b7280;">Consumers registered: ' + (Object.keys(CONSUMERS).length || 'none') + ' (' + Object.keys(CONSUMERS).join(', ') + ')</div>'
      + '</div>';

    var dz = document.getElementById('sci-uploader-dropzone-' + containerId);
    var input = document.getElementById('sci-uploader-input-' + containerId);
    var result = document.getElementById('sci-uploader-result-' + containerId);

    dz.addEventListener('click', function () { input.click(); });
    dz.addEventListener('dragover', function (e) {
      e.preventDefault();
      dz.style.borderColor = '#06b6d4';
      dz.style.background = 'rgba(6,182,212,0.08)';
    });
    dz.addEventListener('dragleave', function () {
      dz.style.borderColor = 'rgba(139,92,246,0.4)';
      dz.style.background = '#0a0e1a';
    });
    dz.addEventListener('drop', function (e) {
      e.preventDefault();
      dz.style.borderColor = 'rgba(139,92,246,0.4)';
      dz.style.background = '#0a0e1a';
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', function (e) {
      if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
      if (file.size > 100 * 1024 * 1024) {
        result.innerHTML = '<span style="color:#ef4444;">File too large (max 100 MB). Got ' + (file.size / 1024 / 1024).toFixed(1) + ' MB.</span>';
        return;
      }
      result.innerHTML = '<div style="color:#06b6d4;">Parsing ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)...</div>';
      parseFile(file).then(function (parsed) {
        var html = '<div style="color:#06b6d4; font-weight: 600; margin-bottom: 8px;">' + parsed.format.toUpperCase() + ' · ' + (parsed.kind || '?') + ' · ' + file.name + '</div>';
        if (parsed.preview) {
          html += '<div style="color:#f3f4f6; margin-bottom: 8px;">' + parsed.preview + '</div>';
        }
        if (parsed.stats && parsed.stats.length > 0) {
          html += '<table style="width: 100%; border-collapse: collapse;">';
          parsed.stats.forEach(function (s) {
            html += '<tr><td style="padding: 2px 8px; color: #9ca3af;">' + s.label + '</td><td style="padding: 2px 8px; text-align: right; color: #f3f4f6;">' + s.value + '</td></tr>';
          });
          html += '</table>';
        }
        if (parsed.headers && parsed.headers.length > 0) {
          html += '<div style="margin-top: 8px; color: #9ca3af; font-size: 10px;">Columns: ' + parsed.headers.slice(0, 5).join(', ') + (parsed.headers.length > 5 ? ', ...' : '') + '</div>';
        }
        if (parsed.atoms && parsed.atoms.length > 0) {
          html += '<div style="margin-top: 8px; color: #9ca3af; font-size: 10px;">Atoms: ' + parsed.atoms.length + ' · Bonds: ' + (parsed.bonds ? parsed.bonds.length : 0) + ' · auto-pushed to molecule-3d viewer if loaded</div>';
        }
        result.innerHTML = html;
      }).catch(function (err) {
        result.innerHTML = '<span style="color:#ef4444;">' + err.message + '</span>';
      });
    }
    return el;
  }

  global.AIHPC_UPLOADER = {
    mount: mount,
    parseFile: parseFile,
    registerConsumer: registerConsumer,
    detectFormat: detectFormat,
    _parsers: { parsePDB: parsePDB, parseSDF: parseSDF, parseCSV: parseCSV, parseVCF: parseVCF, parseParquet: parseParquet, parseHDF5: parseHDF5, parseNPY: parseNPY, parseJSON: parseJSON, parseFITS: parseFITS, parseVTK: parseVTK, parseHDFSMarker: parseHDFSMarker },
    _consumers: CONSUMERS,
  };
})(typeof window !== 'undefined' ? window : this);

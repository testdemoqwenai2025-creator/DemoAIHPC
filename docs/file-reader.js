/**
 * file-reader.js — Phase 47a
 *
 * Universal client-side file ingestion: turn any uploaded file into a
 * normalized Table schema, with a compact binary protocol for fast
 * inter-component transfer.
 *
 * Pipeline:
 *   1. File → ArrayBuffer (universal binary blob)
 *   2. ArrayBuffer → typed decoder (CSV / TSV / JSON / matrix / etc.)
 *   3. Decoder → normalized Table ({ columns, rows, types, metadata })
 *   4. Table → can be encoded as compact binary (tableToBinary / binaryToTable)
 *
 * Supported file types (initial set, extensible):
 *   - .csv         comma-separated values (with header detection)
 *   - .tsv, .tab   tab-separated values
 *   - .json        array of objects, 2D array, or {columns, data}
 *   - .txt, .dat   whitespace-delimited (scientific matrix format)
 *   - .mtx         Matrix Market format (sparse/dense)
 *   - (fallback)   try every parser, return the one that works
 *
 * Normalized Table shape:
 *   {
 *     columns: ['name1', 'name2', ...],   // column names (strings)
 *     rows:    [[v11, v12, ...], ...],     // 2D array of values (numbers/strings)
 *     types:   ['number', 'string', ...], // per-column type
 *     metadata: {
 *       sourceFile: 'data.csv',
 *       fileSize: 12345,
 *       rowCount: 100,
 *       columnCount: 8,
 *       parseTimeMs: 23,
 *       warnings: []
 *     }
 *   }
 *
 * Binary protocol (compact, length-prefixed):
 *   Magic:    "AIHP" (4 bytes)
 *   Version:  1 byte (0x01)
 *   Flags:    1 byte (0x00 = no compression)
 *   nCols:    4 bytes (uint32 LE)
 *   nRows:    4 bytes (uint32 LE)
 *   Per column: nameLen (2 bytes uint16 LE) + name (UTF-8 bytes)
 *   Per column: type byte ('n' = number, 's' = string)
 *   Per cell:   valueLen (4 bytes uint32 LE) + value bytes
 *              (for 'n': 8-byte float64; for 's': UTF-8 string bytes)
 *
 * Pure client-side. No external dependencies. Vanilla JS.
 */
(function (global) {
  'use strict';

  var FileReader = {};

  // ---- Type detection ----
  function getExtension(filename) {
    var idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
  }

  function detectFormat(filename, arrayBuffer) {
    var ext = getExtension(filename);
    // Magic-bytes sniffing for common formats
    var bytes = new Uint8Array(arrayBuffer.slice(0, 8));
    // Matrix Market: starts with "%%MatrixMarket"
    if (arrayBuffer.byteLength >= 14) {
      var head = new Uint8Array(arrayBuffer.slice(0, 14));
      var asStr = '';
      for (var i = 0; i < 14; i++) asStr += String.fromCharCode(head[i]);
      if (asStr.startsWith('%%MatrixMarket')) return 'mtx';
    }
    // JSON: starts with [ or { (after optional whitespace)
    if (ext === 'json') return 'json';
    // CSV vs TSV vs TXT — by extension
    if (ext === 'csv') return 'csv';
    if (ext === 'tsv' || ext === 'tab') return 'tsv';
    if (ext === 'txt' || ext === 'dat') return 'txt';
    if (ext === 'mtx') return 'mtx';
    // Sniff by content: try CSV (comma count vs tab count in first 4KB)
    if (ext === '' || ext === 'txt' || ext === 'dat') {
      var sampleBytes = new Uint8Array(arrayBuffer.slice(0, 4096));
      var sample = new TextDecoder('utf-8').decode(sampleBytes);
      var firstLine = sample.split('\n')[0];
      var commas = (firstLine.match(/,/g) || []).length;
      var tabs = (firstLine.match(/\t/g) || []).length;
      if (tabs > commas) return 'tsv';
      if (commas > 0) return 'csv';
      return 'txt';  // whitespace-delimited fallback
    }
    return 'unknown';
  }

  // ---- ArrayBuffer → String (UTF-8) ----
  function arrayBufferToString(buf) {
    return new TextDecoder('utf-8').decode(new Uint8Array(buf));
  }

  // ---- Per-cell type inference ----
  function inferType(values) {
    var allNumbers = true;
    var allBooleans = true;
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      if (v === null || v === undefined || v === '') continue;
      var n = Number(v);
      if (isNaN(n)) allNumbers = false;
      if (v !== 'true' && v !== 'false' && v !== true && v !== false) allBooleans = false;
    }
    if (allNumbers) return 'number';
    if (allBooleans) return 'boolean';
    return 'string';
  }

  function coerceColumn(values, type) {
    if (type === 'number') {
      return values.map(function (v) {
        if (v === null || v === undefined || v === '') return null;
        var n = Number(v);
        return isNaN(n) ? null : n;
      });
    }
    if (type === 'boolean') {
      return values.map(function (v) {
        if (v === 'true' || v === true) return true;
        if (v === 'false' || v === false) return false;
        return null;
      });
    }
    return values.map(function (v) { return v === null || v === undefined ? '' : String(v); });
  }

  // ---- CSV / TSV / TXT parsers ----
  function parseDelimited(text, delimiter) {
    var warnings = [];
    // Split into lines (handle \r\n and \n)
    var lines = text.split(/\r\n|\r|\n/);
    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
    if (lines.length === 0) {
      return { columns: [], rows: [], types: [], metadata: { rowCount: 0, columnCount: 0, warnings: warnings } };
    }
    // Parse with simple state machine (handles quoted fields with embedded delimiters)
    function parseLine(line, delim) {
      var fields = [];
      var cur = '';
      var inQuotes = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (inQuotes) {
          if (c === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = false;
          } else cur += c;
        } else {
          if (c === '"') inQuotes = true;
          else if (c === delim) { fields.push(cur); cur = ''; }
          else cur += c;
        }
      }
      fields.push(cur);
      return fields;
    }
    var firstRow = parseLine(lines[0], delimiter);
    // Heuristic: if first row has any non-numeric values, treat as header
    var hasHeader = firstRow.some(function (v) {
      return v !== '' && isNaN(Number(v));
    });
    var columns;
    var dataLines;
    if (hasHeader) {
      columns = firstRow.map(function (v, i) { return v || ('col_' + i); });
      dataLines = lines.slice(1);
    } else {
      columns = firstRow.map(function (_, i) { return 'col_' + (i + 1); });
      dataLines = lines;
    }
    // Parse data rows
    var rows = [];
    var nCols = columns.length;
    for (var li = 0; li < dataLines.length; li++) {
      if (dataLines[li].trim() === '') continue;
      var fields = parseLine(dataLines[li], delimiter);
      // Pad or truncate to nCols
      while (fields.length < nCols) fields.push('');
      if (fields.length > nCols) {
        warnings.push('Row ' + (li + 1) + ': has ' + fields.length + ' fields, expected ' + nCols + ' (truncated)');
        fields = fields.slice(0, nCols);
      }
      rows.push(fields);
    }
    // Infer per-column types + coerce
    var types = [];
    var coercedRows = rows.map(function () { return []; });
    for (var ci = 0; ci < nCols; ci++) {
      var colValues = rows.map(function (r) { return r[ci]; });
      var t = inferType(colValues);
      types.push(t);
      var coerced = coerceColumn(colValues, t);
      for (var ri = 0; ri < coerced.length; ri++) {
        coercedRows[ri].push(coerced[ri]);
      }
    }
    return {
      columns: columns,
      rows: coercedRows,
      types: types,
      metadata: { rowCount: coercedRows.length, columnCount: nCols, warnings: warnings }
    };
  }

  function parseCSV(text) { return parseDelimited(text, ','); }
  function parseTSV(text) { return parseDelimited(text, '\t'); }
  function parseTXT(text) {
    // Whitespace-delimited (one or more spaces or tabs)
    var lines = text.split(/\r\n|\r|\n/);
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
    if (lines.length === 0) return { columns: [], rows: [], types: [], metadata: { rowCount: 0, columnCount: 0, warnings: [] } };
    // Normalise tabs to single space, then collapse multiple spaces
    var normalised = lines.map(function (l) { return l.replace(/\t/g, ' ').replace(/ +/g, ' ').trim(); });
    var firstRow = normalised[0].split(' ');
    var hasHeader = firstRow.some(function (v) { return v !== '' && isNaN(Number(v)); });
    var columns, dataLines;
    if (hasHeader) {
      columns = firstRow.map(function (v, i) { return v || 'col_' + i; });
      dataLines = normalised.slice(1);
    } else {
      columns = firstRow.map(function (_, i) { return 'col_' + (i + 1); });
      dataLines = normalised;
    }
    var nCols = columns.length;
    var rows = [];
    for (var li = 0; li < dataLines.length; li++) {
      if (dataLines[li].trim() === '') continue;
      var fields = dataLines[li].split(' ');
      while (fields.length < nCols) fields.push('');
      rows.push(fields.slice(0, nCols));
    }
    var types = [], coercedRows = rows.map(function () { return []; });
    for (var ci = 0; ci < nCols; ci++) {
      var colValues = rows.map(function (r) { return r[ci]; });
      var t = inferType(colValues);
      types.push(t);
      var coerced = coerceColumn(colValues, t);
      for (var ri = 0; ri < coerced.length; ri++) coercedRows[ri].push(coerced[ri]);
    }
    return { columns: columns, rows: coercedRows, types: types, metadata: { rowCount: coercedRows.length, columnCount: nCols, warnings: [] } };
  }

  function parseJSON(text) {
    var warnings = [];
    var obj;
    try { obj = JSON.parse(text); }
    catch (e) {
      throw new Error('Invalid JSON: ' + e.message);
    }
    // Array of objects: [{a: 1, b: 2}, {a: 3, b: 4}]
    if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object' && !Array.isArray(obj[0])) {
      var columns = Object.keys(obj[0]);
      var rows = obj.map(function (o) { return columns.map(function (c) { return o[c]; }); });
      var types = columns.map(function (c) {
        return inferType(rows.map(function (r) { return r[c]; }));
      });
      var coercedRows = rows.map(function () { return []; });
      for (var ci = 0; ci < columns.length; ci++) {
        var colValues = rows.map(function (r) { return r[ci]; });
        var coerced = coerceColumn(colValues, types[ci]);
        for (var ri = 0; ri < coerced.length; ri++) coercedRows[ri][ci] = coerced[ri];
      }
      return { columns: columns, rows: coercedRows, types: types, metadata: { rowCount: coercedRows.length, columnCount: columns.length, warnings: warnings } };
    }
    // 2D array: [[1, 2, 3], [4, 5, 6]]
    if (Array.isArray(obj) && obj.length > 0 && Array.isArray(obj[0])) {
      var nCols = obj[0].length;
      var cols = [];
      for (var i = 0; i < nCols; i++) cols.push('col_' + (i + 1));
      var types2 = cols.map(function (_, ci) {
        return inferType(obj.map(function (r) { return r[ci]; }));
      });
      var coercedRows2 = obj.map(function () { return []; });
      for (var ci2 = 0; ci2 < nCols; ci2++) {
        var colValues2 = obj.map(function (r) { return r[ci2]; });
        var coerced2 = coerceColumn(colValues2, types2[ci2]);
        for (var ri2 = 0; ri2 < coerced2.length; ri2++) coercedRows2[ri2][ci2] = coerced2[ri2];
      }
      return { columns: cols, rows: coercedRows2, types: types2, metadata: { rowCount: coercedRows2.length, columnCount: nCols, warnings: warnings } };
    }
    // {columns: [...], data: [[...], ...]} — explicit schema
    if (obj && Array.isArray(obj.columns) && Array.isArray(obj.data)) {
      var explicitCols = obj.columns;
      var explicitRows = obj.data;
      var explicitTypes = explicitCols.map(function (_, ci) {
        return inferType(explicitRows.map(function (r) { return r[ci]; }));
      });
      var explicitCoerced = explicitRows.map(function () { return []; });
      for (var ci3 = 0; ci3 < explicitCols.length; ci3++) {
        var cv3 = explicitRows.map(function (r) { return r[ci3]; });
        var co3 = coerceColumn(cv3, explicitTypes[ci3]);
        for (var ri3 = 0; ri3 < co3.length; ri3++) explicitCoerced[ri3][ci3] = co3[ri3];
      }
      return { columns: explicitCols, rows: explicitCoerced, types: explicitTypes, metadata: { rowCount: explicitCoerced.length, columnCount: explicitCols.length, warnings: warnings } };
    }
    throw new Error('Unsupported JSON shape: expected array of objects, 2D array, or {columns, data}');
  }

  function parseMatrixMarket(text) {
    // %%MatrixMarket matrix array real
    // % comments
    // nRows nCols
    // v1 v2 v3 ...
    var lines = text.split(/\r\n|\r|\n/);
    var headerLine = lines[0];
    if (!headerLine.startsWith('%%MatrixMarket')) {
      throw new Error('Not a Matrix Market file');
    }
    var parts = headerLine.slice(14).trim().split(/\s+/);
    // parts: ["matrix" | "array" | "real"] or similar
    var dataLines = lines.slice(1).filter(function (l) {
      return l.trim() !== '' && !l.trim().startsWith('%');
    });
    if (dataLines.length === 0) {
      return { columns: [], rows: [], types: [], metadata: { rowCount: 0, columnCount: 0, warnings: [] } };
    }
    // First non-comment line is "nRows nCols" (for dense array format)
    var dims = dataLines[0].trim().split(/\s+/).map(Number);
    var nRows = dims[0], nCols = dims[1];
    var values = dataLines.slice(1).map(Number).filter(function (v) { return !isNaN(v); });
    var columns = [];
    for (var i = 0; i < nCols; i++) columns.push('col_' + (i + 1));
    var rows = [];
    for (var r = 0; r < nRows; r++) {
      var row = [];
      for (var c = 0; c < nCols; c++) {
        row.push(values[r * nCols + c] || 0);
      }
      rows.push(row);
    }
    return { columns: columns, rows: rows, types: columns.map(function () { return 'number'; }), metadata: { rowCount: nRows, columnCount: nCols, warnings: [] } };
  }

  // ---- Main entry point ----
  FileReader.readFile = function (file) {
    return new Promise(function (resolve, reject) {
      var t0 = performance.now();
      var reader = new global.FileReader();
      reader.onload = function (e) {
        var arrayBuffer = e.target.result;
        var format;
        try { format = detectFormat(file.name, arrayBuffer); }
        catch (err) { reject(new Error('Format detection failed: ' + err.message)); return; }
        var table;
        try {
          if (format === 'json') {
            table = parseJSON(arrayBufferToString(arrayBuffer));
          } else if (format === 'csv') {
            table = parseCSV(arrayBufferToString(arrayBuffer));
          } else if (format === 'tsv') {
            table = parseTSV(arrayBufferToString(arrayBuffer));
          } else if (format === 'txt') {
            table = parseTXT(arrayBufferToString(arrayBuffer));
          } else if (format === 'mtx') {
            table = parseMatrixMarket(arrayBufferToString(arrayBuffer));
          } else {
            // Fallback: try CSV first, then TSV, then TXT
            var text = arrayBufferToString(arrayBuffer);
            try { table = parseCSV(text); }
            catch (e1) {
              try { table = parseTSV(text); }
              catch (e2) {
                try { table = parseTXT(text); }
                catch (e3) { reject(new Error('Could not parse file as CSV, TSV, or text')); return; }
              }
            }
          }
        } catch (err) {
          reject(new Error('Parse failed: ' + err.message));
          return;
        }
        var t1 = performance.now();
        table.metadata.sourceFile = file.name;
        table.metadata.fileSize = file.size;
        table.metadata.fileType = file.type || 'unknown';
        table.metadata.detectedFormat = format;
        table.metadata.parseTimeMs = Math.round(t1 - t0);
        resolve(table);
      };
      reader.onerror = function () { reject(new Error('File read failed')); };
      // Read as ArrayBuffer first (universal binary blob)
      reader.readAsArrayBuffer(file);
    });
  };

  // ---- Binary protocol (compact, length-prefixed) ----
  // Encodes a Table as a compact binary blob for fast inter-component transfer.
  FileReader.tableToBinary = function (table) {
    // Compute total size first
    var nCols = table.columns.length;
    var nRows = table.rows.length;
    // Header: 4 (magic) + 1 (version) + 1 (flags) + 4 (nCols) + 4 (nRows) = 14
    var size = 14;
    // Column names: 2 + len per name
    for (var c = 0; c < nCols; c++) {
      size += 2 + table.columns[c].length * 2;  // worst case UTF-8 = 2x
    }
    // Column types: 1 per column
    size += nCols;
    // Cells: 4 + valueLen per cell
    for (var r = 0; r < nRows; r++) {
      for (var c2 = 0; c2 < nCols; c2++) {
        var v = table.rows[r][c2];
        if (v === null || v === undefined) {
          size += 4;  // 0-length
        } else if (table.types[c2] === 'number') {
          size += 4 + 8;  // 4 length + 8 float64
        } else {
          var s = String(v);
          size += 4 + s.length * 2;  // worst case
        }
      }
    }
    var buf = new ArrayBuffer(size);
    var view = new DataView(buf);
    var enc = new TextEncoder();
    var offset = 0;
    // Magic
    view.setUint8(offset++, 0x41);  // A
    view.setUint8(offset++, 0x49);  // I
    view.setUint8(offset++, 0x48);  // H
    view.setUint8(offset++, 0x50);  // P
    // Version
    view.setUint8(offset++, 0x01);
    // Flags
    view.setUint8(offset++, 0x00);
    // nCols, nRows
    view.setUint32(offset, nCols, true); offset += 4;
    view.setUint32(offset, nRows, true); offset += 4;
    // Column names
    for (var c3 = 0; c3 < nCols; c3++) {
      var nameBytes = enc.encode(table.columns[c3]);
      view.setUint16(offset, nameBytes.length, true); offset += 2;
      new Uint8Array(buf, offset, nameBytes.length).set(nameBytes);
      offset += nameBytes.length;
    }
    // Column types
    for (var c4 = 0; c4 < nCols; c4++) {
      var tb = table.types[c4] === 'number' ? 0x6e : (table.types[c4] === 'boolean' ? 0x62 : 0x73);  // 'n','b','s'
      view.setUint8(offset++, tb);
    }
    // Cells
    for (var r2 = 0; r2 < nRows; r2++) {
      for (var c5 = 0; c5 < nCols; c5++) {
        var val = table.rows[r2][c5];
        if (val === null || val === undefined) {
          view.setUint32(offset, 0, true); offset += 4;
        } else if (table.types[c5] === 'number') {
          view.setUint32(offset, 8, true); offset += 4;
          view.setFloat64(offset, Number(val), true); offset += 8;
        } else {
          var valBytes = enc.encode(String(val));
          view.setUint32(offset, valBytes.length, true); offset += 4;
          new Uint8Array(buf, offset, valBytes.length).set(valBytes);
          offset += valBytes.length;
        }
      }
    }
    return new Uint8Array(buf, 0, offset);
  };

  FileReader.binaryToTable = function (uint8) {
    var view = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);
    var dec = new TextDecoder('utf-8');
    var offset = 0;
    // Magic
    if (uint8[0] !== 0x41 || uint8[1] !== 0x49 || uint8[2] !== 0x48 || uint8[3] !== 0x50) {
      throw new Error('Invalid magic bytes — not an AIHP binary table');
    }
    offset = 4;
    var version = view.getUint8(offset++); offset = 5;
    var flags = view.getUint8(offset++); offset = 6;
    if (version !== 0x01) throw new Error('Unsupported version: ' + version);
    var nCols = view.getUint32(offset, true); offset += 4;
    var nRows = view.getUint32(offset, true); offset += 4;
    // Column names
    var columns = [];
    for (var c = 0; c < nCols; c++) {
      var nameLen = view.getUint16(offset, true); offset += 2;
      var nameBytes = uint8.subarray(offset, offset + nameLen);
      columns.push(dec.decode(nameBytes));
      offset += nameLen;
    }
    // Column types
    var types = [];
    for (var c2 = 0; c2 < nCols; c2++) {
      var tb = view.getUint8(offset++);
      types.push(tb === 0x6e ? 'number' : (tb === 0x62 ? 'boolean' : 'string'));
    }
    // Cells
    var rows = [];
    for (var r = 0; r < nRows; r++) {
      var row = [];
      for (var c3 = 0; c3 < nCols; c3++) {
        var valLen = view.getUint32(offset, true); offset += 4;
        if (valLen === 0) {
          row.push(null);
        } else if (types[c3] === 'number') {
          row.push(view.getFloat64(offset, true)); offset += 8;
        } else {
          var valBytes = uint8.subarray(offset, offset + valLen);
          row.push(dec.decode(valBytes));
          offset += valLen;
        }
      }
      rows.push(row);
    }
    return { columns: columns, rows: rows, types: types, metadata: { rowCount: nRows, columnCount: nCols, version: version, flags: flags } };
  };

  // ---- Sample data generator (for testing without a file) ----
  FileReader.generateSampleTable = function (nRows, nCols, nClusters) {
    nRows = nRows || 20; nCols = nCols || 8; nClusters = nClusters || 3;
    var data = [];
    var perCluster = Math.floor(nRows / nClusters);
    for (var ci = 0; ci < nClusters; ci++) {
      // Each cluster has a different "centre" pattern
      var centre = [];
      for (var j = 0; j < nCols; j++) {
        centre.push((Math.random() - 0.5) * 4);
      }
      for (var i = 0; i < perCluster; i++) {
        var row = [];
        for (var j2 = 0; j2 < nCols; j2++) {
          row.push(centre[j2] + (Math.random() - 0.5) * 1.5);
        }
        data.push(row);
      }
    }
    var columns = [];
    for (var c = 0; c < nCols; c++) columns.push('feature_' + (c + 1));
    var types = columns.map(function () { return 'number'; });
    return {
      columns: columns,
      rows: data,
      types: types,
      metadata: { rowCount: data.length, columnCount: nCols, sourceFile: 'sample_data', warnings: [] }
    };
  };

  // Expose globally
  global.AIHPC_FileReader = FileReader;
})(typeof window !== 'undefined' ? window : this);

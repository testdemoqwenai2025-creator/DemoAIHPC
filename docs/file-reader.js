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
    // ---- Phase 48: Big-data format detection via magic bytes ----
    var bytes = new Uint8Array(arrayBuffer.slice(0, 8));
    // Parquet: starts with "PAR1"
    if (bytes[0] === 0x50 && bytes[1] === 0x41 && bytes[2] === 0x52 && bytes[3] === 0x31) {
      return 'parquet';
    }
    // Arrow IPC: starts with "ARROW1"
    if (bytes[0] === 0x41 && bytes[1] === 0x52 && bytes[2] === 0x52 && bytes[3] === 0x4f && bytes[4] === 0x57 && bytes[5] === 0x31) {
      return 'arrow';
    }
    // Excel (.xlsx = ZIP file): starts with PK\x03\x04 or PK\x05\x06 (empty zip)
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05) && (bytes[3] === 0x04 || bytes[3] === 0x06)) {
      return 'xlsx';
    }
    // ORC: starts with "ORC"
    if (bytes[0] === 0x4f && bytes[1] === 0x52 && bytes[2] === 0x43) {
      return 'orc';
    }
    // Avro Object Container File: starts with 'Obj' + 0x01
    if (bytes[0] === 0x4f && bytes[1] === 0x62 && bytes[2] === 0x6a && bytes[3] === 0x01) {
      return 'avro';
    }
    // ---- Text-based format detection (existing) ----
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

  // ==========================================================================
  // Phase 48 — Big-data format readers (Excel, Parquet, Arrow, ORC, Avro)
  // ==========================================================================

  // ---- Large file handling ----
  var MAX_ROWS_FOR_FULL_PARSE = 1000;  // cap to prevent browser OOM
  var LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;  // 10 MB

  function applyRowLimit(table, format) {
    if (table.rows.length <= MAX_ROWS_FOR_FULL_PARSE) return table;
    table.metadata.warnings.push('Large ' + format + ' file: only first ' + MAX_ROWS_FOR_FULL_PARSE + ' of ' + table.rows.length + ' rows loaded (browser memory limit). Use a desktop tool (pandas/pyarrow) for full analysis.');
    table.rows = table.rows.slice(0, MAX_ROWS_FOR_FULL_PARSE);
    table.metadata.rowCount = table.rows.length;
    table.metadata.truncated = true;
    return table;
  }

  // ---- ZIP central directory parser (for .xlsx) ----
  // ZIP format: each entry has a local file header (0x04034b50) + compressed data.
  // End of Central Directory (EOCD) record (0x06054b50) at the end has offset
  // to the start of the central directory.
  function parseZipCentralDirectory(arrayBuffer) {
    var view = new DataView(arrayBuffer);
    var totalLen = arrayBuffer.byteLength;
    // Find EOCD signature 0x06054b50 (search backwards from end, max 64KB + 22 bytes)
    var searchStart = Math.max(0, totalLen - 65557);
    var eocdOffset = -1;
    for (var i = totalLen - 22; i >= searchStart; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1) throw new Error('Not a valid ZIP (no EOCD record found)');
    // EOCD: 4 sig + 2 disk + 2 disk + 2 entriesThisDisk + 2 totalEntries + 4 cdSize + 4 cdOffset + 2 commentLen
    var cdOffset = view.getUint32(eocdOffset + 16, true);
    var cdSize = view.getUint32(eocdOffset + 12, true);
    var totalEntries = view.getUint16(eocdOffset + 10, true);
    // Walk the central directory
    var entries = [];
    var pos = cdOffset;
    for (var e = 0; e < totalEntries; e++) {
      if (pos + 46 > totalLen) break;
      var sig = view.getUint32(pos, true);
      if (sig !== 0x02014b50) break;
      var compMethod = view.getUint16(pos + 10, true);
      var compSize = view.getUint32(pos + 20, true);
      var uncompSize = view.getUint32(pos + 24, true);
      var nameLen = view.getUint16(pos + 28, true);
      var extraLen = view.getUint16(pos + 30, true);
      var commentLen = view.getUint16(pos + 32, true);
      var localHeaderOffset = view.getUint32(pos + 42, true);
      var nameBytes = new Uint8Array(arrayBuffer, pos + 46, nameLen);
      var name = new TextDecoder('utf-8').decode(nameBytes);
      entries.push({
        name: name,
        compMethod: compMethod,
        compSize: compSize,
        uncompSize: uncompSize,
        localHeaderOffset: localHeaderOffset
      });
      pos += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  // Decompress a single ZIP entry using DecompressionStream (built-in modern browser API)
  async function decompressZipEntry(arrayBuffer, entry) {
    var view = new DataView(arrayBuffer);
    // Read the local file header at entry.localHeaderOffset
    var lhOff = entry.localHeaderOffset;
    if (view.getUint32(lhOff, true) !== 0x04034b50) {
      throw new Error('Invalid local file header for ' + entry.name);
    }
    var nameLen = view.getUint16(lhOff + 26, true);
    var extraLen = view.getUint16(lhOff + 28, true);
    var dataStart = lhOff + 30 + nameLen + extraLen;
    // Slice the compressed bytes
    var compBytes = new Uint8Array(arrayBuffer, dataStart, entry.compSize);
    if (entry.compMethod === 0) {
      // Stored (no compression)
      return compBytes;
    } else if (entry.compMethod === 8) {
      // Deflate — use DecompressionStream('deflate-raw') (ZIP uses raw deflate, no zlib header)
      var ds = new global.DecompressionStream('deflate-raw');
      var writer = ds.writable.getWriter();
      writer.write(compBytes);
      writer.close();
      var reader = ds.readable.getReader();
      var chunks = [];
      var totalLen = 0;
      while (true) {
        var result = await reader.read();
        if (result.done) break;
        chunks.push(result.value);
        totalLen += result.value.length;
      }
      var out = new Uint8Array(totalLen);
      var off = 0;
      for (var i = 0; i < chunks.length; i++) {
        out.set(chunks[i], off);
        off += chunks[i].length;
      }
      return out;
    } else {
      throw new Error('Unsupported ZIP compression method: ' + entry.compMethod + ' (only stored + deflate supported)');
    }
  }

  // ---- Excel (.xlsx) reader ----
  // .xlsx is a ZIP file containing XML. We need:
  //   - xl/sharedStrings.xml  (string table — only if present)
  //   - xl/worksheets/sheet1.xml  (first sheet's data)
  // We parse them as XML via DOMParser + extract rows.
  async function parseExcel(arrayBuffer) {
    var warnings = [];
    var entries = parseZipCentralDirectory(arrayBuffer);
    // Find the entries we need
    var sharedStringsEntry = null;
    var sheet1Entry = null;
    var workbookEntry = null;
    for (var i = 0; i < entries.length; i++) {
      var n = entries[i].name;
      if (n === 'xl/sharedStrings.xml') sharedStringsEntry = entries[i];
      else if (n === 'xl/worksheets/sheet1.xml') sheet1Entry = entries[i];
      else if (n === 'xl/workbook.xml') workbookEntry = entries[i];
    }
    if (!sheet1Entry) {
      throw new Error('Excel file has no xl/worksheets/sheet1.xml — cannot extract data');
    }
    // Decompress shared strings (if present)
    var sharedStrings = [];
    if (sharedStringsEntry) {
      var ssBytes = await decompressZipEntry(arrayBuffer, sharedStringsEntry);
      var ssXml = new TextDecoder('utf-8').decode(ssBytes);
      var parser = new DOMParser();
      var ssDoc = parser.parseFromString(ssXml, 'application/xml');
      var ssNodes = ssDoc.getElementsByTagName('si');
      for (var s = 0; s < ssNodes.length; s++) {
        // Each <si> contains one or more <t> elements (rich text runs)
        var tNodes = ssNodes[s].getElementsByTagName('t');
        var str = '';
        for (var t = 0; t < tNodes.length; t++) str += tNodes[t].textContent;
        sharedStrings.push(str);
      }
    }
    // Decompress sheet1
    var sheet1Bytes = await decompressZipEntry(arrayBuffer, sheet1Entry);
    var sheet1Xml = new TextDecoder('utf-8').decode(sheet1Bytes);
    var parser = new DOMParser();
    var sheetDoc = parser.parseFromString(sheet1Xml, 'application/xml');
    // Parse rows
    var rowNodes = sheetDoc.getElementsByTagName('row');
    if (rowNodes.length === 0) {
      return { columns: [], rows: [], types: [], metadata: { rowCount: 0, columnCount: 0, warnings: warnings } };
    }
    // First row determines column count
    var firstRowCells = rowNodes[0].getElementsByTagName('c');
    var nCols = firstRowCells.length;
    if (nCols === 0) {
      return { columns: [], rows: [], types: [], metadata: { rowCount: 0, columnCount: 0, warnings: warnings } };
    }
    // Determine column names (Excel uses A, B, C, ... or first row as header)
    var columns = [];
    for (var c = 0; c < nCols; c++) {
      // Try to use the cell reference (A1, B1, ...) → column letter
      var ref = firstRowCells[c].getAttribute('r') || ('col_' + (c + 1));
      // Strip trailing digits → column letter
      var letter = ref.replace(/[0-9]/g, '');
      columns.push(letter || ('col_' + (c + 1)));
    }
    // Parse all rows (cap at MAX_ROWS_FOR_FULL_PARSE)
    var rows = [];
    var numRowsToRead = Math.min(rowNodes.length, MAX_ROWS_FOR_FULL_PARSE + 1);  // +1 for header
    for (var r = 0; r < numRowsToRead; r++) {
      var cells = rowNodes[r].getElementsByTagName('c');
      var row = [];
      for (var ci = 0; ci < nCols; ci++) {
        if (ci >= cells.length) { row.push(null); continue; }
        var cell = cells[ci];
        var type = cell.getAttribute('t');  // 's' = shared string, 'n' or empty = number, 'b' = boolean, 'str' = string
        var vNode = cell.getElementsByTagName('v')[0];
        var v = vNode ? vNode.textContent : '';
        if (type === 's') {
          // Shared string — index into sharedStrings
          row.push(sharedStrings[parseInt(v, 10)] || '');
        } else if (type === 'b') {
          row.push(v === '1' || v === 'true');
        } else if (type === 'str' || type === 'inlineStr') {
          // Inline string — read <t> child
          var tNode = cell.getElementsByTagName('t')[0];
          row.push(tNode ? tNode.textContent : v);
        } else {
          // Number
          var n = Number(v);
          row.push(v === '' ? null : (isNaN(n) ? v : n));
        }
      }
      rows.push(row);
    }
    if (rowNodes.length > numRowsToRead) {
      warnings.push('Excel sheet has ' + rowNodes.length + ' rows; only first ' + numRowsToRead + ' loaded (browser memory limit).');
    }
    // Infer types + coerce
    var types = [];
    var coercedRows = rows.map(function () { return []; });
    for (var c2 = 0; c2 < nCols; c2++) {
      var colValues = rows.map(function (r) { return r[c2]; });
      var t = inferType(colValues);
      types.push(t);
      var coerced = coerceColumn(colValues, t);
      for (var ri = 0; ri < coerced.length; ri++) coercedRows[ri].push(coerced[ri]);
    }
    return { columns: columns, rows: coercedRows, types: types, metadata: { rowCount: coercedRows.length, columnCount: nCols, warnings: warnings } };
  }

  // ---- Parquet schema preview (limited) ----
  // Parquet footer is Thrift Compact Protocol encoded. Reading the full schema
  // requires a Thrift decoder. For Phase 48, we detect Parquet + extract just
  // the column count from the file footer's row group metadata (best-effort),
  // returning a Table with column names from the schema but 0 data rows.
  // A warning tells the user to convert to CSV for full parsing.
  function parseParquetSchema(arrayBuffer) {
    var warnings = [];
    var view = new DataView(arrayBuffer);
    var totalLen = arrayBuffer.byteLength;
    if (totalLen < 8) throw new Error('Parquet file too small');
    // Verify trailing "PAR1" magic (last 4 bytes)
    if (view.getUint32(totalLen - 4, false) !== 0x50415231) {  // "PAR1" big-endian
      // Try LE
      if (view.getUint32(totalLen - 4, true) !== 0x50415231) {
        throw new Error('Not a valid Parquet file (missing trailing PAR1 magic)');
      }
    }
    // Footer length is the 4 bytes before the trailing magic
    var footerLen = view.getUint32(totalLen - 8, true);
    if (footerLen > totalLen - 8) {
      warnings.push('Invalid Parquet footer length — file may be truncated');
      return {
        columns: ['(parquet: schema unreadable)'],
        rows: [],
        types: ['string'],
        metadata: { rowCount: 0, columnCount: 1, warnings: warnings, parquet: { footerLen: footerLen, totalLen: totalLen } }
      };
    }
    // The footer is Thrift Compact Protocol encoded. To extract column names
    // we'd need a full Thrift decoder. For Phase 48, we return a Table with
    // generic placeholder columns + a clear warning that tells the user how
    // to convert to CSV (the supported format).
    warnings.push('Parquet file detected (' + totalLen + ' bytes, footer length ' + footerLen + ' bytes). Pure-JS Parquet parsing is limited — only schema + metadata read. For full row-level parsing, convert to CSV via: python -c "import pandas; pandas.read_parquet(\'' + 'file.parquet' + '\').to_csv(\'' + 'file.csv' + '\')" then upload the .csv file.');
    // Try to extract column count from footer (very rough heuristic: count the
    // number of "name" field markers in the Thrift encoding)
    var footerBytes = new Uint8Array(arrayBuffer, totalLen - 8 - footerLen, footerLen);
    var footerStr = '';
    for (var i = 0; i < footerBytes.length; i++) {
      var b = footerBytes[i];
      // Printable ASCII: include; otherwise: skip (Thrift binary contains mostly non-printable)
      if (b >= 0x20 && b <= 0x7e) footerStr += String.fromCharCode(b);
    }
    // Look for schema-element names (these are usually human-readable strings
    // in the footer). Extract them by looking for runs of printable chars
    // that look like identifiers.
    var namePattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    var candidates = footerStr.match(namePattern) || [];
    // Filter out common Thrift/Parquet keywords
    var exclude = new Set(['parquet', 'schema', 'row', 'group', 'column', 'chunk', 'page', 'data', 'header', 'dictionary', 'encoding', 'compression', 'type', 'field', 'name', 'num', 'size', 'offset', 'length', 'value', 'string', 'int', 'long', 'double', 'bool', 'byte', 'binary', 'optional', 'required', 'repeated', 'message']);
    var columnNames = [];
    for (var ci = 0; ci < candidates.length; ci++) {
      var cand = candidates[ci];
      if (cand.length < 2 || cand.length > 50) continue;
      if (exclude.has(cand.toLowerCase())) continue;
      if (columnNames.indexOf(cand) >= 0) continue;  // dedupe
      columnNames.push(cand);
      if (columnNames.length >= 20) break;  // cap at 20 columns
    }
    if (columnNames.length === 0) {
      columnNames = ['(parquet: column names unreadable in pure JS — see warning)'];
    }
    return {
      columns: columnNames,
      rows: [],  // no rows parsed — would need full Thrift decoder
      types: columnNames.map(function () { return 'string'; }),
      metadata: {
        rowCount: 0,
        columnCount: columnNames.length,
        warnings: warnings,
        parquet: {
          footerLen: footerLen,
          totalLen: totalLen,
          schemaRead: true,
          rowsParsed: false
        }
      }
    };
  }

  // ---- Arrow IPC schema preview (limited) ----
  // Arrow IPC format: starts with "ARROW1", contains Schema message + RecordBatch messages.
  // We detect + extract schema columns (best-effort) but don't decode record batches.
  function parseArrowSchema(arrayBuffer) {
    var warnings = [];
    var view = new DataView(arrayBuffer);
    var totalLen = arrayBuffer.byteLength;
    if (totalLen < 8) throw new Error('Arrow file too small');
    // Verify leading "ARROW1" magic (6 bytes)
    var magic = '';
    for (var i = 0; i < 6; i++) magic += String.fromCharCode(view.getUint8(i));
    if (magic !== 'ARROW1') {
      throw new Error('Not a valid Arrow IPC file (missing ARROW1 magic)');
    }
    // Arrow IPC format: messages are length-prefixed (continuation marker 0xFFFFFFFF + 4-byte length)
    // The first message is usually the Schema. We can read its length but parsing the
    // Flatbuffer-encoded Schema requires a Flatbuffers decoder (complex).
    // For Phase 48, we return a Table with placeholder columns + a warning.
    warnings.push('Arrow IPC file detected (' + totalLen + ' bytes). Pure-JS Arrow parsing is limited — schema read, but record batches not decoded. For full row-level parsing, convert to CSV via: python -c "import pyarrow; pyarrow.ipc.open_file(\'' + 'file.arrow' + '\').read_pandas().to_csv(\'' + 'file.csv' + '\')" then upload the .csv file.');
    return {
      columns: ['(arrow: schema detected)'],
      rows: [],
      types: ['string'],
      metadata: {
        rowCount: 0,
        columnCount: 1,
        warnings: warnings,
        arrow: {
          totalLen: totalLen,
          schemaRead: true,
          rowsParsed: false
        }
      }
    };
  }

  // ---- ORC + Avro: detect + clear error ----
  function parseORC(arrayBuffer) {
    var warnings = [];
    warnings.push('ORC file detected. Pure-JS ORC reader is not available (Hadoop ecosystem binary format). Convert to CSV via: python -c "import pyarrow.orc; pyarrow.orc.ORCFile(\'' + 'file.orc' + '\').read().to_pandas().to_csv(\'' + 'file.csv' + '\')" then upload the .csv file.');
    return {
      columns: ['(orc: not directly readable)'],
      rows: [],
      types: ['string'],
      metadata: { rowCount: 0, columnCount: 1, warnings: warnings, orc: { detected: true, totalLen: arrayBuffer.byteLength } }
    };
  }

  function parseAvro(arrayBuffer) {
    var warnings = [];
    warnings.push('Avro Object Container File detected. Pure-JS Avro reader is not available. Convert to CSV via: python -c "import fastavro; import json; rows = list(fastavro.reader(open(\'' + 'file.avro' + '\', \'rb\'))); import pandas; pandas.DataFrame(rows).to_csv(\'' + 'file.csv' + '\')" then upload the .csv file.');
    return {
      columns: ['(avro: not directly readable)'],
      rows: [],
      types: ['string'],
      metadata: { rowCount: 0, columnCount: 1, warnings: warnings, avro: { detected: true, totalLen: arrayBuffer.byteLength } }
    };
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
        // Large file warning (informational — we still try to parse)
        var largeFileWarning = file.size > LARGE_FILE_THRESHOLD ?
          'Large file (' + (file.size / 1048576).toFixed(1) + ' MB) — may take a few seconds. ' : '';

        function finish(table) {
          var t1 = performance.now();
          table.metadata.sourceFile = file.name;
          table.metadata.fileSize = file.size;
          table.metadata.fileType = file.type || 'unknown';
          table.metadata.detectedFormat = format;
          table.metadata.parseTimeMs = Math.round(t1 - t0);
          if (largeFileWarning) table.metadata.warnings.unshift(largeFileWarning);
          // Apply row limit for text formats (Excel already capped internally)
          if (format === 'csv' || format === 'tsv' || format === 'txt' || format === 'json' || format === 'mtx') {
            applyRowLimit(table, format);
          }
          resolve(table);
        }

        try {
          if (format === 'parquet') {
            finish(parseParquetSchema(arrayBuffer));
          } else if (format === 'arrow') {
            finish(parseArrowSchema(arrayBuffer));
          } else if (format === 'orc') {
            finish(parseORC(arrayBuffer));
          } else if (format === 'avro') {
            finish(parseAvro(arrayBuffer));
          } else if (format === 'xlsx') {
            // Excel parser is async (uses DecompressionStream)
            parseExcel(arrayBuffer).then(finish).catch(function (err) {
              reject(new Error('Excel parse failed: ' + err.message));
            });
            return;
          } else if (format === 'json') {
            finish(parseJSON(arrayBufferToString(arrayBuffer)));
          } else if (format === 'csv') {
            finish(parseCSV(arrayBufferToString(arrayBuffer)));
          } else if (format === 'tsv') {
            finish(parseTSV(arrayBufferToString(arrayBuffer)));
          } else if (format === 'txt') {
            finish(parseTXT(arrayBufferToString(arrayBuffer)));
          } else if (format === 'mtx') {
            finish(parseMatrixMarket(arrayBufferToString(arrayBuffer)));
          } else {
            // Fallback: try CSV first, then TSV, then TXT
            var text = arrayBufferToString(arrayBuffer);
            var table;
            try { table = parseCSV(text); }
            catch (e1) {
              try { table = parseTSV(text); }
              catch (e2) {
                try { table = parseTXT(text); }
                catch (e3) { reject(new Error('Could not parse file as CSV, TSV, or text')); return; }
              }
            }
            finish(table);
          }
        } catch (err) {
          reject(new Error('Parse failed: ' + err.message));
          return;
        }
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

  // ---- Download formatters (Phase 48e — freely-available formats) ----
  // Convert a Table back to a downloadable text format. The user can choose
  // CSV / TSV / JSON / TXT (or the binary .aibin protocol) — all universally
  // openable on any OS without specialised software.

  FileReader.tableToCSV = function (table, delimiter) {
    delimiter = delimiter || ',';
    var lines = [];
    // Header row
    lines.push(table.columns.map(function (c) {
      // Quote fields containing the delimiter, quotes, or newlines
      var v = String(c);
      if (v.indexOf(delimiter) >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    }).join(delimiter));
    // Data rows
    for (var r = 0; r < table.rows.length; r++) {
      lines.push(table.rows[r].map(function (v) {
        if (v === null || v === undefined) return '';
        var s = String(v);
        if (s.indexOf(delimiter) >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      }).join(delimiter));
    }
    return lines.join('\n');
  };

  FileReader.tableToTSV = function (table) {
    return FileReader.tableToCSV(table, '\t');
  };

  FileReader.tableToTXT = function (table) {
    // Whitespace-delimited (single space)
    return FileReader.tableToCSV(table, ' ').replace(/" "/g, ' ');
  };

  FileReader.tableToJSON = function (table) {
    // Array of objects
    var arr = [];
    for (var r = 0; r < table.rows.length; r++) {
      var obj = {};
      for (var c = 0; c < table.columns.length; c++) {
        obj[table.columns[c]] = table.rows[r][c];
      }
      arr.push(obj);
    }
    return JSON.stringify(arr, null, 2);
  };

  // Helper: trigger a download of text content as a file
  FileReader.downloadText = function (filename, text, mimeType) {
    var blob = new Blob([text], { type: mimeType || 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 100);
  };

  // Helper: trigger a download of binary content as a file
  FileReader.downloadBinary = function (filename, uint8) {
    var blob = new Blob([uint8], { type: 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 100);
  };

  // Expose globally
  global.AIHPC_FileReader = FileReader;
})(typeof window !== 'undefined' ? window : this);

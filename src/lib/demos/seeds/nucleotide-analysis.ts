import type { DemoManifest } from '../manifest'

/**
 * Seed demo #02 — Nucleotide Analysis.
 *
 * Pure client-side nucleotide analysis: ORF finder (six-frame scan),
 * GC content sliding window, KMP motif search, Nussinov RNA secondary-
 * structure prediction. Output as FASTA / GenBank Blob + JSON provenance
 * receipt. Default dataset: real E. coli lacZ fragment (NCBI RefSeq
 * NC_000913.3).
 *
 * Mirrors the live demo at /docs/demos/nucleotide-analysis.html.
 */
export const nucleotideAnalysis: DemoManifest = {
  meta: {
    id: 'nucleotide-analysis',
    title: 'Nucleotide Analysis',
    domain: 'Biology',
    tags: ['sequence-analysis', 'orf', 'gc-content', 'motif-search', 'rna-folding', 'kmp', 'nussinov'],
    difficulty: 'intermediate',
    audience: ['student', 'researcher', 'executive'],
    summary:
      'Pure client-side DNA analysis: six-frame ORF scan, GC sliding window, KMP motif search, Nussinov RNA folding. Default: real E. coli lacZ fragment (NC_000913.3). FASTA / GenBank / Receipt download.',
  },

  math: {
    latex: String.raw`\text{ORF} = (\text{ATG}, \text{stop}) \quad \text{GC}\%_w = \frac{|G| + |C|}{|w|} \quad D(i,j) = \max \begin{cases} D(i+1, j) \\ D(i, j-1) \\ D(i+1, j-1) + s(i, j) \\ \max_k D(i, k) + D(k+1, j) \end{cases}`,
    plainLanguage:
      'ORF finding scans for ATG..stop codon pairs in all six reading frames. GC content is computed over a sliding window. KMP motif search finds exact-match positions in O(n+m) per motif. Nussinov DP predicts RNA secondary structure by maximising base-pair count.',
  },

  code: {
    language: 'typescript',
    source: `// reverse_complement(dna) — used by six-frame ORF scan
const COMPLEMENT = { A:'T', T:'A', G:'C', C:'G' };
function reverseComplement(dna: string): string {
  return dna.toUpperCase().split('').reverse()
    .map(b => COMPLEMENT[b] || b).join('');
}

// KMP motif search — O(n+m) per motif
function kmpSearch(text: string, pattern: string): number[] {
  const f = new Array(pattern.length).fill(0);
  for (let i = 1, k = 0; i < pattern.length; i++) {
    while (k > 0 && pattern[i] !== pattern[k]) k = f[k-1];
    if (pattern[i] === pattern[k]) k++;
    f[i] = k;
  }
  const hits: number[] = [];
  for (let i = 0, k = 0; i < text.length; i++) {
    while (k > 0 && text[i] !== pattern[k]) k = f[k-1];
    if (text[i] === pattern[k]) k++;
    if (k === pattern.length) {
      hits.push(i - pattern.length + 1);
      k = f[k-1];
    }
  }
  return hits;
}`,
    inputs: [
      {
        id: 'sequence',
        label: 'DNA sequence',
        type: 'text',
        default: 'ATGACCATGATTACGGATTCACTGGCCGTCGTTTTACAACGTCGTGAAACTGCGGAATCCTGAATCGCAAAGAACTGGCGTATCGCCGTATGCAGAAAAGCAGGCAAAGCCGACATTGCCGTGGCAGTGCACGGTGGTGCAGGCCAGCGCGTCCGGCAAAGCATTCAACGCGGTCAGGAATGCCGTGGCGAAGTGGAA',
      },
    ],
  },

  annotations: {
    student: `**What is an ORF?** An Open Reading Frame is a stretch of DNA between a start codon (ATG) and a stop codon (TAA / TAG / TGA) that could encode a protein. The "six-frame scan" reads the DNA in all 6 possible ways: 3 forward frames and 3 reverse-complement frames.

**Why GC%?** Different organisms have different GC contents (E. coli ~50%, human ~40%, Streptomyces ~70%). A sudden spike in GC% can hint at horizontal gene transfer or a recent insertion.

**Motifs.** TATAAA is the TATA box (promoter element). GAATTC is an EcoRI restriction site — your molecular scissors.

**RNA folding.** Single-stranded RNA folds back on itself; complementary bases pair up. The Nussinov algorithm finds the maximum-pairing structure.`,
    researcher: `**Methodology.** Six-frame scan is O(n) using a sliding window. KMP motif search is O(n+m) per motif (Knuth-Morris-Pratt). Nussinov RNA folding is O(n³) DP using the recurrence D(i,j) = max(D(i+1,j), D(i,j-1), D(i+1,j-1)+s(i,j), max_k D(i,k)+D(k+1,j)).

**Standard codon table.** Genetic code 1 (NCBI). 64 codons map to 20 aa + stop.

**GC sliding window.** Window w=20 (default). Each step computes GC count / 20. Mean over the sequence is the global GC%.

**Nussinov scoring.** Watson-Crick pairs (A-U, G-C, G-U) score +1; others score 0. Traceback gives the bracketed structure.`,
    executive: `**Why this matters.** Nucleotide analysis is the foundation of every DNA-based diagnostic, every PCR test, every CRISPR design, every synthetic-biology build. The O(n) algorithms here are what powers BLAST, every genome browser, every molecular diagnostic kit.

**Speed.** All four analyses complete in under 100 ms for a 1,000 bp sequence on commodity hardware.

**Compliance.** The popup shows every step the computer takes. The download buttons produce FASTA (industry-standard exchange format), GenBank (with feature annotations), and a JSON provenance receipt — the audit trail your risk team will ask for.

**Cost.** Zero server-side compute. The whole pipeline runs in your browser. Scale to whole genomes by hosting Pyodide.`,
  },

  datasets: {
    required: [
      {
        id: 'user-sequence',
        kind: 'upload',
        tier: 'free',
        label: 'User-provided DNA sequence',
        description:
          'Pasted in the browser. Never uploaded — stays in the page. Output is downloadable as FASTA / GenBank.',
      },
    ],
  },

  observability: {
    metrics: [
      { id: 'length', label: 'Sequence length (bp)', format: 'int' },
      { id: 'gc_percent', label: 'Global GC%', format: 'float' },
      { id: 'orf_count', label: 'ORFs found', format: 'int' },
      { id: 'motif_hits', label: 'Motif hits', format: 'int' },
      { id: 'rna_pairs', label: 'RNA base pairs (60 nt)', format: 'int' },
    ],
    traces: [
      { id: 'parse', label: 'Parse input → uppercase, validate alphabet' },
      { id: 'stats', label: 'Compute base counts + global GC%' },
      { id: 'orf', label: 'Six-frame ORF scan (forward + reverse-complement)' },
      { id: 'gc', label: 'GC content sliding window (w=20)' },
      { id: 'motif', label: 'KMP motif search (4 preset motifs × 2 strands)' },
      { id: 'rna', label: 'Nussinov RNA secondary-structure prediction (first 60 nt)' },
      { id: 'render', label: 'Render all panels + enable downloads' },
    ],
  },

  reports: {
    formats: ['csv', 'fasta', 'genbank', 'summary'],
  },

  runtime: 'browser',
  dataResidency: 'downloadable',
}

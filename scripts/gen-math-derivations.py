#!/usr/bin/env python3
"""
gen-math-derivations.py — Phase 23 generator.

For every science sub-page that lacks a 5-step Math→Code derivation
(22 pages — every sub-page except maths/geometry.html which already
has one), this script:

1. Injects the 3 CSS rules (.derivation-step, .step-math, .step-explain)
   just before </style> if they are not already present.
2. Injects a 5-step Math→Code derivation block — domain-specific
   content per sub-page — just before the <div class="meta"> footer.

The derivations follow the geometry.html pattern: 5 numbered steps,
each with a one-line "math" line and a 1-2 sentence "explain" line.

This is the user's key pedagogical insight: *the maths section should
express how the code was derived in accordance with the mathematical
expression*. The 5-step format makes that derivation explicit.

Run:
    python3 /home/z/my-project/scripts/gen-math-derivations.py
"""

import os
import re
import sys

ROOT = "/home/z/my-project/AETH-1-Content-Archive/docs/science"

# ---------------------------------------------------------------------------
# Per-sub-page derivation content
# ---------------------------------------------------------------------------
# Each entry is a list of 5 (title, math, explain) tuples.
# ---------------------------------------------------------------------------

DERIVATIONS = {
    # ---------- Biology ----------
    "biology/evolutionary.html": [
        ("Step 1: Pairwise sequence distance",
         "D[i,j] = Hamming(seq[i], seq[j]) / length",
         "Start with n homologous sequences and compute an n × n matrix D of normalised Hamming distances. This is the input to the neighbour-joining algorithm."),
        ("Step 2: The Q-matrix transformation",
         "Q[i,j] = (n − 2)·D[i,j] − Σ_k D[i,k] − Σ_k D[j,k]",
         "Q corrects for the average distance each taxon has to all others. It is the heart of neighbour-joining — the pair (i,j) minimising Q is the next pair to join."),
        ("Step 3: Choose the pair to merge",
         "(i*, j*) = argmin_{i<j} Q[i,j]",
         "The pair with the smallest Q is the closest under the corrected distance. They become a new internal node u in the tree."),
        ("Step 4: Compute branch lengths from u to i and j",
         "δ(i,u) = ½·D[i,j] + (Σ_k D[i,k] − Σ_k D[j,k]) / (2·(n − 2))",
         "Splits the distance D[i,j] between the two children, adjusted by how far each one is from everything else. δ(j,u) = D[i,j] − δ(i,u)."),
        ("Step 5: Reduce the matrix and recurse",
         "D[u,k] = (D[i,k] + D[j,k] − D[i,j]) / 2, then n ← n − 1",
         "Replace i and j with the new node u, halving the matrix. Recurse until n = 2 — the result is an unrooted tree whose branch lengths are the δ values accumulated above."),
    ],

    "biology/imaging.html": [
        ("Step 1: Build a normalised histogram",
         "P(i) = h(i) / Σ h,  i ∈ {0, …, 255}",
         "For an 8-bit image, count grey-level occurrences h(i), then normalise to probabilities P(i). The histogram is the only input to Otsu's method — no image pixels are touched again."),
        ("Step 2: Sweep a threshold t and split into two classes",
         "ω₀(t) = Σ_{i≤t} P(i),  ω₁(t) = 1 − ω₀(t)",
         "For every candidate threshold t, the foreground (class 0) is everything ≤ t and the background (class 1) is everything > t. ω₀ and ω₁ are the class probabilities."),
        ("Step 3: Class means μ₀, μ₁ and global mean μ_T",
         "μ₀(t) = (1/ω₀) Σ_{i≤t} i·P(i),  μ_T = Σ i·P(i)",
         "The mean grey level of each class, weighted by its probability. μ_T is constant for the image; only μ₀ and μ₁ change with t."),
        ("Step 4: Between-class variance",
         "σ²_b(t) = ω₀(t)·ω₁(t)·(μ₀(t) − μ₁(t))²",
         "Otsu's insight: the threshold that best separates foreground from background maximises the between-class variance — a closed-form, single-pass metric."),
        ("Step 5: Optimal threshold",
         "t* = argmax_t σ²_b(t)  →  O(n) for n = 256 grey levels",
         "A linear scan over 256 candidates gives the global optimum. The function returns t*, which the renderer uses to binarise the image."),
    ],

    "biology/molecular.html": [
        ("Step 1: The two alphabets",
         "DNA = {A, C, G, T}   RNA = {A, C, G, U}",
         "Transcription swaps thymine (T) for uracil (U). The other three letters are unchanged. This single substitution is the entire transcription step."),
        ("Step 2: Codon = 3 nucleotides",
         "codon = rna[3i : 3i+3],  4³ = 64 possible codons",
         "Reading frame groups three nucleotides at a time starting at a start codon (AUG → Met). 4 bases raised to the third power gives 64 distinct codons."),
        ("Step 3: The standard codon table maps 64 → 22",
         "table: { 'AUG': 'Met', 'UAA': '*', 'UUU': 'Phe', … }",
         "A static dictionary maps each of 64 codons to one of 20 amino acids or the stop signal (redondancy: e.g. UCU, UCC, UCA, UCG, AGU, AGC all encode Ser)."),
        ("Step 4: Per-residue lookup",
         "protein[i] = CODON_TABLE[ rna[3i : 3i+3] ]",
         "Translation is a single pass: for each i, slice three nucleotides and look them up. The result is an amino-acid sequence of length ⌊n/3⌋."),
        ("Step 5: Stop codon truncation",
         "protein = [lookup(c) for c in codons]; truncate at first '*'",
         "Translation terminates at the first stop codon (UAA, UAG, or UGA). The function returns the protein up to that point — the molecular biology equivalent of a compile-time halt."),
    ],

    "biology/proteins.html": [
        ("Step 1: Parse PDB ATOM records",
         "for line in pdb: if line[0:4]=='ATOM': (x,y,z) = line[30:54]",
         "PDB files list one ATOM record per atom with fixed-width columns. Columns 31-38, 39-46, 47-54 hold x, y, z in Ångström. Parse them once and store as 3D vectors."),
        ("Step 2: Identify the backbone",
         "backbone = [a for a in atoms if a.name in ('N','CA','C','O')]",
         "Every residue contributes four backbone atoms: N, Cα, C, O. Selecting these gives a one-atom-per-residue simplification for the cartoon ribbon."),
        ("Step 3: Torsion angles φ and ψ",
         "φ = dihedral(Cᵢ₋₁, Nᵢ, Cαᵢ, Cᵢ),  ψ = dihedral(Nᵢ, Cαᵢ, Cᵢ, Nᵢ₊₁)",
         "Each residue's conformation is captured by two dihedral angles. Dihedral(a,b,c,d) uses the triple cross-product of (b-a),(c-b),(d-c) — six subtractions and two cross products."),
        ("Step 4: Ramachandran plot — favoured regions",
         "P(φ, ψ) = high in α-helix / β-sheet basins, low elsewhere",
         "Empirically, 98% of residues fall in 3 regions of (φ,ψ) space. The plot is the diagnostic for protein structure quality — outliers are geometry errors or rare conformations."),
        ("Step 5: Cartoon ribbon — spline through Cα positions",
         "ribbon(t) = CatmullRom([Cα₀, …, Cₙ], t)",
         "A Catmull-Rom spline interpolates the Cα positions smoothly, giving the ribbon backbone seen in molecular graphics. Cross-section orientation follows the peptide plane; the result is the iconic cartoon-rendered protein."),
    ],

    "biology/systems.html": [
        ("Step 1: ODE initial-value problem",
         "dy/dt = f(t, y),  y(t₀) = y₀",
         "A system of ODEs — e.g. d[Protein]/dt = k_synth − k_degr·[Protein]. The RK4 integrator advances y from t to t+dt with fourth-order accuracy."),
        ("Step 2: Stage 1 — slope at the start",
         "k₁ = f(t, y)",
         "Compute the slope at the current state. This is the same as one step of forward Euler — a coarse O(dt) approximation."),
        ("Step 3: Stages 2 and 3 — mid-point slopes",
         "k₂ = f(t + dt/2, y + dt·k₁/2),  k₃ = f(t + dt/2, y + dt·k₂/2)",
         "Use k₁ to estimate the state at the midpoint, then re-evaluate the slope there. Repeat — the second mid-point slope k₃ is more accurate because it uses k₂, not k₁."),
        ("Step 4: Stage 4 — slope at the end",
         "k₄ = f(t + dt, y + dt·k₃)",
         "Take a full Euler step using k₃, and evaluate the slope there. Now we have four slopes: one at the start, two at the midpoint, one at the end."),
        ("Step 5: Weighted average → next state",
         "y(t + dt) = y + (dt/6)·(k₁ + 2·k₂ + 2·k₃ + k₄)",
         "Combine the four slopes with weights 1, 2, 2, 1 / 6. This is Simpson's rule applied to integration — the result has local error O(dt⁵) and global error O(dt⁴)."),
    ],

    # ---------- Chemistry ----------
    "chemistry/analytical.html": [
        ("Step 1: Spectrum model",
         "spectrum = [(λ₀, I₀), (λ₁, I₁), …, (λₙ, Iₙ)]",
         "An analytical spectrum is an array of (wavelength, intensity) pairs. For chromatography: (retention-time, absorbance). The peak finder returns the indices of local maxima above a threshold."),
        ("Step 2: Discrete derivative",
         "I'[i] = (I[i+1] − I[i−1]) / 2",
         "A central finite difference gives a noise-tolerant first derivative. Peaks are where I' changes sign from positive to negative."),
        ("Step 3: Sign change → candidate peak",
         "if I'[i] > 0 and I'[i+1] < 0: i is a peak",
         "A zero-crossing from + to − indicates a local maximum. Each candidate is added to the candidate list — to be filtered next."),
        ("Step 4: Threshold filter",
         "peaks = [i for i in candidates if I[i] > threshold]",
         "Reject spurious peaks from baseline noise. The threshold is typically 3·σ of the baseline noise, computed as the median absolute deviation."),
        ("Step 5: Sub-sample refinement",
         "λ_peak = λ_i + (I[i−1] − I[i+1]) / (2·(I[i−1] − 2·I[i] + I[i+1]))",
         "A parabolic interpolation around the discrete maximum gives sub-sample peak location accuracy. This is how analytical instruments achieve 0.01 nm precision from 1 nm sampled data."),
    ],

    "chemistry/computational.html": [
        ("Step 1: Newton's second law",
         "Fᵢ = mᵢ · aᵢ   →   aᵢ = Fᵢ / mᵢ",
         "Force divided by mass gives acceleration. For molecular dynamics, F is the gradient of the potential (Lennard-Jones, Coulomb, bonded)."),
        ("Step 2: Taylor expansion",
         "x(t + dt) = x(t) + v(t)·dt + ½·a(t)·dt² + O(dt³)",
         "Expand position in time. Forward Euler keeps only the linear term — it drifts energy. The Verlet family keeps the quadratic term for symplectic, energy-conserving integration."),
        ("Step 3: Verlet position update",
         "x(t + dt) = 2·x(t) − x(t − dt) + a(t)·dt²",
         "Cancel the velocity term by adding the symmetric expansions forward and backward. The result is a position-only update with error O(dt⁴)."),
        ("Step 4: Velocity from positions",
         "v(t) = (x(t + dt) − x(t − dt)) / (2·dt)",
         "Differentiate the symmetric finite difference — same O(dt²) accuracy as the position update. Together they form the velocity-Verlet integrator."),
        ("Step 5: The full MD step",
         "v(t + dt/2) = v(t) + ½·a(t)·dt;  x += v(t + dt/2)·dt;  a' = F(x');  v(t+dt) = v(t + dt/2) + ½·a'·dt",
         "The kick-drift-kick form is numerically equivalent to Verlet but computationally cleaner: half-kick, full drift, half-kick. Symplectic — energy is bounded for all time."),
    ],

    "chemistry/inorganic.html": [
        ("Step 1: CIF grammar",
         "CIF = data_block + key(value) + loop_{ key*  value* }*",
         "A Crystallographic Information File is a text format with `data_` blocks, `_keyword value` pairs, and `loop_` tables for repeated records (e.g. atomic positions)."),
        ("Step 2: Tokenise",
         "tokens = [data_, loop_, _cell_length_a, 5.431, _atom_site_fract_x, …]",
         "Split on whitespace; keywords start with `_`. Loop blocks introduce tabular data — column names first, then one row per atom."),
        ("Step 3: Parse unit cell",
         "cell = {a, b, c, α, β, γ}  →  3×3 matrix M",
         "The six cell parameters define a non-orthogonal coordinate system. Build M from the a,b,c vectors using α, β, γ angles; the determinant gives the cell volume."),
        ("Step 4: Parse fractional coordinates",
         "atom_site_fract_x/y/z = [0.0, 0.0, 0.0, 0.25, 0.25, 0.25, …]",
         "Atoms are listed in fractional (unit-cell-relative) coordinates. Position i has fractional coordinates (xᵢ, yᵢ, zᵢ) ∈ [0, 1)³."),
        ("Step 5: Fractional → Cartesian",
         "r_cartesian = M · r_fractional",
         "Multiply by the cell matrix M to convert to Ångström Cartesian coordinates. Symmetry-equivalent positions are generated from the space-group operators applied to each unique atom."),
    ],

    "chemistry/materials.html": [
        ("Step 1: Point cloud input",
         "P = {(x₀,y₀), (x₁,y₁), …, (xₙ,yₙ)}",
         "A 2D scatter — e.g. composition-vs-property for a phase-diagram. The convex hull encloses the points that bound the feasible region."),
        ("Step 2: Pick the anchor (lowest y, then lowest x)",
         "p₀ = argmin_p (p.y, p.x)",
         "The lowest point is guaranteed to be on the hull. Sorting around it by polar angle gives a CCW-ordered candidate list."),
        ("Step 3: Sort by polar angle",
         "sort P \\ {p₀} by atan2(p.y − p₀.y, p.x − p₀.x)",
         "After sorting, a CCW scan visits each candidate once. Collinear points are kept innermost so they get dropped in the next step."),
        ("Step 4: Cross-product turn test",
         "cross(b−a, c−a) > 0  →  left turn (keep);  ≤ 0  →  right turn (pop)",
         "For three consecutive hull candidates a, b, c: a left turn keeps b on the hull; a right turn (or collinear) means b is inside — pop it. Repeat until the stack is convex."),
        ("Step 5: Graham scan complete",
         "hull = stack[0..k]  in CCW order,  O(n log n)",
         "The stack-based scan is one pass over the sorted list — O(n). With sorting, total cost is O(n log n). The hull is the vertices of the convex enclosure."),
    ],

    "chemistry/organic.html": [
        ("Step 1: SMILES grammar",
         "SMILES = atom | bond | branch '(' SMILES ')' | ring-digit",
         "A Simplified Molecular-Input Line-Entry System string is a linear notation for molecular graphs. Atoms are bare element symbols; bonds are `-`, `=`, `#`, `:`; branches use parentheses; rings use digits."),
        ("Step 2: Tokenise",
         "tokens = ['C', 'C', '(', '=', 'O', ')', '1', 'C', 'C', '1']",
         "Split into atoms, bonds, branch markers, and ring-closure digits. The example `CC(=O)1CC1` is acetic-anhydride-like: two carbons, an aldehyde branch, a ring closure."),
        ("Step 3: Recursive descent parser",
         "parse_atom → push vertex;  parse_branch → recurse;  parse_ring → save open digit",
         "A recursive-descent parser walks the token list, pushing vertices onto a stack and recording branch points. Open ring digits are saved in a `pending_rings` map keyed by digit."),
        ("Step 4: Bond order and ring closure",
         "bond = '-' single, '=' double, '#' triple, ':' aromatic;  ring[digit] → close edge",
         "When the same ring digit is seen twice, an edge is drawn between the two atoms. Bond order defaults to single if omitted; aromatic atoms (`c`, `n`) imply aromatic bonds."),
        ("Step 5: Output: molecular graph",
         "G = (V, E)  with V = atoms, E = bonds (labelled by order)",
         "The result is an explicit graph — ready for ring perception, aromaticity detection, 2D coordinate generation, or 3D embedding. The graph is the canonical form RDKit, OpenBabel, and ChemDraw all use internally."),
    ],

    "chemistry/physical.html": [
        ("Step 1: The Arrhenius equation",
         "k = A · exp(−Eₐ / (R·T))",
         "The rate constant k depends on the pre-exponential factor A (frequency of collisions), the activation energy Eₐ, the gas constant R = 8.314 J·(mol·K)⁻¹, and absolute temperature T."),
        ("Step 2: Take the logarithm",
         "ln k = ln A − Eₐ / (R·T)",
         "Log form makes the equation linear in 1/T. Plotting ln k vs 1/T gives a straight line whose slope is −Eₐ/R and whose intercept is ln A."),
        ("Step 3: Linear regression",
         "slope = −Eₐ / R   →   Eₐ = −slope · R",
         "Given measured (Tᵢ, kᵢ) data, fit a line. The slope recovers Eₐ, the intercept recovers A. This is the textbook method for extracting activation energy from rate data."),
        ("Step 4: Half-life (first-order)",
         "t½ = ln(2) / k",
         "For first-order reactions (e.g. radioactive decay, unimolecular decomposition), the half-life is independent of starting concentration — a clean closed-form expression."),
        ("Step 5: Extend to non-Arrhenius regimes",
         "k(T) = A · T^n · exp(−Eₐ / (R·T))  (modified Arrhenius)",
         "For complex reactions (chain branching, surface effects) a T^n pre-factor is added. The modified form fits data across wider temperature ranges — important in combustion and atmospheric chemistry."),
    ],

    # ---------- Mathematics ----------
    "maths/algebra.html": [
        ("Step 1: The Euclidean recurrence",
         "gcd(a, b) = gcd(b, a mod b),  gcd(a, 0) = a",
         "The greatest common divisor of a and b equals the gcd of b and a's remainder. This recursive identity is the foundation of modular arithmetic."),
        ("Step 2: Iterative reduction",
         "while b ≠ 0:  (a, b) ← (b, a mod b)",
         "Rewrite the recursion as a loop to avoid stack growth. Each iteration shrinks the pair — the algorithm terminates in O(log min(a, b)) steps."),
        ("Step 3: Termination and base case",
         "b = 0  →  return a",
         "When b reaches zero, a holds the gcd. This is the only stopping condition; the algorithm is correct by induction on the size of the inputs."),
        ("Step 4: Extended Euclidean (Bézout)",
         "x, y s.t.  a·x + b·y = gcd(a, b)",
         "Track two auxiliary recurrences alongside the main one. The result is a witness pair (x, y) for Bézout's identity — surprising but useful."),
        ("Step 5: Application — RSA modular inverse",
         "e · d ≡ 1 (mod φ(n))   →   d = e⁻¹ mod φ(n)",
         "In RSA, d is the modular inverse of e. Computing it requires extended gcd — the inverse exists iff gcd(e, φ(n)) = 1, and the same algorithm finds it in O(log φ(n)) steps."),
    ],

    "maths/analysis.html": [
        ("Step 1: Partition the interval",
         "h = (b − a) / n,  xᵢ = a + i·h,  i = 0, …, n",
         "Divide [a, b] into n equal subintervals of width h. The composite trapezoidal rule sums a trapezoid area per subinterval."),
        ("Step 2: Per-interval trapezoid",
         "Aᵢ = h · (f(xᵢ) + f(xᵢ₊₁)) / 2",
         "Approximate f on [xᵢ, xᵢ₊₁] by the straight line between its endpoints. The area under the line is the trapezoid area."),
        ("Step 3: Sum — the composite rule",
         "I ≈ (h/2) · [f(a) + 2·Σᵢ₌₁ⁿ⁻¹ f(xᵢ) + f(b)]",
         "Adjacent trapezoids share an edge, so interior points are counted twice with weight ½. The endpoints are counted once each."),
        ("Step 4: Error analysis",
         "E = −(b − a)³ / (12·n²) · f''(ξ),  ξ ∈ [a, b]",
         "The trapezoidal rule has error O(h²) — second-order. For smooth f, doubling n quarters the error. For periodic f, the rule is spectrally accurate (clamped error)."),
        ("Step 5: Richardson extrapolation → Simpson's rule",
         "S = (4·I(h/2) − I(h)) / 3  =  O(h⁴)",
         "Apply Richardson extrapolation to the trapezoidal rule with h and h/2. The result is Simpson's rule — fourth-order accurate and a staple of scientific computing."),
    ],

    "maths/number-theory.html": [
        ("Step 1: Filter small divisors",
         "for p in primes ≤ √n:  if n % p == 0: return False",
         "Trial-division by primes up to √n suffices for small n. For 64-bit integers, deterministic Miller-Rabin with a fixed set of witnesses is faster."),
        ("Step 2: Write n − 1 = 2ˢ · d  (d odd)",
         "decompose n − 1 into powers of 2",
         "Pull out factors of 2 until d is odd. s and d are inputs to the strong-probable-prime test."),
        ("Step 3: Random witness a ∈ [2, n − 2]",
         "a ← random(),  compute x = aᵈ mod n  (fast-exponentiation)",
         "Pick a random base a and compute aᵈ mod n using square-and-multiply — O(log d) modular multiplications."),
        ("Step 4: The strong probable prime test",
         "if x = 1 or x = n − 1: probable prime.  Else: square up to s times.",
         "If x is 1 or n − 1, the test passes. Otherwise, square repeatedly — if any x · x mod n equals n − 1, the test still passes; if it reaches 1 without hitting n − 1, n is composite."),
        ("Step 5: Repeat k times for confidence",
         "P(false positive) < 4⁻ᵏ  →  repeat 40× for cryptographic certainty",
         "Each independent round rules out ¾ of remaining composites. 40 rounds give a false-positive probability < 4⁻⁴⁰ ≈ 10⁻²⁴ — well below cosmic-ray bit-flip rates."),
    ],

    "maths/probability.html": [
        ("Step 1: Target density π(x) (unnormalised)",
         "π(x) ∝ exp(−V(x))   e.g. Boltzmann, posterior",
         "MCMC samples from a density known only up to a constant. The acceptance criterion uses the ratio π(x')/π(x) — the normaliser cancels."),
        ("Step 2: Symmetric proposal",
         "x' = x + ε · N(0, 1)   →   q(x'|x) = q(x|x')",
         "A Gaussian random walk with step size ε. Symmetry (q(x'|x) = q(x|x')) means the proposal's contribution to the acceptance ratio is 1 — simplifying the test."),
        ("Step 3: Acceptance probability",
         "α = min(1, π(x') / π(x))",
         "If the proposed point is more probable than the current one, accept it. Otherwise, accept with probability equal to the ratio — this is what makes the chain detailed-balanced w.r.t. π."),
        ("Step 4: Sample and accept/reject",
         "u ~ Uniform(0, 1);  if u < α: x ← x'  else: stay",
         "Draw a uniform random number; if it falls below α, accept the proposal. Otherwise, the chain stays at x — the current state is re-recorded as a sample (important for correct ergodicity)."),
        ("Step 5: Burn-in + thinning → samples",
         "discard first B samples;  keep every k-th  →  ~ π(x)",
         "Burn-in discards the transient before the chain reaches stationarity. Thinning reduces autocorrelation. The kept samples approximate i.i.d. draws from π — the foundation of Bayesian inference."),
    ],

    # ---------- Physics ----------
    "physics/mechanics.html": [
        ("Step 1: Kinetic and potential energy",
         "T = ½ · m · ẋ²   (one particle),  V(q)  (configuration-dependent)",
         "Kinetic energy is quadratic in velocities; potential energy is a function of generalised coordinates q. Together they describe the system's energy budget."),
        ("Step 2: The Lagrangian",
         "L(q, q̇) = T − V",
         "Subtracting V from T gives a scalar function whose extrema define the equations of motion. L is the input to the variational principle that follows."),
        ("Step 3: Euler-Lagrange equation",
         "d/dt (∂L/∂q̇ᵢ) − ∂L/∂qᵢ = 0   for each i",
         "Hamilton's principle: the action S = ∫ L dt is stationary on the physical trajectory. The Euler-Lagrange equations are the local form — one second-order ODE per generalised coordinate."),
        ("Step 4: Convert to first-order form",
         "pᵢ = ∂L/∂q̇ᵢ,  q̇ᵢ = q̇ᵢ(q, p)  →  ṗ = ∂L/∂q",
         "Introduce conjugate momenta p. The second-order system becomes first-order in (q, p) — Hamilton's equations. This is the form the integrator (RK4, Verlet) acts on."),
        ("Step 5: Integrate to get trajectory",
         "for t in [t₀, T]:  (q, p) ← integrator_step((q, p), dt)",
         "Pick a symplectic integrator (Verlet, leapfrog) to preserve the energy landscape. The result is q(t), p(t) — the trajectory that the Lagrangian implied."),
    ],

    "physics/quantum.html": [
        ("Step 1: The qubit",
         "|ψ⟩ = α|0⟩ + β|1⟩,   |α|² + |β|² = 1",
         "A qubit is a unit vector in ℂ². Measurement in the computational basis yields |0⟩ with probability |α|² and |1⟩ with probability |β|² — Born's rule."),
        ("Step 2: The Hadamard matrix",
         "H = (1/√2) · [[1, 1], [1, −1]]",
         "H is unitary and Hermitian (H = H†, H² = I). It is the gate that creates superposition — the foundation of all quantum algorithms that exploit parallelism."),
        ("Step 3: H |0⟩ = (|0⟩ + |1⟩) / √2",
         "α = 1/√2,  β = 1/√2",
         "Starting from the ground state, Hadamard produces an equal superposition of |0⟩ and |1⟩. Each outcome has probability ½ on measurement."),
        ("Step 4: H |1⟩ = (|0⟩ − |1⟩) / √2",
         "α = 1/√2,  β = −1/√2  (a relative phase)",
         "The relative minus sign is the quantum phase — there is no classical analogue. Combined with H|0⟩, this lets H map computational basis states to a different orthonormal basis (the Hadamard basis)."),
        ("Step 5: H² = I — reversibility",
         "H · H = I   →   H|ψ⟩ twice gives back |ψ⟩",
         "All quantum gates are unitary (and thus reversible). H applied twice returns the original state. This is the foundation of the Deutsch-Jozsa and Grover algorithms — H is the quantum workhorse."),
    ],

    "physics/sound.html": [
        ("Step 1: Frame the signal",
         "x_m[n] = x[m·hop + n]  for 0 ≤ n < N",
         "Slice the input into overlapping frames of length N, advanced by `hop` samples. Overlap (typically N/2) is what makes the reconstruction smooth."),
        ("Step 2: Apply a window",
         "x̃_m[n] = x_m[n] · w[n],   w[n] = ½ − ½·cos(2πn/(N−1))",
         "A Hann window (raised-cosine) tapers the frame edges to zero, reducing spectral leakage. Without a window, the DFT sees abrupt frame boundaries as discontinuities — smearing the spectrum."),
        ("Step 3: DFT of each frame",
         "X_m[k] = Σₙ x̃_m[n] · exp(−i·2π·k·n / N),  k = 0, …, N−1",
         "Compute the discrete Fourier transform of each windowed frame. X_m[k] is the complex amplitude of frequency bin k in frame m. An FFT makes this O(N log N)."),
        ("Step 4: Magnitude spectrogram",
         "S[m, k] = |X_m[k]|   →   optionally 10·log₁₀(S²)",
         "Take the magnitude (discard phase for visualisation). The 2D array S[m, k] is the spectrogram: time on one axis, frequency on the other. Log-scale is conventional for audio."),
        ("Step 5: Inverse STFT (reconstruction)",
         "x̂[m·hop + n] += (1/W) · ÎFFT(X_m)[n]   with overlap-add",
         "To invert: take IFFT of each frame, apply the inverse window (or use a dual window), and overlap-add. The constant 1/W (W = Σ window² at hop) normalises the overlapping windows to unity gain."),
    ],

    "physics/space.html": [
        ("Step 1: Pairwise gravitational force",
         "F_ij = G · mᵢ · mⱼ · (rⱼ − rᵢ) / |rⱼ − rᵢ|³",
         "Newton's inverse-square law. G is the gravitational constant. The force on body i from body j is a vector pointing from i to j with magnitude G·mᵢ·mⱼ/r²."),
        ("Step 2: Total force on body i",
         "Fᵢ = Σ_{j≠i} F_ij   →   O(N²) per step",
         "Sum over all other bodies. For N particles, this is N(N−1)/2 pairs per step — the canonical N-body bottleneck. Barnes-Hut and FMM reduce this to O(N log N) and O(N) respectively."),
        ("Step 3: Acceleration",
         "aᵢ = Fᵢ / mᵢ",
         "Newton's second law. Mass cancels in the gravitational case (a = G·mⱼ·r̂/r²), but keeping it general supports non-gravitational N-body problems (e.g. charged particles, dark-matter sims)."),
        ("Step 4: Kick-drift-kick (leapfrog) integrator",
         "v(t + dt/2) = v(t) + ½·a(t)·dt;  x(t+dt) = x(t) + v(t+dt/2)·dt;  v(t+dt) = v(t+dt/2) + ½·a(t+dt)·dt",
         "Symplectic leapfrog: half-kick, full drift, half-kick. Energy is conserved over exponentially long times (no secular drift) — essential for orbital mechanics."),
        ("Step 5: Softening to avoid singularity",
         "F_ij = G·mᵢ·mⱼ·(rⱼ − rᵢ) / (|rⱼ − rᵢ|² + ε²)^(3/2)",
         "When two bodies come close, |r| → 0 makes F diverge. A softening length ε (typically a fraction of the mean inter-particle spacing) bounds the force and prevents numerical blow-up. The simulation runs stably for billions of timesteps."),
    ],

    "physics/thermo.html": [
        ("Step 1: The Maxwell-Boltzmann speed distribution",
         "f(v) = 4π · (m / (2πkT))^(3/2) · v² · exp(−mv² / (2kT))",
         "The probability density for the speed v of a molecule of mass m at temperature T. k is Boltzmann's constant. f(v) dv is the probability of finding a molecule with speed in [v, v+dv]."),
        ("Step 2: Most-probable speed v_p",
         "v_p = √(2kT / m)   ←  df/dv = 0",
         "Differentiate f(v), set to zero, solve. The most-probable speed is the mode of the distribution — the peak of the curve."),
        ("Step 3: Mean speed ⟨v⟩",
         "⟨v⟩ = ∫ v · f(v) dv = √(8kT / (πm))",
         "The expectation of v under f. This is the speed that appears in mean-free-path and collision-rate formulas in kinetic theory."),
        ("Step 4: RMS speed v_rms",
         "v_rms = √(⟨v²⟩) = √(3kT / m)",
         "The root-mean-square speed comes from the second moment. ⟨v²⟩ = 3kT/m is the equipartition theorem — ½m⟨v²⟩ = (3/2)kT is the average kinetic energy per particle in 3D."),
        ("Step 5: Connect to the ideal-gas law",
         "P·V = N·k·T   (N particles, 3D)",
         "PV = NkT follows directly from ⟨v²⟩ and the momentum-transfer argument. The Maxwell-Boltzmann distribution is the kinetic underpinning of the macroscopic ideal-gas law — statistical mechanics explains thermodynamics."),
    ],

    "physics/waves.html": [
        ("Step 1: The discrete Fourier transform (DFT)",
         "X[k] = Σ_{n=0}^{N−1} x[n] · exp(−i·2π·k·n / N),  k = 0, …, N−1",
         "The DFT maps N samples in time to N frequency bins. Each X[k] is a complex number encoding amplitude and phase of frequency k/N cycles per sample."),
        ("Step 2: Direct computation is O(N²)",
         "for each k:  Σ over n  →  N² complex multiplications",
         "The direct DFT is quadratic — for N = 1024, that's a million operations; for N = 10⁶, a trillion. The FFT makes this tractable."),
        ("Step 3: Cooley-Tukey divide-and-conquer",
         "split x into even-indexed (xₑ) and odd-indexed (xₒ);  recurse",
         "Write the DFT as a sum over even and odd indices. X[k] = E[k] + W_N^k · O[k], where E and O are the (N/2)-point DFTs of the even and odd subsequences. Recurse down to length 1."),
        ("Step 4: The butterfly operation",
         "X[k]       = E[k] + W_N^k · O[k]   X[k + N/2] = E[k] − W_N^k · O[k]",
         "The two outputs share a common sub-expression. The butterfly computes both with one complex multiplication and one addition — half the work of two independent DFTs. This is the FFT's core saving."),
        ("Step 5: Complexity is O(N log N)",
         "T(N) = 2·T(N/2) + O(N)  →  O(N log N)",
         "Master theorem: T(N) = 2·T(N/2) + Θ(N) gives O(N log N). For N = 10⁶, that's 20 million operations instead of a trillion — a 50,000× speedup. The FFT underlies MP3, JPEG, MRI, 5G, and SDR."),
    ],
}

# ---------------------------------------------------------------------------
# CSS to inject (matches the geometry.html pattern)
# ---------------------------------------------------------------------------
CSS_BLOCK = """      .derivation-step { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
      .derivation-step .step-math { font-family: "Cambria Math", Georgia, serif; font-size: 15px; color: var(--accent-2); margin: 6px 0 4px; padding: 6px 10px; background: rgba(6,182,212,0.05); border-radius: 6px; }
      .derivation-step .step-explain { font-size: 12px; color: var(--text-muted); }
"""

# ---------------------------------------------------------------------------
# HTML insertion helpers
# ---------------------------------------------------------------------------

def make_derivation_html(derivation):
    parts = ['      <h2>Math &rarr; Code derivation</h2>']
    for (title, math, explain) in derivation:
        parts.append(f'''      <div class="derivation-step">
        <strong>{title}</strong>
        <div class="step-math">{math}</div>
        <div class="step-explain">{explain}</div>
      </div>''')
    return "\n".join(parts) + "\n\n"

def process_file(path, derivation):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    changed = False

    # 1. Inject CSS before </style> if not present
    if ".derivation-step" not in html:
        # Find the LAST </style> in the file (in case there are multiple)
        m = list(re.finditer(r"</style>", html))
        if not m:
            print(f"  ⚠ no </style> found in {path}")
            return False
        # Inject before the last </style>
        idx = m[-1].start()
        html = html[:idx] + CSS_BLOCK + html[idx:]
        changed = True

    # 2. Inject derivation block before <div class="meta">
    if 'Math &rarr; Code derivation' not in html and 'Math → Code derivation' not in html:
        # Find <div class="meta">
        m = re.search(r'<div class="meta">', html)
        if not m:
            print(f"  ⚠ no <div class=\"meta\"> found in {path}")
            return False
        idx = m.start()
        derivation_html = make_derivation_html(derivation)
        html = html[:idx] + derivation_html + html[idx:]
        changed = True

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        return True
    return False

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not os.path.isdir(ROOT):
        print(f"ERROR: {ROOT} does not exist", file=sys.stderr)
        sys.exit(1)

    total = 0
    succeeded = 0
    skipped = []

    for rel, derivation in DERIVATIONS.items():
        path = os.path.join(ROOT, rel)
        total += 1
        if not os.path.isfile(path):
            print(f"  ⚠ missing: {rel}")
            skipped.append(rel)
            continue
        try:
            ok = process_file(path, derivation)
            if ok:
                print(f"  ✓ enriched: {rel}")
                succeeded += 1
            else:
                print(f"  - already has derivation: {rel}")
                skipped.append(rel)
        except Exception as e:
            print(f"  ✗ failed: {rel}  ({e})")
            skipped.append(rel)

    print()
    print(f"Total sub-pages:  {total}")
    print(f"Enriched:         {succeeded}")
    print(f"Skipped (already had derivation or error): {len(skipped)}")
    if skipped:
        print("  - " + "\n  - ".join(skipped))

if __name__ == "__main__":
    main()

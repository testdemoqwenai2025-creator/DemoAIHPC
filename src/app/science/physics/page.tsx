import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Physics Hub — AIHPC Advanced Science',
  description:
    'Physics Hub — Space / Astrophysics, Waves / Optics, Sound / Acoustics, Mechanics, Quantum, Thermodynamics. Modern AI for physics.',
}

const SUBDOMAINS = [
  { href: '/science/physics/space', title: 'Space & Astrophysics', desc: 'Orbital mechanics, N-body simulation, exoplanet transit detection. Light-curve analysis from Kepler / TESS-style data.', tools: 'N-body solver, FFT, BLS' },
  { href: '/science/physics/waves', title: 'Waves & Optics', desc: 'EM spectrum, diffraction, interference. FFT-based spectroscopy, lens-aberration modelling, holography.', tools: 'FFT, Fresnel propagator, Zernike polynomials' },
  { href: '/science/physics/sound', title: 'Sound & Acoustics', desc: 'Wave equation, room-acoustics simulation, Fourier acoustics. Real-time spectrum and spectrogram visualisation.', tools: 'STFT, Web Audio, FDTD solver' },
  { href: '/science/physics/mechanics', title: 'Mechanics', desc: 'Classical mechanics, rigid-body dynamics, Lagrangian / Hamiltonian formalism. Constraint-based simulators.', tools: 'ODE solver, Verlet, LCP solver' },
  { href: '/science/physics/quantum', title: 'Quantum', desc: 'Schrödinger-equation solver, quantum-circuit simulation, Pauli-transfer matrices. Variational quantum eigensolver.', tools: 'Sparse linear algebra, VQE, Qiskit (Pyodide)' },
  { href: '/science/physics/thermo', title: 'Thermodynamics', desc: 'Equations of state, phase equilibria, statistical mechanics. Monte-Carlo simulation of ensembles.', tools: 'MCMC, Metropolis, EOS calculators' },
]

export default function PhysicsHubPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">Science Hub &middot; Physics</Badge>
      <h1 className="text-4xl font-bold tracking-tight">Physics</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Modern AI for physics — space and astrophysics, waves and optics,
        sound and acoustics, mechanics, quantum, thermodynamics. Inspired
        by DeepMind&apos;s AlphaFold-style data-driven simulation,
        ML-augmented DFT, and physics-informed neural networks.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {SUBDOMAINS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-6 transition-colors hover:border-blue-500/50"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Subdomain
            </span>
            <h2 className="text-xl font-semibold group-hover:text-blue-500">
              {s.title}
            </h2>
            <p className="flex-1 text-sm text-muted-foreground">{s.desc}</p>
            <span className="text-xs font-semibold text-blue-500">
              Tools: {s.tools}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}

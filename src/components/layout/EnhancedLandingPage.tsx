'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ============ TYPES ============
interface EnhancedLandingPageProps {
  darkMode: boolean
  onEnterPlatform: () => void
}

// ============ ICONS ============
const Icons = {
  Logo: () => (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-2xl shadow-2xl shadow-violet-500/40 animate-pulse">
      S
    </div>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  GitHub: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  Star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Cpu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  ),
  Code: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Atom: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Rocket: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    </svg>
  ),
}

// ============ ANIMATED BACKGROUND ============
function QuantumBackground({ darkMode }: { darkMode: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <div className={`absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 -top-48 -left-48 ${
        darkMode ? 'bg-cyan-500' : 'bg-cyan-400'
      }`} />
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-15 top-1/3 -right-32 ${
        darkMode ? 'bg-violet-500' : 'bg-violet-400'
      }`} />
      <div className={`absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-10 bottom-0 left-1/3 ${
        darkMode ? 'bg-fuchsia-500' : 'bg-fuchsia-400'
      }`} />
      
      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${
            darkMode ? 'bg-white/30' : 'bg-gray-400/30'
          }`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.5; }
          75% { transform: translateY(-30px) translateX(15px); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

// ============ FEATURE DATA ============
const features = [
  {
    icon: '🧬',
    title: 'Bioinformatics Pipeline',
    description: 'Complete genomics, proteomics, and transcriptomics analysis tools with integrated databases (GEO, SRA, PRIDE) and automated pipeline orchestration.',
    tech: ['BLAST', 'Bowtie2', 'GATK', 'DESeq2'],
  },
  {
    icon: '⚗️',
    title: 'Cheminformatics Suite',
    description: 'Molecular modeling, drug discovery, and chemical property prediction with SMILES support, molecular docking, and QSAR modeling capabilities.',
    tech: ['RDKit', 'OpenBabel', 'AutoDock', 'QSAR'],
  },
  {
    icon: '🔬',
    title: 'Physics Simulation',
    description: 'Quantum mechanics simulations, materials science modeling, and computational physics workflows with high-performance computing integration.',
    tech: ['Quantum ESPRESSO', 'LAMMPS', 'GROMACS', 'VASP'],
  },
  {
    icon: '🤖',
    title: 'ML/AI Workbench',
    description: 'Integrated machine learning environment with AutoML, neural network design, model training, and deployment pipelines for scientific AI applications.',
    tech: ['PyTorch', 'TensorFlow', 'Scikit-learn', 'JAX'],
  },
  {
    icon: '📊',
    title: 'Data Lake Architecture',
    description: 'Unified data repository supporting multi-modal scientific data with streaming ingestion, metadata management, and cross-domain query capabilities.',
    tech: ['Apache Iceberg', 'Delta Lake', 'Kafka', 'Flink'],
  },
  {
    icon: '💻',
    title: 'Collaborative IDE',
    description: 'Browser-based development environment with real-time collaboration, notebook support, version control integration, and reproducible research containers.',
    tech: ['Jupyter', 'VS Code', 'Docker', 'Git'],
  },
]

const stats = [
  { value: '28+', label: 'Microservices', suffix: '' },
  { value: '6', label: 'Languages', suffix: '' },
  { value: '99.97%', label: 'Uptime SLA', suffix: '' },
  { value: '∞', label: 'Possibilities', suffix: '' },
]

const techStack = [
  { name: 'Golang', color: '#00ADD8', icon: '⚡', desc: 'API Gateway & gRPC' },
  { name: 'Elixir', color: '#4B275F', icon: '✦', desc: 'Real-time Infrastructure' },
  { name: 'Python', color: '#3776AB', icon: '🐍', desc: 'ML/AI Core' },
  { name: 'Scala', color: '#DC322F', icon: '◈', desc: 'Stream Processing' },
  { name: 'Rust', color: '#DEA584', icon: '🦀', desc: 'Query Engine' },
  { name: 'C', color: '#555555', icon: '⚙', desc: 'System Calls' },
]

// ============ MAIN COMPONENT ============
export default function EnhancedLandingPage({ darkMode, onEnterPlatform }: EnhancedLandingPageProps) {
  
  return (
    <div className={`relative min-h-screen overflow-hidden ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Animated Background */}
      <QuantumBackground darkMode={darkMode} />

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Icons.Logo />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent leading-tight">
            SciHub Pro
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-light mb-4 text-gray-300 max-w-3xl mx-auto">
            The Scientific GitHub for the Modern Age
          </p>

          {/* Tagline */}
          <p className="text-base md:text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            Unified open-source platform for Bioinformatics, Cheminformatics, Molecular Modelling, 
            Materials Science, Physics, and ML/Data Science — powered by AETHEL AI.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              onClick={onEnterPlatform}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold text-lg px-8 py-6 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105"
            >
              <Icons.Rocket />
              <span className="ml-2">Launch Platform</span>
              <span className="ml-2"><Icons.ArrowRight /></span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className={`font-semibold text-lg px-8 py-6 border-2 transition-all hover:scale-105 ${
                darkMode 
                  ? 'border-white/20 text-white hover:bg-white/10' 
                  : 'border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icons.GitHub />
              <span className="ml-2">View Source</span>
            </Button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge className="px-4 py-2 text-sm bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 cursor-pointer">
              <Icons.GitHub /> Open Source
            </Badge>
            <Badge className="px-4 py-2 text-sm bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20 cursor-pointer">
              <Icons.Star /> Community Edition — Free Forever
            </Badge>
            <Badge className="px-4 py-2 text-sm bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 cursor-pointer">
              <Icons.Zap /> AETHEL Powered
            </Badge>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className={`relative py-12 border-y ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  {stat.value}{stat.suffix}
                </div>
                <div className={`mt-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything for Scientific Research
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Six integrated domains in one unified platform. From sequence analysis to quantum simulation, 
              SciHub Pro provides the complete toolkit for modern computational science.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i}
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                  darkMode 
                    ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-cyan-500/30' 
                    : 'bg-white border-gray-200 hover:border-cyan-300 hover:shadow-cyan-500/10'
                }`}
              >
                {/* Gradient glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-violet-500/0 to-fuchsia-500/0 group-hover:from-cyan-500/10 group-hover:via-violet-500/5 group-hover:to-fuchsia-500/10 transition-all duration-300" />
                
                <CardContent className="relative p-6">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm mb-4 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                  
                  {/* Tech tags */}
                  <div className="flex flex-wrap gap-2">
                    {feature.tech.map((t, j) => (
                      <span 
                        key={j}
                        className={`text-xs px-2 py-1 rounded-full ${
                          darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POLYGLOT ARCHITECTURE SECTION ===== */}
      <section className={`relative py-24 px-4 border-y ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Polyglot Architecture
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Each language chosen for its specific strengths. Together, they form an unstoppable 
              computational engine for scientific discovery.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech, i) => (
              <div
                key={i}
                className={`group p-4 rounded-xl text-center transition-all hover:scale-105 ${
                  darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
                >
                  {tech.icon}
                </div>
                <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {tech.name}
                </h4>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AETHEL HIGHLIGHT ===== */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className={`relative overflow-hidden ${
            darkMode 
              ? 'bg-gradient-to-br from-violet-900/30 to-cyan-900/30 border-violet-500/20' 
              : 'bg-gradient-to-br from-violet-50 to-cyan-50 border-violet-200'
          }`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-3xl" />
            
            <CardContent className="relative p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-2xl shadow-violet-500/30">
                <Icons.Atom />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powered by AETHEL
              </h2>
              <p className={`text-lg mb-6 max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Advanced Experimental Theoretical Hypercomputing Emulation Layer — our proprietary 
                AI hypercompute engine that accelerates scientific computations by up to 100x through 
                quantum-inspired algorithms and intelligent task distribution.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Badge variant="outline" className="px-4 py-2 text-sm bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  Quantum-Inspired Computing
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm bg-violet-500/10 text-violet-400 border-violet-500/30">
                  Neural Network Acceleration
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30">
                  Intelligent Caching
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== USE CASES / SOCIAL PROOF ===== */}
      <section className={`relative py-24 px-4 border-t ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Real Research
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Trusted by researchers worldwide for production-grade scientific computing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "SciHub Pro reduced our genomic analysis pipeline from 3 days to 4 hours. The integrated AETHEL acceleration is a game-changer.",
                author: "Dr. Sarah Chen",
                role: "Computational Biologist",
                institution: "MIT Broad Institute",
              },
              {
                quote: "The polyglot architecture means we can use the best tool for each job. Python for ML, Rust for queries, Go for APIs — seamless.",
                author: "Prof. James Liu",
                role: "Systems Architect",
                institution: "Stanford HPC",
              },
              {
                quote: "Finally, a platform that treats cheminformatics as a first-class citizen. The molecular modeling tools are exceptional.",
                author: "Dr. Maria Garcia",
                role: "Medicinal Chemist",
                institution: "Novartis AI Lab",
              },
            ].map((testimonial, i) => (
              <Card key={i} className={
                darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className={`text-sm mb-4 italic leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    "{testimonial.quote}"
                  </p>
                  <Separator className={darkMode ? 'bg-white/10' : 'bg-gray-200'} />
                  <div className="mt-4">
                    <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {testimonial.author}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {testimonial.role}, {testimonial.institution}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Research?
          </h2>
          <p className={`text-lg mb-10 max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Join thousands of researchers already using SciHub Pro. Free forever for community edition. 
            No credit card required.
          </p>
          
          <Button
            onClick={onEnterPlatform}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 hover:from-cyan-600 hover:via-violet-600 hover:to-fuchsia-600 text-white font-semibold text-lg px-12 py-7 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105"
          >
            <Icons.Rocket />
            <span className="ml-3">Get Started Free</span>
            <span className="ml-3"><Icons.ArrowRight /></span>
          </Button>

          <p className={`mt-6 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No installation required • Runs in browser • 100+ pre-built templates
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={`relative border-t py-12 px-4 ${darkMode ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-gray-100'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>SciHub Pro</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>The Scientific GitHub</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {['GitHub', 'Discord', 'Twitter', 'Docs'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className={`text-sm transition-colors hover:text-cyan-400 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {link}
                </a>
              ))}
            </div>

            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              © 2024 SciHub Pro • Open Source under MIT License
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

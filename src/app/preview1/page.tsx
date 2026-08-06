'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ============ ICON COMPONENTS ============
const Icons = {
  Atom: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
    </svg>
  ),
  Code: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Server: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Cloud: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
    </svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  ),
  GitBranch: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  ),
  FlaskConical: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/>
    </svg>
  ),
  Microscope: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18h8"/><path d="M9 18v3"/><path d="M10 22h4"/><path d="M15 18V6.5a2.5 2.5 0 0 0-5 0V18"/><path d="M6 14l1.5-6.5"/><path d="M17.5 7.5 19 14"/>
    </svg>
  ),
  Cpu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/>
    </svg>
  ),
  Layers: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Rocket: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  Github: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
}

// ============ ANIMATED BACKGROUND ============
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationId: number
    const particles: Array<{
      x: number; y: number; vx: number; vy: number; 
      size: number; opacity: number; color: string
    }> = []
    
    const colors = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    })
    
    const init = () => {
      resize()
      for (let i = 0; i < 80; i++) {
        particles.push(createParticle())
      }
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
        
        // Connect nearby particles
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color
            ctx.globalAlpha = (1 - dist / 150) * 0.15
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      
      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }
    
    init()
    animate()
    
    window.addEventListener('resize', resize)
    
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #0c1929 0%, #0f172a 50%, #1e1030 100%)' }}
    />
  )
}

// ============ FLOATING MOLECULE VISUALIZATION ============
function FloatingMolecules() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* DNA Helix */}
      <div className="absolute top-[15%] right-[10%] w-32 h-32 opacity-20 animate-pulse">
        <svg viewBox="0 0 100 100" className="w-full h-full text-teal-400">
          <path d="M30 10 Q50 25 70 10 Q50 25 30 40 Q50 55 70 40 Q50 55 30 70 Q50 85 70 70 Q50 85 30 90" 
                fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="30" cy="10" r="4" fill="currentColor"/>
          <circle cx="70" cy="10" r="4" fill="currentColor"/>
          <circle cx="30" cy="40" r="4" fill="currentColor"/>
          <circle cx="70" cy="40" r="4" fill="currentColor"/>
          <circle cx="30" cy="70" r="4" fill="currentColor"/>
          <circle cx="70" cy="70" r="4" fill="currentColor"/>
          <line x1="30" y1="10" x2="70" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <line x1="30" y1="40" x2="70" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <line x1="30" y1="70" x2="70" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>
      </div>
      
      {/* Molecule Structure */}
      <div className="absolute top-[60%] left-[5%] w-28 h-28 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400">
          <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="50" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="80" cy="65" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="20" cy="65" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <line x1="50" y1="35" x2="50" y2="30" stroke="currentColor" strokeWidth="2"/>
          <line x1="63" y1="58" x2="72" y2="62" stroke="currentColor" strokeWidth="2"/>
          <line x1="37" y1="58" x2="28" y2="62" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
      
      {/* Atom Orbit */}
      <div className="absolute bottom-[20%] right-[25%] w-24 h-24 opacity-20" style={{ animation: 'spin 8s linear infinite' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400">
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 50 50)"/>
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 50 50)"/>
          <circle cx="50" cy="50" r="6" fill="currentColor"/>
        </svg>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: `
               linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
             `,
             backgroundSize: '50px 50px'
           }}
      />
    </div>
  )
}

// ============ NAVIGATION ============
function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Icons.Atom />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"/>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-lg tracking-tight">SciHub</span>
              <span className="text-teal-400 font-light ml-1">Pro</span>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Platform', 'Features', 'Domains', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} 
                 className="text-sm text-slate-300 hover:text-white transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 group-hover:w-full transition-all duration-300"/>
              </a>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 hidden sm:flex">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white border-0 shadow-lg shadow-teal-500/25">
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ============ HERO SECTION ============
function HeroSection() {
  return (
    <section id="platform" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <ParticleField />
      <FloatingMolecules />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <Badge className="mb-6 px-4 py-2 bg-white/10 text-teal-300 border border-teal-500/30 text-sm backdrop-blur-sm">
            <Icons.Zap /> <span className="ml-2">Open Source Scientific Computing Platform</span>
          </Badge>
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            The{' '}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Scientific GitHub
            </span>
            <br/>
            For The Modern Age
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            One unified platform for <span className="text-teal-400">Bioinformatics</span>, 
            <span className="text-cyan-400"> Cheminformatics</span>, 
            <span className="text-blue-400"> Molecular Modelling</span>, and more.
            <br className="hidden sm:block"/>
            Run your entire research workflow — from sequence analysis to drug discovery — in one place.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white px-8 py-6 text-lg shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 transition-all hover:scale-105">
              <Icons.Rocket /> <span className="ml-2">Launch Community Edition</span>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg">
              <Icons.Play /> <span className="ml-2">Watch Demo</span>
            </Button>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '50+', label: 'Scientific Tools', icon: '🧬' },
              { value: '10M+', label: 'Researchers Target', icon: '👨‍🔬' },
              { value: '$50B', label: 'Market Size', icon: '💰' },
              { value: '100%', label: 'Open Source Core', icon: '⚡' },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-teal-400 transition-colors">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse"/>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ FEATURES SECTION ============
const features = [
  {
    icon: 'Code',
    title: 'Cloud-Native IDE Studio',
    description: 'Browser-based development environment with syntax highlighting, autocomplete, and real-time collaboration. Support for Python, R, Julia, and more.',
    gradient: 'from-purple-500 to-pink-500',
    tags: ['Jupyter-like', 'Real-time Collab', 'Multi-language']
  },
  {
    icon: 'Server',
    title: 'Microservices Architecture',
    description: 'Each tool runs as an independent containerized service. Scale what you need, when you need it. Zero installation required.',
    gradient: 'from-teal-500 to-emerald-500',
    tags: ['Docker-native', 'Auto-scaling', 'API-first']
  },
  {
    icon: 'Database',
    title: 'Unified Data Layer',
    description: 'Seamless integration between tools. Standardized file formats, shared databases, and automatic data pipeline orchestration.',
    gradient: 'from-blue-500 to-cyan-500',
    tags: ['PostgreSQL', 'MongoDB', 'Blob Storage']
  },
  {
    icon: 'Layers',
    title: 'Package Registry',
    description: 'GitHub-style version control for scientific workflows. Fork, modify, share, and cite research pipelines with DOI support.',
    gradient: 'from-orange-500 to-red-500',
    tags: ['Git-native', 'DOI Citation', 'Reproducible']
  },
  {
    icon: 'Cpu',
    title: 'Compute Orchestrator',
    description: 'From laptop to HPC cluster — one workflow. Automatic job scheduling, GPU acceleration, and distributed computing.',
    gradient: 'from-indigo-500 to-purple-500',
    tags: ['GPU Support', 'HPC Ready', 'Job Queue']
  },
  {
    icon: 'Shield',
    title: 'Enterprise Security',
    description: 'SOC 2 compliant infrastructure with HIPAA/GDPR options. SSO, audit logs, encryption at rest and in transit.',
    gradient: 'from-green-500 to-teal-500',
    tags: ['SOC 2', 'HIPAA', 'SSO/LDAP']
  }
]

function FeaturesSection() {
  const IconComponent = ({ name }: { name: keyof typeof Icons }) => {
    const Icon = Icons[name]
    return <Icon />
  }
  
  return (
    <section id="features" className="relative py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 px-3 py-1 bg-teal-500/10 text-teal-400 border-teal-500/20">
            Platform Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything You Need for
            <br/>
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Modern Research</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            A complete ecosystem designed by scientists, for scientists. No more glue code, no more format conversions — just science.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="group bg-slate-900/50 border-slate-800 hover:border-teal-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-6 relative">
                {/* Gradient Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}/>
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent name={feature.icon as keyof typeof Icons} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ SCIENTIFIC DOMAINS SECTION ============
const domains = [
  {
    name: 'Bioinformatics',
    icon: 'Microscope',
    color: 'emerald',
    tools: ['BLAST', 'Clustal Omega', 'Bowtie2', 'SAMtools', 'GATK', 'DESeq2'],
    description: 'Sequence analysis, genome assembly, variant calling, and transcriptomics'
  },
  {
    name: 'Cheminformatics',
    icon: 'FlaskConical',
    color: 'amber',
    tools: ['RDKit', 'OpenBabel', 'AutoDock Vina', 'GROMACS', 'LAMMPS'],
    description: 'Molecular modeling, docking simulations, and chemical informatics'
  },
  {
    name: 'Materials Science',
    icon: 'Atom',
    color: 'blue',
    tools: ['ASE', 'Quantum ESPRESSO', 'VASP Interface', 'LAMMPS', 'MDAnalysis'],
    description: 'Computational materials, DFT calculations, and molecular dynamics'
  },
  {
    name: 'Physics & Astronomy',
    icon: 'Cpu',
    color: 'purple',
    tools: ['NumPy/SciPy', 'Astropy', 'FEniCS', 'COMSOL Bridge', 'ROOT'],
    description: 'Numerical methods, astrophysical data analysis, and FEM simulations'
  },
  {
    name: 'Data Science / ML',
    icon: 'Database',
    color: 'pink',
    tools: ['scikit-learn', 'TensorFlow', 'PyTorch', 'XGBoost', 'MLflow'],
    description: 'Machine learning pipelines, model training, and experiment tracking'
  },
  {
    name: 'Statistics & Visualization',
    icon: 'Layers',
    color: 'cyan',
    tools: ['R Environment', 'ggplot2', 'Plotly', 'Bokeh', 'Matplotlib Pro'],
    description: 'Statistical analysis, interactive plots, and publication-quality figures'
  }
]

function DomainsSection() {
  const IconComponent = ({ name }: { name: keyof typeof Icons }) => {
    const Icon = Icons[name]
    return <Icon />
  }
  
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 hover:border-amber-400',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 hover:border-purple-400',
    pink: 'from-pink-500/20 to-pink-600/5 border-pink-500/30 hover:border-pink-400',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 hover:border-cyan-400',
  }
  
  const textColorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    cyan: 'text-cyan-400',
  }
  
  return (
    <section id="domains" className="relative py-24 bg-slate-900/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5"
           style={{
             backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
             backgroundSize: '40px 40px'
           }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 px-3 py-1 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            Scientific Domains
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            One Platform,
            <br/>
            <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-400 bg-clip-text text-transparent">Every Discipline</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            From genome sequencing to quantum chemistry — all the tools you need, integrated seamlessly.
          </p>
        </div>
        
        {/* Domains Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain, idx) => (
            <Card key={idx} className={`group bg-gradient-to-br ${colorMap[domain.color]} border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center ${textColorMap[domain.color]} group-hover:scale-110 transition-transform`}>
                    <IconComponent name={domain.icon as keyof typeof Icons} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-slate-100 transition-colors">
                      {domain.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                      {domain.description}
                    </p>
                  </div>
                </div>
                
                {/* Tools List */}
                <div className="flex flex-wrap gap-2">
                  {domain.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ PRICING SECTION ============
const plans = [
  {
    name: 'Community',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for individual researchers, students, and open-source projects.',
    icon: 'Users',
    color: 'slate',
    gradient: 'from-slate-600 to-slate-700',
    cta: 'Get Started',
    popular: false,
    features: [
      { included: true, text: 'Full access to 50+ scientific tools' },
      { included: true, text: 'Web-based IDE with 10GB storage' },
      { included: true, text: 'Community package registry' },
      { included: true, text: 'Public workspaces & collaboration' },
      { included: true, text: 'Basic compute (CPU only)' },
      { included: false, text: 'Private repositories' },
      { included: false, text: 'SSO / Enterprise auth' },
      { included: false, text: 'Priority support' },
    ]
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/user/month',
    description: 'For teams and labs that need more power and privacy.',
    icon: 'Zap',
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
    cta: 'Start Free Trial',
    popular: true,
    features: [
      { included: true, text: 'Everything in Community' },
      { included: true, text: '100GB storage per user' },
      { included: true, text: 'Private repositories & workspaces' },
      { included: true, text: 'GPU compute access' },
      { included: true, text: 'Team collaboration tools' },
      { included: true, text: 'Version history (unlimited)' },
      { included: false, text: 'SSO / Enterprise auth' },
      { included: false, text: 'Dedicated support manager' },
    ]
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For institutions requiring compliance, scale, and dedicated support.',
    icon: 'Shield',
    color: 'purple',
    gradient: 'from-purple-600 to-indigo-600',
    cta: 'Contact Sales',
    popular: false,
    features: [
      { included: true, text: 'Everything in Professional' },
      { included: true, text: 'Unlimited storage & compute' },
      { included: true, text: 'On-premise deployment option' },
      { included: true, text: 'SOC 2 / HIPAA / GDPR compliant' },
      { included: true, text: 'SSO, LDAP, SCIM integration' },
      { included: true, text: 'Custom tool development' },
      { included: true, text: 'SLA guarantee (99.99%)' },
      { included: true, text: 'Dedicated success manager' },
    ]
  }
]

function PricingSection() {
  const IconComponent = ({ name }: { name: keyof typeof Icons }) => {
    const Icon = Icons[name]
    return <Icon />
  }
  
  return (
    <section id="pricing" className="relative py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 px-3 py-1 bg-purple-500/10 text-purple-400 border-purple-500/20">
            Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Start Free,
            <br/>
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">Scale When Ready</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Freemium model inspired by GitHub, VS Code, and Slack. 
            Use the community edition forever, or upgrade for enterprise features.
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <Card key={idx} className={`relative bg-slate-900 border transition-all duration-300 hover:-translate-y-2 ${
              plan.popular ? 'border-teal-500 shadow-xl shadow-teal-500/20 scale-105' : 'border-slate-800 hover:border-slate-700'
            }`}>
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 px-4 py-1">
                    Most Popular ⭐
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-8">
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white`}>
                    <IconComponent name={plan.icon as keyof typeof Icons} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-400">{plan.description}</p>
                  </div>
                </div>
                
                {/* Price */}
                <div className="my-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 ml-1">{plan.period}</span>
                </div>
                
                {/* CTA Button */}
                <Button className={`w-full mb-6 ${plan.popular 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-lg shadow-teal-500/25' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}>
                  {plan.cta}
                </Button>
                
                {/* Features List */}
                <Separator className="mb-4 bg-slate-800"/>
                <ul className="space-y-3">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <span className={`${feature.included ? 'text-teal-400' : 'text-slate-600'} mt-0.5`}>
                        <Icons.CheckCircle />
                      </span>
                      <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ ARCHITECTURE SECTION ============
function ArchitectureSection() {
  const layers = [
    { name: 'Client Layer', items: ['Web IDE', 'Notebook', 'CLI Tool', 'Mobile View'], color: 'teal' },
    { name: 'API Gateway', items: ['REST API', 'GraphQL', 'WebSocket', 'Auth Service'], color: 'cyan' },
    { name: 'Microservices', items: ['BioInfo', 'Chemo', 'Physics', 'DataSci', 'Compute'], color: 'blue' },
    { name: 'Data Layer', items: ['PostgreSQL', 'MongoDB', 'Redis', 'Blob Storage'], color: 'purple' },
    { name: 'Infrastructure', items: ['Kubernetes', 'Docker', 'GPU Cluster', 'CDN'], color: 'pink' },
  ]
  
  const colorClasses: Record<string, string> = {
    teal: 'border-teal-500/50 bg-teal-500/10',
    cyan: 'border-cyan-500/50 bg-cyan-500/10',
    blue: 'border-blue-500/50 bg-blue-500/10',
    purple: 'border-purple-500/50 bg-purple-500/10',
    pink: 'border-pink-500/50 bg-pink-500/10',
  }
  
  return (
    <section className="relative py-24 bg-slate-900/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 px-3 py-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
            Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Cloud-Native
            <br/>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Microservices Architecture</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Built for scale, reliability, and flexibility. Each component is independently deployable and scalable.
          </p>
        </div>
        
        {/* Architecture Diagram */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connection Lines (Background) */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-8 pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-0.5 h-8 bg-gradient-to-b from-slate-700 to-slate-700"/>
            ))}
          </div>
          
          {/* Layers Stack */}
          <div className="space-y-4">
            {layers.map((layer, idx) => (
              <div key={idx} className={`rounded-xl border ${colorClasses[layer.color]} p-6 transform hover:scale-[1.02] transition-all duration-300`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="sm:w-40 flex-shrink-0">
                    <h4 className="font-semibold text-white">{layer.name}</h4>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {layer.items.map((item) => (
                      <Badge key={item} variant="outline" className="border-current text-slate-300 hover:bg-white/5">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Side Annotations */}
          <div className="hidden lg:block absolute -right-4 top-1/4 space-y-8 text-right">
            {[
              { label: 'Browser-based', desc: 'No install needed' },
              { label: 'API-first', desc: 'Full REST/GraphQL' },
              { label: 'Containerized', desc: 'Docker/K8s ready' },
            ].map((note, i) => (
              <div key={i} className="text-sm">
                <div className="text-teal-400 font-medium">{note.label}</div>
                <div className="text-slate-500">{note.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ CTA SECTION ============
function CTASection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl"/>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl"/>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
          <Icons.Github />
          <span className="text-sm text-slate-300">100% Open Source Core</span>
        </div>
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          Ready to Transform Your
          <br/>
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">Research Workflow?</span>
        </h2>
        
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
          Join thousands of scientists who are already using SciHub Pro to accelerate their discoveries. 
          Start free today — no credit card required.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white px-10 py-7 text-lg shadow-xl shadow-teal-500/30">
            <Icons.Rocket /> <span className="ml-2">Get Started Free</span>
          </Button>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-10 py-7 text-lg">
            <Icons.Globe /> <span className="ml-2">View Documentation</span>
          </Button>
        </div>
        
        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-slate-500 mb-4">Trusted by researchers at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {['MIT', 'Stanford', 'Harvard', 'Max Planck', 'CERN', 'NIH'].map((inst) => (
              <span key={inst} className="text-white font-medium text-lg">{inst}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white">
                <Icons.Atom />
              </div>
              <span className="text-white font-bold">SciHub Pro</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              The Scientific GitHub for the Modern Age. Democratizing computational research worldwide.
            </p>
          </div>
          
          {/* Links Columns */}
          {[
            {
              title: 'Product',
              links: ['Features', 'Pricing', 'Enterprise', 'Changelog', 'Roadmap']
            },
            {
              title: 'Resources',
              links: ['Documentation', 'API Reference', 'Tutorials', 'Blog', 'Community']
            },
            {
              title: 'Company',
              links: ['About', 'Careers', 'Contact', 'Press Kit', 'Partners']
            },
            {
              title: 'Legal',
              links: ['Privacy', 'Terms', 'Security', 'Compliance', 'GDPR']
            }
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-500 hover:text-teal-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <Separator className="bg-slate-800 mb-8"/>
        
        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            © 2026 SciHub Pro. Open source under MIT License.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Icons.Github /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Icons.Globe /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============ MAIN PAGE ============
export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <DomainsSection />
      <ArchitectureSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}

// HOME PAGE
// /Users/matthewsimon/Projects/SMNB/smnb/app/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { 
  Github, 
  Zap, 
  Shield, 
  BarChart3, 
  Database,
  MessageSquare,
  Play,
  Users,
  Cpu,
  Calendar,
  Search,
  Brain,
  TrendingUp,
  Eye,
  Radio,
  Mic
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      {/* Main Background Pattern - BMW M-Series Inspired Grayscale */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#191919] via-[#1f1f1f] to-[#262626]"></div>
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-float animate-delay-2"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/8 rounded-full blur-3xl animate-float animate-delay-4"></div>
          <div className="absolute top-2/3 left-1/3 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl animate-float animate-delay-3"></div>
          <div className="absolute top-1/6 right-1/3 w-88 h-88 bg-blue-300/8 rounded-full blur-3xl animate-float animate-delay-1"></div>
        </div>
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10">
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes code-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes light-sweep {
          0% { background-position: -200% center; }
          50% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .animate-code-scroll {
          animation: code-scroll 30s linear infinite;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        .animate-gradient {
          animation: gradient-shift 6s ease infinite;
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        .animate-light-sweep {
          animation: light-sweep 25s ease-in-out infinite;
          background-size: 200% 100%;
        }
        
        /* Animation Delays */
        .animate-delay-1 {
          animation-delay: 1s;
        }
        .animate-delay-2 {
          animation-delay: 2s;
        }
        .animate-delay-3 {
          animation-delay: 3s;
        }
        .animate-delay-4 {
          animation-delay: 4s;
        }
        
        /* Premium Glass Effects - Theme Aware */
        .glass-subtle {
          backdrop-filter: blur(20px) saturate(180%);
          background: rgba(243, 244, 246, 0.8); /* Light mode: gray-100 with transparency */
          border: 1px solid rgba(59, 130, 246, 0.1); /* Electric Blue accent */
        }
        .dark .glass-subtle {
          background: rgba(25, 25, 25, 0.95); /* Dark mode: Base Black with transparency */
        }
        .glass-card {
          backdrop-filter: blur(16px) saturate(160%);
          background: rgba(249, 250, 251, 0.8); /* Light mode: gray-50 with transparency */
          border: 1px solid rgba(59, 130, 246, 0.08); /* Electric Blue accent */
        }
        .dark .glass-card {
          background: rgba(31, 31, 31, 0.8); /* Dark mode: Dark Gray with transparency */
        }
        .glass-accent {
          backdrop-filter: blur(12px) saturate(140%);
          background: rgba(229, 231, 235, 0.9); /* Light mode: gray-200 with transparency */
          border: 1px solid rgba(139, 92, 246, 0.15); /* AI Purple accent */
        }
        .dark .glass-accent {
          background: rgba(38, 38, 38, 0.9); /* Dark mode: Medium Dark with transparency */
        }
        .glass-strong {
          backdrop-filter: blur(24px) saturate(200%);
          background: rgba(243, 244, 246, 0.9); /* Light mode: gray-100 with transparency */
          border: 1px solid rgba(139, 92, 246, 0.1); /* AI Purple accent */
        }
        .dark .glass-strong {
          background: rgba(31, 31, 31, 0.9); /* Dark mode: Dark Gray with transparency */
        }
        
        /* San Francisco Pro Font System */
        * {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
          font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Premium Typography Scale */
        .text-hero {
          font-size: clamp(3rem, 8vw, 6rem);
          line-height: 0.85;
          letter-spacing: -0.04em;
          font-weight: 900;
        }
        .text-display {
          font-size: clamp(2rem, 5vw, 4rem);
          line-height: 0.9;
          letter-spacing: -0.03em;
          font-weight: 800;
        }
        .text-subtitle {
          font-size: clamp(1.25rem, 3vw, 1.5rem);
          line-height: 1.2;
          letter-spacing: -0.01em;
          font-weight: 600;
        }
        .text-body-large {
          font-size: 1.25rem;
          line-height: 1.6;
          font-weight: 400;
        }
        .text-body-elegant {
          font-size: 1.125rem;
          line-height: 1.7;
          font-weight: 400;
        }
        
        /* SMNB BMW M-Series Inspired Color Palette */
        .bg-primary { background-color: #191919; } /* Base Black */
        .bg-secondary { background-color: #1f1f1f; } /* Dark Gray */
        .bg-tertiary { background-color: #262626; } /* Medium Dark */
        .bg-quaternary { background-color: #2d2d2d; } /* Medium */
        .bg-accent { background-color: #404040; } /* Accent Gray */
        .bg-electric-blue { background-color: #3b82f6; } /* Electric Blue */
        .bg-ai-purple { background-color: #8b5cf6; } /* AI Purple */
        .bg-neural-blue { background-color: #1a1a2e; } /* Neural Blue */
        
        .text-primary { color: #ffffff; }
        .text-secondary { color: #e5e5e5; }
        .text-tertiary { color: #b8b8b8; }
        .text-quaternary { color: #9d9d9d; }
        .text-muted { color: #757575; }
        
        .border-secondary { border-color: rgba(59, 130, 246, 0.1); }
        .border-tertiary { border-color: rgba(139, 92, 246, 0.08); }
        
        /* Interactive States */
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
        }
        
        /* Custom Shadows */
        .shadow-primary { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); }
        .shadow-strong { box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4); }
        .shadow-glow { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
      `}</style>

      {/* Navigation Header - Theme-aware */}
      <header className="sticky top-0 z-50 bg-secondary dark:bg-[#1f1f1f] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            
            {/* Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 border border-blue-400/40 rounded-md flex items-center justify-center transition-all duration-300 group-hover:border-blue-400 group-hover:bg-blue-400/5">
                    <Brain className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full animate-pulse-glow"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-mono font-bold text-primary tracking-wider">SMNB</h1>
                  <span className="text-xs font-mono text-blue-400 border border-blue-400/30 px-1.5 py-0.5 rounded">v1.0</span>
                </div>
              </div>
              
              {/* Status Bar */}
              <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse-glow"></div>
                  <span className="text-secondary">live</span>
                </div>
                <div className="text-quaternary">|</div>
                <div className="flex items-center space-x-1">
                  <span className="text-blue-400 font-bold">AI</span>
                  <span className="text-secondary">hosts</span>
                </div>
                <div className="text-quaternary">|</div>
                <div className="flex items-center space-x-1">
                  <span className="text-purple-400 font-bold">multi-agent</span>
                  <span className="text-secondary">pipeline</span>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#platform" className="px-3 py-1.5 text-sm font-mono text-secondary border border-transparent rounded hover:border-blue-400/30 hover:text-primary hover:bg-accent/20 transition-all duration-200">
                platform
              </a>
              <a href="#technology" className="px-3 py-1.5 text-sm font-mono text-secondary border border-transparent rounded hover:border-blue-400/30 hover:text-primary hover:bg-accent/20 transition-all duration-200">
                technology
              </a>
              <a href="/dashboard" className="px-3 py-1.5 text-sm font-mono text-secondary border border-transparent rounded hover:border-blue-400/30 hover:text-primary hover:bg-accent/20 transition-all duration-200">
                dashboard
              </a>
              
              {/* Actions */}
              <div className="flex items-center space-x-2 ml-6 pl-6">
                <ThemeToggle />
                <Button className="px-4 py-1.5 text-sm font-mono font-bold bg-blue-400 border border-blue-400 text-white rounded hover:bg-blue-500 hover:border-blue-500 transition-all duration-200">
                  start_watching
                </Button>
              </div>
            </nav>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" className="p-2 text-secondary border border-transparent rounded hover:border-blue-400/30 hover:text-primary hover:bg-accent/20 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Live Status Ticker - Theme-aware */}
        <div className="bg-accent dark:bg-[#262626] border-b border-blue-800/30 py-2 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#262626] from-2% via-transparent via-50% to-[#262626] to-98% z-10 pointer-events-none"></div>
          <div className="relative z-0">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-sm font-medium tracking-wide">
                <span className="inline-flex items-center mr-8">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse-glow"></span>
                  <span className="text-red-400 font-bold">LIVE</span>
                </span>
                <span className="text-blue-400 font-semibold">AI NEWS CURATION</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-purple-400 font-semibold">MULTI-AGENT</span>
                <span className="text-secondary"> PROCESSING</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-green-400 font-semibold">REAL-TIME</span>
                <span className="text-secondary"> NARRATION</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-orange-400 font-semibold">INTELLIGENT</span>
                <span className="text-secondary"> SCORING</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-cyan-400 font-semibold">WATERFALL</span>
                <span className="text-secondary"> ANIMATIONS</span>
                <span className="text-quaternary mx-6">•</span>
                
                {/* Duplicate content for seamless loop */}
                <span className="inline-flex items-center mr-8">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse-glow"></span>
                  <span className="text-red-400 font-bold">LIVE</span>
                </span>
                <span className="text-blue-400 font-semibold">AI NEWS CURATION</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-purple-400 font-semibold">MULTI-AGENT</span>
                <span className="text-secondary"> PROCESSING</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-green-400 font-semibold">REAL-TIME</span>
                <span className="text-secondary"> NARRATION</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-orange-400 font-semibold">INTELLIGENT</span>
                <span className="text-secondary"> SCORING</span>
                <span className="text-quaternary mx-4">•</span>
                <span className="text-cyan-400 font-semibold">WATERFALL</span>
                <span className="text-secondary"> ANIMATIONS</span>
                <span className="text-quaternary mx-6">•</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Revolutionary Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" id="platform">
        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start lg:items-start">
            
            {/* Hero Content */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-0">
                <div className="inline-flex items-center space-x-3 glass-card px-6 py-3 mb-4 rounded-full">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-glow"></div>
                  <span className="text-secondary font-mono text-sm uppercase tracking-wider">AI-Powered News Intelligence</span>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-hero font-black leading-none">
                    <div className="text-primary">Intelligence at the</div>
                    <div className="text-secondary">Speed of</div>
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-light-sweep"></div>
                      <div className="relative text-blue-400 font-black px-2 py-2 pr-32">Social</div>
                    </div>
                  </h1>
                  
                  <p className="text-body-large text-secondary leading-relaxed max-w-2xl">
                    Transform the chaos of social media into <span className="text-primary font-bold">coherent, intelligent narratives</span> delivered by virtual news hosts. 
                    Our multi-agent AI pipeline processes thousands of posts per minute, surfacing what matters most.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Button size="lg" className="bg-blue-400 text-[#191919] font-bold px-10 py-0 rounded-md shadow-strong text-lg hover:bg-blue-500 transition-colors">
                  <Play className="mr-3 w-5 h-5" />
                  Start Watching
                </Button>
                <Button variant="outline" size="lg" className="border-2 border-purple-400/30 text-white bg-accent dark:bg-[#262626] backdrop-blur-sm px-10 py-4 rounded-xl font-bold text-lg hover:border-purple-400 hover:bg-purple-400/10">
                  <Radio className="mr-3 w-5 h-5" />
                  Meet Your AI Host
                </Button>
              </div>
              
              {/* Live Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-0">
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-red-400">🔥</div>
                  <div className="text-quaternary font-mono text-sm uppercase tracking-wide">Breaking Stories</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-blue-400">🧠</div>
                  <div className="text-quaternary font-mono text-sm uppercase tracking-wide">AI Analysis</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-purple-400">🎙️</div>
                  <div className="text-quaternary font-mono text-sm uppercase tracking-wide">Live Narration</div>
                </div>
              </div>
            </div>
            
            {/* Interactive Console Demo */}
            <div className="lg:col-span-6 lg:pt-0 lg:mt-0">
              <div className="glass-strong rounded-2xl overflow-hidden shadow-strong animate-float">
                {/* Terminal Header - Theme-aware */}
                <div className="bg-accent dark:bg-[#262626] border-b border-blue-400/20 px-8 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-secondary font-mono ml-4">smnb-news-console</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse-glow"></div>
                      <span className="text-white font-semibold text-xs">LIVE PROCESSING</span>
                    </div>
                  </div>
                </div>
                
                {/* Terminal Content - BMW M-Series Base Black */}
                <div className="p-8 h-96 overflow-hidden relative font-mono text-sm bg-background dark:bg-[#191919]">
                  <div className="animate-code-scroll space-y-4">
                    <div className="text-secondary">$ smnb pipeline status</div>
                    <div className="text-blue-400">✓ Reddit aggregator - Active</div>
                    <div className="text-purple-400">✓ Enrichment agent - Processing</div>
                    <div className="text-green-400">✓ Scoring agent - Analyzing sentiment</div>
                    <div className="text-orange-400">✓ Host agent - Ready for narration</div>
                    <div className="text-cyan-400">✓ Scheduler - Optimizing delivery</div>
                    
                    <div className="text-secondary mt-6">$ smnb host narrate --story=&quot;trending&quot;</div>
                    <div className="text-tertiary">🎙️ AI Host: Analyzing top stories...</div>
                    <div className="text-secondary">→ Processing 847 posts from r/technology</div>
                    <div className="text-secondary">→ Sentiment analysis: 73% positive</div>
                    <div className="text-secondary">→ Breaking: New AI breakthrough</div>
                    <div className="text-white">✓ Live narration starting...</div>
                    
                    <div className="text-secondary mt-6">$ smnb waterfall display</div>
                    <div className="text-tertiary">💧 Waterfall Animation: Rendering text...</div>
                    <div className="text-secondary">→ Character-by-character display</div>
                    <div className="text-secondary">→ Typewriter effect active</div>
                    <div className="text-white">✓ Smooth text flow initialized</div>
                    
                    <div className="text-secondary mt-6">$ smnb agents orchestrate</div>
                    <div className="text-tertiary">🧠 Multi-Agent Pipeline: Coordinating...</div>
                    <div className="text-secondary">→ Reddit → Enrichment → Scoring</div>
                    <div className="text-secondary">→ Host Narration → Waterfall Display</div>
                    <div className="text-white">✓ End-to-end processing complete</div>
                    
                    <div className="text-secondary mt-6">$ smnb intelligence report</div>
                    <div className="text-green-400">📊 Stories processed: 12,847</div>
                    <div className="text-blue-400">🎯 Quality score avg: 8.4/10</div>
                    <div className="text-purple-400">💬 Sentiment tracked: Real-time</div>
                    <div className="text-white">✓ Your personal news network is live</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Architecture */}
      <section className="py-16" id="technology">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center glass-card px-6 py-3 rounded-full mb-6">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse-glow"></div>
              <span className="text-secondary font-mono text-sm uppercase tracking-wider">Multi-Agent Architecture</span>
            </div>
            <h2 className="text-display font-black text-primary mb-6 leading-tight">
              <span className="text-primary">Intelligent Processing</span>
              <span className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-light-sweep"></div>
                <span className="relative text-purple-400 font-black px-6 py-2 pr-20">Pipeline</span>
              </span>
            </h2>
            <div className="max-w-4xl mx-auto glass-card rounded-2xl p-6">
              <p className="text-lg text-secondary leading-relaxed">
                <span className="text-primary font-bold">See Through the Noise:</span> Our multi-agent processing pipeline transforms raw Reddit posts 
                into intelligent narratives through enrichment, scoring, and smart scheduling.
              </p>
            </div>
          </div>

          {/* Processing Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
            
            {/* Aggregation */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-accent/10 transition-all duration-500 hover-lift">
              <CardHeader className="bg-accent dark:bg-[#262626] border-b border-blue-400/20 p-6">
                <CardTitle className="text-primary font-bold text-xl flex items-center">
                  <Database className="mr-3 w-6 h-6 text-blue-400" />
                  Aggregation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-secondary leading-relaxed mb-4 text-body-elegant">
                  Real-time collection from multiple Reddit sources with intelligent filtering.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-3 text-blue-400" />
                    <span className="text-secondary">Hot & Rising Posts</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Search className="w-4 h-4 mr-3 text-blue-400" />
                    <span className="text-secondary">Multi-Subreddit</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Shield className="w-4 h-4 mr-3 text-blue-400" />
                    <span className="text-secondary">Quality Filtering</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enrichment */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-accent/10 transition-all duration-500 hover-lift">
              <CardHeader className="bg-accent dark:bg-[#262626] border-b border-purple-400/20 p-6">
                <CardTitle className="text-primary font-bold text-xl flex items-center">
                  <Brain className="mr-3 w-6 h-6 text-purple-400" />
                  Enrichment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-secondary leading-relaxed mb-4 text-body-elegant">
                  AI-powered context addition and content analysis for deeper understanding.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Cpu className="w-4 h-4 mr-3 text-purple-400" />
                    <span className="text-secondary">Context Analysis</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <BarChart3 className="w-4 h-4 mr-3 text-purple-400" />
                    <span className="text-secondary">Sentiment Detection</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MessageSquare className="w-4 h-4 mr-3 text-purple-400" />
                    <span className="text-secondary">Topic Classification</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scoring */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-accent/10 transition-all duration-500 hover-lift">
              <CardHeader className="bg-accent dark:bg-[#262626] border-b border-green-400/20 p-6">
                <CardTitle className="text-primary font-bold text-xl flex items-center">
                  <Zap className="mr-3 w-6 h-6 text-green-400" />
                  Scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-secondary leading-relaxed mb-4 text-body-elegant">
                  Intelligent prioritization based on relevance, quality, and user interest.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-3 text-green-400" />
                    <span className="text-secondary">Relevance Score</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Eye className="w-4 h-4 mr-3 text-green-400" />
                    <span className="text-secondary">Engagement Metrics</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-3 text-green-400" />
                    <span className="text-secondary">Community Impact</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Narration */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-accent/10 transition-all duration-500 hover-lift">
              <CardHeader className="bg-accent dark:bg-[#262626] border-b border-orange-400/20 p-6">
                <CardTitle className="text-primary font-bold text-xl flex items-center">
                  <Mic className="mr-3 w-6 h-6 text-orange-400" />
                  Narration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-secondary leading-relaxed mb-4 text-body-elegant">
                  AI-powered host creates engaging narratives with waterfall text animations.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Radio className="w-4 h-4 mr-3 text-orange-400" />
                    <span className="text-secondary">AI Host Personality</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Play className="w-4 h-4 mr-3 text-orange-400" />
                    <span className="text-secondary">Waterfall Display</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-3 text-orange-400" />
                    <span className="text-secondary">Smart Scheduling</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Features */}
          <div className="glass-card rounded-2xl p-12">
            <h3 className="text-subtitle font-bold text-primary mb-6 text-center">Transparent Intelligence</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-blue-400/20 rounded-2xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">Full Visibility</h4>
                  <p className="text-secondary text-sm">See every processing step</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-purple-400/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">Real-Time Metrics</h4>
                  <p className="text-secondary text-sm">Live scoring and analysis</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-green-400/20 rounded-2xl flex items-center justify-center">
                  <Radio className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">Live Updates</h4>
                  <p className="text-secondary text-sm">Continuous processing</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-orange-400/20 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">AI Personalities</h4>
                  <p className="text-secondary text-sm">Customizable host styles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Host Personalities Section - BMW M-Series Medium Dark */}
      <section className="py-16 bg-accent/20 dark:bg-[#262626]/20" id="hosts">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center glass-card px-6 py-3 rounded-full mb-6">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 animate-pulse-glow"></div>
              <span className="text-secondary font-mono text-sm uppercase tracking-wider">AI Host Personalities</span>
            </div>
            <h2 className="text-display font-black text-primary mb-6 leading-tight">
              <span className="text-primary">Your Personal</span>
              <span className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/30 to-transparent animate-light-sweep"></div>
                <span className="relative text-orange-400 font-black px-6 py-2 pr-20">News Network</span>
              </span>
            </h2>
            <div className="max-w-4xl mx-auto glass-card rounded-2xl p-6">
              <p className="text-lg text-secondary leading-relaxed">
                Choose from multiple AI personalities to deliver your news. From formal broadcast style to 
                <span className="text-primary font-bold"> conversational storytelling</span> - customize your experience.
              </p>
            </div>
          </div>

          {/* Host Personalities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            {/* Professional Anchor */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-[#262626]/10 transition-all duration-500 hover-lift">
              <CardHeader className="bg-[#262626] border-b border-orange-400/20 p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary font-bold text-xl flex items-center">
                    <Mic className="mr-3 w-6 h-6 text-orange-400" />
                    Professional
                  </CardTitle>
                  <div className="bg-orange-400/20 px-3 py-1 rounded-full">
                    <span className="text-orange-400 font-bold text-sm">FORMAL</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-secondary leading-relaxed text-body-elegant">
                    Classic broadcast journalism style with authoritative delivery and structured reporting format.
                  </p>
                  <div className="bg-[#191919]/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-orange-400">&quot;Good evening. Here are tonight&apos;s top stories from across social media...&quot;</div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-orange-400">📺 Broadcast Style</span>
                    <span className="text-secondary">📊 Data-Driven</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversational */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-[#262626]/10 transition-all duration-500 hover-lift">
              <CardHeader className="bg-[#262626] border-b border-blue-400/20 p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary font-bold text-xl flex items-center">
                    <MessageSquare className="mr-3 w-6 h-6 text-blue-400" />
                    Conversational
                  </CardTitle>
                  <div className="bg-blue-400/20 px-3 py-1 rounded-full">
                    <span className="text-blue-400 font-bold text-sm">FRIENDLY</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-secondary leading-relaxed text-body-elegant">
                    Casual, engaging storytelling that makes complex topics accessible and interesting.
                  </p>
                  <div className="bg-[#191919]/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-blue-400">&quot;Hey there! So this is pretty interesting - let me break down what&apos;s happening...&quot;</div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-blue-400">💬 Approachable</span>
                    <span className="text-secondary">🎯 Engaging</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Analyst */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-[#262626]/10 transition-all duration-500 hover-lift">
              <CardHeader className="bg-[#262626] border-b border-purple-400/20 p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary font-bold text-xl flex items-center">
                    <Brain className="mr-3 w-6 h-6 text-purple-400" />
                    Technical
                  </CardTitle>
                  <div className="bg-purple-400/20 px-3 py-1 rounded-full">
                    <span className="text-purple-400 font-bold text-sm">DEEP</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-secondary leading-relaxed text-body-elegant">
                    In-depth analysis with technical insights, perfect for professional audiences.
                  </p>
                  <div className="bg-[#191919]/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-purple-400">&quot;Analyzing the sentiment data, we see a 73% positive correlation with...&quot;</div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-purple-400">🔬 Analytical</span>
                    <span className="text-secondary">📈 Metrics-Focused</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Host Customization Features */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-subtitle font-bold text-primary mb-6 text-center">Advanced Customization</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-orange-400/20 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">Timing Control</h4>
                  <p className="text-secondary text-sm">Set your preferred news delivery schedule</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-blue-400/20 rounded-2xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">Topic Focus</h4>
                  <p className="text-secondary text-sm">Choose specific subreddits and interests</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-purple-400/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">Priority Scoring</h4>
                  <p className="text-secondary text-sm">Adjust what gets highlighted first</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-green-400/20 rounded-2xl flex items-center justify-center">
                  <Radio className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-2">Live Preferences</h4>
                  <p className="text-secondary text-sm">Real-time vs. scheduled delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-16" id="demo">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center glass-card px-6 py-3 rounded-full mb-6">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3 animate-pulse-glow"></div>
              <span className="text-secondary font-mono text-sm uppercase tracking-wider">Live Processing Demo</span>
            </div>
            <h2 className="text-display font-black text-primary mb-6 leading-tight">
              <span className="text-primary">Watch the</span>
              <span className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/30 to-transparent animate-light-sweep"></div>
                <span className="relative text-red-400 font-black px-6 py-2 pr-20">Magic Happen</span>
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Live Feed Visualization */}
            <div className="glass-strong rounded-2xl overflow-hidden shadow-strong">
              <div className="bg-[#262626] border-b border-red-400/20 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-primary font-bold flex items-center">
                    <Radio className="mr-3 w-5 h-5 text-red-400" />
                    Live Reddit Feed
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse-glow"></div>
                    <span className="text-red-400 font-semibold text-xs">PROCESSING</span>
                  </div>
                </div>
              </div>
              <div className="p-6 h-80 overflow-hidden bg-[#191919]">
                <div className="space-y-4 animate-code-scroll">
                  <div className="glass-card rounded-lg p-4 border-l-4 border-red-400">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-400 font-bold text-sm">🔥 TRENDING</span>
                      <span className="text-quaternary text-xs font-mono">r/technology • 2.3k↑</span>
                    </div>
                    <h4 className="text-primary font-semibold mb-1">Major AI Breakthrough in Neural Networks</h4>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-green-400">😊 92% positive</span>
                      <span className="text-blue-400">🏷️ Technology</span>
                      <span className="text-purple-400">⭐ 9.2/10</span>
                    </div>
                  </div>

                  <div className="glass-card rounded-lg p-4 border-l-4 border-orange-400">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-orange-400 font-bold text-sm">📈 DEVELOPING</span>
                      <span className="text-quaternary text-xs font-mono">r/worldnews • 1.8k↑</span>
                    </div>
                    <h4 className="text-primary font-semibold mb-1">Climate Summit Reaches Historic Agreement</h4>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-blue-400">😐 67% neutral</span>
                      <span className="text-green-400">🏷️ Environment</span>
                      <span className="text-purple-400">⭐ 8.7/10</span>
                    </div>
                  </div>

                  <div className="glass-card rounded-lg p-4 border-l-4 border-blue-400">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-bold text-sm">💬 COMMUNITY</span>
                      <span className="text-quaternary text-xs font-mono">r/science • 1.2k↑</span>
                    </div>
                    <h4 className="text-primary font-semibold mb-1">New Study Reveals Surprising Health Benefits</h4>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-green-400">😊 85% positive</span>
                      <span className="text-cyan-400">🏷️ Health</span>
                      <span className="text-purple-400">⭐ 8.1/10</span>
                    </div>
                  </div>

                  <div className="opacity-50">
                    <div className="glass-card rounded-lg p-4 border-l-4 border-gray-400">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 font-bold text-sm">⏳ PROCESSING</span>
                        <span className="text-quaternary text-xs font-mono">r/gaming • 890↑</span>
                      </div>
                      <h4 className="text-primary font-semibold mb-1">Gaming Industry Reports Record Growth</h4>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-gray-400">🧠 Analyzing...</span>
                        <span className="text-gray-400">🏷️ Processing...</span>
                        <span className="text-gray-400">⭐ Scoring...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Host Output */}
            <div className="glass-strong rounded-2xl overflow-hidden shadow-strong">
              <div className="bg-[#262626] border-b border-orange-400/20 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-primary font-bold flex items-center">
                    <Mic className="mr-3 w-5 h-5 text-orange-400" />
                    AI Host Narration
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse-glow"></div>
                    <span className="text-orange-400 font-semibold text-xs">NARRATING</span>
                  </div>
                </div>
              </div>
              <div className="p-6 h-80 overflow-hidden bg-[#191919]">
                <div className="space-y-6">
                  <div className="text-secondary text-sm font-mono mb-4">
                    Host: Professional • Topic: Technology • Priority: High
                  </div>
                  
                  <div className="space-y-4">
                    <div className="glass-card rounded-lg p-4 bg-orange-400/5 border border-orange-400/20">
                      <div className="text-orange-400 font-semibold mb-2">🎙️ Current Narration:</div>
                      <p className="text-primary leading-relaxed">
                        &quot;Good evening. Tonight&apos;s lead story comes from the technology sector, where researchers 
                        have announced a significant breakthrough in neural network architecture. 
                        <span className="text-blue-400"> Our analysis shows overwhelming positive sentiment</span> from 
                        the community, with a quality score of 9.2 out of 10.&quot;
                      </p>
                    </div>

                    <div className="glass-card rounded-lg p-4 bg-blue-400/5 border border-blue-400/20">
                      <div className="text-blue-400 font-semibold mb-2">🧠 Context Analysis:</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-secondary">Engagement Rate:</span>
                          <span className="text-green-400 font-bold">+127% above average</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Discussion Quality:</span>
                          <span className="text-blue-400 font-bold">Technical depth: High</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Community Response:</span>
                          <span className="text-purple-400 font-bold">Expert validation: 89%</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-lg p-4 bg-purple-400/5 border border-purple-400/20">
                      <div className="text-purple-400 font-semibold mb-2">📊 Next in Queue:</div>
                      <div className="space-y-1 text-sm text-secondary">
                        <div>• Climate summit analysis (Priority: Medium)</div>
                        <div>• Health study breakdown (Priority: Medium)</div>
                        <div>• Gaming industry update (Processing...)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Actions */}
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-red-400 text-[#0f0f1e] hover:bg-red-500 font-bold px-8 py-3 text-lg transition-all duration-300">
                <Play className="mr-3 w-5 h-5" />
                Watch Full Demo
              </Button>
              <Button variant="outline" size="lg" className="bg-blue-400/5 border border-blue-400/20 text-blue-400 hover:bg-blue-400 hover:text-white font-bold px-8 py-3 text-lg transition-all duration-300">
                <Radio className="mr-3 w-5 h-5" />
                Try Interactive Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison Section - BMW M-Series Medium Dark */}
      <section className="py-16 bg-accent/20 dark:bg-[#262626]/20" id="features">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center glass-card px-6 py-3 rounded-full mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse-glow"></div>
              <span className="text-secondary font-mono text-sm uppercase tracking-wider">Platform Comparison</span>
            </div>
            <h2 className="text-display font-black text-primary mb-6 leading-tight">
              <span className="text-primary">Why Choose</span>
              <span className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/30 to-transparent animate-light-sweep"></div>
                <span className="relative text-green-400 font-black px-6 py-2 pr-20">SMNB?</span>
              </span>
            </h2>
          </div>

          {/* Comparison Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            
            {/* Traditional News */}
            <Card className="glass-card rounded-2xl overflow-hidden group transition-all duration-500">
              <CardHeader className="bg-[#262626] border-b border-gray-400/20 p-6">
                <CardTitle className="text-gray-400 font-bold text-xl text-center">
                  📺 Traditional News
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <span className="text-red-400 mr-3">✗</span>
                    <span className="text-secondary">Limited coverage scope</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-400 mr-3">✗</span>
                    <span className="text-secondary">Editorial bias</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-400 mr-3">✗</span>
                    <span className="text-secondary">Delayed reporting</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-400 mr-3">✗</span>
                    <span className="text-secondary">Fixed scheduling</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-yellow-400 mr-3">~</span>
                    <span className="text-secondary">Professional delivery</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Raw */}
            <Card className="glass-card rounded-2xl overflow-hidden group transition-all duration-500">
              <CardHeader className="bg-[#262626] border-b border-gray-400/20 p-6">
                <CardTitle className="text-gray-400 font-bold text-xl text-center">
                  📱 Raw Social Media
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-400 mr-3">✓</span>
                    <span className="text-secondary">Real-time updates</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-400 mr-3">✓</span>
                    <span className="text-secondary">Diverse sources</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-400 mr-3">✗</span>
                    <span className="text-secondary">Information overload</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-400 mr-3">✗</span>
                    <span className="text-secondary">No quality filtering</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-400 mr-3">✗</span>
                    <span className="text-secondary">Context missing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SMNB */}
            <Card className="glass-card rounded-2xl overflow-hidden group hover:bg-green-400/5 transition-all duration-500 hover-lift border-2 border-green-400/30">
              <CardHeader className="bg-green-400/10 border-b border-green-400/30 p-6">
                <CardTitle className="text-green-400 font-bold text-xl text-center flex items-center justify-center">
                  <Brain className="mr-2 w-6 h-6" />
                  SMNB Platform
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-400 mr-3">✓</span>
                    <span className="text-secondary">AI-curated intelligence</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-400 mr-3">✓</span>
                    <span className="text-secondary">Real-time processing</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-400 mr-3">✓</span>
                    <span className="text-secondary">Quality scoring</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-400 mr-3">✓</span>
                    <span className="text-secondary">Context enrichment</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-400 mr-3">✓</span>
                    <span className="text-secondary">Personalized delivery</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unique Value Props */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-subtitle font-bold text-primary mb-8 text-center">Unique Advantages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-400/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-primary font-bold mb-2">Multi-Agent AI</h4>
                  <p className="text-secondary text-sm">Specialized agents for each processing step</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-400/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-primary font-bold mb-2">Full Transparency</h4>
                  <p className="text-secondary text-sm">See every step of the processing pipeline</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-400/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Radio className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h4 className="text-primary font-bold mb-2">Live Narration</h4>
                  <p className="text-secondary text-sm">AI hosts deliver engaging story narratives</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-orange-400/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-primary font-bold mb-2">Personalization</h4>
                  <p className="text-secondary text-sm">Tailored to your interests and schedule</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-4xl lg:text-5xl font-black text-primary mb-6">
              Ready to Experience <span className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-light-sweep"></div>
                <span className="relative text-blue-400 font-black px-6 py-2 pr-20">AI News</span>
              </span>?
            </h2>
            <p className="text-lg text-secondary mb-6 leading-relaxed">
              Join the world&apos;s first AI-powered news curation platform. Watch as artificial intelligence 
              transforms social media chaos into coherent, intelligent narratives delivered in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-400 text-[#0f0f1e] hover:bg-blue-500 font-bold px-6 py-3 text-lg transition-all duration-300">
                <Play className="mr-2 w-5 h-5" />
                Start Watching Now
              </Button>
              <Button variant="outline" size="lg" className="bg-purple-400/5 border border-purple-400/20 text-purple-400 hover:bg-purple-400 hover:text-white font-bold px-6 py-3 text-lg transition-all duration-300">
                <Radio className="mr-2 w-5 h-5" />
                View Live Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-8 pt-8 border-t border-blue-400/20">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-secondary">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-glow"></div>
                  <span>Real-time processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-glow"></div>
                  <span>Claude AI powered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse-glow"></div>
                  <span>Open source</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-800/20 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Brand */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 border border-blue-400/40 rounded-md flex items-center justify-center">
                  <Brain className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-primary font-mono">SMNB</div>
              </div>
              <p className="text-secondary mb-4 font-mono text-sm">
                Intelligence at the speed of social. AI-powered news curation that cuts through the noise.
              </p>
            </div>
            
            {/* Platform */}
            <div className="p-4">
              <h3 className="text-primary font-semibold mb-4 font-mono text-sm uppercase tracking-wider">platform</h3>
              <ul className="space-y-3 text-secondary">
                <li><a href="/dashboard" className="hover:text-primary transition-colors font-mono text-sm flex items-center">
                  <span className="mr-2">&gt;</span> dashboard
                </a></li>
                <li><a href="/reddit" className="hover:text-primary transition-colors font-mono text-sm flex items-center">
                  <span className="mr-2">&gt;</span> reddit_feed
                </a></li>
                <li><a href="/dashboard/studio/host" className="hover:text-primary transition-colors font-mono text-sm flex items-center">
                  <span className="mr-2">&gt;</span> ai_host
                </a></li>
              </ul>
            </div>
            
            {/* Technology */}
            <div className="p-4">
              <h3 className="text-primary font-semibold mb-4 font-mono text-sm uppercase tracking-wider">technology</h3>
              <ul className="space-y-3 text-secondary">
                <li><span className="hover:text-blue-400 transition-colors font-mono text-sm flex items-center">
                  <span className="mr-2">&gt;</span> multi_agent_ai
                </span></li>
                <li><span className="hover:text-purple-400 transition-colors font-mono text-sm flex items-center">
                  <span className="mr-2">&gt;</span> claude_integration
                </span></li>
                <li><span className="hover:text-green-400 transition-colors font-mono text-sm flex items-center">
                  <span className="mr-2">&gt;</span> real_time_processing
                </span></li>
              </ul>
            </div>

            {/* System Status */}
            <div className="p-4">
              <h3 className="text-primary font-semibold mb-4 font-mono text-sm uppercase tracking-wider">system_status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-secondary">ai_pipeline:</span>
                  <span className="text-green-400">active</span>
                </div>
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-secondary">reddit_api:</span>
                  <span className="text-blue-400">connected</span>
                </div>
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-secondary">claude_llm:</span>
                  <span className="text-purple-400">ready</span>
                </div>
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-secondary">host_agent:</span>
                  <span className="text-orange-400">narrating</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="border-t border-blue-800/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-secondary text-sm font-mono">
                © 2025 SMNB. Transforming digital noise into intelligent narratives.
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <a href="https://github.com/acdc-digital" className="text-secondary hover:text-primary transition-colors" aria-label="GitHub">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

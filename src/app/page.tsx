'use client';

import AuthForm from '@/components/Platform/AuthForm';
import GlassCard from '@/components/ui/GlassCard';
import { Users, BrainCircuit, ArrowDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <div className="flex flex-col w-full relative">
      {/* Section 1: Entrance / Login - The "Portal" */}
      <section className="min-h-screen w-full flex items-center justify-center relative p-6 md:p-20 overflow-hidden" id="start">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-start"
          >
            <h1 className="text-[100px] md:text-[180px] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 leading-[0.9] select-none drop-shadow-lg">
              ECHO
            </h1>
            <p className="text-2xl md:text-3xl font-light tracking-[0.5em] mt-2 uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-400">
              University OS
            </p>
            <p className="mt-8 text-lg text-slate-600 max-w-md leading-relaxed">
              Your entire digital campus, reimagined. Context-aware AI notes, real-time collaboration, and a living 3D knowledge graph.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex justify-center md:justify-end"
          >
            <AuthForm />
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-400 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll to Explore</span>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* Section 2: AI Notebook - The "Library" */}
      <section className="min-h-screen w-full flex items-center justify-end px-6 md:px-20 relative py-20" id="library">
        <div className="max-w-2xl w-full relative z-10">
          <GlassCard className="p-10 md:p-14 border-l-8 border-l-blue-400 bg-white/40" hoverEffect intensity="high">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-300/30 rounded-full blur-[80px] pointer-events-none mix-blend-multiply" />

            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-xl shadow-blue-500/30 flex items-center justify-center text-white rotate-3 hover:rotate-6 transition-transform">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight mb-2">Neural Notebook</h2>
                <p className="font-mono text-blue-600 tracking-widest text-xs uppercase bg-blue-50 px-3 py-1 rounded-full inline-block border border-blue-100">The Intelligent Knowledge Engine</p>
              </div>
            </div>

            <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-10 font-medium">
              Upload your curriculum and watch it come alive. Our AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold decoration-blue-200 underline decoration-4 underline-offset-4">visualizes concepts</span> in real-time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative p-6 bg-white/60 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-4 right-4 text-blue-200 group-hover:text-blue-500 transition-colors">01</div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Context Search</h3>
                <p className="text-sm text-slate-500">Deep semantic search across all your PDF materials.</p>
              </div>
              <div className="group relative p-6 bg-white/60 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-4 right-4 text-purple-200 group-hover:text-purple-500 transition-colors">02</div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Generative Visuals</h3>
                <p className="text-sm text-slate-500">Auto-generated diagrams for complex topics.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Section 3: Teaching Sessions - The "Lecture Hall" */}
      <section className="min-h-screen w-full flex items-center justify-start px-6 md:px-20 relative py-20" id="lecture">
        <div className="max-w-2xl w-full relative z-10">
          <GlassCard className="p-10 md:p-14 border-l-8 border-l-purple-400 bg-white/40" hoverEffect intensity="high">
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-300/30 rounded-full blur-[80px] pointer-events-none mix-blend-multiply" />

            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-500 shadow-xl shadow-purple-500/30 flex items-center justify-center text-white -rotate-3 hover:-rotate-6 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight mb-2">Live Campus</h2>
                <p className="font-mono text-purple-600 tracking-widest text-xs uppercase bg-purple-50 px-3 py-1 rounded-full inline-block border border-purple-100">Real-time Unity Field</p>
              </div>
            </div>

            <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-10 font-medium">
              See who's studying what in real-time with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 font-bold decoration-purple-200 underline decoration-4 underline-offset-4">Live Radar</span>. Connect instantly.
            </p>

            <div className="bg-white/50 p-2 rounded-[2rem] border border-white/60 shadow-inner">
              <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]" />
                <div className="relative flex items-center justify-between z-10">
                  <div className="flex items-center gap-4">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <div>
                      <div className="text-xs font-mono text-slate-400">SYSTEM STATUS</div>
                      <div className="font-bold text-green-400">ONLINE • 128 PEERS</div>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:scale-105 transition-transform">
                    JOIN HUB
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="h-[50vh] flex items-center justify-center relative bg-gradient-to-t from-blue-50 to-transparent" id="end">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Enroll?</h2>
          <p className="text-slate-500 text-lg font-light mb-8">Your digital campus awaits.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-4">
            Back to Entrance
          </button>
        </div>
      </section>
    </div>
  );
}

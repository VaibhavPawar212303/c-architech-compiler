'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  FastForward, 
  RefreshCw, 
  Terminal, 
  Tv, 
  Activity, 
  Wrench,
  Cpu,
  Database,
  Layers,
  Grid,
  Pause,
  RotateCcw,
  Lock
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import StackVisualizer from './StackVisualizer';
import HeapVisualizer from './HeapVisualizer';
import { StackFrame, HeapObject } from '../types/memory';

interface CompilerCoreProps {
  theme: 'dark' | 'light';
  compilerTab: 'visualizer' | 'theory';
  setCompilerTab: (tab: 'visualizer' | 'theory') => void;
  stack: StackFrame[];
  heap: HeapObject[];
  globals: any[];
  freeHeap: (id: string) => void;
  history?: string[];
  isAutoStepping?: boolean;
}

export default function CompilerCore({
  theme,
  compilerTab,
  setCompilerTab,
  stack,
  heap,
  globals,
  freeHeap,
  history = [],
  isAutoStepping = false
 }: CompilerCoreProps) {
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <motion.div 
      key="compiler"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* TOP REGION: ARCHITECTURAL MEMORY MAP */}
      <section className={`flex-1 overflow-y-auto custom-scrollbar transition-colors relative ${
        theme === 'dark' ? 'bg-[#030303]' : 'bg-white'
      }`}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        
        <div className="p-4 md:p-8 space-y-8 md:space-y-12 relative">
          {/* SYSTEM LOG (TOP-RIGHT PANEL) */}
          <div className={`border-2 rounded-2xl overflow-hidden flex flex-col transition-colors shadow-inner ${
            theme === 'dark' ? 'bg-black/80 border-emerald-500/20 shadow-2xl' : 'bg-slate-50 border-emerald-600/20 shadow-lg'
          }`}>
            <div className={`px-6 py-3 border-b-2 flex items-center justify-between ${
              theme === 'dark' ? 'bg-[#070707]/90 border-emerald-500/20' : 'bg-slate-100 border-emerald-600/20'
            }`}>
              <div className="flex items-center gap-2.5">
                <Terminal size={14} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/80' : 'text-slate-800'}`}>
                  System_Diagnostic_Log
                </span>
              </div>
              {isAutoStepping && (
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-emerald-500 animate-pulse font-bold tracking-widest uppercase">Stepping_</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}
            </div>
            <div 
              ref={logContainerRef}
              className={`h-[150px] overflow-y-auto p-5 custom-scrollbar font-mono text-[10px] md:text-[11px] space-y-1.5 ${
                theme === 'dark' ? 'bg-[#050505] text-emerald-400/80' : 'bg-slate-900 text-emerald-400'
              }`}
            >
              {history.length === 0 ? (
                <div className="text-emerald-500/40 italic flex items-center gap-2">
                  <span>&gt; Initialize sequence ready. Awaiting instruction...</span>
                </div>
              ) : (
                history.map((msg, i) => (
                  <div key={i} className={`flex gap-3 leading-relaxed ${msg.includes('ERROR') ? 'text-red-400' : 'text-emerald-400/80'}`}>
                    <span className="opacity-30 select-none">{String(i+1).padStart(2, '0')}</span>
                    <span>{msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-8">
            {/* THE STACK */}
            <section className="flex flex-col h-[450px] lg:h-[500px] relative border rounded-2xl overflow-hidden transition-colors shadow-inner" style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
              <div className={`sticky top-0 z-20 flex items-center justify-between border-b-2 border-blue-500/20 px-4 md:px-6 py-4 shrink-0 backdrop-blur-md ${
                theme === 'dark' ? 'bg-[#030303]/80' : 'bg-white/80'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Layers size={16} className="text-blue-400 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h2 className={`text-[10px] md:text-sm font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Stack
                    </h2>
                    <p className="text-[8px] font-mono opacity-40 uppercase tracking-widest transition-opacity group-hover:opacity-100">Automatic_Storage</p>
                  </div>
                </div>
                <span className="text-[9px] md:text-[11px] font-mono text-blue-400">0x7FFFFFFF</span>
              </div>
              <div className="flex-1 min-h-0">
                <StackVisualizer theme={theme} stack={stack} />
              </div>
            </section>

            {/* THE HEAP */}
            <section className="flex flex-col h-[450px] lg:h-[500px] relative border rounded-2xl overflow-hidden transition-colors shadow-inner" style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
              <div className={`sticky top-0 z-20 flex items-center justify-between border-b-2 border-emerald-500/20 px-4 md:px-6 py-4 shrink-0 backdrop-blur-md ${
                theme === 'dark' ? 'bg-[#030303]/80' : 'bg-white/80'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Database size={16} className="text-emerald-400 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h2 className={`text-[10px] md:text-sm font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Heap
                    </h2>
                    <p className="text-[8px] font-mono opacity-40 uppercase tracking-widest">Dynamic_Pool</p>
                  </div>
                </div>
                <span className="text-[9px] md:text-[11px] font-mono text-emerald-400">0x00001000</span>
              </div>
              <div className="flex-1 min-h-0">
                <HeapVisualizer theme={theme} heap={heap} freeHeap={freeHeap} />
              </div>
            </section>
          </div>

          {/* STATIC DATA / GLOBALS */}
          {globals.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-8 border-t border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Grid size={14} className="text-amber-400" />
                </div>
                <h2 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Data_Segment
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                {globals.map(g => (
                  <motion.div 
                    layoutId={`global-${g.id}`}
                    key={g.id} 
                    className={`p-2 md:p-3 rounded-xl border group transition-all relative overflow-hidden ${
                      theme === 'dark' ? 'bg-black/40 border-white/5 shadow-inner' : 'bg-white border-black/5 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">_{g.name}</span>
                      <span className="text-[7px] font-mono opacity-30">{g.address}</span>
                    </div>
                    <div className={`text-sm md:text-lg font-mono font-black tabular-nums ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {g.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </section>
    </motion.div>
  );
}

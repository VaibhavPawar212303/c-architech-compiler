'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Terminal, ChevronRight, Zap } from 'lucide-react';
import revisionPrograms from '../data/revision-programs.json';

interface RevisionPortalProps {
  theme: 'dark' | 'light';
  onSelectProgram: (code: string, id: string) => void;
}

export default function RevisionPortal({ theme, onSelectProgram }: RevisionPortalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar"
    >
      <div className="w-full space-y-8 md:space-y-12">
        <div className="space-y-4">
          <h2 className={`text-2xl md:text-4xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Revision_Portal
          </h2>
          <p className="text-xs md:text-sm opacity-60 max-w-2xl font-mono uppercase tracking-[0.2em]">
            Select a program to analyze its memory footprint and execution flow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {revisionPrograms.map((program) => (
            <button
              key={program.id}
              onClick={() => onSelectProgram(program.code, program.id)}
              className={`group p-5 md:p-6 border text-left transition-all hover:scale-[1.02] active:scale-95 ${
                theme === 'dark' 
                  ? 'bg-black/60 border-white/5 hover:border-amber-500/40 shadow-2xl' 
                  : 'bg-white border-black/10 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className={`p-2 md:p-3 border ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-600/10 border-amber-600/20'}`}>
                  <Terminal size={20} className="text-amber-500 md:w-6 md:h-6" />
                </div>
                <span className="text-[8px] md:text-[10px] font-black opacity-20 uppercase tracking-[0.3em]">C_MODULE</span>
              </div>
              <h3 className={`text-lg md:text-xl font-black mb-2 md:mb-3 group-hover:text-amber-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {program.title}
              </h3>
              <p className="text-[10px] md:text-xs opacity-50 leading-relaxed mb-6 md:mb-8">
                {program.description}
              </p>
              <div className="flex items-center gap-2 text-amber-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Execute_Blueprint</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        <div className={`p-6 md:p-10 border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-600/5 border-blue-600/10'}`}>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start">
            <div className="p-3 md:p-4 bg-blue-500/10 border border-blue-500/20">
               <Zap className="text-blue-500 md:w-8 md:h-8" size={24} />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-black uppercase tracking-widest mb-1 md:mb-2 text-blue-500">Revision Instructions</h4>
              <p className="text-[10px] md:text-xs opacity-60 leading-relaxed">
                The Revision Lab provides optimized code samples for core concepts. 
                Clicking a module will load it into the <b>Compiler_Core</b>, 
                where you can step through execution to see how variables change on the <b>Stack</b> and <b>Heap</b>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Cpu, 
  Workflow, 
  Database, 
  Tv, 
  Zap,
  Network,
  Activity,
  Search
} from 'lucide-react';
import learningHubData from '../data/learning-hub.json';

const LEARNING_ICONS: Record<string, React.ElementType> = {
  Cpu,
  Workflow,
  Database,
  Tv,
  Zap,
  Network,
  Activity,
  Search
};

interface LearningHubProps {
  theme: 'dark' | 'light';
  selectedChapter: number | null;
  setSelectedChapter: (id: number | null) => void;
  onDeployModule: (revisionId: string) => void;
}

export default function LearningHub({ 
  theme, 
  selectedChapter, 
  setSelectedChapter,
  onDeployModule
}: LearningHubProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar"
    >
      <div className="w-full">
        <AnimatePresence mode="wait">
          {selectedChapter === null ? (
            <motion.div 
              key="index"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className={`text-5xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  C_Learning_Path
                </h2>
                <p className="text-sm opacity-60 font-mono uppercase tracking-[0.2em]">
                  Master the foundations of system programming through structured modules.
                </p>
              </div>

              <div className={`grid gap-4 ${learningHubData.chapters.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'}`}>
                {learningHubData.chapters.map((card) => {
                  const IconComp = LEARNING_ICONS[card.icon] || Zap;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedChapter(card.id)}
                      className={`group p-6 border text-left transition-all hover:scale-[1.02] active:scale-95 ${
                        theme === 'dark' 
                          ? 'bg-black/60 border-white/5 hover:border-indigo-500/40 shadow-2xl' 
                          : 'bg-white border-black/10 shadow-lg hover:shadow-xl'
                      }`}
                    >
                       <div className="flex items-start justify-between mb-6">
                          <div className={`p-3 border ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-600/10 border-indigo-600/20'}`}>
                            <IconComp className="text-indigo-500" size={20} />
                          </div>
                          <span className="text-[8px] font-black opacity-20 uppercase tracking-[0.3em]">CH_0{card.id}</span>
                       </div>
                       <h3 className={`text-lg font-black mb-2 group-hover:text-indigo-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {card.title}
                       </h3>
                       <p className="text-[10px] opacity-50 mb-6 leading-relaxed line-clamp-2">{card.desc}</p>
                       <div className="flex items-center gap-2 text-indigo-500">
                          <span className="text-[9px] font-black uppercase tracking-widest">Start_Learning</span>
                          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chapter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
               {(() => {
                 const chapter = learningHubData.chapters.find(c => c.id === selectedChapter);
                 if (!chapter) return null;

                 return (
                   <>
                     <button 
                       onClick={() => setSelectedChapter(null)}
                       className="flex items-center gap-3 text-emerald-500 group"
                     >
                       <div className="rotate-180"><ChevronRight size={20} /></div>
                       <span className="text-xs font-black uppercase tracking-widest">Back_to_Index</span>
                     </button>

                     <div className={`p-1 overflow-hidden border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-black/10 shadow-2xl'}`}>
                        <div className={`p-8 border-b ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-slate-50'}`}>
                           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-4 block">MODULE_ANALYSIS_VIEW</span>
                           <h2 className={`text-5xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {chapter.fullTitle}
                           </h2>
                        </div>

                        <div className={`flex flex-col md:flex-row items-center justify-between p-10 border-b ${theme === 'dark' ? 'bg-emerald-500/5 border-white/5' : 'bg-emerald-600/5 border-black/5'}`}>
                           <div className="mb-6 md:mb-0">
                              <h4 className="text-xl font-black text-emerald-500 mb-2 italic tracking-tight">Ready for a live simulation?</h4>
                              <p className="text-xs opacity-50 uppercase tracking-widest">Load related blueprint into the compiler core</p>
                           </div>
                           <button 
                             onClick={() => onDeployModule(chapter.relatedRevisionId)}
                             className="bg-emerald-500 hover:bg-emerald-400 text-black px-10 py-4 font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95"
                           >
                             Deploy_Module
                           </button>
                        </div>

                        <div className="p-12 space-y-16">
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                              <div className="space-y-8">
                                 <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">01_Conceptual_Framework</h4>
                                    <p className="text-lg opacity-80 leading-relaxed font-medium">
                                      {chapter.framework}
                                    </p>
                                 </div>
                                 <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">02_Key_Mechanics</h4>
                                    <ul className="space-y-4">
                                       {learningHubData.mechanics.map((item, idx) => (
                                         <li key={idx} className="flex gap-4 items-center text-sm opacity-60">
                                            <div className="w-1.5 h-1.5 bg-emerald-500" />
                                            {item}
                                         </li>
                                       ))}
                                    </ul>
                                 </div>
                                 
                                 {(chapter as any).realWorldExamples && (
                                   <div className="space-y-4 pt-4">
                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">03_Real_World_LIFO</h4>
                                     <div className={`p-6 border ${theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-600/5 border-indigo-600/10'}`}>
                                       <ul className="space-y-3">
                                         {(chapter as any).realWorldExamples.map((example: string, idx: number) => (
                                           <li key={idx} className="flex gap-4 items-start text-sm">
                                             <div className="mt-1.5 w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                                             <span className="opacity-70 italic">{example}</span>
                                           </li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                 )}
                              </div>

                              <div className="space-y-8">
                                 {(chapter as any).terminologies && (
                                   <div className="space-y-4 pt-4">
                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">04_Basic_Terminologies</h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {(chapter as any).terminologies.map((t: any, idx: number) => (
                                         <div key={idx} className={`p-4 border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-600/5 border-blue-600/10'}`}>
                                           <div className="text-xs font-black uppercase tracking-widest text-blue-500 mb-1">{t.term}</div>
                                           <div className="text-[10px] opacity-60 leading-relaxed">{t.def}</div>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}

                                 {(chapter as any).stackTypes && (
                                   <div className="space-y-4 pt-4">
                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">05_Stack_Architectures</h4>
                                     <div className="space-y-3">
                                       {(chapter as any).stackTypes.map((s: any, idx: number) => (
                                         <div key={idx} className={`p-4 border border-dashed ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-600/5 border-amber-600/20'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                              <div className="text-xs font-black uppercase tracking-widest text-amber-500">{s.type}</div>
                                            </div>
                                            <p className="text-[10px] opacity-60 leading-relaxed italic">{s.desc}</p>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}

                                 {(chapter as any).implementation && (
                                   <div className="space-y-4">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">06_Implementation_Workflow</h4>
                                      <div className={`p-6 border border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-black/10'}`}>
                                         <ul className="space-y-4">
                                            {(chapter as any).implementation.map((step: string, idx: number) => (
                                              <li key={idx} className="flex gap-4 items-start text-[11px] leading-relaxed">
                                                 <span className="font-mono text-emerald-500 opacity-50">[{idx+1}]</span>
                                                 <span className="opacity-70">{step}</span>
                                              </li>
                                            ))}
                                         </ul>
                                      </div>
                                   </div>
                                 )}


                              </div>
                           </div>
                        </div>
                     </div>
                   </>
                 );
               })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

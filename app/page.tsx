'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Play, FastForward, RotateCcw, Pause, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';
import TopNavigation from './components/TopNavigation';
import CompilerCore from './components/CompilerCore';
import DSAWorld from './components/DSAWorld';
import CodeEditor from './components/CodeEditor';
import RevisionPortal from './components/RevisionPortal';
import LearningHub from './components/LearningHub';
import { useCompiler } from './hooks/useCompiler';
import revisionPrograms from './data/revision-programs.json';

const INITIAL_CODE = `#include <stdio.h>

// Level 0: The Appliance Blueprint
struct Appliance {
    int isOn;       // 0 for OFF, 1 for ON
    int power;      // Speed/Brightness
};

// Level 1: The Room Structure
struct Room {
    struct Appliance fan;    // Nested Struct
    struct Appliance bulb;   // Nested Struct
    int windowOpen;          // 0 for Closed, 1 for Open
};

// Level 2: The House Structure
struct House {
   struct Room livingRoom;
   struct Room kitchen;
   struct Room beedRoomOne;
   struct Room beedRoomTwo;
};

int main() {
    // Creating our "House" on the STACK
    struct House myHome;

    // livingRoom configuration
    myHome.livingRoom.fan.isOn   = 1;
    myHome.livingRoom.fan.power  = 50; 
    myHome.livingRoom.bulb.isOn  = 1;
    myHome.livingRoom.bulb.power = 20;
    myHome.livingRoom.windowOpen = 0; 
    
     // kitchen configuration
    myHome.kitchen.fan.isOn   = 0;
    myHome.kitchen.fan.power  = 0; 
    myHome.kitchen.bulb.isOn  = 0;
    myHome.kitchen.bulb.power = 0;
    myHome.kitchen.windowOpen = 1;
    
     // beedRoomOne configuration
    myHome.beedRoomOne.fan.isOn   = 1;
    myHome.beedRoomOne.fan.power  = 50; 
    myHome.beedRoomOne.bulb.isOn  = 1;
    myHome.beedRoomOne.bulb.power = 50;
    myHome.beedRoomOne.windowOpen = 0;

    // beedRoomTwo configuration
    myHome.beedRoomTwo.fan.isOn   = 0;
    myHome.beedRoomTwo.fan.power  = 0; 
    myHome.beedRoomTwo.bulb.isOn  = 1;
    myHome.beedRoomTwo.bulb.power = 100;
    myHome.beedRoomTwo.windowOpen = 1;
    
    printf("House configured successfully.\\n");
    return 0;
}
`;

const ENABLE_BETA = process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true';

function MemoryArchitectContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mainTab, setMainTab] = useState<'compiler' | 'dsa' | 'revision' | 'learning'>('compiler');
  const [compilerTab, setCompilerTab] = useState<'visualizer' | 'theory'>('visualizer');
  const [selectedLearningChapter, setSelectedLearningChapter] = useState<number | null>(null);
  const [editorWidth, setEditorWidth] = useState<number>(460);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const {
    stack, heap, globals, code, setCode, currentLine, history, isAutoStepping, setIsAutoStepping,
    isAwaitingInput, userInput, setUserInput, inputTarget, handleInputSubmit, runCode, stepCode,
    resetCompiler, logEndRef, freeHeap
  } = useCompiler(INITIAL_CODE);

  // Sync state with local storage and URL
  useEffect(() => {
    // 1. Sync theme from localStorage
    const savedTheme = localStorage.getItem('kernel_trace_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme as any);
    }

    // 2. Sync tab from URL
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['compiler', 'dsa', 'revision', 'learning'].includes(tabFromUrl)) {
      setMainTab(tabFromUrl as any);
    }

    // 3. Sync code from URL (Revision) or localStorage
    const revId = searchParams.get('rev');
    if (revId) {
      const program = revisionPrograms.find(p => p.id === revId);
      if (program) {
        setCode(program.code);
      }
    } else {
      const savedCode = localStorage.getItem('kernel_trace_code');
      if (savedCode) {
        setCode(savedCode);
      }
    }

    // 4. Sync editor width from localStorage
    const savedWidth = localStorage.getItem('kernel_trace_editor_width');
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 300 && parsed <= 900) {
        setEditorWidth(parsed);
      }
    }

    setIsMounted(true);
  }, []); // Run only once on mount

  // Persist editor width changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('kernel_trace_editor_width', editorWidth.toString());
    }
  }, [editorWidth, isMounted]);

  // Persist code changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('kernel_trace_code', code);
    }
  }, [code, isMounted]);

  // Persist theme changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('kernel_trace_theme', theme);
    }
  }, [theme, isMounted]);

  // Update URL when tab changes
  const handleTabChange = (newTab: 'compiler' | 'dsa' | 'revision' | 'learning') => {
    setMainTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    // If switching away from compiler, maybe keep the rev? Or clear it? 
    // Usually switching tab should clear sub-params if not relevant
    if (newTab !== 'compiler') params.delete('rev');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Ensure mainTab is valid if beta is disabled
  useEffect(() => {
    if (!ENABLE_BETA && (mainTab === 'dsa')) {
      handleTabChange('compiler');
    }
  }, [mainTab, ENABLE_BETA]);

  if (!isMounted) return null;

  const handleSelectProgram = (newCode: string, revId?: string) => {
    setCode(newCode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'compiler');
    if (revId) params.set('rev', revId); else params.delete('rev');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setMainTab('compiler');
    resetCompiler();
  };

  return (
    <main 
      className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-hidden ${
      theme === 'dark' ? 'bg-[#070708] text-slate-300' : 'bg-[#EFEEEA] text-slate-800'
    }`}>
      {/* Background Accents */}
      {theme === 'dark' ? (
        <>
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,#1e1b4b_0%,transparent_50%)] pointer-events-none opacity-40" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,#1e293b_0%,transparent_40%)] pointer-events-none opacity-30" />
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none brightness-100 contrast-150" />
        </>
      ) : (
        <div className="fixed inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-40" />
      )}

      <TopNavigation 
        theme={theme} 
        setTheme={setTheme} 
        mainTab={mainTab} 
        setMainTab={handleTabChange} 
        enableBeta={ENABLE_BETA}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* SHARED LEFT COLUMN: CODE EDITOR & CONTROLS */}
        {(mainTab === 'compiler' || mainTab === 'dsa') && (
          <section 
            style={{ '--editor-width': `${editorWidth}px` } as React.CSSProperties}
            className={`w-full md:w-[var(--editor-width)] md:min-w-[300px] md:max-w-4xl flex flex-col border-b md:border-b-0 md:border-r transition-all duration-300 ease-in-out flex-shrink-0 ${
              theme === 'dark' ? 'border-white/10 bg-black/60 shadow-2xl' : 'border-black/10 bg-white shadow-xl'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between z-10 ${
              theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-black/5'
            }`}>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/40' : 'text-slate-900/40'}`}>
                  Source_Kernel.c
                </span>

                {/* Editor Width Adjuster */}
                <div className={`flex items-center gap-0.5 rounded-md p-0.5 border ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-slate-300' 
                    : 'bg-black/5 border-black/5 text-slate-700'
                } ml-2`}>
                  <button 
                    onClick={() => setEditorWidth(prev => Math.max(prev - 60, 320))}
                    disabled={editorWidth <= 320}
                    title="Reduce Editor Width (-60px)"
                    className={`p-1 rounded transition-all disabled:opacity-20 ${
                      theme === 'dark' 
                        ? 'hover:text-white hover:bg-white/10' 
                        : 'hover:text-black hover:bg-black/10'
                    }`}
                  >
                    <ChevronLeft size={10} />
                  </button>
                  <span className="text-[8px] font-mono opacity-60 px-1 font-bold tracking-tight min-w-[32px] text-center">
                    {editorWidth}px
                  </span>
                  <button 
                    onClick={() => setEditorWidth(prev => Math.min(prev + 60, 800))}
                    disabled={editorWidth >= 800}
                    title="Extend Editor Width (+60px)"
                    className={`p-1 rounded transition-all disabled:opacity-20 ${
                      theme === 'dark' 
                        ? 'hover:text-white hover:bg-white/10' 
                        : 'hover:text-black hover:bg-black/10'
                    }`}
                  >
                    <ChevronRight size={10} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex bg-black/20 rounded-full p-1 border border-white/5">
                  <button 
                    onClick={() => setIsAutoStepping(!isAutoStepping)}
                    disabled={isAwaitingInput}
                    title={isAutoStepping ? "Halt" : "Auto Step"}
                    className={`p-1.5 md:p-2 rounded-full transition-all ${
                      isAutoStepping ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {isAutoStepping ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button 
                    onClick={stepCode}
                    disabled={isAutoStepping || isAwaitingInput}
                    title="Step Forward"
                    className="p-1.5 md:p-2 text-white/40 hover:text-white disabled:opacity-20 active:scale-90"
                  >
                    <FastForward size={14} />
                  </button>
                </div>
                <button 
                  onClick={resetCompiler}
                  title="Reset Simulation"
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors active:scale-95"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden group min-h-[300px]">
              <CodeEditor 
                code={code} 
                setCode={setCode} 
                currentLine={currentLine} 
                theme={theme}
              />

              {/* DYNAMIC I/O OVERLAY */}
              <AnimatePresence>
                {isAwaitingInput && (
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="absolute inset-0 bg-blue-600/95 backdrop-blur-md flex flex-col justify-center p-6 z-20"
                  >
                    <div className="flex flex-col gap-4">
                      <header className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Input_Required</span>
                        <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/90">ptr: {inputTarget?.name} ({inputTarget?.type})</span>
                      </header>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter value..."
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit(e as any)}
                          autoFocus
                          className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50 outline-none transition-all"
                        />
                        <button
                          onClick={(e) => handleInputSubmit(e as any)}
                          className="bg-white text-blue-600 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg active:scale-95"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {mainTab === 'compiler' ? (
            <CompilerCore
              theme={theme}
              compilerTab={compilerTab}
              setCompilerTab={setCompilerTab}
              stack={stack}
              heap={heap}
              globals={globals}
              freeHeap={freeHeap}
              history={history}
              isAutoStepping={isAutoStepping}
            />
          ) : (mainTab === 'dsa' && ENABLE_BETA) ? (
            <div className="flex-1 overflow-y-auto">
              <DSAWorld theme={theme} stack={stack} heap={heap} globals={globals} setCode={setCode} />
            </div>
          ) : mainTab === 'revision' ? (
            <RevisionPortal 
              theme={theme} 
              onSelectProgram={handleSelectProgram} 
            />
          ) : mainTab === 'learning' ? (
            <LearningHub 
              theme={theme}
              selectedChapter={selectedLearningChapter}
              setSelectedChapter={setSelectedLearningChapter}
              onDeployModule={(revId) => {
                const program = revisionPrograms.find(p => p.id === revId);
                if (program) handleSelectProgram(program.code, revId);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
               <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Access Restricted_</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function MemoryArchitect() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white font-mono animate-pulse">Initializing System_</p></div>}>
      <MemoryArchitectContent />
    </Suspense>
  );
}

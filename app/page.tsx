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
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
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

  const dark = theme === 'dark';
  const showEditor = mainTab === 'compiler' || mainTab === 'dsa';
  const currentRev = searchParams.get('rev') ?? '';
  const card = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const title = dark ? 'text-white' : 'text-slate-900';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const ghostBtn = dark
    ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
    : 'border-slate-200 text-slate-900 hover:bg-slate-50';

  return (
    <main
      className={`h-screen flex flex-col font-sans transition-colors duration-300 overflow-hidden ${
        dark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <TopNavigation
        theme={theme}
        setTheme={setTheme}
        mainTab={mainTab}
        setMainTab={handleTabChange}
        enableBeta={ENABLE_BETA}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* CONTROL BAR */}
        {showEditor && (
          <div className={`mx-4 md:mx-8 mt-4 rounded-2xl border px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-3 ${card}`}>
            <div className="mr-auto">
              <h1 className={`text-base font-bold leading-tight ${title}`}>Memory visualizer</h1>
              <p className={`text-xs ${muted}`}>Run C code and watch the stack and heap change, line by line.</p>
            </div>

            <label className="flex items-center gap-2">
              <span className="sr-only">Example program</span>
              <select
                value={currentRev}
                onChange={(e) => {
                  const program = revisionPrograms.find((p) => p.id === e.target.value);
                  if (program) handleSelectProgram(program.code, program.id);
                }}
                className={`h-10 rounded-[10px] border px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  dark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="" disabled={!!currentRev}>{currentRev ? 'Choose an example' : 'My code'}</option>
                {revisionPrograms.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>

            <div className={`flex items-center gap-1.5 rounded-xl p-1 ${dark ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <button
                onClick={() => setIsAutoStepping(!isAutoStepping)}
                disabled={isAwaitingInput}
                title={isAutoStepping ? 'Pause auto step' : 'Auto step'}
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
                  isAutoStepping ? 'bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isAutoStepping ? <Pause size={13} /> : <Play size={13} />}
                {isAutoStepping ? 'Pause' : 'Auto step'}
              </button>
              <button
                onClick={stepCode}
                disabled={isAutoStepping || isAwaitingInput}
                title="Step forward"
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 ${dark ? 'bg-slate-900' : 'bg-white'} ${ghostBtn}`}
              >
                <FastForward size={13} /> Step
              </button>
              <button
                onClick={resetCompiler}
                title="Reset simulation"
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${dark ? 'bg-slate-900' : 'bg-white'} ${ghostBtn}`}
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:px-8 md:pb-8 overflow-hidden min-h-0">
          {/* EDITOR CARD */}
          {showEditor && (
            <section
              style={{ '--editor-width': `${editorWidth}px` } as React.CSSProperties}
              className="w-full lg:w-[var(--editor-width)] lg:min-w-[300px] lg:max-w-4xl flex flex-col rounded-2xl overflow-hidden bg-slate-900 text-slate-200 border border-slate-800 shadow-lg flex-shrink-0 min-h-[360px] lg:min-h-0"
            >
              <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-mono text-slate-300">main.c</span>
                  <span className="rounded-full bg-blue-950 text-blue-300 px-2.5 py-0.5 text-[11px] font-semibold">ANSI C</span>
                </div>

                {/* Editor width adjuster */}
                <div className="hidden lg:flex items-center gap-0.5 rounded-lg p-0.5 bg-slate-900 border border-slate-700 text-slate-300">
                  <button
                    onClick={() => setEditorWidth((prev) => Math.max(prev - 60, 320))}
                    disabled={editorWidth <= 320}
                    title="Narrower editor"
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-20 transition-colors"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <span className="text-[10px] font-mono px-1 min-w-[40px] text-center">{editorWidth}px</span>
                  <button
                    onClick={() => setEditorWidth((prev) => Math.min(prev + 60, 800))}
                    disabled={editorWidth >= 800}
                    title="Wider editor"
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-20 transition-colors"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden min-h-0">
                {/* The code surface is always dark, like the Thedappled code blocks */}
                <CodeEditor code={code} setCode={setCode} currentLine={currentLine} theme="dark" />

                {/* Input overlay is only needed where the console isn't shown (World Space beta) */}
                <AnimatePresence>
                  {isAwaitingInput && mainTab === 'dsa' && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="absolute inset-0 bg-blue-600/95 backdrop-blur-md flex flex-col justify-center p-6 z-20"
                    >
                      <div className="flex flex-col gap-4">
                        <header className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">Input required</span>
                          <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/90">
                            {inputTarget?.name} ({inputTarget?.type})
                          </span>
                        </header>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter value..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit(e as any)}
                            autoFocus
                            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 font-mono text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/50 outline-none"
                          />
                          <button
                            onClick={(e) => handleInputSubmit(e as any)}
                            className="bg-white text-blue-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors active:scale-95"
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

          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${showEditor ? '' : '-mx-4 md:-mx-8 -mb-4 md:-mb-8'}`}>
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
                isAwaitingInput={isAwaitingInput}
                userInput={userInput}
                setUserInput={setUserInput}
                inputTarget={inputTarget as any}
                onInputSubmit={handleInputSubmit as any}
              />
            ) : mainTab === 'dsa' && ENABLE_BETA ? (
              <div className="flex-1 overflow-y-auto">
                <DSAWorld theme={theme} stack={stack} heap={heap} globals={globals} setCode={setCode} />
              </div>
            ) : mainTab === 'revision' ? (
              <RevisionPortal theme={theme} onSelectProgram={handleSelectProgram} />
            ) : mainTab === 'learning' ? (
              <LearningHub
                theme={theme}
                selectedChapter={selectedLearningChapter}
                setSelectedChapter={setSelectedLearningChapter}
                onDeployModule={(revId) => {
                  const program = revisionPrograms.find((p) => p.id === revId);
                  if (program) handleSelectProgram(program.code, revId);
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-500 text-sm">Access restricted</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MemoryArchitect() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white font-mono animate-pulse">Loading...</p></div>}>
      <MemoryArchitectContent />
    </Suspense>
  );
}

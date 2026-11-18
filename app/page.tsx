'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Play, RotateCcw, Pause, Terminal, ChevronLeft, ChevronRight, SkipBack, Link2, Check } from 'lucide-react';
import TopNavigation from './components/TopNavigation';
import ExamplePicker, { ExampleProgram } from './components/ExamplePicker';
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

// Share links carry the program in the URL (?code=...), URL-safe base64 of the UTF-8 text.
const toShareParam = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromShareParam = (param: string) => {
  const bin = atob(param.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};
const MY_CODE_KEY = 'kernel_trace_my_code'; // the user's own program, saved when they switch to an example
const MAX_SHARE_PARAM = 8000; // keep share URLs within what browsers and chat apps accept

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
    stepBack, goToStep, canStepForward, stepIndex, totalSteps, finished, lastLine,
    resetCompiler, logEndRef, freeHeap
  } = useCompiler(INITIAL_CODE);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'toolong' | 'error'>('idle');
  const [hasStash, setHasStash] = useState(false);

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
    const sharedParam = searchParams.get('code');
    let sharedCode: string | null = null;
    if (sharedParam) {
      try { sharedCode = fromShareParam(sharedParam); } catch { sharedCode = null; }
    }
    if (sharedCode) {
      setCode(sharedCode);
    } else if (revId) {
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

    try { setHasStash(!!localStorage.getItem(MY_CODE_KEY)); } catch { /* storage unavailable */ }
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

  // Keyboard shortcuts on the Compiler tab: ← → step, Home first step, Space auto step.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mainTab !== 'compiler' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
      if (e.key === 'ArrowRight') {
        if (canStepForward && !isAutoStepping && !isAwaitingInput) { e.preventDefault(); stepCode(); }
      } else if (e.key === 'ArrowLeft') {
        if (stepIndex > 0 && !isAutoStepping) { e.preventDefault(); stepBack(); }
      } else if (e.key === 'Home') {
        if (stepIndex > 0 && !isAutoStepping) { e.preventDefault(); goToStep(0); }
      } else if (e.key === ' ' && tag !== 'BUTTON') {
        if (!isAwaitingInput) { e.preventDefault(); if (finished) runCode(); else setIsAutoStepping(!isAutoStepping); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mainTab, canStepForward, isAutoStepping, isAwaitingInput, stepIndex, finished, stepCode, stepBack, goToStep, runCode, setIsAutoStepping]);

  const handleShare = async () => {
    const param = toShareParam(code);
    if (param.length > MAX_SHARE_PARAM) { setShareState('toolong'); setTimeout(() => setShareState('idle'), 2500); return; }
    const url = `${window.location.origin}${window.location.pathname}?tab=compiler&code=${param}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
    } catch {
      setShareState('error');
    }
    setTimeout(() => setShareState('idle'), 2500);
  };

  if (!isMounted) return null;

  const handleSelectProgram = (newCode: string, revId?: string) => {
    // Leaving the user's own code for an example: keep a copy so "My code" can bring it back.
    if (revId && !searchParams.get('rev')) {
      try { localStorage.setItem(MY_CODE_KEY, code); setHasStash(true); } catch { /* storage unavailable */ }
    }
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
              <p className={`text-xs ${muted}`}>Step through C code. ← → to step, Space to auto step.</p>
            </div>

            <ExamplePicker
              theme={theme}
              programs={revisionPrograms as ExampleProgram[]}
              currentId={currentRev}
              myCodeAvailable={hasStash}
              onSelectExample={(program) => handleSelectProgram(program.code, program.id)}
              onSelectMyCode={() => {
                let saved: string | null = null;
                try { saved = localStorage.getItem(MY_CODE_KEY); } catch { /* storage unavailable */ }
                if (saved) handleSelectProgram(saved);
              }}
            />

            <div className={`flex flex-wrap items-center gap-1.5 rounded-xl p-1 max-w-full ${dark ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <button
                onClick={() => (finished ? runCode() : setIsAutoStepping(!isAutoStepping))}
                disabled={isAwaitingInput}
                title={finished ? 'Run again (Space)' : isAutoStepping ? 'Pause auto step (Space)' : 'Auto step (Space)'}
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors disabled:opacity-40 ${
                  isAutoStepping ? 'bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isAutoStepping ? <Pause size={13} /> : finished ? <RotateCcw size={13} /> : <Play size={13} />}
                {isAutoStepping ? 'Pause' : finished ? 'Run again' : 'Auto step'}
              </button>
              <button
                onClick={stepBack}
                disabled={stepIndex === 0 || isAutoStepping}
                title="Previous step (←)"
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 ${dark ? 'bg-slate-900' : 'bg-white'} ${ghostBtn}`}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={stepCode}
                disabled={!canStepForward || isAutoStepping || isAwaitingInput}
                title="Next step (→)"
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 ${dark ? 'bg-slate-900' : 'bg-white'} ${ghostBtn}`}
              >
                Next <ChevronRight size={14} />
              </button>
              <button
                onClick={() => goToStep(0)}
                disabled={stepIndex === 0 || isAutoStepping}
                title="First step (Home)"
                aria-label="First step"
                className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center transition-colors disabled:opacity-40 ${dark ? 'bg-slate-900' : 'bg-white'} ${ghostBtn}`}
              >
                <SkipBack size={13} />
              </button>
              <button
                onClick={resetCompiler}
                title="Reset simulation"
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${dark ? 'bg-slate-900' : 'bg-white'} ${ghostBtn}`}
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            {/* Step scrubber */}
            <div className="w-36">
              <p className={`text-xs font-semibold mb-1 ${finished ? 'text-emerald-600' : title}`}>
                {`Step ${stepIndex}`}
                {totalSteps > stepIndex || finished ? ` of ${totalSteps}` : ''}
                {finished ? ' \u00b7 Finished' : ''}
              </p>
              <input
                type="range"
                min={0}
                max={Math.max(totalSteps, 1)}
                value={stepIndex}
                disabled={totalSteps === 0 || isAutoStepping || isAwaitingInput}
                onChange={(e) => goToStep(Number(e.target.value))}
                aria-label="Step"
                className="w-full accent-blue-600 disabled:opacity-40"
              />
            </div>

            <button
              onClick={handleShare}
              title="Copy a link to this program"
              className={`h-10 px-4 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${dark ? 'bg-slate-900' : 'bg-white'} ${ghostBtn}`}
            >
              {shareState === 'copied' ? <Check size={14} className="text-emerald-600" /> : <Link2 size={14} />}
              {shareState === 'copied' ? 'Link copied' : shareState === 'toolong' ? 'Too long to share' : shareState === 'error' ? 'Copy failed' : 'Share link'}
            </button>
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

              <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                {/* The code surface is always dark, like the Thedappled code blocks */}
                <CodeEditor code={code} setCode={setCode} currentLine={currentLine} lastLine={lastLine} finished={finished} theme="dark" />

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
                finished={finished}
                stepIndex={stepIndex}
                lastLine={lastLine}
                lastStatement={lastLine >= 0 ? code.split('\n')[lastLine] ?? '' : ''}
                nextStatement={!finished && currentLine >= 0 ? code.split('\n')[currentLine] ?? '' : ''}
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

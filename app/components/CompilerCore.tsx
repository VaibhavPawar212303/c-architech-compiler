'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Database, Layers, Grid } from 'lucide-react';
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
  // scanf-style input prompt, shown inside the console
  isAwaitingInput?: boolean;
  userInput?: string;
  setUserInput?: (value: string) => void;
  inputTarget?: { name?: string; type?: string } | null;
  onInputSubmit?: (e: any) => void;
}

export default function CompilerCore({
  theme,
  stack,
  heap,
  globals,
  freeHeap,
  history = [],
  isAutoStepping = false,
  isAwaitingInput = false,
  userInput = '',
  setUserInput,
  inputTarget,
  onInputSubmit,
}: CompilerCoreProps) {
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const dark = theme === 'dark';

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [history, isAwaitingInput]);

  const card = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const divider = dark ? 'border-slate-800' : 'border-slate-200';
  const title = dark ? 'text-white' : 'text-slate-900';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  const status = isAwaitingInput
    ? { label: 'Waiting for input', cls: dark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-700' }
    : isAutoStepping
      ? { label: 'Running', cls: dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-blue-700' }
      : { label: 'Ready', cls: dark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-700' };

  const panelHeader = (
    icon: React.ReactNode,
    iconBg: string,
    name: string,
    sub: string,
    addr: string,
    addrColor: string
  ) => (
    <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${divider}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        <div>
          <h2 className={`text-base font-bold leading-tight ${title}`}>{name}</h2>
          <p className={`text-xs ${muted}`}>{sub}</p>
        </div>
      </div>
      <span className={`text-xs font-mono ${addrColor}`}>{addr}</span>
    </div>
  );

  return (
    <motion.div
      key="compiler"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {/* CONSOLE */}
        <section className={`rounded-2xl border overflow-hidden ${card}`}>
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className={muted} />
              <h2 className={`text-base font-bold ${title}`}>Console</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${isAutoStepping || isAwaitingInput ? 'animate-pulse' : ''}`} />
              {status.label}
            </span>
          </div>
          <div className="px-4 pb-4">
            <div
              ref={logContainerRef}
              className="h-[150px] overflow-y-auto custom-scrollbar rounded-xl bg-slate-900 p-4 font-mono text-xs space-y-1.5"
            >
              {history.length === 0 && !isAwaitingInput ? (
                <div className="text-slate-500">$ Ready. Press Step or Auto step to run your program.</div>
              ) : (
                history.map((msg, i) => (
                  <div key={i} className={`flex gap-3 leading-relaxed ${msg.includes('ERROR') ? 'text-red-400' : 'text-emerald-400'}`}>
                    <span className="text-slate-600 select-none">{String(i + 1).padStart(2, '0')}</span>
                    <span>{msg}</span>
                  </div>
                ))
              )}
              {isAwaitingInput && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-amber-300 shrink-0">
                    Input for {inputTarget?.name ?? 'value'}{inputTarget?.type ? ` (${inputTarget.type})` : ''}:
                  </span>
                  <input
                    type="text"
                    placeholder="Enter a value..."
                    value={userInput}
                    onChange={(e) => setUserInput?.(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onInputSubmit?.(e)}
                    autoFocus
                    className="flex-1 min-w-0 rounded-lg bg-slate-950 border border-blue-500 px-3 py-1.5 text-slate-100 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button
                    onClick={(e) => onInputSubmit?.(e)}
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 font-semibold transition-colors active:scale-95"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* STACK + HEAP */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className={`flex flex-col h-[440px] rounded-2xl border overflow-hidden ${card}`}>
            {panelHeader(
              <Layers size={18} className="text-blue-600" />,
              dark ? 'bg-blue-950' : 'bg-blue-100',
              'Stack',
              'Automatic storage',
              '0x7FFFFFFF',
              'text-blue-500'
            )}
            <div className="flex-1 min-h-0">
              <StackVisualizer theme={theme} stack={stack} />
            </div>
          </section>

          <section className={`flex flex-col h-[440px] rounded-2xl border overflow-hidden ${card}`}>
            {panelHeader(
              <Database size={18} className="text-emerald-600" />,
              dark ? 'bg-emerald-950' : 'bg-emerald-100',
              'Heap',
              'Dynamic pool',
              '0x00001000',
              'text-emerald-500'
            )}
            <div className="flex-1 min-h-0">
              <HeapVisualizer theme={theme} heap={heap} freeHeap={freeHeap} />
            </div>
          </section>
        </div>

        {/* GLOBALS */}
        <section className={`rounded-2xl border overflow-hidden ${card}`}>
          {panelHeader(
            <Grid size={18} className="text-purple-600" />,
            dark ? 'bg-purple-950' : 'bg-purple-100',
            'Globals',
            'Static data',
            '0x00400000',
            'text-purple-500'
          )}
          <div className="p-4">
            {globals.length === 0 ? (
              <div className={`rounded-xl px-4 py-3 text-sm ${dark ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-500'}`}>
                No global variables
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {globals.map((g) => (
                  <motion.div
                    layoutId={`global-${g.id}`}
                    key={g.id}
                    className={`p-3 rounded-xl border ${dark ? 'bg-slate-950 border-slate-800' : 'bg-purple-50 border-purple-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-purple-600">{g.name}</span>
                      <span className={`text-[10px] font-mono ${muted}`}>{g.address}</span>
                    </div>
                    <div className={`text-lg font-mono font-bold tabular-nums ${title}`}>{g.value}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

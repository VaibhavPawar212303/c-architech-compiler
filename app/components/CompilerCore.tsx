'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Database, Layers, Grid, Info, CheckCircle2, ChevronDown } from 'lucide-react';
import StackVisualizer from './StackVisualizer';
import HeapVisualizer from './HeapVisualizer';
import PointerArrows from './PointerArrows';
import { describeStatement } from '../utils/describeStep';
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
  // stepping / caption
  finished?: boolean;
  stepIndex?: number;
  lastLine?: number;
  lastStatement?: string;
  nextStatement?: string;
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
  finished = false,
  stepIndex = 0,
  lastLine = -1,
  lastStatement = '',
  nextStatement = '',
}: CompilerCoreProps) {
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [logOpen, setLogOpen] = React.useState(false);
  const dark = theme === 'dark';
  const logVisible = logOpen || isAwaitingInput;

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [history, isAwaitingInput, logVisible]);

  const card = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const divider = dark ? 'border-slate-800' : 'border-slate-200';
  const title = dark ? 'text-white' : 'text-slate-900';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  const leaked = finished ? heap.filter((h) => !h.freed) : [];
  const leakedBytes = leaked.reduce((sum, h) => sum + (Number.isFinite(h.size) ? h.size : 0), 0);
  const freedAddresses = heap.filter((h) => h.freed).map((h) => h.address);
  const outputLines = history.filter((m) => m.startsWith('STDOUT:')).map((m) => m.replace(/^STDOUT:\s*/, ''));

  const status = isAwaitingInput
    ? { label: 'Waiting for input', cls: dark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-700' }
    : finished
      ? { label: 'Finished', cls: dark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-700' }
      : isAutoStepping
        ? { label: 'Running', cls: dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-blue-700' }
        : { label: stepIndex === 0 ? 'Ready' : 'Paused', cls: dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600' };

  // ---- "What just happened" caption ----
  let capLabel = 'What just happened';
  let capMain = 'Press Next or Auto step to run the first line.';
  let capSub = '';
  let capTone: 'info' | 'done' | 'wait' = 'info';
  if (isAwaitingInput) {
    capLabel = 'Waiting for input';
    capMain = `Type a value for ${inputTarget?.name ?? 'the variable'} in the console, then press Submit.`;
    capTone = 'wait';
  } else if (finished) {
    capLabel = 'Program finished';
    capMain = 'main returned. Memory is shown as it was at the end.';
    capSub = leaked.length > 0
      ? `Heads up: ${leaked.length} heap block${leaked.length > 1 ? 's were' : ' was'} never freed (memory leak). Use Prev to review any step.`
      : 'No memory leaks. Use Prev to review any step.';
    capTone = 'done';
  } else if (stepIndex > 0 && lastStatement) {
    capMain = `Line ${lastLine + 1}: ${describeStatement(lastStatement)}`;
    capSub = nextStatement.trim() ? `Next: ${nextStatement.trim()}` : '';
  }

  const capCard =
    capTone === 'done'
      ? dark ? 'bg-emerald-950/60 border-emerald-700' : 'bg-emerald-50 border-emerald-400'
      : capTone === 'wait'
        ? dark ? 'bg-amber-950/50 border-amber-700' : 'bg-amber-50 border-amber-300'
        : card;
  const capIcon =
    capTone === 'done' ? 'bg-emerald-500 text-white' : capTone === 'wait' ? 'bg-amber-500 text-white' : dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-blue-600';

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
        {/* WHAT JUST HAPPENED */}
        <section className={`rounded-2xl border px-5 py-4 flex items-start gap-4 ${capCard}`} aria-live="polite">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${capIcon}`}>
            {capTone === 'done' ? <CheckCircle2 size={20} /> : <Info size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold uppercase tracking-wide ${capTone === 'done' ? 'text-emerald-700' : muted}`}>{capLabel}</p>
            <p className={`text-base md:text-lg font-bold leading-snug break-words ${title}`}>{capMain}</p>
            {capSub && <p className={`text-sm mt-0.5 break-words ${capTone === 'done' && leaked.length > 0 ? 'text-amber-700' : muted}`}>{capSub}</p>}
          </div>
          <button
            onClick={() => setLogOpen((o) => !o)}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline shrink-0"
          >
            {logVisible ? 'Hide' : 'Show'} detailed log <ChevronDown size={12} className={logVisible ? 'rotate-180' : ''} />
          </button>
        </section>

        {/* CONSOLE */}
        <section className={`rounded-2xl border overflow-hidden ${card}`}>
          <div className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal size={16} className={muted} />
              <h2 className={`text-base font-bold ${title}`}>Console</h2>
              <span className={`text-xs truncate ${muted}`}>
                {outputLines.length > 0 ? `program output: ${outputLines[outputLines.length - 1]}` : 'no program output yet'}
              </span>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${status.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${isAutoStepping || isAwaitingInput ? 'animate-pulse' : ''}`} />
              {status.label}
            </span>
          </div>
          {logVisible && (
            <div className="px-4 pb-4">
              <div
                ref={logContainerRef}
                className="h-[150px] overflow-y-auto custom-scrollbar rounded-xl bg-slate-900 p-4 font-mono text-xs space-y-1.5"
              >
                {history.length === 0 && !isAwaitingInput ? (
                  <div className="text-slate-500">$ Ready. Press Next or Auto step to run your program.</div>
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
          )}
        </section>

        {/* STACK + HEAP (with pointer arrows between them) */}
        <div ref={gridRef} className="relative grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
          <section data-panel="stack" className={`flex flex-col h-[440px] rounded-2xl border overflow-hidden ${card}`}>
            {panelHeader(
              <Layers size={18} className="text-blue-600" />,
              dark ? 'bg-blue-950' : 'bg-blue-100',
              'Stack',
              'Automatic storage',
              '0x7FFFFFFF',
              'text-blue-500'
            )}
            <div className="flex-1 min-h-0">
              <StackVisualizer theme={theme} stack={stack} freedAddresses={freedAddresses} />
            </div>
          </section>

          <section data-panel="heap" className={`flex flex-col h-[440px] rounded-2xl border overflow-hidden ${card}`}>
            {panelHeader(
              <Database size={18} className="text-emerald-600" />,
              dark ? 'bg-emerald-950' : 'bg-emerald-100',
              'Heap',
              'Dynamic pool',
              '0x00001000',
              'text-emerald-500'
            )}
            <div className="flex-1 min-h-0">
              <HeapVisualizer theme={theme} heap={heap} freeHeap={freeHeap} finished={finished} />
            </div>
            {leaked.length > 0 && (
              <div className={`mx-3 mb-3 rounded-xl border px-4 py-3 text-xs ${dark ? 'bg-amber-950/50 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <p className="font-semibold text-sm">
                  {'⚠'} {leaked.length} block{leaked.length > 1 ? 's' : ''}
                  {leakedBytes > 0 ? ` (${leakedBytes} B)` : ''} never freed
                </p>
                <p className="mt-0.5">Call free() on {leaked.length > 1 ? 'each pointer' : 'the pointer'} before main returns to fix the leak.</p>
              </div>
            )}
          </section>

          <PointerArrows containerRef={gridRef} deps={[stack, heap, theme, finished]} />
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

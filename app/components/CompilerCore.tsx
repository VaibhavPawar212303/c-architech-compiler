'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Database, Layers, Grid, Info, CheckCircle2, Keyboard } from 'lucide-react';
import StackVisualizer from './StackVisualizer';
import HeapVisualizer from './HeapVisualizer';
import PointerArrows from './PointerArrows';
import { describeStatement } from '../utils/describeStep';
import { StackFrame, HeapObject } from '../types/memory';

type TabId = 'console' | 'memory' | 'globals';

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
  // scanf-style input prompt, shown at the bottom of the console tab
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
  const [tab, setTab] = React.useState<TabId>('memory');
  const tabBeforeInput = React.useRef<TabId | null>(null);
  const dark = theme === 'dark';
  const uid = React.useId();

  // When the program asks for input, jump to the Console tab (that is where the prompt is),
  // and go back to the tab you were on once the value has been submitted.
  React.useEffect(() => {
    if (isAwaitingInput) {
      setTab((current) => {
        if (current !== 'console') tabBeforeInput.current = current;
        return 'console';
      });
    } else if (tabBeforeInput.current) {
      setTab(tabBeforeInput.current);
      tabBeforeInput.current = null;
    }
  }, [isAwaitingInput]);

  React.useEffect(() => {
    if (tab === 'console' && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [history, isAwaitingInput, tab]);

  const card = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const divider = dark ? 'border-slate-800' : 'border-slate-200';
  const title = dark ? 'text-white' : 'text-slate-900';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  const leaked = finished ? heap.filter((h) => !h.freed) : [];
  const leakedBytes = leaked.reduce((sum, h) => sum + (Number.isFinite(h.size) ? h.size : 0), 0);
  const freedAddresses = heap.filter((h) => h.freed).map((h) => h.address);

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
    capSub = 'The program is paused on scanf. Stepping resumes after you submit.';
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

  // ---- tabs ----
  const stackVars = stack.reduce((n, f) => n + f.variables.filter((v) => v.name !== 'ret_addr' && !v.isMember).length, 0);
  const liveBlocks = heap.filter((h) => !h.freed).length;
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge: string; badgeTitle: string; alert?: boolean }[] = [
    {
      id: 'console',
      label: 'Console',
      icon: <Terminal size={15} />,
      badge: isAwaitingInput ? '1' : String(history.length),
      badgeTitle: isAwaitingInput ? 'Waiting for input' : `${history.length} log lines`,
      alert: isAwaitingInput,
    },
    {
      id: 'memory',
      label: 'Stack & Heap',
      icon: <Layers size={15} />,
      badge: `${stackVars} · ${liveBlocks}`,
      badgeTitle: `${stackVars} stack variables · ${liveBlocks} heap blocks`,
      alert: leaked.length > 0,
    },
    {
      id: 'globals',
      label: 'Globals',
      icon: <Grid size={15} />,
      badge: String(globals.length),
      badgeTitle: `${globals.length} global variables`,
    },
  ];

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    // Moving between tabs must not also step the program (the page listens for the arrow keys).
    e.preventDefault();
    e.stopPropagation();
    setTab(tabs[next].id);
    document.getElementById(`${uid}-tab-${tabs[next].id}`)?.focus();
  };

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
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {/* WHAT JUST HAPPENED */}
        <section className={`shrink-0 rounded-2xl border px-5 py-4 flex items-start gap-4 ${capCard}`} aria-live="polite">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${capIcon}`}>
            {capTone === 'done' ? <CheckCircle2 size={20} /> : capTone === 'wait' ? <Keyboard size={20} /> : <Info size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold uppercase tracking-wide ${capTone === 'done' ? 'text-emerald-700' : capTone === 'wait' ? 'text-amber-700' : muted}`}>{capLabel}</p>
            <p className={`text-base md:text-lg font-bold leading-snug break-words ${title}`}>{capMain}</p>
            {capSub && <p className={`text-sm mt-0.5 break-words ${capTone === 'done' && leaked.length > 0 ? 'text-amber-700' : muted}`}>{capSub}</p>}
          </div>
        </section>

        {/* TAB BAR */}
        <div className={`shrink-0 rounded-2xl border px-3 py-2 flex items-center gap-2 ${card}`}>
          <div role="tablist" aria-label="Memory views" className="flex items-center gap-1 min-w-0 overflow-x-auto">
            {tabs.map((t, i) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  id={`${uid}-tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls={`${uid}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={`relative flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-[10px] text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                    on
                      ? `${dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-blue-700'} font-bold`
                      : `${dark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'} font-medium`
                  }`}
                >
                  {t.icon}
                  {t.label}
                  <span
                    title={t.badgeTitle}
                    className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      t.alert
                        ? 'bg-amber-500 text-white'
                        : on
                          ? dark ? 'bg-slate-900 text-blue-300' : 'bg-white text-blue-700'
                          : dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {t.badge}
                  </span>
                  {on && <span className="absolute left-3 right-3 -bottom-0.5 h-[3px] rounded-full bg-blue-600" />}
                </button>
              );
            })}
          </div>
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${status.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${isAutoStepping || isAwaitingInput ? 'animate-pulse' : ''}`} />
            {status.label}
          </span>
        </div>

        {/* TAB CONTENT */}
        <div
          id={`${uid}-panel`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${tab}`}
          className="@container flex-1 min-h-0 flex flex-col"
        >
          {tab === 'memory' && (
            <div ref={gridRef} className="relative flex-1 min-h-0 grid grid-rows-2 grid-cols-1 @min-[40rem]:grid-rows-1 @min-[40rem]:grid-cols-2 gap-4 @min-[40rem]:gap-8">
              <section data-panel="stack" className={`flex flex-col min-h-0 rounded-2xl border overflow-hidden ${card}`}>
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

              <section data-panel="heap" className={`flex flex-col min-h-0 rounded-2xl border overflow-hidden ${card}`}>
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
                  <div className={`mx-3 mb-3 shrink-0 rounded-xl border px-4 py-3 text-xs ${dark ? 'bg-amber-950/50 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <p className="font-semibold text-sm">
                      {'⚠'} {leaked.length} block{leaked.length > 1 ? 's' : ''}
                      {leakedBytes > 0 ? ` (${leakedBytes} B)` : ''} never freed
                    </p>
                    <p className="mt-0.5">Call free() on {leaked.length > 1 ? 'each pointer' : 'the pointer'} before main returns to fix the leak.</p>
                  </div>
                )}
              </section>

              <PointerArrows containerRef={gridRef} deps={[stack, heap, theme, finished, tab]} />
            </div>
          )}

          {tab === 'console' && (
            <section className={`flex-1 min-h-0 flex flex-col rounded-2xl border overflow-hidden ${card}`}>
              <div className="px-5 py-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className={muted} />
                  <h2 className={`text-base font-bold ${title}`}>Console</h2>
                </div>
                <span className={`text-xs ${muted}`}>
                  <span className="text-emerald-500 font-semibold">Program output</span>{' '}is green &middot; system messages are grey
                </span>
              </div>
              <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col gap-3">
                <div
                  ref={logContainerRef}
                  className="flex-1 min-h-[120px] overflow-y-auto custom-scrollbar rounded-xl bg-slate-900 p-4 font-mono text-xs space-y-1.5"
                >
                  {history.length === 0 && !isAwaitingInput ? (
                    <div className="text-slate-500">$ Ready. Press Next or Auto step to run your program.</div>
                  ) : (
                    history.map((msg, i) => {
                      const isOutput = msg.startsWith('STDOUT:');
                      const isError = msg.includes('ERROR');
                      return (
                        <div key={i} className={`flex gap-3 leading-relaxed ${isError ? 'text-red-400' : isOutput ? 'text-emerald-400' : 'text-slate-400'}`}>
                          <span className="text-slate-600 select-none">{String(i + 1).padStart(2, '0')}</span>
                          <span className="break-words min-w-0">{isOutput ? msg.replace(/^STDOUT:\s*/, '') : msg}</span>
                        </div>
                      );
                    })
                  )}
                  {isAwaitingInput && (
                    <div className="flex gap-3 leading-relaxed text-amber-300">
                      <span className="text-slate-600 select-none">{String(history.length + 1).padStart(2, '0')}</span>
                      <span>Waiting for input&hellip;</span>
                    </div>
                  )}
                </div>

                {isAwaitingInput && (
                  <div className={`shrink-0 rounded-xl border px-4 py-3 flex flex-wrap items-center gap-3 ${dark ? 'bg-amber-950/50 border-amber-800' : 'bg-amber-50 border-amber-300'}`}>
                    <div className="min-w-[140px] flex-1">
                      <p className={`text-sm font-semibold ${dark ? 'text-amber-200' : 'text-amber-800'}`}>
                        Input for {inputTarget?.name ?? 'value'}{inputTarget?.type ? ` (${inputTarget.type})` : ''}
                      </p>
                      <p className={`text-xs ${dark ? 'text-amber-300/80' : 'text-amber-700'}`}>Press Enter or Submit to continue.</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter a value..."
                      value={userInput}
                      onChange={(e) => setUserInput?.(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onInputSubmit?.(e)}
                      autoFocus
                      aria-label="Program input"
                      className={`flex-1 min-w-[140px] h-10 rounded-[10px] border-2 border-blue-500 px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${dark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}
                    />
                    <button
                      onClick={(e) => onInputSubmit?.(e)}
                      className="h-10 px-5 rounded-[10px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors active:scale-95"
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === 'globals' && (
            <section className={`flex-1 min-h-0 flex flex-col rounded-2xl border overflow-hidden ${card}`}>
              {panelHeader(
                <Grid size={18} className="text-purple-600" />,
                dark ? 'bg-purple-950' : 'bg-purple-100',
                'Globals',
                'Static data · lives for the whole run',
                '0x00400000',
                'text-purple-500'
              )}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
                {globals.length === 0 ? (
                  <div className={`rounded-xl px-4 py-3 text-sm ${dark ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-500'}`}>
                    No global variables
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {globals.map((g) => (
                      <motion.div
                        layoutId={`global-${g.id}`}
                        key={g.id}
                        className={`p-3 rounded-xl border ${dark ? 'bg-slate-950 border-slate-800' : 'bg-purple-50 border-purple-100'}`}
                      >
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <span className="text-sm font-semibold text-purple-600 truncate">{g.name}</span>
                          <span className={`text-[10px] font-mono shrink-0 ${muted}`}>{g.address}</span>
                        </div>
                        <div className={`text-xl font-mono font-bold tabular-nums break-words ${title}`}>{g.value}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <p className={`mt-4 text-xs ${muted}`}>
                  Globals are declared outside main(). They keep their value for the whole run, and every function can read and write them.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
}

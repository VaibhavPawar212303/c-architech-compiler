'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Trash2 } from 'lucide-react';
import { HeapObject } from '../types/memory';

interface HeapVisualizerProps {
  heap: HeapObject[];
  freeHeap: (id: string) => void;
  theme?: 'dark' | 'light';
  /** program has ended: any block that was never freed is flagged as leaked */
  finished?: boolean;
}

const HeapVisualizer = ({ heap, freeHeap, theme = 'dark', finished = false }: HeapVisualizerProps) => {
  return (
    <div className="@container relative flex flex-col h-full">
      {/* Memory Decoration */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-600/20'
      } z-10`} />

      <div className="flex-1 p-3 md:p-6 flex flex-col gap-4 md:gap-6 relative z-10 overflow-y-auto overflow-x-auto custom-scrollbar min-h-0">
        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
          <AnimatePresence>
              {heap.map((obj, blockIndex) => (
                <motion.div
                  key={obj.id}
                  data-heap-addr={obj.address.toLowerCase()}
                  data-freed={obj.freed ? 'true' : undefined}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.05, opacity: 0 }}
                  className={`relative rounded-xl border flex flex-col overflow-hidden transition-all shadow-sm hover:shadow-md ${
                    obj.freed
                      ? `border-dashed opacity-70 ${theme === 'dark' ? 'border-slate-500 bg-slate-800/60' : 'border-slate-400 bg-slate-100'}`
                      : finished
                        ? (theme === 'dark' ? 'border-amber-600 bg-amber-950/40' : 'border-amber-400 bg-amber-50')
                        : theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-black/10'
                  }`}
                  style={{ borderLeft: `3px solid ${obj.freed ? '#94a3b8' : finished ? '#f59e0b' : obj.color}` }}
                >
                  <div className={`px-4 py-2 flex items-center justify-between border-b ${
                    theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                       <Database size={12} style={{ color: obj.color }} />
                       <h4 className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/80' : 'text-slate-900/80'}`}>
                         Block {blockIndex + 1} &middot; {obj.size} B
                       </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {obj.freed && <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-semibold">freed</span>}
                      {!obj.freed && finished && <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-semibold">leaked</span>}
                      <span className="text-[8px] font-mono opacity-50 tabular-nums">{obj.address.toUpperCase().replace(/^0X/, '0x')}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <div className={`p-2 md:p-3 rounded-lg min-h-[60px] ${
                      theme === 'dark' ? 'bg-[#050505] border border-white/5 shadow-inner' : 'bg-slate-50 border border-black/5 shadow-inner'
                    }`}>
                      {obj.value && obj.value.startsWith('{') ? (
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                          {renderHierarchy(obj.value, obj.address, theme)}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between h-full opacity-60">
                          <span className="text-[11px] font-mono font-bold" style={{ color: obj.color }}>{obj.value || '0x00'}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <div className="flex-1 max-w-[120px] h-1 bg-black/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((obj.size / 64) * 100, 100)}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: obj.color }}
                        />
                      </div>
                      {!obj.freed && !finished && <button 
                        onClick={() => freeHeap(obj.id)}
                        className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded transition-colors border ${
                          theme === 'dark' ? 'border-red-500/20 text-red-500/80 hover:bg-red-500 hover:text-white' : 'border-red-600/20 text-red-600/80 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        free()
                      </button>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {heap.length === 0 && (
              <div className="col-span-1 md:col-span-2 py-12 flex flex-col items-center justify-center opacity-10">
                <Database size={32} className="mb-2" />
                <p className="text-[8px] font-black uppercase tracking-[0.4em]">No heap allocations</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};


interface TreeNode {
  key: string;
  label: string;
  value?: string;
  address: string;
  children: Map<string, TreeNode>;
  isIndex: boolean;
}

const renderHierarchy = (valueStr: string, baseAddr: string, theme: 'dark' | 'light' = 'dark') => {
  const clean = valueStr.replace(/[{}]/g, '');
  if (!clean.trim()) return <div className="text-slate-600 italic text-[8px]">Empty</div>;

  const root: TreeNode = { key: 'root', label: 'root', address: baseAddr, children: new Map(), isIndex: false };
  const baseNum = parseInt(baseAddr, 16);

  clean.split(',').forEach((part, idx) => {
    const pair = part.split(':');
    if (pair.length < 2) return;
    const fullKey = pair[0].trim();
    const val = pair.slice(1).join(':').trim();

    const segments = fullKey.match(/\[\d+\]|\.[\w]+/g) || [fullKey];
    let currentNode = root;

    segments.forEach((seg, sIdx) => {
      if (!currentNode.children.has(seg)) {
        const siblingCount = currentNode.children.size;
        const subAddr = '0x' + (baseNum + (siblingCount * 4) + (idx * 4)).toString(16).toUpperCase();
        
        currentNode.children.set(seg, {
          key: seg,
          label: seg.startsWith('.') ? seg.substring(1) : seg,
          address: subAddr,
          children: new Map(),
          isIndex: seg.startsWith('['),
          value: sIdx === segments.length - 1 ? val : undefined
        });
      }
      currentNode = currentNode.children.get(seg)!;
    });
  });

  const renderRecursive = (node: TreeNode, depth: number = 0) => {
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      // Sort indices numerically, fields alphabetically
      if (a.isIndex && b.isIndex) {
        return parseInt(a.label.slice(1, -1)) - parseInt(b.label.slice(1, -1));
      }
      return a.label.localeCompare(b.label);
    });

    return sortedChildren.map((child, cIdx) => (
      <div key={child.key + cIdx} className="space-y-1">
        <div 
          className={`flex items-center justify-between group/line py-1 border-l transition-all duration-300 ${
            theme === 'dark' 
              ? 'border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 shadow-sm' 
              : 'border-black/5 hover:border-emerald-600 hover:bg-emerald-50/50 shadow-sm'
          }`}
          style={{ 
            marginLeft: `${depth * 8}px`, 
            paddingLeft: '6px' 
          }}
        >
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            <span className="text-[7px] font-mono opacity-20 tracking-tighter tabular-nums whitespace-nowrap min-w-[30px] hidden sm:inline">
              0X{child.address.substring(2).toUpperCase()}
            </span>
            <div className="flex items-center gap-1 overflow-hidden">
               {depth > 0 && <span className="opacity-10 text-[9px] flex-shrink-0">└─</span>}
               <span className={`text-[9px] md:text-[10px] font-mono truncate transition-colors ${
                 child.isIndex 
                   ? (theme === 'dark' ? 'text-slate-500' : 'text-slate-400') 
                   : (theme === 'dark' ? 'text-emerald-400 group-hover/line:text-emerald-300' : 'text-emerald-600 font-bold')
               }`}>
                 {child.isIndex ? 'IDX' : 'MEM'} <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}>{child.label}</span>
               </span>
            </div>
          </div>
          {child.value !== undefined && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-[8px] opacity-20 font-mono hidden md:inline">:</span>
              <motion.span 
                key={child.value}
                initial={{ scale: 1.1, color: '#10b981' }}
                animate={{ scale: 1, color: theme === 'dark' ? '#34d399cc' : '#059669' }}
                className={`text-[10px] font-black border-b border-dashed tabular-nums px-1 rounded transition-colors whitespace-nowrap ${
                theme === 'dark' ? 'border-emerald-500/20' : 'border-emerald-600/30'
              }`}>
                {child.value}
              </motion.span>
            </div>
          )}
        </div>
        {child.children.size > 0 && (
          <div className="space-y-1">
            {renderRecursive(child, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return <div className="space-y-0.5 overflow-x-auto custom-scrollbar pb-1">{renderRecursive(root)}</div>;
};

export default HeapVisualizer;

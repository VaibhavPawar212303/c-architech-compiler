'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Map as MapIcon, 
  ChevronRight, 
  Star, 
  Lock, 
  Unlock,
  Layers,
  Container,
  GitGraph,
  Share2,
  Brain,
  Zap,
  Target,
  Trophy,
  Info,
  Network,
  Plus,
  BookOpen,
  Wrench,
  Search,
  Activity,
  Code2,
  FileCode2,
  Lightbulb,
  Wind,
  Layout
} from 'lucide-react';
import InteractiveStack from './InteractiveStack';

export default function DSAWorld({ 
  theme,
  stack,
  heap,
  globals,
  setCode
}: { 
  theme: 'dark' | 'light',
  stack: any[],
  heap: Record<string, any>,
  globals: any[],
  setCode?: (code: string) => void
}) {
  const [viewMode, setViewMode] = useState<'interactive' | 'system'>('system');

  const SYSTEM_MAP_CODE = `#include <stdio.h>

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
    
    printf("House configured successfully.\\n");
    return 0;
}
`;

  const STACK_DEMO_CODE = `#include <stdio.h>

// Step 1: Recursive Function Example
// Each call creates a NEW Frame on the STACK
int factorial(int n) {
    if (n <= 1) {
        printf("Base reached: n=%d\\n", n);
        return 1;
    }
    
    printf("factorial(%d) calls factorial(%d)\\n", n, n-1);
    int res = n * factorial(n - 1);
    return res;
}

int main() {
    int input = 4;
    printf("Stack Simulation Start: %d!\\n", input);
    
    int result = factorial(input);
    
    printf("Simulation end. Result: %d\\n", result);
    return 0;
}
`;

  const handleTabChange = (mode: 'interactive' | 'system') => {
    setViewMode(mode);
    if (setCode) {
      if (mode === 'interactive') {
        setCode(STACK_DEMO_CODE);
      } else {
        setCode(SYSTEM_MAP_CODE);
      }
    }
  };

  return (
    <div className={`h-full w-full flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* View Switcher */}
      <div className={`p-2 md:p-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} flex items-center justify-center lg:justify-start gap-2 md:gap-4`}>
        <button 
          onClick={() => handleTabChange('system')}
          className={`flex-1 lg:flex-none px-6 py-3 md:py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
            viewMode === 'system' 
              ? (theme === 'dark' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-blue-600 border-blue-600 text-white shadow-lg')
              : (theme === 'dark' ? 'border-white/10 hover:bg-white/5 opacity-50' : 'border-black/10 hover:bg-black/5 opacity-50')
          }`}
        >
          <MapIcon size={12} />
          System_Map
        </button>
        <button 
          onClick={() => handleTabChange('interactive')}
          className={`flex-1 lg:flex-none px-6 py-3 md:py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
            viewMode === 'interactive' 
              ? (theme === 'dark' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-blue-600 border-blue-600 text-white shadow-lg')
              : (theme === 'dark' ? 'border-white/10 hover:bg-white/5 opacity-50' : 'border-black/10 hover:bg-black/5 opacity-50')
          }`}
        >
          <Layers size={12} />
          Interactive_Stack
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'interactive' ? (
            <motion.div 
              key="interactive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full w-full"
            >
              <InteractiveStack theme={theme} stack={stack} heap={heap} globals={globals} />
            </motion.div>
          ) : (
            <motion.div 
              key="system"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full w-full p-4 md:p-8 overflow-y-auto custom-scrollbar"
            >
              <SystemMap theme={theme} stack={stack} heap={heap} globals={globals} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SystemMap({ theme, stack, heap, globals }: any) {
  // Find "House" or "Room" structures in memory to visualize them
  const findStructures = () => {
    // Flatten all variables from all stack frames and globals
    const stackVars = (stack || []).flatMap((frame: any) => frame.variables || []);
    const allVars = [...stackVars, ...(globals || [])];
    
    const houses: any[] = [];
    const rooms: any[] = [];

    allVars.forEach(v => {
      // Safety check for name property
      const varName = v && typeof v.name === 'string' ? v.name.toLowerCase() : '';
      if (!varName) return;

      if (varName.includes('home') || varName.includes('house')) {
        houses.push(v);
      } else if (varName.includes('room')) {
        rooms.push(v);
      }
    });

    return { houses, rooms };
  };

  const { houses, rooms } = findStructures();
  const [hasDismissedBlueprint, setHasDismissedBlueprint] = useState(false);
  
  // Show blueprint splash if specifically requested or if no structures found yet and not dismissed
  const showBlueprint = !hasDismissedBlueprint && houses.length === 0;

  if (showBlueprint) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[500px]">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-xl w-full p-8 rounded-3xl border shadow-lg ${
            theme === 'dark' ? 'bg-[#080809] border-white/10' : 'bg-white border-black/10'
          }`}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-600/10 rounded-xl">
              <Building2 className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter italic">World Space Protocol</h2>
              <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Architectural Visualization Engine</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl mb-6 font-mono text-[10px] border ${
            theme === 'dark' ? 'bg-black/40 border-white/5 text-blue-400' : 'bg-slate-50 border-black/5 text-blue-700'
          }`}>
            <p className="mb-2 opacity-40 italic">{"// Required structural pattern:"}</p>
            <pre className="overflow-x-auto whitespace-pre">
{`struct Home { 
  struct Room kitchen; 
  struct Room livingRoom; 
  struct Room bed; 
};
struct Home myHome;`}
            </pre>
          </div>
          
          <div className="mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <p className="text-[11px] opacity-70">The visualization maps C structures directly to physical floorplans.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <p className="text-[11px] opacity-70">Modifying memory (e.g. <code>myHome.kitchen.light.isOn = 1</code>) updates the world in real-time.</p>
            </div>
          </div>

          <button
            onClick={() => setHasDismissedBlueprint(true)}
            className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all shadow-lg active:scale-[0.98]"
          >
            Activate_Blueprint_Map
          </button>
        </motion.div>
      </div>
    );
  }

  if (houses.length === 0 && rooms.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-40">
        <Activity size={48} className="mb-4 animate-pulse" />
        <h3 className="text-sm font-black uppercase tracking-[0.3em]">No_Home_Struct_Detected</h3>
        <p className="text-[10px] mt-2 font-mono italic text-center max-w-xs">Declare a &apos;struct Home myHome&apos; to see the architectural blueprint visualization return.</p>
        <button 
          onClick={() => setHasDismissedBlueprint(false)}
          className="mt-6 text-[10px] uppercase font-black tracking-widest underline underline-offset-4"
        >
          View_Requirements
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      <div className="space-y-2">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">WORLD_SPACE // BLUEPRINT_VIEW</h2>
        <div className="flex items-center gap-4 opacity-40">
           <span className="text-[10px] font-mono tracking-widest uppercase">Detected Structures: {houses.length} Active Plan(s)</span>
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {houses.map((house: any, hIdx: number) => (
          <BlueprintMap key={hIdx} house={house} theme={theme} />
        ))}
      </div>
    </div>
  );
}


function BlueprintMap({ house, theme }: any) {
  const reconstructObject = (val: string) => {
    const clean = val.replace(/[{}]/g, '');
    const obj: any = {};
    
    clean.split(',').forEach(part => {
      const pair = part.split(':');
      if (pair.length < 2) return;
      const fullKey = pair[0].trim();
      const value = pair.slice(1).join(':').trim();
      
      const segments = fullKey.match(/[\w]+/g) || [fullKey];
      let current = obj;
      segments.forEach((seg, idx) => {
        if (idx === segments.length - 1) {
          current[seg] = value;
        } else {
          if (!current[seg]) current[seg] = {};
          current = current[seg];
        }
      });
    });
    return obj;
  };

  const data = reconstructObject(house.value);

  // SVG-based floor plan layout
  return (
    <div className={`p-4 md:p-8 border shadow-2xl relative overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Building2 className="text-blue-500" size={32} />
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">{house.name}</h3>
            <p className="text-[10px] font-mono opacity-40 tracking-widest uppercase italic">Memory mapping: {house.address}</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-blue-600/10 border border-blue-600/30 rounded-lg">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Visualization Active</span>
        </div>
      </div>

      <div className="relative aspect-[16/10] bg-slate-900/5 dark:bg-white/5 rounded-3xl border border-dashed border-slate-500/30 overflow-hidden">
        <svg viewBox="0 0 1000 625" className="w-full h-full p-4 md:p-8 font-mono">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <rect x="50" y="50" width="900" height="525" fill="none" stroke="currentColor" strokeWidth="8" className="opacity-80" />

          {/* Dynamic Room Rendering */}
          {Object.entries(data).map(([roomKey, roomData]: [string, any], index) => {
            // Define standard positions and match by key
            const k = roomKey.toLowerCase();
            let layout: any = { x: 50, y: 50, w: 300, h: 250, name: roomKey, icon: 'door', hasBed: false, hasSofa: false };

            if (k.includes('kitchen')) {
              layout = { x: 50, y: 50, w: 300, h: 250, name: roomKey, icon: 'kitchen', hasBed: false, hasSofa: false };
            } else if (k.includes('living')) {
              layout = { x: 350, y: 50, w: 600, h: 350, name: roomKey, icon: 'living', hasBed: false, hasSofa: true };
            } else if ((k.includes('bed') || k.includes('beed')) && k.includes('one')) {
              layout = { x: 50, y: 300, w: 300, h: 275, name: roomKey, icon: 'bed', hasBed: true, hasSofa: false };
            } else if ((k.includes('bed') || k.includes('beed')) && k.includes('two')) {
              layout = { x: 350, y: 400, w: 350, h: 175, name: roomKey, icon: 'bed', hasBed: true, hasSofa: false };
            } else if (k.includes('bath')) {
              layout = { x: 700, y: 400, w: 250, h: 175, name: roomKey, icon: 'bath', hasBed: false, hasSofa: false };
            } else if (k.includes('entrance')) {
              layout = { x: 350, y: 400, w: 350, h: 175, name: roomKey, icon: 'door', hasBed: false, hasSofa: false };
            } else {
              // Dynamic fallback for unknown rooms
              layout = { 
                x: 50 + (index * 60) % 600, 
                y: 350 + (index * 20) % 200, 
                w: 200, 
                h: 200, 
                name: roomKey, 
                icon: 'door', hasBed: false, hasSofa: false 
              };
            }

            return (
              <BlueprintRoom 
                key={roomKey}
                name={layout.name} 
                x={layout.x} y={layout.y} w={layout.w} h={layout.h} 
                data={roomData} 
                theme={theme} 
                icon={layout.icon}
                hasBed={layout.hasBed}
                hasSofa={layout.hasSofa}
              />
            );
          })}

          <g className="text-[12px] font-black opacity-40 fill-current">
            <text x="500" y="30" textAnchor="middle">EXTERIOR WALL: 15700mm</text>
            <text x="30" y="312" textAnchor="middle" transform="rotate(-90, 30, 312)">WIDTH: 10800mm</text>
          </g>

          <g className="text-[10px] opacity-60">
             <rect x="750" y="520" width="10" height="10" fill="currentColor" />
             <text x="770" y="528">STRUCT_LOAD_BEARING</text>
             <circle cx="755" cy="545" r="5" fill="#3b82f6" />
             <text x="770" y="548">ACTIVE_COMPONENT</text>
          </g>
        </svg>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(data).map(([name, val]: [string, any]) => (
          <div key={name} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-black/5'}`}>
             <h4 className="text-[10px] font-black uppercase opacity-40 mb-2 truncate text-blue-500">{name}</h4>
             <div className="flex flex-col gap-1">
                <RecursiveDataDisplay val={val} theme={theme} />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecursiveDataDisplay({ val, theme, depth = 0 }: { val: any, theme: string, depth?: number }) {
  if (typeof val !== 'object' || val === null) {
    return <span className={val === '1' ? 'text-blue-500 font-bold' : ''}>{String(val)}</span>;
  }

  return (
    <div className={`space-y-1 ${depth > 0 ? 'ml-2 border-l border-white/10 pl-2' : ''}`}>
      {Object.entries(val).map(([fKey, fVal]: [string, any]) => (
        <div key={fKey} className="text-[10px] font-mono flex flex-col">
          <div className="flex justify-between items-center">
            <span className="opacity-60">{fKey}:</span>
            {typeof fVal !== 'object' ? (
              <span className={fVal === '1' ? 'text-blue-500 font-bold' : ''}>{String(fVal)}</span>
            ) : null}
          </div>
          {typeof fVal === 'object' && <RecursiveDataDisplay val={fVal} theme={theme} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

function BlueprintRoom({ name, x, y, w, h, data, theme, icon, hasBed, hasSofa }: any) {
  const getAppliance = (obj: any, keys: string[]) => {
    for (const key of keys) {
      if (obj[key]) return obj[key];
    }
    return null;
  };

  const lightData = getAppliance(data, ['light', 'bulb', 'lamp']);
  const fanData = getAppliance(data, ['fan', 'ventilator', 'ac']);
  const windowData = getAppliance(data, ['window', 'windowOpen', 'isWindowOpen', 'vent']);
  
  const lightOn = lightData ? (lightData === '1' || lightData.isOn === '1') : false;
  const fanOn = fanData ? (fanData === '1' || fanData.isOn === '1') : false;
  const windowOpen = windowData ? (windowData === '1' || windowData.isOpen === '1' || windowData.isOn === '1') : false;
  const locked = data.doorLocked === '1' || data.isLocked === '1';

  return (
    <g>
      <rect 
        x={x} y={y} width={w} height={h} 
        fill="currentColor" 
        className={`${lightOn ? 'opacity-30 text-yellow-400' : 'opacity-[0.02]'} transition-all duration-700`} 
      />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="currentColor" strokeWidth="4" className="opacity-40" />
      <text x={x + 15} y={y + 30} className="text-[14px] font-black uppercase fill-current tracking-tighter opacity-80">{name}</text>
      <foreignObject x={x + 15} y={y + 45} width={w - 30} height={h - 60}>
        <div className="flex flex-wrap gap-2">
          {lightData && (
            <div className={`p-2 rounded-lg transition-all border ${lightOn ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10'}`}>
               <Lightbulb size={20} className={lightOn ? 'text-yellow-400 animate-pulse' : 'text-slate-500'} />
            </div>
          )}
          {fanData && (
            <div className={`p-2 rounded-lg transition-all border ${fanOn ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10'}`}>
               <div className={fanOn ? 'animate-spin-slow' : ''}>
                <Wind size={20} className={fanOn ? 'text-blue-400' : 'text-slate-500'} />
               </div>
            </div>
          )}
          {windowData && (
            <div className={`p-2 rounded-lg transition-all border ${windowOpen ? 'bg-sky-500/20 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-white/5 border-white/10'}`}>
               <Layout size={20} className={windowOpen ? 'text-sky-400 scale-110' : 'text-slate-500'} />
            </div>
          )}
          {data.doorLocked !== undefined && (
            <div className={`p-2 rounded-lg border ${locked ? 'bg-red-600/20 border-red-500/50' : 'bg-emerald-600/20 border-emerald-500/50'}`}>
                {locked ? <Lock size={20} className="text-red-500" /> : <Unlock size={20} className="text-emerald-500" />}
            </div>
          )}
        </div>
      </foreignObject>

      {hasBed && (
        <rect x={x + w - 100} y={y + h - 140} width={80} height={120} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="opacity-20" />
      )}
      {hasSofa && (
        <path d={`M ${x + w/2 - 60} ${y + h - 40} L ${x + w/2 + 60} ${y + h - 40} L ${x + w/2 + 60} ${y + h - 80} L ${x + w/2 - 60} ${y + h - 80} Z`} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="opacity-20" />
      )}
      
      <foreignObject x={x + w - 40} y={y + 10} width="30" height="30">
        <div className="opacity-10 text-current flex items-center justify-center h-full">
           {icon === 'kitchen' && <Wrench size={20} />}
           {icon === 'living' && <Activity size={20} />}
           {icon === 'bed' && <Target size={20} />}
           {icon === 'bath' && <Zap size={20} />}
           {icon === 'door' && <Lock size={20} />}
        </div>
      </foreignObject>
    </g>
  );
}



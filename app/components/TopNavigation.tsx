'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Workflow, 
  Network, 
  BookOpen, 
  Zap, 
  Moon, 
  Sun,
  Menu,
  X
} from 'lucide-react';

interface TopNavigationProps {
  theme: 'dark' | 'light';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  mainTab: 'compiler' | 'dsa' | 'revision';
  setMainTab: (tab: 'compiler' | 'dsa' | 'revision') => void;
  enableBeta?: boolean;
}

export default function TopNavigation({ 
  theme, 
  setTheme, 
  mainTab, 
  setMainTab,
  enableBeta = false
}: TopNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'compiler', label: 'Compiler_Core', icon: Workflow, color: 'blue' },
    { id: 'revision', label: 'Revision_Lab', icon: BookOpen, color: 'amber' },
    ...(enableBeta ? [{ id: 'dsa', label: 'World_Space', icon: Network, color: 'emerald' }] : [])
  ];

  const handleTabSelect = (id: any) => {
    setMainTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`relative z-50 border-b px-4 md:px-8 py-4 md:py-5 flex items-center justify-between backdrop-blur-3xl transition-all ${
      theme === 'dark' ? 'border-white/5 bg-black/60' : 'border-black/5 bg-white/70 shadow-sm'
    }`}>
      <div className="flex items-center gap-4 md:gap-10">
        <div className="flex items-center gap-3 md:gap-5">
          <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border-l-2 ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-blue-600/10 border-blue-600 text-blue-600'}`}>
            <Cpu size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <h1 className={`text-xl md:text-2xl font-black tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Kernel_Trace <span className="text-[8px] md:text-[10px] font-mono text-blue-500 ml-1 md:ml-2 tracking-widest opacity-60">RUNTIME_ENV_V2</span>
            </h1>
            <p className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase tracking-[0.2em] md:tracking-[0.4em] mt-1 md:mt-2">Physical Memory Allocation Visualizer</p>
          </div>
          <div className="sm:hidden">
            <h1 className={`text-lg font-black tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Kernel_Trace
            </h1>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-2 border-l border-white/5 pl-10 h-10">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setMainTab(item.id as any)}
              className={`px-4 md:px-6 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 group ${
                mainTab === item.id 
                  ? (theme === 'dark' ? `text-${item.color}-400` : `text-${item.color}-600`) 
                  : (theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
              }`}
            >
              <item.icon size={14} className="group-hover:rotate-12 transition-transform" />
              {item.label}
              {mainTab === item.id && (
                <motion.div layoutId="navIndicator" className={`absolute -bottom-[21px] left-0 right-0 h-[2px] bg-${item.color}-500`} />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
           onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
           className={`p-2 rounded-none border transition-all hover:bg-opacity-80 active:scale-95 ${
             theme === 'dark' 
               ? 'border-white/10 text-yellow-500 bg-white/5' 
               : 'border-black/10 text-orange-600 bg-slate-50 shadow-sm'
           }`}
        >
          {theme === 'dark' ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
        </button>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`lg:hidden p-2 border transition-all ${
            theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-slate-900'
          }`}
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-full left-0 right-0 border-b lg:hidden z-50 ${
              theme === 'dark' ? 'bg-[#0f0f10] border-white/10 shadow-2xl' : 'bg-white border-black/10 shadow-xl'
            }`}
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleTabSelect(item.id as any)}
                  className={`w-full p-4 flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${
                    mainTab === item.id 
                      ? (theme === 'dark' ? `bg-${item.color}-500/10 border-${item.color}-500/50 text-${item.color}-400` : `bg-${item.color}-50 border-${item.color}-200 text-${item.color}-600`) 
                      : (theme === 'dark' ? 'border-transparent text-slate-500 hover:bg-white/5' : 'border-transparent text-slate-400 hover:bg-slate-50')
                  }`}
                >
                  <item.icon size={16} />
                  {item.label.replace('_', ' ')}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

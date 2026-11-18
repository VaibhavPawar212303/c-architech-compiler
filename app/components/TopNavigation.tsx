'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Workflow, BookOpen, Zap, Network, Moon, Sun, Menu, X, ArrowLeft } from 'lucide-react';
import Logo from './Logo';

type MainTab = 'compiler' | 'dsa' | 'revision' | 'learning';

interface TopNavigationProps {
  theme: 'dark' | 'light';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  mainTab: MainTab;
  setMainTab: (tab: MainTab) => void;
  enableBeta?: boolean;
}

// Main Thedappled site. Override with NEXT_PUBLIC_DAPPLED_URL for previews.
const DAPPLED_URL = process.env.NEXT_PUBLIC_DAPPLED_URL || 'https://thedappled.com';

// Static class maps (Tailwind can't see dynamically built class names).
const ACTIVE_TEXT: Record<string, string> = {
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  green: 'text-emerald-600',
};
const ACTIVE_TEXT_DARK: Record<string, string> = {
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  green: 'text-emerald-400',
};

const siteLinks = [
  { label: 'Courses', href: `${DAPPLED_URL}/search` },
  { label: 'Books', href: `${DAPPLED_URL}/books` },
  { label: 'Blogs', href: `${DAPPLED_URL}/blogs` },
];

export default function TopNavigation({ theme, setTheme, mainTab, setMainTab, enableBeta = false }: TopNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const dark = theme === 'dark';
  const accent = (color: string) => (dark ? ACTIVE_TEXT_DARK[color] : ACTIVE_TEXT[color]);

  const navItems = [
    { id: 'compiler', label: 'Compiler', icon: Workflow, color: 'blue' },
    { id: 'learning', label: 'Learning Path', icon: BookOpen, color: 'purple' },
    { id: 'revision', label: 'Revision Lab', icon: Zap, color: 'green' },
    ...(enableBeta ? [{ id: 'dsa', label: 'World Space', icon: Network, color: 'green' }] : []),
  ] as { id: MainTab; label: string; icon: React.ElementType; color: string }[];

  const handleTabSelect = (id: MainTab) => {
    setMainTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`relative z-50 h-[72px] border-b px-4 md:px-8 flex items-center justify-between ${
        dark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
      }`}
    >
      {/* Brand */}
      <a href={DAPPLED_URL} className="flex items-center gap-3 shrink-0" aria-label="Thedappled home">
        <Logo theme={theme} />
        <span className={`hidden sm:inline rounded-full px-3 py-1 text-xs font-semibold ${dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
          Compiler
        </span>
      </a>

      {/* Segmented tabs */}
      <nav className={`hidden lg:flex items-center gap-1 rounded-xl p-1 ${dark ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {navItems.map((item) => {
          const active = mainTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMainTab(item.id)}
              className={`px-5 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                active
                  ? `border font-semibold ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${accent(item.color)}`
                  : dark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Site links + actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden xl:flex items-center gap-5 mr-2">
          {siteLinks.map((l) => (
            <a key={l.label} href={l.href} className={`text-sm font-medium transition-colors ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              {l.label}
            </a>
          ))}
        </div>

        <button
          onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          aria-label="Toggle theme"
          className={`h-9 w-9 flex items-center justify-center rounded-[10px] border transition-colors ${
            dark ? 'border-slate-800 text-yellow-400 hover:bg-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <a
          href={DAPPLED_URL}
          className={`hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-xs font-semibold transition-colors ${
            dark ? 'border-slate-700 text-slate-200 hover:bg-slate-900' : 'border-slate-200 text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft size={14} /> Back to Thedappled
        </a>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
          className={`lg:hidden h-9 w-9 flex items-center justify-center rounded-[10px] border ${
            dark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
          }`}
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`absolute top-full left-0 right-0 border-b lg:hidden z-50 shadow-xl ${dark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
          >
            <div className="p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                    mainTab === item.id
                      ? `${dark ? 'bg-slate-900' : 'bg-slate-100'} ${accent(item.color)}`
                      : dark ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
              <div className={`pt-2 mt-2 border-t grid grid-cols-2 gap-1 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
                {siteLinks.map((l) => (
                  <a key={l.label} href={l.href} className={`px-4 py-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{l.label}</a>
                ))}
                <a href={DAPPLED_URL} className="px-4 py-2 text-sm font-semibold text-blue-600">← Back to Thedappled</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

'use client';

import React from 'react';
import { ChevronDown, Search, X, Check, Code2, Pencil } from 'lucide-react';
import { EXAMPLE_GROUPS, tagsFor } from '../data/example-groups';

export interface ExampleProgram {
  id: string;
  title: string;
  description: string;
  code: string;
}

interface ExamplePickerProps {
  theme: 'dark' | 'light';
  programs: ExampleProgram[];
  /** id of the loaded example, or '' when the editor holds the user's own code */
  currentId: string;
  /** a saved copy of the user's own program exists, so "My code" can bring it back */
  myCodeAvailable: boolean;
  onSelectExample: (program: ExampleProgram) => void;
  onSelectMyCode: () => void;
}

type Row =
  | { kind: 'mycode' }
  | { kind: 'example'; program: ExampleProgram; tags: string[] };

interface Section {
  label: string | null;
  rows: Row[];
}

// Bold, underlined match inside a title while searching.
function Highlighted({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-extrabold text-blue-600 underline decoration-blue-300 underline-offset-2">{text.slice(i, i + query.length)}</span>
      {text.slice(i + query.length)}
    </>
  );
}

export default function ExamplePicker({ theme, programs, currentId, myCodeAvailable, onSelectExample, onSelectMyCode }: ExamplePickerProps) {
  const dark = theme === 'dark';
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [focusIdx, setFocusIdx] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const uid = React.useId();

  const withTags = React.useMemo(
    () => programs.map((p) => ({ program: p, tags: tagsFor(p.code) })),
    [programs]
  );

  const q = query.trim();
  const sections: Section[] = React.useMemo(() => {
    if (q) {
      const needle = q.toLowerCase();
      const hits = withTags.filter(({ program, tags }) =>
        `${program.title} ${program.description} ${tags.join(' ')}`.toLowerCase().includes(needle)
      );
      return [{ label: null, rows: hits.map((h) => ({ kind: 'example', ...h }) as Row) }];
    }
    const byId = new Map(withTags.map((w) => [w.program.id, w]));
    const used = new Set<string>();
    const out: Section[] = [{ label: null, rows: [{ kind: 'mycode' }] }];
    EXAMPLE_GROUPS.forEach((g) => {
      const rows = g.ids
        .map((id) => byId.get(id))
        .filter((w): w is NonNullable<typeof w> => !!w)
        .map((w) => {
          used.add(w.program.id);
          return { kind: 'example', ...w } as Row;
        });
      if (rows.length) out.push({ label: g.label, rows });
    });
    const rest = withTags.filter((w) => !used.has(w.program.id)).map((w) => ({ kind: 'example', ...w }) as Row);
    if (rest.length) out.push({ label: 'More examples', rows: rest });
    return out;
  }, [withTags, q]);

  const flat: Row[] = React.useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const resultCount = flat.filter((r) => r.kind === 'example').length;
  const current = programs.find((p) => p.id === currentId);

  const isActive = (row: Row) => (row.kind === 'mycode' ? !currentId : row.program.id === currentId);
  const isDisabled = (row: Row) => row.kind === 'mycode' && !!currentId && !myCodeAvailable;

  const close = React.useCallback((returnFocus = true) => {
    setOpen(false);
    setQuery('');
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const choose = (row: Row) => {
    if (isDisabled(row)) return;
    if (row.kind === 'mycode') {
      if (currentId) onSelectMyCode();
    } else if (row.program.id !== currentId) {
      onSelectExample(row.program);
    }
    close();
  };

  // When opening, put the cursor on the loaded example and focus the search box.
  React.useEffect(() => {
    if (!open) return;
    const idx = flat.findIndex(isActive);
    setFocusIdx(idx >= 0 ? idx : 0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // New search text: start at the first result.
  React.useEffect(() => {
    if (open) setFocusIdx(0);
  }, [q, open]);

  // Close when clicking outside.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);

  // Keep the focused row visible while moving with the arrow keys.
  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${focusIdx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [focusIdx, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (flat.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((i) => (i + 1) % flat.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((i) => (i - 1 + flat.length) % flat.length); }
    else if (e.key === 'Home' && !query) { e.preventDefault(); setFocusIdx(0); }
    else if (e.key === 'End' && !query) { e.preventDefault(); setFocusIdx(flat.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); const row = flat[focusIdx]; if (row) choose(row); }
  };

  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const title = dark ? 'text-white' : 'text-slate-900';

  let rowIndex = -1;
  const rowId = (i: number) => `${uid}-opt-${i}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(false) : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Example program: ${current ? current.title : 'My code'}`}
        className={`h-10 w-52 rounded-[10px] border px-3 flex items-center gap-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          open
            ? 'border-blue-500 ring-2 ring-blue-500/20 ' + (dark ? 'bg-slate-900' : 'bg-white')
            : dark
              ? 'bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-900'
              : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-white'
        }`}
      >
        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
          {current ? <Code2 size={12} /> : <Pencil size={11} />}
        </span>
        <span className={`truncate flex-1 text-left ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{current ? current.title : 'My code'}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180 text-blue-600' : muted}`} />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full mt-2 z-50 w-[min(470px,calc(100vw-2rem))] rounded-2xl border shadow-2xl overflow-hidden ${
            dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}
          onKeyDown={onKeyDown}
        >
          {/* Search */}
          <div className="p-3.5 pb-2">
            <div className={`flex items-center gap-2 h-[42px] rounded-[10px] border px-3 ${
              dark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'
            } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20`}>
              <Search size={15} className={muted} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search examples…"
                role="combobox"
                aria-expanded="true"
                aria-controls={`${uid}-list`}
                aria-activedescendant={flat.length ? rowId(focusIdx) : undefined}
                aria-label="Search examples"
                autoComplete="off"
                spellCheck={false}
                className={`flex-1 min-w-0 bg-transparent outline-none text-sm font-medium placeholder:font-normal ${title}`}
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }} className={`p-1 rounded ${muted} hover:text-blue-600`}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div ref={listRef} id={`${uid}-list`} role="listbox" aria-label="Example programs" className="max-h-[min(60vh,440px)] overflow-y-auto custom-scrollbar px-2 pb-2">
            {q && flat.length > 0 && (
              <p className={`px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wide ${muted}`}>
                {resultCount} result{resultCount === 1 ? '' : 's'} for &ldquo;{q}&rdquo;
              </p>
            )}

            {flat.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className={`text-sm font-semibold ${title}`}>No examples match &ldquo;{q}&rdquo;</p>
                <p className={`text-xs mt-1 ${muted}`}>Try a word like pointer, struct or input.</p>
                <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                  Clear search
                </button>
              </div>
            )}

            {sections.map((section, si) => (
              <div key={si} className={section.label ? 'mt-2' : ''}>
                {section.label && (
                  <p className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide ${muted}`}>{section.label}</p>
                )}
                {section.rows.map((row) => {
                  rowIndex += 1;
                  const idx = rowIndex;
                  const focused = idx === focusIdx;
                  const active = isActive(row);
                  const disabled = isDisabled(row);
                  const isMy = row.kind === 'mycode';
                  const rowTitle = isMy ? 'My code' : row.program.title;
                  const rowDesc = isMy
                    ? currentId
                      ? myCodeAvailable ? 'Go back to your own program' : 'Your own program (none saved yet)'
                      : 'Whatever is in the editor right now'
                    : row.program.description;
                  return (
                    <div
                      key={isMy ? 'my' : row.program.id}
                      id={rowId(idx)}
                      data-idx={idx}
                      role="option"
                      aria-selected={active}
                      aria-disabled={disabled}
                      onMouseEnter={() => setFocusIdx(idx)}
                      onClick={() => choose(row)}
                      className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 min-h-[56px] transition-colors ${
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        focused
                          ? dark ? 'bg-blue-950/70' : 'bg-blue-100'
                          : active
                            ? dark ? 'bg-slate-800' : 'bg-slate-50'
                            : ''
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? (dark ? 'bg-slate-900 text-blue-300' : 'bg-white text-blue-600') : dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isMy ? <Pencil size={14} /> : <Code2 size={14} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold truncate ${title}`}>
                          {isMy ? rowTitle : <Highlighted text={rowTitle} query={q} />}
                        </span>
                        <span className={`block text-xs truncate ${muted}`}>{rowDesc}</span>
                      </span>
                      {!isMy && (
                        <span className="hidden sm:flex items-center gap-1.5 shrink-0">
                          {row.tags.map((t) => (
                            <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
                          ))}
                        </span>
                      )}
                      {active && (
                        <span className="w-[18px] h-[18px] rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0" aria-hidden="true">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between gap-3 px-5 py-3 border-t text-xs ${
            dark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          } ${muted}`}>
            <span>{q ? `${resultCount} of ${programs.length} examples` : `${programs.length} examples`}</span>
            <span className="hidden sm:inline">&uarr; &darr; move &nbsp;&middot;&nbsp; Enter load &nbsp;&middot;&nbsp; Esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}

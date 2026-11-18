// How the example programs are grouped in the picker. The programs themselves live in
// revision-programs.json; anything not listed here ends up in "More examples".
export const EXAMPLE_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Basics', ids: ['rev-arithmetic'] },
  {
    label: 'Circle area',
    ids: ['rev-arithmetic-circle', 'rev-arithmetic-circle-func', 'rev-arithmetic-circle-ptr', 'rev-arithmetic-circle-ptr-full'],
  },
  { label: 'Reverse a number', ids: ['rev-number-temp', 'rev-number-pointer'] },
  { label: 'Pointers', ids: ['swap-no-pointer', 'swap-pointers', 'rev-double-pointers'] },
  { label: 'Structures & data structures', ids: ['rev-nested-structs', 'rev-stack-basic'] },
];

const TAG_RULES: { tag: string; test: (code: string) => boolean }[] = [
  { tag: 'Input', test: (c) => /\bscanf\s*\(/.test(c) },
  { tag: 'Pointers', test: (c) => /\b(int|char|float|double|void|struct\s+\w+)\s*\*+\s*\w+/.test(c) },
  { tag: 'Structs', test: (c) => /\bstruct\s+\w+\s*\{/.test(c) },
  { tag: 'Heap', test: (c) => /\bmalloc\s*\(/.test(c) },
  {
    tag: 'Functions',
    test: (c) => (c.match(/^\s*(?:int|void|float|double)\s+(?!main\b)\w+\s*\([^;)]*\)\s*\{?\s*$/gm) || []).length > 0,
  },
  { tag: 'Arrays', test: (c) => /\b\w+\s*\[\s*\w*\s*\]/.test(c) },
];

/** Up to two short tags worked out from the program's code. */
export function tagsFor(code: string): string[] {
  return TAG_RULES.filter((r) => r.test(code)).map((r) => r.tag).slice(0, 2);
}

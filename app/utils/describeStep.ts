// Turns one C statement into a plain-English sentence for the "What just happened" caption.
// This is a text heuristic (the compiler simulates C, it does not run it), so unknown
// statements fall back to showing the code itself.
export function describeStatement(raw: string): string {
  let s = (raw || '').trim().replace(/\/\/.*$/, '').trim().replace(/;$/, '').replace(/\{$/, '').trim();
  if (!s) return 'Moved on to the next line.';

  if (s.startsWith('#include')) return `Included the header ${s.replace('#include', '').trim()}.`;

  const structDef = s.match(/^struct\s+(\w+)\s*\{.*\}$/);
  if (structDef) return `Defined the struct ${structDef[1]}.`;

  if (/^(int|void)\s+main\s*\(/.test(s)) return 'Started main(). It gets its own frame on the stack.';
  if (s === '}') return 'Reached the end of a block.';

  const malloc = s.match(/^(?:(?:struct\s+\w+|int|char|float|double)\s*)?\**\s*(\w+)\s*=\s*(?:\([^)]*\)\s*)?malloc\s*\((.*)\)$/);
  if (malloc) return `Allocated ${malloc[2].trim()} on the heap. ${malloc[1]} now points to it.`;

  const free = s.match(/^free\s*\(\s*(\w+)\s*\)$/);
  if (free) return `Released the heap block that ${free[1]} points to. ${free[1]} still holds the old address, so it now dangles.`;

  if (/^printf\s*\(/.test(s)) return 'Printed text to the console.';
  if (/^scanf\s*\(/.test(s)) return 'Asked for input and waited for you to type a value.';

  const ret = s.match(/^return\b\s*(.*)$/);
  if (ret) return ret[1] ? `Returned ${ret[1].trim()}.` : 'Returned from the function.';

  const deref = s.match(/^\*\s*(\w+)\s*=\s*(.+)$/);
  if (deref) return `Wrote ${deref[2].trim()} into the memory that ${deref[1]} points to.`;

  const arrow = s.match(/^(\w+)->([\w.]+)\s*=\s*(.+)$/);
  if (arrow) return `Wrote ${arrow[3].trim()} into field ${arrow[2]} of the struct that ${arrow[1]} points to.`;

  const field = s.match(/^(\w+)\.([\w.]+)\s*=\s*(.+)$/);
  if (field) return `Set field ${field[2]} of ${field[1]} to ${field[3].trim()}.`;

  const decl = s.match(/^(struct\s+\w+|int|char|float|double)\s*(\**)\s*(\w+)\s*(?:=\s*(.+))?$/);
  if (decl) {
    const [, type, stars, name, init] = decl;
    return init
      ? `Created ${type}${stars ? ' ' + stars : ''} ${name} on the stack and set it to ${init.trim()}.`
      : `Created ${type}${stars ? ' ' + stars : ''} ${name} on the stack. Its value is not set yet.`;
  }

  const assign = s.match(/^(\w+)\s*([+\-*/])?=\s*(.+)$/);
  if (assign) return assign[2] ? `Updated ${assign[1]} with ${assign[2]}= ${assign[3].trim()}.` : `Set ${assign[1]} to ${assign[3].trim()}.`;

  const ctrl = s.match(/^(if|for|while|else)\b/);
  if (ctrl) return `Checked the ${ctrl[1]} condition.`;

  return `Ran: ${s}`;
}

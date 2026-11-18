'use client';

import React from 'react';

interface Arrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  freed: boolean;
}

interface PointerArrowsProps {
  /** Positioned (relative) element that contains both the stack and the heap panels. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Re-measure whenever any of these change (stack, heap, theme, ...). */
  deps: unknown[];
}

// Draws an arrow from every pointer variable (`[data-ptr-from]`) to the heap block it points to
// (`[data-heap-addr]`). Positions are measured from the DOM, so the arrows follow scrolling,
// resizing and the entry animations. Arrows are skipped when the two panels are stacked
// vertically (small screens) or when either end is scrolled out of its panel.
export default function PointerArrows({ containerRef, deps }: PointerArrowsProps) {
  const [arrows, setArrows] = React.useState<Arrow[]>([]);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  const measure = React.useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    setSize((prev) => (prev.w === cr.width && prev.h === cr.height ? prev : { w: cr.width, h: cr.height }));

    const heapEls = Array.from(c.querySelectorAll<HTMLElement>('[data-heap-addr]'));
    const next: Arrow[] = [];
    c.querySelectorAll<HTMLElement>('[data-ptr-from]').forEach((from) => {
      const addr = from.dataset.ptrFrom;
      const to = heapEls.find((h) => h.dataset.heapAddr === addr);
      if (!addr || !to) return;

      const fr = from.getBoundingClientRect();
      const tr = to.getBoundingClientRect();
      if (tr.left < fr.right) return; // panels are stacked: no side-to-side arrow

      const fy = fr.top + fr.height / 2;
      const ty = tr.top + Math.min(tr.height / 2, 32);
      const fp = from.closest('[data-panel]')?.getBoundingClientRect();
      const tp = to.closest('[data-panel]')?.getBoundingClientRect();
      if (fp && (fy < fp.top + 72 || fy > fp.bottom - 4)) return; // scrolled out of the stack panel
      if (tp && (ty < tp.top + 72 || ty > tp.bottom - 4)) return; // scrolled out of the heap panel

      next.push({
        x1: fr.right - cr.left,
        y1: fy - cr.top,
        x2: tr.left - cr.left,
        y2: ty - cr.top,
        freed: to.dataset.freed === 'true',
      });
    });
    setArrows(next);
  }, [containerRef]);

  // Re-measure after every relevant change, and for a moment afterwards so the arrows follow
  // the entry animations of the elements they connect.
  React.useLayoutEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      measure();
      if (performance.now() - start < 900) raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  React.useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onChange = () => measure();
    const ro = new ResizeObserver(onChange);
    ro.observe(c);
    c.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      ro.disconnect();
      c.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [containerRef, measure]);

  if (arrows.length === 0) return null;

  return (
    <svg
      className="absolute left-0 top-0 pointer-events-none z-30 overflow-visible"
      width={size.w}
      height={size.h}
      aria-hidden="true"
    >
      {arrows.map((a, i) => {
        const color = a.freed ? '#ef4444' : '#9333ea';
        const cx = (a.x1 + a.x2) / 2;
        return (
          <g key={i}>
            <path
              d={`M ${a.x1} ${a.y1} C ${cx} ${a.y1}, ${cx} ${a.y2}, ${a.x2} ${a.y2}`}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={a.freed ? '5 4' : undefined}
            />
            <polygon points={`${a.x2},${a.y2} ${a.x2 - 9},${a.y2 - 5} ${a.x2 - 9},${a.y2 + 5}`} fill={color} />
            {a.freed && (
              <text x={cx} y={(a.y1 + a.y2) / 2 - 4} fill={color} fontSize="14" fontWeight="700" textAnchor="middle">
                ✕
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

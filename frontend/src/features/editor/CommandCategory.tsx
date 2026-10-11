import { useEffect, useRef, type ReactNode } from 'react';

export function CommandCategory({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null); const timer = useRef<number | undefined>(undefined);
  const cancel = () => window.clearTimeout(timer.current);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return <details ref={ref} className="command-category" onPointerEnter={cancel} onPointerLeave={event => { if (event.pointerType === 'mouse') { cancel(); timer.current = window.setTimeout(() => { if (ref.current) ref.current.open = false; }, 180); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false; }} onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }} onToggle={event => { if (event.currentTarget.open) document.querySelectorAll<HTMLDetailsElement>('.command-category[open]').forEach(item => { if (item !== event.currentTarget) item.open = false; }); }}><summary>{title}</summary>{children}</details>;
}

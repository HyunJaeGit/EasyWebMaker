import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CategoryIcon } from './CategoryIcon';

export function CategoryInspector({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<string[]>([]); const [active, setActive] = useState('내용·링크·이미지');
  useLayoutEffect(() => {
    const panels = Array.from(root.current!.querySelectorAll<HTMLDetailsElement>('.property-category,.element-inspector-details'));
    const title = (panel: HTMLDetailsElement) => panel.querySelector('summary > span')?.textContent || panel.querySelector('summary')?.textContent || '';
    setCategories(panels.map(title));
    const show = (name: string) => { panels.forEach(panel => { panel.hidden = title(panel) !== name; if (!panel.hidden) panel.open = true; }); setActive(name); };
    show('내용·링크·이미지');
    const focus = (event: Event) => {
      const label = (event as CustomEvent<string>).detail;
      const input = Array.from(root.current!.querySelectorAll<HTMLElement>('[aria-label]')).find(item => item.getAttribute('aria-label') === label);
      const panel = input?.closest<HTMLDetailsElement>('.property-category,.element-inspector-details'); if (panel) show(title(panel));
    };
    const select = (event: Event) => show((event as CustomEvent<string>).detail);
    root.current!.addEventListener('ew:category-select', select); document.addEventListener('ew:property-focus', focus);
    const element = root.current!;
    return () => { element.removeEventListener('ew:category-select', select); document.removeEventListener('ew:property-focus', focus); };
  }, []);
  return <div className="category-inspector" ref={root}><div className="property-icon-rail" role="tablist" aria-label="속성 카테고리" aria-orientation="vertical">{categories.map((name, index) => <button key={name} type="button" role="tab" aria-label={name} title={name} aria-selected={active === name} tabIndex={active === name ? 0 : -1} onClick={() => root.current!.dispatchEvent(new CustomEvent('ew:category-select', { detail: name }))} onKeyDown={event => { const next = event.key === 'ArrowDown' ? (index + 1) % categories.length : event.key === 'ArrowUp' ? (index + categories.length - 1) % categories.length : undefined; if (next !== undefined) { event.preventDefault(); root.current!.dispatchEvent(new CustomEvent('ew:category-select', { detail: categories[next] })); (event.currentTarget.parentElement!.children[next] as HTMLElement).focus(); } }}><CategoryIcon name={name} /></button>)}</div><div className="property-category-stage">{children}</div></div>;
}

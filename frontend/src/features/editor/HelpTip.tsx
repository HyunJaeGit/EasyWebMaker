import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

export function HelpTip({ text, label = '사용 방법' }: { text: string; label?: string }) {
  const id = useId();
  const [position, setPosition] = useState<{ left: number; top: number }>();
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(undefined);
    window.addEventListener('scroll', close, true); window.addEventListener('resize', close);
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [position]);
  const show = (element: HTMLElement) => { const rect = element.getBoundingClientRect(); setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)), top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 150)) }); };
  return <span className="help-tip"><button type="button" className="help-tip-trigger" aria-label={label} aria-describedby={position ? id : undefined} onMouseEnter={event => show(event.currentTarget)} onMouseLeave={() => setPosition(undefined)} onFocus={event => show(event.currentTarget)} onBlur={() => setPosition(undefined)} onClick={event => { event.stopPropagation(); show(event.currentTarget); }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setPosition(undefined); } }}>?</button>{position && createPortal(<span id={id} role="tooltip" className="help-tip-content" style={position}>{text}</span>, document.body)}</span>;
}

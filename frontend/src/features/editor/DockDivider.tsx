export function DockDivider({ value, changed }: { value: number; changed: (value: number) => void }) {
  const clamp = (next: number) => Math.max(15, Math.min(80, next));
  return <div className="dock-divider" role="separator" aria-label="페이지 구조와 속성 높이 조절" aria-orientation="horizontal" aria-valuemin={15} aria-valuemax={80} aria-valuenow={Math.round(value)} tabIndex={0}
    onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
    onPointerMove={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const rect = event.currentTarget.parentElement!.getBoundingClientRect(); changed(clamp((event.clientY - rect.top) / rect.height * 100)); }}
    onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); changed(clamp(value + (event.key === 'ArrowUp' ? -5 : 5))); } if (event.key === 'Home') changed(32); }}><span /></div>;
}

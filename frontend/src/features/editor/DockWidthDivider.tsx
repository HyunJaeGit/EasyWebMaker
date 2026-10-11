export function DockWidthDivider({ value, changed }: { value: number; changed: (value: number) => void }) {
  const clamp = (next: number) => Math.max(220, Math.min(520, next));
  return <div className="dock-width-divider" role="separator" aria-label="구조·속성 패널 너비 조절" aria-orientation="vertical" aria-valuemin={220} aria-valuemax={520} aria-valuenow={Math.round(value)} tabIndex={0}
    onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
    onPointerMove={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const rect = event.currentTarget.parentElement!.getBoundingClientRect(); changed(clamp(rect.right - event.clientX)); }}
    onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); changed(clamp(value + (event.key === 'ArrowLeft' ? 20 : -20))); } if (event.key === 'Home') changed(310); }}><span /></div>;
}

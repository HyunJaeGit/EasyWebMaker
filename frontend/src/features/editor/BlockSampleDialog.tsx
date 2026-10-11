import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { blockCatalog, type BlockKind } from '../blocks/definitions';
import { variantsFor, type VariantId } from '../blocks/variants';

export function BlockSampleDialog({ kind, choose, close }: { kind: BlockKind; choose: (variant: { id: VariantId; label: string }) => void; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const label = blockCatalog.find(block => block.id === kind)!.label;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    element.querySelector<HTMLButtonElement>('.block-sample-grid button')?.focus();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(<dialog ref={dialog} id={`variants-${kind}`} className="block-sample-dialog" aria-labelledby="block-sample-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); }}>
    <div className="block-sample-heading"><h2 id="block-sample-title">{label} 샘플</h2><button type="button" aria-label="샘플 선택 닫기" title="닫기 · Esc" onClick={close}>×</button></div>
    <div className="block-sample-grid" role="group" aria-label={`${label} 샘플`}>{variantsFor(kind)?.map(variant => <button key={variant.id} type="button" aria-label={`${label} ${variant.label} 추가`} title={`${variant.label}${variant.id === 'basic' ? ' (기본)' : ''} · ${variant.description}`} onClick={() => choose(variant)}><span className={`block-preview ${variant.layout}`} aria-hidden="true"><i /><i /><i /></span>{variant.id === 'basic' && <span className="block-default-dot" aria-hidden="true" />}</button>)}</div>
  </dialog>, document.body);
}

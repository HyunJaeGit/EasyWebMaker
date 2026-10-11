import { namedClone } from './elementNames';
// 우클릭 작업은 편집 모델에만 적용한다. 잘라낸 블록은 탭 메모리에서 붙여넣는다.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { insertBlock, isContainer } from './engine';
import { blockCatalog } from '../blocks/definitions';
import { componentLabel, layerItems } from './PropertiesPanel';
interface MenuPoint { x: number; y: number; component?: Component }
export function ContextMenu({ editor, active, onSelect, onShortcut, notify }: { editor: Editor; active: boolean; onSelect: (component: Component) => void; onShortcut: (kind: 'rename' | 'size' | 'color' | 'image' | 'image-url' | 'properties', component: Component) => void; notify: (message: string) => void }) {
  const [point, setPoint] = useState<MenuPoint>();
  const [adding, setAdding] = useState(false);
  const clipboard = useRef<Component | undefined>(undefined);
  const menu = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const close = () => { setPoint(undefined); previousFocus.current?.focus(); };
  useEffect(() => {
    if (!active) { setPoint(undefined); return; }
    const frame = editor.Canvas.getFrameEl(); const canvasDocument = editor.Canvas.getDocument();
    const open = (event: MouseEvent) => {
      const inCanvas = event.currentTarget === canvasDocument;
      const element = event.target as HTMLElement;
      if (!inCanvas && !element.closest('.structure-row,.canvas-column')) return;
      const components = [editor.getWrapper(), ...layerItems(editor).map(item => item.component)].filter((component): component is Component => Boolean(component));
      let component: Component | undefined;
      if (inCanvas) {
        let node: HTMLElement | null = element;
        while (node && !component) { component = components.find(item => item.getEl() === node); node = node.parentElement; }
      } else { const id = element.closest<HTMLElement>('[data-structure-id]')?.dataset.structureId; component = components.find(item => item.cid === id); }
      event.preventDefault(); if (component) editor.UndoManager.skip(() => onSelect(component));
      previousFocus.current = document.activeElement as HTMLElement | null;
      const rect = frame?.getBoundingClientRect();
      setPoint({ x: inCanvas && rect ? rect.left + event.clientX * rect.width / frame.clientWidth : event.clientX, y: inCanvas && rect ? rect.top + event.clientY * rect.height / frame.clientHeight : event.clientY, component });
    };
    const clearClipboard = () => { clipboard.current = undefined; setPoint(undefined); };
    document.addEventListener('contextmenu', open); canvasDocument?.addEventListener('contextmenu', open);
    editor.on('project:load', clearClipboard);
    return () => { document.removeEventListener('contextmenu', open); canvasDocument?.removeEventListener('contextmenu', open); editor.off('project:load', clearClipboard); };
  }, [active, editor, onSelect]);
  useLayoutEffect(() => {
    if (!point || !menu.current) return;
    const rect = menu.current.getBoundingClientRect();
    menu.current.style.left = `${Math.max(8, Math.min(point.x, innerWidth - rect.width - 8))}px`;
    menu.current.style.top = `${Math.max(8, Math.min(point.y, innerHeight - rect.height - 8))}px`;
    menu.current.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  }, [point, adding]);
  useEffect(() => {
    setAdding(false);
  }, [point]);
  useEffect(() => {
    if (!point) return;
    const dismiss = (event: Event) => { if (event.type !== 'pointerdown' || !menu.current?.contains(event.target as Node)) setPoint(undefined); };
    const frameDocument = editor.Canvas.getDocument();
    document.addEventListener('pointerdown', dismiss); frameDocument?.addEventListener('pointerdown', dismiss);
    window.addEventListener('resize', dismiss);
    return () => { document.removeEventListener('pointerdown', dismiss); frameDocument?.removeEventListener('pointerdown', dismiss); window.removeEventListener('resize', dismiss); };
  }, [point, editor]);
  if (!point || !active) return null;
  const selected = point.component;
  const mutable = Boolean(selected?.parent() && selected !== editor.getWrapper());
  const target = selected === editor.getWrapper() || (selected && isContainer(selected)) ? selected : selected?.parent();
  const canPaste = Boolean(clipboard.current && target);
  const run = (action: () => void) => { close(); action(); };
  return <div ref={menu} className="editor-context-menu" role="menu" aria-label="편집 메뉴" style={{ left: point.x, top: point.y }} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []); const current = items.indexOf(document.activeElement as HTMLButtonElement); const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items[next]?.focus(); }
    if (event.key === 'Tab') close();
  }}><p>{selected === editor.getWrapper() ? '본문 (body)' : selected ? componentLabel(selected) : '편집 작업'}</p>
    <div className="context-group-label">요소 추가</div>
    <button role="menuitem" disabled={!selected} aria-expanded={adding} aria-controls="context-add-blocks" onClick={() => setAdding(value => !value)}>요소 추가 {adding ? '▴' : '▾'}</button>
    {/* 일반 요소는 소속 컨테이너에, 컨테이너는 내부에 기본 블록을 추가한다. */}
    {adding && <div id="context-add-blocks" role="group" aria-label="추가할 요소">{blockCatalog.map(block => <button key={block.id} role="menuitem" onClick={() => run(() => {
      if (!selected) return;
      editor.UndoManager.skip(() => editor.select(undefined));
      insertBlock(editor, block.id, selected);
      const added = editor.getSelected();
      if (added) editor.UndoManager.skip(() => { onSelect(added); if (block.id === 'image') onShortcut('image', added); });
      notify(`${block.label} 요소를 추가했습니다.`);
    })}>{block.label} 추가</button>)}</div>}
    <div className="context-group-label">이미지 연결</div>
    {(['image', 'image-url'] as const).map(kind => <button key={kind} role="menuitem" disabled={!selected} onClick={() => run(() => {
      if (!selected) return;
      let image = selected;
      if (selected.get('type') !== 'ew-image') { insertBlock(editor, 'image', selected); image = editor.getSelected()!; }
      editor.UndoManager.skip(() => { onSelect(image); onShortcut(kind, image); });
      notify(kind === 'image' ? '이미지를 선택했습니다. 파일 업로드로 연결하세요.' : '이미지를 선택했습니다. 주소 입력 후 적용하세요.');
    })}>{selected?.get('type') === 'ew-image' ? '이미지 변경' : '이미지 추가'} · {kind === 'image' ? '파일 연결' : '주소 연결'}</button>)}
    <hr /><div className="context-group-label">요소 편집</div>
    <button role="menuitem" disabled={!mutable} onClick={() => run(() => { if (selected) onShortcut('rename', selected); })}>이름 변경 <kbd>F2</kbd></button>
    <button role="menuitem" disabled={!mutable} onClick={() => run(() => { if (selected?.parent()) { const added = selected.parent()!.append(namedClone(selected), { at: selected.index() + 1 })[0]; editor.UndoManager.skip(() => onSelect(added)); notify('선택한 블록을 복제했습니다.'); } })}>복제</button>
    <button role="menuitem" disabled={!mutable} onClick={() => run(() => { if (selected) { editor.UndoManager.skip(() => { clipboard.current = selected.clone(); }); selected.remove(); editor.select(undefined); notify('블록을 잘라냈습니다. 대상 구역에서 우클릭해 붙여넣으세요.'); } })}>잘라내기</button>
    <button role="menuitem" disabled={!canPaste} onClick={() => run(() => { if (clipboard.current && target) { const added = target.append(clipboard.current.clone())[0]; editor.UndoManager.skip(() => onSelect(added)); notify('블록을 붙여넣었습니다.'); } })}>붙여넣기</button>
    <button role="menuitem" disabled={!mutable} onClick={() => run(() => { selected?.remove(); editor.select(undefined); notify('선택한 블록을 삭제했습니다.'); })}>삭제</button><hr />
    <div className="context-group-label">스타일</div>
    <button role="menuitem" disabled={!selected} onClick={() => run(() => { if (selected) onShortcut('properties', selected); })}>요소 속성</button>
    <button role="menuitem" disabled={!selected} onClick={() => run(() => { if (selected) onShortcut('size', selected); })}>크기 조절</button>
    <button role="menuitem" disabled={!selected} onClick={() => run(() => { if (selected) onShortcut('color', selected); })}>색상 조절</button>
    <hr /><div className="context-group-label">실행 기록</div>
    <button role="menuitem" disabled={!editor.UndoManager.hasUndo()} onClick={() => run(() => editor.UndoManager.undo())}>되돌리기</button>
    <button role="menuitem" disabled={!editor.UndoManager.hasRedo()} onClick={() => run(() => editor.UndoManager.redo())}>다시 실행</button>
  </div>;
}

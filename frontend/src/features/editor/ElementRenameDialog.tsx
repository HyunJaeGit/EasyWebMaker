import { useEffect, useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { layerItems } from './PropertiesPanel';

export function ElementRenameDialog({ editor, active, component, request, close }: { editor: Editor; active: boolean; component?: Component; request: (component: Component) => void; close: () => void }) {
  const [draft, setDraft] = useState(''); const [error, setError] = useState('');
  useEffect(() => { setDraft(String(component?.get('name') || '')); setError(''); }, [component]);
  useEffect(() => {
    if (!active) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'F2' || (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return;
      const selected = editor.getSelected();
      if (!selected?.parent() || selected === editor.getWrapper()) return;
      event.preventDefault(); event.stopPropagation(); request(selected);
    };
    const docs = new Set<Document>();
    const attach = () => { const doc = editor.Canvas.getDocument(); if (doc && !docs.has(doc)) { docs.add(doc); doc.addEventListener('keydown', keydown); } };
    document.addEventListener('keydown', keydown); attach(); editor.on('canvas:frame:load', attach);
    return () => { document.removeEventListener('keydown', keydown); docs.forEach(doc => doc.removeEventListener('keydown', keydown)); editor.off('canvas:frame:load', attach); };
  }, [editor, active, request]);
  if (!component) return null;
  const duplicate = layerItems(editor).some(item => item.component !== component && item.component.get('name') === draft.trim());
  return <div className="editor-modal-backdrop"><form className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-element-title" onSubmit={event => {
    event.preventDefault(); const name = draft.trim();
    if (!name || name.length > 80) { setError('요소 이름은 1~80자로 입력하세요.'); return; }
    if (!component.parent()) { close(); return; }
    if (name !== component.get('name')) component.set('name', name); close();
  }}><h2 id="rename-element-title">요소 이름 변경</h2><label>새 이름<input autoFocus aria-label="요소 이름" value={draft} maxLength={80} aria-invalid={Boolean(error)} aria-describedby="rename-element-feedback" onChange={event => { setDraft(event.target.value); setError(''); }} /></label><p id="rename-element-feedback" role={error ? 'alert' : undefined}>{error || (duplicate ? '같은 페이지에 같은 이름이 있습니다. 중복 이름도 사용할 수 있습니다.' : '한글·영문 사용 가능 · HTML ID는 유지됩니다.')}</p><div className="rename-dialog-actions"><button type="button" onClick={close}>취소</button><button type="submit" className="preview-button">이름 변경</button></div></form></div>;
}

// 구조 탐색의 펼침 상태와 hover 강조는 편집 모델·저장 데이터에서 분리한다.
import { useEffect, useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { componentLabel } from './PropertiesPanel';
export function StructureTree({ editor, selected, onSelect }: { editor: Editor; selected?: Component; onSelect: (component: Component) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  useEffect(() => {
    // 캔버스에서 선택한 자식도 트리에서 찾을 수 있도록 조상만 자동으로 펼친다.
    if (!selected) return;
    const parents: string[] = [`page-${editor.Pages.getSelected()?.getId()}`]; let parent = selected.parent();
    while (parent) { parents.push(parent.cid); parent = parent.parent(); }
    setCollapsed(previous => new Set([...previous].filter(id => !parents.includes(id))));
  }, [selected]);
  useEffect(() => () => { editor.getModel().setHovered(undefined); }, [editor]);
  const render = (component: Component, depth: number) => {
    const children = component.components().models.filter(child => child.get('type') !== 'textnode');
    const open = !collapsed.has(component.cid);
    const label = component === editor.getWrapper() ? '본문 (body)' : componentLabel(component);
    return <li key={component.cid}><div className="structure-row" data-structure-id={component.cid} onMouseEnter={() => editor.getModel().setHovered(component)} onMouseLeave={() => editor.getModel().setHovered(undefined)}>
      {children.length ? <button className="structure-toggle" type="button" aria-label={`${label} ${open ? '접기' : '펼치기'}`} aria-expanded={open} onClick={() => setCollapsed(previous => { const next = new Set(previous); if (open) next.add(component.cid); else next.delete(component.cid); return next; })}>{open ? '▾' : '▸'}</button> : <span className="structure-spacer" />}
      <button type="button" className={`structure-select ${selected === component ? 'layer-selected' : ''}`} aria-pressed={selected === component} onFocus={() => editor.getModel().setHovered(component)} onBlur={() => editor.getModel().setHovered(undefined)} onClick={() => { onSelect(component); editor.getModel().setHovered(undefined); }}>{label}<small>{component === editor.getWrapper() ? 'body' : component.get('tagName')}</small></button>
    </div>{children.length > 0 && open && <ul>{children.map(child => render(child, depth + 1))}</ul>}</li>;
  };
  const body = editor.getWrapper();
  const page = editor.Pages.getSelected();
  const pageKey = `page-${page?.getId()}`; const open = !collapsed.has(pageKey);
  return <div className="layer-tree structure-tree"><ul>{page && <li><div className="structure-row structure-page-root"><button className="structure-toggle" type="button" aria-label={`페이지 ${page.getName()}.html ${open ? '접기' : '펼치기'}`} aria-expanded={open} onClick={() => setCollapsed(previous => { const next = new Set(previous); if (open) next.add(pageKey); else next.delete(pageKey); return next; })}>{open ? '▾' : '▸'}</button><span className="structure-page-name">▤ {page.getName()}.html<small>페이지</small></span></div>{open && <ul>{body && render(body, 1)}</ul>}</li>}</ul></div>;
}

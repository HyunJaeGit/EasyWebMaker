// 네이티브 details로 키보드·터치 접기를 제공한다. 바로가기는 해당 카테고리를 펼친다.
import type { ReactNode } from 'react';
import { HelpTip } from './HelpTip';
export function PropertyCategory({ title, children, help, initialOpen = false }: { title: string; children: ReactNode; help?: string; initialOpen?: boolean }) {
  return <details className="property-category" open={initialOpen}><summary><span>{title}</span>{help && <HelpTip text={help} label={`${title} 도움말`} />}</summary><div className="property-category-content">{children}</div></details>;
}

export function focusProperty(label: string) {
  document.dispatchEvent(new CustomEvent('ew:property-focus', { detail: label }));
  const input = document.querySelector<HTMLElement>(`#properties-panel [aria-label="${label}"]`);
  let ancestor = input?.parentElement;
  while (ancestor) { if (ancestor instanceof HTMLDetailsElement) ancestor.open = true; ancestor = ancestor.parentElement; }
  input?.scrollIntoView({ block: 'nearest' }); input?.focus({ preventScroll: true });
}

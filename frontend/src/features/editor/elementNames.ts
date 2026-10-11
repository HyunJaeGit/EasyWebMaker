import type { Component, Editor } from 'grapesjs';

const suspended = new WeakSet<Editor>();
const counters = new WeakMap<Component, Map<string, number>>();
const seen = new WeakSet<Component>();
const defaults = new Set(['헤더·메뉴', '히어로', '메뉴', '카드 묶음', '카드', '새 구역', '푸터']);
const types: Record<string, string> = { 'ew-text': '텍스트', 'ew-image': '이미지', 'ew-link': '버튼·링크', 'ew-container': '구역' };
function walk(root: Component, visit: (component: Component) => void) { root.components().forEach((child: Component) => { if (types[String(child.get('type'))]) visit(child); walk(child, visit); }); }
function rootOf(component: Component) { let root = component; while (root.parent()) root = root.parent()!; return root; }
function nextName(component: Component, base: string) {
  const root = rootOf(component); const used = new Set<string>(); walk(root, item => used.add(String(item.get('name') || '')));
  let counts = counters.get(root); if (!counts) { counts = new Map(); counters.set(root, counts); }
  let number = counts.get(base) || 0;
  for (const name of used) if (name.startsWith(base + ' ') && /^\d+$/.test(name.slice(base.length + 1))) number = Math.max(number, Number(name.slice(base.length + 1)));
  do { number++; } while (used.has(`${base} ${number}`));
  counts.set(base, number); return `${base} ${number}`;
}
export function suspendElementNames(editor: Editor, value: boolean) { if (value) suspended.add(editor); else suspended.delete(editor); }
export function normalizeElementNames(editor: Editor) {
  editor.Pages.getAll().forEach(page => walk(page.getMainComponent(), component => { seen.add(component); if (!String(component.get('name') || '').trim()) component.set('name', nextName(component, types[String(component.get('type'))])); }));
}
export function installElementNames(editor: Editor) {
  normalizeElementNames(editor);
  editor.on('component:add', (component: Component) => {
    if (suspended.has(editor) || !component.parent() || !types[String(component.get('type'))]) return;
    if (seen.has(component)) return;
    seen.add(component);
    const name = String(component.get('name') || '');
    if (!name.trim() || defaults.has(name)) component.set('name', nextName(component, name || types[String(component.get('type'))]));
  });
}
export function namedClone(source: Component) {
  const clone = source.clone(); const used = new Set<string>(); walk(rootOf(source), item => used.add(String(item.get('name') || '')));
  const rename = (component: Component) => {
    const base = String(component.get('name') || types[String(component.get('type'))] || '요소').replace(/ 복사본(?: \d+)?$/, '').slice(0, 65);
    let name = `${base} 복사본`; let number = 2; while (used.has(name)) name = `${base} 복사본 ${number++}`;
    used.add(name); component.set('name', name);
  };
  rename(clone); walk(clone, rename); return clone;
}

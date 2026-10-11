// GrapesJS 생성·구조 조작·미리보기 변환을 UI와 분리한다.
import grapesjs, { type Component, type Editor, type ProjectData } from 'grapesjs';
import { commonStyles, createBlock, registerBlocks, sampleBlocks, type BlockKind } from '../blocks/definitions';
import { siteStyles } from '../blocks/siteStyles';
import type { SampleId } from '../../shared/samples';
import fontUrl from 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2?url';
import { bodyStyleCss, captureProject } from '../project/snapshot';
import { englishPageNames } from '../project/pageFiles';
import { installElementNames, normalizeElementNames, suspendElementNames } from './elementNames';
import { createVariant, type VariantId } from '../blocks/variants';

const fontStyles = `@font-face{font-family:'Pretendard Variable';src:url('${fontUrl}');font-weight:45 920;font-display:swap}`;
export function createEditor(host: HTMLElement, data: ProjectData | undefined, sample: SampleId | undefined): Editor {
  const editor = grapesjs.init({ container: host, height: '100%', width: 'auto', storageManager: false, telemetry: false, noticeOnUnload: false, panels: { defaults: [] }, blockManager: { custom: true }, layerManager: { custom: true }, traitManager: { custom: true }, styleManager: { custom: true }, assetManager: { upload: false }, selectorManager: { componentFirst: true }, deviceManager: { devices: [{ id: 'desktop', name: 'PC', width: '' }, { id: 'tablet', name: '태블릿', width: '768px', widthMedia: '' }, { id: 'mobile', name: '모바일', width: '375px', widthMedia: '' }] }, plugins: [registerBlocks], canvas: { scrollableCanvas: true, allowExternalDrop: false }, canvasCss: `${siteStyles}${fontStyles}*{scrollbar-width:thin;scrollbar-color:#a4b69a #eef2eb}`, parser: { optionsHtml: { allowScripts: false, allowUnsafeAttr: false, allowUnsafeAttrValue: false } } });
  // 새 페이지의 iframe에도 편집 중 링크 이동 방지를 적용한다.
  const documents = new WeakSet<Document>();
  const protectLinks = () => {
    const document = editor.Canvas.getDocument();
    if (!document || documents.has(document)) return;
    documents.add(document);
    document.addEventListener('click', event => { if ((event.target as HTMLElement).closest('a')) event.preventDefault(); });
  };
  editor.on('canvas:frame:load', protectLinks);
  // 드래그 모드는 편집 전용 상태이며 복원·실행 취소 후 실제 CSS에서 다시 결정한다.
  const syncDrag = (component?: Component) => {
    if (!component || !String(component.get('type')).startsWith('ew-')) return;
    component.setDragMode(component.getStyle().position === 'absolute' ? 'absolute' : '');
  };
  editor.on('component:selected component:styleUpdate', syncDrag);
  editor.onReady(() => {
    if (data) editor.loadProjectData(data);
    else resetProject(editor, sample);
    normalizePageNames(editor);
    installElementNames(editor);
    configureBody(editor);
    editor.UndoManager.clear();
    // 링크 탭은 편집 중 선택만 수행한다. 실제 링크는 미리보기에서 확인한다.
    protectLinks();
  });
  return editor;
}
export function resetProject(editor: Editor, sample?: SampleId) {
  suspendElementNames(editor, true);
  const first = editor.Pages.getAll()[0];
  editor.Pages.select(first);
  editor.Pages.getAll().slice(1).forEach(page => editor.Pages.remove(page));
  first.setName('home');
  editor.getWrapper()?.setStyle({});
  editor.setComponents(sampleBlocks(sample));
  editor.setStyle(siteStyles + (sample === 'public' ? '.ew-hero{background:#e4edf6}.ew-hero>a{background:#284f79}' : ''));
  editor.select(undefined);
  normalizeElementNames(editor); suspendElementNames(editor, false);
  editor.UndoManager.clear();
}
export function isContainer(component: Component) { return component.get('type') === 'ew-container'; }
export function normalizePageNames(editor: Editor) {
  const pages = editor.Pages.getAll(); const names = englishPageNames(pages.map(page => page.getName()));
  pages.forEach((page, index) => { if (page.getName() !== names[index]) page.setName(names[index]); });
}
// 각 페이지의 body도 모든 기본 블록의 직접 삽입 대상으로 사용한다.
export function configureBody(editor: Editor) {
  editor.getWrapper()?.set({ droppable: true, selectable: true, hoverable: true, stylable: commonStyles, removable: false, copyable: false, draggable: false });
}
export function insertBlock(editor: Editor, kind: BlockKind, selected?: Component, variant: VariantId = 'basic') {
  const wrapper = editor.getWrapper();
  if (!wrapper) return;
  if (selected === wrapper) { const added = wrapper.append(createVariant(kind, variant))[0]; editor.select(added); return; }
  if (kind === 'section') {
    const target = selected && isContainer(selected) ? selected : wrapper;
    const added = target.append(createBlock(kind))[0]; editor.select(added); return;
  }
  let target = selected;
  while (target && !isContainer(target)) target = target.parent();
  if (!target || target === wrapper) target = wrapper.components().models.find((component: Component) => isContainer(component));
  if (!target) target = wrapper.append(createBlock('section'))[0];
  const added = target.append(createVariant(kind, variant))[0];
  editor.select(added);
}
export function moveSibling(component: Component, direction: -1 | 1) {
  const parent = component.parent(); if (!parent) return;
  const index = component.index() + direction;
  if (index >= 0 && index < parent.components().length) component.move(parent, { at: index });
}
export function canMoveTo(component: Component, target: Component, editor: Editor) {
  if (target === component || component.contains(target)) return false;
  return target === editor.getWrapper() || isContainer(target);
}
export function previewDocument(editor: Editor, guides = false): string {
  const snapshot = captureProject(editor);
  // iframe은 sandbox로 스크립트를 차단한다. 프로젝트 HTML에 편집 UI는 포함하지 않는다.
  // outline은 공간을 차지하지 않아 경계를 켜도 실제 요소 크기·배치가 변하지 않는다.
  const guideCss = guides ? '[data-ew-container]{outline:2px dashed #30846b!important;outline-offset:-2px}[data-ew-container] [data-ew-container]{outline:1px dashed #397ab5!important;outline-offset:-3px}' : '';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${fontStyles}${editor.getCss()}${bodyStyleCss(snapshot.bodyStyle, snapshot.bodyBackground)}</style><style data-preview-guides>${guideCss}</style></head><body>${editor.getHtml({ cleanId: false })}</body></html>`;
}
export function safeLink(value: string) { return /^(https?:\/\/|mailto:|tel:|#[\w가-힣-]*$)/i.test(value) && !/[<>"\s]/.test(value); }

// 현재 보이는 위치를 유지한 채 부모 기준 자유 이동으로 전환한다.
export function toggleFreeMove(component: Component) {
  const element = component.getEl(); const parent = component.parent(); const parentElement = parent?.getEl();
  if (!element || !parent || !parentElement) return;
  const style = { ...component.getStyle() };
  if (style.position === 'absolute') {
    const previous = component.get('_ewFlowStyle') as Record<string, string> | undefined;
    for (const key of ['position', 'top', 'right', 'bottom', 'left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']) delete style[key];
    component.setStyle({ ...style, ...(previous || {}) }); component.setDragMode(''); return;
  }
  const rect = element.getBoundingClientRect(); const parentRect = parentElement.getBoundingClientRect();
  const zoom = element.ownerDocument.defaultView?.getComputedStyle(element).zoom;
  const scale = Number.parseFloat(zoom || '1') || 1;
  component.set('_ewFlowStyle', Object.fromEntries(Object.entries(style).filter(([key]) => /^(position|top|right|bottom|left|margin(?:-.+)?)$/.test(key))), { silent: true });
  if (parentElement.ownerDocument.defaultView?.getComputedStyle(parentElement).position === 'static') parent.addStyle({ position: 'relative' });
  // 컨테이너의 높이가 콘텐츠 제거로 접히지 않도록 현재 높이를 최소 높이로 유지한다.
  if (!parent.getStyle()['min-height']) parent.addStyle({ 'min-height': `${Math.ceil(parentRect.height / scale)}px` });
  for (const key of ['right', 'bottom', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']) delete style[key];
  component.setStyle({ ...style, position: 'absolute', left: `${Math.round((rect.left - parentRect.left) / scale - parentElement.clientLeft + parentElement.scrollLeft)}px`, top: `${Math.round((rect.top - parentRect.top) / scale - parentElement.clientTop + parentElement.scrollTop)}px`, width: `${Math.round(rect.width / scale)}px`, height: `${Math.round(rect.height / scale)}px`, margin: '0' });
  component.setDragMode('absolute');
}

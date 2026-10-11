// GrapesJS 생성·구조 조작·미리보기 변환을 UI와 분리한다.
import grapesjs, { type Component, type Editor, type ProjectData } from 'grapesjs';
import { commonStyles, createBlock, registerBlocks, sampleBlocks, type BlockKind } from '../blocks/definitions';
import { siteStyles } from '../blocks/siteStyles';
import type { SampleId } from '../../shared/samples';
import fontUrl from 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2?url';
import { bodyStyleCss, captureProject } from '../project/snapshot';

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
  editor.onReady(() => {
    if (data) editor.loadProjectData(data);
    else resetProject(editor, sample);
    configureBody(editor);
    editor.UndoManager.clear();
    // 링크 탭은 편집 중 선택만 수행한다. 실제 링크는 미리보기에서 확인한다.
    protectLinks();
  });
  return editor;
}
export function resetProject(editor: Editor, sample?: SampleId) {
  const first = editor.Pages.getAll()[0];
  editor.Pages.select(first);
  editor.Pages.getAll().slice(1).forEach(page => editor.Pages.remove(page));
  first.setName('홈');
  editor.getWrapper()?.setStyle({});
  editor.setComponents(sampleBlocks(sample));
  editor.setStyle(siteStyles + (sample === 'public' ? '.ew-hero{background:#e4edf6}.ew-hero>a{background:#284f79}' : ''));
  editor.select(undefined);
  editor.UndoManager.clear();
}
export function isContainer(component: Component) { return component.get('type') === 'ew-container'; }
// 각 페이지의 body도 모든 기본 블록의 직접 삽입 대상으로 사용한다.
export function configureBody(editor: Editor) {
  editor.getWrapper()?.set({ droppable: true, selectable: true, hoverable: true, stylable: commonStyles, removable: false, copyable: false, draggable: false });
}
export function insertBlock(editor: Editor, kind: BlockKind, selected?: Component) {
  const wrapper = editor.getWrapper();
  if (!wrapper) return;
  if (selected === wrapper) { const added = wrapper.append(createBlock(kind))[0]; editor.select(added); return; }
  if (kind === 'section') {
    const target = selected && isContainer(selected) ? selected : wrapper;
    const added = target.append(createBlock(kind))[0]; editor.select(added); return;
  }
  let target = selected;
  while (target && !isContainer(target)) target = target.parent();
  if (!target || target === wrapper) target = wrapper.components().models.find((component: Component) => isContainer(component));
  if (!target) target = wrapper.append(createBlock('section'))[0];
  const added = target.append(createBlock(kind))[0];
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

// GrapesJS 생성·구조 조작·미리보기 변환을 UI와 분리한다.
import grapesjs, { type Component, type Editor, type ProjectData } from 'grapesjs';
import { createBlock, registerBlocks, sampleBlocks, type BlockKind } from '../blocks/definitions';
import { siteStyles } from '../blocks/siteStyles';
import type { SampleId } from '../../shared/samples';
import fontUrl from 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2?url';

const fontStyles = `@font-face{font-family:'Pretendard Variable';src:url('${fontUrl}');font-weight:45 920;font-display:swap}`;
export function createEditor(host: HTMLElement, data: ProjectData | undefined, sample: SampleId | undefined): Editor {
  const editor = grapesjs.init({ container: host, height: '680px', width: 'auto', storageManager: false, telemetry: false, noticeOnUnload: false, panels: { defaults: [] }, blockManager: { custom: true }, layerManager: { custom: true }, traitManager: { custom: true }, styleManager: { custom: true }, assetManager: { upload: false }, selectorManager: { componentFirst: true }, deviceManager: { devices: [{ id: 'desktop', name: 'PC', width: '' }, { id: 'tablet', name: '태블릿', width: '768px', widthMedia: '' }, { id: 'mobile', name: '모바일', width: '375px', widthMedia: '' }] }, plugins: [registerBlocks], canvas: { scrollableCanvas: true, allowExternalDrop: false }, canvasCss: `${siteStyles}${fontStyles}`, parser: { optionsHtml: { allowScripts: false, allowUnsafeAttr: false, allowUnsafeAttrValue: false } } });
  editor.onReady(() => {
    if (data) editor.loadProjectData(data);
    else resetProject(editor, sample);
    const wrapper = editor.getWrapper();
    wrapper?.set({ droppable: '[data-ew-container]', stylable: false, removable: false });
    editor.UndoManager.clear();
    // 링크 탭은 편집 중 선택만 수행한다. 실제 링크는 미리보기에서 확인한다.
    editor.Canvas.getDocument()?.addEventListener('click', event => {
      if ((event.target as HTMLElement).closest('a')) event.preventDefault();
    });
  });
  return editor;
}
export function resetProject(editor: Editor, sample?: SampleId) {
  editor.setComponents(sampleBlocks(sample));
  editor.setStyle(siteStyles + (sample === 'public' ? '.ew-hero{background:#e4edf6}.ew-hero>a{background:#284f79}' : ''));
  editor.select(undefined);
  editor.UndoManager.clear();
}
export function isContainer(component: Component) { return component.get('type') === 'ew-container'; }
export function insertBlock(editor: Editor, kind: BlockKind, selected?: Component) {
  const wrapper = editor.getWrapper();
  if (!wrapper) return;
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
  return target === editor.getWrapper() ? isContainer(component) : isContainer(target);
}
export function previewDocument(editor: Editor): string {
  // iframe은 sandbox로 스크립트를 차단한다. 프로젝트 HTML에 편집 UI는 포함하지 않는다.
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${fontStyles}${editor.getCss()}</style></head><body>${editor.getHtml({ cleanId: false })}</body></html>`;
}
export function safeLink(value: string) { return /^(https?:\/\/|mailto:|tel:|#[\w가-힣-]*$)/i.test(value) && !/[<>"\s]/.test(value); }

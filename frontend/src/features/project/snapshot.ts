// 현재 엔진 모델에서 구조·내용·스타일을 읽는다. 출력은 같은 시점의 HTML·CSS를 사용한다.
import type { Component, Editor } from 'grapesjs';
import type { ProjectSnapshot, SavedBlock } from './format';
import { commonStyles } from '../blocks/definitions';

export function captureProject(editor: Editor, root: Component = editor.getWrapper()!, single = false): ProjectSnapshot {
  const capture = (component: Component): SavedBlock => {
    const type = component.get('type');
    if (type !== 'ew-container' && type !== 'ew-text' && type !== 'ew-link' && type !== 'ew-image') throw new Error('지원하지 않는 블록이 있어 저장할 수 없습니다.');
    const attributes: Record<string, string> = {};
    for (const key of ['href', 'alt', 'title']) { const value = component.getAttributes()[key]; if (typeof value === 'string') attributes[key] = value; }
    // CSS 파서가 여백·테두리를 세부 속성으로 풀어도 같은 의미의 표준 축약값으로 저장한다.
    const declaration = document.createElement('div').style;
    for (const [key, value] of Object.entries(component.getStyle())) if (typeof value === 'string') declaration.setProperty(key, value);
    const style = Object.fromEntries([...commonStyles, 'grid-template-columns'].map(key => [key, declaration.getPropertyValue(key)]).filter(([, value]) => value));
    const content = type === 'ew-text' || type === 'ew-link' ? new DOMParser().parseFromString(component.toHTML(), 'text/html').body.textContent || '' : '';
    return { type, id: component.getId(), name: String(component.get('name') || ''), tagName: component.get('tagName') || 'div', classes: component.getClasses(), attributes, style, content,
      ...(backgroundSource(component) ? { background: backgroundSource(component) } : {}),
      children: type === 'ew-container' ? component.components().models.filter((child: Component) => child.get('type') !== 'textnode').map(capture) : [],
      ...(type === 'ew-image' ? { asset: String(component.get('src') || component.getAttributes().src || '') } : {}),
    };
  };
  const declaration = document.createElement('div').style;
  for (const [key, value] of Object.entries(root.getStyle() || {})) if (typeof value === 'string') declaration.setProperty(key, value);
  const bodyStyle = Object.fromEntries(commonStyles.map(key => [key, declaration.getPropertyValue(key)]).filter(([, value]) => value));
  const rawCss = editor.getCss({ component: root, avoidProtected: true }) || '';
  // CSS 안의 URL을 저장하지 않고 배경을 검증 자산 참조로 분리한다.
  let css = rawCss;
  if (/background-image\s*:/i.test(rawCss)) {
    const sheet = new CSSStyleSheet(); sheet.replaceSync(rawCss);
    const strip = (rules: CSSRuleList) => { for (const rule of Array.from(rules)) { if (rule instanceof CSSStyleRule) rule.style.removeProperty('background-image'); else if (rule instanceof CSSMediaRule) strip(rule.cssRules); } };
    strip(sheet.cssRules); css = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
  }
  const snapshot: ProjectSnapshot = { blocks: root.components().models.map(capture), bodyStyle, css, html: editor.getHtml({ component: root }), ...(backgroundSource(root) ? { bodyBackground: backgroundSource(root) } : {}) };
  if (!single) {
    snapshot.pages = editor.Pages.getAll().map(page => ({ ...captureProject(editor, page.getMainComponent(), true), id: page.getId(), name: page.getName() || '홈' }));
    snapshot.activePageId = editor.Pages.getSelected()?.getId();
  }
  return snapshot;
}

function backgroundSource(component?: Component) {
  const value = String(component?.getStyle()['background-image'] || '');
  const match = value.match(/^url\((.*)\)$/s); if (!match) return undefined;
  const source = match[1].trim(); return source.startsWith('"') ? JSON.parse(source) as string : source.replace(/^'|'$/g, '');
}
export function backgroundCss(blocks: SavedBlock[]): string {
  return blocks.map(block => (block.background ? `#${CSS.escape(block.id)}{background-image:url(${JSON.stringify(block.background)})}` : '') + backgroundCss(block.children)).join('\n');
}

// 독립 출력과 미리보기는 엔진 wrapper ID 대신 실제 body 선택자를 사용한다.
export function bodyStyleCss(style?: Record<string, string>, background?: string) {
  const declaration = document.createElement('div').style;
  for (const [key, value] of Object.entries(style || {})) declaration.setProperty(key, value);
  if (background) declaration.setProperty('background-image', `url(${JSON.stringify(background)})`);
  return declaration.cssText ? `\nbody{${declaration.cssText}}` : '';
}

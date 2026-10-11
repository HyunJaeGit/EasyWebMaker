// 현재 엔진 모델에서 구조·내용·스타일을 읽는다. 출력은 같은 시점의 HTML·CSS를 사용한다.
import type { Component, Editor } from 'grapesjs';
import type { ProjectSnapshot, SavedBlock } from './format';
import { commonStyles } from '../blocks/definitions';

export function captureProject(editor: Editor): ProjectSnapshot {
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
      children: type === 'ew-container' ? component.components().models.filter((child: Component) => child.get('type') !== 'textnode').map(capture) : [],
      ...(type === 'ew-image' ? { asset: String(component.get('src') || component.getAttributes().src || '') } : {}),
    };
  };
  return { blocks: editor.getComponents().models.map(capture), css: editor.getCss({ avoidProtected: true }) || '', html: editor.getHtml() };
}

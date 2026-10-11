// 블록 구조·허용 위치·기본 콘텐츠를 정의한다. body 또는 구역 안에서 조립한다.
import type { ComponentDefinitionDefined, Editor } from 'grapesjs';
import type { SampleId } from '../../shared/samples';

export const blockCatalog = [
  { id: 'header', label: '헤더·메뉴', icon: '☰' }, { id: 'hero', label: '히어로', icon: '▣' },
  { id: 'text', label: '텍스트', icon: 'T' }, { id: 'image', label: '이미지', icon: '▧' },
  { id: 'cards', label: '카드 묶음', icon: '▦' }, { id: 'link', label: '버튼·링크', icon: '↗' },
  { id: 'section', label: '구역·컨테이너', icon: '□' }, { id: 'footer', label: '푸터', icon: '▤' },
] as const;
export type BlockKind = typeof blockCatalog[number]['id'];
export const commonStyles = ['color', 'background-color', 'font-size', 'text-align', 'padding', 'margin', 'border', 'border-radius', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'background-size', 'background-position', 'background-repeat', 'gap', 'opacity', 'font-family', 'font-weight', 'display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'grid-template-columns', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
const leaf = (tagName: string, content: string): ComponentDefinitionDefined => ({ type: 'ew-text', tagName, content });
const link = (content: string, href = '#introduction'): ComponentDefinitionDefined => ({ type: 'ew-link', content, attributes: { href } });

// 내장 text/link 모델을 유지하고 마우스 크기 조절을 제공한다. 자유 이동은 속성에서 명시적으로 켠다.
export function registerBlocks(editor: Editor) {
  editor.Components.addType('ew-text', { extend: 'text', model: { defaults: { droppable: false, editable: false, draggable: '[data-ew-container], body, [data-gjs-type="wrapper"]', stylable: commonStyles, toolbar: [], resizable: { minDim: 10, currentUnit: false, unitWidth: "px", unitHeight: "px", ratioDefault: false } } } });
  editor.Components.addType('ew-link', { extend: 'link', model: { defaults: { droppable: false, editable: false, draggable: '[data-ew-container], body, [data-gjs-type="wrapper"]', stylable: commonStyles, toolbar: [], resizable: { minDim: 10, currentUnit: false, unitWidth: "px", unitHeight: "px", ratioDefault: false } } } });
  editor.Components.addType('ew-image', { extend: 'image', model: { defaults: { droppable: false, draggable: '[data-ew-container], body, [data-gjs-type="wrapper"]', stylable: commonStyles, toolbar: [], resizable: { minDim: 10, currentUnit: false, unitWidth: "px", unitHeight: "px", ratioDefault: false } } } });
  editor.Components.addType('ew-container', { model: { defaults: { tagName: 'section', attributes: { 'data-ew-container': 'true' }, droppable: true, draggable: '[data-ew-container], body, [data-gjs-type="wrapper"]', stylable: commonStyles, toolbar: [], resizable: { minDim: 10, currentUnit: false, unitWidth: "px", unitHeight: "px", ratioDefault: false } } } });
  for (const item of blockCatalog) editor.Blocks.add(item.id, { label: item.label, content: createBlock(item.id) });
}

export function container(name: string, components: ComponentDefinitionDefined[], tagName = 'section', classes: string[] = [], id?: string): ComponentDefinitionDefined {
  return { type: 'ew-container', name, tagName, classes, attributes: { 'data-ew-container': 'true', ...(id ? { id } : {}) }, components };
}

export function createBlock(kind: BlockKind): ComponentDefinitionDefined {
  switch (kind) {
    case 'header': return container('헤더·메뉴', [leaf('h2', '우리의 웹사이트'), container('메뉴', [link('소개'), link('소식', '#news'), link('오시는 길', '#contact')], 'nav', ['ew-menu'])], 'header', ['ew-header']);
    case 'hero': return container('히어로', [leaf('p', '나의 이야기가 시작되는 곳'), leaf('h1', '작은 시작, 새로운 가능성'), leaf('p', '우리만의 이야기를 이곳에 담아보세요.'), link('더 알아보기')], 'section', ['ew-hero']);
    case 'text': return leaf('p', '이곳에 나만의 이야기를 입력하세요.');
    case 'image': return { type: 'ew-image', src: new URL('../../assets/sample-landscape.svg', import.meta.url).href, attributes: { alt: '직접 제작한 언덕과 햇살 일러스트' } };
    case 'cards': return container('카드 묶음', [createCard(), createCard(), createCard()], 'div', ['ew-cards']);
    case 'link': return link('자세히 보기');
    case 'section': return container('새 구역', [], 'section', ['ew-section']);
    case 'footer': return container('푸터', [leaf('p', '우리의 웹사이트'), leaf('p', '주소와 연락처를 입력하세요.'), leaf('small', '© 나의 웹사이트. 모든 권리 보유.')], 'footer', ['ew-footer']);
  }
}

export function createCard(): ComponentDefinitionDefined {
  return container('카드', [leaf('h3', '새로운 소식'), leaf('p', '소식을 간결하게 소개해 주세요.')], 'article', ['ew-card']);
}

export function sampleBlocks(kind?: SampleId): ComponentDefinitionDefined[] {
  if (!kind) return [container('첫 번째 구역', [], 'section', ['ew-section'], 'introduction')];
  const school = kind === 'school';
  const institution = school ? '새봄학교' : '온빛생활문화원';
  const header = container('헤더·메뉴', [leaf('h2', institution), container('메뉴', [link(school ? '학교 소개' : '문화원 소개'), link('소식', '#news'), link('오시는 길', '#contact')], 'nav', ['ew-menu'])], 'header', ['ew-header']);
  const hero = container('히어로', [leaf('p', school ? '함께 배우고, 함께 자라는 곳' : '문화로 연결되는 우리의 일상'), leaf('h1', school ? '오늘의 배움이, 내일의 가능성으로.' : '당신의 일상에 문화를 더합니다.'), leaf('p', school ? '서로의 꿈을 응원하는 새봄학교입니다.' : '함께 누리는 문화, 함께 만드는 온빛.'), createBlock('image'), link(school ? '학교 이야기' : '문화원 이야기')], 'section', ['ew-hero']);
  const intro = container('소개', [leaf('h2', school ? '함께 자라는 배움' : '모두에게 열린 문화 공간'), leaf('p', school ? '다양한 경험과 배움을 나누는 가상 학교입니다.' : '일상 가까이에서 문화를 나누는 가상 기관입니다.')], 'section', ['ew-section'], 'introduction');
  const news = container('소식', [leaf('h2', school ? '새봄 소식' : '문화원 소식'), container('카드 묶음', [container('카드', [leaf('h3', school ? '함께 읽는 학교 이야기' : '생활문화 공간 안내'), leaf('p', '디자인을 위한 예시 콘텐츠입니다.')], 'article', ['ew-card']), createCard(), createCard()], 'div', ['ew-cards'])], 'section', ['ew-section'], 'news');
  const footer = container('기관 정보·연락처', [leaf('h2', institution), leaf('p', '가상 주소: 온빛시 새봄로 10 · 예시 연락처: 000-000-0000'), leaf('small', '가상 기관의 디자인 예시입니다. 실제 기관과 관련이 없습니다.')], 'footer', ['ew-footer'], 'contact');
  return [header, hero, intro, news, footer];
}

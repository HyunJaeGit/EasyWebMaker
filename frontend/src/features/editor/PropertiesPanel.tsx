// 선택한 모델의 허용된 내용·링크·이미지·스타일만 편집하는 터치 친화 패널.
import { useEffect, useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { createCard } from '../blocks/definitions';
import { canMoveTo, isContainer, moveSibling, safeLink } from './engine';
import { SizeField } from './SizeField';
import { BackgroundPanel } from './BackgroundPanel';
import { LayoutPanel } from './LayoutPanel';

export interface LayerItem { component: Component; depth: number }
export function layerItems(editor: Editor): LayerItem[] {
  const result: LayerItem[] = [];
  const walk = (component: Component, depth: number) => {
    if (component.get('type') !== 'textnode') result.push({ component, depth });
    component.components().forEach((child: Component) => walk(child, depth + 1));
  };
  editor.getComponents().forEach((component: Component) => walk(component, 0));
  return result;
}
export function componentLabel(component: Component) {
  const names: Record<string, string> = { 'ew-text': '텍스트', 'ew-image': '이미지', 'ew-link': '버튼·링크', 'ew-container': '구역' };
  if (component.get('type') === 'wrapper') return '본문 (body)';
  return component.get('name') || names[component.get('type') || ''] || component.get('tagName');
}
function textOf(component: Component): string {
  const html = component.toHTML();
  return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
}
function colorInput(value: unknown, fallback: string) {
  const text = String(value || ''); if (/^#[\da-f]{6}$/i.test(text)) return text;
  const rgb = text.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  return rgb ? '#' + rgb.slice(1).map(part => Number(part).toString(16).padStart(2, '0')).join('') : fallback;
}
function borderInput(value: unknown) {
  const declaration = document.createElement('div').style;
  declaration.border = String(value || ''); const normalized = declaration.border;
  for (const option of ['', 'none', '1px solid #cbd5c7', '2px solid #285e49', '1px dashed #899783']) { declaration.border = option; if (declaration.border === normalized) return option; }
  return '';
}

export function PropertiesPanel({ editor, selected, notify }: { editor: Editor; selected: Component; notify: (message: string) => void }) {
  const [url, setUrl] = useState(String(selected.getAttributes().href || selected.getAttributes().src || selected.get('src') || ''));
  const [targetId, setTargetId] = useState('');
  const type = selected.get('type');
  const appliedUrl = String(selected.getAttributes().href || selected.getAttributes().src || selected.get('src') || '');
  useEffect(() => { setUrl(appliedUrl.startsWith('data:') ? '' : appliedUrl); }, [appliedUrl]);
  const urlLabel = type === 'ew-link' ? '링크 주소' : '이미지 주소';
  const style = { ...selected.getStyle() };
  // 복원 시 CSS 파서가 여백·테두리를 세부 속성으로 풀어도 제어에는 축약값을 표시한다.
  const declaration = document.createElement('div').style;
  for (const [key, value] of Object.entries(style)) if (typeof value === 'string') declaration.setProperty(key, value);
  for (const property of ['padding', 'margin', 'border', 'border-radius']) if (!style[property]) style[property] = declaration.getPropertyValue(property);
  for (const group of ['padding', 'margin']) for (const side of ['top', 'right', 'bottom', 'left']) style[`${group}-${side}`] = declaration.getPropertyValue(`${group}-${side}`);
  const parent = selected.parent();
  const containers = layerItems(editor).filter(item => isContainer(item.component) && canMoveTo(selected, item.component, editor));
  const setStyle = (property: string, value: string) => {
    // 복원된 CSS의 개별 방향 속성이 새 축약 값을 덮어쓰지 않도록 함께 교체한다.
    const next = { ...selected.getStyle() };
    // 방향별 변경은 기존 축약값을 펼쳐 다른 방향의 설정을 보존한다.
    const group = /^(padding|margin)-(top|right|bottom|left)$/.exec(property)?.[1];
    if (group) {
      delete next[group];
      for (const side of ['top', 'right', 'bottom', 'left']) next[`${group}-${side}`] = declaration.getPropertyValue(`${group}-${side}`);
    }
    for (const key of Object.keys(next)) {
      const related = property === 'border-radius' ? /^border-.*-radius$/.test(key)
        : property === 'border' ? key.startsWith('border-') && !key.endsWith('radius')
        : ['padding', 'margin'].includes(property) && key.startsWith(`${property}-`);
      if (related) delete next[key];
    }
    next[property] = value;
    selected.setStyle(next);
  };
  const setText = (value: string) => selected.components([{ type: 'textnode', content: value }]);

  // 로컬 이미지 데이터를 모델에 포함해 페이지 이동과 실행 취소에도 유지한다.
  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) { notify('PNG·JPG·WebP·GIF 이미지, 최대 5 MB를 선택해 주세요.'); return; }
    try {
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      selected.set('src', data); setUrl(''); notify('이미지를 반영했습니다.');
    } catch { notify('이미지를 읽지 못했습니다. 다시 선택해 주세요.'); }
  };

  return <>
    <div className="inspector-title"><span>선택한 블록</span><h3>{selected === editor.getWrapper() ? '본문 (body)' : componentLabel(selected)}</h3></div>
    {selected !== editor.getWrapper() && <div className="component-actions"><button type="button" aria-label="블록 위로 이동" disabled={!parent || selected.index() === 0} onClick={() => moveSibling(selected, -1)}>↑ 위로</button><button type="button" aria-label="블록 아래로 이동" disabled={!parent || selected.index() === parent.components().length - 1} onClick={() => moveSibling(selected, 1)}>↓ 아래로</button><button type="button" onClick={() => { if (parent) { const clone = selected.clone(); parent.append(clone, { at: selected.index() + 1 }); editor.select(clone); notify('블록을 복제했습니다.'); } }}>복제</button><button type="button" className="danger" onClick={() => { selected.remove(); editor.select(undefined); notify('블록을 삭제했습니다.'); }}>삭제</button></div>}
    {(type === 'ew-text' || type === 'ew-link') && <label className="editor-field">내용<textarea aria-label="내용" rows={4} value={textOf(selected)} onChange={event => setText(event.target.value)} /></label>}
    {type === 'ew-link' && <><label className="editor-field">링크 주소<input aria-label={urlLabel} value={url} onChange={event => setUrl(event.target.value)} placeholder="https:// 또는 #구역ID" /></label><button className="panel-button" type="button" onClick={() => { if (!safeLink(url)) { notify('https://, http://, mailto:, tel: 또는 #구역ID 주소를 입력해 주세요.'); return; } selected.addAttributes({ href: url }); notify('링크를 반영했습니다.'); }}>링크 적용</button><label className="editor-field">링크 모양<select aria-label="링크 모양" value={selected.getClasses().includes('ew-button') ? 'button' : 'link'} onChange={event => event.target.value === 'button' ? selected.addClass('ew-button') : selected.removeClass('ew-button')}><option value="link">일반 링크</option><option value="button">버튼</option></select></label></>}
    {type === 'ew-image' && <><label className="editor-field">이미지 업로드<input aria-label="이미지 업로드" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => { void uploadImage(event.target.files?.[0]); event.target.value = ''; }} /></label><small className="editor-help">최대 5 MB · 기기에 있는 이미지</small><label className="editor-field">이미지 주소<input aria-label={urlLabel} value={url} onChange={event => setUrl(event.target.value)} placeholder="https:// 이미지 주소" /></label><button type="button" className="panel-button" onClick={() => { if (!/^https?:\/\/[^\s<>]+$/i.test(url)) { notify('http 또는 https 이미지 주소를 입력해 주세요.'); return; } selected.set('src', url); notify('이미지 주소를 반영했습니다.'); }}>이미지 주소 적용</button><label className="editor-field">대체 텍스트<input aria-label="대체 텍스트" value={String(selected.getAttributes().alt || '')} onChange={event => selected.addAttributes({ alt: event.target.value })} /></label></>}
    {isContainer(selected) && <label className="editor-field">구역 ID<input aria-label="구역 ID" value={String(selected.getAttributes().id || '')} onChange={event => { const value = event.target.value.replace(/[^\w가-힣-]/g, ''); const duplicate = layerItems(editor).some(item => item.component !== selected && item.component.getAttributes().id === value); if (value && duplicate) { notify('이미 사용 중인 구역 ID입니다.'); return; } selected.addAttributes({ id: value }); }} /><small>#구역ID 링크로 연결할 수 있습니다.</small></label>}
    {selected.getClasses().includes('ew-cards') && <><button type="button" className="panel-button" onClick={() => { const added = selected.append(createCard())[0]; editor.select(added); }}>카드 추가</button><label className="editor-field">카드 열 수<select aria-label="카드 열 수" value={String(style['grid-template-columns'] || 'repeat(3,minmax(0,1fr))')} onChange={event => setStyle('grid-template-columns', event.target.value)}>{[1, 2, 3].map(count => <option key={count} value={`repeat(${count},minmax(0,1fr))`}>{count}열</option>)}</select></label></>}
    {(isContainer(selected) || selected === editor.getWrapper()) && <BackgroundPanel key={selected.cid} selected={selected} notify={notify} />}<h3 className="panel-subtitle">요소 크기</h3><p className="editor-help">현재 크기: {Math.round(selected.getEl()?.getBoundingClientRect().width || 0)} × {Math.round(selected.getEl()?.getBoundingClientRect().height || 0)} px. 캔버스 기준입니다.</p><p className="editor-help">값을 입력한 뒤 Enter 또는 다른 입력을 눌러 적용하세요. 비우면 기본 크기로 돌아갑니다. 너비는 %로, 내용에 따라 늘어날 구역은 최소 높이로 조절할 수 있습니다.</p><div className="style-fields">{[['width', '너비'], ['height', '높이'], ['min-width', '최소 너비'], ['max-width', '최대 너비'], ['min-height', '최소 높이'], ['max-height', '최대 높이']].map(([property, label]) => <SizeField key={`${selected.cid}-${property}`} property={property} label={label} value={String(style[property] || '')} apply={setStyle} />)}</div>
    <h3 className="panel-subtitle">스타일</h3><div className="style-fields">
      {[['color', '글자 색상'], ['background-color', '배경 색상']].map(([property, label]) => <label className="editor-field" key={property}>{label}<input aria-label={label} type="color" value={colorInput(style[property], property === 'color' ? '#293c31' : '#ffffff')} onChange={event => setStyle(property, event.target.value)} /></label>)}
      <label className="editor-field">글자 크기 (px)<input aria-label="글자 크기 (px)" type="number" min={8} max={100} value={parseInt(String(style['font-size'])) || ''} placeholder="기본" onChange={event => setStyle('font-size', event.target.value ? `${Math.min(100, Math.max(8, Number(event.target.value)))}px` : '')} /></label>
      {/* 폰트는 로컬 기본 글꼴과 시스템 글꼴만 사용해 외부 요청을 만들지 않는다. */}
      <label className="editor-field">폰트 종류<select aria-label="폰트 종류" value={String(style['font-family'] || '')} onChange={event => setStyle('font-family', event.target.value)}><option value="">기본·상속</option><option value="Pretendard, sans-serif">Pretendard</option><option value="sans-serif">시스템 고딕</option><option value="serif">시스템 명조</option><option value="monospace">시스템 고정폭</option></select></label>
      <label className="editor-field">폰트 굵기<select aria-label="폰트 굵기" value={String(style['font-weight'] || '')} onChange={event => setStyle('font-weight', event.target.value)}><option value="">기본·상속</option>{[300, 400, 500, 600, 700, 800].map(weight => <option key={weight} value={weight}>{weight}</option>)}</select></label>
      <label className="editor-field">불투명도 (%)<input aria-label="불투명도 (%)" type="number" min={0} max={100} placeholder="기본 (100%)" value={style.opacity === undefined || style.opacity === '' ? '' : Math.round(Number(style.opacity) * 100)} onChange={event => setStyle('opacity', event.target.value === '' ? '' : String(Math.max(0, Math.min(100, Number(event.target.value))) / 100))} /><small>0은 투명, 100은 불투명. 자식 요소에도 적용됩니다.</small></label>
      <label className="editor-field">테두리 굵기 (px)<input aria-label="테두리 굵기 (px)" type="number" min={0} max={120} placeholder="기본" value={declaration.borderWidth ? parseFloat(declaration.borderWidth) : ''} onChange={event => { if (event.target.value === '') { setStyle('border', ''); return; } const width = Math.min(120, Math.max(0, Number(event.target.value))); const line = declaration.borderStyle && declaration.borderStyle !== 'none' ? declaration.borderStyle : 'solid'; setStyle('border', `${width}px ${line} ${declaration.borderColor || '#cbd5c7'}`); }} /></label>
      <label className="editor-field">텍스트 정렬<select aria-label="정렬" value={String(style['text-align'] || '')} onChange={event => setStyle('text-align', event.target.value)}><option value="">기본·상속</option><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option><option value="justify">양쪽 맞춤</option></select></label>
      {[['padding', '안쪽 여백'], ['margin', '바깥 여백'], ['border-radius', '모서리']].map(([property, label]) => <label className="editor-field" key={property}>{label} (px)<input aria-label={`${label} (px)`} type="number" min={0} max={120} placeholder="기본" value={style[property] ? parseInt(String(style[property])) : ''} onChange={event => setStyle(property, event.target.value ? `${Math.min(120, Math.max(0, Number(event.target.value)))}px` : '')} /></label>)}
      <label className="editor-field">테두리<select aria-label="테두리" value={borderInput(style.border)} onChange={event => setStyle('border', event.target.value)}><option value="">기본</option><option value="none">없음</option><option value="1px solid #cbd5c7">가는 선</option><option value="2px solid #285e49">초록 선</option><option value="1px dashed #899783">점선</option></select></label>
    </div><LayoutPanel selected={selected} style={style} apply={setStyle} /><button type="button" className="panel-button" onClick={() => selected.setStyle({})}>직접 지정한 스타일 초기화</button>
    {selected !== editor.getWrapper() && <><h3 className="panel-subtitle">다른 구역으로 이동</h3><label className="editor-field">대상 구역<select aria-label="대상 구역" value={targetId} onChange={event => setTargetId(event.target.value)}><option value="">구역 선택</option>{containers.map(({ component }) => <option key={component.cid} value={component.cid}>{componentLabel(component)} · {component.getId()}</option>)}<option value="root">페이지 최상위</option></select></label><button type="button" className="panel-button" disabled={!targetId} onClick={() => { const target = targetId === 'root' ? editor.getWrapper() : containers.find(item => item.component.cid === targetId)?.component; if (target && canMoveTo(selected, target, editor)) { selected.move(target); setTargetId(''); notify('선택한 구역으로 이동했습니다.'); } }}>구역 이동</button></>}
  </>;
}

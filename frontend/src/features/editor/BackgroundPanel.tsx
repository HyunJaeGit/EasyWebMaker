// 배경 업로드와 배치 설정을 편집 모델에 적용한다. 저장 시 검증 자산으로 변환된다.
import { useState } from 'react';
import type { Component } from 'grapesjs';
const controls = [
  { property: 'background-size', label: '배경 이미지 크기', options: [['cover', '채우기 (일부 잘림)'], ['contain', '전체 보이기'], ['auto', '원본 크기']] },
  { property: 'background-position', label: '배경 이미지 위치', options: [['center center', '가운데'], ['center top', '위'], ['center bottom', '아래'], ['left center', '왼쪽'], ['right center', '오른쪽']] },
  { property: 'background-repeat', label: '배경 이미지 반복', options: [['no-repeat', '반복 없음'], ['repeat', '반복'], ['repeat-x', '가로 반복'], ['repeat-y', '세로 반복']] },
];
export function BackgroundPanel({ selected, notify }: { selected: Component; notify: (message: string) => void }) {
  const [url, setUrl] = useState('');
  const apply = (source: string) => { selected.addStyle({ 'background-image': `url(${JSON.stringify(source)})`, 'background-size': 'cover', 'background-position': 'center center', 'background-repeat': 'no-repeat' }); notify('배경 이미지를 적용했습니다.'); };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) { notify('PNG·JPG·WebP·GIF, 최대 5 MB 이미지를 선택해 주세요.'); return; }
    try { const source = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); apply(source); }
    catch { notify('배경 이미지 파일을 읽지 못했습니다.'); }
  };
  const style = selected.getStyle();
  return <><h3 className="panel-subtitle">배경 이미지</h3><p className="editor-help">내용 이미지로 넣으려면 구역을 선택한 뒤 ‘이미지’ 블록을 추가하세요.</p><label className="editor-field">배경 이미지 업로드<input aria-label="배경 이미지 업로드" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} /></label><label className="editor-field">배경 이미지 주소<input aria-label="배경 이미지 주소" placeholder="https:// 이미지 주소" value={url} onChange={event => setUrl(event.target.value)} /></label><button className="panel-button" type="button" onClick={() => { if (!/^https?:\/\/[^\s<>"\\]+$/i.test(url)) { notify('http 또는 https 이미지 주소를 입력해 주세요.'); return; } apply(url); }}>배경 이미지 주소 적용</button>{style['background-image'] && style['background-image'] !== 'none' && <><p className="editor-help">배경 이미지가 적용되어 있습니다.</p>{controls.map(({ property, label, options }) => <label className="editor-field" key={property}>{label}<select aria-label={label} value={String(style[property] || options[0][0])} onChange={event => selected.addStyle({ [property]: event.target.value })}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}<button className="panel-button" type="button" onClick={() => { selected.addStyle({ 'background-image': 'none' }); notify('배경 이미지를 제거했습니다.'); }}>배경 이미지 제거</button></>}</>;
}

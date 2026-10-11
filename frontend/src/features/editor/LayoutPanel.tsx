// 요소 자신의 위치와 컨테이너 자식 배치를 분리하며, 단위 입력은 확정할 때 적용한다.
import type { Component } from 'grapesjs';
import { isContainer } from './engine';
import { SizeField } from './SizeField';

export function LayoutPanel({ selected, style, apply }: { selected: Component; style: Record<string, unknown>; apply: (property: string, value: string) => void }) {
  const value = (property: string) => String(style[property] ?? '');
  const select = (property: string, label: string, options: [string, string][]) => <label className="editor-field">{label}<select aria-label={label} value={value(property)} onChange={event => apply(property, event.target.value)}><option value="">기본·상속</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
  const size = (property: string, label: string) => <SizeField key={`${selected.cid}-${property}`} property={property} label={label} value={value(property)} apply={apply} />;
  const container = isContainer(selected) || selected.get('type') === 'wrapper';
  const centered = value('margin-left') === 'auto' && value('margin-right') === 'auto';
  return <>
    <h3 className="panel-subtitle">요소 정렬·배치</h3>
    <p className="editor-help">글자 정렬은 내용에, 요소 정렬은 박스에 적용합니다. 좌우 정렬은 부모보다 작은 너비에서 확인할 수 있습니다.</p>
    <div className="style-fields">
      <label className="editor-field">요소 좌우 정렬<select aria-label="요소 좌우 정렬" value={centered ? 'center' : value('margin-left') === 'auto' ? 'right' : value('margin-right') === 'auto' ? 'left' : ''} onChange={event => {
        const direction = event.target.value;
        // margin을 한 번에 적용해 정렬 동작 하나를 undo 하나로 유지한다.
        apply('margin', direction === '' ? '' : `${value('margin-top') || '0'} ${direction === 'center' || direction === 'left' ? 'auto' : '0'} ${value('margin-bottom') || '0'} ${direction === 'center' || direction === 'right' ? 'auto' : '0'}`);
        if (['a', 'span'].includes(selected.get('tagName') || '')) apply('display', 'block');
      }}><option value="">직접 지정·기본</option><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></label>
      {select('align-self', '부모 안 요소 정렬', [['auto', '자동'], ['start', '시작'], ['center', '가운데'], ['end', '끝'], ['stretch', '늘리기']])}
    </div>
    <p className="editor-help">부모 안 요소 정렬은 부모가 flex/grid일 때 교차축 또는 셀 안에 적용됩니다.</p>
    {container && <><h3 className="panel-subtitle">컨테이너 내부 배치</h3><div className="style-fields">
      {select('display', '배치 방식', [['block', '세로 기본'], ['flex', 'Flex'], ['grid', 'Grid']])}
      {select('flex-direction', '배치 방향', [['row', '가로'], ['column', '세로'], ['row-reverse', '가로 역순'], ['column-reverse', '세로 역순']])}
      {select('flex-wrap', '줄바꿈', [['nowrap', '한 줄'], ['wrap', '자동 줄바꿈']])}
      {select('justify-content', '주축 정렬', [['start', '시작'], ['center', '가운데'], ['end', '끝'], ['space-between', '양끝·사이 간격'], ['space-around', '주변 간격'], ['space-evenly', '동일 간격']])}
      {select('align-items', '교차축 정렬', [['start', '시작'], ['center', '가운데'], ['end', '끝'], ['stretch', '늘리기']])}
      {size('gap', '요소 사이 간격')}
      <label className="editor-field">Grid 열 수<select aria-label="Grid 열 수" value={value('grid-template-columns')} onChange={event => apply('grid-template-columns', event.target.value)}><option value="">기본</option>{[1, 2, 3, 4].map(count => <option key={count} value={`repeat(${count}, minmax(0px, 1fr))`}>{count}열</option>)}</select></label>
    </div><p className="editor-help">방향·줄바꿈은 Flex, 열 수는 Grid에 적용됩니다. 배치 방식 변경은 자식 요소의 위치도 바꿉니다.</p></>}
    <h3 className="panel-subtitle">방향별 여백·마진</h3><p className="editor-help">px·%·rem 등 단위와 마진 auto를 지원합니다. 마진은 음수도 허용합니다. 전체 여백 입력을 바꾸면 네 방향을 함께 덮어씁니다.</p>
    <div className="style-fields">{(['top', 'right', 'bottom', 'left'] as const).map((direction, index) => size(`padding-${direction}`, `안쪽 여백 ${['위', '오른쪽', '아래', '왼쪽'][index]}`))}{(['top', 'right', 'bottom', 'left'] as const).map((direction, index) => size(`margin-${direction}`, `마진 ${['위', '오른쪽', '아래', '왼쪽'][index]}`))}</div>
    <h3 className="panel-subtitle">포지션</h3>
    <div className="style-fields">{select('position', '포지션', [['static', '기본 흐름 (static)'], ['relative', '현재 위치 기준 (relative)'], ['absolute', '배치 부모 기준 (absolute)'], ['fixed', '화면 기준 (fixed)'], ['sticky', '스크롤 고정 (sticky)']])}
      {(['top', 'right', 'bottom', 'left'] as const).map((property, index) => size(property, `위치 ${['위', '오른쪽', '아래', '왼쪽'][index]}`))}
      <label className="editor-field">겹침 순서<input aria-label="겹침 순서" type="number" min={-1000} max={1000} step={1} value={value('z-index')} placeholder="기본" onChange={event => apply('z-index', event.target.value ? String(Math.max(-1000, Math.min(1000, Math.trunc(Number(event.target.value))))) : '')} /></label>
    </div><p className="editor-help">absolute는 position이 static이 아닌 가장 가까운 부모를 기준으로 합니다. 부모를 relative로 설정해 사용하세요. static에서는 위치 값이 적용되지 않습니다. absolute/fixed는 기본 흐름에서 빠지므로 작은 화면도 확인하세요.</p>
  </>;
}

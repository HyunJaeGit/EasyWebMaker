// 작업 중 도움말·제작정보를 앱 안에서 표시하며 프로젝트 데이터는 외부로 보내지 않는다.
import type { Editor } from 'grapesjs';
export function MakerHelpDialog({ kind, editor, name, dirty, close }: { kind: 'help' | 'info'; editor: Editor | null; name: string; dirty: boolean; close: () => void }) {
  return <div className="editor-modal-backdrop"><div className="project-dialog maker-help-dialog" role="dialog" aria-modal="true" aria-labelledby="maker-help-title">
    <div className="utility-heading"><h2 id="maker-help-title">{kind === 'help' ? '제작 도움말' : '제작정보'}</h2><button type="button" autoFocus onClick={close}>닫기</button></div>
    {kind === 'help' ? <div className="help-topics">
      <details open><summary>요소 추가와 선택</summary><p>왼쪽 블록을 클릭해 추가하세요. 오른쪽 위 페이지 구조에서 body를 선택하면 바로 아래에, 컨테이너를 선택하면 내부에 들어갑니다. 목록의 화살표로 자식을 접고 펼칠 수 있습니다.</p></details>
      <details><summary>속성과 배치</summary><p>오른쪽 아래 속성 카테고리를 펼쳐 수정합니다. 우클릭 ‘요소 속성’이나 상단 메뉴로 해당 항목에 바로 이동할 수 있습니다. 텍스트 정렬은 내용에, 요소 정렬은 박스에 적용됩니다. Flex/Grid 배치는 컨테이너에서 설정하세요.</p></details>
      <details><summary>여백과 포지션</summary><p>안쪽 여백은 padding, 바깥 여백은 margin입니다. 방향별 입력은 px·%·rem 등 단위를 지원하고 마진은 음수·auto도 허용합니다. absolute 요소의 기준 컨테이너는 relative로 설정하세요. 작은 화면도 미리보기로 확인하세요.</p></details>
      <details><summary>프로젝트와 페이지</summary><p>프로젝트 이름 옆에서 페이지를 선택하고 이름을 수정합니다. 이름은 Enter 또는 입력에서 벗어날 때 적용됩니다. 상단 ‘새 페이지 추가’로 최대 20개까지 만들 수 있습니다. 이름을 바꿔도 출력 파일명은 유지됩니다.</p></details>
      <details><summary>저장과 불러오기</summary><p>‘저장·내보내기’에서 모든 페이지와 이미지를 ZIP으로 다운로드하세요. ‘ZIP 불러오기’로 다시 편집합니다. 새로고침·탭 종료 시 메모리 작업이 사라지므로 먼저 ZIP으로 저장하세요. 온라인 자동 저장은 연결되지 않았습니다.</p></details>
      <details><summary>작은 화면과 실행 취소</summary><p>블록·구조·속성 버튼으로 패널을 열고 같은 버튼으로 닫습니다. 상단 명령 줄은 좌우로 스크롤할 수 있습니다. 실행 취소·다시 실행은 프로젝트 공통 기록을 사용합니다. 미리보기에는 편집 도구가 표시되지 않습니다.</p></details>
    </div> : <><dl className="maker-info-list"><dt>프로젝트</dt><dd>{name}</dd><dt>현재 페이지</dt><dd>{editor?.Pages.getSelected()?.getName() || '홈'}</dd><dt>페이지 수</dt><dd>{editor?.Pages.getAll().length || 0} / 20</dd><dt>작업 상태</dt><dd>{dirty ? '변경 있음 · 필요한 작업을 ZIP으로 저장하세요' : '현재 변경 표시 없음'}</dd><dt>재편집 형식</dt><dd>easy-web-maker v2 · 기존 v1 ZIP 호환</dd><dt>개발·소유자</dt><dd>팻킹 · <a href="mailto:fatking25@kakao.com">fatking25@kakao.com</a></dd></dl><p>현재 탭에서 제작·저장 화면을 이동하는 동안 작업을 유지합니다. 자동 영구 저장·실제 인증·서버·공개 배포는 연결되지 않았습니다.</p><p>Pretendard는 로컬로 제공하고 ZIP에 OFL 라이선스를 동봉합니다. 샘플은 가상 기관 콘텐츠입니다.</p></>}
  </div></div>;
}

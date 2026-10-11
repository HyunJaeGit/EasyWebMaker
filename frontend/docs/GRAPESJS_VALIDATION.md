# GrapesJS 연동 검증

2026-10-11 · GrapesJS **0.23.6** · Edge · 이번 요청의 Phase 2(블록 제작).

## 채택 근거

연동 전에 작은 문서로 구성요소 삽입·이동·복제·삭제, 스타일 undo/redo, 프로젝트 데이터 왕복 복원, 기기 전환, 편집 UI 없는 HTML과 iframe 캔버스를 검증했다. 모두 통과해 지정된 엔진을 채택했다. 이후 실제 React 화면에서도 동일한 모델을 검증했다.

- PC 드래그 삽입과 구역 안 이동, 클릭·실제 터치 이벤트 삽입, 캔버스 선택과 속성 수정 통과.
- 구역·잎 블록의 draggable/droppable 규칙과 구역 이동 버튼의 순환 방지 적용. 외부 HTML 드롭은 비활성화.
- 기본 8종 블록, 카드 추가·삭제·순서·열 배치, 이미지 업로드·대체 텍스트, 내용·링크·스타일 편집 통과.
- 내용·스타일 undo/redo 및 페이지 이동 후 실행 기록 유지 확인.
- 가상 학교·공공기관 블록 편집, PC·태블릿·모바일 미리보기 확인. 미리보기는 모델 HTML·CSS를 별도 sandbox iframe에 렌더링해 편집 도구를 제외한다.

## 연동 책임

- `features/blocks/`: 블록 구조, 배치 규칙, 기본 샘플, 사이트 반응형 CSS.
- `features/editor/`: GrapesJS 생성·구조 조작·미리보기와 속성 패널.
- `features/project/`: 메모리 프로젝트 데이터·이름·변경 상태.
- `pages/MakerPage.tsx`: 패널·캔버스와 프로젝트 전환 UI. 첫 진입 이후 라우팅 동안 유지해 undo/redo도 보존한다.

## 제약

- 상태는 현재 탭 메모리에만 유지한다. 새로고침·탭 종료 복원과 ZIP은 이번 범위가 아니다.
- 작은 화면의 주요 조작은 클릭 삽입·구조 선택·이동 버튼이다. 고정 기기 너비가 캔버스보다 크면 내부 스크롤을 이용한다.
- Edge의 터치·화면 에뮬레이션까지 검증했다. 실물 iOS/Safari 확인은 남아 있다.
- 엔진을 제작 화면 첫 진입에 지연 로딩한다. 엔진 포함 청크 약 1.13 MB(압축 약 300 KB)로 Vite 크기 안내가 남는다.
- GrapesJS의 간접 의존성 `backbone-undo`에 npm 지원 종료 안내가 있다. 실제 undo/redo 시나리오는 통과했고 설치 시 취약점 0건이었다.

## 라이선스·공식 근거

GrapesJS는 BSD-3-Clause이며 라이선스 전문을 `public/licenses/GrapesJS-LICENSE.txt`에 동봉한다. 상용 Studio SDK 없이 오픈소스 코어만 사용한다.

[구성요소 API](https://grapesjs.com/docs/api/component.html), [프로젝트 데이터 API](https://grapesjs.com/docs/api/editor.html), [Undo Manager](https://grapesjs.com/docs/api/undo_manager.html), [공식 소스와 라이선스](https://github.com/GrapesJS/grapesjs).

# 개발 상태

갱신: 2026-10-11

## 확정 결정
- 요청 기준 Phase 1~5 첫 MVP 기능·로컬 통합 검증·배포 파일 준비 완료. 실제 인증·공개 배포는 미구현/미검증.
- 기획안은 읽기 전용. React 19.3.0·TypeScript 7.0.2·Vite 8.3.4·Node 24.16.0, backend는 안내만 유지.
- HashRouter·Vite 상대 경로. GrapesJS 0.23.6, blocks/editor/project/export 책임 분리.
- 현재 탭의 제작 인스턴스·실행 기록 유지. 자동 영구 저장 없음; 새로고침 후 ZIP 직접 불러오기.
- fflate 0.8.3(MIT), easy-web-maker/version 1. 허용 모델 복원, 출력 HTML 역수입·가져온 JS 실행 없음.
- Pages ZIP 부가 파일은 완전한 원본 묶음만 허용. 기존 Phase 3 ZIP도 지원.
- 회원 UI 지역 임시 상태만 사용. 인증·세션·계정 생성·영구 저장 없음. 비회원 제작·저장 유지.
- Pretendard 1.3.9 로컬·ZIP 동봉(OFL 전문), 가상 기관·자체 그림만 사용.
- 메이커 maker-pages.yml과 출력 ZIP site-pages.yml 분리. 공식 문서 확인한 Actions 버전·권한 사용.

## 완료 Phase
- Phase 1: 기반·반응형 홈·가상 샘플·다섯 경로.
- Phase 2: 8종 블록·반응형 패널·편집·이동·복제·삭제·undo/redo·기기 미리보기.
- Phase 3: 단일 ZIP 저장·검증·이미지 복원·독립 HTML/CSS/JS 출력.
- Phase 4: 로그인·회원가입 UI·상호 이동·기본 검증·미연결 안내, 확장 위치 문서화.
- Phase 5: 메이커 Pages 워크플로, 저장 화면 호스팅 선택, 출력 Pages 설정·안내 ZIP 동봉, 통합 검증·README 정리.

## 검증 결과
- npm ci --offline·타입 검사·프로덕션 빌드 통과, 취약점 0건. 제품 의존성 추가 없음.
- Edge 1440·768·390·320px 주요 편집·회원·저장 화면, 8종 블록·PC 드래그·모바일 터치 통과.
- 하위 경로 홈→샘플→제작→저장→Pages ZIP 복원·재저장, 제작 경로 새로고침·자산 로딩 통과.
- 빈 페이지·학교·공공기관 일반 ZIP 왕복의 블록·스타일·자산 일치. HTTP 하위 경로·file:// 독립 실행·375px 미리보기 주요 결과 일치.
- 15종 오류 ZIP과 Pages 누락/수정 2종에서 작업 유지. 가져온 JS 미실행·외부 이미지 실패 시 저장 중단.
- 회원 제출 인증 요청·Storage 쓰기·쿠키 없음, 입력 초기화·제작/저장 회귀 통과.
- 두 워크플로 YAML 문법·권한·경로 검사, 출력 staging 명령 실제 Git Bash 실행·바이트 일치·재편집 파일 제외 통과.
- 상세: frontend/docs/PHASE5_VALIDATION.md. 이전 Phase 검증 기록 유지.

## 남은 작업
- 실제 Actions 실행·공개 Pages URL 검증. 저장소 생성·연결·push·원격 실행·공개 배포 수행하지 않음.
- 실물 모바일·Safari·Firefox와 JPG/WebP/GIF 각각의 ZIP 왕복 미검증(PNG·기본 SVG 검증).
- 실제 인증·회원 추가 기능·결제·온라인 저장·서버·React 출력은 후속 범위.
- 엔진 청크 약 1.13 MB(압축 300 KB) Vite 안내·backbone-undo 지원 종료 안내 유지. 글꼴 약 2.06 MB 최적화는 후속 검토.

# Phase 5 로컬 통합 검증

2026-10-11 · Node 24.16.0 · 실제 Microsoft Edge · 프로덕션 빌드.

## 실제 검증 완료

| 범위 | 결과 |
| --- | --- |
| 설치·타입·빌드 | 캐시로 npm ci --offline 성공, 취약점 0건, 타입 검사·프로덕션 빌드 통과 |
| 전체 흐름 | 하위 경로 `/maker-repo/`에서 홈→공공기관 샘플→제작→저장→Pages ZIP→불러오기→재저장 통과 |
| 하위 경로 새로고침 | `/maker-repo/#/maker?sample=public` 직접 새로고침 후 엔진·자산 정상, HTTP/브라우저 오류 없음 |
| 빈 페이지·기본 블록 | 8종 삽입, 카드 추가·열, 구역 이동, 평문 처리·스타일·PC 드래그 통과 |
| 반응형 제작 | 1440·768·390·320px 내용·스타일·이미지·이동·복제·삭제·undo/redo·미리보기·페이지 상태 유지 통과 |
| 터치 | 실제 터치 이벤트로 삽입·캔버스 선택·편집·순서 이동·3기기 미리보기 통과 |
| 일반 ZIP 왕복 | 빈 페이지·학교·공공기관의 실제 다운로드·불러오기·재저장 후 블록과 자산 일치 |
| Pages ZIP 왕복 | 설정·안내·.nojekyll 포함, 기존 v1 형식 유지, 재저장 후 블록·자산 일치 |
| 독립 사이트 | 이미지·글꼴 로딩, 내부 링크의 대상 ID 존재, 모바일 가로 초과 없음. 일반 ZIP은 하위 경로 HTTP·file:// 실행 및 375px 주요 결과 일치 |
| 잘못된 ZIP | 기존 15종 오류에서 이름·내용·undo/redo 유지 및 JS 미실행. Pages 파일 누락·수정 2종도 오류·작업 유지 |
| 회원 UI | 1440·768·390·320px 폼·오류·미연결 제출·이동·초기화, 인증 요청/Storage 쓰기/쿠키 없음, 편집·ZIP 회귀 통과 |
| 저장 화면 | 두 배포 방식 전환·파일 표시·가로 초과 없음(1440·768·390·320px), 320px 터치·빈 ZIP 통과, 모바일 캡처 확인 |
| 워크플로 파일 | YAML 파서로 두 워크플로 문법·입력 경로·권한·needs·환경·산출물 경로 확인 |
| 출력 파일 staging | 출력 워크플로의 복사 명령을 실제 Git Bash로 실행. HTML·CSS·JS·assets·.nojekyll 바이트 일치, project.json·설정·안내 제외 |

워크플로의 GitHub 원격 실행을 대신한 검증이 아니다. 메이커 빌드 명령은 로컬에서, 출력 파일 복사 명령은 로컬 Git Bash에서 실행했다. Pages 설정 조회·토큰 발급·아티팩트 업로드·원격 배포는 수행하지 않았다.

기존 임시 QA 스크립트의 Phase 2 버튼명 ‘저장 안내’는 현재 ‘저장·내보내기’에 맞춰 검증 복사본에서 수정했다. 앱 기능 변경이나 실패 은폐가 아니다. 추가 제품 의존성은 없으며 YAML 파서는 무시되는 .qa 폴더의 검증 도구로만 사용했다.

## 공식 설정 근거

- [Pages 워크플로·권한·환경](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Pages 게시 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [checkout v6](https://github.com/actions/checkout/tree/v6) · [setup-node v6](https://github.com/actions/setup-node/tree/v6)
- [configure-pages v5 입력](https://github.com/actions/configure-pages/blob/v5/action.yml) · [Pages 조회 권한](https://docs.github.com/en/rest/pages/pages#get-a-github-pages-site)

## 남은 항목

- 실제 Actions 실행·공개 Pages URL 확인은 미검증. 저장소 생성·연결·push·공개 배포를 수행하지 않았다.
- 실물 모바일·Safari·Firefox·JPG/WebP/GIF 각각의 ZIP 왕복은 미검증. 실제 이미지 왕복은 PNG·기본 SVG.
- 엔진 청크 크기 안내·backbone-undo 지원 종료 안내·글꼴 최적화는 남아 있다.
- 실제 인증·회원별 추가 기능·결제·온라인 저장·백엔드는 후속 범위.

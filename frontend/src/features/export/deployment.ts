// 출력 사이트 전용 Pages 설정. 메이커 소스·재편집 데이터는 배포 산출물에서 제외한다.
export type HostingTarget = 'static' | 'github-pages';
export const legacyPagesFiles: Record<string, string> = {
  '.nojekyll': '',
  '.github/workflows/site-pages.yml': `# 이 ZIP의 독립 사이트용. 메이커 자체의 워크플로와 다르다.
name: 출력 사이트 GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: site-pages
  cancel-in-progress: false
jobs:
  build:
    permissions:
      contents: read
      pages: read
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/configure-pages@v5
      # 재편집 데이터와 안내 파일을 공개 산출물에 넣지 않는다.
      - name: 사이트 파일만 준비
        run: |
          mkdir -p _site
          cp index.html styles.css script.js .nojekyll _site/
          for file in page-*.html page-*.css; do
            if [ -f "$file" ]; then cp "$file" _site/; fi
          done
          cp -R assets _site/assets
      - uses: actions/upload-pages-artifact@v4
        with:
          path: _site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
`,
  'DEPLOYMENT.md': `# 출력 사이트 GitHub Pages 배포 준비

이 파일과 .github/workflows/site-pages.yml은 압축 안의 독립 HTML 사이트용입니다.
이지웹메이커 자체의 frontend 빌드 워크플로와 혼용하지 마세요.
실제 배포는 수행되지 않았습니다. 다음은 사용자가 나중에 진행할 절차입니다.

1. ZIP을 풀고 별도 출력 사이트 저장소 루트에 index.html, styles.css, script.js,
   assets/, .nojekyll과 .github/workflows/site-pages.yml을 둡니다.
   숨김 파일인 .github/와 .nojekyll도 포함하세요.
2. 저장소 Settings → Pages → Build and deployment → Source를 GitHub Actions로 설정합니다.
3. 기본 브랜치가 main이 아니면 워크플로의 branches를 실제 브랜치 이름으로 바꿉니다.
4. 승인된 환경에서 파일을 반영한 뒤 Actions의 출력 사이트 GitHub Pages를 실행합니다.
   github-pages 환경의 허용 브랜치·승인 규칙도 확인하세요.
5. 성공 시 배포 작업에 표시된 URL에서 이미지·링크·모바일 화면을 직접 확인합니다.

HTML·CSS·JS·이미지·글꼴은 상대 경로이므로 /저장소이름/에서도 사용할 수 있습니다.
project.json은 재편집용이며 워크플로는 공개 산출물에 넣지 않습니다.
재편집 ZIP은 따로 보관하세요. 공개 저장소에 project.json을 올리면 소스 자체는 공개됩니다.
완전한 외부 HTML/CSS/JS 역수입은 지원하지 않습니다. 원본 ZIP으로 다시 편집하세요.
Node·React·편집 엔진은 출력 사이트 배포에 필요하지 않습니다.
일반 정적 호스팅은 index.html·styles.css·script.js·assets/를 같은 위치에 업로드합니다.

공식 근거(2026-10-11 확인):
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
`,
};

export const pagesFiles = Object.fromEntries(Object.entries(legacyPagesFiles).map(([path, content]) => [path, content.replace('cp index.html styles.css script.js .nojekyll _site/', 'cp .nojekyll _site/\n          cp -- *.html *.css *.js _site/\n          if [ ! -f _site/index.html ]; then cp -- "$(find . -maxdepth 1 -name \'*.html\' | sort | head -n 1)" _site/index.html; fi').replace('index.html, styles.css, script.js,', '페이지별 HTML, CSS, JS,').replace('index.html·styles.css·script.js·assets/', '페이지별 HTML·CSS·JS·assets/')]));

export function deploymentFiles(entry: string) {
  if (!/^[a-zA-Z0-9가-힣_-]+\.html$/.test(entry)) throw new Error('배포 시작 파일 이름이 올바르지 않습니다.');
  return Object.fromEntries(Object.entries(pagesFiles).map(([path, content]) => [path, content
    .replace('if [ ! -f _site/index.html ]; then cp -- "$(find . -maxdepth 1 -name \'*.html\' | sort | head -n 1)" _site/index.html; fi', `cp -- "${entry}" _site/index.html`)
    .replace('실제 배포는 수행되지 않았습니다.', `첫 페이지 ${entry}을 배포 산출물의 index.html로도 복사합니다.\n실제 배포는 수행되지 않았습니다.`)]));
}

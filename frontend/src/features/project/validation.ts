// 불러온 JSON을 엔진에 전달하기 전에 형식·구조·참조·허용 속성을 검증한다.
import { commonStyles } from '../blocks/definitions';
import { FORMAT, FORMAT_VERSION, requiredOutputs, type SavedProject } from './format';

function fail(message: string): never { throw new Error(message); }
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function string(value: unknown, max = 20000): value is string { return typeof value === 'string' && value.length <= max; }
const hash = (value: unknown) => typeof value === 'string' && /^[a-f\d]{64}$/.test(value);
export const safeAssetPath = (path: string) => /^assets\/[a-zA-Z\d_-]+\.(png|jpg|gif|webp|svg|woff2|txt)$/.test(path);
export function validateCss(css: string) {
  if (css.length > 512000 || /url\s*\(|@import|expression|javascript:|[<\\]|(?:^|[;{\s])behavior\s*:/i.test(css) || /@(?!media\b)/i.test(css)) fail('허용하지 않는 CSS가 포함되어 있습니다.');
  const sheet = new CSSStyleSheet();
  try { sheet.replaceSync(css); } catch { fail('스타일 형식을 읽을 수 없습니다.'); }
}

export function validateProject(value: unknown): SavedProject {
  if (!record(value) || value.format !== FORMAT) fail('이지웹메이커의 project.json 형식이 아닙니다. 외부 HTML의 역수입은 지원하지 않습니다.');
  if (value.version !== 1 && value.version !== FORMAT_VERSION) fail('지원하지 않는 프로젝트 형식 버전입니다.');
  if (value.version === FORMAT_VERSION) {
    if (!Array.isArray(value.pages) || !value.pages.length || value.pages.length > 20) fail('페이지는 1~20개여야 합니다.');
    const pageIds = new Set<string>();
    for (const page of value.pages) {
      if (!record(page) || !string(page.id, 100) || !/^[\w-]+$/.test(page.id) || pageIds.has(page.id) || !string(page.name, 80) || !page.name.trim() || !Array.isArray(page.blocks) || !string(page.css, 512000)) fail('페이지 식별자·이름·블록·스타일이 올바르지 않습니다.');
      pageIds.add(page.id);
      validateProject({ format: value.format, version: 1, name: value.name, start: value.start, blocks: page.blocks, css: page.css, bodyStyle: page.bodyStyle, bodyBackground: page.bodyBackground, assets: value.assets, outputs: value.outputs });
    }
    if (!string(value.activePageId, 100) || !pageIds.has(value.activePageId)) fail('현재 페이지 참조가 올바르지 않습니다.');
    if (!record(value.outputs)) fail('출력 목록이 없습니다.');
    const pageOutputs = value.outputs;
    const expected = ['index.html', 'styles.css', 'script.js', ...value.pages.slice(1).flatMap((_, index) => [`page-${index + 2}.html`, `page-${index + 2}.css`])];
    if (Object.keys(pageOutputs).length !== expected.length || expected.some(path => !hash(pageOutputs[path]))) fail('페이지 출력 목록이 올바르지 않습니다.');
  }
  if (value.bodyStyle !== undefined) {
    if (!record(value.bodyStyle)) fail('본문 스타일 형식이 올바르지 않습니다.');
    for (const [key, style] of Object.entries(value.bodyStyle)) if (!commonStyles.includes(key) || !string(style, 256) || /[{};<>\\@]|url\s*\(|expression|javascript:/i.test(style)) fail('허용하지 않는 본문 스타일입니다.');
  }
  if (!string(value.name, 80) || !value.name.trim() || !string(value.css, 512000) || !Array.isArray(value.blocks) || !Array.isArray(value.assets) || !record(value.outputs)) fail('프로젝트 필수 항목이 없거나 올바르지 않습니다.');
  if (value.start !== undefined && value.start !== 'school' && value.start !== 'public') fail('샘플 식별자가 올바르지 않습니다.');
  validateCss(value.css);
  for (const file of requiredOutputs) if (!hash(value.outputs[file])) fail('출력 파일의 무결성 정보가 없습니다.');
  const paths = new Set<string>();
  if (value.assets.length > 100) fail('자산 개수 제한을 초과했습니다.');
  for (const asset of value.assets) {
    if (!record(asset) || !string(asset.path, 180) || !safeAssetPath(asset.path) || paths.has(asset.path) || !hash(asset.sha256) || !Number.isInteger(asset.size) || Number(asset.size) <= 0 || Number(asset.size) > 8 * 1024 * 1024) fail('자산 목록이 올바르지 않습니다.');
    if (asset.role === 'image' ? !['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'].includes(String(asset.mime)) : asset.role === 'font' ? asset.mime !== 'font/woff2' : asset.role === 'license' ? asset.mime !== 'text/plain' : true) fail('지원하지 않는 자산 종류입니다.');
    paths.add(asset.path);
  }
  const backgroundAssets = value.assets;
  const checkBackground = (path: unknown) => {
    if (path !== undefined && (!string(path, 180) || !paths.has(path) || !backgroundAssets.some((asset: unknown) => record(asset) && asset.path === path && asset.role === 'image'))) fail('배경 이미지 자산 참조가 올바르지 않습니다.');
  };
  checkBackground(value.bodyBackground);
  const ids = new Set<string>(); let count = 0;
  const walk = (block: unknown, depth: number) => {
    if (++count > 2000 || depth > 20) fail('블록 개수 또는 중첩 깊이 제한을 초과했습니다.');
    if (!record(block) || !['ew-container', 'ew-text', 'ew-link', 'ew-image'].includes(String(block.type)) || !string(block.id, 100) || !/^[\w가-힣-]+$/.test(block.id) || ids.has(block.id) || !string(block.name, 200) || !string(block.tagName, 20) || !string(block.content) || !Array.isArray(block.classes) || !Array.isArray(block.children) || !record(block.attributes) || !record(block.style)) fail('블록 필수 항목 또는 식별자가 올바르지 않습니다.');
    ids.add(block.id);
    const tags = block.type === 'ew-container' ? ['section', 'div', 'article', 'header', 'nav', 'footer'] : block.type === 'ew-image' ? ['img'] : block.type === 'ew-link' ? ['a'] : ['p', 'h1', 'h2', 'h3', 'small', 'span'];
    if (!tags.includes(block.tagName)) fail('지원하지 않는 블록 태그입니다.');
    if (block.classes.length > 20 || block.classes.some((item: unknown) => !string(item, 100) || !/^[a-zA-Z\d_-]+$/.test(item) || item.startsWith('gjs-'))) fail('클래스 정보가 올바르지 않습니다.');
    for (const [key, attribute] of Object.entries(block.attributes)) {
      if (!['href', 'alt', 'title'].includes(key) || !string(attribute, 2048)) fail('허용하지 않는 블록 속성입니다.');
      if (key === 'href' && (!/^(https?:\/\/|mailto:|tel:|#[\w가-힣-]*$)/i.test(attribute) || /[<>"\s]/.test(attribute))) fail('허용하지 않는 링크 주소입니다.');
    }
    checkBackground(block.background);
    if (block.background !== undefined && block.type !== 'ew-container') fail('배경 이미지는 구역·컨테이너에만 적용할 수 있습니다.');
    for (const [key, style] of Object.entries(block.style)) {
      if (![...commonStyles, 'grid-template-columns'].includes(key) || !string(style, 256) || /[{};<>\\@]|url\s*\(|expression|javascript:/i.test(style)) fail(`허용하지 않는 블록 스타일입니다: ${key}`);
    }
    if (block.type === 'ew-image' && (!string(block.asset, 180) || !paths.has(block.asset) || !(value.assets as unknown[]).some((asset: unknown) => record(asset) && asset.path === block.asset && asset.role === 'image'))) fail('이미지 자산 참조가 올바르지 않습니다.');
    if (block.type !== 'ew-container' && block.children.length) fail('내용 블록 안에는 다른 블록을 넣을 수 없습니다.');
    block.children.forEach((child: unknown) => walk(child, depth + 1));
  };
  value.blocks.forEach((block: unknown) => walk(block, 0));
  // 위 검증에서 모든 필드를 좁혔다. 이후에는 허용된 필드만 명시적으로 복원한다.
  return value as unknown as SavedProject;
}

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
  if (value.version !== FORMAT_VERSION) fail('지원하지 않는 프로젝트 형식 버전입니다.');
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
    for (const [key, style] of Object.entries(block.style)) {
      if (![...commonStyles, 'grid-template-columns'].includes(key) || !string(style, 256) || /[{};<>\\@]|url\s*\(|expression|javascript:/i.test(style)) fail(`허용하지 않는 블록 스타일입니다: ${key}`);
    }
    if (block.type === 'ew-image' && (!string(block.asset, 180) || !paths.has(block.asset) || !(value.assets as unknown[]).some((asset: unknown) => record(asset) && asset.path === block.asset && asset.role === 'image'))) fail('이미지 자산 참조가 올바르지 않습니다.');
    if (block.type !== 'ew-container' && block.children.length) fail('내용 블록 안에는 다른 블록을 넣을 수 없습니다.');
    if (depth === 0 && block.type !== 'ew-container') fail('페이지의 최상위 블록은 구역이어야 합니다.');
    block.children.forEach((child: unknown) => walk(child, depth + 1));
  };
  value.blocks.forEach((block: unknown) => walk(block, 0));
  // 위 검증에서 모든 필드를 좁혔다. 이후에는 허용된 필드만 명시적으로 복원한다.
  return value as unknown as SavedProject;
}

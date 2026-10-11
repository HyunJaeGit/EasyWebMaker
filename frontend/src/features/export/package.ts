// 한 번의 다운로드로 독립 실행 사이트와 검증 가능한 재편집 프로젝트를 묶는다.
import { strToU8 } from 'fflate';
import { fetchBytes, fontAssets, fontCss, fontLicensePath, localFontCss, packagedFontPath, sha256, validateImage } from './assets';
import { FORMAT, FORMAT_VERSION, requiredOutputs, type AssetRecord, type ProjectSnapshot, type SavedProject } from '../project/format';
import { validateProject } from '../project/validation';
import { makeZip, MAX_ARCHIVE_BYTES, MAX_TOTAL_BYTES } from '../project/zip';
import type { SampleId } from '../../shared/samples';
import { pagesFiles, type HostingTarget } from './deployment';

export interface SitePackage { project: SavedProject; files: Record<string, Uint8Array>; zip: Uint8Array }
export function cleanMarkup(html: string, sources?: ReadonlyMap<string, string>): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script,.gjs-toolbar,.gjs-badge').forEach(element => element.remove());
  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) if (/^data-(gjs|ew)-|^on|^(contenteditable|draggable|spellcheck)$/i.test(attribute.name)) element.removeAttribute(attribute.name);
    element.classList.forEach(name => { if (name.startsWith('gjs-')) element.classList.remove(name); });
    if (element.tagName === 'IMG' && sources) { const original = element.getAttribute('src') || ''; const path = sources.get(original); if (!path) throw new Error('출력 이미지와 자산 목록이 일치하지 않습니다.'); element.setAttribute('src', path); }
  }
  return document.body.innerHTML;
}
export function snapshotPreview(snapshot: ProjectSnapshot, name: string) {
  const document = new DOMParser().parseFromString('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>', 'text/html');
  document.title = name; const style = document.createElement('style'); style.textContent = localFontCss + snapshot.css; document.head.append(style); document.body.innerHTML = cleanMarkup(snapshot.html);
  return '<!doctype html>\n' + document.documentElement.outerHTML;
}

export async function buildSitePackage(snapshot: ProjectSnapshot, name: string, start?: SampleId, hosting: HostingTarget = 'static'): Promise<SitePackage> {
  if (!name.trim() || name.length > 80) throw new Error('프로젝트 이름을 1~80자로 입력해 주세요.');
  const files: Record<string, Uint8Array> = {}; const assets: AssetRecord[] = []; const sources = new Map<string, string>();
  const blocks = structuredClone(snapshot.blocks); let imageCount = 0;
  const addAsset = async (path: string, bytes: Uint8Array, mime: string, role: AssetRecord['role']) => {
    if (assets.length >= 100 || Object.values(files).reduce((sum, file) => sum + file.length, bytes.length) > MAX_TOTAL_BYTES) throw new Error('자산 개수 또는 총 크기 제한을 초과했습니다.');
    files[path] = bytes; assets.push({ path, mime, role, size: bytes.length, sha256: await sha256(bytes) });
  };
  const images = async (items: typeof blocks) => {
    for (const block of items) {
      if (block.type === 'ew-image') {
        const source = block.asset || '';
        if (!source) throw new Error('이미지 주소가 없는 블록입니다. 이미지를 지정해 주세요.');
        if (!sources.has(source)) {
          const bytes = await fetchBytes(source, 5 * 1024 * 1024); const mime = await validateImage(bytes);
          const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/svg+xml' ? 'svg' : mime.split('/')[1];
          const path = `assets/image-${String(++imageCount).padStart(3, '0')}.${extension}`;
          await addAsset(path, bytes, mime, 'image'); sources.set(source, path);
        }
        block.asset = sources.get(source);
      }
      await images(block.children);
    }
  };
  await images(blocks);
  const { font, license } = await fontAssets();
  await addAsset(packagedFontPath, font, 'font/woff2', 'font'); await addAsset(fontLicensePath, license, 'text/plain', 'license');
  const body = cleanMarkup(snapshot.html, sources);
  const document = new DOMParser().parseFromString('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="./styles.css"><script src="./script.js" defer></script></head><body></body></html>', 'text/html');
  document.title = name; document.body.innerHTML = body;
  files['index.html'] = strToU8('<!doctype html>\n' + document.documentElement.outerHTML);
  files['styles.css'] = strToU8(fontCss('./' + packagedFontPath) + '\n' + snapshot.css);
  files['script.js'] = strToU8('// 이 사이트에는 JavaScript 실행 기능이 필요하지 않습니다.\n');
  const outputs = Object.fromEntries(await Promise.all(requiredOutputs.map(async file => [file, await sha256(files[file])])));
  const project = validateProject({ format: FORMAT, version: FORMAT_VERSION, name, start, blocks, css: snapshot.css, assets, outputs });
  files['project.json'] = strToU8(JSON.stringify(project, null, 2));
  if (hosting === 'github-pages') for (const [path, content] of Object.entries(pagesFiles)) files[path] = strToU8(content);
  if (files['project.json'].length > 2 * 1024 * 1024 || Object.values(files).reduce((sum, bytes) => sum + bytes.length, 0) > MAX_TOTAL_BYTES) throw new Error('프로젝트가 저장 크기 제한(총 32 MB, 메타데이터 2 MB)을 초과했습니다.');
  const zip = await makeZip(files); if (zip.length > MAX_ARCHIVE_BYTES) throw new Error('ZIP 저장 크기 제한(25 MB)을 초과했습니다.');
  return { project, files, zip };
}
export function downloadPackage(site: SitePackage) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(site.zip).buffer], { type: 'application/zip' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${site.project.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 80) || 'my-site'}.zip`; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}

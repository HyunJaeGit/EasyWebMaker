// 이미지·글꼴 바이트를 로컬 패키지 자산으로 변환한다. 외부 이미지는 CORS 허용이 필요하다.
import fontUrl from 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2?url';

export const packagedFontPath = 'assets/PretendardVariable.woff2';
export const fontLicensePath = 'assets/Pretendard-OFL.txt';
export const fontCss = (source: string) => `@font-face{font-family:'Pretendard Variable';src:url('${source}');font-weight:45 920;font-display:swap}`;
export const localFontCss = fontCss(fontUrl);
export async function sha256(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
  return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
}
export function dataUri(bytes: Uint8Array, mime: string) {
  let binary = ''; for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
  return `data:${mime};base64,${btoa(binary)}`;
}
export async function fetchBytes(source: string, maxBytes: number): Promise<Uint8Array> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(source, { credentials: 'omit', signal: controller.signal });
    if (!response.ok || Number(response.headers.get('content-length')) > maxBytes || !response.body) throw new Error('자산 응답 또는 파일 크기가 올바르지 않습니다.');
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > maxBytes) { await reader.cancel(); throw new Error('자산 파일 크기 제한을 초과했습니다.'); } chunks.push(part.value); } }
    finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; } return bytes;
  } catch { throw new Error('이미지 또는 글꼴을 가져오지 못했습니다. 외부 이미지의 CORS·주소·크기(이미지 최대 5 MB)를 확인하거나 기기에서 업로드해 주세요.'); }
  finally { clearTimeout(timeout); }
}
export async function fontAssets() {
  const [font, license] = await Promise.all([fetchBytes(fontUrl, 3 * 1024 * 1024), fetchBytes(new URL(`${import.meta.env.BASE_URL}licenses/Pretendard-OFL.txt`, document.baseURI).href, 20000)]);
  return { font, license };
}
export function imageMime(bytes: Uint8Array): string {
  const prefix = new TextDecoder().decode(bytes.subarray(0, 1000));
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (/^GIF8[79]a/.test(prefix)) return 'image/gif';
  if (prefix.startsWith('RIFF') && prefix.slice(8, 12) === 'WEBP') return 'image/webp';
  if (/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)?<svg[\s>]/i.test(prefix)) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('문서 선언이 포함된 SVG는 지원하지 않습니다.');
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (svg.querySelector('parsererror,script,foreignObject,iframe,style,animate,set') || svg.documentElement.localName !== 'svg') throw new Error('허용하지 않는 SVG 이미지입니다.');
    for (const element of Array.from(svg.querySelectorAll('*'))) {
      if (['script', 'foreignobject', 'iframe', 'style', 'animate', 'set'].includes(element.localName.toLowerCase())) throw new Error('허용하지 않는 SVG 요소입니다.');
      for (const attribute of Array.from(element.attributes)) if (/^on|href$/i.test(attribute.name) || /url\s*\(|javascript:/i.test(attribute.value)) throw new Error('외부 참조 또는 실행 코드가 포함된 SVG입니다.');
    }
    return 'image/svg+xml';
  }
  throw new Error('지원하지 않거나 손상된 이미지 파일입니다.');
}
export async function validateImage(bytes: Uint8Array, expectedMime?: string): Promise<string> {
  if (bytes.length > 5 * 1024 * 1024) throw new Error('이미지는 5 MB 이하여야 합니다.');
  const mime = imageMime(bytes);
  if (expectedMime && mime !== expectedMime) throw new Error('이미지 형식과 자산 정보가 일치하지 않습니다.');
  const image = new Image(); image.src = dataUri(bytes, mime);
  try { await image.decode(); if (!image.naturalWidth || !image.naturalHeight) throw new Error(); }
  catch { throw new Error('이미지 내용을 읽을 수 없습니다.'); }
  return mime;
}

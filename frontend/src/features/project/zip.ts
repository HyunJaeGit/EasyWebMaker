// ZIP 경로·중앙 디렉터리·크기·CRC를 확인하고 제한된 크기의 스트림으로 압축을 푼다.
import { Unzip, UnzipInflate, zip, type Zippable } from 'fflate';
import { pagesFiles } from '../export/deployment';

export const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const MAX_ENTRY_BYTES = 8 * 1024 * 1024;
interface Entry { name: string; size: number; crc: number }
const crcTable = Uint32Array.from({ length: 256 }, (_, number) => { let value = number; for (let bit = 0; bit < 8; bit++) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1; return value >>> 0; });
function crc32(data: Uint8Array) { let value = 0xffffffff; for (const byte of data) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; }

function directory(bytes: Uint8Array): Entry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index--) if (view.getUint32(index, true) === 0x06054b50 && index + 22 + view.getUint16(index + 20, true) === bytes.length) { end = index; break; }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('손상되었거나 지원하지 않는 ZIP입니다.');
  const count = view.getUint16(end + 10, true); const size = view.getUint32(end + 12, true); let offset = view.getUint32(end + 16, true);
  if (count > 110 || count !== view.getUint16(end + 8, true) || offset + size !== end) throw new Error('ZIP 파일 목록이 올바르지 않습니다.');
  const entries: Entry[] = []; const names = new Set<string>(); let total = 0;
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error('ZIP 파일 목록이 손상되었습니다.');
    const nameLength = view.getUint16(offset + 28, true); const extraLength = view.getUint16(offset + 30, true); const commentLength = view.getUint16(offset + 32, true);
    if (offset + 46 + nameLength + extraLength + commentLength > end) throw new Error('ZIP 파일 목록이 잘렸습니다.');
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const entrySize = view.getUint32(offset + 24, true); const method = view.getUint16(offset + 10, true);
    if ((!/^(index\.html|styles\.css|script\.js|project\.json|assets\/|assets\/[a-zA-Z\d_.-]+)$/.test(name) && !Object.hasOwn(pagesFiles, name)) || name.includes('..') || names.has(name) || (view.getUint16(offset + 8, true) & 1) || ![0, 8].includes(method)) throw new Error('허용하지 않는 ZIP 경로·암호화·압축 방식입니다.');
    if (entrySize > MAX_ENTRY_BYTES || (name === 'project.json' && entrySize > 2 * 1024 * 1024) || (total += entrySize) > MAX_TOTAL_BYTES) throw new Error('ZIP의 압축 해제 크기 제한을 초과했습니다.');
    names.add(name); entries.push({ name, size: entrySize, crc: view.getUint32(offset + 16, true) });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (offset !== end) throw new Error('ZIP 파일 목록 길이가 올바르지 않습니다.');
  return entries;
}

export async function readZip(file: File): Promise<Map<string, Uint8Array>> {
  if (!/\.zip$/i.test(file.name) || file.size > MAX_ARCHIVE_BYTES || file.size < 22) throw new Error('25 MB 이하의 이지웹메이커 ZIP 파일을 선택해 주세요.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const expected = directory(bytes); const entries = new Map(expected.map(entry => [entry.name, entry]));
  const files = new Map<string, Uint8Array>(); const seen = new Set<string>(); let total = 0;
  const unzipper = new Unzip(stream => {
    const entry = entries.get(stream.name);
    if (!entry || seen.has(stream.name) || (stream.originalSize !== undefined && stream.originalSize !== entry.size)) throw new Error('ZIP 헤더와 파일 목록이 일치하지 않습니다.');
    seen.add(stream.name); const chunks: Uint8Array[] = []; let size = 0;
    stream.ondata = (error, chunk, final) => {
      if (error) throw new Error('ZIP 압축 데이터가 손상되었습니다.');
      size += chunk.length; total += chunk.length;
      if (size > entry.size || total > MAX_TOTAL_BYTES) { stream.terminate(); throw new Error('압축 해제 크기 제한을 초과했습니다.'); }
      chunks.push(chunk);
      if (final) { const data = new Uint8Array(size); let offset = 0; for (const part of chunks) { data.set(part, offset); offset += part.length; } if (size !== entry.size || crc32(data) !== entry.crc) throw new Error('ZIP 파일 무결성 검사에 실패했습니다.'); files.set(stream.name, data); }
    };
    stream.start();
  });
  unzipper.register(UnzipInflate);
  for (let offset = 0; offset < bytes.length; offset += 2048) { unzipper.push(bytes.subarray(offset, offset + 2048), offset + 2048 >= bytes.length); if (offset % 65536 === 0) await new Promise<void>(resolve => setTimeout(resolve, 0)); }
  if (files.size !== expected.length) throw new Error('ZIP 안의 일부 파일을 읽지 못했습니다.');
  return files;
}

export function makeZip(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  const input: Zippable = { ...files, 'assets/': new Uint8Array() };
  return new Promise((resolve, reject) => zip(input, { level: 6 }, (error, bytes) => error ? reject(error) : resolve(bytes)));
}

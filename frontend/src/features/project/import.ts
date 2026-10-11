// 파일 검증을 모두 끝낸 결과만 반환한다. HTML·CSS·JS 출력 파일을 엔진에서 실행하거나 역수입하지 않는다.
import { dataUri, fontLicensePath, packagedFontPath, sha256, validateImage } from '../export/assets';
import { readZip } from './zip';
import { requiredOutputs, restoredComponents, type RestoredProject } from './format';
import { validateProject } from './validation';
import { pagesFiles, legacyPagesFiles, deploymentFiles } from '../export/deployment';

export async function importProject(file: File): Promise<RestoredProject> {
  const files = await readZip(file);
  const json = files.get('project.json');
  if (!json) throw new Error('project.json이 없습니다. 외부 사이트 HTML의 역수입은 지원하지 않습니다.');
  let raw: unknown; try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json)); } catch { throw new Error('project.json이 손상되었거나 JSON 형식이 아닙니다.'); }
  const project = validateProject(raw);
  const outputFiles = project.version !== 1 ? Object.keys(project.outputs) : [...requiredOutputs];
  for (const file of outputFiles) { const bytes = files.get(file); if (!bytes || await sha256(bytes) !== project.outputs[file]) throw new Error(`${file}이 없거나 변경·손상되었습니다.`); }
  if (!project.assets.some(asset => asset.path === packagedFontPath && asset.role === 'font') || !project.assets.some(asset => asset.path === fontLicensePath && asset.role === 'license')) throw new Error('글꼴 또는 글꼴 라이선스가 없습니다.');
  const expected = new Set(['project.json', ...outputFiles, 'assets/', ...project.assets.map(asset => asset.path)]);
  // 기존 Phase 3 ZIP도 허용한다. Pages 부가 파일은 앱이 만든 완전한 묶음만 받으며 실행하지 않는다.
  if (Object.keys(pagesFiles).some(path => files.has(path))) {
    const deployment = project.version === 3 ? deploymentFiles(project.pages![0].files!.html) : pagesFiles;
    for (const [path, content] of Object.entries(deployment)) {
      const bytes = files.get(path);
      const actual = bytes ? new TextDecoder('utf-8', { fatal: true }).decode(bytes) : '';
      const legacy = legacyPagesFiles[path].replace('          for file in page-*.html page-*.css; do\n            if [ -f "$file" ]; then cp "$file" _site/; fi\n          done\n', '');
      if (!bytes || (actual !== content && !(project.version !== 3 && (actual === legacy || actual === legacyPagesFiles[path])))) throw new Error('Pages 배포 파일이 누락되었거나 변경되었습니다. 원본 ZIP을 불러와 주세요.');
      expected.add(path);
    }
  }
  for (const name of files.keys()) if (!expected.has(name)) throw new Error('목록에 없는 파일이 ZIP에 포함되어 있습니다.');
  const assetUrls = new Map<string, string>();
  for (const asset of project.assets) {
    const bytes = files.get(asset.path);
    if (!bytes || bytes.length !== asset.size || await sha256(bytes) !== asset.sha256) throw new Error(`${asset.path} 자산이 없거나 손상되었습니다.`);
    if (asset.role === 'image') { await validateImage(bytes, asset.mime); assetUrls.set(asset.path, dataUri(bytes, asset.mime)); }
    if (asset.role === 'font' && new TextDecoder().decode(bytes.subarray(0, 4)) !== 'wOF2') throw new Error('글꼴 파일 형식이 올바르지 않습니다.');
    if (asset.role === 'license' && !new TextDecoder().decode(bytes).includes('SIL OPEN FONT LICENSE')) throw new Error('글꼴 라이선스 파일이 올바르지 않습니다.');
  }
  return { project, components: restoredComponents(project.blocks, assetUrls), bodyBackground: project.bodyBackground ? assetUrls.get(project.bodyBackground) : undefined,
    pages: project.version !== 1 ? project.pages?.map(page => ({ id: page.id, name: page.name, css: page.css, components: restoredComponents(page.blocks, assetUrls), bodyStyle: page.bodyStyle, bodyBackground: page.bodyBackground ? assetUrls.get(page.bodyBackground) : undefined })) : undefined };
}

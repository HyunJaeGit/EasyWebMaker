import { useState } from 'react';
import type { Editor } from 'grapesjs';
import type { RestoredProject } from '../project/format';
import { pageFiles, pageNameError } from '../project/pageFiles';
import type { HostingTarget } from '../export/deployment';

export function ProjectFileDialog({ kind, editor, name, incoming, importing, notice, close, chooseFile, apply, createPage, save }: {
  kind: 'import' | 'export' | 'page' | 'rename'; editor: Editor | null; name: string; incoming?: RestoredProject; importing: boolean; notice: string;
  close: () => void; chooseFile: () => void; apply: () => void; createPage: (name: string) => void; save: (hosting: HostingTarget) => Promise<void>;
}) {
  const [draft, setDraft] = useState(kind === 'rename' ? editor?.Pages.getSelected()?.getName() || '' : '');
  const [hosting, setHosting] = useState<HostingTarget>('static');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const filenameError = pageNameError(draft, editor?.Pages.getAll().filter(page => kind !== 'rename' || page !== editor.Pages.getSelected()).map(page => page.getName()) || []);
  return <div className="editor-modal-backdrop"><div className="project-dialog maker-help-dialog" role="dialog" aria-modal="true" aria-labelledby="file-dialog-title">
    <div className="utility-heading"><h2 id="file-dialog-title">{kind === 'import' ? '프로젝트 불러오기' : kind === 'page' ? '새 페이지 만들기' : kind === 'rename' ? '파일 이름 변경' : '저장·내보내기'}</h2><button type="button" disabled={busy || importing} onClick={close}>닫기</button></div>
    {kind === 'page' || kind === 'rename' ? <form onSubmit={event => { event.preventDefault(); if (!filenameError) createPage(draft); }}><label>파일 이름<div className="filename-input"><input aria-label="파일 이름" aria-invalid={Boolean(draft && filenameError)} aria-describedby="filename-rules" autoFocus value={draft} maxLength={80} placeholder="home" onChange={event => setDraft(event.target.value)} /><span>.html</span></div></label><p>영문 소문자로 시작하고 소문자·숫자·하이픈만 사용하세요. 공백·한글·특수문자·중복 이름은 사용할 수 없습니다. 확장자는 자동으로 붙습니다.</p><p id="filename-rules" role={draft && filenameError ? 'alert' : undefined}>{draft && filenameError ? filenameError : '예: home, about-us, contact'}</p><ul className="file-bundle-preview">{pageFiles(kind === 'rename' && editor ? editor.Pages.getAll().map(page => ({ name: page === editor.Pages.getSelected() ? draft || 'home' : page.getName() || '홈' })) : [...(editor?.Pages.getAll().map(page => ({ name: page.getName() || '홈' })) || []), { name: draft || 'home' }]).filter((_, index) => kind === 'rename' ? index === editor?.Pages.getAll().indexOf(editor.Pages.getSelected()!) : index === (editor?.Pages.getAll().length || 0)).map(files => <li key={files.html}><strong>{files.html}</strong><span>{files.css} · {files.js}</span></li>)}</ul><button type="submit" className="preview-button" disabled={Boolean(filenameError)}>{kind === 'rename' ? '이름 변경' : '페이지 만들기'}</button></form> : kind === 'import' ? <>
      <p>이지웹메이커에서 내보낸 원본 ZIP 전체를 선택하세요. 검증 후 내용을 확인하고 적용합니다.</p><ul><li>ZIP 25 MB 이하 · 압축 해제 총 32 MB 이하</li><li>루트: project.json, 페이지 HTML·CSS·JS, assets/</li><li>v1·v2·v3 지원 · 최대 20페이지 · 자산 100개</li><li>파일명·내용·해시가 원본과 일치해야 합니다. 외부 HTML·수정·암호화 ZIP은 지원하지 않습니다.</li></ul>
      <button type="button" disabled={importing} onClick={chooseFile}>{importing ? '검증 중…' : 'ZIP 파일 선택'}</button><p role="status">{notice}</p>
      {incoming && <><dl className="maker-info-list"><dt>프로젝트</dt><dd>{incoming.project.name}</dd><dt>형식</dt><dd>v{incoming.project.version}</dd><dt>페이지</dt><dd>{incoming.project.pages?.map(page => page.name).join(', ') || '홈'}</dd><dt>자산</dt><dd>{incoming.project.assets.length}개</dd></dl><p>적용하면 현재 작업을 교체합니다. 필요한 작업은 먼저 ZIP으로 저장하세요.</p><button className="preview-button" onClick={apply}>검증된 프로젝트 적용</button></>}
    </> : <><p>페이지별 HTML·CSS·JS, 자산과 재편집용 project.json을 ZIP으로 저장합니다.</p><ul>{editor && pageFiles(editor.Pages.getAll().map(page => ({ name: page.getName() || '홈' }))).map(files => <li key={files.html}>{files.html} · {files.css} · {files.js}</li>)}</ul><label>배포 형식<select value={hosting} disabled={busy} onChange={event => setHosting(event.target.value as HostingTarget)}><option value="static">일반 정적 호스팅</option><option value="github-pages">GitHub Pages</option></select></label><p>압축을 푼 뒤 첫 페이지 HTML을 여세요. GitHub Pages 형식은 배포 준비 파일을 추가합니다.</p><button className="preview-button" disabled={busy || !name.trim()} onClick={async () => { setBusy(true); try { await save(hosting); setMessage('ZIP 다운로드를 시작했습니다.'); } catch (error) { setMessage(error instanceof Error ? error.message : '저장 실패'); } finally { setBusy(false); } }}>{busy ? 'ZIP 준비 중…' : 'ZIP 다운로드'}</button><p role="status">{message}</p></>}
  </div></div>;
}

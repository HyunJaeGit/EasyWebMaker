// 저장 화면은 현재 엔진의 같은 시점 스냅샷을 미리보기·ZIP 출력에 사용한다.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../features/project/ProjectContext';
import type { ProjectSnapshot } from '../features/project/format';
import { buildSitePackage, downloadPackage, snapshotPreview, type SitePackage } from '../features/export/package';
import '../features/export/save.css';
import { pagesFiles, type HostingTarget } from '../features/export/deployment';

export function SavePage() {
  const { memory, runtime, ready, name, setName } = useProject();
  const [snapshot, setSnapshot] = useState<ProjectSnapshot>();
  const [site, setSite] = useState<SitePackage>();
  const [busy, setBusy] = useState(false);
  const [hosting, setHosting] = useState<HostingTarget>('static');
  const [message, setMessage] = useState('사이트 파일과 재편집 데이터를 하나의 ZIP으로 저장합니다.');
  const [width, setWidth] = useState('100%');
  useEffect(() => { if (ready && runtime.current) { try { setSnapshot(runtime.current.capture()); } catch (error) { setMessage(error instanceof Error ? error.message : '현재 작업을 읽지 못했습니다.'); } } }, [ready, runtime]);
  const preview = useMemo(() => snapshot ? snapshotPreview(snapshot, name) : '', [snapshot, name]);
  const download = async () => {
    if (!runtime.current || busy) return;
    setBusy(true); setMessage('이미지·글꼴을 모으고 ZIP을 만들고 있습니다.');
    try { const current = runtime.current.capture(); const packaged = await buildSitePackage(current, name, memory.current.start, hosting); setSnapshot(current); setSite(packaged); downloadPackage(packaged); setMessage('ZIP 다운로드를 시작했습니다. 같은 ZIP을 제작 화면에서 다시 불러올 수 있습니다.'); }
    catch (error) { setMessage(`저장 실패: ${error instanceof Error ? error.message : 'ZIP을 만들지 못했습니다.'} 현재 작업은 유지됩니다.`); }
    finally { setBusy(false); }
  };
  if (!ready && !snapshot) return <section className="save-page container"><span className="section-kicker">SAVE YOUR WEBSITE</span><h1>먼저 사이트를 제작해 주세요</h1><p>이 탭에서 제작한 프로젝트가 없습니다. 빈 페이지나 샘플로 시작할 수 있습니다.</p><Link className="button primary" to="/maker">사이트 제작 시작 ↗</Link></section>;
  return <section className="save-page container"><div className="save-heading"><div><span className="section-kicker">SAVE YOUR WEBSITE</span><h1>사이트를 내 손에 저장하기</h1><p>완성한 사이트도, 다시 편집할 데이터도 한 번에.</p></div><Link className="button secondary" to="/maker">편집으로 돌아가기</Link></div><div className="save-layout"><div className="save-preview-panel"><div className="save-preview-toolbar"><h2>출력 미리보기</h2><div>{[['100%', 'PC'], ['768px', '태블릿'], ['375px', '모바일']].map(([value, label]) => <button type="button" key={value} aria-pressed={width === value} onClick={() => setWidth(value)}>{label}</button>)}</div></div><div className="save-preview-stage">{preview && <iframe title="저장 사이트 미리보기" sandbox="allow-popups allow-same-origin" srcDoc={preview} style={{ width }} />}</div></div><aside className="save-details"><label className="save-name">프로젝트 이름<input aria-label="저장 프로젝트 이름" value={name} maxLength={80} disabled={busy} onChange={event => { setName(event.target.value); memory.current.dirty = true; setSite(undefined); }} /></label><label className="save-name">배포 방식<select aria-label="배포 방식" value={hosting} disabled={busy} onChange={event => { setHosting(event.target.value as HostingTarget); setSite(undefined); }}><option value="static">일반 정적 호스팅</option><option value="github-pages">GitHub Pages</option></select></label><p className="save-help">{hosting === 'github-pages' ? '출력 사이트 전용 Actions 설정과 배포 안내를 ZIP에 추가합니다. 다운로드만으로 공개 배포되지는 않습니다.' : 'HTML·CSS·JS·assets를 함께 올릴 수 있는 일반 정적 사이트 파일입니다.'}</p><h2>ZIP에 포함되는 파일</h2><ul className="output-list">{['index.html', 'styles.css', 'script.js', 'assets/', 'project.json'].map((file, index) => <li key={file}><strong>{file}</strong><span>{['독립 실행 페이지', '반응형 디자인·글꼴', '실행 기능 없으면 안내 주석만 포함', '이미지·글꼴·글꼴 라이선스', '버전·블록·내용·스타일·자산 참조'][index]}</span></li>)}</ul>{hosting === 'github-pages' && <ul className="output-list">{Object.keys(pagesFiles).map(path => <li key={path}><strong>{path}</strong><span>출력 사이트 배포 준비</span></li>)}</ul>}{site && <details className="asset-list"><summary>실제 파일 목록 ({Object.keys(site.files).length}개)</summary><ul>{Object.entries(site.files).map(([path, bytes]) => <li key={path}>{path} <span>{(bytes.length / 1024).toFixed(1)} KB</span></li>)}</ul></details>}<button type="button" className="button primary download-button" disabled={busy || !snapshot} onClick={() => void download()}>{busy ? 'ZIP 준비 중…' : 'ZIP 다운로드'} <span aria-hidden="true">↓</span></button><p className="save-status" role="status">{message}</p><p className="save-help">압축을 풀고 index.html을 열면 사이트를 볼 수 있습니다. 다시 편집하려면 제작 화면의 ‘ZIP 불러오기’에서 이 ZIP 전체를 선택하세요. 외부 이미지의 다운로드가 차단되면 기기의 이미지로 교체해 주세요.</p><p className="save-help">메이커 자체의 배포 설정과 출력 사이트 설정은 별개입니다. 온라인 저장이나 실제 배포는 수행하지 않습니다.</p></aside></div></section>;
}

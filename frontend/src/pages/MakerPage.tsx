// 반응형 제작 화면. 엔진 인스턴스를 유지하고 React 패널로 클릭·터치 편집을 제공한다.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Component, Editor } from 'grapesjs';
import { blockCatalog } from '../features/blocks/definitions';
import { configureBody, createEditor, insertBlock, isContainer, previewDocument, resetProject } from '../features/editor/engine';
import { PropertiesPanel } from '../features/editor/PropertiesPanel';
import { useProject } from '../features/project/ProjectContext';
import { captureProject } from '../features/project/snapshot';
import { importProject } from '../features/project/import';
import type { RestoredProject } from '../features/project/format';
import { findSample, type SampleId } from '../shared/samples';
import 'grapesjs/dist/css/grapes.min.css';
import '../features/editor/editor.css';
import { StructureTree } from '../features/editor/StructureTree';
import { ContextMenu } from '../features/editor/ContextMenu';

type Device = 'desktop' | 'tablet' | 'mobile';
export function MakerPage({ active, toolbarHost }: { active: boolean; toolbarHost: HTMLDivElement | null }) {
  const host = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Editor | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { memory, runtime, setReady, name, setName } = useProject();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [selected, setSelected] = useState<Component>();
  const [, refresh] = useState(0);
  const [panel, setPanel] = useState<'blocks' | 'properties' | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [preview, setPreview] = useState<string>();
  const [previewGuides, setPreviewGuides] = useState(false);
  const [notice, setNotice] = useState('구역을 선택하고 블록을 눌러 추가하세요.');
  const [pending, setPending] = useState<{ sample?: SampleId }>();
  const [incoming, setIncoming] = useState<RestoredProject>();
  const [importing, setImporting] = useState(false);
  const seenSearch = useRef(search);
  const initialSample = useRef(findSample(new URLSearchParams(search).get('sample'))?.id);

  useEffect(() => {
    if (!host.current) return;
    const instance = createEditor(host.current, memory.current.data, memory.current.initialized ? memory.current.start : initialSample.current);
    engineRef.current = instance;
    let ready = false;
    instance.onReady(() => {
      ready = true; setEditor(instance);
      runtime.current = { capture: () => captureProject(instance) }; setReady(true);
      if (!memory.current.initialized) { memory.current.start = initialSample.current; memory.current.initialized = true; if (initialSample.current) setName(findSample(initialSample.current)?.institution || '나의 첫 번째 웹사이트'); }
      memory.current.data = instance.getProjectData();
    });
    const update = () => { if (!ready) return; memory.current.data = instance.getProjectData(); memory.current.dirty = true; refresh(value => value + 1); };
    instance.on('update', update);
    instance.on('page:select', () => { instance.select(undefined); setSelected(undefined); configureBody(instance); update(); });
    instance.on('canvas:frame:load', () => { configureBody(instance); refresh(value => value + 1); });
    instance.on('component:selected', (component: Component) => { setSelected(component); });
    instance.on('component:deselected', () => { queueMicrotask(() => { const current = instance.getSelected(); setSelected(previous => current || (previous === instance.getWrapper() ? previous : undefined)); }); });
    instance.on('undo redo', () => { const current = instance.getSelected(); setSelected(previous => current || (previous === instance.getWrapper() ? previous : undefined)); refresh(value => value + 1); });
    // 문서 이탈은 메모리 상태를 잃으므로 실제 편집이 있을 때만 알린다.
    const beforeUnload = (event: BeforeUnloadEvent) => { if (memory.current.dirty) { event.preventDefault(); } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { if (ready) memory.current.data = instance.getProjectData(); runtime.current = null; setReady(false); window.removeEventListener('beforeunload', beforeUnload); instance.destroy(); engineRef.current = null; };
  }, [memory, runtime, setReady, setName]);

  useEffect(() => {
    if (!editor) return;
    if (!active) { seenSearch.current = '\0'; return; }
    requestAnimationFrame(() => editor.refresh());
    if (seenSearch.current === search) return;
    seenSearch.current = search;
    const requested = findSample(new URLSearchParams(search).get('sample'))?.id;
    if (requested && requested !== memory.current.start) setPending({ sample: requested });
  }, [active, editor, memory, search]);

  // 대화상자를 열면 키보드 초점을 안에 유지하고 닫을 때 원래 제어로 복귀한다.
  useEffect(() => {
    if (!active || (!preview && !pending && !incoming)) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('.maker-page [role="dialog"]');
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea') || []);
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPreview(undefined); setPending(undefined); setIncoming(undefined); }
      if (event.key === 'Tab') {
        const items = controls(); const first = items[0]; const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, [active, pending, preview, incoming]);

  const chooseDevice = (value: Device) => { setDevice(value); editor?.setDevice(value === 'desktop' ? 'PC' : value === 'tablet' ? '태블릿' : '모바일'); };
  const switchProject = () => {
    if (!editor || !pending) return;
    resetProject(editor, pending.sample); memory.current.start = pending.sample; memory.current.dirty = false; memory.current.data = editor.getProjectData();
    setName(findSample(pending.sample || null)?.institution || '나의 첫 번째 웹사이트'); setSelected(undefined); setPending(undefined); setNotice('새 시작점을 열었습니다.'); refresh(value => value + 1);
    seenSearch.current = pending.sample ? `?sample=${pending.sample}` : '';
    navigate(`/maker${seenSearch.current}`, { replace: true });
  };
  const keepProject = () => {
    setPending(undefined);
    seenSearch.current = memory.current.start ? `?sample=${memory.current.start}` : '';
    navigate(`/maker${seenSearch.current}`, { replace: true });
  };
  // 검증된 결과를 사용자가 적용하기 전까지 기존 모델과 실행 기록에 손대지 않는다.
  const readProject = async (file?: File) => {
    if (!file || !editor) return;
    setImporting(true); setNotice('ZIP 파일과 프로젝트·자산을 검증하고 있습니다.');
    try { setIncoming(await importProject(file)); setNotice('파일 검증을 완료했습니다. 불러오기를 확인해 주세요.'); }
    catch (error) { setNotice(`불러오기 실패: ${error instanceof Error ? error.message : '파일을 읽지 못했습니다.'} 기존 작업은 유지됩니다.`); }
    finally { setImporting(false); }
  };
  const applyProject = () => {
    if (!editor || !incoming) return;
    const previous = editor.getProjectData();
    editor.UndoManager.stop();
    try {
      if (incoming.pages) {
        editor.select(undefined);
        const old = [...editor.Pages.getAll()];
        old.forEach(page => editor.Pages.remove(page));
        editor.setStyle(incoming.pages.map(page => page.css).join('\n'));
        for (const page of incoming.pages) {
          const added = editor.Pages.add({ id: page.id, name: page.name, component: page.components });
          added?.getMainComponent().setStyle({ ...page.bodyStyle, ...(page.bodyBackground ? { 'background-image': `url(${JSON.stringify(page.bodyBackground)})` } : {}) });
        }
        editor.Pages.select(incoming.project.activePageId!); configureBody(editor);
      } else {
        resetProject(editor);
        editor.setStyle(incoming.project.css); editor.setComponents(incoming.components); editor.getWrapper()?.setStyle({ ...incoming.project.bodyStyle, ...(incoming.bodyBackground ? { 'background-image': `url(${JSON.stringify(incoming.bodyBackground)})` } : {}) }); editor.select(undefined);
      }
      memory.current.start = incoming.project.start; memory.current.initialized = true; memory.current.data = editor.getProjectData(); memory.current.dirty = false;
      setName(incoming.project.name); setSelected(undefined); setIncoming(undefined); editor.UndoManager.clear();
      seenSearch.current = incoming.project.start ? `?sample=${incoming.project.start}` : '';
      navigate(`/maker${seenSearch.current}`, { replace: true }); setNotice('프로젝트와 이미지를 복원했습니다. 계속 편집할 수 있습니다.'); refresh(value => value + 1);
    } catch { editor.loadProjectData(previous); setNotice('프로젝트 적용에 실패해 기존 작업으로 복구했습니다.'); }
    finally { editor.UndoManager.start(); }
  };

  return <section className="maker-page" hidden={!active} aria-label="사이트 제작">
    {/* 편집 핸들러는 유지하고 프로젝트 명령만 로고 옆 헤더로 표시한다. */}
    {active && toolbarHost && createPortal(<div className="maker-command-menu" aria-label="프로젝트 작업">
      <button type="button" onClick={() => setPending({})}>새 빈 프로젝트</button>
      <Link className="save-guide-link" to="/save">저장·내보내기</Link>
      <button type="button" disabled={!editor || importing} onClick={() => fileInput.current?.click()}>{importing ? '파일 검증 중…' : 'ZIP 불러오기'}</button>
      <input ref={fileInput} type="file" aria-label="프로젝트 ZIP 파일" accept=".zip,application/zip" hidden onChange={event => { void readProject(event.target.files?.[0]); event.target.value = ''; }} />
      <div className="history-controls"><button type="button" disabled={!editor?.UndoManager.hasUndo()} onClick={() => editor?.UndoManager.undo()}>↶ 실행 취소</button><button type="button" disabled={!editor?.UndoManager.hasRedo()} onClick={() => editor?.UndoManager.redo()}>↷ 다시 실행</button></div>
      <button type="button" disabled={!editor || editor.Pages.getAll().length >= 20} onClick={() => {
        if (!editor) return;
        const page = editor.Pages.add({ id: `page-${crypto.randomUUID()}`, name: `새 페이지 ${editor.Pages.getAll().length + 1}`, component: [] });
        if (page) { editor.UndoManager.skip(() => editor.Pages.select(page)); configureBody(editor); setSelected(undefined); setNotice('새 페이지를 추가했습니다. body를 선택하고 요소를 넣으세요.'); }
      }}>새 페이지 추가</button>
      <select className="element-properties-menu" aria-label="현재 페이지" disabled={!editor} value={editor?.Pages.getSelected()?.getId() || ''} onChange={event => { if (editor) editor.UndoManager.skip(() => editor.Pages.select(event.target.value)); }}>
        {editor?.Pages.getAll().map((page, index) => <option key={page.getId()} value={page.getId()}>{page.getName() || '홈'} · {index ? `page-${index + 1}.html` : 'index.html'}</option>)}
      </select>
      {/* 메뉴 항목은 기존 속성 패널로 연결해 같은 설정을 두 곳에서 관리하지 않는다. */}
      <select className="element-properties-menu" aria-label="요소 속성" disabled={!editor} value="" onChange={event => {
        const label = event.target.value;
        if (!label || !editor) return;
        const component = selected || editor.getWrapper();
        if (component) { editor.UndoManager.skip(() => editor.select(component)); setSelected(component); }
        setPanel('properties');
        requestAnimationFrame(() => {
          const input = document.querySelector<HTMLElement>(`#properties-panel [aria-label="${label}"]`);
          input?.scrollIntoView({ block: 'center' }); input?.focus({ preventScroll: true });
        });
      }}><option value="">요소 속성 ▾</option>{[['너비', '크기'], ['정렬', '텍스트 정렬'], ['요소 좌우 정렬', '요소 정렬'], ['배치 방식', '컨테이너 배치'], ['안쪽 여백 위', '방향별 여백'], ['마진 위', '방향별 마진'], ['포지션', '포지션'], ['배경 색상', '배경색'], ['테두리 굵기 (px)', '테두리 굵기'], ['모서리 (px)', '모서리 곡률'], ['안쪽 여백 (px)', '안쪽 여백'], ['바깥 여백 (px)', '마진'], ['불투명도 (%)', '투명도'], ['폰트 종류', '폰트'], ['글자 크기 (px)', '글자 크기'], ['폰트 굵기', '폰트 굵기']].map(([value, label]) => <option key={value} value={value} disabled={value === '배치 방식' && Boolean(selected && selected !== editor?.getWrapper() && !isContainer(selected))}>{label}</option>)}</select>
    </div>, toolbarHost)}
    <div className="maker-toolbar"><div className="project-heading"><span className="section-kicker">YOUR WORKSPACE</span><label>프로젝트 이름<input aria-label="프로젝트 이름" maxLength={80} value={name} onChange={event => { setName(event.target.value); memory.current.dirty = true; }} /></label></div><div className="device-controls" aria-label="캔버스 화면 크기">{([['desktop', 'PC'], ['tablet', '태블릿'], ['mobile', '모바일']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={device === value} onClick={() => chooseDevice(value)}>{label}</button>)}</div><button className="preview-button" type="button" disabled={!editor} onClick={() => { if (editor) setPreview(previewDocument(editor, previewGuides)); }}>미리보기 ↗</button></div>
    <div className="mobile-panel-tabs"><button type="button" aria-expanded={panel === 'blocks'} aria-controls="blocks-panel" onClick={() => setPanel(panel === 'blocks' ? null : 'blocks')}>▦ 블록·구조</button><button type="button" aria-expanded={panel === 'properties'} aria-controls="properties-panel" onClick={() => setPanel(panel === 'properties' ? null : 'properties')}>⚙ 속성 {selected ? '· 선택됨' : ''}</button></div>
    <p className="maker-notice" role="status">{notice}</p>
    <div className="maker-workspace"><aside id="blocks-panel" className={`maker-panel blocks-panel ${panel === 'blocks' ? 'panel-open' : ''}`}><div className="panel-heading"><h2>블록 추가</h2><small>클릭 또는 PC 드래그</small></div><div className="block-buttons">{blockCatalog.map(block => <button key={block.id} type="button" disabled={!editor} onMouseDown={event => { if (event.button === 0 && editor && event.detail === 1) editor.Blocks.startDrag(editor.Blocks.get(block.id), event.nativeEvent); }} onClick={() => { if (editor) { insertBlock(editor, block.id, selected); setNotice(`${block.label} 블록을 추가했습니다.`); } }}><span aria-hidden="true">{block.icon}</span>{block.label}</button>)}</div><p className="editor-help">빈 구역에도 블록을 넣을 수 있습니다. 터치는 클릭 삽입과 이동 버튼을 이용하세요.</p><h2 className="panel-subtitle">페이지 구조</h2>{editor && <StructureTree editor={editor} selected={selected} onSelect={component => { editor.select(component); setSelected(component); }} />}</aside>
      <div className="canvas-column"><div className="canvas-heading"><span>편집 캔버스</span><small>{device === 'desktop' ? '가용 너비' : device === 'tablet' ? '768 px' : '375 px'} · 넓은 화면은 가로로 이동</small></div><div className="canvas-host" ref={host} /><div className="canvas-bottom-note">편집 상태는 이 탭에서 페이지를 이동하는 동안 유지됩니다. 새로고침·탭 종료 시 초기화됩니다.</div></div>
      <aside id="properties-panel" className={`maker-panel properties-panel ${panel === 'properties' ? 'panel-open' : ''}`}><div className="panel-heading"><h2>속성</h2><small>내용과 모양 다듬기</small></div>{editor && selected && (selected.parent() || selected === editor.getWrapper()) ? <PropertiesPanel key={selected.cid} editor={editor} selected={selected} notify={setNotice} /> : <p className="panel-empty">캔버스의 블록을 누르거나<br />페이지 구조에서 선택하세요.</p>}</aside>
    </div>
    {editor && <ContextMenu editor={editor} active={active && !preview && !pending && !incoming} onSelect={component => { editor.select(component); setSelected(component); }} notify={setNotice} onShortcut={(kind, component) => { editor.select(component); setSelected(component); setPanel('properties'); requestAnimationFrame(() => { const label = kind === 'properties' ? '정렬' : kind === 'size' ? '너비' : kind === 'image' ? '이미지 업로드' : '글자 색상'; const input = document.querySelector<HTMLElement>(`#properties-panel [aria-label="${label}"]`); input?.scrollIntoView({ block: 'center' }); input?.focus(); }); }} />}
    {pending && <div className="editor-modal-backdrop"><div className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="switch-title"><h2 id="switch-title">새 시작점으로 바꿀까요?</h2><p>현재 작업을 유지하고 있습니다. {pending.sample ? findSample(pending.sample)?.name : '빈 프로젝트'}로 바꾸면 기존 내용과 실행 기록이 초기화됩니다.</p><div><button autoFocus type="button" onClick={keepProject}>현재 작업 유지</button><button type="button" className="preview-button" onClick={switchProject}>새로 시작</button></div></div></div>}
    {incoming && <div className="editor-modal-backdrop"><div className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title"><h2 id="import-title">프로젝트를 불러올까요?</h2><p>검증한 파일: {incoming.project.name}<br />현재 작업을 이 프로젝트로 바꿉니다. 기존 작업이 필요하면 먼저 ZIP으로 저장해 주세요.</p><div><button autoFocus type="button" onClick={() => setIncoming(undefined)}>현재 작업 유지</button><button type="button" className="preview-button" onClick={applyProject}>검증한 프로젝트 불러오기</button></div></div></div>}
    {preview && <div className="editor-modal-backdrop"><div className="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title"><div className="preview-toolbar"><h2 id="preview-title">사이트 미리보기</h2><button type="button" aria-pressed={previewGuides} onClick={() => { const next = !previewGuides; setPreviewGuides(next); if (editor) setPreview(previewDocument(editor, next)); }}>구역 경계 {previewGuides ? '끄기' : '보기'}</button><div className="device-controls">{([['desktop', 'PC'], ['tablet', '태블릿'], ['mobile', '모바일']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={device === value} onClick={() => chooseDevice(value)}>{label}</button>)}</div><button type="button" autoFocus onClick={() => setPreview(undefined)}>편집으로 돌아가기</button></div>{previewGuides && <p className="editor-help" role="status">초록 점선: 구역 · 파란 점선: 내부 컨테이너. 경계는 내보낸 사이트에 포함되지 않습니다.</p>}<div className="preview-stage"><iframe title="제작 사이트 미리보기" sandbox="allow-popups allow-same-origin" srcDoc={preview} style={{ width: device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '375px' }} /></div></div></div>}
  </section>;
}

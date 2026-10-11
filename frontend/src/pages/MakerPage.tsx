import { CategoryInspector } from '../features/editor/CategoryInspector';
import { ElementRenameDialog } from '../features/editor/ElementRenameDialog';
import { CommandCategory } from '../features/editor/CommandCategory';
import { normalizeElementNames, suspendElementNames } from '../features/editor/elementNames';
// 반응형 제작 화면. 엔진 인스턴스를 유지하고 React 패널로 클릭·터치 편집을 제공한다.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Component, Editor } from 'grapesjs';
import { blockCatalog } from '../features/blocks/definitions';
import { normalizePageNames, configureBody, createEditor, insertBlock, isContainer, previewDocument, resetProject } from '../features/editor/engine';
import { PropertiesPanel } from '../features/editor/PropertiesPanel';
import { useProject } from '../features/project/ProjectContext';
import { captureProject } from '../features/project/snapshot';
import { importProject } from '../features/project/import';
import { buildSitePackage, downloadPackage } from '../features/export/package';
import { pageNameError } from '../features/project/pageFiles';
import { HelpTip } from '../features/editor/HelpTip';
import { attachCanvasGuides } from '../features/editor/canvasGuides';
import { PageTabs } from '../features/editor/PageTabs';
import { ProjectFileDialog } from '../features/editor/ProjectFileDialog';
import { DockWidthDivider } from '../features/editor/DockWidthDivider';
import { DockDivider } from '../features/editor/DockDivider';
import type { RestoredProject } from '../features/project/format';
import { findSample, type SampleId } from '../shared/samples';
import 'grapesjs/dist/css/grapes.min.css';
import '../features/editor/editor.css';
import { StructureTree } from '../features/editor/StructureTree';
import { ContextMenu } from '../features/editor/ContextMenu';
import { focusProperty } from '../features/editor/PropertyCategory';
import { MakerHelpDialog } from '../features/editor/MakerHelpDialog';

type Device = 'desktop' | 'tablet' | 'mobile';
export function MakerPage({ active, toolbarHost }: { active: boolean; toolbarHost: HTMLDivElement | null }) {
  const host = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Editor | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { memory, runtime, setReady, name, setName } = useProject();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [renaming, setRenaming] = useState<Component>();
  const [selected, setSelected] = useState<Component>();
  const [, refresh] = useState(0);
  const [panel, setPanel] = useState<'blocks' | 'structure' | 'properties' | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [preview, setPreview] = useState<string>();
  const [previewGuides, setPreviewGuides] = useState(false);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{ sample?: SampleId }>();
  const [incoming, setIncoming] = useState<RestoredProject>();
  const [utility, setUtility] = useState<'help' | 'info' | 'import' | 'export' | 'page' | 'rename'>();
  const [canvasGuides, setCanvasGuides] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [dockWidth, setDockWidth] = useState(310);
  const [dockRatio, setDockRatio] = useState(32);
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
    if (!active || (!preview && !pending && !incoming && !utility && !renaming)) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('.maker-page [role="dialog"]');
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,summary') || []);
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPreview(undefined); setPending(undefined); setIncoming(undefined); setUtility(undefined); setRenaming(undefined); }
      if (event.key === 'Tab') {
        const items = controls(); const first = items[0]; const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, [active, pending, preview, incoming, utility, renaming]);

  useEffect(() => editor ? attachCanvasGuides(editor, canvasGuides) : undefined, [editor, canvasGuides]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 5000); return () => window.clearTimeout(timer); }, [notice]);
  const changeZoom = (value: number) => { const next = Math.max(25, Math.min(200, value)); editor?.Canvas.setZoom(next); setZoom(next); };
  useEffect(() => {
    if (!editor || !active) return;
    const wheel = (event: WheelEvent) => { if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); const next = Math.max(25, Math.min(200, editor.Canvas.getZoom() + (event.deltaY < 0 ? 10 : -10))); editor.Canvas.setZoom(next); setZoom(next); };
    const frame = () => editor.Canvas.getDocument()?.addEventListener('wheel', wheel, { passive: false });
    frame(); host.current?.addEventListener('wheel', wheel, { passive: false }); editor.on('canvas:frame:load', frame);
    return () => { editor.Canvas.getDocument()?.removeEventListener('wheel', wheel); host.current?.removeEventListener('wheel', wheel); editor.off('canvas:frame:load', frame); };
  }, [editor, active]);
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
    editor.UndoManager.stop(); suspendElementNames(editor, true);
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
      normalizePageNames(editor); normalizeElementNames(editor); memory.current.start = incoming.project.start; memory.current.initialized = true; memory.current.data = editor.getProjectData(); memory.current.dirty = false;
      setUtility(undefined); setName(incoming.project.name); setSelected(undefined); setIncoming(undefined); editor.UndoManager.clear();
      seenSearch.current = incoming.project.start ? `?sample=${incoming.project.start}` : '';
      navigate(`/maker${seenSearch.current}`, { replace: true }); setNotice('프로젝트와 이미지를 복원했습니다. 계속 편집할 수 있습니다.'); refresh(value => value + 1);
    } catch { editor.loadProjectData(previous); setNotice('프로젝트 적용에 실패해 기존 작업으로 복구했습니다.'); }
    finally { suspendElementNames(editor, false); editor.UndoManager.start(); }
  };

  return <section className="maker-page" hidden={!active} aria-label="사이트 제작">
    {/* 편집 핸들러는 유지하고 프로젝트 명령만 로고 옆 헤더로 표시한다. */}
    {active && toolbarHost && createPortal(<div className="maker-command-menu" onClick={event => { if ((event.target as HTMLElement).closest('button')) event.currentTarget.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(item => { item.open = false; }); }} aria-label="프로젝트 작업">
      <CommandCategory title="프로젝트"><div><button type="button" onClick={() => setPending({})}>새 프로젝트</button><button type="button" disabled={!editor} onClick={() => setUtility('export')}>저장·내보내기</button><button type="button" disabled={!editor} onClick={() => { setIncoming(undefined); setUtility('import'); }}>불러오기</button></div></CommandCategory>
      <input ref={fileInput} type="file" aria-label="프로젝트 ZIP 파일" accept=".zip,application/zip" hidden onChange={event => { void readProject(event.target.files?.[0]); event.target.value = ''; }} />
      <CommandCategory title="편집"><div><button type="button" disabled={!editor?.UndoManager.hasUndo()} onClick={() => editor?.UndoManager.undo()}>실행 취소</button><button type="button" disabled={!editor?.UndoManager.hasRedo()} onClick={() => editor?.UndoManager.redo()}>다시 실행</button>      {/* 메뉴 항목은 기존 속성 패널로 연결해 같은 설정을 두 곳에서 관리하지 않는다. */}
      <select className="element-properties-menu" aria-label="요소 속성" disabled={!editor} value="" onChange={event => {
        const label = event.target.value;
        if (!label || !editor) return;
        const component = selected || editor.getWrapper();
        if (component) { editor.UndoManager.skip(() => editor.select(component)); setSelected(component); }
        setPanel('properties');
        requestAnimationFrame(() => {
          focusProperty(label);
        });
      }}><option value="">요소 속성</option>{[['너비', '크기'], ['정렬', '텍스트 정렬'], ['요소 좌우 정렬', '요소 정렬'], ['배치 방식', '컨테이너 배치'], ['안쪽 여백 위', '방향별 여백'], ['마진 위', '방향별 마진'], ['포지션', '포지션'], ['배경 색상', '배경색'], ['테두리 굵기 (px)', '테두리 굵기'], ['모서리 (px)', '모서리 곡률'], ['안쪽 여백 (px)', '안쪽 여백'], ['바깥 여백 (px)', '마진'], ['불투명도 (%)', '투명도'], ['폰트 종류', '폰트'], ['글자 크기 (px)', '글자 크기'], ['폰트 굵기', '폰트 굵기']].map(([value, label]) => <option key={value} value={value} disabled={value === '배치 방식' && Boolean(selected && selected !== editor?.getWrapper() && !isContainer(selected))}>{label}</option>)}</select></div></CommandCategory>

      <CommandCategory title="도움말"><div><button type="button" onClick={() => setUtility('help')}>사용 도움말</button><button type="button" onClick={() => setUtility('info')}>제작정보</button></div></CommandCategory>
    </div>, toolbarHost)}
    <div className="maker-toolbar"><div className="project-heading"><span className="section-kicker">YOUR WORKSPACE</span><label>프로젝트 이름<input aria-label="프로젝트 이름" maxLength={80} value={name} onChange={event => { setName(event.target.value); memory.current.dirty = true; }} /></label></div><span className="breadcrumb-divider" aria-hidden="true">/</span><div className="page-heading"><button className="rename-page-button" type="button" disabled={!editor} onClick={() => setUtility('rename')}>이름 변경</button><button className="new-page-button" type="button" disabled={!editor || editor.Pages.getAll().length >= 20} onClick={() => setUtility('page')}>＋ 새 페이지</button></div><div className="device-controls" aria-label="캔버스 화면 크기">{([['desktop', 'PC'], ['tablet', '태블릿'], ['mobile', '모바일']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={device === value} onClick={() => chooseDevice(value)}>{label}</button>)}</div><button className="preview-button" type="button" disabled={!editor} onClick={() => { if (editor) setPreview(previewDocument(editor, previewGuides)); }}>미리보기 ↗</button></div>
    <div className="page-navigation"><PageTabs editor={editor} />
    <div className="mobile-panel-tabs"><button type="button" aria-expanded={panel === 'blocks'} aria-controls="blocks-panel" onClick={() => setPanel(panel === 'blocks' ? null : 'blocks')}>▦ 블록</button><button type="button" aria-expanded={panel === 'structure'} aria-controls="structure-panel" onClick={() => setPanel(panel === 'structure' ? null : 'structure')}>☷ 구조</button><button type="button" aria-expanded={panel === 'properties'} aria-controls="properties-panel" onClick={() => setPanel(panel === 'properties' ? null : 'properties')}>⚙ 속성 {selected ? '· 선택됨' : ''}</button></div>
    </div><div className={`maker-notice${notice ? ' notice-visible' : ''}`} role="status">{notice}</div>
    <div id="page-editing-panel" role="tabpanel" aria-labelledby={editor?.Pages.getSelected() ? `page-tab-${editor.Pages.getSelected()!.getId()}` : undefined} className="maker-workspace" style={{ '--dock-width': `${dockWidth}px` } as CSSProperties}><aside id="blocks-panel" className={`maker-panel blocks-panel ${panel === 'blocks' ? 'panel-open' : ''}`}><div className="panel-heading"><h2>블록 추가</h2><HelpTip text="구역 또는 body를 선택하고 블록을 눌러 추가하세요. PC에서는 드래그로 넣을 수 있습니다." /></div><div className="block-buttons">{blockCatalog.map(block => <button key={block.id} type="button" title={`${block.label}: 선택한 구역에 추가 · PC 드래그 지원`} disabled={!editor} onMouseDown={event => { if (event.button === 0 && editor && event.detail === 1) editor.Blocks.startDrag(editor.Blocks.get(block.id), event.nativeEvent); }} onClick={() => { if (editor) { insertBlock(editor, block.id, selected); setNotice(`${block.label} 블록을 추가했습니다.`); } }}><span aria-hidden="true">{block.icon}</span>{block.label}</button>)}</div></aside>
      <div className="canvas-column"><div className="canvas-heading"><span>편집 캔버스</span><div className="canvas-view-controls"><div className="zoom-controls" aria-label="캔버스 확대 축소" onWheel={event => { changeZoom(zoom + (event.deltaY < 0 ? 10 : -10)); }}><button type="button" aria-label="축소" onClick={() => changeZoom(zoom - 10)}>−</button><button type="button" title="스크롤로 확대·축소, 클릭하면 100%" onClick={() => changeZoom(100)}>{zoom}%</button><button type="button" aria-label="확대" onClick={() => changeZoom(zoom + 10)}>＋</button></div><button type="button" className="canvas-guides-toggle" title="요소의 경계와 이름을 표시합니다. 출력 파일에는 포함되지 않습니다." aria-pressed={canvasGuides} onClick={() => setCanvasGuides(value => !value)}>{canvasGuides ? '구역 경계 숨기기' : '구역 경계 보기'}</button></div></div><div className="canvas-host" ref={host} /></div>
      <DockWidthDivider value={dockWidth} changed={setDockWidth} /><div id="right-dock" style={{ gridTemplateRows: `minmax(80px, ${dockRatio}fr) 8px minmax(100px, ${100 - dockRatio}fr)` }} className={`right-dock ${panel === 'structure' || panel === 'properties' ? 'panel-open' : ''}`}><aside id="structure-panel" className="maker-panel structure-panel"><div className="panel-heading"><h2>페이지 구조</h2><HelpTip text="페이지 → body → 요소 순서입니다. 화살표로 접고 펼치며 요소를 누르면 선택합니다." /></div>{editor && <StructureTree editor={editor} selected={selected} onSelect={component => { editor.select(component); setSelected(component); }} />}</aside><DockDivider value={dockRatio} changed={setDockRatio} /><aside id="properties-panel" className={`maker-panel properties-panel ${panel === 'properties' ? 'panel-open' : ''}`}><div className="panel-heading"><h2>속성</h2><HelpTip text="선택한 요소의 내용·크기·배치를 수정합니다. 왼쪽 아이콘으로 카테고리를 선택하세요. 아이콘에 마우스를 올리면 이름을 확인할 수 있습니다." /></div>{editor && selected && (selected.parent() || selected === editor.getWrapper()) ? <CategoryInspector key={selected.cid}><PropertiesPanel editor={editor} selected={selected} notify={setNotice} /></CategoryInspector> : <p className="panel-empty" title="캔버스 또는 페이지 구조에서 요소를 선택하세요.">선택한 요소 없음</p>}</aside></div>
    </div>
    {editor && <ContextMenu editor={editor} active={active && !preview && !pending && !incoming && !utility && !renaming} onSelect={component => { editor.select(component); setSelected(component); }} notify={setNotice} onShortcut={(kind, component) => { if (kind === 'rename') { setRenaming(component); return; } editor.select(component); setSelected(component); setPanel('properties'); requestAnimationFrame(() => { const label = kind === 'properties' ? '정렬' : kind === 'size' ? '너비' : kind === 'image' ? '이미지 업로드' : kind === 'image-url' ? '이미지 주소' : '글자 색상'; focusProperty(label); }); }} />}
    {editor && <ElementRenameDialog editor={editor} active={active && !preview && !pending && !incoming && !utility && !renaming} component={renaming} request={setRenaming} close={() => setRenaming(undefined)} />}
    {(utility === 'help' || utility === 'info') && <MakerHelpDialog kind={utility} close={() => setUtility(undefined)} />}
    {(utility === 'import' || utility === 'export' || utility === 'page' || utility === 'rename') && <ProjectFileDialog kind={utility} editor={editor} name={name} incoming={incoming} importing={importing} notice={notice} close={() => { setUtility(undefined); setIncoming(undefined); }} chooseFile={() => { setIncoming(undefined); fileInput.current?.click(); }} apply={applyProject} createPage={pageName => { if (!editor) return; const error = pageNameError(pageName, editor.Pages.getAll().filter(page => utility !== 'rename' || page !== editor.Pages.getSelected()).map(page => page.getName())); if (error) { setNotice(error); return; } if (utility === 'rename') { editor.Pages.getSelected()?.setName(pageName); memory.current.dirty = true; refresh(value => value + 1); setUtility(undefined); return; } const page = editor.Pages.add({ id: 'page-' + crypto.randomUUID(), name: pageName, component: [] }); if (page) { editor.Pages.select(page); configureBody(editor); setSelected(undefined); memory.current.dirty = true; setUtility(undefined); } }} save={async hosting => { if (!editor) return; downloadPackage(await buildSitePackage(captureProject(editor), name, memory.current.start, hosting)); setNotice('ZIP 다운로드를 시작했습니다.'); }} />}
    {pending && <div className="editor-modal-backdrop"><div className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="switch-title"><h2 id="switch-title">새 시작점으로 바꿀까요?</h2><p>현재 작업을 유지하고 있습니다. {pending.sample ? findSample(pending.sample)?.name : '빈 프로젝트'}로 바꾸면 기존 내용과 실행 기록이 초기화됩니다.</p><div><button autoFocus type="button" onClick={keepProject}>현재 작업 유지</button><button type="button" className="preview-button" onClick={switchProject}>새로 시작</button></div></div></div>}
    {incoming && utility !== 'import' && <div className="editor-modal-backdrop"><div className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title"><h2 id="import-title">프로젝트를 불러올까요?</h2><p>검증한 파일: {incoming.project.name}<br />현재 작업을 이 프로젝트로 바꿉니다. 기존 작업이 필요하면 먼저 ZIP으로 저장해 주세요.</p><div><button autoFocus type="button" onClick={() => setIncoming(undefined)}>현재 작업 유지</button><button type="button" className="preview-button" onClick={applyProject}>검증한 프로젝트 불러오기</button></div></div></div>}
    {preview && <div className="editor-modal-backdrop"><div className="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title"><div className="preview-toolbar"><h2 id="preview-title">사이트 미리보기</h2><button type="button" aria-pressed={previewGuides} onClick={() => { const next = !previewGuides; setPreviewGuides(next); if (editor) setPreview(previewDocument(editor, next)); }}>구역 경계 {previewGuides ? '끄기' : '보기'}</button><div className="device-controls">{([['desktop', 'PC'], ['tablet', '태블릿'], ['mobile', '모바일']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={device === value} onClick={() => chooseDevice(value)}>{label}</button>)}</div><button type="button" autoFocus onClick={() => setPreview(undefined)}>편집으로 돌아가기</button></div>{previewGuides && <p className="editor-help" role="status">초록 점선: 구역 · 파란 점선: 내부 컨테이너. 경계는 내보낸 사이트에 포함되지 않습니다.</p>}<div className="preview-stage"><iframe title="제작 사이트 미리보기" sandbox="allow-popups allow-same-origin" srcDoc={preview} style={{ width: device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '375px' }} /></div></div></div>}
  </section>;
}

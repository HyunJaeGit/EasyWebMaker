import type { Editor } from 'grapesjs';

export function PageTabs({ editor }: { editor: Editor | null }) {
  const pages = editor?.Pages.getAll() || [];
  const selected = editor?.Pages.getSelected();
  const select = (index: number) => { const page = pages[index]; if (!editor || !page) return; editor.UndoManager.skip(() => editor.Pages.select(page)); document.getElementById(`page-tab-${page.getId()}`)?.focus(); };
  return <div className="page-tabs" role="tablist" aria-label="프로젝트 페이지">
    {pages.map((page, index) => <button type="button" key={page.getId()} id={`page-tab-${page.getId()}`} role="tab" aria-selected={page === selected} aria-controls="page-editing-panel" tabIndex={page === selected ? 0 : -1} onClick={() => select(index)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % pages.length : event.key === 'ArrowLeft' ? (index + pages.length - 1) % pages.length : event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : undefined;
      if (next !== undefined) { event.preventDefault(); select(next); }
    }}><span aria-hidden="true">▤</span>{page.getName()}.html</button>)}
  </div>;
}

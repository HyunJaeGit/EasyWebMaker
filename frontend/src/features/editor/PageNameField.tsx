// 페이지 표시 이름만 수정한다. ID와 정적 출력 파일명은 유지해 참조가 변하지 않게 한다.
import { useEffect, useState } from 'react';
import type { Page } from 'grapesjs';
export function PageNameField({ page, changed }: { page?: Page; changed: () => void }) {
  const name = page?.getName() || '홈';
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState('');
  useEffect(() => { setDraft(name); setError(''); }, [page, name]);
  const commit = () => {
    if (!page) return;
    const next = draft.trim();
    if (!next || next.length > 80) { setError('페이지 이름을 1~80자로 입력하세요.'); return; }
    setError(''); setDraft(next);
    if (next !== name) { page.setName(next); changed(); }
  };
  return <label className="page-name-field">페이지 이름<input aria-label="페이지 이름" value={draft} disabled={!page} maxLength={80} aria-invalid={Boolean(error)} aria-describedby={error ? 'page-name-error' : undefined} onChange={event => { setDraft(event.target.value); setError(''); }} onBlur={commit} onKeyDown={event => {
    if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
    if (event.key === 'Escape') { setDraft(name); setError(''); }
  }} />{error && <small id="page-name-error" role="alert">{error}</small>}</label>;
}

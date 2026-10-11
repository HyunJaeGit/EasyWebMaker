// 숫자와 단위를 임시 입력으로 받고 확정할 때만 모델을 변경해 undo 기록을 보존한다.
import { useEffect, useState } from 'react';
export function SizeField({ property, label, value, apply }: { property: string; label: string; value: string; apply: (property: string, value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  useEffect(() => { setDraft(value); setError(''); }, [value]);
  const commit = () => {
    const next = draft.trim().toLowerCase();
    const signed = /^(margin-(top|right|bottom|left)|top|right|bottom|left)$/.test(property);
    const valid = !next || (/^(auto|none|0|-?\d+(?:\.\d+)?(?:px|%|vh|vw|rem))$/.test(next) && CSS.supports(property, next) && (Math.abs(Number.parseFloat(next)) <= 10000 || ['auto', 'none'].includes(next)) && (signed || !next.startsWith('-')));
    if (!valid) { setError(`예: 100%, 320px, 20rem. ${signed ? '-10000' : '0'}~10000 범위에서 이 속성에 맞는 값을 입력하세요.`); return; }
    setError(''); if (next !== value) apply(property, next);
  };
  return <label className="editor-field">{label}<input aria-label={label} value={draft} placeholder="기본값 (예: 100%, 320px)" aria-invalid={Boolean(error)} aria-describedby={error ? `size-${property}-error` : undefined} onChange={event => { setDraft(event.target.value); setError(''); }} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} />{error && <small id={`size-${property}-error`} role="alert">{error}</small>}</label>;
}

import { useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { blockCatalog, type BlockKind } from '../blocks/definitions';
import { variantsFor } from '../blocks/variants';
import { insertBlock } from './engine';
import { BlockIcon } from './BlockIcon';
import { BlockSampleDialog } from './BlockSampleDialog';

export function BlockPicker({ editor, selected, notify }: { editor?: Editor | null; selected?: Component; notify: (message: string) => void }) {
  const [expanded, setExpanded] = useState<BlockKind>();
  return <><div className="block-buttons">{blockCatalog.map(block => <div className="block-picker-item" key={block.id}><div className="block-picker-heading">
    <button type="button" aria-label={`${block.label} 기본형 추가`} title={`${block.label}: 기본형 추가 · PC 드래그 지원`} disabled={!editor} onMouseDown={event => { if (event.button === 0 && editor && event.detail === 1) editor.Blocks.startDrag(editor.Blocks.get(block.id), event.nativeEvent); }} onClick={() => { if (editor) { insertBlock(editor, block.id, selected); notify(`${block.label} 기본형을 추가했습니다.`); } }}><BlockIcon kind={block.id} /><span className="block-picker-label">{block.label}</span></button>
    {variantsFor(block.id) && <button className="block-variants-toggle" type="button" disabled={!editor} aria-label={`${block.label} 샘플 펼치기`} title="샘플 구조 선택" aria-haspopup="dialog" aria-expanded={expanded === block.id} onClick={() => setExpanded(block.id)}>▾</button>}
  </div></div>)}</div>{expanded && editor && <BlockSampleDialog kind={expanded} choose={variant => { insertBlock(editor, expanded, selected, variant.id); notify(`${blockCatalog.find(block => block.id === expanded)!.label} ${variant.label}을 추가했습니다.`); setExpanded(undefined); }} close={() => setExpanded(undefined)} />}</>;
}

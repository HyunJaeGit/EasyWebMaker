// ZIP 안의 재편집 규격. 엔진의 임의 속성·스크립트 대신 허용된 블록 데이터만 저장한다.
import type { ComponentDefinitionDefined } from 'grapesjs';
import type { SampleId } from '../../shared/samples';

export const FORMAT = 'easy-web-maker';
export const FORMAT_VERSION = 1;
export const requiredOutputs = ['index.html', 'styles.css', 'script.js'] as const;
export type OutputName = typeof requiredOutputs[number];
export interface SavedBlock {
  type: 'ew-container' | 'ew-text' | 'ew-link' | 'ew-image';
  id: string;
  name: string;
  tagName: string;
  classes: string[];
  attributes: Record<string, string>;
  style: Record<string, string>;
  content: string;
  children: SavedBlock[];
  asset?: string;
}
export interface AssetRecord { path: string; mime: string; role: 'image' | 'font' | 'license'; size: number; sha256: string }
export interface SavedProject {
  format: typeof FORMAT;
  version: typeof FORMAT_VERSION;
  name: string;
  start?: SampleId;
  blocks: SavedBlock[];
  css: string;
  assets: AssetRecord[];
  outputs: Record<OutputName, string>;
}
export interface ProjectSnapshot { blocks: SavedBlock[]; css: string; html: string }
export interface RestoredProject { project: SavedProject; components: ComponentDefinitionDefined[] }

// 텍스트는 textnode로 만들어 HTML로 실행되지 않게 복원한다. 모델 기본값은 등록된 블록을 사용한다.
export function restoredComponents(blocks: SavedBlock[], assets: ReadonlyMap<string, string>): ComponentDefinitionDefined[] {
  return blocks.map(block => ({ type: block.type, tagName: block.tagName, name: block.name, classes: block.classes, attributes: { ...block.attributes, id: block.id, ...(block.type === 'ew-container' ? { 'data-ew-container': 'true' } : {}) }, style: block.style,
    ...(block.type === 'ew-image' ? { src: assets.get(block.asset || '') } : {}),
    components: block.type === 'ew-container' ? restoredComponents(block.children, assets) : block.type === 'ew-image' ? [] : [{ type: 'textnode', content: block.content }],
  }));
}

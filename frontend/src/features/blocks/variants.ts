import type { ComponentDefinitionDefined } from 'grapesjs';
import { container, createBlock, createCard, type BlockKind } from './definitions';

export const blockVariants = {
  header: [{ id: 'basic', label: '기본형', description: '브랜드와 메뉴를 한 줄에 배치', layout: 'header-basic' }, { id: 'center', label: '중앙형', description: '브랜드 아래에 메뉴를 중앙 배치', layout: 'header-center' }, { id: 'action', label: '액션형', description: '브랜드 · 메뉴 · 문의 버튼', layout: 'header-action' }],
  hero: [{ id: 'basic', label: '기본형', description: '제목과 설명 중심의 소개', layout: 'hero-basic' }, { id: 'split', label: '분할형', description: '소개 글과 이미지를 나란히 배치', layout: 'hero-split' }, { id: 'center', label: '중앙형', description: '강조된 제목과 두 개의 버튼', layout: 'hero-center' }],
  cards: [{ id: 'basic', label: '기본형', description: '세 개의 텍스트 카드', layout: 'cards-basic' }, { id: 'image', label: '이미지형', description: '이미지와 설명이 있는 카드', layout: 'cards-image' }, { id: 'list', label: '목록형', description: '세로로 읽는 소식 목록', layout: 'cards-list' }],
  footer: [{ id: 'basic', label: '기본형', description: '사이트명과 제작 정보', layout: 'hero-basic' }, { id: 'center', label: '중앙형', description: '정보를 중앙에 모은 푸터', layout: 'hero-center' }, { id: 'columns', label: '열 구분형', description: '사이트 소개와 안내 메뉴를 구분', layout: 'hero-split' }],
  gallery: [{ id: 'basic', label: '격자형', description: '사진 세 장을 격자로 배치 · 기본', layout: 'cards-image' }, { id: 'list', label: '목록형', description: '사진과 설명을 세로로 배치', layout: 'cards-list' }],
  cta: [{ id: 'basic', label: '기본형', description: '안내 문구와 하나의 버튼', layout: 'hero-basic' }, { id: 'center', label: '중앙형', description: '중앙 안내와 두 개의 버튼', layout: 'hero-center' }],
  contact: [{ id: 'basic', label: '기본형', description: '주소 · 운영 시간 · 이메일', layout: 'hero-basic' }, { id: 'center', label: '중앙형', description: '연락 정보를 중앙 배치', layout: 'header-center' }],
} as const;
export type VariantId = 'basic' | 'center' | 'action' | 'split' | 'image' | 'list' | 'columns';
export function variantsFor(kind: BlockKind) { return kind in blockVariants ? blockVariants[kind as keyof typeof blockVariants] : undefined; }
export function createVariant(kind: BlockKind, variant: VariantId = 'basic'): ComponentDefinitionDefined {
  const base = createBlock(kind);
  if (variant === 'basic' || !variantsFor(kind)?.some(item => item.id === variant)) return base;
  const children = base.components as ComponentDefinitionDefined[];
  const styled = (component: ComponentDefinitionDefined, style: Record<string, string>) => ({ ...component, style: { ...component.style, ...style } });
  const button = (content: string) => ({ ...createBlock('link'), content, classes: ['ew-button'] });
  if (kind === 'footer' && variant === 'center') return styled({ ...base, name: '푸터 중앙형' }, { 'text-align': 'center', 'background-color': '#e4edf6' });
  if (kind === 'footer') return styled(container('푸터 열 구분형', [styled(container('사이트 소개', children, 'div'), { width: '100%', 'max-width': '420px' }), container('안내 메뉴', [{ ...createBlock('link'), content: '소개' }, { ...createBlock('link'), content: '소식', attributes: { href: '#news' } }, { ...createBlock('link'), content: '연락처', attributes: { href: '#contact' } }], 'nav', ['ew-menu'])], 'footer', ['ew-footer']), { display: 'flex', 'flex-wrap': 'wrap', 'justify-content': 'space-between', gap: '24px' });
  if (kind === 'gallery') return container('갤러리 목록형', [children[0], ...Array.from({ length: 3 }, (_, index) => styled(container('사진 설명', [styled(createBlock('image'), { width: '100%', 'max-width': '360px' }), { type: 'ew-text', tagName: 'p', content: `사진 ${index + 1}의 이야기를 입력하세요.` }], 'article', ['ew-card']), { display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: '24px', margin: '0 0 16px' }))], 'section', ['ew-section']);
  if (kind === 'cta') return styled(container('안내·CTA 중앙형', [...children.slice(0, 2), styled(container('안내 버튼', [button('시작하기'), button('더 알아보기')], 'div', ['ew-menu']), { 'justify-content': 'center' })], 'section', ['ew-section']), { 'text-align': 'center', 'background-color': '#e7efdb', 'border-radius': '12px' });
  if (kind === 'contact') return styled({ ...base, name: '연락처 중앙형' }, { 'text-align': 'center', 'background-color': '#f6f8fa' });
  if (kind === 'header' && variant === 'center') return styled(container('헤더·메뉴 중앙형', [children[0], styled(children[1], { 'justify-content': 'center', 'flex-wrap': 'wrap' })], 'header', ['ew-header']), { display: 'flex', 'flex-direction': 'column', 'text-align': 'center', gap: '16px', padding: '24px' });
  if (kind === 'header') return styled(container('헤더·메뉴 액션형', [...children, styled(button('문의하기'), { 'background-color': '#216e43', color: '#ffffff', padding: '10px 18px', 'border-radius': '8px' })], 'header', ['ew-header']), { 'background-color': '#f6f8fa', 'flex-wrap': 'wrap', gap: '20px' });
  if (kind === 'hero' && variant === 'split') return styled(container('히어로 분할형', [styled(container('소개 글', [...children.slice(0, 3), button('더 알아보기')]), { width: '100%', 'max-width': '480px' }), styled(createBlock('image'), { width: '100%', 'max-width': '420px', 'border-radius': '16px' })], 'section', ['ew-hero']), { display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'center', gap: '32px', 'text-align': 'left', padding: '40px 24px' });
  if (kind === 'hero') return styled(container('히어로 중앙형', [...children.slice(0, 3), styled(container('안내 버튼', [button('시작하기'), button('더 알아보기')], 'div', ['ew-menu']), { 'justify-content': 'center', 'flex-wrap': 'wrap' })], 'section', ['ew-hero']), { 'text-align': 'center', 'background-color': '#e4edf6', padding: '48px 24px' });
  if (variant === 'image') return container('카드 묶음 이미지형', Array.from({ length: 3 }, () => { const card = createCard(); return { ...card, components: [styled(createBlock('image'), { width: '100%', 'border-radius': '8px' }), ...(card.components as ComponentDefinitionDefined[])] }; }), 'div', ['ew-cards']);
  return styled(container('카드 묶음 목록형', Array.from({ length: 3 }, () => styled(createCard(), { 'text-align': 'left', padding: '20px', 'border-radius': '8px' })), 'div', ['ew-cards']), { display: 'grid', 'grid-template-columns': '1fr', gap: '12px' });
}

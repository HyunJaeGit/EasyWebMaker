import type { BlockKind } from '../blocks/definitions';
const paths: Record<BlockKind, string> = {
  header: 'M3 4h18v16H3z M3 10h18 M6 7h3 M13 7h1 M17 7h1',
  hero: 'M3 4h18v16H3z M7 8h10 M7 12h7 M7 16h4',
  text: 'M4 5h16 M12 5v14 M8 19h8',
  image: 'M3 4h18v16H3z M3 17l6-6 4 4 3-3 5 5 M16 8h.01',
  cards: 'M2 5h5v14H2z M10 5h5v14h-5z M18 5h4v14h-4z',
  link: 'M10 13a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-3 3 M14 11a4 4 0 0 0-6 0l-4 4a4 4 0 0 0 6 6l3-3',
  section: 'M3 3h18v18H3z M7 7h10v10H7z',
  footer: 'M3 4h18v16H3z M3 14h18 M6 17h5 M15 17h3',
};
export function BlockIcon({ kind }: { kind: BlockKind }) {
  return <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[kind]} /></svg>;
}

// 같은 좌표계와 선 굵기로 속성 카테고리의 시각적 크기를 맞춘다.
const paths: Record<string, string> = {
  '요소 정보·작업': 'M12 8h.01 M12 11v6 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  '내용·링크·이미지': 'M5 3h10l4 4v14H5z M15 3v5h4 M8 12h8 M8 16h6',
  '배경 이미지': 'M3 4h18v16H3z M3 17l6-6 4 4 3-3 5 5 M16 8h.01',
  '크기': 'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5 M4 4l5 5 M20 4l-5 5 M4 20l5-5 M20 20l-5-5',
  '색상·투명도': 'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12z M9 15a3 3 0 0 0 3 3',
  '텍스트·폰트': 'M3 5h12 M9 5v14 M5 19h8 M16 19l3-8 3 8 M17 16h4',
  '테두리·전체 여백': 'M3 3h18v18H3z M8 8h8v8H8z',
  '요소 정렬': 'M12 3v18 M5 6h14v4H5z M8 14h8v4H8z',
  '컨테이너 배치': 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  '방향별 여백·마진': 'M8 8h8v8H8z M12 2v4 M10 4l2 2 2-2 M12 22v-4 M10 20l2-2 2 2 M2 12h4 M4 10l2 2-2 2 M22 12h-4 M20 10l-2 2 2 2',
  '포지션': 'M12 3v18 M3 12h18 M9 6l3-3 3 3 M9 18l3 3 3-3 M6 9l-3 3 3 3 M18 9l3 3-3 3',
  '구역 이동': 'M10 5H3v16h16v-7 M10 14L21 3 M14 3h7v7',
};
export function CategoryIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] || 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5'} /></svg>;
}

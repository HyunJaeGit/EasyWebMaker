// 홈 미리보기와 실제 편집 샘플에서 공유하는 식별자와 표시용 메타데이터.
export const samples = [
  { id: 'school', category: '학교 · 교육', name: '배움이 자라는 학교', institution: '새봄학교', description: '학교 소개부터 소식까지, 따뜻하고 신뢰감 있는 첫인상.', tone: '따뜻한 초록', sections: '소개 · 공지 · 연락처' },
  { id: 'public', category: '공공기관 · 지역', name: '시민과 가까운 기관', institution: '온빛생활문화원', description: '기관의 안내와 주요 서비스를 한눈에 전하는 구성.', tone: '차분한 파랑', sections: '서비스 · 소식 · 기관 정보' },
] as const;

export type SampleId = typeof samples[number]['id'];

export function findSample(value: string | null) {
  return samples.find((sample) => sample.id === value);
}

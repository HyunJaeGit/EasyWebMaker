// 가상 기관 미리보기. 메뉴와 공지는 장식용이며 서버 기능을 암시하지 않는다.
import type { SampleId } from './samples';

export function SitePreview({ kind = 'school' }: { kind?: SampleId }) {
  const school = kind === 'school';
  return <div className={`site-preview ${school ? 'school' : 'public'}`} aria-label={`${school ? '새봄학교' : '온빛생활문화원'} 가상 사이트 미리보기`}>
    <div className="sample-header"><span className="institution"><span className="institution-mark" aria-hidden="true">{school ? '✳' : '▦'}</span>{school ? '새봄학교' : '온빛생활문화원'}</span><span className="sample-menu">{school ? '학교 소개　 학교 소식　 오시는 길' : '문화원 소개　 이용 안내　 문화원 소식'}</span></div>
    <div className="sample-hero"><div><span className="sample-eyebrow">{school ? '함께 배우고, 함께 자라는 곳' : '문화로 연결되는 우리의 일상'}</span><h3>{school ? <>오늘의 배움이,<br />내일의 가능성으로.</> : <>당신의 일상에<br />문화를 더합니다.</>}</h3><p>{school ? '서로의 꿈을 응원하는 새봄학교입니다.' : '함께 누리는 문화, 함께 만드는 온빛.'}</p><span className="sample-hero-label">{school ? '우리 학교 이야기' : '문화원 이용 안내'} <span aria-hidden="true">↗</span></span></div><div className="sample-art" aria-hidden="true"><div className="art-sun" /><div className="art-hill back" /><div className="art-hill front" /><div className="art-building"><i /><i /><i /><i /><i /><i /></div><div className="art-tree" /></div></div>
    <div className="sample-bottom"><div className="sample-notice"><strong>{school ? '새봄 소식' : '문화원 소식'} <span aria-hidden="true">＋</span></strong><p>{school ? '새봄의 배움과 일상을 소개합니다' : '온빛의 공간과 프로그램을 소개합니다'}<small>예시 콘텐츠</small></p><p>{school ? '함께 읽는 우리 학교 이야기' : '모두에게 열린 생활문화 공간'}<small>예시 콘텐츠</small></p></div><div className="sample-info"><span aria-hidden="true">{school ? '⌂' : '▦'}</span><strong>{school ? '학교 소개' : '공간 안내'}</strong><small>{school ? '우리의 배움을 만나보세요' : '일상 가까이, 열린 공간'}</small></div><div className="sample-info"><span aria-hidden="true">↗</span><strong>{school ? '오시는 길' : '이용 안내'}</strong><small>{school ? '새봄으로 오는 길' : '함께하는 문화생활'}</small></div></div>
    <div className="sample-footer">{school ? '새봄학교' : '온빛생활문화원'}<span>가상 기관 · 디자인 예시</span></div>
  </div>;
}

// 후속 기능을 선행 구현하지 않고 현재 준비 상태와 전달된 샘플만 안내한다.
import { Link } from 'react-router-dom';

type GuideKind = 'save' | 'login' | 'signup' | 'missing';
const copy: Record<GuideKind, { title: string; description: string }> = {
  save: { title: '저장 기능을 준비하고 있어요', description: '프로젝트 저장·불러오기와 사이트 파일 내보내기는 후속 단계에서 제공됩니다.' },
  login: { title: '로그인을 준비하고 있어요', description: '현재는 계정 입력과 실제 인증을 제공하지 않습니다. 홈과 샘플 선택은 로그인 없이 이용할 수 있습니다.' },
  signup: { title: '회원가입을 준비하고 있어요', description: '현재는 계정을 생성하지 않습니다. 회원가입 화면과 인증 연결은 후속 단계에서 제공됩니다.' },
  missing: { title: '페이지를 찾을 수 없어요', description: '주소를 확인하거나 홈에서 다시 시작해 주세요.' },
};

export function GuidePage({ kind }: { kind: GuideKind }) {
  return <section className="guide container" aria-labelledby="guide-title"><span className="section-kicker">{kind === 'missing' ? 'PAGE NOT FOUND' : 'COMING SOON'}</span><h1 id="guide-title">{copy[kind].title}</h1><p className="guide-description">{copy[kind].description}</p><div className="guide-actions"><Link className="button primary" to="/">홈으로 돌아가기 <span aria-hidden="true">↗</span></Link>{kind === 'save' && <Link className="button secondary" to="/maker">편집으로 돌아가기</Link>}</div></section>;
}

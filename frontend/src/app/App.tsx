// 해시 라우팅은 정적 호스팅에서도 별도 서버 재작성 없이 새로고침된다.
import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { GuidePage } from '../pages/GuidePage';
import { AccountPage } from '../pages/AccountPage';
import { ProjectProvider } from '../features/project/ProjectContext';

// 홈에서는 편집 엔진을 받지 않고, 첫 제작 진입 이후 인스턴스를 보존한다.
const SavePage = lazy(() => import('../pages/SavePage').then(module => ({ default: module.SavePage })));
const MakerPage = lazy(() => import('../pages/MakerPage').then(module => ({ default: module.MakerPage })));

function Layout() {
  const { pathname } = useLocation();
  const [makerVisited, setMakerVisited] = useState(pathname === '/maker');
  useEffect(() => { if (pathname === '/maker') setMakerVisited(true); }, [pathname]);
  useEffect(() => {
    window.scrollTo(0, 0);
    const titles: Record<string, string> = { '/': '나의 아이디어를 웹사이트로', '/maker': '제작', '/save': '저장', '/login': '로그인', '/signup': '회원가입' };
    document.title = `이지웹메이커 | ${titles[pathname] ?? '페이지 안내'}`;
  }, [pathname]);
  return <>
    <a className="skip-link" href="#main-content">본문으로 이동</a>
    <header className="header"><div className="container header-inner"><Link className="brand" to="/" aria-label="이지웹메이커 홈"><span className="brand-mark" aria-hidden="true">e<span>↗</span></span>이지웹메이커</Link><nav className="nav" aria-label="주 메뉴"><NavLink to="/" end>홈</NavLink><NavLink to="/maker">제작</NavLink><NavLink to="/save">저장</NavLink></nav><div className="account-nav"><NavLink to="/login">로그인</NavLink><Link className="signup-link" to="/signup">회원가입 <span aria-hidden="true">↗</span></Link></div></div></header>
    <main id="main-content" tabIndex={-1}><Routes><Route path="/" element={<HomePage />} /><Route path="/maker" element={null} /><Route path="/save" element={<Suspense fallback={<p className="container">저장 화면을 준비하고 있습니다.</p>}><SavePage /></Suspense>} /><Route path="/login" element={<AccountPage key="login" kind="login" />} /><Route path="/signup" element={<AccountPage key="signup" kind="signup" />} /><Route path="*" element={<GuidePage kind="missing" />} /></Routes>{makerVisited && <Suspense fallback={<p className="container">제작 화면을 준비하고 있습니다.</p>}><MakerPage active={pathname === '/maker'} /></Suspense>}</main>
    <footer className="footer container"><Link className="brand" to="/"><span className="brand-mark small" aria-hidden="true">e</span>이지웹메이커</Link><p>생각을 담고, 나답게 만드는 웹.</p><small>© {new Date().getFullYear()} EasyWebMaker</small></footer>
  </>;
}

export function App() { return <HashRouter><ProjectProvider><Layout /></ProjectProvider></HashRouter>; }

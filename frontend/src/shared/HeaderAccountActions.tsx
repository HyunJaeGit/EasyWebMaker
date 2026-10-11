import { Link } from 'react-router-dom';
import './headerAccountActions.css';

export function HeaderAccountActions() {
  return <div className="header-account-actions">
    <button type="button" className="premium-upgrade" aria-disabled="true" title="프리미엄 업그레이드 · 준비 중"><span aria-hidden="true">✦</span><span>프리미엄</span><small>준비 중</small></button>
    <Link className="header-login-icon" to="/login" aria-label="로그인" title="로그인"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg></Link>
  </div>;
}

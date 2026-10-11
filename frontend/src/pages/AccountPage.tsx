// 회원 확장을 위한 입력 UI만 제공한다. 인증·저장·네트워크 요청은 수행하지 않는다.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import '../features/account/account.css';

type Field = 'email' | 'password' | 'confirm';
type Values = Record<Field, string>;
const emptyValues: Values = { email: '', password: '', confirm: '' };

export function AccountPage({ kind }: { kind: 'login' | 'signup' }) {
  const signup = kind === 'signup';
  const title = signup ? '회원가입' : '로그인';
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState('');
  const fields: { key: Field; label: string; type: string }[] = [
    { key: 'email', label: '이메일', type: 'email' },
    { key: 'password', label: '비밀번호', type: 'password' },
    ...(signup ? [{ key: 'confirm' as const, label: '비밀번호 확인', type: 'password' }] : []),
  ];

  // 브라우저 기본 팝업 대신 각 입력 아래 오류를 표시하고 첫 오류로 초점을 이동한다.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setNotice('');
    const next: Partial<Record<Field, string>> = {};
    if (!values.email.trim()) next.email = '이메일을 입력해 주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = '이메일 주소를 확인해 주세요. 예: hello@example.com';
    if (!values.password.trim()) next.password = '비밀번호를 입력해 주세요.';
    if (signup) {
      if (!values.confirm) next.confirm = '비밀번호를 한 번 더 입력해 주세요.';
      else if (values.password !== values.confirm) next.confirm = '비밀번호가 일치하지 않습니다.';
    }
    setErrors(next);
    const first = fields.find(field => next[field.key]);
    if (first) { document.getElementById(`account-${first.key}`)?.focus(); return; }
    // 유효한 입력도 계정이나 로그인 상태로 전환하지 않으며 민감한 입력을 즉시 비운다.
    setValues(emptyValues);
    setNotice('실제 인증 서비스가 연결되지 않았습니다. 로그인이나 계정 생성은 진행되지 않았으며, 입력한 정보는 전송·저장하지 않고 비웠습니다.');
  };

  return <section className="account-page container" aria-labelledby="account-title">
    <div className="account-intro"><span className="section-kicker">YOUR NEXT CHAPTER</span><h1 id="account-title">{title}</h1><p>아이디어를 담는 일은 지금도 시작할 수 있어요.<br />기본 제작과 ZIP 저장은 로그인 없이 이용하세요.</p><Link className="button secondary" to="/maker">로그인 없이 제작하기 <span aria-hidden="true">↗</span></Link></div>
    <div className="account-card">
      <div className="account-connection" id="account-connection"><strong>아직 인증 서비스가 연결되지 않았어요.</strong><p>이 화면은 입력 UI입니다. 제출해도 로그인되거나 계정이 생성되지 않습니다. 실제 개인정보 대신 예시 값을 입력해 주세요.</p></div>
      <form noValidate autoComplete="off" onSubmit={submit} aria-label={`${title} 입력`} aria-describedby="account-connection">
        {fields.map(({ key, label, type }) => <div className="account-field" key={key}>
          <label htmlFor={`account-${key}`}>{label} <span aria-hidden="true">*</span></label>
          <input id={`account-${key}`} name={key} type={type} required autoComplete={key === 'email' ? 'off' : 'new-password'} inputMode={key === 'email' ? 'email' : undefined} autoCapitalize="none" spellCheck={false} value={values[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `account-${key}-error` : undefined} placeholder={key === 'email' ? 'hello@example.com' : key === 'confirm' ? '같은 비밀번호를 다시 입력하세요' : '비밀번호를 입력하세요'} onChange={event => { setValues(previous => ({ ...previous, [key]: event.target.value })); setErrors(previous => ({ ...previous, [key]: undefined })); setNotice(''); }} />
          {errors[key] && <p className="account-error" id={`account-${key}-error`}>{errors[key]}</p>}
        </div>)}
        <p className="account-help">* 필수 입력 · 입력 정보는 이 화면의 임시 상태에서만 사용합니다. 다른 화면으로 이동하면 지워집니다.</p>
        <button type="submit" className="button primary account-submit">{title} 요청 확인</button>
        <p className="account-status" role="status" aria-live="polite">{notice}</p>
      </form>
      <p className="account-switch">{signup ? '로그인 화면을 찾고 계신가요?' : '회원가입 화면이 궁금한가요?'} <Link to={signup ? '/login' : '/signup'}>{signup ? '로그인으로 이동' : '회원가입으로 이동'} <span aria-hidden="true">↗</span></Link></p>
    </div>
  </section>;
}

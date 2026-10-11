// 애플리케이션 진입점: 로컬 글꼴과 공통 스타일을 한 번 불러온다.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import 'pretendard/dist/web/variable/pretendardvariable.css';
import './shared/styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

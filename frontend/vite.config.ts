// 상대 자산 경로로 정적 호스팅의 하위 디렉터리에도 대응한다.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()], base: './' });

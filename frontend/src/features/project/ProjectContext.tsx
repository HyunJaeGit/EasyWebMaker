// 현재 프로젝트와 엔진 스냅샷 연결을 유지한다. ZIP 파일 처리 책임은 별도 모듈에 둔다.
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import type { ProjectData } from 'grapesjs';
import type { SampleId } from '../../shared/samples';
import type { ProjectSnapshot } from './format';

interface ProjectMemory { data?: ProjectData; start?: SampleId; initialized: boolean; dirty: boolean }
function useProjectMemory() {
  const memory = useRef<ProjectMemory>({ initialized: false, dirty: false });
  const runtime = useRef<{ capture: () => ProjectSnapshot } | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('나의 첫 번째 웹사이트');
  return { memory, runtime, ready, setReady, name, setName };
}
const ProjectContext = createContext<ReturnType<typeof useProjectMemory> | null>(null);
export function ProjectProvider({ children }: { children: ReactNode }) {
  const value = useProjectMemory();
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
export function useProject() {
  const project = useContext(ProjectContext);
  if (!project) throw new Error('ProjectProvider가 필요합니다.');
  return project;
}

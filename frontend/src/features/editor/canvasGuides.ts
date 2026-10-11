import type { Component, Editor } from 'grapesjs';
import { componentLabel } from './PropertiesPanel';

// 모델 밖 iframe 오버레이: 저장 데이터·사이트 CSS와 분리하며 포인터를 가로채지 않는다.
export function attachCanvasGuides(editor: Editor, enabled: boolean) {
  let cleanupFrame = () => {};
  const attach = () => {
    cleanupFrame();
    const doc = editor.Canvas.getDocument(); const win = doc?.defaultView;
    if (!doc || !win || !enabled) return;
    const style = doc.createElement('style'); style.id = 'ew-canvas-guides';
    style.textContent = '[data-ew-guide-overlay]{position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483646!important;overflow:hidden!important}[data-ew-guide-box]{position:absolute;box-sizing:border-box;border:1px dashed #397ab5;pointer-events:none}[data-ew-guide-box][data-container]{border:2px dashed #30846b}[data-ew-guide-label]{position:absolute;left:0;top:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:10px/1.4 sans-serif;padding:1px 4px;color:white;background:#397ab5;border-radius:0 0 3px 0}[data-container]>[data-ew-guide-label]{background:#30846b}';
    const overlay = doc.createElement('div'); overlay.setAttribute('data-ew-guide-overlay', ''); overlay.setAttribute('aria-hidden', 'true');
    doc.head.append(style); doc.body.append(overlay);
    let raf = 0;
    const render = () => {
      raf = 0; const nodes: HTMLElement[] = [];
      const walk = (component: Component) => {
        const element = component.getEl();
        if (element && String(component.get('type')).startsWith('ew-')) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < win.innerHeight && rect.left < win.innerWidth) {
            const box = doc.createElement('div'); box.setAttribute('data-ew-guide-box', '');
            if (component.get('type') === 'ew-container') box.setAttribute('data-container', '');
            Object.assign(box.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            const label = doc.createElement('span'); label.setAttribute('data-ew-guide-label', ''); label.textContent = componentLabel(component) || component.get('tagName') || '요소';
            box.append(label); nodes.push(box);
          }
        }
        component.components().forEach(walk);
      };
      editor.getWrapper()?.components().forEach(walk); overlay.replaceChildren(...nodes);
    };
    const schedule = () => { if (!raf) raf = win.requestAnimationFrame(render); };
    const events = 'update component:selected component:resize component:drag canvas:refresh';
    editor.on(events, schedule); doc.addEventListener('scroll', schedule, true); win.addEventListener('resize', schedule);
    const observer = new win.ResizeObserver(schedule); observer.observe(doc.body); render();
    cleanupFrame = () => { win.cancelAnimationFrame(raf); observer.disconnect(); editor.off(events, schedule); doc.removeEventListener('scroll', schedule, true); win.removeEventListener('resize', schedule); overlay.remove(); style.remove(); };
  };
  attach(); editor.on('canvas:frame:load', attach);
  return () => { editor.off('canvas:frame:load', attach); cleanupFrame(); };
}

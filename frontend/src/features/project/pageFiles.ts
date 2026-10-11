export function pageStem(name: string) { return name.trim().replace(/\.html$/i, '').replace(/[^a-zA-Z0-9가-힣_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'page'; }
export function pageFiles(pages: { name: string }[]) { const used = new Set<string>(); return pages.map(page => { const base = pageStem(page.name); let stem = base; let suffix = 2; while (used.has(stem)) stem = base + '-' + suffix++; used.add(stem); return { html: stem + '.html', css: stem + '.css', js: stem + '.js' }; }); }

export function pageNameError(name: string, others: string[]) {
  if (!/^[a-z][a-z0-9-]{0,79}$/.test(name)) return '영문 소문자로 시작하고 소문자·숫자·하이픈만 사용하세요 (1~80자).';
  if (others.includes(name)) return '이미 사용 중인 파일 이름입니다. 다른 이름을 입력하세요.';
  return '';
}

// 기존 한글·공백 이름은 가져온 파일을 검증한 뒤 편집 모델에서만 이행한다.
export function englishPageNames(names: string[]) {
  const used: string[] = [];
  return names.map((name, index) => {
    let base = name.replace(/\.html$/i, '').toLowerCase();
    if (!/^[a-z][a-z0-9-]{0,79}$/.test(base)) base = index === 0 ? 'home' : `page-${index + 1}`;
    let next = base; let suffix = 2;
    while (used.includes(next)) next = `${base.slice(0, 75)}-${suffix++}`;
    used.push(next); return next;
  });
}

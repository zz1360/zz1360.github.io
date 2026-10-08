const root = document.documentElement;
const trigger = document.querySelector<HTMLButtonElement>('#appearance-trigger')!;
const panel = document.querySelector<HTMLElement>('#appearance-panel')!;
const closeButton = document.querySelector<HTMLButtonElement>('#preview-close')!;
const season = document.querySelector<HTMLSelectElement>('#season-select')!;
const reading = document.querySelector<HTMLSelectElement>('#reading-select')!;
let focusBefore: Element | null = null;

function stored(key: string, fallback: string) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function remember(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}
function automaticSeason(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return parts.find(p => p.type === 'month')?.value === '10' && parts.find(p => p.type === 'day')?.value === '31' ? 'halloween' : 'regular';
}
function applySeason() {
  root.dataset.season = season.value === 'auto' ? automaticSeason() : season.value;
  const caption = document.querySelector('[data-season-caption]');
  if (caption) caption.textContent = root.dataset.season === 'halloween' ? '今夜有南瓜灯，也有尚未讲完的故事。' : '一处停靠，两段旅程。';
}
function applyReading(value: string) {
  reading.value = value === 'light' ? 'light' : 'dark';
  root.dataset.readingTheme = reading.value;
  document.querySelectorAll<HTMLButtonElement>('[data-reading]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.reading === reading.value)));
}
function openPanel(open: boolean) {
  panel.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
  if (open) { focusBefore = document.activeElement; closeButton.focus(); }
  else if (focusBefore instanceof HTMLElement) focusBefore.focus();
}
trigger.onclick = () => openPanel(panel.hidden);
closeButton.onclick = () => openPanel(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) openPanel(false); });
document.addEventListener('pointerdown', e => { if (!panel.hidden && e.target instanceof Element && !e.target.closest('#appearance-panel,#appearance-trigger')) openPanel(false); });
season.value = stored('bit-tavern-season', 'auto');
if (!['auto', 'regular', 'halloween'].includes(season.value)) season.value = 'auto';
season.onchange = () => { remember('bit-tavern-season', season.value); applySeason(); };
reading.onchange = () => { remember('bit-tavern-reading', reading.value); applyReading(reading.value); };
document.querySelectorAll<HTMLButtonElement>('[data-reading]').forEach(button => {
  button.onclick = () => { const value = button.dataset.reading || 'dark'; remember('bit-tavern-reading', value); applyReading(value); };
});
applySeason();
applyReading(stored('bit-tavern-reading', 'dark'));
addEventListener('pageshow', applySeason);
document.addEventListener('visibilitychange', () => { if (!document.hidden) applySeason(); });

const license = document.querySelector<HTMLDialogElement>('#license-dialog')!;
document.querySelector<HTMLButtonElement>('#license-button')!.onclick = () => license.showModal();
document.querySelector<HTMLButtonElement>('#license-close')!.onclick = () => license.close();
license.addEventListener('click', e => {
  if (e.target === license) { const r = license.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) license.close(); }
});

const copyStatus = document.createElement('span');
copyStatus.className = 'sr-only'; copyStatus.setAttribute('role', 'status'); document.body.append(copyStatus);
document.querySelectorAll<HTMLElement>('.article-body pre').forEach(pre => {
  const wrapper = document.createElement('div'); wrapper.className = 'markdown-code';
  pre.before(wrapper); wrapper.append(pre);
  const button = document.createElement('button'); button.className = 'code-copy'; button.textContent = '复制'; button.setAttribute('aria-label', '复制代码'); wrapper.append(button);
  button.onclick = async () => {
    try { await navigator.clipboard.writeText(pre.textContent || ''); button.textContent = '已复制'; copyStatus.textContent = '代码已复制。'; setTimeout(() => { button.textContent = '复制'; }, 1800); }
    catch { const range = document.createRange(); range.selectNodeContents(pre); const selection = getSelection(); selection?.removeAllRanges(); selection?.addRange(range); copyStatus.textContent = '已选中代码，可按 ⌘C 或 Ctrl+C 复制。'; }
  };
});

// The visual prototype used hashes; retain these incoming shortcuts after migration.
if (location.pathname === '/') {
  if (location.hash === '#blog') location.replace('/blog/');
  if (location.hash === '#dnd') location.replace('/explore/dnd/');
}

export {};

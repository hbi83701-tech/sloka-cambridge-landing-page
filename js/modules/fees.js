/* =====================================================================
   Grades & fees: stage tabs.
   Without JS every stage panel is simply listed one after another.
   With JS the stages become tabs (click or arrow keys) and only the
   chosen stage's grade cards are shown; the cards then rise in one by one
   (pure CSS, see css section 24).
   ===================================================================== */
export function initFees() {
  const root = document.querySelector('[data-fees]');
  if (!root) return;
  const sec = root.closest('section');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  if (!tabs.length || tabs.length !== panels.length) return;

  root.classList.add('fees--live');

  // cards rise in the first time the section scrolls into view
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    root.classList.add('is-in');
    io.disconnect();
  }, { threshold: 0.12 });
  io.observe(sec);

  let refreshT;
  function show(i, focus) {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, k) => {
      const on = k === i;
      p.classList.remove('is-active');
      if (on) { void p.offsetWidth; p.classList.add('is-active'); } // restart the card animation
      p.hidden = !on;
    });
    if (focus) tabs[i].focus();
    // the section changes height: let ScrollTrigger re-measure everything below
    if (window.ScrollTrigger) { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 120); }
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); show((i + k + tabs.length) % tabs.length, true); }
      else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
      else if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
    });
  });
  show(0);
}

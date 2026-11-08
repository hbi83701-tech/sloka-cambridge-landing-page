/* =====================================================================
   Sections ported from the Tukkuguda landing page: the "Step inside"
   doorway gallery, the facilities picker and the grade / fee / parent
   review finder. Plain DOM + scroll listeners (no GSAP needed), written
   from the Tukkuguda page's own script and trimmed to what these three
   sections use. Styles live in css/sections-tk.css (everything under .tk).
   Fees and testimonials come from SLOKA_GRADES in js/config.js.
   ===================================================================== */
import { env } from './env.js';

const each = (list, fn) => Array.prototype.forEach.call(list, fn);
const clamp = (v) => Math.min(1, Math.max(0, v));
const reduce = env.reduced;

/* ---------- photos open like a doorway as they scroll into view ---------- */
function openPhotos(root) {
  const photos = (root || document).querySelectorAll('.tk .photo');
  if (reduce || !('IntersectionObserver' in window)) { each(photos, (p) => p.classList.add('is-open')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-open'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  each(photos, (p) => io.observe(p));
}
function reopenPhotos(container) {
  each(container.querySelectorAll('.photo'), (p) => {
    p.classList.remove('is-open');
    void p.offsetWidth;
    p.classList.add('is-open');
  });
}

/* ---------- the "Step inside" doorway: opens with the scroll, then photos rise one by one ---------- */
function initDoorway() {
  const doorway = document.querySelector('[data-doorway]');
  if (!doorway || reduce || !('IntersectionObserver' in window)) return;
  doorway.classList.add('doorway--live');
  const doorImg = doorway.querySelector('img');
  if (doorImg) doorImg.loading = 'eager';

  let ticking = false, active = false;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeSlide = (t) => 1 - Math.pow(1 - t, 3);
  const slides = Array.prototype.slice.call(doorway.querySelectorAll('.doorway__slide'));
  const dots = doorway.querySelectorAll('.doorway__dots li');

  const paint = () => {
    ticking = false;
    const vw = doorway.clientWidth, vh = window.innerHeight;
    const rect = doorway.getBoundingClientRect();
    const scrolled = -rect.top;
    const phone = vw < 760;
    const OPEN = vh * (phone ? 1.1 : 1.8);    // scroll used by the doors opening (matches the CSS height)
    const SLIDE = vh * (phone ? 0.45 : 0.8);  // scroll per photo
    const p = clamp(scrolled / OPEN);
    const header = document.querySelector('.site-header').offsetHeight;

    const archW = phone ? vw * 0.62 : Math.min(440, vw * 0.32);
    const archH = (vh - header) * (phone ? 0.5 : 0.74);
    const top = header + (vh - header - archH) / 2;
    const o = ease(clamp(p / 0.7));           // 0 = closed arch, 1 = full screen

    const rise = slides.map((el, i) => easeSlide(clamp((scrolled - OPEN - i * SLIDE) / (SLIDE * 0.7))));
    slides.forEach((el, i) => {
      const t = rise[i], covered = rise[i + 1] || 0;
      el.style.setProperty('--t', t.toFixed(4));
      el.style.setProperty('--o', covered.toFixed(3));
      el.style.setProperty('--c', (clamp((t - 0.55) / 0.35) * (1 - covered)).toFixed(3));
      el.style.setProperty('--v', t > 0.001 ? 'visible' : 'hidden');
    });
    const firstRise = rise[0] || 0;
    const shown = rise.filter((t) => t > 0.5).length;
    each(dots, (d, i) => d.classList.toggle('is-on', i === shown));
    const s = doorway.style;
    s.setProperty('--dots', clamp((p - 0.7) / 0.2).toFixed(3));
    s.setProperty('--ct', (top * (1 - o)).toFixed(1) + 'px');
    s.setProperty('--cb', ((vh - top - archH) * (1 - o)).toFixed(1) + 'px');
    s.setProperty('--cs', (((vw - archW) / 2) * (1 - o)).toFixed(1) + 'px');
    s.setProperty('--cr', ((archW / 2) * (1 - o)).toFixed(1) + 'px');
    s.setProperty('--zoom', ((1.18 - 0.18 * o) * (1 - 0.06 * firstRise)).toFixed(3));
    s.setProperty('--wo', (1 - clamp((p - 0.25) / 0.3)).toFixed(3));
    const ro = clamp((p - 0.62) / 0.25) * (1 - firstRise);   // the entrance caption gives way to the first photo
    s.setProperty('--ro', ro.toFixed(3));
    s.setProperty('--rv', ro > 0.02 ? 'visible' : 'hidden');
  };

  const onScroll = () => { if (active && !ticking) { ticking = true; requestAnimationFrame(paint); } };
  new IntersectionObserver((entries) => { active = entries[0].isIntersecting; if (active) paint(); }, { rootMargin: '200px 0px' }).observe(doorway);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { if (active) paint(); });
  paint();
}

/* ---------- facilities: a sideways bar picks one space, or shows them all ---------- */
function initFacilities() {
  const bar = document.querySelector('[data-facbar]');
  const grid = document.querySelector('[data-facs]');
  if (!bar || !grid) return;
  const chips = bar.querySelectorAll('[data-fac-filter]');
  const tiles = grid.querySelectorAll('.fac');

  const show = (key, chip) => {
    const single = key !== 'all';
    grid.classList.toggle('facs--single', single);
    each(tiles, (tile) => {
      const on = !single || tile.classList.contains('fac--' + key);
      tile.hidden = !on;
      if (on && single) {
        tile.classList.add('is-inview');
        tile.classList.remove('fac--enter');
        void tile.offsetWidth;               // restart the entrance animation
        tile.classList.add('fac--enter');
      }
    });
    each(chips, (c) => c.setAttribute('aria-pressed', String(c === chip)));
    if (bar.scrollWidth > bar.clientWidth) {  // keep the chosen chip in view; only the bar scrolls sideways
      const target = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2;
      bar.scrollTo({ left: Math.max(0, target), behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  each(chips, (chip) => chip.addEventListener('click', () => show(chip.getAttribute('data-fac-filter'), chip)));
}

/* ---------- grades: choose a grade, see its stage, fee and parent voice ---------- */
function initFinder() {
  const finder = document.querySelector('[data-finder]');
  if (!finder) return;
  const data = window.SLOKA_GRADES || {};
  const FEES = data.FEES || {};
  const VOICES = data.VOICES || {};
  const panels = finder.querySelectorAll('[data-stage-panel]');
  const radios = finder.querySelectorAll('input[name="finder-grade"]');
  const sheet = finder.querySelector('[data-gsheet]');
  const gsGrade = sheet.querySelector('[data-gs-grade]');
  const gsStage = sheet.querySelector('[data-gs-stage]');
  const gsAge = sheet.querySelector('[data-gs-age]');
  const feeFor = sheet.querySelector('[data-fee-for]');
  const feeAmount = sheet.querySelector('[data-fee-amount]');
  const voiceFor = sheet.querySelector('[data-voice-for]');
  const voiceList = sheet.querySelector('[data-voice]');
  const STAGE_NAMES = {
    early: 'Early Years · Nursery to UKG',
    primary: 'Primary · Grades 1 to 5',
    middle: 'Lower Secondary · Grades 6 to 8',
    secondary: 'IGCSE · Grades 9 & 10',
    alevel: 'AS & A Level · Grades 11 & 12'
  };
  const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const personIcon = '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="18" r="8"/><path d="M8 42c1.5-9 8-14 16-14s14.5 5 16 14z"/></svg>';
  const avatar = (v) => (v && v.photo
    ? `<img class="voice__photo" src="${esc(v.photo)}" alt="" width="52" height="52" loading="lazy" decoding="async">`
    : `<span class="voice__photo voice__photo--blank">${personIcon}</span>`);

  finder.classList.add('finder--ready');

  const showVoices = (grade) => {
    const list = Array.isArray(VOICES[grade]) ? VOICES[grade] : (VOICES[grade] ? [VOICES[grade]] : []);
    voiceFor.textContent = 'Parents of ' + grade + ' students';
    if (!list.length) {
      voiceList.innerHTML = `<figure class="voice__card voice__card--pending"><span class="voice__topic">${esc(grade)}</span>` +
        `<figcaption>${avatar(null)}<span class="voice__who"><strong>Parent of a ${esc(grade)} student</strong>` +
        '<span class="tbc">[PARENT TESTIMONIAL TO BE SUPPLIED BY SCHOOL]</span></span></figcaption></figure>';
      return;
    }
    const render = (i) => {
      const v = list[i];
      const pager = list.length > 1
        ? `<span class="voice__pager"><button type="button" class="voice__step" data-dir="-1" aria-label="Previous testimonial">&#8249;</button><span>${i + 1} of ${list.length}</span><button type="button" class="voice__step" data-dir="1" aria-label="Next testimonial">&#8250;</button></span>`
        : '';
      const long = (v.quote || '').length > 230;
      voiceList.innerHTML = `<figure class="voice__card${pager ? ' voice__card--paged' : ''}">` +
        `<div class="voice__top"><span class="voice__topic">${esc(v.topic || grade)}</span>${pager}</div>` +
        `<blockquote><p>${esc(v.quote)}</p></blockquote>` +
        (long ? '<button class="voice__more" type="button" aria-expanded="false">Read more</button>' : '') +
        `<figcaption>${avatar(v)}<span class="voice__who"><strong>${esc(v.name || 'Parent')}</strong>${esc(v.parent || '')}${v.area ? '<br>' + esc(v.area) : ''}</span></figcaption></figure>`;
      const card = voiceList.querySelector('.voice__card');
      const more = voiceList.querySelector('.voice__more');
      if (more) more.addEventListener('click', () => {
        const open = card.classList.toggle('is-open');
        more.textContent = open ? 'Show less' : 'Read more';
        more.setAttribute('aria-expanded', String(open));
      });
      each(voiceList.querySelectorAll('.voice__step'), (btn) => btn.addEventListener('click', () => render((i + parseInt(btn.getAttribute('data-dir'), 10) + list.length) % list.length)));
    };
    render(0);
  };

  const showDetails = (grade, stage) => {
    sheet.setAttribute('data-stage', stage);
    gsStage.textContent = STAGE_NAMES[stage];
    if (!grade) {
      gsGrade.textContent = 'Choose a grade';
      gsAge.textContent = '';
      feeFor.textContent = '2027–28';
      feeAmount.innerHTML = '<span class="fee__prompt">Choose a grade above.</span>';
      voiceFor.textContent = '';
      voiceList.innerHTML = '<figure class="voice__card voice__card--prompt"><p class="voice__prompt">Choose a grade above to hear from parents of that grade.</p></figure>';
      return;
    }
    gsGrade.textContent = grade;
    gsAge.textContent = '';
    const range = FEES[grade];
    feeFor.textContent = grade + ' · 2027–28';
    feeAmount.innerHTML = range
      ? (range.length > 1 ? rupees(range[0]) + ' – ' + rupees(range[1]) : rupees(range[0])) + '<small>per year</small>'
      : '<span class="tbc">[FEE RANGE TO BE CONFIRMED BY SCHOOL]</span>';
    showVoices(grade);
  };

  let current = '';
  const showStage = (stage) => {
    if (stage === current) return;
    const switching = current !== '';
    current = stage;
    each(panels, (p) => {
      const on = p.getAttribute('data-stage-panel') === stage;
      p.classList.toggle('is-active', on);
      if (on && switching) reopenPhotos(p);
    });
  };

  const setGrade = (radio) => {
    showStage(radio.getAttribute('data-stage'));
    showDetails(radio.value, radio.getAttribute('data-stage'));
    each(finder.querySelectorAll('[data-grade-suffix]'), (el) => { el.textContent = ' for ' + radio.value; });
  };

  showStage('early');
  showDetails('', 'early');
  each(radios, (r) => r.addEventListener('change', () => { if (r.checked) setGrade(r); }));
}

export function initTk() {
  openPhotos();
  initDoorway();
  initFacilities();
  initFinder();
}

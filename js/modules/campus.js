/* =====================================================================
   Campus section: building photos, one by one as you scroll.

   Desktop: the section pins to the screen. Each photo swings in from the
   right in 3D (cover-flow), settles in the centre, then is pushed off to
   the left, dimmed and tilted, as the next one arrives. A counter, dots
   and a big ghost numeral follow along.
   Phones: no pinning. Each photo tumbles in as it scrolls into view.
   Reduced motion / no GSAP: nothing runs, the photos are a plain stack.
   ===================================================================== */
import { env } from './env.js';

export function initCampus() {
  const sec = document.querySelector('.flow--campus');
  if (!sec || env.reduced || !env.hasLibs) return;

  const shots = [...sec.querySelectorAll('.shot')];
  const counter = sec.querySelector('[data-campus-count]');
  const dots = [...sec.querySelectorAll('.campus__dots li')];
  const glow = sec.querySelector('.campus__glow');
  const n = shots.length;
  if (!n) return;

  const mm = gsap.matchMedia();

  /* ---------- desktop: pinned 3D gallery ---------- */
  mm.add('(min-width: 900px)', () => {
    sec.classList.add('campus--stage');

    const away = () => innerWidth * 0.75;          // waiting off-screen right
    const behind = () => -innerWidth * 0.3;        // just-passed, tucked left
    const gone = () => -innerWidth * 0.58;         // two photos back, out of sight

    gsap.set(shots, { xPercent: -50, x: away, rotateY: -38, scale: 0.9, opacity: 0, zIndex: (i) => i + 1 });
    gsap.set(shots[0], { x: 0, rotateY: 0, scale: 1, opacity: 1 });

    const HOLD = 0.35, MOVE = 0.65, TAIL = 0.4;     // timeline units: rest, travel, final rest
    let current = 0;
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: () => '+=' + Math.round(innerHeight * (n - 1 + TAIL) * 0.9),
        pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          // photo i takes over once the swap to it is half done
          const t = self.progress * (n - 1 + TAIL);
          const idx = Math.max(0, Math.min(n - 1, Math.floor(t - HOLD - MOVE / 2 + 1)));
          if (idx === current) return;
          current = idx;
          if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
          dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
          sec.dataset.shot = String(idx + 1);
        }
      }
    });

    for (let i = 1; i < n; i++) {
      const at = i - 1 + HOLD;
      tl.to(shots[i - 1], { x: behind, rotateY: 28, scale: 0.8, opacity: 0.35, duration: MOVE }, at)
        .to(shots[i], { x: 0, rotateY: 0, scale: 1, opacity: 1, duration: MOVE }, at);
      if (i >= 2) tl.to(shots[i - 2], { x: gone, rotateY: 40, scale: 0.7, opacity: 0, duration: MOVE }, at);
    }
    tl.to({}, { duration: TAIL }); // let the last photo rest before the page moves on

    if (glow) {
      gsap.fromTo(glow, { yPercent: 20, xPercent: -25, scale: 0.8 }, {
        yPercent: -30, xPercent: 20, scale: 1.25, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: () => '+=' + Math.round(innerHeight * (n + 1)), scrub: 1 }
      });
    }

    return () => {                                   // leaving desktop width: back to the plain stack
      sec.classList.remove('campus--stage');
      delete sec.dataset.shot;
    };
  });

  /* ---------- phones / small screens: each photo tumbles in ---------- */
  mm.add('(max-width: 899px)', () => {
    const tilt = [-3, 3, -2, 3, -3];
    shots.forEach((s, i) => {
      gsap.from(s, {
        y: 70, opacity: 0, rotate: tilt[i % tilt.length], scale: 0.94, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: s, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
  });
}

/* =====================================================================
   Campus section: the photo opens like a window as you scroll (clip-path
   grows from a small rounded frame to the full width) while the picture
   settles from a slow zoom; the caption chip pops in; the empty frames
   tumble in one by one; a sun glow drifts behind everything. On a mouse
   the lead photo also leans a little toward the pointer.
   Reduced motion: nothing here runs, the page just shows the final layout.
   ===================================================================== */
import { env } from './env.js';

export function initCampus() {
  const sec = document.querySelector('.flow--campus');
  if (!sec || env.reduced || !env.hasLibs) return;

  const lead = sec.querySelector('.mosaic__item--lead');
  const img = lead?.querySelector('img');
  const chip = lead?.querySelector('figcaption');
  const slots = [...sec.querySelectorAll('.mosaic__slot')];
  const glow = sec.querySelector('.campus__glow');
  const heading = sec.querySelector('.flow__head');
  if (!lead || !img) return;

  const inset = env.mobile ? '8% 7% 8% 7%' : '16% 22% 16% 22%';

  // 1. the photo opens like a window
  gsap.fromTo(lead,
    { clipPath: `inset(${inset} round 56px)` },
    {
      clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none',
      scrollTrigger: { trigger: lead, start: 'top 94%', end: 'top 36%', scrub: 0.6 }
    });

  // ...and the picture itself settles from a slow zoom
  gsap.fromTo(img,
    { scale: 1.3, yPercent: -4 },
    {
      scale: 1, yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: lead, start: 'top 94%', end: 'center 42%', scrub: 0.8 }
    });

  // 2. the caption chip pops in once the window is mostly open
  if (chip) {
    gsap.fromTo(chip,
      { y: 36, opacity: 0, scale: 0.5, rotate: -8 },
      {
        y: 0, opacity: 1, scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2.2)',
        scrollTrigger: { trigger: lead, start: 'top 50%', toggleActions: 'play none none reverse' }
      });
  }

  // 3. the empty frames tumble in, each at its own angle
  if (slots.length) {
    const tilt = [-5, 4, -3, 5];
    gsap.from(slots, {
      y: 80, opacity: 0, scale: 0.9, rotate: (i) => tilt[i % tilt.length], transformOrigin: '50% 100%',
      duration: 0.9, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: slots[0], start: 'top 92%', toggleActions: 'play none none none' }
    });
  }

  // 4. a warm sun glow drifts diagonally behind the section
  if (glow) {
    gsap.fromTo(glow,
      { yPercent: 25, xPercent: -20, scale: 0.8 },
      {
        yPercent: -45, xPercent: 20, scale: 1.25, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
  }

  // 5. the heading block floats up a touch slower than the page
  if (heading && !env.mobile) {
    gsap.fromTo(heading, { y: 40 }, {
      y: -30, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'center top', scrub: 1 }
    });
  }

  // 6. mouse only: the photo leans toward the pointer
  if (env.rich) {
    const mx = gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3.out' });
    const my = gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power3.out' });
    lead.addEventListener('pointermove', (e) => {
      const r = lead.getBoundingClientRect();
      mx(((e.clientX - r.left) / r.width - 0.5) * -26);
      my(((e.clientY - r.top) / r.height - 0.5) * -18);
    });
    lead.addEventListener('pointerleave', () => { mx(0); my(0); });
  }
}

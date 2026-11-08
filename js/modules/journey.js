/* =====================================================================
   Admission journey: a winding road runs through the step stops.
   As you scroll, the road is drawn in yellow and the Sloka spark rides
   along its tip; each stop lights up (and its card rises) the moment the
   spark reaches it, and un-lights if you scroll back up.
   The road is rebuilt from the real positions of the stops, so it follows
   the layout on any screen. Reduced motion / no GSAP: every stop is lit,
   the road is fully drawn and the spark rests at the end.
   ===================================================================== */
import { env } from './env.js';

export function initJourney() {
  const root = document.querySelector('[data-journey]');
  if (!root) return;
  const svg = root.querySelector('.journey__road');
  const base = svg.querySelector('.journey__road-base');
  const draw = svg.querySelector('.journey__road-draw');
  const spark = root.querySelector('.journey__spark');
  const stops = [...root.querySelectorAll('.jstop')];
  const nodes = stops.map((s) => s.querySelector('.jstop__node'));
  if (!stops.length) return;

  const animated = !env.reduced && env.hasLibs;
  let pts = [], len = 0, stopLen = [];

  /* Build the road through the centre of every node, with soft S-bends between them. */
  function build() {
    const box = root.getBoundingClientRect();
    pts = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    });
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

    let d = `M ${pts[0].x} ${Math.max(0, pts[0].y - 60)} L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], h = (b.y - a.y) / 2;
      d += ` C ${a.x} ${a.y + h}, ${b.x} ${b.y - h}, ${b.x} ${b.y}`;
    }
    base.setAttribute('d', d);
    draw.setAttribute('d', d);
    len = draw.getTotalLength();
    draw.style.strokeDasharray = `${len} ${len}`;

    // how far along the road each stop sits (nearest sampled point)
    stopLen = pts.map((p) => {
      let best = 0, bestD = Infinity;
      for (let l = 0; l <= len; l += 6) {
        const q = draw.getPointAtLength(l);
        const dd = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
        if (dd < bestD) { bestD = dd; best = l; }
      }
      return best;
    });
  }

  function render(p) {
    const at = len * p;
    draw.style.strokeDashoffset = String(len - at);
    const pt = draw.getPointAtLength(Math.max(0.01, at));
    spark.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${p * 540}deg)`;
    stops.forEach((s, i) => s.classList.toggle('is-on', at >= stopLen[i] - 6));
  }

  build();

  if (!animated) {
    root.classList.add('journey--static');
    render(1);
    new ResizeObserver(() => { build(); render(1); }).observe(root);
    return;
  }

  root.classList.add('journey--live');
  const state = { p: 0 };
  gsap.to(state, {
    p: 1, ease: 'none',
    scrollTrigger: { trigger: root, start: 'top 62%', end: 'bottom 58%', scrub: 0.6 },
    onUpdate: () => render(state.p)
  });
  render(0);

  // rebuild when the layout changes (resize, fonts, tabs elsewhere changing heights)
  let t;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => { build(); render(state.p); }, 80);
  }).observe(root);
}

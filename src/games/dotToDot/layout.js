/** Board geometry shared by the board, the hit test and the tests (100-unit picture space). */
export const PAD = 13;
export const VB = 100 + PAD * 2;
export const HIT_PX = 28;
export const LABEL_DOT_CLEARANCE = 7.5;
export const LABEL_LABEL_CLEARANCE = 9;

const centroidOf = (dots) => ({
  x: dots.reduce((s, d) => s + d.x, 0) / dots.length,
  y: dots.reduce((s, d) => s + d.y, 0) / dots.length,
});

/** Unit normal at dot i, taken perpendicular to the line from its neighbour on either side. */
function normalAt(dots, i, c) {
  const a = dots[(i - 1 + dots.length) % dots.length];
  const b = dots[(i + 1) % dots.length];
  const tx = b.x - a.x;
  const ty = b.y - a.y;
  const len = Math.hypot(tx, ty) || 1;
  let nx = -ty / len;
  let ny = tx / len;
  if (nx * (dots[i].x - c.x) + ny * (dots[i].y - c.y) < 0) { nx = -nx; ny = -ny; }
  return { nx, ny };
}

/**
 * One label position per dot: pushed out along the outline normal, flipped to the
 * other side or pushed further when it would sit on a dot or another label.
 */
export function labelPositions(dots) {
  const c = centroidOf(dots);
  const lo = -PAD + 6;
  const hi = 100 + PAD - 6;
  const placed = [];
  dots.forEach((d, i) => {
    const { nx, ny } = normalAt(dots, i, c);
    const cands = [];
    [9, 11.5, 14].forEach((r) => {
      // outward first, then the other side, then slanted either way along the outline
      [0, Math.PI, Math.PI / 4, -Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4].forEach((t) => {
        cands.push([r * (nx * Math.cos(t) - ny * Math.sin(t)), r * (nx * Math.sin(t) + ny * Math.cos(t))]);
      });
    });
    const score = (p) => {
      let m = Infinity;
      dots.forEach((o) => { m = Math.min(m, (Math.hypot(p.x - o.x, p.y - o.y) / LABEL_DOT_CLEARANCE)); });
      placed.forEach((o) => { m = Math.min(m, (Math.hypot(p.x - o.x, p.y - o.y) / LABEL_LABEL_CLEARANCE)); });
      return m;
    };
    let best = null;
    let bestScore = -1;
    for (const [dx, dy] of cands) {
      const p = { x: Math.min(hi, Math.max(lo, d.x + dx)), y: Math.min(hi, Math.max(lo, d.y + dy)) };
      const sc = score(p);
      if (sc >= 1) { best = p; break; }
      if (sc > bestScore) { bestScore = sc; best = p; }
    }
    placed.push(best);
  });
  return placed;
}

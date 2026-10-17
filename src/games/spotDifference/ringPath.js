const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** A wobbly, slightly-overshooting loop, like a ring drawn with a crayon. */
export function ringPath(cx, cy, r, seed) {
  const h = hash(seed);
  const phase = (h % 628) / 100;
  const lobes = 2 + (h % 3);
  const start = ((h >> 3) % 628) / 100;
  const steps = 40;
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const a = start + t * (Math.PI * 2 + 0.55);
    const rr = r * (1 + 0.07 * Math.sin(lobes * a + phase) + 0.05 * t);
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr * 0.96).toFixed(2)}`);
  }
  return `M${pts.join(' L')}`;
}

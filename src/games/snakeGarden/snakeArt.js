/**
 * הנחש הרעב — every pixel of the play layer.
 *
 * The snake is drawn as a run of overlapping circles from tail to head. Because
 * they are opaque and share a colour, the seams vanish and the taper is free;
 * the outline and the shadow are each drawn as a *single* union path (many
 * sub-circles, one fill) so overlaps never darken.
 */
import { SNAKE_COLORS, TAU } from './snakeConfig';

/** Many circles, one path — filling it unions them instead of stacking alpha */
function unionCircles(ctx, pts, grow, headPt, headGrow) {
  ctx.beginPath();
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    const r = Math.max(0.4, p.r + grow);
    ctx.moveTo(p.x + r, p.y);
    ctx.arc(p.x, p.y, r, 0, TAU);
  }
  if (headPt) {
    const r = headPt.r + headGrow;
    ctx.moveTo(headPt.x + r, headPt.y);
    ctx.arc(headPt.x, headPt.y, r, 0, TAU);
  }
}

function drawStar(ctx, x, y, outer, inner, points, rotation) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / points;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawFruit(ctx, f, now) {
  const wob = 1 + Math.sin(now / 380 + f.phase) * 0.07;
  const r = f.r * wob;
  const pop = Math.min(1, (now - f.born) / 260);
  const scale = 0.35 + 0.65 * (pop < 1 ? 1 - Math.pow(1 - pop, 3) : 1);
  const rr = r * scale;

  ctx.save();
  ctx.translate(f.x, f.y);

  // sits on the grass
  ctx.beginPath();
  ctx.ellipse(0, rr * 0.98, rr * 0.78, rr * 0.26, 0, 0, TAU);
  ctx.fillStyle = 'rgba(58, 54, 48, 0.15)';
  ctx.fill();

  if (f.kind.id === 'golden') {
    ctx.save();
    ctx.rotate(now / 900);
    drawStar(ctx, 0, 0, rr * 1.5, rr * 0.66, 5, -Math.PI / 2);
    ctx.fillStyle = 'rgba(217, 180, 65, 0.28)';
    ctx.fill();
    ctx.restore();

    drawStar(ctx, 0, 0, rr * 1.18, rr * 0.52, 5, -Math.PI / 2 + Math.sin(now / 700) * 0.12);
    ctx.fillStyle = f.kind.fill;
    ctx.fill();
    ctx.lineWidth = Math.max(1.6, rr * 0.16);
    ctx.strokeStyle = 'rgba(122, 92, 20, 0.55)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-rr * 0.24, -rr * 0.3, rr * 0.2, 0, TAU);
    ctx.fillStyle = 'rgba(255, 253, 248, 0.85)';
    ctx.fill();
    ctx.restore();
    return;
  }

  // stalk + leaf
  ctx.beginPath();
  ctx.moveTo(0, -rr * 0.72);
  ctx.quadraticCurveTo(rr * 0.12, -rr * 1.18, rr * 0.04, -rr * 1.42);
  ctx.lineWidth = Math.max(1.5, rr * 0.16);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#8a6b4a';
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(rr * 0.52, -rr * 1.24, rr * 0.44, rr * 0.22, -0.5, 0, TAU);
  ctx.fillStyle = SNAKE_COLORS.body;
  ctx.fill();

  // body — a soft apple-ish blob, slightly wider than tall
  ctx.beginPath();
  ctx.ellipse(0, 0, rr * 1.04, rr, 0, 0, TAU);
  ctx.fillStyle = f.kind.fill;
  ctx.fill();
  ctx.lineWidth = Math.max(1.4, rr * 0.13);
  ctx.strokeStyle = 'rgba(58, 54, 48, 0.22)';
  ctx.stroke();

  // highlight
  ctx.beginPath();
  ctx.ellipse(-rr * 0.34, -rr * 0.36, rr * 0.28, rr * 0.19, -0.7, 0, TAU);
  ctx.fillStyle = 'rgba(255, 253, 248, 0.6)';
  ctx.fill();

  ctx.restore();
}

function drawSnake(ctx, S, now) {
  const { beads, head, headR, angle } = S;
  if (!beads.length && !head) return;

  const headPt = { x: head.x, y: head.y, r: headR };
  const immune = now < S.immuneUntil;

  // ground shadow — one union, offset down
  ctx.save();
  ctx.translate(headR * 0.16, headR * 0.4);
  unionCircles(ctx, beads, headR * 0.02, headPt, 0);
  ctx.fillStyle = SNAKE_COLORS.shadow;
  ctx.fill();
  ctx.restore();

  // a warm halo while the snake is still catching its breath after a bite
  if (immune) {
    const pulse = 0.35 + 0.35 * Math.abs(Math.sin(now / 190));
    unionCircles(ctx, beads, headR * 0.42, headPt, headR * 0.42);
    ctx.fillStyle = SNAKE_COLORS.halo;
    ctx.globalAlpha = pulse;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // outline
  unionCircles(ctx, beads, Math.max(1.6, headR * 0.13), headPt, Math.max(1.6, headR * 0.13));
  ctx.fillStyle = SNAKE_COLORS.outline;
  ctx.fill();

  // body, tail first so the head end lies on top
  const phase = S.dist / S.gap;
  for (let i = beads.length - 1; i >= 0; i -= 1) {
    const b = beads[i];
    // bands are keyed to distance travelled minus index, so they stick to the
    // body instead of sliding through it
    const m = (((phase - i) % 7) + 7) % 7;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.fillStyle = m < 2.4 ? SNAKE_COLORS.band : SNAKE_COLORS.body;
    ctx.fill();
  }

  // a lit ridge along the back
  ctx.fillStyle = SNAKE_COLORS.sheen;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < beads.length - 1; i += 2) {
    const b = beads[i];
    const nxt = i === 0 ? head : beads[i - 1] || head;
    const dx = nxt.x - b.x;
    const dy = nxt.y - b.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    ctx.beginPath();
    ctx.ellipse(
      b.x + nx * b.r * 0.36,
      b.y + ny * b.r * 0.36,
      b.r * 0.4,
      b.r * 0.24,
      Math.atan2(dy, dx),
      0,
      TAU,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── head ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(angle);

  // tongue, flicking now and then
  const flick = Math.sin(now / 260);
  if (flick > 0.72) {
    const out = headR * (1.0 + (flick - 0.72) * 1.6);
    ctx.beginPath();
    ctx.moveTo(headR * 0.7, 0);
    ctx.lineTo(out, 0);
    ctx.moveTo(out, 0);
    ctx.lineTo(out + headR * 0.3, -headR * 0.2);
    ctx.moveTo(out, 0);
    ctx.lineTo(out + headR * 0.3, headR * 0.2);
    ctx.lineWidth = Math.max(1.6, headR * 0.11);
    ctx.lineCap = 'round';
    ctx.strokeStyle = SNAKE_COLORS.tongue;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.ellipse(0, 0, headR * 1.1, headR * 0.97, 0, 0, TAU);
  ctx.fillStyle = SNAKE_COLORS.body;
  ctx.fill();

  // brow — one shade darker, gives the face somewhere to sit
  ctx.beginPath();
  ctx.ellipse(-headR * 0.34, 0, headR * 0.62, headR * 0.9, 0, 0, TAU);
  ctx.fillStyle = SNAKE_COLORS.band;
  ctx.globalAlpha = 0.45;
  ctx.fill();
  ctx.globalAlpha = 1;

  // a wide, friendly smile
  ctx.beginPath();
  ctx.arc(headR * 0.34, headR * 0.06, headR * 0.42, 0.25, Math.PI - 0.25);
  ctx.lineWidth = Math.max(1.5, headR * 0.1);
  ctx.lineCap = 'round';
  ctx.strokeStyle = SNAKE_COLORS.outline;
  ctx.stroke();

  for (const side of [-1, 1]) {
    const ex = headR * 0.36;
    const ey = side * headR * 0.52;
    ctx.beginPath();
    ctx.arc(ex, ey, headR * 0.31, 0, TAU);
    ctx.fillStyle = SNAKE_COLORS.eye;
    ctx.fill();
    ctx.lineWidth = Math.max(1, headR * 0.07);
    ctx.strokeStyle = 'rgba(58, 54, 48, 0.25)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ex + headR * 0.1, ey, headR * 0.155, 0, TAU);
    ctx.fillStyle = SNAKE_COLORS.pupil;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex + headR * 0.05, ey - headR * 0.09, headR * 0.06, 0, TAU);
    ctx.fillStyle = SNAKE_COLORS.eye;
    ctx.fill();
  }

  ctx.restore();
}

function drawSparkles(ctx, S, now) {
  for (const s of S.sparkles) {
    const t = (now - s.born) / s.life;
    if (t >= 1) continue;
    const fade = 1 - t;
    const x = s.x + s.vx * t * s.life * 0.001;
    const y = s.y + s.vy * t * s.life * 0.001 + 40 * t * t * s.gravity;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x, y);
    ctx.rotate(s.spin * t);
    drawStar(ctx, 0, 0, s.size * (0.6 + fade * 0.6), s.size * 0.42, 5, -Math.PI / 2);
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Where the finger is: a soft ring plus a dotted lead from the head, so the
 * control explains itself the first time a child puts a thumb down.
 */
function drawAim(ctx, S, now) {
  if (!S.pointerActive) return;
  const { pointer, head, headR } = S;
  const dx = pointer.x - head.x;
  const dy = pointer.y - head.y;
  const dist = Math.hypot(dx, dy);

  if (dist > headR * 2) {
    ctx.save();
    ctx.setLineDash([headR * 0.32, headR * 0.55]);
    ctx.lineDashOffset = -now / 26;
    ctx.beginPath();
    ctx.moveTo(head.x + (dx / dist) * headR * 1.3, head.y + (dy / dist) * headR * 1.3);
    ctx.lineTo(pointer.x - (dx / dist) * headR * 1.2, pointer.y - (dy / dist) * headR * 1.2);
    ctx.lineWidth = Math.max(1.5, headR * 0.12);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(58, 54, 48, 0.22)';
    ctx.stroke();
    ctx.restore();
  }

  const pulse = 1 + Math.sin(now / 220) * 0.09;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, headR * 1.05 * pulse, 0, TAU);
  ctx.lineWidth = Math.max(2, headR * 0.15);
  ctx.strokeStyle = 'rgba(143, 169, 138, 0.55)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, headR * 0.24, 0, TAU);
  ctx.fillStyle = 'rgba(143, 169, 138, 0.75)';
  ctx.fill();
}

/** The whole play layer, in draw order */
export function drawScene(ctx, S, view, now) {
  ctx.clearRect(0, 0, view.w, view.h);
  for (const f of S.fruits) drawFruit(ctx, f, now);
  drawSnake(ctx, S, now);
  drawSparkles(ctx, S, now);
  drawAim(ctx, S, now);
}

/** A burst of little stars — the one bit of juice the game leans on */
export function burst(S, x, y, count, colors, now, spread = 170, size = 7) {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * TAU + Math.random() * 0.6;
    const v = spread * (0.45 + Math.random() * 0.75);
    S.sparkles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      born: now,
      life: 520 + Math.random() * 320,
      color: colors[i % colors.length],
      size: size * (0.6 + Math.random() * 0.7),
      spin: (Math.random() - 0.5) * 6,
      gravity: 0.6 + Math.random() * 0.8,
    });
  }
  if (S.sparkles.length > 160) S.sparkles.splice(0, S.sparkles.length - 160);
}

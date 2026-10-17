/**
 * Turns supplied character artwork into game-ready sprites.
 *
 *   node scripts/prepare-character-sprites.mjs [sourceDir]
 *
 * For each character it will:
 *   1. read the source image (any format sharp supports)
 *   2. if the image has no usable alpha, knock out the background by
 *      flood-filling inward from the border — this only removes background
 *      that is actually connected to the edge, so same-coloured areas inside
 *      the character (Spidey's white eyes, Zola's screen) survive
 *   3. trim the transparent margin
 *   4. scale to a uniform height and write a PNG into public/assets/characters/
 *
 * Finally it writes a contact sheet so the results can be eyeballed at a glance.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = process.argv[2] ?? 'assets/character-sources';
const OUT_DIR = 'public/assets/characters';
const SHEET = 'character-sheet.png';

/** Sprite id -> accepted source filename stems (case-insensitive, any extension). */
const CHARACTERS = [
  { id: 'spidey', stems: ['spidey', 'spider-man', 'spiderman', 'peter'] },
  { id: 'ghost-spider', stems: ['ghost-spider', 'ghostspider', 'ghost_spider', 'gwen'] },
  { id: 'spin', stems: ['spin', 'miles'] },
  // shot inside a white picture-frame mockup — needs to cross the frame's grey rule
  { id: 'rhino', stems: ['rhino'], whiteKey: 210 },
  // Supplied source is a still from the show with the full set behind her, so
  // there is no flat backdrop to key. Needs a cut-out or plain-background shot.
  { id: 'ock', stems: ['ock', 'doc-ock', 'docock', 'octopus', 'olivia'], skip: 'scene background' },
  { id: 'goblin', stems: ['goblin', 'green-goblin', 'greengoblin', 'gobby'] },
  // Same problem: a party scene with other characters in frame.
  { id: 'zola', stems: ['zola'], skip: 'scene background' },
];

/** Sprites are stored at this height; the game scales them down from here. */
const TARGET_H = 460;
/** How close to the border colour a pixel must be to count as background. */
const TOLERANCE = 38;

const dist2 = (r1, g1, b1, r2, g2, b2) =>
  (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;

/**
 * Drops disconnected islands of opaque pixels, keeping the character.
 *
 * Sources cut from a group image carry slivers of their neighbours, and a
 * partly-removed backdrop can leave a solid slab behind. Both of those touch
 * the image border; a genuinely detached part of the subject (an outstretched
 * hand, a thrown pumpkin) sits inside the frame. So a blob is dropped when it
 * is either tiny, or touches the border while not being the main subject.
 */
function keepMainSubject(data, w, h, keepRatio = 0.12) {
  const n = w * h;
  const solid = new Uint8Array(n);
  for (let p = 0; p < n; p += 1) solid[p] = data[p * 4 + 3] > 32 ? 1 : 0;

  const label = new Int32Array(n).fill(-1);
  const sizes = [];
  const touchesBorder = [];
  const spansCanvas = [];
  const queue = new Int32Array(n);

  for (let start = 0; start < n; start += 1) {
    if (!solid[start] || label[start] !== -1) continue;
    const id = sizes.length;
    let head = 0;
    let tail = 0;
    queue[tail] = start;
    tail += 1;
    label[start] = id;
    let count = 0;
    let border = false;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;

    while (head < tail) {
      const p = queue[head];
      head += 1;
      count += 1;
      const x = p % w;
      const y = (p / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (!solid[q] || label[q] !== -1) continue;
          label[q] = id;
          queue[tail] = q;
          tail += 1;
        }
      }
    }
    sizes.push(count);
    touchesBorder.push(border);
    // a mockup frame is a thin outline whose bounding box spans the canvas
    spansCanvas.push((maxX - minX) > w * 0.72 && (maxY - minY) > h * 0.72);
  }

  if (sizes.length <= 1) return { dropped: 0, blobs: sizes.length };

  const biggest = Math.max(...sizes);
  const mainId = sizes.indexOf(biggest);
  const cutoff = biggest * keepRatio;
  let dropped = 0;
  for (let p = 0; p < n; p += 1) {
    const id = label[p];
    if (id < 0 || id === mainId) continue;
    if (sizes[id] < cutoff || touchesBorder[id] || spansCanvas[id]) {
      data[p * 4 + 3] = 0;
      dropped += 1;
    }
  }
  return { dropped, blobs: sizes.length };
}

/**
 * Removes the background by flood-filling from every border pixel.
 * Returns a new RGBA buffer with background alpha zeroed and a 1px feather.
 */
function knockOutBackground(data, w, h, tol) {
  const n = w * h;
  const idx = (x, y) => (y * w + x) * 4;

  // reference colour = median-ish sample of the four corners
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ].map(([x, y]) => {
    const i = idx(x, y);
    return [data[i], data[i + 1], data[i + 2]];
  });
  const ref = [0, 1, 2].map((c) => {
    const vals = corners.map((p) => p[c]).sort((a, b) => a - b);
    return Math.round((vals[1] + vals[2]) / 2);
  });

  const tol2 = tol * tol;
  // A gradient backdrop drifts far from the corner colour, so a pixel also
  // counts as background when it closely matches the neighbour it spread from.
  const stepTol2 = 10 * 10;
  const bg = new Uint8Array(n); // 1 = background
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;

  const push = (x, y, from) => {
    const p = y * w + x;
    if (bg[p]) return;
    const i = p * 4;
    const nearRef =
      dist2(data[i], data[i + 1], data[i + 2], ref[0], ref[1], ref[2]) <= tol2;
    let nearNeighbour = false;
    if (!nearRef && from >= 0) {
      const j = from * 4;
      nearNeighbour =
        dist2(data[i], data[i + 1], data[i + 2], data[j], data[j + 1], data[j + 2]) <=
        stepTol2;
    }
    if (!nearRef && !nearNeighbour) return;
    bg[p] = 1;
    queue[tail] = p;
    tail += 1;
  };

  for (let x = 0; x < w; x += 1) {
    push(x, 0, -1);
    push(x, h - 1, -1);
  }
  for (let y = 0; y < h; y += 1) {
    push(0, y, -1);
    push(w - 1, y, -1);
  }

  while (head < tail) {
    const p = queue[head];
    head += 1;
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) push(x - 1, y, p);
    if (x < w - 1) push(x + 1, y, p);
    if (y > 0) push(x, y - 1, p);
    if (y < h - 1) push(x, y + 1, p);
  }

  // zero the background, then soften pixels that border it so edges aren't jagged
  for (let p = 0; p < n; p += 1) {
    if (bg[p]) data[p * 4 + 3] = 0;
  }
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const p = y * w + x;
      if (bg[p]) continue;
      const neighbours =
        bg[p - 1] + bg[p + 1] + bg[p - w] + bg[p + w];
      if (neighbours > 0) {
        const i = p * 4;
        data[i + 3] = Math.min(data[i + 3], 255 - neighbours * 46);
      }
    }
  }
  return { removed: bg.reduce((a, b) => a + b, 0), total: n };
}

/**
 * Straight luminance key for a plain white studio backdrop.
 *
 * Flood filling struggles when the shot sits inside a picture-frame mockup:
 * the frame's soft drop shadow forms a barrier the fill will not cross, so the
 * inner white panel survives. Keying every near-white neutral pixel outright
 * sidesteps that. Only safe when the subject itself has no blown-out whites,
 * so it is opt-in per character.
 */
function whiteKey(data, w, h, threshold) {
  const n = w * h;
  let removed = 0;
  for (let p = 0; p < n; p += 1) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    // bright and close to neutral grey
    if (min >= threshold && max - min <= 14) {
      data[i + 3] = 0;
      removed += 1;
    }
  }
  return { removed, total: n };
}

/**
 * Removes leftover opaque backdrop in an image that already has alpha.
 *
 * Seeds at every opaque pixel sitting on the image border and spreads only
 * through neighbours of near-identical colour, so a smooth backdrop gradient
 * is followed to its end while a character's high-contrast outline stops it.
 * If the flood would swallow more than `maxShare` of the opaque pixels it is
 * treated as having escaped into the subject, and nothing is changed.
 */
function knockOutBorderRegions(data, w, h, stepTol = 12, maxShare = 0.4) {
  const n = w * h;
  const opaque = new Uint8Array(n);
  let opaqueCount = 0;
  for (let p = 0; p < n; p += 1) {
    if (data[p * 4 + 3] > 32) {
      opaque[p] = 1;
      opaqueCount += 1;
    }
  }
  if (opaqueCount === 0) return { removed: 0, skipped: true };

  const stepTol2 = stepTol * stepTol;
  const bg = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;

  const push = (x, y, from) => {
    const p = y * w + x;
    if (bg[p] || !opaque[p]) return;
    if (from >= 0) {
      const i = p * 4;
      const j = from * 4;
      if (
        dist2(data[i], data[i + 1], data[i + 2], data[j], data[j + 1], data[j + 2]) >
        stepTol2
      ) {
        return;
      }
    }
    bg[p] = 1;
    queue[tail] = p;
    tail += 1;
  };

  for (let x = 0; x < w; x += 1) {
    push(x, 0, -1);
    push(x, h - 1, -1);
  }
  for (let y = 0; y < h; y += 1) {
    push(0, y, -1);
    push(w - 1, y, -1);
  }

  while (head < tail) {
    const p = queue[head];
    head += 1;
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) push(x - 1, y, p);
    if (x < w - 1) push(x + 1, y, p);
    if (y > 0) push(x, y - 1, p);
    if (y < h - 1) push(x, y + 1, p);
  }

  let removed = 0;
  for (let p = 0; p < n; p += 1) if (bg[p]) removed += 1;

  if (removed / opaqueCount > maxShare) {
    return { removed: 0, skipped: true, wouldHaveRemoved: removed };
  }

  for (let p = 0; p < n; p += 1) {
    if (bg[p]) data[p * 4 + 3] = 0;
  }
  return { removed, skipped: false };
}

/** True when the image already carries meaningful transparency. */
async function hasUsableAlpha(img) {
  const meta = await img.metadata();
  if (!meta.hasAlpha) return false;
  const { data, info } = await img
    .clone()
    .resize(64, 64, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 16) transparent += 1;
  }
  return transparent / (info.width * info.height) > 0.04;
}

async function findSource(files, stems) {
  for (const stem of stems) {
    const hit = files.find((f) => {
      const base = path.basename(f, path.extname(f)).toLowerCase().replace(/[\s_]+/g, '-');
      return base === stem || base.startsWith(`${stem}-`) || base.includes(stem);
    });
    if (hit) return hit;
  }
  return null;
}

async function main() {
  let files = [];
  try {
    files = (await fs.readdir(SRC_DIR)).filter((f) =>
      /\.(png|jpe?g|webp|gif|avif|tiff?)$/i.test(f),
    );
  } catch {
    console.error(`\nNo source folder at "${SRC_DIR}".`);
    console.error('Create it and drop one image per character inside, named after');
    console.error('the character, e.g. spidey.png, ghost-spider.png, rhino.jpg\n');
    process.exitCode = 1;
    return;
  }

  if (files.length === 0) {
    console.error(`"${SRC_DIR}" has no images in it.`);
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const done = [];
  const missing = [];
  const skipped = [];

  for (const ch of CHARACTERS) {
    const file = await findSource(files, ch.stems);
    if (!file) {
      missing.push(ch.id);
      continue;
    }
    if (ch.skip) {
      skipped.push({ id: ch.id, file, why: ch.skip });
      continue;
    }

    const srcPath = path.join(SRC_DIR, file);
    const alphaOk = await hasUsableAlpha(sharp(srcPath));

    const { data, info } = await sharp(srcPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const notes = [];
    if (ch.whiteKey) {
      const stats = whiteKey(data, info.width, info.height, ch.whiteKey);
      notes.push(`white-keyed ${((stats.removed / stats.total) * 100).toFixed(1)}%`);
    } else if (alphaOk) {
      notes.push('kept alpha');
    } else {
      const stats = knockOutBackground(data, info.width, info.height, ch.tol ?? TOLERANCE);
      notes.push(`keyed bg ${((stats.removed / stats.total) * 100).toFixed(1)}%`);
    }

    // an image can have alpha and still keep a slab of opaque backdrop
    if (alphaOk) {
      const edge = knockOutBorderRegions(data, info.width, info.height);
      if (edge.removed > 0) notes.push('trimmed opaque backdrop');
      else if (edge.wouldHaveRemoved) notes.push('backdrop flood escaped, skipped');
    }

    // runs either way — sources cut from a group image carry neighbour slivers
    const clean = keepMainSubject(data, info.width, info.height);
    if (clean.dropped > 0) {
      notes.push(`dropped ${clean.blobs - 1} stray blob(s)`);
    }

    const img = sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    });
    const note = notes.join(', ');
    const outPath = path.join(OUT_DIR, `${ch.id}.png`);
    const out = await img
      .trim({ threshold: 1 })
      .resize({ height: TARGET_H, fit: 'inside', withoutEnlargement: false })
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    done.push({ id: ch.id, file, w: out.width, h: out.height, note });
    console.log(
      `  ${ch.id.padEnd(14)} <- ${file.padEnd(28)} ${out.width}x${out.height}  ${note}`,
    );
  }

  if (done.length === 0) {
    console.error('\nNo character images matched. Expected names like:');
    for (const c of CHARACTERS) console.error(`  ${c.id}.png  (also accepts: ${c.stems.join(', ')})`);
    process.exitCode = 1;
    return;
  }

  // contact sheet for a quick visual check
  const thumbW = 220;
  const thumbH = 260;
  const cellW = thumbW + 20;
  const cellH = thumbH + 20;
  const cols = Math.min(4, done.length);
  const rows = Math.ceil(done.length / cols);
  const composites = await Promise.all(
    done.map(async (d, i) => {
      // fit inside the cell in BOTH axes — sprites can be wider than they are tall
      const buf = await sharp(path.join(OUT_DIR, `${d.id}.png`))
        .resize({ width: thumbW, height: thumbH, fit: 'inside' })
        .toBuffer();
      const { width, height } = await sharp(buf).metadata();
      return {
        input: buf,
        left: (i % cols) * cellW + 20 + Math.round((thumbW - width) / 2),
        top: Math.floor(i / cols) * cellH + 20 + Math.round((thumbH - height) / 2),
      };
    }),
  );
  await sharp({
    create: {
      width: cols * cellW + 40,
      height: rows * cellH + 40,
      channels: 4,
      background: { r: 43, g: 47, b: 94, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(SHEET);

  // manifest so the game can size each sprite without measuring at runtime
  const manifest = Object.fromEntries(
    done.map((d) => [d.id, { w: d.w, h: d.h, src: `/assets/characters/${d.id}.png` }]),
  );
  await fs.writeFile(
    'src/games/webSling/sprites.json',
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  console.log('  manifest:      src/games/webSling/sprites.json');

  console.log(`\n  ${done.length}/${CHARACTERS.length} sprites written to ${OUT_DIR}/`);
  if (missing.length) console.log(`  still missing: ${missing.join(", ")}`);
  for (const s of skipped) {
    console.log(`  SKIPPED ${s.id} (${s.file}) — ${s.why}; needs a cut-out or plain-background source`);
  }
  console.log(`  contact sheet: ${SHEET}\n`);
}

main();

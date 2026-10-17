import PictureSvg from './PictureSvg';
import { PICTURES, getPicture } from './pictures';
import { TOP_RESERVE } from './colorConfig';

const GAP = 12;
const TITLE_H = 40;
const GALLERY_H = 88;

/** Picture picker: thumbnails grid plus the strip of finished drawings. */
export default function Picker({ width, height, gallery, difficulty, onPick }) {
  const landscape = width > height;
  const cols = landscape ? 3 : 2;
  const rows = Math.ceil(PICTURES.length / cols);
  const galleryH = gallery.length ? GALLERY_H : 0;
  const cell = Math.max(
    80,
    Math.min(
      220,
      Math.floor((width - 32 - GAP * (cols - 1)) / cols),
      Math.floor((height - TOP_RESERVE - TITLE_H - galleryH - 16 - GAP * rows) / rows),
    ),
  );
  const art = cell - 20;

  return (
    <div
      data-testid="picker"
      className="absolute inset-0 flex flex-col items-center"
      style={{ paddingTop: TOP_RESERVE - 36, gap: GAP }}
    >
      <div
        style={{
          height: TITLE_H, fontFamily: 'Varela Round, Rubik, sans-serif', fontSize: 26,
          color: 'var(--dor-ink, #3B332E)', display: 'flex', alignItems: 'center',
        }}
      >
        בחרו ציור 🎨
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: GAP }}>
        {PICTURES.map((p) => (
          <button
            key={p.id}
            type="button"
            data-picture={p.id}
            data-tap-target=""
            aria-label={p.title}
            onPointerDown={() => onPick(p.id)}
            onClick={(e) => { if (e.detail === 0) onPick(p.id); }}
            style={{
              width: cell, height: cell, padding: 10, borderRadius: 24, background: '#FFFDF8',
              border: '1px solid var(--dor-border)', boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
              cursor: 'pointer',
            }}
          >
            <PictureSvg picture={p} difficulty={difficulty} fills={{}} size={art} />
          </button>
        ))}
      </div>
      {gallery.length > 0 && (
        <div data-testid="gallery" style={{ height: galleryH, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--game-accent)', marginBottom: 4 }}>הציורים שלי</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {gallery.map((g, i) => (
              <div
                key={`${g.pictureId}-${i}`}
                data-gallery-item={g.pictureId}
                style={{
                  background: '#FFFDF8', borderRadius: 12, border: '1px solid var(--dor-border)', padding: 2,
                }}
              >
                <PictureSvg picture={getPicture(g.pictureId)} difficulty={g.difficulty} fills={g.fills} size={52} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

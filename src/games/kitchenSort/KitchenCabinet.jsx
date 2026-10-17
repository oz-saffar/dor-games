import { alpha, INK, PAPER_LIGHT, shade } from '../../lib/palette';
import { DOORS_MS } from './kitchenSortConfig';
import { ShelfLabelPicture } from './KitchenItems';

const WOOD = '#C9A678';

/**
 * The cabinet carcass, its shelves (each with a picture label) and the two doors
 * that swing shut at the end. Items are drawn by the game on top of this.
 */
export default function KitchenCabinet({ geom, shelves, defs, hoverIdx, armed, doorsClosed, reduce, onShelfTap }) {
  const { cab } = geom;
  const doorTransition = reduce ? 'none' : `width ${DOORS_MS}ms cubic-bezier(.3,1.4,.5,1)`;
  const door = (side) => (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', top: 0, bottom: 0, [side]: 0,
        width: doorsClosed ? '50%' : 0, overflow: 'hidden',
        background: shade(WOOD, 0.06), transition: doorTransition,
        borderLeft: side === 'right' ? `3px solid ${alpha(INK, 0.25)}` : 'none',
        borderRight: side === 'left' ? `3px solid ${alpha(INK, 0.25)}` : 'none',
        boxShadow: doorsClosed ? `inset 0 0 0 6px ${alpha(PAPER_LIGHT, 0.18)}` : 'none',
        borderRadius: 14, zIndex: 30,
      }}
    >
      <span
        style={{
          position: 'absolute', top: '50%', [side === 'left' ? 'right' : 'left']: 12,
          width: 10, height: 44, marginTop: -22, borderRadius: 6, background: shade(WOOD, 0.45),
        }}
      />
    </div>
  );

  return (
    <>
      <div
        style={{
          position: 'absolute', left: cab.x, top: cab.y, width: cab.w, height: cab.h,
          borderRadius: 20, background: WOOD, border: `3px solid ${shade(WOOD, 0.3)}`,
          boxShadow: `0 4px 0 var(--dor-lip, ${alpha(INK, 0.2)}), inset 0 0 0 4px ${alpha(PAPER_LIGHT, 0.2)}`,
        }}
      />
      {shelves.map((rect, i) => {
        const shelf = defs[i];
        const hot = hoverIdx === i;
        return (
          <div
            key={shelf.id}
            data-shelf={shelf.id}
            data-tap-target
            role="button"
            tabIndex={0}
            aria-label={shelf.name}
            onPointerDown={() => onShelfTap(i)}
            style={{
              position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              borderRadius: 14, background: hot ? alpha(PAPER_LIGHT, 0.92) : alpha(PAPER_LIGHT, 0.72),
              border: `3px solid ${hot || armed ? 'var(--game-accent)' : alpha(INK, 0.16)}`,
              boxShadow: `inset 0 -8px 0 ${alpha(WOOD, 0.55)}, inset 0 5px 10px ${alpha(INK, 0.1)}`,
              touchAction: 'none', transition: reduce ? 'none' : 'background 140ms, border-color 140ms',
            }}
          >
            <div
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: rect.labelW,
                display: 'grid', placeItems: 'center',
                borderRight: `2px dashed ${alpha(INK, 0.14)}`,
              }}
            >
              <ShelfLabelPicture shelf={shelf} size={Math.min(rect.labelW, rect.h) * 0.82} />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute', left: cab.x, top: cab.y, width: cab.w, height: cab.h,
          pointerEvents: 'none', zIndex: 30,
        }}
      >
        {door('left')}
        {door('right')}
      </div>
    </>
  );
}

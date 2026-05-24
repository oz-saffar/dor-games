import { MUNCH_IMAGE_ALT, MUNCH_IMAGE_SRC } from './munchImageAssets';

/**
 * Single draggable munch item — real photo, cropped in a soft tile.
 */
export default function MunchItemPhoto({ kind }) {
  const src = MUNCH_IMAGE_SRC[kind] ?? MUNCH_IMAGE_SRC.donut;
  const alt = MUNCH_IMAGE_ALT[kind] ?? 'פריט';

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-[0_10px_28px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] ring-2 ring-amber-900/10"
      style={{ aspectRatio: '1' }}
    >
      <img
        src={src}
        alt={alt}
        width={256}
        height={256}
        className="h-full w-full object-cover"
        draggable={false}
        decoding="async"
        loading="eager"
      />
    </div>
  );
}

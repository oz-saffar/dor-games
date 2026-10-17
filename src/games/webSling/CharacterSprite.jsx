import Villain from './Villains';
import { spriteFor, DRAWN_H } from './spriteUtils';

/**
 * A character at `height` px tall, horizontally centred with its feet on y=0.
 * Falls back to the hand-drawn SVG for anyone without a cut-out sprite yet.
 */
const CharacterSprite = ({ id, height, flip = false }) => {
  const sprite = spriteFor(id);

  if (!sprite) {
    const k = height / DRAWN_H;
    return (
      <g transform={`scale(${flip ? -k : k}, ${k})`}>
        <Villain id={id} angry />
      </g>
    );
  }

  const w = height * (sprite.w / sprite.h);
  return (
    <g transform={flip ? 'scale(-1, 1)' : undefined}>
      <image
        href={sprite.src}
        x={-w / 2}
        y={-height}
        width={w}
        height={height}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
};

export default CharacterSprite;

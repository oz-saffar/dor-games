import { motion } from 'framer-motion';
import { SWATCHES } from './colorConfig';

/** Big round crayon swatches; the selected one is lifted. */
export default function Palette({ layout, selected, onSelect, reduce }) {
  const { swatch, gap, landscape } = layout;
  const cols = landscape ? 2 : 5;
  return (
    <div
      data-testid="palette"
      dir="ltr"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${swatch}px)`,
        gap,
        padding: gap,
        paddingTop: gap + 10,
        justifyContent: 'center',
      }}
    >
      {SWATCHES.map(({ name, hex }) => {
        const on = selected === name;
        return (
          <motion.button
            key={name}
            type="button"
            data-swatch={name}
            data-tap-target=""
            aria-label={name}
            aria-pressed={on}
            animate={{ y: on && !reduce ? -10 : 0, scale: on && !reduce ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onPointerDown={() => onSelect(name)}
            onClick={(e) => { if (e.detail === 0) onSelect(name); }}
            style={{
              width: swatch,
              height: swatch,
              borderRadius: '50%',
              background: hex,
              border: on ? '4px solid var(--game-accent)' : '2px solid var(--dor-border)',
              boxShadow: on ? 'var(--dor-shadow-card), 0 4px 0 var(--dor-lip)' : '0 3px 0 var(--dor-lip)',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        );
      })}
    </div>
  );
}

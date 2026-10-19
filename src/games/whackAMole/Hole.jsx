import { motion } from 'framer-motion';
import { MoleArt, BunnyArt } from './Mole';
import { ACCENTS } from '../../lib/palette';

/**
 * One hole. The critter slides up inside a clip that ends at the hole's
 * centre line; a dirt lip is drawn over its feet. The whole cell is the
 * (generous) hit area.
 */
const Hole = ({ index, size, critter, reduce, onTap }) => {
  const up = Boolean(critter);
  const clipH = size * 0.74;
  const art = Math.round(size * 0.72);
  const dirt = ACCENTS.sand;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div
        data-hole={index}
        style={{
          position: 'absolute', left: '8%', width: '84%', bottom: '6%', height: '30%',
          borderRadius: '50%', background: '#4a3a2c',
          boxShadow: 'inset 0 6px 0 rgba(0,0,0,0.3)',
        }}
      />
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: '100%', height: clipH,
          overflow: 'hidden', pointerEvents: 'none',
        }}
      >
        <motion.div
          initial={false}
          animate={{ y: up ? 0 : '105%', rotate: critter?.tickled && !reduce ? [0, -6, 6, -4, 0] : 0 }}
          transition={reduce ? { duration: 0 } : { duration: critter?.tickled ? 0.5 : 0.22, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: (size - art) / 2, bottom: 0, width: art, height: art,
          }}
        >
          {critter?.kind === 'bunny'
            ? <BunnyArt waving={critter.wave} />
            : <MoleArt tickled={Boolean(critter?.tickled)} hat={critter?.hat} />}
        </motion.div>
      </div>
      <div
        style={{
          position: 'absolute', left: '4%', width: '92%', bottom: '2%', height: '26%',
          borderRadius: '50%', background: dirt, pointerEvents: 'none',
          clipPath: 'inset(45% 0 0 0)', boxShadow: '0 3px 0 var(--dor-lip)',
        }}
      />
      <button
        type="button"
        data-tap-target
        data-mole={up ? 'up' : 'down'}
        data-critter={critter?.kind}
        data-tickled={critter?.tickled ? 'true' : undefined}
        aria-label={up ? (critter.kind === 'bunny' ? 'ארנב' : 'חפרפרת') : 'חור'}
        onPointerDown={(e) => { e.preventDefault?.(); onTap(index); }}
        onClick={(e) => { if (e.detail === 0) onTap(index); }}
        style={{
          position: 'absolute', inset: 0, background: 'transparent', border: 'none',
          padding: 0, cursor: 'pointer', touchAction: 'none', WebkitTapHighlightColor: 'transparent',
        }}
      />
    </div>
  );
};

export default Hole;

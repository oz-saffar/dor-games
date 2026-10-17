import { PIECES } from './ticTacToeConfig';

/** Two huge buttons: Dor chooses which piece to play. A plain group, like רשת!'s hero picker — not a second dialog stacked on the instructions. */
const Picker = ({ onPick, size }) => (
  <div
    role="group"
    aria-label="בוחרים שחקן"
    style={{
      position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: 'color-mix(in srgb, var(--game-surface) 92%, transparent)',
    }}
  >
    <div style={{ fontFamily: "'Varela Round', 'Rubik', sans-serif", fontSize: 'clamp(26px, 6vw, 40px)', color: 'var(--dor-ink, #3a3630)' }}>
      מי אתה היום?
    </div>
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
      {Object.entries(PIECES).map(([key, p]) => (
        <button
          key={key}
          type="button"
          data-piece={key}
          data-tap-target
          aria-label={p.label}
          onPointerDown={() => onPick(key)}
          onClick={(e) => { if (e.detail === 0) onPick(key); }}
          className="dor-lip"
          style={{
            width: size, height: size, borderRadius: 28, fontSize: size * 0.58, lineHeight: 1,
            background: 'var(--dor-surface, #fffdf8)', border: '2px solid var(--game-accent)',
            boxShadow: '0 4px 0 var(--dor-lip)', cursor: 'pointer', touchAction: 'none',
          }}
        >
          {p.dor}
        </button>
      ))}
    </div>
  </div>
);

export default Picker;

import { memo } from 'react';
import PicnicKid from './PicnicKid';
import PicnicScene from './PicnicScene';
import { PoofBurst } from './Effects';

/**
 * The picnic cluster: blanket, food and the three kids.
 *
 * The parent keys this component so a fresh group runs in from the right after every catch.
 * The inner wrapper carries the "scoot away laughing" reaction so it never fights with the
 * run-in animation on the outer element.
 */
function PicnicGroupBase({
  phase,
  kidCount,
  kidState,
  kidSize,
  warningMs,
  turnKey,
  burstKey,
  picnicW,
  kidH,
  blanketLift,
  bottomPct,
  reduced = false,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        right: '2%',
        bottom: `${bottomPct}%`,
        width: picnicW,
        height: kidH + blanketLift,
        zIndex: 12,
        animation: reduced ? 'none' : 'dsRunIn 0.8s cubic-bezier(.25,1.3,.5,1) both',
      }}
    >
      <div className="ds-picnic" data-phase={phase} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
          <PicnicScene width={picnicW} reduced={reduced} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: blanketLift,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
          }}
        >
          {Array.from({ length: kidCount }, (_, i) => (
            <div key={i} style={{ transform: `translateY(${i === 1 ? -8 : 0}px)`, zIndex: i === 1 ? 1 : 2 }}>
              <PicnicKid
                variant={i}
                state={kidState(i)}
                turnMs={warningMs}
                turnKey={turnKey}
                size={kidSize}
                idleDelay={i * 0.45}
                reduced={reduced}
              />
            </div>
          ))}
        </div>

        {/* comic poof — every kid bounces off in a puff of stars and hearts */}
        {phase === 'chomp' &&
          Array.from({ length: kidCount }, (_, i) => (
            <PoofBurst
              key={`${burstKey}-${i}`}
              x={picnicW * (1 / 6 + i / 3)}
              y={blanketLift + kidH * 0.45}
              scale={kidSize + 0.2}
            />
          ))}
      </div>

      <style>{`
        @keyframes dsRunIn {
          0%   { transform: translateX(130%) scale(.9);  opacity: 0; }
          70%  { transform: translateX(-8px) scale(1.02); opacity: 1; }
          100% { transform: translateX(0) scale(1);       opacity: 1; }
        }
        @keyframes dsScoot {
          0%   { transform: translate(0, 0); }
          16%  { transform: translate(15px, -11px); }
          32%  { transform: translate(25px, 0); }
          48%  { transform: translate(30px, -7px); }
          64%  { transform: translate(30px, 0); }
          100% { transform: translate(0, 0); }
        }
        .ds-picnic[data-phase="busted"] { animation: dsScoot 1.6s cubic-bezier(.3,1.1,.5,1) both; }
      `}</style>
    </div>
  );
}

export default memo(PicnicGroupBase);

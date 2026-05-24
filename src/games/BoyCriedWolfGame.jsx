import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useIsLandscape } from '../hooks/useOrientation';
import {
  GameBackButton,
  GameInstructionsOverlay,
} from '../components/game';
import { PrimaryButton } from '../components/ui/PrimaryButton';

const ACCENT = '#b45309';
const ACCENT_SOFT = '#f59e0b';

const INITIAL_TRUST = 3;

/**
 * סיפור אינטראקטיבי — הילד שצעק זאב (איזופוס)
 * לקח: יושר, אמון, והשלכות של שקרים חוזרים
 */
export default function BoyCriedWolfGame({ onExit, soundManager }) {
  const isLandscape = useIsLandscape();
  const reduce = useReducedMotion();
  const [showInstructions, setShowInstructions] = useState(true);
  const [trust, setTrust] = useState(INITIAL_TRUST);
  const [phase, setPhase] = useState('day1');
  const [day1Honest, setDay1Honest] = useState(null);
  const [day2Honest, setDay2Honest] = useState(null);

  const resetRun = useCallback(() => {
    setTrust(INITIAL_TRUST);
    setPhase('day1');
    setDay1Honest(null);
    setDay2Honest(null);
    setShowInstructions(false);
  }, []);

  const trustHearts = () =>
    Array.from({ length: INITIAL_TRUST }, (_, i) => (
      <span key={i} className="text-2xl" aria-hidden>
        {i < trust ? '💚' : '🖤'}
      </span>
    ));

  const handleDayChoice = (day, honest) => {
    if (day === 1) setDay1Honest(honest);
    if (day === 2) setDay2Honest(honest);
    if (!honest) {
      setTrust((t) => Math.max(0, t - 1));
      soundManager?.playEncouragement();
    } else {
      soundManager?.playCorrect();
    }
    setPhase(day === 1 ? 'day1Outcome' : 'day2Outcome');
  };

  const goDay3 = () => {
    setPhase('day3');
  };

  const finishStory = () => {
    setPhase('lesson');
    if (trust >= 3) soundManager?.playWin();
    else if (trust === 2) soundManager?.playSuccess();
    else soundManager?.playEncouragement();
  };

  const outcomeDay1Honest =
    'הילד נשאר עם הכבשים בשקט. תושבי הכפר סמכו עליו — רמת האמון גבוהה.';
  const outcomeDay1Lie =
    'הכפר רץ לעזור… אין זאב! התושבים הרגישו שבזבזו את זמנם והאמון ירד.';
  const outcomeDay2Honest = 'שוב שמר הילד בכנות. הכפר מעריך את הרצינות שלו.';
  const outcomeDay2Lie =
    'שוב רצו אליו — ושוב אין זאב. הפעם התושבים כבר כעסו והאמון ירד עוד.';

  const lessonCore =
    'כשמשקרים שוב ושוב, לפעמים לא מאמינים גם כשאומרים את האמת. כדאי לדבר אמת כדי לשמור על אמון — בבית, בגן ובחברים.';

  const panelClass =
    'w-full max-w-lg rounded-[calc(var(--dor-radius-xl)-2px)] bg-dor-panel-elevated/95 px-6 py-6 text-right shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-white/40 backdrop-blur-sm';

  return (
    <div
      className="fixed inset-0 z-[1] flex flex-col items-center overflow-auto"
      style={{
        minHeight: '-webkit-fill-available',
        background:
          'linear-gradient(165deg, #0f172a 0%, #1e3a2f 28%, #3f6212 55%, #ca8a04 88%, #fef3c7 100%)',
      }}
    >
      <GameBackButton onExit={onExit} />

      {!showInstructions && (
        <div
          className="mt-[calc(52px+env(safe-area-inset-top))] mb-2 flex w-full max-w-lg flex-wrap items-center justify-center gap-2 px-4"
          role="status"
          aria-live="polite"
        >
          <span className="font-display text-lg font-semibold text-amber-100">אמון הכפר</span>
          <div className="flex gap-1 rounded-full bg-black/25 px-3 py-1">{trustHearts()}</div>
        </div>
      )}

      <div
        className={`flex flex-1 flex-col items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${isLandscape ? 'pt-1' : 'pt-2'}`}
      >
        {showInstructions && (
          <GameInstructionsOverlay
            title="הילד שצעק זאב 🐺"
            buttonText="נתחיל את הסיפור 🐑"
            onStart={() => setShowInstructions(false)}
            accentColor={ACCENT}
          >
            <p>
              <strong>סיפור לבחירות:</strong> תעזרו לרועה הילד להחליט מה לעשות בכל יום.
            </p>
            <p>כשמשקרים בשביל בדיחה, האמון של אחרים יורד.</p>
            <p>בסוף תגלו מה קורה כשמגיע זאב אמיתי…</p>
          </GameInstructionsOverlay>
        )}

        {!showInstructions && (
          <motion.div
            key={phase}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.35 }}
            className={panelClass}
          >
            {phase === 'day1' && (
              <>
                <p className="mb-1 font-display text-2xl text-dor-ink" style={{ color: '#fef9c3' }}>
                  יום ראשון ☀️
                </p>
                <p className="mb-6 text-base leading-relaxed text-amber-50">
                  הילד רועה את הכבשים בגבעה. הוא משועמם ורוצה שכל הכפר ישים לב אליו. מה הוא עושה?
                </p>
                <div className="flex flex-col gap-3">
                  <PrimaryButton
                    type="button"
                    onClick={() => handleDayChoice(1, false)}
                    className="w-full !border-amber-200/40 !bg-gradient-to-b from-amber-400 to-amber-700 !text-stone-900 !shadow-[0_3px_0_#78350f]"
                    style={{ backgroundColor: ACCENT_SOFT }}
                  >
                    צועק בבדיחה: &quot;זאב! זאב!&quot;
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={() => handleDayChoice(1, true)}
                    className="w-full !border-emerald-300/50 !bg-gradient-to-b from-emerald-500 to-emerald-800 !shadow-[0_3px_0_#14532d]"
                  >
                    נשאר לשמור בשקט ובכנות
                  </PrimaryButton>
                </div>
              </>
            )}

            {phase === 'day1Outcome' && (
              <>
                <p className="mb-4 text-base leading-relaxed text-amber-50">
                  {day1Honest ? outcomeDay1Honest : outcomeDay1Lie}
                </p>
                <PrimaryButton
                  type="button"
                  onClick={() => setPhase('day2')}
                  className="w-full"
                  style={{ backgroundColor: ACCENT }}
                >
                  המשך ליום השני
                </PrimaryButton>
              </>
            )}

            {phase === 'day2' && (
              <>
                <p className="mb-1 font-display text-2xl" style={{ color: '#fef9c3' }}>
                  יום שני 🌤️
                </p>
                <p className="mb-6 text-base leading-relaxed text-amber-50">
                  שוב בשדה עם הכבשים. מה הילד בוחר היום?
                </p>
                <div className="flex flex-col gap-3">
                  <PrimaryButton
                    type="button"
                    onClick={() => handleDayChoice(2, false)}
                    className="w-full !border-amber-200/40 !bg-gradient-to-b from-amber-400 to-amber-700 !text-stone-900"
                    style={{ backgroundColor: ACCENT_SOFT }}
                  >
                    שוב צועק: &quot;זאב! זאב!&quot; (בדיחה)
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={() => handleDayChoice(2, true)}
                    className="w-full !border-emerald-300/50 !bg-gradient-to-b from-emerald-500 to-emerald-800"
                  >
                    משמר בשקט — רק אמת
                  </PrimaryButton>
                </div>
              </>
            )}

            {phase === 'day2Outcome' && (
              <>
                <p className="mb-4 text-base leading-relaxed text-amber-50">
                  {day2Honest ? outcomeDay2Honest : outcomeDay2Lie}
                </p>
                <p className="mb-4 text-sm text-amber-200/90">
                  {trust === INITIAL_TRUST
                    ? 'שני ימים של כנות — הכפר סומך עליו.'
                    : trust === 2
                      ? 'היה יום אחד של צעקה לא אמיתית — עדיין יש סיכוי שיאמינו.'
                      : 'היו שתי פעמים של צעקות שווא — קשה להחזיר אמון.'}
                </p>
                <PrimaryButton type="button" onClick={goDay3} className="w-full" style={{ backgroundColor: ACCENT }}>
                  ליום השלישי — משהו משתנה…
                </PrimaryButton>
              </>
            )}

            {phase === 'day3' && (
              <>
                <p className="mb-1 font-display text-2xl" style={{ color: '#fecaca' }}>
                  יום שלישי 🐺
                </p>
                <p className="mb-6 text-base leading-relaxed text-amber-50">
                  לפתע מופיע זאב אמיתי! הילד צועק בכל כוחו: &quot;זאב! זאב!&quot; — מה יעשו תושבי הכפר?
                </p>
                <PrimaryButton type="button" onClick={finishStory} className="w-full" style={{ backgroundColor: '#b91c1c' }}>
                  לראות מה קרה
                </PrimaryButton>
              </>
            )}

            {phase === 'lesson' && (
              <>
                <p className="mb-3 font-display text-xl text-amber-100">סוף הסיפור</p>
                {trust >= 3 && (
                  <p className="mb-4 text-base leading-relaxed text-emerald-100">
                    הכפר האמין לו בזמן — רצו ועזרו. הכבשים ניצלו בזכות האמון שנשמר.
                  </p>
                )}
                {trust === 2 && (
                  <p className="mb-4 text-base leading-relaxed text-amber-100">
                    חלק מהאנשים התלבטו… הגיעו מאוחר מדי. זה קורה כשכבר פעם אחת &quot;שיחקו&quot; עם האמת.
                  </p>
                )}
                {trust <= 1 && (
                  <p className="mb-4 text-base leading-relaxed text-rose-100">
                    אף אחד לא רץ לעזור — חשבו שזו שוב בדיחה. הילד למד בדרך הקשה כמה חשובה כנות.
                  </p>
                )}
                <div
                  className="mb-6 rounded-dor-lg border border-amber-400/30 bg-stone-900/40 p-4 text-sm leading-relaxed text-amber-50"
                  role="region"
                  aria-label="מסר מהסיפור"
                >
                  <strong className="text-amber-200">הלקח:</strong> {lessonCore}
                </div>
                <div className="flex flex-col gap-3">
                  <PrimaryButton type="button" onClick={resetRun} className="w-full" style={{ backgroundColor: ACCENT }}>
                    לשחק שוב מאותה התחלה
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={onExit}
                    className="min-h-[48px] rounded-dor-lg border-2 border-white/30 bg-white/10 px-6 py-3 font-sans text-base font-bold text-amber-50"
                  >
                    חזרה לתפריט
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

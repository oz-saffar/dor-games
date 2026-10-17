import { SCORE_BADGE_CONTENT, SAFE_INSET } from '../../lib/designTokens';

/**
 * Score / label badge — fixed top-left in RTL.
 * Pass either `icon` (emoji/string) or `iconSrc` + optional `iconAlt` for a small image.
 */
export default function GameScoreBadge({ icon, iconSrc, iconAlt, score, label, accentColor }) {
  const color = accentColor || 'var(--game-accent)';
  const content =
    label != null ? (
      label
    ) : iconSrc ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <img
          src={iconSrc}
          alt={iconAlt ?? ''}
          width={26}
          height={26}
          decoding="async"
          style={{ objectFit: 'contain', flexShrink: 0 }}
        />
        <span>{score}</span>
      </span>
    ) : (
      `${icon ?? ''} ${score}`
    );

  return (
    <div
      className="fixed z-chrome"
      style={{
        top: SAFE_INSET,
        left: '12px',
        ...SCORE_BADGE_CONTENT,
        color: 'var(--dor-ink)',
        borderInlineStart: `4px solid ${color}`,
      }}
    >
      {content}
    </div>
  );
}

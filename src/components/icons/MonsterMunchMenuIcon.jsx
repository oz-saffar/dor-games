import { useId } from 'react';

/**
 * Hub / settings tile — matches Monster Munch art direction (no emoji).
 */
export default function MonsterMunchMenuIcon({ size = 44, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const gidBody = `mmMenuBody-${uid}`;
  const gidBelly = `mmMenuBelly-${uid}`;
  const gidEye = `mmMenuEye-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={gidBody} cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#c4a8ff" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        <linearGradient id={gidBelly} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e9ff" />
          <stop offset="100%" stopColor="#ddd6fe" />
        </linearGradient>
        <linearGradient id={gidEye} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e0ff" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="22" ry="5" fill="#1e1b4b" opacity="0.18" />
      <path
        d="M12 38c0-14 8-24 20-26s24 6 28 18c2 6 3 12 2 18-2 10-10 16-22 16-14 0-28-10-28-26z"
        fill={`url(#${gidBody})`}
        stroke="#4c1d95"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <ellipse cx="32" cy="40" rx="14" ry="11" fill={`url(#${gidBelly})`} opacity="0.95" />
      <ellipse cx="22" cy="24" rx="9" ry="10" fill={`url(#${gidEye})`} stroke="#6d28d9" strokeWidth="1" />
      <ellipse cx="42" cy="24" rx="9" ry="10" fill={`url(#${gidEye})`} stroke="#6d28d9" strokeWidth="1" />
      <ellipse cx="22" cy="25" rx="4.5" ry="5" fill="#312e81" />
      <ellipse cx="42" cy="25" rx="4.5" ry="5" fill="#312e81" />
      <ellipse cx="23" cy="23" rx="1.6" ry="1.8" fill="#fff" opacity="0.9" />
      <ellipse cx="43" cy="23" rx="1.6" ry="1.8" fill="#fff" opacity="0.9" />
      <ellipse cx="16" cy="30" rx="4" ry="3" fill="#fda4af" opacity="0.65" />
      <ellipse cx="48" cy="30" rx="4" ry="3" fill="#fda4af" opacity="0.65" />
      <path
        d="M22 34q10 8 20 0"
        fill="none"
        stroke="#4c1d95"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M24 36h16v5c-4 6-12 6-16 0v-5z"
        fill="#1e1b4b"
        opacity="0.35"
      />
      <path
        d="M22 34h20v3c-2 5-6 8-10 8s-8-3-10-8v-3z"
        fill="#7c3aed"
        stroke="#4c1d95"
        strokeWidth="0.9"
      />
      <path d="M26 34v3M32 34v3M38 34v3" stroke="#e9d5ff" strokeWidth="1.1" opacity="0.5" />
    </svg>
  );
}

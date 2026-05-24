/**
 * Small paper-doll style figure for drag-target icons (no photos).
 */
export default function PersonPuppet({ variant = 'coral', scale = 1 }) {
  const s = scale;
  const shirts = {
    coral: { body: 'linear-gradient(180deg,#fb7185,#e11d48)', legs: ['#1e3a8a', '#1e40af'] },
    teal: { body: 'linear-gradient(180deg,#2dd4bf,#0d9488)', legs: ['#44403c', '#57534e'] },
    amber: { body: 'linear-gradient(180deg,#fbbf24,#d97706)', legs: ['#14532d', '#166534'] },
    violet: { body: 'linear-gradient(180deg,#a78bfa,#6d28d9)', legs: ['#0c4a6e', '#075985'] },
    sky: { body: 'linear-gradient(180deg,#38bdf8,#0284c7)', legs: ['#7c2d12', '#9a3412'] },
  };
  const { body, legs } = shirts[variant] ?? shirts.coral;

  return (
    <div className="flex flex-col items-center select-none" style={{ width: 40 * s }} aria-hidden>
      <div
        style={{
          width: 12 * s,
          height: 12 * s,
          borderRadius: '50%',
          background: '#fcd3a4',
          marginBottom: -2 * s,
          boxShadow: `inset 0 -${2 * s}px 0 rgba(0,0,0,0.08), 0 ${1 * s}px 0 rgba(0,0,0,0.12)`,
        }}
      />
      <div
        style={{
          width: 18 * s,
          height: 20 * s,
          borderRadius: `${4 * s}px`,
          background: body,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 ${2 * s}px ${5 * s}px rgba(0,0,0,0.22)`,
        }}
      />
      <div className="flex gap-[3px]" style={{ marginTop: -1 * s }}>
        <div
          style={{
            width: 7 * s,
            height: 9 * s,
            borderRadius: `0 0 ${3 * s}px ${3 * s}px`,
            background: legs[0],
          }}
        />
        <div
          style={{
            width: 7 * s,
            height: 9 * s,
            borderRadius: `0 0 ${3 * s}px ${3 * s}px`,
            background: legs[1],
          }}
        />
      </div>
    </div>
  );
}

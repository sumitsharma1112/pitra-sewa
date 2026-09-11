/**
 * Hero illustration: a lit brass diya resting in an arched wall niche (आला)
 * under a marigold garland — the place a lamp is kept in many Indian homes.
 * Original vector artwork, so there is no photo-licensing question.
 * The flame's gentle movement is the only ambient animation on the page and
 * stops for visitors who prefer reduced motion.
 */

// Marigold positions along the garland's curve (quadratic Bézier), computed once.
const garland = (() => {
  const p0 = { x: 74, y: 170 };
  const p1 = { x: 180, y: 246 };
  const p2 = { x: 286, y: 170 };
  const count = 13;
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
      warm: i % 2 === 0,
    };
  });
})();

const strand = [0, 1, 2, 3].map((i) => 188 + i * 17);

function Marigold({ x, y, r = 8, warm = true }: { x: number; y: number; r?: number; warm?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={warm ? "#D9822B" : "#E3A537"} />
      <circle cx={x} cy={y} r={r * 0.62} fill={warm ? "#E89A3C" : "#EDB94E"} />
      <circle cx={x} cy={y} r={r * 0.28} fill="#A9551C" />
    </g>
  );
}

export function DiyaNiche({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 420"
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="niche-light" cx="50%" cy="78%" r="75%">
          <stop offset="0%" stopColor="#8E3B2C" />
          <stop offset="42%" stopColor="#651F2B" />
          <stop offset="100%" stopColor="#3B1019" />
        </radialGradient>
        <clipPath id="niche-clip">
          <path d="M54 384V202c0-78 60-132 126-164 66 32 126 86 126 164v182Z" />
        </clipPath>
        <radialGradient id="flame-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4B860" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#E9A04A" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#E9A04A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer frame of the niche */}
      <path
        d="M36 384V198C36 112 104 52 180 16c76 36 144 96 144 182v186"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="2"
      />
      {/* Niche interior, lit from the diya */}
      <path d="M54 384V202c0-78 60-132 126-164 66 32 126 86 126 164v182Z" fill="url(#niche-light)" />
      <path
        d="M54 384V202c0-78 60-132 126-164 66 32 126 86 126 164v182"
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.55"
        strokeWidth="1.25"
      />

      {/* Glow */}
      <circle className="diya-glow" cx="180" cy="318" r="120" fill="url(#flame-glow)" clipPath="url(#niche-clip)" />

      {/* Marigold garland (toran) and hanging strands */}
      <path
        d="M74 170Q180 246 286 170"
        fill="none"
        stroke="#5A3B14"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      {strand.map((y) => (
        <Marigold key={`l${y}`} x={74} y={y} r={7} warm={y % 2 === 0} />
      ))}
      {strand.map((y) => (
        <Marigold key={`r${y}`} x={286} y={y} r={7} warm={y % 2 !== 0} />
      ))}
      {garland.map((m, i) => (
        <Marigold key={i} x={m.x} y={m.y} warm={m.warm} />
      ))}

      {/* Sill */}
      <rect x="24" y="384" width="312" height="14" rx="3" fill="var(--color-sand)" stroke="var(--color-gold)" strokeWidth="1.5" />
      <rect x="40" y="398" width="280" height="6" rx="2" fill="var(--color-line)" />

      {/* Flowers on the sill */}
      <Marigold x={96} y={374} r={9} />
      <Marigold x={114} y={378} r={6.5} warm={false} />
      <Marigold x={264} y={374} r={9} warm={false} />
      <Marigold x={246} y={378} r={6.5} />

      {/* Brass diya */}
      <path d="M136 350h88c-4 18-21 30-44 30s-40-12-44-30Z" fill="var(--color-gold)" />
      <path d="M136 350h88c-.6 2.6-1.4 5-2.6 7.2H138.6c-1.2-2.2-2-4.6-2.6-7.2Z" fill="#9A7438" />
      <ellipse cx="180" cy="350" rx="44" ry="5.5" fill="#6E4F22" />
      <path d="M180 382c-9 0-16 2-20 4h40c-4-2-11-4-20-4Z" fill="#9A7438" />

      {/* Flame */}
      <g className="diya-flame">
        <path d="M180 278c11 16 18 29 18 42 0 14-8 24-18 24s-18-10-18-24c0-13 7-26 18-42Z" fill="#E7962F" />
        <path d="M180 300c6 10 9 17 9 24 0 8-4 13-9 13s-9-5-9-13c0-7 3-14 9-24Z" fill="#FBE3AE" />
      </g>
      <rect x="178.8" y="340" width="2.4" height="9" rx="1.2" fill="#3B2A1A" />
    </svg>
  );
}

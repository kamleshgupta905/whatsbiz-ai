interface WbLogoProps {
  size?: number;
  className?: string;
}

export function WbLogo({ size = 40, className = "" }: WbLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Background — vivid emerald to deep teal */}
        <linearGradient id="wbg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#34d399" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        {/* Bolt — warm gold so it pops on white at every size */}
        <linearGradient id="wbolt" x1="90" y1="34" x2="90" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        {/* Subtle drop-shadow on bubble */}
        <filter id="bshadow" x="-8%" y="-4%" width="116%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Rounded background */}
      <rect width="180" height="180" rx="44" fill="url(#wbg)" />

      {/* Top gloss highlight */}
      <ellipse cx="90" cy="12" rx="60" ry="22" fill="white" opacity="0.14" />

      {/* Chat bubble */}
      <path
        d="M 26 44 Q 26 22 48 22 L 132 22 Q 154 22 154 44 L 154 108 Q 154 130 132 130 L 102 130 L 90 154 L 78 130 L 48 130 Q 26 130 26 108 Z"
        fill="white"
        filter="url(#bshadow)"
      />

      {/* Lightning bolt — gold, centered, fat enough to read at 28px */}
      <path
        d="M 100 36 L 68 90 H 93 L 74 126 L 116 72 H 89 Z"
        fill="url(#wbolt)"
      />
    </svg>
  );
}

export function WbLogoInverse({ size = 40, className = "" }: WbLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="wbolt-inv" x1="90" y1="34" x2="90" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Frosted panel */}
      <rect width="180" height="180" rx="44" fill="white" opacity="0.16" />

      {/* Top gloss */}
      <ellipse cx="90" cy="12" rx="60" ry="22" fill="white" opacity="0.18" />

      {/* Chat bubble */}
      <path
        d="M 26 44 Q 26 22 48 22 L 132 22 Q 154 22 154 44 L 154 108 Q 154 130 132 130 L 102 130 L 90 154 L 78 130 L 48 130 Q 26 130 26 108 Z"
        fill="white"
        opacity="0.94"
      />

      {/* Same gold bolt */}
      <path
        d="M 100 36 L 68 90 H 93 L 74 126 L 116 72 H 89 Z"
        fill="url(#wbolt-inv)"
      />
    </svg>
  );
}

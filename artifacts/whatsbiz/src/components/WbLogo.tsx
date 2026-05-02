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
        <linearGradient id="wbg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#25D366" />
          <stop offset="100%" stopColor="#075E54" />
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="40" fill="url(#wbg)" />
      <path
        d="M28 42 C28 32 36 24 46 24 L134 24 C144 24 152 32 152 42 L152 108 C152 118 144 126 134 126 L112 126 L90 154 L68 126 L46 126 C36 126 28 118 28 108 Z"
        fill="white"
        opacity="0.95"
      />
      <path d="M103 54 L79 92 H97 L77 130 L121 82 H100 Z" fill="#25D366" />
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
      <rect width="180" height="180" rx="40" fill="white" opacity="0.15" />
      <path
        d="M28 42 C28 32 36 24 46 24 L134 24 C144 24 152 32 152 42 L152 108 C152 118 144 126 134 126 L112 126 L90 154 L68 126 L46 126 C36 126 28 118 28 108 Z"
        fill="white"
        opacity="0.95"
      />
      <path d="M103 54 L79 92 H97 L77 130 L121 82 H100 Z" fill="#25D366" />
    </svg>
  );
}
